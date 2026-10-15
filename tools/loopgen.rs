// Background loop generator: a night sea, and nothing else.
//
//   rustc -O -C target-cpu=native tools/loopgen.rs -o /tmp/loopgen
//   /tmp/loopgen > loop.rgb
//
// Writes raw RGB24 frames for a seamless, evenly looping background: a dark
// ocean seen from just above the waterline, its swell rolling towards the
// camera, its crests catching a low light off to the right. It is a development
// tool, not part of the site: the encoded result lives in `public/film/` and
// ships as a plain <video> source.
//
// Two things make the loop seamless rather than cross-faded:
//
//   * every wave component advances by a whole number of cycles over the loop,
//     so the phase axis is exactly periodic
//   * the perspective mapping compresses distance towards the top of the frame,
//     and each component is filtered out as its wavelength approaches the pixel
//     pitch, which is what keeps the far water smooth instead of aliased
//
// Pure std, no dependencies: the frames are streamed as raw RGB and encoded by
// ffmpeg, so no image codec is needed here.

use std::f32::consts::TAU;
use std::io::Write;

const W: usize = 1280;
const H: usize = 720;
const FPS: u32 = 24;
const SECONDS: u32 = 12;
const FRAMES: usize = (FPS * SECONDS) as usize;

/// How far the camera sits above the water, in metres. Everything about the
/// look follows from this: it decides how fast the swell opens up as it comes
/// towards the bottom of the frame.
const EYE_HEIGHT: f32 = 0.85;
/// The vertical angles the frame spans below the horizon, in radians: barely
/// below it at the top edge, well down at the bottom edge.
const ANGLE_FAR: f32 = 0.028;
const ANGLE_NEAR: f32 = 0.62;

/// One component of the swell.
struct Wave {
    /// Direction of travel, in radians around the water plane.
    heading: f32,
    /// Wavelength in metres.
    wavelength: f32,
    /// Crest-to-trough height in metres.
    height: f32,
    /// Whole cycles travelled over one loop: what makes the loop seamless.
    cycles: f32,
    /// Phase offset, radians.
    offset: f32,
}

/// The swell. Long, low waves mostly travelling towards the camera (a heading
/// of π/2 is straight down the view axis), so the crests run across the frame
/// and their spacing opens up towards the viewer. A couple are oblique, which is
/// what gives the light something to catch, and the short ripples at the end are
/// what give the water its texture where it comes closest to the lens.
const SWELL: [Wave; 7] = [
    Wave { heading: 1.62, wavelength: 7.20, height: 0.130, cycles: 1.0, offset: 0.0 },
    Wave { heading: 1.16, wavelength: 4.10, height: 0.075, cycles: 1.0, offset: 1.7 },
    Wave { heading: 2.05, wavelength: 2.30, height: 0.048, cycles: 2.0, offset: 3.1 },
    Wave { heading: 1.42, wavelength: 1.15, height: 0.030, cycles: 3.0, offset: 0.6 },
    Wave { heading: 1.82, wavelength: 0.62, height: 0.019, cycles: 5.0, offset: 2.4 },
    Wave { heading: 1.30, wavelength: 0.34, height: 0.007, cycles: 7.0, offset: 4.2 },
    Wave { heading: 1.95, wavelength: 0.19, height: 0.0035, cycles: 9.0, offset: 1.1 },
];

/// The light sits low and off to the right: its direction and the column of
/// water that throws it back.
const LIGHT_X: f32 = 0.78;
const LIGHT_D: f32 = -0.62;
const GLITTER_X: f32 = 0.72;

