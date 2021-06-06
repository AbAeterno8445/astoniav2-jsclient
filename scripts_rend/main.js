// Init audio player
const audioContext = new AudioContext();
const sfxPlayer = new SFXPlayer(audioContext);

// Player
const mainPlayer = new MainPlayer();

// Init game renderer
const gameRenderer = new GameRenderer(mainPlayer);

// Init socket client
const sockClient = new SocketClient(mainPlayer, gameRenderer, sfxPlayer, {
    ip: gameConfig.ip,
    port: gameConfig.port,
    version: sv_version
});

// Login handler (character selection/creation)
const loginHandler = new LoginHandler(mainPlayer, sockClient);
loginHandler.updateCharSelect();
loginHandler.updateNewcharPreview();