import styles from './Navigation.module.css';

interface NavigationProps {
  scrollTo: (page: number) => void;
}

function Navigation({ scrollTo }: NavigationProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>MO</div>
      <div className={styles.links}>
        <button type="button" className={styles.link} onClick={() => scrollTo(1)}>Projects</button>
        <button type="button" className={styles.link} onClick={() => scrollTo(0)}>About</button>
      </div>
    </nav>
  );
}

export default Navigation;
