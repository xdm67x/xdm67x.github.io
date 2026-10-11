export interface Project {
  id: string;
  title: string;
  description: string;
  insight?: string;
  tags: string[];
  github_url: string;
  live_url?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "2048",
    title: "TwoZeroFourEight",
    description:
      "Classic 2048 puzzle game. Slide tiles, merge numbers, chase the ultimate score. Fully playable in the browser.",
    insight:
      "A Bevy engine shipped to WebAssembly: Rust, playable in a tab, zero install.",
    tags: ["Game", "Rust", "Bevy", "WASM"],
    github_url: "https://github.com/xdm67x/TwoZeroFourEight",
    live_url: "https://xdm67x.github.io/TwoZeroFourEight/",
  },
  {
    id: "rtk",
    title: "RTK (Rust Token Killer)",
    description: "CLI proxy that reduces LLM token consumption by 60-90%.",
    insight:
      "Contributor to a tool that strips context bloat before it reaches the model: the same workflows, a fraction of the token spend.",
    tags: ["Contributor", "Rust", "LLM", "CLI"],
    github_url: "https://github.com/rtk-ai/rtk",
  },
  {
    id: "simple-agent",
    title: "simple-agent",
    description:
      "An interactive AI coding agent that runs locally on your computer.",
    insight:
      "A local-first coding harness: agent tooling without the cloud round-trip.",
    tags: ["Go", "Coding Agent", "Harness"],
    github_url: "https://github.com/xdm67x/simple-agent",
  },
  {
    id: "cargo-feature-guard",
    title: "cargo-feature-guard",
    description: "Validate Cargo feature propagation across a workspace.",
    insight:
      "A Cargo plugin that catches feature-propagation mistakes before they reach CI.",
    tags: ["Rust", "Cargo", "Feature Guard"],
    github_url: "https://github.com/xdm67x/cargo-feature-guard",
  },
  {
    id: "quick-xml",
    title: "quick-xml",
    description: "Rust high performance xml reader and writer.",
    insight:
      "Contributions to a parser built for performance-critical Rust workloads.",
    tags: ["Contributor", "Rust", "XML"],
    github_url: "https://github.com/tafia/quick-xml",
  },
  {
    id: "electrotest",
    title: "electrotest",
    description:
      "CLI automation tool for testing Electron apps using Gherkin and CDP.",
    insight:
      "Readable Gherkin scenarios driving Electron apps over the Chrome DevTools Protocol.",
    tags: ["Rust", "Tokio", "Electron", "Testing", "CDP"],
    github_url: "https://github.com/xdm67x/electrotest",
  },
  {
    id: "soft-delight",
    title: "Soft Delight",
    description:
      "A comfortable, eye-friendly VS Code theme for developers.",
    insight:
      "A palette tuned for long sessions: low-glare syntax colors that stay readable after dark.",
    tags: ["TypeScript", "JSON", "VS Code", "Theme"],
    github_url: "https://github.com/xdm67x/soft-delight",
  },
  {
    id: "chip8",
    title: "chip8",
    description: "Chip8 emulator written in C++.",
    insight:
      "An interpreter built to understand vintage hardware from the instruction set up.",
    tags: ["C++", "CMake", "Chip8"],
    github_url: "https://github.com/dm67x/chip8",
  },
  {
    id: "portfolio",
    title: "This World",
    description:
      "The page you are reading: a portfolio tracing a path through a WebGL shader world.",
    insight:
      "Hand-written GLSL silk field, Three.js, and a scroll that makes the world breathe faster.",
    tags: ["TypeScript", "Three.js", "WebGL"],
    github_url: "https://github.com/xdm67x/xdm67x.github.io",
  },
];
