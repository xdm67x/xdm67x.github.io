//! Slides: turning two arrangements and a progress value into GPU state.
//!
//! The whole transition is driven by three numbers the front end hands over
//! every frame: `from`, `to` and `t`. At rest `from == to` and `t == 1`. While
//! a slide change plays, `t` runs 0 → 1 and every piece in the world flies from
//! its pose in `from` to its pose in `to` — taken apart on the way out, put back
//! together on the way in:
//!
//!   * each piece starts on its own staggered delay, so the structure comes
//!     apart as a wave rather than as a single block
//!   * mid-flight every piece is torn outward along its own radial direction,
//!     stretched into a streak, and lit from the room's accent
//!   * the camera steps back while the world is open, then pushes in as the new
//!     arrangement clicks together
//!
//! Nothing here touches the DOM. The front end reads the same progress value
//! and plays its own version of the same motion on the page.

use crate::gpu::{Globals, Group, Instance, Kind};
use crate::layout::{self, Piece, Plan, CENTRE, PIECES, PLATES, SLIDES, SLIDE_TABLE};
use glam::camera::rh::{proj, view};
use glam::{Mat3, Mat4, Quat, Vec2, Vec3};
use std::f32::consts::PI;

/// How much of the transition is spent on stagger, at most. Short: this is a
/// cut, and the pieces should leave as a volley rather than as a drift.
const STAGGER: f32 = 0.24;
/// Where the impact lands, as a fraction of the transition: the flash, the
/// shockwave and the world's own burst all peak here.
const IMPACT: f32 = 0.45;

pub struct Viewport {
    /// CSS pixels, used for anchors.
    pub width: f32,
    pub height: f32,
    pub aspect: f32,
    /// True when the document puts its column of type beside the world.
    pub wide: bool,
}

impl Viewport {
    pub fn new(width: f32, height: f32) -> Self {
        let width = width.max(1.0);
        let height = height.max(1.0);
        let aspect = width / height;
        Self {
            width,
            height,
            aspect,
            wide: aspect > 1.06 && width >= 900.0,
        }
    }
}

/// Per piece constants, computed once: everything the transition needs that
/// does not change from frame to frame.
struct Motion {
    /// When this piece starts moving, in transition progress.
    delay: f32,
    /// How far it is thrown, in metres.
    amp: f32,
    /// The axis it tumbles around, and how far.
    axis: Vec3,
    spin: f32,
    /// The direction it is thrown in.
    dir: Vec3,
    /// Stable per piece value in 0..1, used for colour and opacity variation.
    seed: f32,
}

impl Motion {
    fn new(slot: usize, a: &Piece, b: &Piece) -> Self {
        let seed = layout::hash01(slot, 811);
        // A left-to-right sweep plus per piece scatter: the structure opens as
        // a wave, but never as a tidy row.
        let sweep = ((b.pos.x - CENTRE.x) / 2.4 + 0.5).clamp(0.0, 1.0);
        let delay = (0.55 * layout::hash01(slot, 907) + 0.45 * sweep) * STAGGER;

        // Thrown along the radial direction from the arrangement's centre,
        // rotated a little so the burst spirals instead of spraying.
        let mid = (a.pos + b.pos) * 0.5 - CENTRE;
        let radial = Vec3::new(mid.x, mid.y * 0.85, mid.z).normalize_or(Vec3::Z);
        let swirl = Quat::from_rotation_z(0.42);
        let dir = (swirl * radial) * 0.75 + Vec3::Z * 0.55;
        let dir = dir.normalize_or(Vec3::Z);

        let axis = Vec3::new(
            layout::hash_sym_f32(slot, 1009),
            layout::hash_sym_f32(slot, 1013),
            layout::hash_sym_f32(slot, 1019),
        )
        .normalize_or(Vec3::Y);

        Self {
            delay,
            amp: 0.70 + 2.10 * layout::hash01(slot, 1021),
            axis,
            spin: (layout::hash_sym_f32(slot, 1031)) * 4.2,
            dir,
            seed,
        }
    }
}

