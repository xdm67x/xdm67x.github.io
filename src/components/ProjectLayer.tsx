import { ParallaxLayer } from '@react-spring/parallax';
import { useInView, useSpring, animated } from '@react-spring/web';
import { useEffect, useState } from 'react';
import type { Project } from '../data/projects';
import FloatingShapes from './FloatingShapes';
import styles from './ProjectLayer.module.css';

interface ProjectLayerProps {
  project: Project;
  offset: number;
  speed: number;
}

function ProjectLayer({ project, offset, speed }: ProjectLayerProps) {
  const [ref, inView] = useInView({ amount: 0.3, once: true });

  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const imageSpring = useSpring({
    opacity: inView ? 1 : 0,
    y: inView ? 0 : 40,
    scale: inView ? 1 : 0.95,
    immediate: reducedMotion,
    config: { tension: 120, friction: 20 },
  });

  const textSpring = useSpring({
    opacity: inView ? 1 : 0,
    y: inView ? 0 : 30,
    delay: 100,
    immediate: reducedMotion,
    config: { tension: 120, friction: 20 },
  });

  const badgeSpring = useSpring({
    opacity: inView ? 1 : 0,
    scale: inView ? 1 : 0,
    delay: 200,
    immediate: reducedMotion,
    config: { tension: 180, friction: 12 },
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
