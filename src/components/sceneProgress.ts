import { createContext, useContext, useEffect, useRef } from 'react';

// Sahne ilerlemesini canlı katmanlara dağıtır: katman abone olur, her karede sahnenin 0-1 ilerlemesini alır.
// Abone olduğunda son değer hemen gelir; React durumuna yazılmaz, böylece kaydırırken yeniden çizim olmaz.
export type Subscribe = (fn: (p: number) => void) => () => void;
export const SceneProgress = createContext<Subscribe>(() => () => {});

export function useSceneProgress(fn: (p: number) => void) {
  const subscribe = useContext(SceneProgress);
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => subscribe((p) => latest.current(p)), [subscribe]);
}
