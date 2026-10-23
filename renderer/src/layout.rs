//! The world: one set of glass pieces, four ways of assembling them.
//!
//! There is a single pool of pieces — a core, three rings and a field of glass
//! plates. A *slide* is an arrangement of that pool, themed on what the slide
//! is about:
//!
//!   00 Hero       a voxel game level under construction: a wireframe grid,
//!                 a floating cube cursor and a sky of scattered voxels
//!   01 Craft      the AI layer: a central node wired to an orbit of satellite
//!                 nodes, pulses running along the wires
//!   02 Projects   the 3D viewport: a perspective grid floor with objects
//!                 standing on it, framed by an orbit cage
//!   03 Contact    a radar: concentric sweeps around a signal sphere
//!
//! Moving between slides takes the pool apart and puts it back together,
//! which is the whole of this site's 3D transition.
//!
//! **Scale.** At a slide the camera sits about 4.4 m from the arrangement with
//! a 42° field of view, so one metre is roughly 270 px on a 900 px-tall frame.
//! Arrangements are built inside a box about 2.0 m wide and 1.5 m tall, and the
//! camera aims to the left of that box (`AXIS_X`), which puts the structure in
//! the right half of the frame and leaves the left half to the document.
//!
//! World axes: +Y up, the camera looks down -Z.

use crate::mesh::{self, MeshData};
use glam::{Quat, Vec3};
use std::f32::consts::{FRAC_PI_2, TAU};

pub const SLIDES: usize = 4;

/// The pool, in slot order: 0 is the core, 1..=3 are the rings, and everything
/// after that is a plate. The mesh a piece uses is decided by that range, so an
/// arrangement only ever describes where its pieces go.
pub const FIRST_RING: usize = 1;
pub const RINGS: usize = 3;
pub const FIRST_PLATE: usize = FIRST_RING + RINGS;
pub const PIECES: usize = 176;
pub const PLATES: usize = PIECES - FIRST_PLATE;

/// Where the collection of pieces sits: right of the frame's centre line.
pub const CENTRE: Vec3 = Vec3::new(0.66, -0.02, 0.0);
/// What the camera aims at: left of the arrangement, so the arrangement reads
/// right of centre and the typography keeps the left.
pub const AXIS_X: f32 = -0.17;
/// How far the camera sits from the arrangement at a slide.
const ORBIT: f32 = 4.35;

/// A piece's rest pose in one arrangement.
#[derive(Clone, Copy)]
pub struct Piece {
    pub pos: Vec3,
    pub rot: Quat,
    /// Full scale, so a plate can be wide, thin or sliver-shaped.
    pub scale: Vec3,
}

/// A slide: its room colours and the camera framing that shows its arrangement.
pub struct Slide {
    /// Owns the room: the film's grade, the glass, the scrim behind the type.
    pub tint: [f32; 3],
    /// Owns meaning: the hero geometry, the focus and hover states, the rail.
    pub accent: [f32; 3],
    pub eye: Vec3,
    pub target: Vec3,
    /// Vertical field of view, in degrees.
    pub fov: f32,
}

