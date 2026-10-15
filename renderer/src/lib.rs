//! The portfolio's WebGPU world, compiled to WebAssembly.
//!
//! Everything three-dimensional lives here in Rust: the procedural meshes, the
//! four arrangements of glass pieces, the destruct/reconstruct transition, the
//! lighting and the projection of the world anchors the DOM pins its small
//! labels to.
//!
//! The front end owns the clock. Each frame it calls `set_deck(from, to, t)`
//! with the slide it is leaving, the slide it is arriving at, and how far
//! through the transition it is (0..1, and 1 at rest). The renderer is a pure
//! function of that state, so the page and the world can never drift apart.

mod gpu;
mod layout;
mod mesh;
mod slides;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use glam::Vec2;
use slides::{Stage, Viewport};

/// Number of floats published per anchor: x, y, fade, pixels-per-metre.
pub const ANCHOR_STRIDE: usize = 4;

struct App {
    renderer: gpu::Renderer,
    stage: Stage,
    time: f32,
    last_ms: f64,
    /// The slide being left and the slide being arrived at. Equal at rest.
    from: usize,
    to: usize,
    progress: f32,
    pointer: Vec2,
    pointer_target: Vec2,
    reduced: bool,
    debug: f32,
    paused: bool,
    stopped: bool,
    viewport: Viewport,
    dpr: f64,
    anchors: Option<js_sys::Float32Array>,
    on_frame: Option<js_sys::Function>,
}

impl App {
    /// Advance the simulation and render one frame. Called from the RAF tick.
    fn frame(&mut self, now_ms: f64) {
        let dt = if self.last_ms == 0.0 {
            1.0 / 60.0
        } else {
            ((now_ms - self.last_ms) / 1000.0).clamp(0.0, 0.05) as f32
        };
        self.last_ms = now_ms;

        if self.paused {
            return;
        }

        if !self.reduced {
            self.time += dt;
        }
        // The pointer eases, so the parallax feels like weight rather than a
        // cursor glued to the glass.
        let k = 1.0 - (-dt * 4.5).exp();
        self.pointer += (self.pointer_target - self.pointer) * k;

        let globals = self.stage.update(
            self.time,
            self.from,
            self.to,
            self.progress,
            self.pointer,
            self.reduced,
            &self.viewport,
            self.debug,
        );
        self.renderer
            .render(&globals, &self.stage.instances, &self.stage.groups);
    }

    /// Copy anchor projections into the JS-owned buffer.
    fn publish_anchors(&self) {
        if let Some(buffer) = &self.anchors {
            let mut flat = Vec::with_capacity(self.stage.anchors_out.len() * ANCHOR_STRIDE);
            for anchor in &self.stage.anchors_out {
                flat.extend_from_slice(anchor);
            }
            buffer.copy_from(&flat);
        }
    }
}

/// The live world. Dropping it (or calling `stop`) halts rendering.
#[wasm_bindgen]
pub struct World {
    app: Rc<RefCell<App>>,
    frame_cb: Rc<RefCell<Option<Closure<dyn FnMut(f64)>>>>,
}

#[wasm_bindgen]
impl World {
    /// Boot the renderer on `canvas`. `on_frame` is invoked once per rendered
    /// frame, after the anchor buffer has been updated.
    pub async fn new(
        canvas: web_sys::HtmlCanvasElement,
        on_frame: js_sys::Function,
    ) -> Result<World, JsValue> {
        console_error_panic_hook::set_once();

        let dpr = web_sys::window()
            .map(|w| w.device_pixel_ratio())
            .unwrap_or(1.0);
        let width = canvas.width().max(1);
        let height = canvas.height().max(1);

        let renderer = gpu::Renderer::new(canvas, width, height)
            .await
            .map_err(|e| JsValue::from_str(&e))?;

        let stage = Stage::new(layout::Plan::load());
        let mut renderer = renderer;
        renderer.upload_meshes(stage.meshes());

        let viewport = Viewport::new(width as f32 / dpr as f32, height as f32 / dpr as f32);

        let app = Rc::new(RefCell::new(App {
            renderer,
            stage,
            time: 0.0,
            last_ms: 0.0,
            from: 0,
            to: 0,
            progress: 1.0,
            pointer: Vec2::ZERO,
            pointer_target: Vec2::ZERO,
            reduced: prefers_reduced_motion(),
            debug: 0.0,
            paused: false,
            stopped: false,
            viewport,
            dpr,
            anchors: None,
            on_frame: Some(on_frame),
        }));

        Ok(World {
            app,
            frame_cb: Rc::new(RefCell::new(None)),
        })
    }

    /// Anchor identifiers, in the same order as the published float buffer.
    pub fn anchor_ids(&self) -> Vec<String> {
        self.app.borrow().stage.anchor_ids()
    }

    /// Suggested cap height in world metres for each anchor.
    pub fn anchor_sizes(&self) -> Vec<f32> {
        self.app.borrow().stage.anchor_sizes()
    }

    pub fn anchor_count(&self) -> usize {
        self.app.borrow().stage.anchor_count()
    }

    pub fn anchor_stride(&self) -> usize {
        ANCHOR_STRIDE
    }

