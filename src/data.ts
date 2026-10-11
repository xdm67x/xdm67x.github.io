export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  color: string;
  github_url: string;
  play_url?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "2048",
    title: "TwoZeroFourEight",
    description:
      "Classic 2048 puzzle game. Slide tiles, merge numbers, chase the ultimate score. Fully playable in the browser.",
    tags: ["Game", "Rust", "Bevy", "WASM"],
    color: "#edcf72",
    github_url: "https://github.com/xdm67x/TwoZeroFourEight",
    play_url: "https://xdm67x.github.io/TwoZeroFourEight/",
  },
  {
    id: "rtk",
    title: "RTK (Rust Token Killer)",
    description: "CLI proxy that reduces LLM token consumption by 60-90%.",
    tags: ["Contributor", "Rust", "LLM", "CLI"],
    color: "#DEA584",
    github_url: "https://github.com/rtk-ai/rtk",
  },
  {
    id: "simple-agent",
    title: "simple-agent",
    description:
      "An interactive AI coding agent that runs locally on your computer.",
    tags: ["Go", "Coding Agent", "Harness"],
    color: "#22d3ee",
    github_url: "https://github.com/xdm67x/simple-agent",
  },
  {
    id: "cargo-feature-guard",
    title: "cargo-feature-guard",
    description: "Validate Cargo feature propagation across a workspace.",
    tags: ["Rust", "Cargo", "Feature Guard"],
    color: "#CE422B",
    github_url: "https://github.com/xdm67x/cargo-feature-guard",
  },
  {
    id: "quick-xml",
    title: "quick-xml",
    description: "Rust high performance xml reader and writer.",
    tags: ["Contributor", "Rust", "XML"],
    color: "#DEA584",
    github_url: "https://github.com/tafia/quick-xml",
  },
  {
    id: "electrotest",
    title: "electrotest",
    description:
      "CLI automation tool for testing Electron apps using Gherkin and CDP.",
    tags: ["Rust", "Tokio", "Electron", "Testing", "CDP"],
    color: "#47848F",
    github_url: "https://github.com/xdm67x/electrotest",
  },
  {
    id: "soft-delight",
    title: "Soft Delight",
    description:
      "A comfortable, eye-friendly VS Code theme for developers.",
    tags: ["TypeScript", "JSON", "VS Code", "Theme"],
    color: "#6B5B95",
    github_url: "https://github.com/xdm67x/soft-delight",
  },
  {
    id: "chip8",
    title: "chip8",
    description: "Chip8 emulator written in C++.",
    tags: ["C++", "CMake", "Chip8"],
    color: "#4A90D9",
    github_url: "https://github.com/dm67x/chip8",
  },
  {
    id: "portfolio",
    title: "This World",
    description:
      "The page you are playing right now: a WebGL shader world staged as a playable adventure.",
    tags: ["TypeScript", "Three.js", "WebGL"],
    color: "#F74C00",
    github_url: "https://github.com/xdm67x/xdm67x.github.io",
  },
];

export interface StatSlot {
  abbr: string;
  name: string;
}

export const LANGUAGES: StatSlot[] = [
  { abbr: "Rs", name: "Rust" },
  { abbr: "Py", name: "Python" },
  { abbr: "TS", name: "JS / TypeScript" },
  { abbr: "Kt", name: "Kotlin" },
  { abbr: "Go", name: "Go" },
  { abbr: "C#", name: "C#" },
  { abbr: "Gd", name: "GDScript" },
];

export const TOOLS: StatSlot[] = [
  { abbr: "Gt", name: "Git" },
  { abbr: "Re", name: "React" },
  { abbr: "Dk", name: "Docker" },
  { abbr: "Nd", name: "Node.js" },
  { abbr: "Sp", name: "Spring Boot" },
  { abbr: "AI", name: "Claude Code" },
  { abbr: "OC", name: "OpenCode" },
  { abbr: "Go", name: "Godot" },
  { abbr: "U3", name: "Unity3D" },
];

export const TRAITS: string[] = [
  "Technical communication",
  "Fast adaptability",
  "Mentoring & training",
];

export const PARTY_LANGUAGES: string[] = [
  "French — native",
  "English — professional",
  "Turkish — fluent",
];