/// Four rooms, each with its own accent so a slide change is felt as a change
/// of light, not just of layout:
///
///   00 Hero       near-black   #05070d / lime    #a8e34d   (game dev)
///   01 Craft      deep teal    #03110f / mint    #4de8b0   (AI)
///   02 Projects   deep indigo  #0b0817 / violet  #a98cff   (3D)
///   03 Contact    deep slate   #060a12 / ice     #a6d9ff   (signal)
pub const SLIDE_TABLE: [Slide; SLIDES] = [
    Slide {
        tint: [0.012, 0.016, 0.031],
        accent: [0.66, 0.89, 0.30],
        eye: Vec3::new(0.0, 0.10, ORBIT),
        target: Vec3::new(AXIS_X, -0.02, 0.0),
        fov: 42.0,
    },
    Slide {
        tint: [0.008, 0.047, 0.043],
        accent: [0.30, 0.91, 0.69],
        eye: Vec3::new(0.06, 0.26, ORBIT + 0.20),
        target: Vec3::new(AXIS_X - 0.04, -0.05, 0.0),
        fov: 42.0,
    },
    Slide {
        tint: [0.035, 0.024, 0.075],
        accent: [0.66, 0.55, 1.0],
        eye: Vec3::new(0.0, 0.02, ORBIT + 0.30),
        target: Vec3::new(AXIS_X, 0.02, 0.0),
        fov: 39.0,
    },
    Slide {
        tint: [0.014, 0.026, 0.047],
        accent: [0.65, 0.85, 1.0],
        eye: Vec3::new(0.0, 0.14, ORBIT + 0.10),
        target: Vec3::new(AXIS_X, -0.02, 0.0),
        fov: 41.0,
    },
];

/// A label the DOM pins into the world. One per slide at most, and only where
/// the world can annotate the document rather than repeat it.
pub struct Anchor {
    pub id: String,
    pub slide: usize,
    /// Rest position in the arrangement's frame.
    pub pos: Vec3,
    /// Nominal cap height in world metres.
    pub size: f32,
}

pub struct Plan {
    pub meshes: Vec<MeshPlan>,
    /// One arrangement per slide, each `PIECES` long.
    pub arrangements: Vec<Vec<Piece>>,
    pub anchors: Vec<Anchor>,
}

pub struct MeshPlan {
    pub data: MeshData,
}

/// Stable pseudo-random value in 0..1 for a slot and a salt.
pub fn hash01(slot: usize, salt: u32) -> f32 {
    let mut h = (slot as u32)
        .wrapping_mul(0x9e37_79b9)
        .wrapping_add(salt.wrapping_mul(0x85eb_ca6b));
    h ^= h >> 15;
    h = h.wrapping_mul(0x2c1b_3c6d);
    h ^= h >> 12;
    h = h.wrapping_mul(0x297a_2d39);
    h ^= h >> 15;
    (h >> 8) as f32 * (1.0 / 16_777_216.0)
}

/// Signed pseudo-random value in -1..1.
pub fn hash_sym_f32(slot: usize, salt: u32) -> f32 {
    hash01(slot, salt) * 2.0 - 1.0
}

/// A ring standing in the plane of the screen, tipped by `tilt` radians.
/// The torus mesh lies in XZ, so a quarter turn about X brings it to face the
/// camera.
fn facing(tilt: f32) -> Quat {
    Quat::from_rotation_x(-FRAC_PI_2 + tilt)
}

fn piece(pos: Vec3, rot: Quat, scale: Vec3) -> Piece {
    Piece { pos, rot, scale }
}

/// A plate that faces the camera: `size` is its width in metres, and the others
/// are the proportions across and through it.
fn plate(pos: Vec3, rot: Quat, size: f32, wide: f32, thick: f32) -> Piece {
    piece(pos, rot, Vec3::new(size * wide, size, size * thick))
}

fn jitter_rot(slot: usize, amount: f32) -> Quat {
    Quat::from_euler(
        glam::EulerRot::YXZ,
        hash_sym_f32(slot, 401) * amount,
        hash_sym_f32(slot, 402) * amount,
        hash_sym_f32(slot, 403) * amount,
    )
}

// ---------------------------------------------------------------- arrangements

