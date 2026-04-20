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
