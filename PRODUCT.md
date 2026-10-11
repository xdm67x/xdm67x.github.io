# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Bun + Vite + Three.js (user-confirmed). Static SPA bundled to `dist/`, deployed to GitHub Pages on push to `main`. No Rust/Leptos/Trunk.

## Users

Recruiters, engineers, and potential collaborators evaluating Mehmet Ozkan for software engineering roles — people skimming a portfolio to judge skill, depth, and personality in under two minutes.

## Product Purpose

Personal portfolio for Mehmet Ozkan: present his projects and experience, land interviews and interesting collaborations. Success = a visitor understands his range (product engineering at Doctolib, VR/AR research, AI tooling, systems programming side quests) and reaches his GitHub, LinkedIn, or email.

## Positioning

A professional portfolio that traces a path: one continuous WebGL shader world (night, dawn, dusk, aurora) that the visitor travels section by section, with a waypoint rail marking progress. The world carries the atmosphere; the content stays strictly professional and factual.

## Operating Context

Deployed at https://xdm67x.github.io via GitHub Actions on push to `main`. Must perform on mid-range laptops and mobile; the WebGL layer must degrade gracefully.

## Capabilities and Constraints

- Single-page site, four sections: intro (hero), experience (path timeline), projects, contact.
- WebGL shader background animates continuously and reacts to scroll and pointer; a fixed waypoint rail traces scroll progress and jumps between sections.
- Real, factual content only — from the curated project list and the CV (repo `xdm67x/resume.pdf`, private). No invented job titles, dates, or claims.
- Stats/skills section intentionally removed (user decision, 2026-10-11 revamp).
- Gaming chrome removed in the 2026-10-11 revamp: no boot sequence, no game HUD, no pixel fonts, no quest vocabulary. Professional register throughout.
- Contact: m-ozkan@outlook.fr, linkedin.com/in/dm67x, github.com/xdm67x. Based in Niort, France.

## Brand Commitments

- Name: Mehmet Ozkan (GitHub handle xdm67x).
- Professional register; the shader world provides atmosphere, never gimmickry.
- The path/journey structure (timeline + waypoint rail) is the site's organizing idea.

## Evidence on Hand

- Projects with descriptions, tags, links: `src/data.ts` (9 projects, kept per user decision — including Rust ones).
- Experience/education from `Mehmet_Ozkan_CV.pdf` (repo `xdm67x/resume.pdf`):
  - Software Engineer, Doctolib (Paris/Niort), Jan 2021–Present. Core product & domain engineering for Doctolib Médecin: billing features; 6-month German-market EHR initiative with a smart coding engine. AI integration & enablement: led AI adoption across engineering teams, built AI skills/agentic workflows/test harnesses, delivered internal training.
  - Software Engineering Intern (R&D), ICube Laboratory (CNRS), Strasbourg, Jan–Jul 2020. VR/AR environments in Unity3D/C#; Mapbox/WrldAPI cartography in 3D spaces; mixed-reality prototyping and user testing.
  - Publication: "Interactions with a Hybrid Map for Navigation Information Visualization in Virtual Reality" (co-author, peer-reviewed, ICube 2020).
  - Master's in Computer Science, University of Strasbourg, 2020 — Computer Graphics, Imaging & 3D.

## Product Principles

- The path metaphor is load-bearing: the timeline, the rail, and the biome journey are one idea.
- Factual content, professional frame — the shader provides mood, never claims.
- Atmosphere is continuous: one evolving shader world, not decorated sections.
- Performance and accessibility are part of the craft: reduced-motion users get a static world; the site works without WebGL.

## Accessibility & Inclusion

Respect `prefers-reduced-motion`; keep text contrast readable over animated backgrounds; keyboard-navigable rail and links.
