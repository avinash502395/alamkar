const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

let mainWindow;
let db = null;

// Load database first, with error handling
try {
  db = require('./db');
} catch (err) {
  console.error('FATAL: Could not load database module', err);
  app.whenReady().then(() => {
    dialog.showErrorBox(
      'Database Error',
      'Could not load the database.\n\n' + err.message +
      '\n\nTry running: npm install\nThen restart the app.'
    );
    app.quit();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    title: 'Alankar Pooja Stores',
    backgroundColor: '#EEE5D3',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.setMenuBarVisibility(false);

  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Backup database…', click: handleBackup },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Alankar Pooja Stores',
              message: 'Alankar Pooja Stores',
              detail: 'Sales Management System\nVersion 1.0.5\n\nLocal SQLite storage. Offline-first.\nWith TVS barcode scanner support.',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function handleBackup() {
  if (!db) { dialog.showErrorBox('Backup error', 'Database not loaded'); return; }
  const dbPath = db.Backup.getDbPath();
  const defaultName = 'alankar-backup-' + new Date().toISOString().split('T')[0] + '.db';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Backup database',
    defaultPath: defaultName,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
  });
  if (!result.canceled && result.filePath) {
    try {
      fs.copyFileSync(dbPath, result.filePath);
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: 'Backup successful',
        detail: 'Saved to: ' + result.filePath,
      });
    } catch (err) {
      dialog.showErrorBox('Backup failed', err.message);
    }
  }
}

// Wrap a handler with error logging — so errors don't silently fail
function safeHandle(channel, fn) {
  ipcMain.handle(channel, async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error('[IPC ERROR]', channel, err);
      throw new Error(err.message || String(err));
    }
  });
}