    /// The four slide palettes, six floats each: `accent r, g, b` then
    /// `tint r, g, b`, in sRGB. The page reads the same table, so the document
    /// and the world can never disagree about a room's colour.
    pub fn palette(&self) -> Vec<f32> {
        let mut out = Vec::with_capacity(layout::SLIDES * 6);
        for slide in &layout::SLIDE_TABLE {
            out.extend_from_slice(&slide.accent);
            out.extend_from_slice(&slide.tint);
        }
        out
    }

    /// Hand over the Float32Array the renderer writes anchor projections into.
    pub fn set_anchor_buffer(&self, buffer: js_sys::Float32Array) {
        self.app.borrow_mut().anchors = Some(buffer);
    }

    /// The deck state: the slide being left, the slide being arrived at, and
    /// how far through the move we are. At rest, `from == to` and `t == 1`.
    pub fn set_deck(&self, from: usize, to: usize, progress: f64) {
        if let Ok(mut app) = self.app.try_borrow_mut() {
            app.from = from.min(layout::SLIDES - 1);
            app.to = to.min(layout::SLIDES - 1);
            app.progress = progress.clamp(0.0, 1.0) as f32;
        }
    }

    /// Viewport in CSS pixels plus the device pixel ratio.
    pub fn set_viewport(&self, width: f64, height: f64, dpr: f64) {
        let mut app = match self.app.try_borrow_mut() {
            Ok(app) => app,
            Err(_) => return,
        };
        app.dpr = if dpr > 0.0 { dpr } else { 1.0 };
        app.viewport = Viewport::new(width as f32, height as f32);
        let pixel_w = (width * app.dpr).round().max(1.0) as u32;
        let pixel_h = (height * app.dpr).round().max(1.0) as u32;
        app.renderer.resize(pixel_w, pixel_h);
    }

    /// Normalised pointer position, both axes in -1..=1 (origin at centre).
    pub fn set_pointer(&self, x: f64, y: f64) {
        if let Ok(mut app) = self.app.try_borrow_mut() {
            app.pointer_target = Vec2::new(x as f32, y as f32);
        }
    }

    /// Diagnostic output mode (0 = shaded).
    pub fn set_debug(&self, mode: f64) {
        if let Ok(mut app) = self.app.try_borrow_mut() {
            app.debug = mode as f32;
        }
    }

    pub fn set_reduced_motion(&self, reduced: bool) {
        if let Ok(mut app) = self.app.try_borrow_mut() {
            app.reduced = reduced;
        }
    }

    /// Suspend rendering while the tab is hidden.
    pub fn set_paused(&self, paused: bool) {
        if let Ok(mut app) = self.app.try_borrow_mut() {
            app.paused = paused;
            app.last_ms = 0.0;
        }
    }

    /// Start the render loop.
    pub fn start(&self) {
        let app = self.app.clone();
        let cell = self.frame_cb.clone();
        let slot = cell.clone();

        *cell.borrow_mut() = Some(Closure::wrap(Box::new(move |ts: f64| {
            let running = {
                let mut app_ref = match app.try_borrow_mut() {
                    Ok(a) => a,
                    Err(_) => return,
                };
                if app_ref.stopped {
                    false
                } else {
                    app_ref.frame(ts);
                    true
                }
            };

            if running {
                if let Ok(app_ref) = app.try_borrow() {
                    app_ref.publish_anchors();
                    if let Some(cb) = &app_ref.on_frame {
                        let _ = cb.call0(&JsValue::NULL);
                    }
                }
            }

            if let Some(window) = web_sys::window() {
                if let Ok(slot_ref) = slot.try_borrow() {
                    if let Some(closure) = slot_ref.as_ref() {
                        let _ = window.request_animation_frame(closure.as_ref().unchecked_ref());
                    }
                }
            }
        }) as Box<dyn FnMut(f64)>));

        if let Some(window) = web_sys::window() {
            if let Some(closure) = cell.borrow().as_ref() {
                let _ = window.request_animation_frame(closure.as_ref().unchecked_ref());
            }
        }
    }

    /// Stop the render loop and release GPU resources.
    pub fn stop(&self) {
        if let Ok(mut app) = self.app.try_borrow_mut() {
            app.stopped = true;
            app.on_frame = None;
        }
        *self.frame_cb.borrow_mut() = None;
    }

    /// Human-readable renderer identity, for the console and the footer.
    pub fn adapter(&self) -> String {
        let app = self.app.borrow();
        format!("{} · {}", app.renderer.adapter_name, app.renderer.backend)
    }

    pub fn sample_count(&self) -> u32 {
        self.app.borrow().renderer.sample_count()
    }

    pub fn instance_count(&self) -> usize {
        self.app.borrow().stage.instances.len()
    }

    pub fn draw_calls(&self) -> usize {
        self.app.borrow().stage.groups.len()
    }
}

fn prefers_reduced_motion() -> bool {
    web_sys::window()
        .and_then(|w| w.match_media("(prefers-reduced-motion: reduce)").ok().flatten())
        .map(|m| m.matches())
        .unwrap_or(false)
}
