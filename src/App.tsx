import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Cursor from './components/Cursor';
import Footer from './components/Footer';
import Header from './components/Header';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Project from './pages/Project';

export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <Header />
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
