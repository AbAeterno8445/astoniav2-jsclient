function winapi_send(data) {
    window.api.send("toMain", data);
}

window.api.receive("fromMain", (data) => {
    switch(data.res) {
        case "error": console.log("Server-side error:", data.error); break;

        case "connect_step1":
            map_renderdist = data.renderdist;
            
            winapi_send({req: "connect_sv"});
        break;

        case "conn_end": console.log("Connection to server terminated."); break;

        case "renderdata": renderMap(data.rdata.mapdata); break;

        case "chatlog": chat_logmsg(data.msg); break;

        case "playsfx": sfxPlayer.play_sfx(data.sfx); break;
    }
});

const audioContext = new AudioContext();
const sfxPlayer = new SFXPlayer(audioContext);

winapi_send({req: "connect_step1"});
console.log("Sent connection request.");