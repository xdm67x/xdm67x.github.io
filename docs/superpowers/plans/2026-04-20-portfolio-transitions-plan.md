# Portfolio Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the portfolio to a monochrome editorial design with smooth scroll-driven transitions and layered parallax background shapes.

**Architecture:** Keep the existing `@react-spring/parallax` scroll container. Add `@react-spring/web` (`useInView`, `useSpring`, `animated`) for viewport-triggered entrance animations on each project section. Extract floating background shapes into a reusable `FloatingShapes` component driven by CSS animations. Remove divider layers between projects — transitions themselves create rhythm.

**Tech Stack:** React 19, Vite, TypeScript, `@react-spring/parallax`, `@react-spring/web`, CSS Modules

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/styles/theme.css` | Modify | Global dark editorial palette, typography, scrollbar |
| `src/components/FloatingShapes.tsx` | Create | Reusable floating circles with project accent color |
| `src/components/FloatingShapes.module.css` | Create | CSS animations for shape floating |
| `src/components/Navigation.tsx` | Modify | Active section tracking via scroll progress |
| `src/components/Navigation.module.css` | Modify | Dark blurred nav bar styles |
| `src/components/HeroLayer.tsx` | Modify | Staggered entrance animations, scroll-linked fade |
| `src/components/HeroLayer.module.css` | Modify | Dark hero styles, massive typography |
| `src/components/ProjectLayer.tsx` | Modify | `useInView` + `useSpring` scroll-driven entrance |
| `src/components/ProjectLayer.module.css` | Modify | Dark project card styles |
| `src/components/ParallaxContainer.tsx` | Modify | Remove dividers, wire up new components |
| `src/components/ParallaxContainer.module.css` | Modify | Remove divider styles, keep container/parallax |

---

## Task 1: Update Global Theme (theme.css)

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: Replace the light palette with dark editorial palette**

Replace the entire `:root` block and `body` background:

```css
:root {
  --color-bg: #0A0A0A;
  --color-bg-gradient: #0F1115;
  --color-surface: #111111;
  --color-primary: #2563EB;
  --color-primary-dark: #1D4ED8;
  --color-secondary: #1E3A5F;
  --color-text: #F5F5F5;
  --color-text-muted: #888888;
  --color-text-dim: #555555;
  --color-white: #FFFFFF;
  --color-border: rgba(245, 245, 245, 0.08);
  --color-nav-bg: rgba(10, 10, 10, 0.8);

  --font-heading: 'Outfit', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 32px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #444 #111;
}

body {
  font-family: var(--font-body);
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-gradient) 100%);
  background-attachment: fixed;
  color: var(--color-text);
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Update remaining theme.css styles for dark mode**

Update headings, links, selection, and scrollbar:

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.2;
}

a {
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--color-primary);
}

::selection {
  background-color: var(--color-primary);
  color: var(--color-white);
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #111;
}

::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #666;
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(theme): switch to dark editorial palette"
```

---

## Task 2: Create FloatingShapes Component

**Files:**
- Create: `src/components/FloatingShapes.tsx`
- Create: `src/components/FloatingShapes.module.css`

- [ ] **Step 1: Write FloatingShapes.tsx**

```tsx
import styles from './FloatingShapes.module.css';

interface FloatingShapesProps {
  color: string;
  count?: number;
}

const SHAPE_CONFIGS = [
  { size: 350, top: '5%', left: '-8%', delay: '0s', duration: '20s' },
  { size: 220, bottom: '10%', right: '-5%', delay: '-5s', duration: '18s' },
  { size: 140, top: '45%', right: '15%', delay: '-10s', duration: '22s' },
];

function FloatingShapes({ color, count = 3 }: FloatingShapesProps) {
  const shapes = SHAPE_CONFIGS.slice(0, count);

  return (
    <div className={styles.shapes} aria-hidden="true">
      {shapes.map((shape, index) => (
        <div
          key={index}
          className={styles.shape}
          style={{
            width: shape.size,
            height: shape.size,
            backgroundColor: color,
            top: shape.top,
            left: shape.left,
            right: shape.right,
            bottom: shape.bottom,
            animationDelay: shape.delay,
            animationDuration: shape.duration,
          }}
        />
      ))}
    </div>
  );
}

