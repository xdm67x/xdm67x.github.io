import { ParallaxLayer } from '@react-spring/parallax'
import { heroContent } from '../data/projects'
import FloatingShapes from './FloatingShapes'
import styles from './HeroLayer.module.css'

interface HeroLayerProps {
  offset: number
  speed: number
  onExplore: () => void
}

function HeroLayer({ offset, speed, onExplore }: HeroLayerProps) {
  return (
    <ParallaxLayer offset={offset} speed={speed} className={styles.layer}>
      <FloatingShapes color="var(--color-secondary)" count={4} />
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
  )
}

export default HeroLayer
