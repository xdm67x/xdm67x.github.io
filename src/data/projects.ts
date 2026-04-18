export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  techStack: string[];
  image: string;
  color: string;
  githubUrl?: string;
  liveUrl?: string;
}

export const projects: Project[] = [
  {
    id: 'cargo-feature-guard',
    title: 'cargo-feature-guard',
    description: 'Validate Cargo feature propagation across a workspace',
    longDescription: 'A Rust CLI tool that catches common mistakes like forgetting to forward a feature flag through intermediate crates. Uses cargo tree as the source of truth to detect feature gaps and verify forbidden features never leak into production builds.',
    techStack: ['Rust', 'Cargo'],
    image: '/assets/cargo-feature-guard.svg',
    color: '#CE422B',
    githubUrl: 'https://github.com/xdm67x/cargo-feature-guard',
  },
  {
    id: 'quick-xml',
    title: 'quick-xml',
    description: 'Rust high performance xml reader and writer',
    longDescription: 'Contributed performance optimizations and bug fixes to quick-xml, a Rust XML reader and writer library known for its high performance and low memory footprint.',
    techStack: ['Rust'],
    image: '/assets/quick-xml.svg',
    color: '#DEA584',
    githubUrl: 'https://github.com/xdm67x/quick-xml',
  },
  {
    id: 'electrotest',
    title: 'electrotest',
    description: 'CLI automation tool for testing Electron apps using Gherkin and CDP',
    longDescription: 'A CLI automation tool for testing Electron applications using Gherkin syntax and the Chrome DevTools Protocol (CDP). Write end-to-end tests for Electron apps using human-readable .feature files.',
    techStack: ['Rust', 'Tokio', 'CDP'],
    image: '/assets/electrotest.svg',
    color: '#47848F',
    githubUrl: 'https://github.com/xdm67x/electrotest',
  },
  {
    id: 'soft-delight',
    title: 'Soft Delight',
    description: 'A comfortable, eye-friendly VS Code theme for developers',
    longDescription: 'A comfortable, eye-friendly VS Code theme for developers who spend long hours coding. Features both a light and dark variant with carefully selected colors that provide excellent contrast without causing eye strain.',
    techStack: ['TypeScript', 'JSON', 'VS Code'],
    image: 'https://raw.githubusercontent.com/xdm67x/soft-delight/main/images/dark.png',
    color: '#6B5B95',
    githubUrl: 'https://github.com/xdm67x/soft-delight',
  },
  {
    id: 'chip8',
    title: 'chip8',
    description: 'Chip8 emulator written in C++',
    longDescription: 'A Chip8 emulator written in C++. Supports running classic Chip8 games and demos with accurate instruction emulation.',
    techStack: ['C++', 'CMake'],
    image: 'https://raw.githubusercontent.com/dm67x/chip8/main/test.png',
    color: '#4A90D9',
    githubUrl: 'https://github.com/dm67x/chip8',
  },
];

export const heroContent = {
  name: 'Mehmet Ozkan',
  title: 'Software Engineer',
  tagline: 'Video games • AI • Web Development',
  bio: 'Software engineer with a passion for video games, AI, and building web experiences.',
};
