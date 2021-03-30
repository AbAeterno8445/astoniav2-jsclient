// Init audio player
const audioContext = new AudioContext();
const sfxPlayer = new SFXPlayer(audioContext);

// Player
const mainPlayer = new MainPlayer();

// Init game renderer
const gameRenderer = new GameRenderer(mainPlayer);

// Init socket client
var svConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), 'utf-8'));
const sockClient = new SocketClient(mainPlayer, gameRenderer, sfxPlayer, {
    ip: svConfig.ip,
    port: svConfig.port,
    version: sv_version
});

// Login handler (character selection/creation)
const loginHandler = new LoginHandler(mainPlayer, sockClient);
loginHandler.updateCharSelect();
loginHandler.updateNewcharPreview();

/*sockClient.connect(svConfig.ip, svConfig.port, sv_version, (err) => {
    if (err) throw err;
});*/

//console.log("Sent connection request.");