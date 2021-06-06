const { app, BrowserWindow } = require('electron');
//const path = require("path");
//const fs = require("fs");
//const sock = require("./scripts_rend/socket-client");
//const { renderdistance, cl_cmds } = require('./scripts_main/gendefs');

let win;

// Global vars
//const sockClient = new sock.SocketClient();
//const sv_version = 0x020E07;

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false
    }
  });

  win.loadFile('index.html');
  win.removeMenu();
  win.webContents.openDevTools();
  win.setResizable(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});