/// 00 Hero — a voxel scene under construction: a wireframe grid on the floor,
/// a floating "cursor" cube above it, and a sky of scattered voxels. The game
/// dev room: everything is a block, everything snaps to the grid.
fn arrange_voxels() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    // The core: the block under the cursor, slightly raised, glowing lime.
    out.push(piece(
        CENTRE + Vec3::new(0.0, 0.28, 0.0),
        Quat::IDENTITY,
        Vec3::splat(0.075),
    ));

    // Three rings: the grid's boundary seen from inside — one on the floor
    // plane, two tilted like a skybox's seams.
    out.push(piece(
        CENTRE + Vec3::new(0.0, -0.42, 0.0),
        Quat::IDENTITY,
        Vec3::splat(0.92),
    ));
    out.push(piece(
        CENTRE,
        Quat::from_rotation_x(FRAC_PI_2),
        Vec3::splat(1.06),
    ));
    out.push(piece(
        CENTRE,
        Quat::from_rotation_z(FRAC_PI_2),
        Vec3::splat(0.72),
    ));

    // A flat grid of plates on the floor: 10 x 10 = 100 cells, each a thin
    // square slightly above the ring plane, like a wireframe made of glass.
    let grid = 10;
    let cell = 0.148;
    let half = (grid as f32 - 1.0) * 0.5 * cell;
    for j in 0..PLATES {
        let slot = FIRST_PLATE + j;
        if j < grid * grid {
            let col = (j % grid) as f32;
            let row = (j / grid) as f32;
            let x = CENTRE.x - half + col * cell;
            let z = -half + row * cell;
            // Skip the centre cell: the cursor block hovers there.
            if (col - 4.5).abs() < 0.6 && (row - 4.5).abs() < 0.6 {
                out.push(plate(Vec3::new(x, -0.40, z), Quat::IDENTITY, 0.0, 1.0, 1.0));
                continue;
            }
            out.push(plate(
                Vec3::new(x, -0.40, z),
                Quat::IDENTITY,
                cell * 0.86,
                1.0,
                0.06,
            ));
        } else {
            // The sky: scattered voxels drifting above the grid, denser near
            // the cursor, like blocks a player has placed and not yet stacked.
            let t = (j - grid * grid) as f32 / (PLATES - grid * grid) as f32;
            let a = hash01(slot, 211) * TAU;
            let r = 0.55 + 0.75 * t;
            let y = 0.10 + 0.95 * hash01(slot, 223);
            let pos = CENTRE
                + Vec3::new(
                    a.cos() * r * (0.7 + 0.3 * hash01(slot, 227)),
                    y,
                    a.sin() * r * 0.62,
                );
            let size = 0.028 + 0.030 * hash01(slot, 229);
            out.push(plate(pos, jitter_rot(slot, 0.9), size, 1.0, 1.0));
        }
    }

    out
}

/// 01 Craft — the AI room: a central node wired to an orbit of satellite
/// nodes. The core glows mint, the rings are the orbit paths, and the plates
/// are the satellites plus the pulses that run between them.
fn arrange_network() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    // The model: a bright node at the centre.
    out.push(piece(CENTRE, Quat::IDENTITY, Vec3::splat(0.085)));

    // Three orbit rings at different tilts, like electron shells.
    let tilts = [
        Quat::from_euler(glam::EulerRot::YXZ, 0.35, 0.0, 0.0),
        Quat::from_euler(glam::EulerRot::YXZ, -0.55, 1.05, 0.0),
        Quat::from_euler(glam::EulerRot::YXZ, 0.95, -0.60, 0.35),
    ];
    let radii = [0.34f32, 0.55, 0.78];
    for k in 0..RINGS {
        out.push(piece(CENTRE, tilts[k], Vec3::splat(radii[k])));
    }

    // Satellites: 100 nodes spread over the three orbits, plus the rest as
    // free-floating context tokens drifting outside the system.
    let sats = 100;
    for j in 0..PLATES {
        let slot = FIRST_PLATE + j;
        if j < sats {
            let orbit = j % 3;
            let on_ring = (j / 3) as f32;
            let count = (sats / 3) as f32;
            let a = (on_ring / count) * TAU + orbit as f32 * 0.7;
            // Local orbit space: x = cos, z = sin, then the ring's tilt.
            let local = Vec3::new(a.cos() * radii[orbit], 0.0, a.sin() * radii[orbit]);
            let pos = CENTRE + tilts[orbit] * local;
            let size = 0.030 + 0.026 * hash01(slot, 241);
            out.push(plate(pos, jitter_rot(slot, 0.5), size, 1.0, 1.0));
        } else {
            // Context tokens: a loose cloud beyond the outer ring.
            let a = hash01(slot, 251) * TAU;
            let r = 0.95 + 0.55 * hash01(slot, 257);
            let y = (hash01(slot, 261) - 0.5) * 1.1;
            let pos = CENTRE + Vec3::new(a.cos() * r, y, a.sin() * r * 0.7);
            out.push(plate(
                pos,
                jitter_rot(slot, 1.2),
                0.024 + 0.022 * hash01(slot, 263),
                1.0,
                1.0,
            ));
        }
    }

    out
}