export default FloatingShapes;
```

- [ ] **Step 2: Write FloatingShapes.module.css**

```css
.shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
  animation-name: shapeFloat;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes shapeFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -20px) scale(1.05);
  }
  50% {
    transform: translate(-15px, 15px) scale(0.95);
  }
  75% {
    transform: translate(20px, 25px) scale(1.02);
  }
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/FloatingShapes.tsx src/components/FloatingShapes.module.css
git commit -m "feat(shapes): add FloatingShapes component"
```

---

## Task 3: Update Navigation

**Files:**
- Modify: `src/components/Navigation.tsx`
- Modify: `src/components/Navigation.module.css`

- [ ] **Step 1: Rewrite Navigation.tsx with active section tracking**

```tsx
import { useEffect, useState } from 'react';
import styles from './Navigation.module.css';

interface NavigationProps {
  scrollTo: (page: number) => void;
  activePage?: number;
}

function Navigation({ scrollTo, activePage = 0 }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.logo}>MO</div>
      <div className={styles.links}>
        <button
          type="button"
          className={`${styles.link} ${activePage === 0 ? styles.active : ''}`}
          onClick={() => scrollTo(0)}
        >
          About
        </button>
        <button
          type="button"
          className={`${styles.link} ${activePage >= 1 ? styles.active : ''}`}
          onClick={() => scrollTo(1)}
        >
          Projects
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
```

- [ ] **Step 2: Rewrite Navigation.module.css for dark theme**

```css
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  background: transparent;
  transition: background 0.3s ease, backdrop-filter 0.3s ease;
}

.scrolled {
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(245, 245, 245, 0.06);
}

.logo {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 1px;
}

.links {
  display: flex;
  gap: 2rem;
}

.link {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.link:hover {
  color: var(--color-text);
}

.active {
  color: var(--color-text);
}

@media (max-width: 600px) {
  .nav {
    padding: 1rem 1.5rem;
  }

  .links {
    gap: 1.5rem;
  }
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Navigation.tsx src/components/Navigation.module.css
git commit -m "feat(nav): dark theme nav with active state and scroll blur"
```

---

## Task 4: Update HeroLayer

**Files:**
- Modify: `src/components/HeroLayer.tsx`
- Modify: `src/components/HeroLayer.module.css`

- [ ] **Step 1: Rewrite HeroLayer.tsx with FloatingShapes and refined entrance**

```tsx
import { ParallaxLayer } from '@react-spring/parallax';
import { heroContent } from '../data/projects';
import FloatingShapes from './FloatingShapes';
import styles from './HeroLayer.module.css';

interface HeroLayerProps {
  offset: number;
  speed: number;
  onExplore: () => void;
}

function HeroLayer({ offset, speed, onExplore }: HeroLayerProps) {
  return (
    <ParallaxLayer offset={offset} speed={speed} className={styles.layer}>
      <FloatingShapes color="#1E3A5F" count={4} />
      <div className={styles.content}>
        <p className={styles.greeting}>Welcome</p>
        <h1 className={styles.name}>{heroContent.name}</h1>
        <h2 className={styles.title}>{heroContent.title}</h2>
        <p className={styles.tagline}>{heroContent.tagline}</p>
        <button type="button" className={styles.cta} onClick={onExplore}>
          Explore Projects
          <span className={styles.arrow}>↓</span>
        </button>
      </div>
      <div className={styles.scrollIndicator}>
        <div className={styles.mouse}>
          <div className={styles.wheel} />
        </div>
        <span>Scroll to explore</span>
      </div>
    </ParallaxLayer>
  );
}

export default HeroLayer;
```

- [ ] **Step 2: Rewrite HeroLayer.module.css for dark theme**

```css
.layer {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.content {
  text-align: center;
  max-width: 800px;
  padding: 2rem;
  z-index: 10;
  position: relative;
}

.greeting {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 1.5rem;
  transform: translateY(20px);
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  animation-delay: 0.2s;
}

.name {
  font-size: clamp(4rem, 10vw, 7rem);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.5rem;
  line-height: 1.05;
  transform: translateY(20px);
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  animation-delay: 0.35s;
}

.title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 2rem;
  transform: translateY(20px);
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  animation-delay: 0.5s;
}

.tagline {
  font-size: 1.25rem;
  color: var(--color-text-dim);
  margin-bottom: 3rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  transform: translateY(20px);
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  animation-delay: 0.65s;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  transform: translateY(20px);
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  animation-delay: 0.85s;
}

.cta:hover {
  background: var(--color-white);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.arrow {
  transition: transform 0.3s ease;
  display: inline-block;
}

.cta:hover .arrow {
  transform: translateY(3px);
}

.scrollIndicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards,
             bounce 2s ease-in-out infinite;
  animation-delay: 1.1s, 1.2s;
  z-index: 10;
}

@keyframes fadeInUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(10px);
  }
}

