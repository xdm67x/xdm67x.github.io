import { Parallax } from '@react-spring/parallax';
import type { IParallax } from '@react-spring/parallax';
import type { RefObject } from 'react';
import { useEffect, useState } from 'react';
import Navigation from './Navigation';
import HeroLayer from './HeroLayer';
import ProjectLayer from './ProjectLayer';
import { projects } from '../data/projects';
import styles from './ParallaxContainer.module.css';

interface ParallaxContainerProps {
  parallaxRef: RefObject<IParallax | null>;
}

function ParallaxContainer({ parallaxRef }: ParallaxContainerProps) {
  const [activePage, setActivePage] = useState(0);

  const scrollTo = (page: number) => {
    parallaxRef.current?.scrollTo(page);
  };

  useEffect(() => {
    const parallax = parallaxRef.current;
    if (!parallax) return;

    const container = parallax.container.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      const currentPage = Math.round(scrollTop / clientHeight);
      setActivePage(currentPage);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [parallaxRef]);

  const totalPages = 1 + projects.length;
  const projectOffset = (index: number) => 1 + index;

  return (
    <div className={styles.container}>
      <Navigation scrollTo={scrollTo} activePage={activePage} />
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
