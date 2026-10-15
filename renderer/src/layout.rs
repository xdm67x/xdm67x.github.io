//! The world: one set of glass pieces, four ways of assembling them.
//!
//! There is a single pool of pieces — a core, three rings and a field of glass
//! plates. A *slide* is an arrangement of that pool: an orbit for the hero,
//! three growing columns for experience, a lattice for projects, concentric
//! rings for contact. Moving between slides takes the pool apart and puts it
//! back together, which is the whole of this site's 3D transition.
//!
//! **Scale.** At a slide the camera sits about 4.4 m from the arrangement with a
//! 42° field of view, so one metre is roughly 270 px on a 900 px-tall frame.
//! Arrangements are built inside a box about 2.0 m wide and 1.5 m tall, and the
//! camera aims to the left of that box (`AXIS_X`), which puts the structure in
//! the right half of the frame and leaves the left half to the document.
//!
//! World axes: +Y up, the camera looks down -Z.

use crate::mesh::{self, MeshData};
use glam::{Quat, Vec3};
use std::f32::consts::{FRAC_PI_2, PI, TAU};

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

/// Four rooms, all cut from the same deep blue: only the light changes.
///
///   00 Hero       abyss      #03060f / azure   #6ba6ff
///   01 Experience deep sea   #030b15 / cyan    #4ddbff
///   02 Projects   night blue #05071a / iris    #9a8cff
///   03 Contact    glacier    #020c14 / ice     #a6d9ff
pub const SLIDE_TABLE: [Slide; SLIDES] = [
    Slide {
        tint: [0.012, 0.024, 0.059],
        accent: [0.42, 0.65, 1.0],
        eye: Vec3::new(0.0, 0.10, ORBIT),
        target: Vec3::new(AXIS_X, -0.02, 0.0),
        fov: 42.0,
    },
    Slide {
        tint: [0.012, 0.043, 0.082],
        accent: [0.30, 0.86, 1.0],
        eye: Vec3::new(0.06, 0.26, ORBIT + 0.20),
        target: Vec3::new(AXIS_X - 0.04, -0.05, 0.0),
        fov: 42.0,
    },
    Slide {
        tint: [0.020, 0.027, 0.102],
        accent: [0.60, 0.55, 1.0],
        eye: Vec3::new(0.0, 0.02, ORBIT + 0.30),
        target: Vec3::new(AXIS_X, 0.02, 0.0),
        fov: 39.0,
    },
    Slide {
        tint: [0.008, 0.047, 0.078],
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

/// 00 Hero — an oblate cloud of plates orbiting the core, inside three rings.
/// The work, presented in orbit.
fn arrange_orbit() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    out.push(piece(CENTRE, Quat::IDENTITY, Vec3::splat(0.115)));

    // Three hairline orbits, each tipped differently, so they read as one cage.
    let ring_tilt = [
        Quat::from_euler(glam::EulerRot::YXZ, 0.22, 1.30, -0.30),
        Quat::from_euler(glam::EulerRot::YXZ, -1.10, 0.62, 0.95),
        Quat::from_euler(glam::EulerRot::YXZ, 0.92, -0.36, -1.15),
    ];
    let ring_scale = [0.30, 0.50, 0.74];
    for k in 0..RINGS {
        out.push(piece(
            CENTRE + Vec3::new(0.0, 0.02 * k as f32, 0.0),
            ring_tilt[k],
            Vec3::splat(ring_scale[k]),
        ));
    }

    // Plates on three shells, squashed vertically and in depth so the cloud
    // reads as a belt around the core rather than as a ball.
    for j in 0..PLATES {
        let slot = FIRST_PLATE + j;
        let shell = j % 3;
        let radius = [0.38, 0.60, 0.84][shell] * (0.86 + 0.28 * hash01(slot, 11));
        let a = hash01(slot, 23) * TAU;
        let lat = (hash01(slot, 31) - 0.5) * PI;
        let dir = Vec3::new(
            lat.cos() * a.cos(),
            lat.sin() * 0.62,
            lat.cos() * a.sin() * 0.66,
        )
        .normalize_or(Vec3::Z);

        // Face outwards along the shell, so the cloud catches the key light.
        let rot = Quat::from_rotation_arc(Vec3::Z, dir)
            * Quat::from_rotation_z(hash01(slot, 47) * TAU)
            * jitter_rot(slot, 0.6);

        out.push(plate(
            CENTRE + dir * radius,
            rot,
            0.050 + 0.085 * hash01(slot, 53),
            1.25,
            0.9,
        ));
    }

    out
}

/// 01 Experience — three columns rising left to right over a wide field of
/// fallen plates. A record that grows, oldest to newest.
fn arrange_columns() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    let base = -0.50;
    let heights = [0.44f32, 0.68, 0.94];
    let widths = [0.28f32, 0.32, 0.36];
    let lanes = [-0.42f32, 0.0, 0.44];

    out.push(piece(
        Vec3::new(CENTRE.x + 0.44, base + heights[2] + 0.09, 0.0),
        Quat::IDENTITY,
        Vec3::splat(0.040),
    ));

    for k in 0..RINGS {
        out.push(piece(
            Vec3::new(CENTRE.x + lanes[k], base - 0.04, 0.0),
            facing(0.24),
            Vec3::splat(heights[k] * 0.30),
        ));
    }

    // 54 plates stacked into the three columns: 18 levels each.
    let stacked = 54;
    let levels = stacked / 3;
    for j in 0..stacked {
        let slot = FIRST_PLATE + j;
        let column = j % 3;
        let level = j / 3;
        let t = level as f32 / (levels - 1) as f32;
        let pos = Vec3::new(
            CENTRE.x + lanes[column] + hash_sym_f32(slot, 61) * widths[column] * (0.20 + 0.14 * t),
            base + t * heights[column],
            hash_sym_f32(slot, 67) * 0.12,
        );
        let size = 0.045 + 0.038 * hash01(slot, 71);
        let rot = Quat::from_rotation_y(hash01(slot, 73) * TAU)
            * Quat::from_euler(
                glam::EulerRot::YXZ,
                0.0,
                hash_sym_f32(slot, 79) * 0.5,
                hash_sym_f32(slot, 83) * 0.3,
            );
        out.push(plate(pos, rot, size, 1.5, 1.0));
    }

    // The rest lies fallen: a wide, quiet field settling under the columns,
    // which is what gives this slide its horizon.
    for j in stacked..PLATES {
        let slot = FIRST_PLATE + j;
        let pos = Vec3::new(
            CENTRE.x + hash_sym_f32(slot, 91) * 1.15,
            base - 0.14 - hash01(slot, 101) * 0.14,
            hash_sym_f32(slot, 97) * 0.70,
        );
        let size = 0.050 + 0.080 * hash01(slot, 103);
        let rot = Quat::from_euler(
            glam::EulerRot::YXZ,
            hash_sym_f32(slot, 107) * 0.30,
            hash01(slot, 109) * TAU,
            hash_sym_f32(slot, 113) * 0.30,
        );
        out.push(plate(pos, rot, size, 1.4, 1.0));
    }

    out
}