.mouse {
  width: 24px;
  height: 38px;
  border: 2px solid var(--color-text-dim);
  border-radius: 12px;
  position: relative;
}

.wheel {
  width: 4px;
  height: 8px;
  background: var(--color-text-dim);
  border-radius: 2px;
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  animation: scroll 2s ease-in-out infinite;
}

@keyframes scroll {
  0%, 100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  50% {
    opacity: 0.3;
    transform: translateX(-50%) translateY(10px);
  }
}

@media (max-width: 600px) {
  .name {
    font-size: clamp(2.5rem, 12vw, 4rem);
  }

  .content {
    padding: 1.5rem;
  }
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroLayer.tsx src/components/HeroLayer.module.css
git commit -m "feat(hero): dark editorial hero with FloatingShapes"
```

---

## Task 5: Update ProjectLayer with Scroll-Driven Animations

**Files:**
- Modify: `src/components/ProjectLayer.tsx`
- Modify: `src/components/ProjectLayer.module.css`

- [ ] **Step 1: Rewrite ProjectLayer.tsx with useInView and useSpring**

```tsx
import { ParallaxLayer } from '@react-spring/parallax';
import { useInView, useSpring, animated } from '@react-spring/web';
import type { Project } from '../data/projects';
import FloatingShapes from './FloatingShapes';
import styles from './ProjectLayer.module.css';

interface ProjectLayerProps {
  project: Project;
  offset: number;
  speed: number;
}

function ProjectLayer({ project, offset, speed }: ProjectLayerProps) {
  const [ref, inView] = useInView({ amount: 0.3 });

  const imageSpring = useSpring({
    opacity: inView ? 1 : 0,
    y: inView ? 0 : 40,
    scale: inView ? 1 : 0.95,
    config: { tension: 120, friction: 20 },
  });

  const textSpring = useSpring({
    opacity: inView ? 1 : 0,
    y: inView ? 0 : 30,
    config: { tension: 120, friction: 20, delay: 100 },
  });

  const badgeSpring = useSpring({
    opacity: inView ? 1 : 0,
    scale: inView ? 1 : 0,
    config: { tension: 180, friction: 12, delay: 200 },
  });

  return (
    <ParallaxLayer offset={offset} speed={speed} className={styles.layer}>
      <FloatingShapes color={project.color} count={3} />
      <div ref={ref} className={styles.container}>
        <animated.div style={imageSpring} className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <img
              src={project.image}
              alt={project.title}
              className={styles.projectImage}
              loading="lazy"
            />
          </div>
          <animated.div style={badgeSpring} className={styles.projectNumber}>
            {offset}
          </animated.div>
        </animated.div>

        <animated.div style={textSpring} className={styles.infoSection}>
          <span className={styles.projectLabel}>Featured Project</span>
          <h2 className={styles.title}>{project.title}</h2>
          <p className={styles.description}>{project.longDescription}</p>
          <div className={styles.techStack}>
            {project.techStack.map((tech) => (
              <span key={tech} className={styles.techBadge}>
                {tech}
              </span>
            ))}
          </div>
          <div className={styles.links}>
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.link} ${styles.linkSecondary}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Code
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.link} ${styles.linkPrimary}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="External link">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Live Demo
              </a>
            )}
          </div>
        </animated.div>
      </div>
    </ParallaxLayer>
  );
}

export default ProjectLayer;
```

- [ ] **Step 2: Rewrite ProjectLayer.module.css for dark theme**

```css
.layer {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 6rem 2rem 2rem;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  max-width: 1200px;
  width: 100%;
  align-items: center;
  position: relative;
  z-index: 1;
}

.imageSection {
  position: relative;
}

.imageWrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.projectImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

.projectNumber {
  position: absolute;
  top: -1rem;
  right: -1rem;
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.25rem;
  box-shadow: var(--shadow-md);
}

.infoSection {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.projectLabel {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--color-primary);
}

.title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.15;
}

