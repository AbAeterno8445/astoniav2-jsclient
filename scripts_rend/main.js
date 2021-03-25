/*window.api.receive("fromMain", (data) => {
    switch(data.res) {
        case "error": console.log("Server-side error:", data.error); break;

        case "connect_step1":
            renderdistance = data.renderdist;
            
            winapi_send({req: "connect_sv"});
        break;

        case "conn_end": console.log("Connection to server terminated."); break;

        case "renderdata": renderMap(data.rdata.mapdata); break;

        case "chatlog": chat_logmsg(data.msg); break;

        case "playsfx": sfxPlayer.play_sfx(data.sfx); break;
    }
});*/

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