/// What the surface at a point on the sea is doing: its height in metres, its
/// slope across the frame, and its slope away from the camera. Those two slopes
/// are what the light actually reads.
fn surface(x: f32, distance: f32, phase: f32, pixel_x: f32) -> (f32, f32, f32) {
    let mut height = 0.0;
    let mut slope_x = 0.0;
    let mut slope_d = 0.0;

    for wave in SWELL.iter() {
        // Metres per pixel of the projected image at this distance: when a wave
        // is finer than a few pixels it is dropped rather than aliased.
        let fade = smoothstep(pixel_x * 2.5, pixel_x * 9.0, wave.wavelength);
        if fade <= 0.0 {
            continue;
        }

        let k = TAU / wave.wavelength;
        let (dx, dd) = (wave.heading.cos(), wave.heading.sin());
        let theta = (x * dx + distance * dd) * k + wave.cycles * phase * TAU + wave.offset;
        let (sin, cos) = theta.sin_cos();

        let amplitude = wave.height * 0.5 * fade;
        height += amplitude * sin;
        slope_x += amplitude * k * cos * dx;
        slope_d += amplitude * k * cos * dd;
    }

    (height, slope_x, slope_d)
}

fn smoothstep(a: f32, b: f32, x: f32) -> f32 {
    let t = ((x - a) / (b - a)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

/// Squashed lattice hash: used for the foam spray and the film grain.
fn hash2(x: i32, y: i32, z: i32) -> f32 {
    let mut h = (x as u32).wrapping_mul(0x8da6_b343)
        ^ (y as u32).wrapping_mul(0xd816_3841)
        ^ (z as u32).wrapping_mul(0xcb1a_b31f);
    h ^= h >> 15;
    h = h.wrapping_mul(0x2c1b_3c6d);
    h ^= h >> 12;
    h = h.wrapping_mul(0x297a_2d39);
    h ^= h >> 15;
    (h >> 8) as f32 * (1.0 / 16_777_216.0)
}

/// One pixel of the loop. `phase` runs 0..1 over the whole loop.
///
/// The camera looks down at a shallow angle, so the frame's rows are distances
/// on the water: the top edge is about thirty metres away, the bottom edge is
/// about a metre. Rows are linear in `tan(angle)`, exactly as a real lens
/// projects a plane, which is what makes the swell open up towards the viewer.
///
/// The surface is then solved for rather than sampled: a crest stands above the
/// water it grew out of, so the distance that projects to a given row depends on
/// the wave height at that distance. Three passes of that fixed point are enough
/// for it to settle, and it is what gives the near crests their overhang.
fn shade(uv_x: f32, uv_y: f32, phase: f32) -> (f32, f32, f32) {
    let tan_frame = ANGLE_FAR.tan() + (ANGLE_NEAR.tan() - ANGLE_FAR.tan()) * uv_y;
    let tan_frame = tan_frame.max(1e-4);

    let mut distance = (EYE_HEIGHT / tan_frame).max(0.05);
    let mut height = 0.0;
    let mut slope_x = 0.0;
    let mut slope_d = 0.0;

    for _ in 0..3 {
        let span = 2.3 * distance;
        let metres_per_pixel = span / W as f32;
        let x = (uv_x - 0.5) * span;
        let (h, sx, sd) = surface(x, distance, phase, metres_per_pixel);
        height = h;
        slope_x = sx;
        slope_d = sd;
        // The point on the surface that projects to this row: the height the
        // water has reached has to be taken off the camera's clearance.
        distance = ((EYE_HEIGHT - height) / tan_frame).max(0.05);
    }

    // How much of the light the surface throws back: a face tilted towards the
    // light flares, a face tilted away goes dark. Both slopes are read, which is
    // why the oblique parts of the swell keep their structure.
    let lit_slope = slope_x * LIGHT_X + slope_d * LIGHT_D;
    let facing = (lit_slope * 6.5).clamp(-1.0, 1.0);

    // The glitter path: a column of water below the light, narrow at the
    // horizon and spreading as it comes towards the viewer.
    let half_width = 0.055 + 0.34 * uv_y;
    let path = (-((uv_x - GLITTER_X) / half_width).powi(2)).exp();
    let sparkle = (facing.max(0.0)).powf(2.6) * (0.30 + 1.5 * path);

    // Slewing crests: the steep faces on either side of a crest catch a rim of
    // light even where the glitter does not reach.
    let rim = (slope_d.abs() * 3.2).clamp(0.0, 1.0) * (0.10 + 0.35 * path);

    // Foam: only where a crest is both high and steep, and only in the near
    // half, so the distance stays calm.
    let crest = smoothstep(0.35, 0.95, height / 0.05);
    let steep = smoothstep(0.12, 0.45, slope_d.abs().max(slope_x.abs()));
    let foam = crest * steep * smoothstep(0.35, 0.85, uv_y);
    let spray = if foam > 0.02 {
        // Grain that only the foam sees: it breaks the crest line up.
        let n = hash2((uv_x * W as f32) as i32, (uv_y * H as f32) as i32, 0);
        foam * smoothstep(0.72, 0.98, n) * 1.6
    } else {
        0.0
    };

    // The body of the water: nearly black in the troughs, blue where the face
    // turns up towards the sky, and it lightens with distance as the haze of
    // the whole sea stacks up.
    let sky_up = (uv_y * 0.55).clamp(0.0, 1.0);
    let haze = smoothstep(0.0, 0.35, 1.0 - uv_y) * 0.55;
    let deep = (0.010, 0.024, 0.056);
    let body = (0.052, 0.130, 0.290);
    let crest_colour = (0.55, 0.82, 1.0);

    let lit = (0.24 + 0.76 * (facing * 0.5 + 0.5)) * (0.58 + 0.42 * sky_up);
    let mut r = deep.0 + body.0 * lit + crest_colour.0 * (sparkle + rim) + haze * 0.045;
    let mut g = deep.1 + body.1 * lit + crest_colour.1 * (sparkle + rim) + haze * 0.070;
    let mut b = deep.2 + body.2 * lit + crest_colour.2 * (sparkle + rim) + haze * 0.130;

    // Foam and spray are white, and only exist near the camera.
    r += spray * 0.55;
    g += spray * 0.62;
    b += spray * 0.70;

    // Vignette: the frame's edges fall away, so the type has quiet water.
    let dx = uv_x - 0.5;
    let dy = (uv_y - 0.46) * 1.1;
    let radius = (dx * dx + dy * dy).sqrt() * 1.34;
    let vignette = 1.0 - 0.55 * smoothstep(0.25, 1.05, radius);
    r *= vignette;
    g *= vignette;
    b *= vignette;

    (r, g, b)
}

fn main() {
    let threads = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
        .min(16);

    let rows_per_band = (H + threads - 1) / threads;
    let mut frame = vec![0u8; W * H * 3];
    let mut out = std::io::BufWriter::with_capacity(1 << 22, std::io::stdout().lock());

    for index in 0..FRAMES {
        let phase = index as f32 / FRAMES as f32;
        // Rows are independent, so the frame is rendered band by band in
        // parallel; only the write to stdout is serial.
        std::thread::scope(|scope| {
            for (band, rows) in frame.chunks_mut(rows_per_band * W * 3).enumerate() {
                let y0 = band * rows_per_band;
                scope.spawn(move || {
                    for (row_index, row) in rows.chunks_mut(W * 3).enumerate() {
                        let y = y0 + row_index;
                        let uv_y = (y as f32 + 0.5) / H as f32;
                        for (x, pixel) in row.chunks_mut(3).enumerate() {
                            let uv_x = (x as f32 + 0.5) / W as f32;
                            let (r, g, b) = shade(uv_x, uv_y, phase);
                            let grain = (hash2(x as i32, y as i32, index as i32) - 0.5) * 0.009;
                            pixel[0] = ((r + grain).clamp(0.0, 1.0) * 255.0) as u8;
                            pixel[1] = ((g + grain).clamp(0.0, 1.0) * 255.0) as u8;
                            pixel[2] = ((b + grain).clamp(0.0, 1.0) * 255.0) as u8;
                        }
                    }
                });
            }
        });
        out.write_all(&frame).expect("write frame");
    }
    out.flush().expect("flush");
    eprintln!("{FRAMES} frames at {W}x{H}, {FPS} fps");
}