/// A virtual piece for the anchors: they ride the same burst as the plates so
/// the annotations come apart with the structure they annotate.
fn anchor_motion(slot: usize) -> Motion {
    let seed = layout::hash01(slot, 1201);
    Motion {
        delay: 0.10,
        amp: 0.45 + 0.7 * layout::hash01(slot, 1207),
        axis: Vec3::Z,
        spin: 0.5,
        dir: (Vec3::new(
            layout::hash_sym_f32(slot, 1213),
            layout::hash_sym_f32(slot, 1217),
            1.0,
        ))
        .normalize_or(Vec3::Z),
        seed,
    }
}

pub struct Stage {
    plan: Plan,
    /// Motion constants for every ordered pair of slides, flattened:
    /// `(from * SLIDES + to) * PIECES + slot`. A transition between two
    /// arrangements throws each piece along a direction that depends on both
    /// of them, so the character of a piece is keyed on the pair.
    motions: Vec<Motion>,
    anchors: Vec<Motion>,

    pub instances: Vec<Instance>,
    pub groups: Vec<Group>,
    /// x, y, fade, pixels-per-metre — one stride of four per anchor.
    pub anchors_out: Vec<[f32; 4]>,

    /// Per frame scratch, kept on the struct so a frame allocates nothing:
    /// every piece's pose, and the glass sort order.
    poses: Vec<Pose>,
    order: Vec<(f32, usize)>,
}

impl Stage {
    pub fn new(plan: Plan) -> Self {
        let mut motions = Vec::with_capacity(SLIDES * SLIDES * PIECES);
        for from in 0..SLIDES {
            for to in 0..SLIDES {
                let a = &plan.arrangements[from];
                let b = &plan.arrangements[to];
                for slot in 0..PIECES {
                    motions.push(Motion::new(slot, &a[slot], &b[slot]));
                }
            }
        }

        let anchors = (0..plan.anchors.len())
            .map(anchor_motion)
            .collect::<Vec<_>>();

        // The rig in full: one opaque group for the core, one for the rings,
        // then the whole field of glass as a single sorted draw.
        let groups = vec![
            Group {
                mesh: 0,
                kind: Kind::Solid,
                first: 0,
                count: 1,
            },
            Group {
                mesh: 1,
                kind: Kind::Solid,
                first: 1,
                count: layout::RINGS as u32,
            },
            Group {
                mesh: 2,
                kind: Kind::Glass,
                first: layout::FIRST_PLATE as u32,
                count: PLATES as u32,
            },
        ];

        let anchors_out = vec![[0.0; 4]; plan.anchors.len()];

        Self {
            plan,
            motions,
            anchors,
            instances: Vec::with_capacity(PIECES),
            groups,
            anchors_out,
            poses: Vec::with_capacity(PIECES),
            order: Vec::with_capacity(PLATES),
        }
    }

    pub fn meshes(&self) -> &[layout::MeshPlan] {
        &self.plan.meshes
    }

    pub fn anchor_ids(&self) -> Vec<String> {
        self.plan.anchors.iter().map(|a| a.id.clone()).collect()
    }

    pub fn anchor_sizes(&self) -> Vec<f32> {
        self.plan.anchors.iter().map(|a| a.size).collect()
    }

    pub fn anchor_count(&self) -> usize {
        self.plan.anchors.len()
    }

