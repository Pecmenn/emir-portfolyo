import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Cursor from './components/Cursor';
import Footer from './components/Footer';
import Header from './components/Header';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Project from './pages/Project';

// Sayfa değişince yeni başlığı ekran okuyucuya duyurur ve odağı ana içeriğe taşır
function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      setMessage(document.title);
      document.getElementById('main')?.focus({ preventScroll: true });
    }, 500);
    return () => window.clearTimeout(id);
  }, [pathname]);
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <Header />
      <RouteAnnouncer />
      <Routes>
        <Route path="/" element={<Home ready={ready} />} />
        <Route path="/proje/:slug" element={<Project />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <Cursor />
    </>
  );
}
