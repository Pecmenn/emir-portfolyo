import { useEffect } from 'react';
import StairDivider from '../components/StairDivider';
import Contact from '../sections/Contact';
import { ServiceList, Toolkit } from '../sections/Expertise';
import Hero from '../sections/Hero';
import Manifesto from '../sections/Manifesto';
import Work from '../sections/Work';
import { refreshSoon } from '../lib/scroll';

export default function Home({ ready }: { ready: boolean }) {
  useEffect(() => {
    refreshSoon();
  }, []);

  return (
    <main>
      <Hero ready={ready} />
      <Manifesto />
      <Work />
      <StairDivider from="paper" to="ink" />
      <Toolkit />
      <StairDivider from="ink" to="paper" />
      <ServiceList />
      <Contact />
    </main>
  );
}