    /// Advance one frame and return the uniforms for it.
    #[allow(clippy::too_many_arguments)]
    pub fn update(
        &mut self,
        time: f32,
        from: usize,
        to: usize,
        progress: f32,
        pointer: Vec2,
        reduced: bool,
        viewport: &Viewport,
        debug: f32,
    ) -> Globals {
        let from = from.min(SLIDES - 1);
        let to = to.min(SLIDES - 1);
        let progress = progress.clamp(0.0, 1.0);
        let moving = from != to;
        // 0 while the old world holds, 1 once the new one has clicked together.
        let hand = if moving { smootherstep(progress) } else { 1.0 };
        // A fast rise and a slower decay, peaking where the impact lands.
        let burst = if moving {
            let d = ((progress - IMPACT).abs() / (1.0 - IMPACT)).min(1.0);
            (1.0 - d).powf(1.35)
        } else {
            0.0
        };

        let a = &SLIDE_TABLE[from];
        let b = &SLIDE_TABLE[to];
        let mood_tint = mix3(a.tint, b.tint, hand);
        let mood_accent = mix3(a.accent, b.accent, hand);
        let exposure = 1.05 + (b.tint.iter().sum::<f32>() - a.tint.iter().sum::<f32>()) * 0.6;

        let cam = camera(
            from,
            to,
            progress,
            burst,
            pointer,
            time,
            reduced,
            viewport.wide,
        );
        let view_matrix =
            Mat4::from_rotation_z(cam.roll) * view::look_at_mat4(cam.pos, cam.target, Vec3::Y);
        // glam's projection takes the vertical field of view in **radians**; the
        // slide table is authored in degrees, which is the friendlier unit.
        let projection =
            proj::directx::perspective(cam.fov.to_radians(), viewport.aspect, 0.06, 220.0);
        let view_proj = projection * view_matrix;

        let globals = Globals {
            view_proj: view_proj.to_cols_array_2d(),
            inv_view_proj: view_proj.inverse().to_cols_array_2d(),
            cam_pos: cam.pos.extend(1.0).to_array(),
            cam_right: view_matrix.row(0).truncate().extend(0.0).to_array(),
            cam_up: view_matrix.row(1).truncate().extend(0.0).to_array(),
            key_dir: KEY_DIR.extend(0.0).to_array(),
            key_color: [
                KEY_COLOR[0],
                KEY_COLOR[1],
                KEY_COLOR[2],
                0.62 + 1.15 * burst,
            ],
            fill_dir: FILL_DIR.extend(0.0).to_array(),
            fill_color: [
                mood_accent[0] * 0.5 + 0.10,
                mood_accent[1] * 0.5 + 0.16,
                mood_accent[2] * 0.5 + 0.26,
                0.36 + 0.5 * burst,
            ],
            ambient: [
                mood_tint[0] * 2.6 + 0.020,
                mood_tint[1] * 2.6 + 0.034,
                mood_tint[2] * 2.6 + 0.075,
                0.95,
            ],
            accent: [
                mood_accent[0],
                mood_accent[1],
                mood_accent[2],
                0.85 + 0.7 * burst,
            ],
            tint: [mood_tint[0], mood_tint[1], mood_tint[2], exposure],
            params: [time, burst, debug, 0.0],
        };

        self.build_instances(
            from,
            to,
            progress,
            hand,
            burst,
            mood_tint,
            mood_accent,
            time,
            reduced,
        );
        self.project_anchors(from, to, progress, burst, &view_proj, &cam, viewport);

        globals
    }

    // --------------------------------------------------------------- internals

    #[allow(clippy::too_many_arguments)]
    fn build_instances(
        &mut self,
        from: usize,
        to: usize,
        progress: f32,
        hand: f32,
        burst: f32,
        mood_tint: [f32; 3],
        mood_accent: [f32; 3],
        time: f32,
        reduced: bool,
    ) {
        // The scratch buffers are owned locally for the duration of the frame,
        // so the plan can be read while the instances are written.
        let mut instances = std::mem::take(&mut self.instances);
        let mut poses = std::mem::take(&mut self.poses);
        let mut order = std::mem::take(&mut self.order);
        instances.clear();

        let a_plan = &self.plan.arrangements[from];
        let b_plan = &self.plan.arrangements[to];
        let base = (from * SLIDES + to) * PIECES;

        poses.clear();
        for slot in 0..PIECES {
            poses.push(pose_of(
                &a_plan[slot],
                &b_plan[slot],
                &self.motions[base + slot],
                progress,
                time,
                reduced,
            ));
        }

        // The core, then the rings: the same order the groups declare, and the
        // same order the opaque pass wants.
        for slot in 0..layout::FIRST_PLATE {
            instances.push(piece_instance(
                slot,
                &poses[slot],
                Kind::Solid,
                mood_tint,
                mood_accent,
                burst,
                hand,
            ));
        }

        // Glass is translucent, so it is drawn back to front: the depth of all
        // 172 plates is sorted and they are emitted in that order, which keeps
        // the stack of panes from muddying on its way past the camera.
        order.clear();
        for slot in layout::FIRST_PLATE..PIECES {
            order.push((poses[slot].depth, slot));
        }
        order.sort_unstable_by(|x, y| y.0.partial_cmp(&x.0).unwrap_or(std::cmp::Ordering::Equal));
        for (_, slot) in order.iter() {
            instances.push(piece_instance(
                *slot,
                &poses[*slot],
                Kind::Glass,
                mood_tint,
                mood_accent,
                burst,
                hand,
            ));
        }

        self.instances = instances;
        self.poses = poses;
        self.order = order;
    }

