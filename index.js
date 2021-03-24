const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");
const fs = require("fs");
const sock = require("./scripts_main/socket-client");
const { renderdistance, cl_cmds } = require('./scripts_main/gendefs');

let win;

// Global vars
const sockClient = new sock.SocketClient();
const sv_version = 0x020E07;

let win_closed = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile('index.html');
  win.removeMenu();
  win.webContents.openDevTools();
  win.setResizable(false);
  win.on('closed', () => { win_closed = true; });
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

// Main API
function rendSendData(data) {
  if (win_closed) return;
  var t1 = new Date().getTime();
  win.webContents.send("fromMain", data);
  console.log(data);
  console.log("rendSendData took", new Date().getTime() - t1, "ms");
}

function rendSendError(err) {
  rendSendData({ res: "error", error: err });
}

sockClient.set_rend_data_func(rendSendData);

ipcMain.on("toMain", (event, args) => {
  switch(args.req) {
    case "connect_step1":
      rendSendData({
        res: "connect_step1",
        renderdist: renderdistance
      });
    break;

    case "connect_sv":
      console.log("Received connection request.");

      sockClient.render_senddata();
      var configData = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
      sockClient.connect(configData.ip, configData.port, sv_version, (err) => {
        if (err) {
          rendSendError(err);
          console.log(err);
          return;
        }
      });
    break;

    case "cmd_walk":
      sockClient.send_client_command(cl_cmds["CL_CMD_MOVE"], {
        x: args.x,
        y: args.y
      });
    break;

    case "rendertest":
      sockClient._renderengine.map_shift_left();
      sockClient.render_senddata();
    break;
  }
});