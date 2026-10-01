const { app, BrowserWindow, shell } = require('electron');

const SITE_URL = 'https://rebo26.netlify.app/app';
const SITE_ORIGIN = new URL(SITE_URL).origin;
const REMOVE_NETLIFY_BADGE_SCRIPT = `(() => {
  const removeBadge = () => document.getElementById('nl-badge-frame')?.remove();
  removeBadge();
  new MutationObserver(removeBadge).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();`;

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 560,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (new URL(url).origin !== SITE_ORIGIN) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== SITE_ORIGIN) {
      event.preventDefault();
    }
  });

  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript(REMOVE_NETLIFY_BADGE_SCRIPT).catch(() => {});
  });

  window.loadURL(SITE_URL);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
