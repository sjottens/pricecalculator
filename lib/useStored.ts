'use client';

import { useEffect, useState } from 'react';

/**
 * State die in de browser (localStorage) bewaard blijft.
 * Wordt pas na het laden van de pagina ingelezen, zodat server- en client-render gelijk blijven.
 */
export function useStored<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) setValue((v) => ({ ...v, ...JSON.parse(s) }));
    } catch {
      /* geen opslag beschikbaar: gewoon doorgaan */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* opslag vol of geblokkeerd */
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
