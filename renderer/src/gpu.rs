//! WebGPU device, pipelines and frame rendering.
//!
//! One pass per frame, no shadow map and no sky: the canvas is transparent and
//! composites over the <video> behind it, so the background is the film and the
//! world is the glass in front of it.
//!
//!   1. solid pieces — the core and the rings, opaque, depth-writing
//!   2. glass plates — sorted back to front, blended, depth-testing
//!
//! Everything is instanced: three meshes are authored once, and every piece in
//! the world is one entry in the instance buffer, rewritten each frame.

use crate::mesh::{MeshData, Vertex};
use bytemuck::{Pod, Zeroable};
use glam::{Mat3, Mat4};
use wgpu::util::DeviceExt;

pub const MAX_INSTANCES: usize = 256;

/// How a mesh is shaded and drawn.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Kind {
    /// Opaque lit piece: writes depth so the glass behind it is occluded.
    Solid,
    /// Translucent glass plate: blended, sorted back to front on the CPU.
    Glass,
}

impl Kind {
    pub fn as_f32(self) -> f32 {
        match self {
            Kind::Solid => 0.0,
            Kind::Glass => 1.0,
        }
    }
}

/// Uniform block shared by every pipeline. Mirrors `Globals` in the shader.
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct Globals {
    pub view_proj: [[f32; 4]; 4],
    pub inv_view_proj: [[f32; 4]; 4],
    pub cam_pos: [f32; 4],
    pub cam_right: [f32; 4],
    pub cam_up: [f32; 4],
    pub key_dir: [f32; 4],
    /// rgb, intensity
    pub key_color: [f32; 4],
    pub fill_dir: [f32; 4],
    /// rgb, intensity
    pub fill_color: [f32; 4],
    /// rgb, intensity
    pub ambient: [f32; 4],
    /// rgb, glow strength of the current room
    pub accent: [f32; 4],
    /// rgb, exposure of the current room
    pub tint: [f32; 4],
    /// time, transition burst, debug mode, 1 = encode sRGB manually
    pub params: [f32; 4],
}

/// Per-instance data: model matrix, normal matrix, colour and flags.
///
/// The normal matrix is stored as three `vec4` columns so the instance stride
/// stays 16-byte aligned (mat3 has no padding of its own in WGSL vertex
/// attributes).
#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct Instance {
    pub model: [[f32; 4]; 4],
    pub normal: [[f32; 4]; 3],
    /// rgb = the piece's own colour, a = opacity.
    pub color: [f32; 4],
    /// kind, mid-flight energy (0..1), billboard size, per-piece seed
    pub params: [f32; 4],
}

impl Instance {
    pub fn new(model: Mat4, normal: Mat3, color: [f32; 4], params: [f32; 4]) -> Self {
        let m = model.to_cols_array_2d();
        let n = normal.to_cols_array_2d();
        Self {
            model: m,
            normal: [
                [n[0][0], n[0][1], n[0][2], 0.0],
                [n[1][0], n[1][1], n[1][2], 0.0],
                [n[2][0], n[2][1], n[2][2], 0.0],
            ],
            color,
            params,
        }
    }

    /// Instance stream (locations 4-12): model matrix, normal matrix, colour,
    /// and per-instance flags.
    pub const fn layout() -> wgpu::VertexBufferLayout<'static> {
        const ATTRS: [wgpu::VertexAttribute; 9] = wgpu::vertex_attr_array!(
            4 => Float32x4,
            5 => Float32x4,
            6 => Float32x4,
            7 => Float32x4,
            8 => Float32x4,
            9 => Float32x4,
            10 => Float32x4,
            11 => Float32x4,
            12 => Float32x4,
        );
        wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<Instance>() as wgpu::BufferAddress,
            step_mode: wgpu::VertexStepMode::Instance,
            attributes: &ATTRS,
        }
    }
}

/// A contiguous run of instances that share one mesh and one pipeline.
#[derive(Clone, Copy)]
pub struct Group {
    pub mesh: usize,
    pub kind: Kind,
    pub first: u32,
    pub count: u32,
}

