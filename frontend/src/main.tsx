import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { StoreSettingsProvider } from '@/providers/StoreSettingsProvider';
import '@/i18n';
import '@/index.css';
import { AppRouter } from '@/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <StoreSettingsProvider>
        <AppRouter />
      </StoreSettingsProvider>
    </ThemeProvider>
  </StrictMode>
);
