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