    fn project_anchors(
        &mut self,
        from: usize,
        to: usize,
        progress: f32,
        burst: f32,
        view_proj: &Mat4,
        cam: &Cam,
        viewport: &Viewport,
    ) {
        let tan_half = (cam.fov * 0.5).to_radians().tan().max(1e-4);
        for (i, anchor) in self.plan.anchors.iter().enumerate() {
            let motion = &self.anchors[i];
            let (weight, local) = if anchor.slide == to {
                let local = ease01(((progress - 0.30) / 0.70).clamp(0.0, 1.0));
                (local, local)
            } else if anchor.slide == from && from != to {
                let local = ease01((progress / 0.62).clamp(0.0, 1.0));
                (1.0 - local, local)
            } else if anchor.slide == from {
                (1.0, 1.0)
            } else {
                (0.0, 1.0)
            };

            let flight = (PI * local).sin();
            let pos = anchor.pos + motion.dir * (flight * motion.amp * burst.max(flight) * 1.4);

            let clip = *view_proj * pos.extend(1.0);
            let w = clip.w;
            let out = &mut self.anchors_out[i];
            if w.abs() < 1e-4 || weight <= 0.001 {
                out[0] = -9999.0;
                out[1] = -9999.0;
                out[2] = 0.0;
                out[3] = 0.0;
                continue;
            }
            let ndc = clip.truncate() / w;
            out[0] = (ndc.x * 0.5 + 0.5) * viewport.width;
            out[1] = (0.5 - ndc.y * 0.5) * viewport.height;
            // w <= 0 is behind the camera: the label is not in the frame.
            let facing = if w > 0.05 { 1.0 } else { 0.0 };
            out[2] = weight * facing;
            out[3] = viewport.height / (2.0 * w * tan_half);
        }
    }
}

/// How one piece is coloured in the current room.
fn piece_instance(
    slot: usize,
    pose: &Pose,
    kind: Kind,
    mood_tint: [f32; 3],
    mood_accent: [f32; 3],
    burst: f32,
    hand: f32,
) -> Instance {
    let seed = layout::hash01(slot, 811);

    let (colour, alpha) = match kind {
        // The core and the rings: the room's accent, opaque, so the structure
        // has a skeleton the glass can hang on. Kept well below white, or a
        // hairline ring seen face-on flares like a lamp.
        Kind::Solid => {
            let glow = 0.45 + 0.35 * seed;
            (
                [
                    mood_accent[0] * glow,
                    mood_accent[1] * glow,
                    mood_accent[2] * glow,
                ],
                1.0,
            )
        }
        // Plates: deep water glass, lifted towards the accent as the structure
        // comes apart, so the burst reads as light escaping the seams. Kept
        // thin: a pane that darkens the sea behind it is a pane too far.
        _ => {
            let lift = 0.10 + 0.30 * seed + 0.55 * burst;
            (
                [
                    mood_tint[0] * 5.5 + mood_accent[0] * lift,
                    mood_tint[1] * 5.5 + mood_accent[1] * lift,
                    mood_tint[2] * 5.5 + mood_accent[2] * lift,
                ],
                0.09 + 0.15 * seed + 0.08 * hand,
            )
        }
    };

    Instance::new(
        pose.model,
        pose.normal,
        [colour[0], colour[1], colour[2], alpha],
        [kind.as_f32(), burst, 0.0, seed],
    )
}