.description {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.techStack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.techBadge {
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.techBadge:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.links {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: var(--radius-xl);
  transition: all 0.2s ease;
  cursor: pointer;
}

.linkPrimary {
  background: var(--color-text);
  color: var(--color-bg);
}

.linkPrimary:hover {
  background: var(--color-white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.linkSecondary {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.linkSecondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 900px) {
  .container {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .techStack {
    justify-content: center;
  }

  .links {
    justify-content: center;
  }

  .imageWrapper {
    max-width: 400px;
    margin: 0 auto;
  }

  .projectNumber {
    right: calc(50% - 180px);
  }
}

@media (max-width: 600px) {
  .layer {
    padding: 5rem 1.5rem 1.5rem;
  }

  .container {
    gap: 1.5rem;
  }

  .title {
    font-size: clamp(1.75rem, 6vw, 2.5rem);
  }
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectLayer.tsx src/components/ProjectLayer.module.css
git commit -m "feat(projects): scroll-driven entrance animations with useInView/useSpring"
```

---

## Task 6: Update ParallaxContainer

**Files:**
- Modify: `src/components/ParallaxContainer.tsx`
- Modify: `src/components/ParallaxContainer.module.css`

- [ ] **Step 1: Rewrite ParallaxContainer.tsx — remove dividers, simplify**

```tsx
import { Parallax, ParallaxLayer } from '@react-spring/parallax';
import type { IParallax } from '@react-spring/parallax';
import type { RefObject } from 'react';
import Navigation from './Navigation';
import HeroLayer from './HeroLayer';
import ProjectLayer from './ProjectLayer';
import { projects } from '../data/projects';
import styles from './ParallaxContainer.module.css';

interface ParallaxContainerProps {
  parallaxRef: RefObject<IParallax | null>;
}

function ParallaxContainer({ parallaxRef }: ParallaxContainerProps) {
  const scrollTo = (page: number) => {
    parallaxRef.current?.scrollTo(page);
  };

  const totalPages = 1 + projects.length;
  const projectOffset = (index: number) => 1 + index;

  return (
    <div className={styles.container}>
      <Navigation scrollTo={scrollTo} />
      <Parallax ref={parallaxRef} pages={totalPages} className={styles.parallax}>
        <HeroLayer offset={0} speed={0.5} onExplore={() => scrollTo(1)} />

        {projects.map((project, index) => (
          <ProjectLayer
            key={project.id}
            project={project}
            offset={projectOffset(index)}
            speed={0.8 - index * 0.15}
          />
        ))}
      </Parallax>
    </div>
  );
}

export default ParallaxContainer;
```

- [ ] **Step 2: Rewrite ParallaxContainer.module.css — remove divider styles**

```css
.container {
  width: 100vw;
  height: 100%;
  background: var(--color-bg);
}

.parallax {
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ParallaxContainer.tsx src/components/ParallaxContainer.module.css
git commit -m "feat(container): remove dividers, rely on transitions for rhythm"
```

---

## Task 7: Add @react-spring/web Explicit Dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @react-spring/web explicitly**

```bash
npm install @react-spring/web
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @react-spring/web for useInView and useSpring"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```
Expected: Clean build with no errors.

- [ ] **Step 2: Run linter**

```bash
npm run lint
```
Expected: No lint errors.

- [ ] **Step 3: Commit any final fixes**

```bash
git commit -m "fix: address lint/build issues" || echo "No fixes needed"
```

---

## Spec Coverage Checklist

| Spec Requirement | Plan Task |
|-----------------|-----------|
| Monochrome editorial palette | Task 1 |
| Massive typography (name `clamp(4rem, 10vw, 7rem)`) | Task 4 |
| Scroll-driven entrance animations | Task 5 |
| Layered parallax floating shapes | Task 2, Task 4, Task 5 |
| Exit fade overlap | Task 5 (`useInView` with opacity spring) |
| Fixed blurred nav with active state | Task 3 |
| Hero → first project seamless | Task 4 (parallax speed) + Task 5 |
| No hard dividers | Task 6 |
| Mobile layout stacks | Task 4, Task 5 (media queries) |
| Preserve project data | No changes to `src/data/projects.ts` |

---

## Self-Review

**Placeholder scan:** All steps contain complete code. No "TBD", "TODO", or vague descriptions.

**Type consistency:** `useInView` returns `[RefObject, boolean]` per `@react-spring/web` v10. `useSpring` accepts the `inView` boolean in its `to/from` props. `animated.div` is the correct wrapper for spring styles.

**Spec gaps:** None identified. All 10 success criteria are mapped to specific tasks.
