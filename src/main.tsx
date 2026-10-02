import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from './lib/i18n';
import { TransitionProvider } from './lib/transition';
import './index.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <TransitionProvider>
          <App />
        </TransitionProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
);
