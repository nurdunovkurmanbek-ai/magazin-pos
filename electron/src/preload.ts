import { contextBridge } from 'electron';

/**
 * Preload скрипт — renderer процесс менен коопсуз байланыш
 * contextBridge аркылуу чектелген API экспорттоо
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Платформа маалыматы */
  platform: process.platform,

  /** Desktop версиясы */
  isDesktop: true,
});

// TypeScript типтери frontend үчүн
export interface ElectronAPI {
  platform: NodeJS.Platform;
  isDesktop: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
