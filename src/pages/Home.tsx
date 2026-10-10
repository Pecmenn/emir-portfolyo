import { useEffect } from 'react';
import StairDivider from '../components/StairDivider';
import Contact from '../sections/Contact';
import { ServiceList, Toolkit } from '../sections/Expertise';
import Hero from '../sections/Hero';
import Manifesto from '../sections/Manifesto';
import Work from '../sections/Work';
import { usePageMeta } from '../lib/meta';
import { refreshSoon } from '../lib/scroll';

export default function Home({ ready }: { ready: boolean }) {
  usePageMeta();
  useEffect(() => {
    refreshSoon();
  }, []);

  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero ready={ready} />
      <Manifesto />
      <Work />
      {/* Basamaklı geçişler yalnızca geniş ekranda çizilir; telefonda düz koyu bant yeterlidir */}
      <div className="hidden sm:block">
        <StairDivider from="paper" to="ink" />
      </div>
      <div className="relative">
        {/* Menüdeki "Uzmanlık" bu noktaya kayar: üst menünün yüksekliği kadar yukarıda durur,
            böylece kayan yazı ve hizmet listesi birlikte tek ekranda görünür */}
        <span id="uzmanlik" aria-hidden className="absolute -top-16 sm:-top-[72px]" />
        <Toolkit />
        <div className="hidden sm:block">
          <StairDivider from="ink" to="paper" short />
        </div>
        <ServiceList />
      </div>
      <Contact />
    </main>
  );
}
