import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Signal readiness after the scene has actually drawn, rather than at GL creation.
export default function FirstFrameReady({ onReady }: { onReady?: () => void }) {
  const sent = useRef(false), pending = useRef<number | null>(null);
  useFrame(() => {
    if (sent.current || !onReady) return;
    sent.current = true;
    pending.current = requestAnimationFrame(() => onReady());
  });
  useEffect(() => () => { if (pending.current !== null) cancelAnimationFrame(pending.current); }, []);
  return null;
}