struct MeshGpu {
    vertices: wgpu::Buffer,
    indices: wgpu::Buffer,
    index_count: u32,
}

const DEPTH_FORMAT: wgpu::TextureFormat = wgpu::TextureFormat::Depth32Float;

pub struct Renderer {
    surface: wgpu::Surface<'static>,
    device: wgpu::Device,
    queue: wgpu::Queue,
    config: wgpu::SurfaceConfiguration,
    sample_count: u32,
    /// True when the surface is a linear format and the shader must encode
    /// sRGB itself.
    shader_encodes_srgb: bool,

    msaa_view: Option<wgpu::TextureView>,
    depth_view: wgpu::TextureView,

    pipe_solid: wgpu::RenderPipeline,
    pipe_glass: wgpu::RenderPipeline,

    globals_buf: wgpu::Buffer,
    globals_bg: wgpu::BindGroup,

    meshes: Vec<MeshGpu>,
    instance_buf: wgpu::Buffer,

    pub adapter_name: String,
    pub backend: String,
}

impl Renderer {
    pub async fn new(
        canvas: web_sys::HtmlCanvasElement,
        width: u32,
        height: u32,
    ) -> Result<Self, String> {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle());
        let surface = instance
            .create_surface(wgpu::SurfaceTarget::Canvas(canvas))
            .map_err(|e| format!("could not create a WebGPU surface: {e}"))?;

        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: Some(&surface),
                ..Default::default()
            })
            .await
            .map_err(|e| format!("no suitable GPU adapter: {e}"))?;

        let info = adapter.get_info();
        let adapter_name = if info.name.is_empty() {
            "WebGPU adapter".to_string()
        } else {
            info.name.clone()
        };
        let backend = format!("{:?}", info.backend);

        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor {
                label: Some("world-device"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::downlevel_defaults()
                    .using_resolution(adapter.limits()),
                experimental_features: wgpu::ExperimentalFeatures::disabled(),
                memory_hints: wgpu::MemoryHints::default(),
                trace: wgpu::Trace::Off,
            })
            .await
            .map_err(|e| format!("could not create a GPU device: {e}"))?;

        let caps = surface.get_capabilities(&adapter);

        // A linear colour target: the shading is authored for it, and the
        // shader does the sRGB encode once, itself. Blending then happens in
        // display space, which is what keeps stacked glass from going milky.
        let format = caps
            .formats
            .iter()
            .copied()
            .find(|f| !f.is_srgb())
            .or_else(|| caps.formats.first().copied())
            .ok_or_else(|| "the surface reports no colour formats".to_string())?;
        let shader_encodes_srgb = !format.is_srgb();

        // The canvas composites over the page's film, so it has to be
        // transparent where nothing is drawn. wgpu's web backend reports a
        // capability list that only ever contains `Opaque`, but the browser
        // accepts a premultiplied canvas — and the shader writes premultiplied
        // colour — so this is set outright rather than chosen from the list.
        let alpha_mode = wgpu::CompositeAlphaMode::PreMultiplied;

        let sample_count = if adapter
            .get_texture_format_features(format)
            .flags
            .sample_count_supported(4)
        {
            4
        } else {
            1
        };

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format,
            color_space: wgpu::SurfaceColorSpace::Auto,
            width: width.max(1),
            height: height.max(1),
            present_mode: wgpu::PresentMode::AutoVsync,
            desired_maximum_frame_latency: 2,
            alpha_mode,
            view_formats: vec![],
        };
        surface.configure(&device, &config);

        // ------------------------------------------------------------- bindings
        let globals_buf = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("globals"),
            size: std::mem::size_of::<Globals>() as u64,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        let globals_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("globals-layout"),
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::VERTEX_FRAGMENT,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            }],
        });

        let globals_bg = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("globals-bg"),
            layout: &globals_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: globals_buf.as_entire_binding(),
            }],
        });

        // ------------------------------------------------------------ pipelines
        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("glass.wgsl"),
            source: wgpu::ShaderSource::Wgsl(include_str!("shaders/glass.wgsl").into()),
        });

        let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("scene-layout"),
            bind_group_layouts: &[Some(&globals_layout)],
            immediate_size: 0,
        });

        let vertex_buffers = [Some(Vertex::layout()), Some(Instance::layout())];

        let opaque_target = [Some(wgpu::ColorTargetState {
            format,
            blend: None,
            write_mask: wgpu::ColorWrites::ALL,
        })];
        let blend_target = [Some(wgpu::ColorTargetState {
            format,
            // Premultiplied: the shader multiplies colour by alpha.
            blend: Some(wgpu::BlendState {
                color: wgpu::BlendComponent {
                    src_factor: wgpu::BlendFactor::One,
                    dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                    operation: wgpu::BlendOperation::Add,
                },
                alpha: wgpu::BlendComponent {
                    src_factor: wgpu::BlendFactor::One,
                    dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                    operation: wgpu::BlendOperation::Add,
                },
            }),
            write_mask: wgpu::ColorWrites::ALL,
        })];

        let msaa = wgpu::MultisampleState {
            count: sample_count,
            mask: !0,
            alpha_to_coverage_enabled: false,
        };

        let make = |label: &str,
                    entry: &str,
                    targets: &[Option<wgpu::ColorTargetState>],
                    depth_write: bool| {
            device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
                label: Some(label),
                layout: Some(&layout),
                vertex: wgpu::VertexState {
                    module: &shader,
                    entry_point: Some("vs_main"),
                    compilation_options: Default::default(),
                    buffers: &vertex_buffers,
                },
                primitive: wgpu::PrimitiveState {
                    topology: wgpu::PrimitiveTopology::TriangleList,
                    // The plates are single-sided in principle, but they tumble
                    // through the transition, so both faces are drawn.
                    cull_mode: None,
                    ..Default::default()
                },
                depth_stencil: Some(wgpu::DepthStencilState {
                    format: DEPTH_FORMAT,
                    depth_write_enabled: Some(depth_write),
                    depth_compare: Some(wgpu::CompareFunction::LessEqual),
                    stencil: Default::default(),
                    bias: Default::default(),
                }),
                multisample: msaa,
                fragment: Some(wgpu::FragmentState {
                    module: &shader,
                    entry_point: Some(entry),
                    compilation_options: Default::default(),
                    targets,
                }),
                multiview_mask: None,
                cache: None,
            })
        };

        let pipe_solid = make("solid", "fs_solid", &opaque_target, true);
        let pipe_glass = make("glass", "fs_glass", &blend_target, false);

        // -------------------------------------------------------------- targets
        let (depth_view, msaa_view) = create_targets(&device, &config, sample_count);

        let instance_buf = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("instances"),
            size: (MAX_INSTANCES * std::mem::size_of::<Instance>()) as u64,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        Ok(Self {
            surface,
            device,
            queue,
            config,
            sample_count,
            shader_encodes_srgb,
            msaa_view,
            depth_view,
            pipe_solid,
            pipe_glass,
            globals_buf,
            globals_bg,
            meshes: Vec::new(),
            instance_buf,
            adapter_name,
            backend,
        })
    }

    /// Upload the static meshes. Called once after construction.
    pub fn upload_meshes(&mut self, meshes: &[crate::layout::MeshPlan]) {
        self.meshes = meshes
            .iter()
            .map(|plan| {
                let MeshData { vertices, indices } = &plan.data;
                MeshGpu {
                    vertices: self
                        .device
                        .create_buffer_init(&wgpu::util::BufferInitDescriptor {
                            label: Some("mesh-vertices"),
                            contents: bytemuck::cast_slice(vertices),
                            usage: wgpu::BufferUsages::VERTEX,
                        }),
                    indices: self
                        .device
                        .create_buffer_init(&wgpu::util::BufferInitDescriptor {
                            label: Some("mesh-indices"),
                            contents: bytemuck::cast_slice(indices),
                            usage: wgpu::BufferUsages::INDEX,
                        }),
                    index_count: indices.len() as u32,
                }
            })
            .collect();
    }

    pub fn sample_count(&self) -> u32 {
        self.sample_count
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        let width = width.max(1);
        let height = height.max(1);
        if width == self.config.width && height == self.config.height {
            return;
        }
        self.config.width = width;
        self.config.height = height;
        self.surface.configure(&self.device, &self.config);
        let (depth, msaa) = create_targets(&self.device, &self.config, self.sample_count);
        self.depth_view = depth;
        self.msaa_view = msaa;
    }

    pub fn render(&mut self, globals: &Globals, instances: &[Instance], groups: &[Group]) {
        let frame = match self.surface.get_current_texture() {
            wgpu::CurrentSurfaceTexture::Success(tex)
            | wgpu::CurrentSurfaceTexture::Suboptimal(tex) => tex,
            wgpu::CurrentSurfaceTexture::Outdated | wgpu::CurrentSurfaceTexture::Lost => {
                self.surface.configure(&self.device, &self.config);
                return;
            }
            _ => return,
        };

        if !instances.is_empty() {
            self.queue
                .write_buffer(&self.instance_buf, 0, bytemuck::cast_slice(instances));
        }
        let mut globals = *globals;
        globals.params[3] = if self.shader_encodes_srgb { 1.0 } else { 0.0 };
        self.queue
            .write_buffer(&self.globals_buf, 0, bytemuck::bytes_of(&globals));

        let surface_view = frame
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());
        let (color_view, resolve_target) = match &self.msaa_view {
            Some(view) => (view, Some(&surface_view)),
            None => (&surface_view, None),
        };

        let mut encoder = self
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("world-encoder"),
            });

        {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("main-pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: color_view,
                    depth_slice: None,
                    resolve_target,
                    ops: wgpu::Operations {
                        // Transparent: the video behind the canvas shows.
                        load: wgpu::LoadOp::Clear(wgpu::Color {
                            r: 0.0,
                            g: 0.0,
                            b: 0.0,
                            a: 0.0,
                        }),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                    view: &self.depth_view,
                    depth_ops: Some(wgpu::Operations {
                        load: wgpu::LoadOp::Clear(1.0),
                        store: wgpu::StoreOp::Store,
                    }),
                    stencil_ops: None,
                }),
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });

            pass.set_bind_group(0, &self.globals_bg, &[]);
            pass.set_vertex_buffer(1, self.instance_buf.slice(..));

            for group in groups {
                let pipeline = match group.kind {
                    Kind::Solid => &self.pipe_solid,
                    Kind::Glass => &self.pipe_glass,
                };
                let mesh = &self.meshes[group.mesh];
                pass.set_pipeline(pipeline);
                pass.set_vertex_buffer(0, mesh.vertices.slice(..));
                pass.set_index_buffer(mesh.indices.slice(..), wgpu::IndexFormat::Uint32);
                pass.draw_indexed(
                    0..mesh.index_count,
                    0,
                    group.first..group.first + group.count,
                );
            }
        }

        self.queue.submit(Some(encoder.finish()));
        self.queue.present(frame);
    }
}

fn create_targets(
    device: &wgpu::Device,
    config: &wgpu::SurfaceConfiguration,
    sample_count: u32,
) -> (wgpu::TextureView, Option<wgpu::TextureView>) {
    let size = wgpu::Extent3d {
        width: config.width.max(1),
        height: config.height.max(1),
        depth_or_array_layers: 1,
    };

    let depth = device.create_texture(&wgpu::TextureDescriptor {
        label: Some("depth"),
        size,
        mip_level_count: 1,
        sample_count,
        dimension: wgpu::TextureDimension::D2,
        format: DEPTH_FORMAT,
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
        view_formats: &[],
    });

    let msaa = (sample_count > 1).then(|| {
        device
            .create_texture(&wgpu::TextureDescriptor {
                label: Some("msaa-color"),
                size,
                mip_level_count: 1,
                sample_count,
                dimension: wgpu::TextureDimension::D2,
                format: config.format,
                usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
                view_formats: &[],
            })
            .create_view(&wgpu::TextureViewDescriptor::default())
    });

    (
        depth.create_view(&wgpu::TextureViewDescriptor::default()),
        msaa,
    )
}
