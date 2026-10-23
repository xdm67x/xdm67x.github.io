/**
 * Selected projects, grouped by what they are for: games, AI tooling and 3D.
 *
 * @typedef {object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} [insight]  one line on why it exists / what it taught
 * @property {string[]} tags
 * @property {string} github_url
 * @property {string} [live_url]
 */

/** @type {Project[]} */
export const PROJECTS = [
  {
    id: "2048",
    title: "TwoZeroFourEight",
    description:
      "The classic 2048 puzzle, playable in the browser. Slide tiles, merge numbers, chase the score.",
    insight: "A Bevy game engine shipped to WebAssembly: Rust, in a tab, zero install.",
    tags: ["Game", "Rust", "Bevy", "WASM"],
    github_url: "https://github.com/xdm67x/TwoZeroFourEight",
    live_url: "https://xdm67x.github.io/TwoZeroFourEight/",
  },
  {
    id: "clawdquest",
    title: "Clawdquest",
    description:
      "A macOS desktop pet you can drag anywhere. Finish a quest, feed him an apple.",
    insight: "A living creature on the desktop, rendered with WebGPU from Rust.",
    tags: ["Game", "Rust", "WebGPU", "macOS"],
    github_url: "https://github.com/xdm67x/clawdquest",
  },
  {
    id: "chip8",
    title: "chip8",
    description: "A Chip-8 emulator written in C++.",
    insight: "An interpreter built to understand vintage hardware from the instruction set up.",
    tags: ["Emulator", "C++", "Chip8"],
    github_url: "https://github.com/dm67x/chip8",
  },
  {
    id: "rtk",
    title: "RTK (Rust Token Killer)",
    description: "CLI proxy that reduces LLM token consumption by 60-90%.",
    insight:
      "Contributor to a tool that strips context bloat before it reaches the model: the same workflows, a fraction of the token spend.",
    tags: ["AI", "Contributor", "Rust", "LLM", "CLI"],
    github_url: "https://github.com/rtk-ai/rtk",
  },
  {
    id: "simple-agent",
    title: "simple-agent",
    description: "An interactive AI coding agent that runs locally on your computer.",
    insight: "A local-first coding harness: agent tooling without the cloud round-trip.",
    tags: ["AI", "Go", "Coding Agent", "Harness"],
    github_url: "https://github.com/xdm67x/simple-agent",
  },
  {
    id: "cargo-feature-guard",
    title: "cargo-feature-guard",
    description: "Validate Cargo feature propagation across a workspace.",
    insight:
      "A Cargo plugin that catches feature-propagation mistakes before they reach CI.",
    tags: ["Rust", "Cargo", "DX"],
    github_url: "https://github.com/xdm67x/cargo-feature-guard",
  },
  {
    id: "quick-xml",
    title: "quick-xml",
    description: "Rust high performance xml reader and writer.",
    insight: "Contributions to a parser built for performance-critical Rust workloads.",
    tags: ["Contributor", "Rust", "XML"],
    github_url: "https://github.com/tafia/quick-xml",
  },
  {
    id: "electrotest",
    title: "electrotest",
    description: "CLI automation tool for testing Electron apps using Gherkin and CDP.",
    insight:
      "Readable Gherkin scenarios driving Electron apps over the Chrome DevTools Protocol.",
    tags: ["Rust", "Tokio", "Electron", "Testing", "CDP"],
    github_url: "https://github.com/xdm67x/electrotest",
  },
  {
    id: "portfolio",
    title: "This World",
    description:
      "The page you are reading: four themed rooms of glass over a looping film, taken apart in three dimensions and rebuilt as you scroll between them.",
    insight:
      "One pool of 176 glass pieces, four arrangements — voxel grid, neural orbit, 3D viewport, radar — and a transition that flies every piece from one to the next. wgpu, WGSL, WebAssembly.",
    tags: ["3D", "Rust", "WebGPU", "WGSL", "WASM"],
    github_url: "https://github.com/xdm67x/xdm67x.github.io",
  },
  {
    id: "soft-delight",
    title: "Soft Delight",
    description: "A comfortable, eye-friendly VS Code theme for developers.",
    insight:
      "A palette tuned for long sessions: low-glare syntax colors that stay readable after dark.",
    tags: ["TypeScript", "VS Code", "Theme"],
    github_url: "https://github.com/xdm67x/soft-delight",
  },
];
