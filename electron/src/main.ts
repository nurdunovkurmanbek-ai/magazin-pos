import { app, BrowserWindow, shell } from 'electron';
import path from 'path';

/** Development режими */
const isDev = !app.isPackaged;

/** Frontend URL */
const FRONTEND_URL = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../../frontend/dist/index.html')}`;

let mainWindow: BrowserWindow | null = null;

/**
 * Башкы терезени түзүү
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Магазин POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  // Терезе даяр болгондо көрсөтүү
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Тышкы шилтемелерди браузерде ачуу
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(FRONTEND_URL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron даяр болгондо
app.whenReady().then(createWindow);

// macOS — терезе жабылгanda кайра ачуу
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Бардык терезелер жабылгanda чыгуу (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
