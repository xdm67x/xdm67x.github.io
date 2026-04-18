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
  const dividerOffset = (index: number) => 1.85 + index;

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

        {projects.slice(1).map((project, index) => (
          <ParallaxLayer key={`divider-${project.id}`} offset={dividerOffset(index)} speed={0.3} className={styles.divider}>
            <div className={styles.dividerLine} />
            <div className={styles.scrollHint}>
              <div className={styles.mouse}>
                <div className={styles.wheel} />
              </div>
              <span className={styles.scrollText}>scroll</span>
            </div>
            <div className={styles.dividerLine} />
          </ParallaxLayer>
        ))}
      </Parallax>
    </div>
  );
}

export default ParallaxContainer;
