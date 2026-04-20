import styles from './FloatingShapes.module.css';

interface FloatingShapesProps {
  color: string;
  count?: number;
}

const shapeConfigs = [
  { width: 400, height: 400, top: '10%', left: '-150px', delay: '0s' },
  { width: 250, height: 250, bottom: '15%', right: '-80px', delay: '-5s' },
  { width: 150, height: 150, top: '40%', right: '20%', delay: '-10s', opacity: 0.05 },
  { width: 300, height: 300, top: '60%', left: '10%', delay: '-7s' },
];

function FloatingShapes({ color, count = 3 }: FloatingShapesProps) {
  return (
    <div className={styles.shapes}>
      {shapeConfigs.slice(0, count).map((config, index) => (
        <div
          key={index}
          className={styles.shape}
          style={{
            width: config.width,
            height: config.height,
            background: color,
            top: config.top,
            left: config.left,
            right: config.right,
            bottom: config.bottom,
            opacity: config.opacity ?? 0.08,
            animationDelay: config.delay,
          }}
        />
      ))}
    </div>
  );
}

export default FloatingShapes;
