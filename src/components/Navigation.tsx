import { useEffect, useState } from 'react';
import styles from './Navigation.module.css';

const SCROLL_THRESHOLD_PX = 50;

interface NavigationProps {
  scrollTo: (page: number) => void;
  activePage?: number;
}

function Navigation({ scrollTo, activePage = 0 }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    handleScroll();
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
          aria-current={activePage === 0 ? 'page' : undefined}
        >
          About
        </button>
        <button
          type="button"
          className={`${styles.link} ${activePage >= 1 ? styles.active : ''}`}
          onClick={() => scrollTo(1)}
          aria-current={activePage >= 1 ? 'page' : undefined}
        >
          Projects
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