// REGISTER ALL IPC HANDLERS BEFORE createWindow — eliminates race condition
function registerHandlers() {
  if (!db) return;
  const { Products, Customers, Bills, Stock, Credit, Reports, Settings, Backup, Maintenance } = db;

  safeHandle('products:list',        ()           => Products.list());
  safeHandle('products:byId',        (_, id)      => Products.byId(id));
  safeHandle('products:byBarcode',   (_, bc)      => Products.byBarcode(bc));
  safeHandle('products:smartLookup', (_, code)    => Products.smartLookup(code));
  safeHandle('products:nextQuickCode', ()         => Products.nextQuickCode());
  safeHandle('products:insert',      (_, p)       => Products.insert(p));
  safeHandle('products:update',      (_, p)       => Products.update(p));
  safeHandle('products:remove',      (_, id)      => Products.remove(id));
  safeHandle('products:adjustStock', (_, id, d)   => Products.adjustStock(id, d));

  safeHandle('customers:list',    ()       => Customers.list());
  safeHandle('customers:byPhone', (_, ph)  => Customers.byPhone(ph));
  safeHandle('customers:insert',  (_, c)   => Customers.insert(c));

  safeHandle('bills:save',  (_, b, items) => Bills.save(b, items));
  safeHandle('bills:list',  (_, f, t, m)  => Bills.list(f, t, m));
  safeHandle('bills:byId',  (_, id)       => Bills.byId(id));
  safeHandle('bills:items', (_, id)       => Bills.items(id));

  safeHandle('stock:add',     (_, e) => Stock.add(e));
  safeHandle('stock:history', ()     => Stock.history());

  safeHandle('credit:recordPayment', (_, p) => Credit.recordPayment(p));
  safeHandle('credit:entries',       ()    => Credit.entries());
  safeHandle('credit:payments',      ()    => Credit.payments());
  safeHandle('credit:totals',        ()    => Credit.totals());

  safeHandle('reports:dashboard', ()      => Reports.dashboard());
  safeHandle('reports:gst',       (_, m)  => Reports.gst(m));
  safeHandle('reports:gstFull',   (_, m)  => Reports.gstFull(m));
  safeHandle('reports:monthly',   (_, m)  => Reports.monthly(m));

  safeHandle('settings:getAll',  ()           => Settings.getAll());
  safeHandle('settings:set',     (_, k, v)    => Settings.set(k, v));
  safeHandle('settings:setMany', (_, obj)     => Settings.setMany(obj));

  safeHandle('backup:export',    () => handleBackup());
  safeHandle('backup:getDbPath', () => Backup.getDbPath());

  safeHandle('maintenance:clearTestData', () => Maintenance.clearTestData());

  // Silent auto-backup to user-configured folder (or default to Documents/AlankarBackups)
  // Returns { ok, path, error } — used both manually and on app-close
  safeHandle('backup:auto', async (_, folder) => {
    try {
      const dbPath = Backup.getDbPath();
      if (!fs.existsSync(dbPath)) {
        return { ok: false, error: 'Database file not found' };
      }
      // Default folder: Documents/AlankarBackups
      const defaultFolder = path.join(app.getPath('documents'), 'AlankarBackups');
      const targetFolder = folder && folder.trim() ? folder.trim() : defaultFolder;
      // Create folder if missing
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }
      // Backup file name: alankar-backup-YYYY-MM-DD_HH-MM.db
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const backupName = `alankar-backup-${stamp}.db`;
      const backupPath = path.join(targetFolder, backupName);
      fs.copyFileSync(dbPath, backupPath);
      // Cleanup old backups — keep only last 14
      try {
        const files = fs.readdirSync(targetFolder)
          .filter(f => f.startsWith('alankar-backup-') && f.endsWith('.db'))
          .map(f => ({ name: f, path: path.join(targetFolder, f), mtime: fs.statSync(path.join(targetFolder, f)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);
        if (files.length > 14) {
          files.slice(14).forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
        }
      } catch (e) { /* ignore cleanup errors */ }
      return { ok: true, path: backupPath };
    } catch (err) {
      return { ok: false, error: String(err && err.message || err) };
    }
  });

  // Let user pick a custom backup folder
  safeHandle('backup:pickFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Auto-Backup Folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths || !result.filePaths.length) {
      return { ok: false };
    }
    return { ok: true, path: result.filePaths[0] };
  });

  safeHandle('print:html', (_, htmlContent, options) => {
    options = options || {};
    return new Promise((resolve) => {
      const printWindow = new BrowserWindow({
        width: 420,
        height: 700,
        show: false,
        title: 'Print',
        parent: mainWindow,
        webPreferences: { nodeIntegration: false, sandbox: true },
      });
      printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
      printWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          const printOpts = {
            silent: options.silent || false,
            printBackground: true,
            margins: { marginType: 'none' },
            scaleFactor: 100,
          };
          if (options.deviceName) printOpts.deviceName = options.deviceName;
          if (options.pageSize) printOpts.pageSize = options.pageSize;
          printWindow.webContents.print(printOpts, (success, failureReason) => {
            printWindow.close();
            resolve({ ok: success, error: failureReason });
          });
        }, 400);
      });
    });
  });

  // List all installed printers on this system
  safeHandle('printer:list', async () => {
    try {
      const printers = await mainWindow.webContents.getPrintersAsync();
      return printers.map(p => ({
        name: p.name,
        displayName: p.displayName || p.name,
        description: p.description || '',
        status: p.status,
        isDefault: p.isDefault,
      }));
    } catch (err) {
      console.error('Error listing printers:', err);
      return [];
    }
  });

  // Open a URL in the user's default browser (used for WhatsApp Web sharing)
  safeHandle('shell:openExternal', async (_, url) => {
    try {
      // Basic safety: only allow https:// or http:// URLs
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
        return { ok: false, error: 'Only http(s) URLs are allowed' };
      }
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err && err.message || err) };
    }
  });

  // Send raw TSPL commands directly to TSC printer
  // Tries Python first (most reliable), falls back to PowerShell
  safeHandle('tsc:printRaw', async (_, printerName, tsplCommands) => {
    if (process.platform !== 'win32') {
      return { ok: false, error: 'TSC printing is only supported on Windows' };
    }
    if (!printerName) {
      return { ok: false, error: 'No printer name provided' };
    }

    const tempFile = path.join(os.tmpdir(), `alankar_tspl_${Date.now()}.bin`);
    try {
      fs.writeFileSync(tempFile, tsplCommands, 'binary');
    } catch (err) {
      return { ok: false, error: 'Could not write temp file: ' + err.message };
    }

    // === Try Python first (most reliable) ===
    const pythonScript = path.join(__dirname, 'print_tsc.py');
    if (fs.existsSync(pythonScript)) {
      const pythonResult = await new Promise((resolve) => {
        const py = spawn('python', [pythonScript, printerName, tempFile], { windowsHide: true });
        let stdout = '', stderr = '';
        py.stdout.on('data', d => stdout += d.toString());
        py.stderr.on('data', d => stderr += d.toString());
        py.on('close', (code) => {
          resolve({ code, stdout, stderr });
        });
        py.on('error', (err) => {
          resolve({ code: -1, stderr: 'Python not available: ' + err.message });
        });
      });

      if (pythonResult.code === 0) {
        try { fs.unlinkSync(tempFile); } catch (e) {}
        return { ok: true, output: pythonResult.stdout.trim(), method: 'python' };
      }
      // If Python failed but isn't missing, log and fall through to PowerShell
      console.log('[TSC] Python attempt:', pythonResult.code, pythonResult.stderr);
    }

    // === Fallback: PowerShell ===
    return new Promise((resolve) => {
      const psScript = path.join(__dirname, 'print-raw.ps1');
      if (!fs.existsSync(psScript)) {
        try { fs.unlinkSync(tempFile); } catch (e) {}
        resolve({ ok: false, error: 'Neither Python nor PowerShell script available. Install Python from python.org and run: pip install pywin32' });
        return;
      }

      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', psScript,
        '-PrinterName', printerName,
        '-FilePath', tempFile,
      ], { windowsHide: true });

      let stdout = '', stderr = '';
      ps.stdout.on('data', d => stdout += d.toString());
      ps.stderr.on('data', d => stderr += d.toString());

      ps.on('close', (code) => {
        try { fs.unlinkSync(tempFile); } catch (e) {}
        if (code === 0) {
          resolve({ ok: true, output: stdout.trim(), method: 'powershell' });
        } else {
          resolve({
            ok: false,
            error: (stderr.trim() || stdout.trim() || `Print failed (code ${code})`),
            code: code,
          });
        }
      });

      ps.on('error', (err) => {
        try { fs.unlinkSync(tempFile); } catch (e) {}
        resolve({ ok: false, error: 'Failed to start print process: ' + err.message });
      });
    });
  });

  console.log('[IPC] All handlers registered successfully');
}