/// Where one piece is, mid transition: interpolated between its pose in the
/// outgoing arrangement and its pose in the incoming one, thrown along its own
/// direction by a burst that peaks at the impact and settles by the end.
///
/// The interpolation overshoots slightly (`ease_out_back`), so a piece arrives
/// past its mark and comes back: that snap is what makes the new arrangement
/// read as *landing* rather than as easing into place.
fn pose_of(a: &Piece, b: &Piece, motion: &Motion, progress: f32, time: f32, reduced: bool) -> Pose {
    let raw = ((progress - motion.delay) / (1.0 - motion.delay)).clamp(0.0, 1.0);
    let local = ease_out_back(raw);
    let open = (1.0 - (2.0 * raw - 1.0).abs()).powf(1.4);

    let mut pos = a.pos.lerp(b.pos, local) + motion.dir * (open * motion.amp);
    let mut rot =
        a.rot.slerp(b.rot, local) * Quat::from_axis_angle(motion.axis, motion.spin * open);
    let base = a.scale.lerp(b.scale, local);

    if !reduced {
        // Idle: a centimetre of drift, so a resting arrangement still breathes.
        let phase = time * 0.22 + motion.seed * 6.283;
        pos.y += 0.010 * phase.sin() * (1.0 - open);
        rot *= Quat::from_axis_angle(Vec3::Y, 0.06 * (time * 0.13 + motion.seed * 5.0).sin());
    }

    // Mid-flight a plate is stretched along its travel and thinned across it,
    // which is what sells the speed without a motion blur pass.
    let scale = Vec3::new(
        base.x * (1.0 + 1.05 * open),
        base.y * (1.0 - 0.32 * open),
        base.z * (1.0 - 0.12 * open),
    );

    let model = Mat4::from_translation(pos) * Mat4::from_quat(rot) * Mat4::from_scale(scale);
    let normal = Mat3::from_mat4(model).inverse().transpose();

    Pose {
        model,
        normal,
        depth: model.w_axis.truncate().length_squared(),
    }
}

struct Pose {
    model: Mat4,
    normal: Mat3,
    depth: f32,
}

struct Cam {
    pos: Vec3,
    target: Vec3,
    fov: f32,
    roll: f32,
}

fn camera(
    from: usize,
    to: usize,
    progress: f32,
    burst: f32,
    pointer: Vec2,
    time: f32,
    reduced: bool,
    wide: bool,
) -> Cam {
    let a = &SLIDE_TABLE[from];
    let b = &SLIDE_TABLE[to];
    let hand = smootherstep(progress);

    let mut pos = a.eye.lerp(b.eye, hand);
    let target = a.target.lerp(b.target, hand);
    let fov = a.fov + (b.fov - a.fov) * hand + 8.0 * burst;

    if !wide {
        // A tall frame: the camera moves back over the centre line so the whole
        // arrangement fits in view behind the column of type.
        pos.x *= 0.42;
        pos.z += 1.15;
    }

    // The camera steps back while the world is open, so the burst has room,
    // then pushes in as the new arrangement clicks together.
    let dir = (target - pos).normalize_or(-Vec3::Z);
    pos -= dir * 0.85 * burst;

    if !reduced {
        // Handheld: a slow drift that grows while the world is exploding.
        let drift = 0.010 + 0.075 * burst;
        pos += Vec3::new(
            (time * 0.31).sin(),
            (time * 0.24 + 1.7).sin() * 0.6,
            (time * 0.19 + 0.4).cos() * 0.4,
        ) * drift;
    }

    // Pointer parallax: a small reason for the world to feel alive under the
    // cursor.
    pos += Vec3::new(pointer.x, pointer.y * 0.7, 0.0) * 0.17;

    let direction = if to >= from { 1.0 } else { -1.0 };
    let roll = 0.045 * burst * direction;

    Cam {
        pos,
        target,
        fov,
        roll,
    }
}

const KEY_DIR: Vec3 = Vec3::new(-0.46, 0.60, 0.72);
const KEY_COLOR: [f32; 3] = [0.66, 0.80, 1.0];
const FILL_DIR: Vec3 = Vec3::new(0.72, -0.26, 0.38);

fn mix3(a: [f32; 3], b: [f32; 3], t: f32) -> [f32; 3] {
    [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ]
}

pub fn smootherstep(t: f32) -> f32 {
    let t = t.clamp(0.0, 1.0);
    t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
}

fn ease01(t: f32) -> f32 {
    let t = t.clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

/// Overshoots its target and comes back, which is what a landing looks like.
fn ease_out_back(t: f32) -> f32 {
    const C1: f32 = 1.15;
    const C3: f32 = C1 + 1.0;
    let u = t - 1.0;
    1.0 + C3 * u * u * u + C1 * u * u
}