/// 02 Projects — a lattice of tiles with a deeper second layer behind it. The
/// work itself, as objects.
fn arrange_lattice() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    out.push(piece(
        Vec3::new(CENTRE.x + 0.72, 0.72, -0.42),
        Quat::IDENTITY,
        Vec3::splat(0.045),
    ));

    // Rings stand behind the lattice: the frame the work hangs in.
    for k in 0..RINGS {
        out.push(piece(
            Vec3::new(CENTRE.x + 0.16, 0.0, -0.60 - 0.20 * k as f32),
            facing(0.10 * k as f32),
            Vec3::splat([0.60, 0.84, 1.06][k]),
        ));
    }

    let columns = 13;
    let front = columns * columns;
    for j in 0..PLATES {
        let slot = FIRST_PLATE + j;
        if j < front {
            let col = j % columns;
            let row = j / columns;
            let pos = Vec3::new(
                CENTRE.x + 0.14 + (col as f32 - 6.0) * 0.125,
                (row as f32 - 6.0) * 0.115,
                hash_sym_f32(slot, 131) * 0.03,
            );
            let rot = Quat::from_rotation_z(hash_sym_f32(slot, 137) * 0.14)
                * jitter_rot(slot, 0.08);
            out.push(plate(pos, rot, 0.046, 1.35, 1.0));
        } else {
            // Spare tiles fall back into a deeper, larger grid: the index
            // behind the index.
            let col = (j - front) % 7;
            let row = (j - front) / 7;
            let pos = Vec3::new(
                CENTRE.x + 0.06 + (col as f32 - 3.0) * 0.34,
                (row as f32 - 3.0) * 0.28,
                -1.05 - hash01(slot, 149) * 0.35,
            );
            out.push(plate(
                pos,
                jitter_rot(slot, 0.5),
                0.12 + 0.05 * hash01(slot, 139),
                1.3,
                1.0,
            ));
        }
    }

    out
}

/// 03 Contact — concentric rings of plates around a signal sphere. A landing
/// place: something answered.
fn arrange_rings() -> Vec<Piece> {
    let mut out = Vec::with_capacity(PIECES);

    out.push(piece(CENTRE, Quat::IDENTITY, Vec3::splat(0.072)));

    let radii = [0.30f32, 0.52, 0.76];
    for k in 0..RINGS {
        out.push(piece(
            CENTRE + Vec3::new(0.0, 0.0, -0.10 - 0.09 * k as f32),
            facing(0.16 + 0.10 * k as f32),
            Vec3::splat(radii[k]),
        ));
    }

    let counts = [24usize, 40, 56];
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
            id: "experience.span".into(),
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
                arrange_orbit(),
                arrange_columns(),
                arrange_lattice(),
                arrange_rings(),
            ],
            anchors: anchors(),
        }
    }
}
