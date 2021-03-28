// Init audio player
const audioContext = new AudioContext();
const sfxPlayer = new SFXPlayer(audioContext);

// Player
const mainPlayer = new MainPlayer();

// Init game renderer
const gameRenderer = new GameRenderer(mainPlayer);

// Init socket client
const sockClient = new SocketClient(mainPlayer, gameRenderer, sfxPlayer);

var svConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), 'utf-8'));
sockClient.connect(svConfig.ip, svConfig.port, sv_version, (err) => {
    if (err) throw err;
});

console.log("Sent connection request.");