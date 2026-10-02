import { useEffect, useState } from 'react';

// Basit adres yönlendirmesi: #/projeler/nova-kimlik → ['projeler', 'nova-kimlik']
export function useRoute() {
  const read = () =>
    window.location.hash
      .replace(/^#\/?/, '')
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const go = (...parts: string[]) => {
  window.location.hash = '/' + parts.map(encodeURIComponent).join('/');
};

export const href = (...parts: string[]) => '#/' + parts.map(encodeURIComponent).join('/');
