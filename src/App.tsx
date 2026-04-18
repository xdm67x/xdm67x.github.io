import { useRef } from 'react';
import type { IParallax } from '@react-spring/parallax';
import ParallaxContainer from './components/ParallaxContainer';
import './styles/theme.css';

function App() {
  const parallaxRef = useRef<IParallax>(null);

  return <ParallaxContainer parallaxRef={parallaxRef} />;
}

export default App;
