# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Bun + Vite + Three.js (user-confirmed). Static SPA bundled to `dist/`, deployed to GitHub Pages on push to `main`. No Rust/Leptos/Trunk.

## Users

Recruiters, engineers, and potential collaborators evaluating Mehmet Ozkan for software engineering roles — people skimming a portfolio to judge skill, depth, and personality in under two minutes.

## Product Purpose

Personal portfolio for Mehmet Ozkan: present his projects and experience, land interviews and interesting collaborations. Success = a visitor understands his range (product engineering at Doctolib, VR/AR research, AI tooling, game/emulator side quests) and reaches his GitHub, LinkedIn, or email.

## Positioning

A portfolio staged as a playable game: WebGL shader-driven world whose atmosphere evolves as the visitor travels through it. The visitor does not read a document; they progress through an adventure — quests are experience entries, inventory items are projects, stats are skills.

## Operating Context

Deployed at https://xdm67x.github.io via GitHub Actions on push to `main`. Must perform on mid-range laptops and mobile; the WebGL layer must degrade gracefully.

## Capabilities and Constraints

- Single-page site, sections: title screen (hero), journey (experience), quests (projects), stats (skills), continue/contact.
- WebGL shader background must animate continuously and react to scroll and pointer.
- Real, factual content only — from `src/projects.json` (curated list) and the resume PDF (repo `xdm67x/resume.pdf`, private). No invented job titles, dates, or claims.
- Contact: m-ozkan@outlook.fr, linkedin.com/in/dm67x, github.com/xdm67x. Based in Niort, France.

## Brand Commitments

- Name: Mehmet Ozkan (GitHub handle xdm67x).
- Voice: playful gamer register ("Ready to join your squad", player/quest/HUD vocabulary) without hiding professional substance.
- Gaming-adventure visual world with WebGL shaders is pinned by the user's brief.

## Evidence on Hand

- Projects with descriptions, tags, links: `src/projects.json` (9 projects, kept per user decision — including Rust projects).
- Experience/education/skills/languages: extracted from `Mehmet_Ozkan_CV.pdf` (repo `xdm67x/resume.pdf`):
  - Software Engineer, Doctolib (Paris/Niort), Jan 2021–Present. Core product & domain engineering for Doctolib Médecin: billing features; 6-month German-market EHR initiative with a smart coding engine. AI integration & enablement: led AI adoption across engineering teams, built AI skills/agentic workflows/test harnesses, delivered internal training.
  - Software Engineering Intern (R&D), ICube Laboratory (CNRS), Strasbourg, Jan–Jul 2020. VR/AR environments in Unity3D/C#; Mapbox/WrldAPI cartography in 3D spaces; mixed-reality prototyping and user testing.
  - Publication: "Interactions with a Hybrid Map for Navigation Information Visualization in Virtual Reality" (co-author, peer-reviewed, ICube 2020).
  - Master's in Computer Science, University of Strasbourg, 2020 — Computer Graphics, Imaging & 3D.
  - Languages: Rust, Python, JS/TS, Kotlin, Go, C#, GDScript. Tools: Git, React, Docker, Node.js, Spring Boot, Claude Code, OpenCode, Godot, Unity3D. Spoken: French (native), English (professional), Turkish (fluent).

## Product Principles

- The game metaphor is load-bearing: every section maps to a game concept, and every game concept maps to real content.
- Factual content, playful frame — never the reverse.
- Atmosphere is continuous: one evolving shader world, not separate decorated sections.
- Accessibility and performance are gameplay too: reduced-motion users get a static world; the site works without WebGL.

## Accessibility & Inclusion

Respect `prefers-reduced-motion`; keep text contrast readable over animated backgrounds; keyboard-navigable nav.