/// 02 Projects — the 3D viewport: a perspective grid floor, objects standing
/// on it, and an orbit cage framing the scene. The graphics room: a scene
/// graph you can almost reach into.
fn arrange_scene() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    // The hero object: a tall block standing on the floor, slightly off axis.
    out.push(piece(
        CENTRE + Vec3::new(0.30, 0.30, 0.0),
        Quat::from_rotation_y(0.5),
        Vec3::splat(0.085),
    ));

    // The cage: three rings, one flat on the floor (the grid's frame), two
    // tilted to suggest a skybox.
    out.push(piece(
        CENTRE + Vec3::new(0.0, -0.42, 0.0),
        Quat::IDENTITY,
        Vec3::splat(0.98),
    ));
    out.push(piece(
        CENTRE,
        Quat::from_rotation_x(FRAC_PI_2),
        Vec3::splat(1.10),
    ));
    out.push(piece(
        CENTRE + Vec3::new(0.0, 0.0, -0.30),
        facing(0.18),
        Vec3::splat(0.80),
    ));

    // The floor grid: 9 x 9 = 81 plates, thin lines of glass that recede into
    // the distance, denser spacing near the camera (a perspective hint).
    let grid = 9;
    for j in 0..PLATES {
        let slot = FIRST_PLATE + j;
        if j < grid * grid {
            let col = (j % grid) as f32;
            let row = (j / grid) as f32;
            let half = (grid as f32 - 1.0) * 0.5 * 0.16;
            let x = CENTRE.x - half + col * 0.16;
            let z = -half + row * 0.16 - 0.10;
            let size = 0.135;
            // Cross the lines: half run along X, half along Z.
            let (rot, wide) = if j % 2 == 0 {
                (Quat::IDENTITY, 1.0)
            } else {
                (Quat::from_rotation_y(FRAC_PI_2), 1.0)
            };
            out.push(plate(Vec3::new(x, -0.40, z), rot, size, wide, 0.05));
        } else if j < grid * grid + 40 {
            // Objects on the floor: 40 blocks of varied height, like meshes
            // placed in a scene. Deterministic pseudo-random placement.
            let slot2 = slot;
            let gx = hash01(slot2, 271);
            let gz = hash01(slot2, 277);
            let x = CENTRE.x + (gx - 0.5) * 1.5;
            let z = (gz - 0.5) * 1.5 - 0.10;
            let h = 0.10 + 0.45 * hash01(slot2, 281);
            let y = -0.40 + h * 0.5;
            let size = 0.045 + 0.035 * hash01(slot2, 283);
            out.push(plate(
                Vec3::new(x, y, z),
                Quat::from_rotation_y(hash01(slot2, 287) * TAU),
                size,
                1.0,
                h / size * 0.5,
            ));
        } else {
            // Sky debris: shards drifting above the scene.
            let a = hash01(slot, 293) * TAU;
            let r = 0.85 + 0.65 * hash01(slot, 297);
            let y = 0.35 + 0.85 * hash01(slot, 299);
            let pos = CENTRE + Vec3::new(a.cos() * r, y, a.sin() * r * 0.6 - 0.10);
            out.push(plate(
                pos,
                jitter_rot(slot, 1.0),
                0.035 + 0.045 * hash01(slot, 301),
                1.4,
                1.0,
            ));
        }
    }

    out
}

