// Init audio player
const audioContext = new AudioContext();
const sfxPlayer = new SFXPlayer(audioContext);

// Init socket client
const sockClient = new SocketClient(sfxPlayer);
var svConfig = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
sockClient.connect(svConfig.ip, svConfig.port, sv_version, (err) => {
    if (err) throw err;
});

console.log("Sent connection request.");