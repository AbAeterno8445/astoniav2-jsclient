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

/*ipcMain.on("toMain", (event, args) => {
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
});*/