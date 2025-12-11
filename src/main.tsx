import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

import App from './App.tsx';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { WagmiProviderComp } from './lib/wagmi-provider.tsx';

import './index.scss';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://1519e9fa59efd87d0d7197d8edac1790@o4507051622072320.ingest.us.sentry.io/4511540165869568',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProviderComp>
      <TooltipProvider>
        <App />
      </TooltipProvider>
      <Toaster richColors />
    </WagmiProviderComp>
  </StrictMode>,
);