app.whenReady().then(() => {
  // CRITICAL: Register handlers BEFORE creating window — no race condition possible
  registerHandlers();
  createWindow();
});

// Auto-backup on app quit if enabled in settings
let autoBackupAttempted = false;
app.on('before-quit', async (event) => {
  if (autoBackupAttempted || !db) return;
  try {
    const { Settings, Backup } = db;
    const enabled = Settings.get('auto_backup_enabled');
    if (enabled !== '1' && enabled !== 1 && enabled !== true) return;
    autoBackupAttempted = true;
    event.preventDefault();
    const folder = Settings.get('auto_backup_folder') || '';
    const dbPath = Backup.getDbPath();
    if (fs.existsSync(dbPath)) {
      const defaultFolder = path.join(app.getPath('documents'), 'AlankarBackups');
      const targetFolder = folder && folder.trim() ? folder.trim() : defaultFolder;
      if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const backupPath = path.join(targetFolder, `alankar-backup-${stamp}.db`);
      fs.copyFileSync(dbPath, backupPath);
      Settings.set('last_auto_backup', new Date().toISOString());
      try {
        const files = fs.readdirSync(targetFolder)
          .filter(f => f.startsWith('alankar-backup-') && f.endsWith('.db'))
          .map(f => ({ name: f, path: path.join(targetFolder, f), mtime: fs.statSync(path.join(targetFolder, f)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);
        if (files.length > 14) files.slice(14).forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      } catch (e) {}
      console.log('[AutoBackup] saved to:', backupPath);
    }
  } catch (err) {
    console.error('[AutoBackup] error:', err);
  } finally {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