/// 03 Contact — a radar: concentric sweeps around a signal sphere, with
/// blips scattered on the rings. A landing place: something answered.
fn arrange_radar() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    // The signal: a sphere at the centre.
    out.push(piece(CENTRE, Quat::IDENTITY, Vec3::splat(0.072)));

    // Three concentric sweep rings in the screen plane.
    let radii = [0.30f32, 0.52, 0.76];
    for k in 0..RINGS {
        out.push(piece(
            CENTRE + Vec3::new(0.0, 0.0, -0.10 - 0.09 * k as f32),
            facing(0.16 + 0.10 * k as f32),
            Vec3::splat(radii[k]),
        ));
    }

    // Blips: 120 plates distributed on the three rings, tangent to their ring.
    let counts = [24usize, 44, 52];
    let banded: usize = counts.iter().sum();
    for j in 0..PLATES {
        let slot = FIRST_PLATE + j;
        if j < banded {
            let mut rest = j;
            let mut ring = 0;
            while rest >= counts[ring] {
                rest -= counts[ring];
                ring += 1;
            }
            let count = counts[ring];
            let a = (rest as f32 / count as f32) * TAU + ring as f32 * 0.11;
            let radius = radii[ring] * (0.97 + 0.09 * hash01(slot, 151));
            let pos = CENTRE
                + Vec3::new(
                    a.cos() * radius,
                    a.sin() * radius * 0.86,
                    hash_sym_f32(slot, 157) * 0.14,
                );
            // Tangent to the ring, leaning outwards.
            let rot = Quat::from_rotation_z(a + FRAC_PI_2)
                * Quat::from_rotation_y(hash_sym_f32(slot, 163) * 0.6)
                * jitter_rot(slot, 0.25);
            out.push(plate(pos, rot, 0.048 + 0.050 * hash01(slot, 167), 1.5, 1.0));
        } else {
            // Drifting debris outside the rings: the signal's wake.
            let a = hash01(slot, 173) * TAU;
            let radius = 0.95 + hash01(slot, 179) * 0.75;
            let pos = CENTRE
                + Vec3::new(
                    a.cos() * radius,
                    (hash01(slot, 181) - 0.5) * 1.25,
                    a.sin() * radius * 0.35 - 0.20,
                );
            out.push(plate(
                pos,
                jitter_rot(slot, 1.1),
                0.040 + 0.075 * hash01(slot, 191),
                1.4,
                1.0,
            ));
        }
    }

    out
}

fn anchors() -> Vec<Anchor> {
    vec![
        Anchor {
            id: "craft.span".into(),
            slide: 1,
            pos: CENTRE + Vec3::new(-0.06, 0.74, 0.20),
            size: 0.048,
        },
        Anchor {
            id: "projects.index".into(),
            slide: 2,
            pos: CENTRE + Vec3::new(0.66, 1.25, -0.24),
            size: 0.048,
        },
        Anchor {
            id: "contact.signal".into(),
            slide: 3,
            pos: CENTRE + Vec3::new(0.0, 0.90, 0.0),
            size: 0.048,
        },
    ]
}

impl Plan {
    /// Build the whole world: three meshes, four arrangements.
    pub fn load() -> Self {
        let meshes = vec![
            MeshPlan {
                data: mesh::sphere(1.0, 14),
            },
            MeshPlan {
                data: mesh::torus(1.0, 0.008, 128, 8),
            },
            MeshPlan {
                data: mesh::shard(7, 0.22, 0.07),
            },
        ];

        Self {
            meshes,
            arrangements: vec![
                arrange_voxels(),
                arrange_network(),
                arrange_scene(),
                arrange_radar(),
            ],
            anchors: anchors(),
        }
    }
}
