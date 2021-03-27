//const net = require("net");
//const { ServerCMDDispatcher } = require("../scripts_main/sv-funcs");
//const { sv_cmds, cl_cmds, renderdistance } = require("../scripts_main/gendefs");
//const { RenderEngine } = require("../scripts_main/render-engine");

class SocketClient {
    constructor(sfx_player) {
        this._sfx_player = sfx_player;
        this._renderengine = new RenderEngine();
        this._cmd_dispatcher = new ServerCMDDispatcher(this._renderengine, this._sfx_player);
        this._init();
    }

    _init() {
        this.sv_ip = "0.0.0.0";
        this.sv_port = 0;
        this.sv_version = 0;

        this._client = null;
        this._tickbuf = new Array(); // Buffer with received data

        this.quit = 0;

        this._lastn = 0; // used in sv_setmap

        this.logged = false; // Logged-in state

        this._cmd_dispatcher.exit = 0;
    }

    connect(ip, port, version, callback) {
        this.sv_ip = ip;
        this.sv_port = port;
        this.sv_version = version;

        this._client = net.createConnection({ host: this.sv_ip, port: this.sv_port }, () => {
            console.log("connected to server.");
            var buf = Buffer.alloc(16);
            buf[0] = cl_cmds["CL_NEWLOGIN"];
            this._client.write(buf);

            try {
                this.render_engine_loop();
            } catch (err) {
                callback(err);
            }

            callback(null);
        });

        this._client.on('error', (err) => callback(err));

        this._client.on('data', (data) => this._recv_data(data));

        this._client.on('end', () => {
            console.log("disconnected from server.");
            this._init();
        });
    }

    _recv_data(data) {
        this._tickbuf.push(...data);
        //this.render_engine_loop();
    }

    // Login-process related server commands
    _login_proc() {
        var buf = Buffer.from(this._tickbuf);
        if (buf.length < 2) return;

        switch(buf[0]) {
            case sv_cmds["SV_CHALLENGE"]:
                setTimeout(() => {
                    console.log("sent challenge.");
                    var buf_ans = Buffer.alloc(16);
                    buf_ans[0] = cl_cmds["CL_CHALLENGE"];
                    buf_ans.writeUInt8(123, 1);
                    buf_ans.writeUInt32LE(this.sv_version, 5);
                    this._client.write(buf_ans);
                }, 500);
            break;

            case sv_cmds["SV_NEWPLAYER"]:
                this.logged = true;
                console.log("logged in as new character.");
            break;

            case sv_cmds["SV_LOGIN_OK"]:
                this.logged = true;
                console.log("logged in.");
            break;

            case sv_cmds["SV_EXIT"]: break;

            case sv_cmds["SV_CAP"]: break;
        }

        // All login process packets are 16 bytes - change this if a difference arises
        this._tickbuf = this._tickbuf.slice(16);
    }

    _tick_do() {
        if (this._tickbuf.length < 2) return 0;

        if (!this.logged) {
            this._login_proc();
            return 0;
        }

        while(this._tickbuf.length >= 2) {
            var data = Buffer.from(this._tickbuf);
            var buf = new Array();
            var len = data.readUInt16LE(0) & 0x7fff;
            if (len > this._tickbuf.length) return 0;

            var csize = len - 2;
            if (csize) buf = this._tickbuf.slice(2);

            this._cmd_dispatcher.lastn = -1; // reset sv_setmap
            
            var idx = 0;
            while (idx < csize && idx < buf.length) {
                var ret = this._cmd_dispatcher.sv_cmd(buf.slice(idx));
                if (ret == -1) {
                    this._client.end();
                    throw "syntax error in server data";
                }
                idx += ret;
            }

            if (this._tickbuf.length) this._tickbuf = this._tickbuf.slice(len);
        }
    }

    send_client_command(cmd, data) {
        var buf = Buffer.alloc(16);
        buf[0] = cmd;

        switch(cmd) {
            case cl_cmds["CL_CMD_CTICK"]:
                buf.writeInt32LE(this._renderengine.ticker, 1);
            break;

            case cl_cmds["CL_CMD_AUTOLOOK"]:
                buf.writeInt32LE(data.ch_nr, 1);
            break;

            case cl_cmds["CL_CMD_MOVE"]:
            case cl_cmds["CL_CMD_TURN"]:
            case cl_cmds["CL_CMD_USE"]:
            case cl_cmds["CL_CMD_LOOK_ITEM"]:
            case cl_cmds["CL_CMD_PICKUP"]:
            case cl_cmds["CL_CMD_DROP"]:
                if (data.x < 0 || data.y < 0 || data.x > renderdistance || data.y > renderdistance) return;

                var tcoords = this._renderengine.get_tile_coords(data.x, data.y);
                if (!tcoords) return;

                buf.writeUInt16LE(tcoords.x, 1);
                buf.writeUInt16LE(tcoords.y, 3);

                this._sfx_player.play_sfx("click");
            break;

            case cl_cmds["CL_CMD_GIVE"]:
            case cl_cmds["CL_CMD_ATTACK"]:
            case cl_cmds["CL_CMD_LOOK"]:
                buf.writeUInt32LE(data.target, 1);
                this._sfx_player.play_sfx("click");
            break;
        }

        this._client.write(buf);
    }

    render_engine_loop() {
        setInterval(() => {
            // Login state
            if (!this.logged) {
                this._login_proc();
                return;
            }

            if ((this._renderengine.ticker & 15) == 0) {
                this.send_client_command(cl_cmds["CL_CMD_CTICK"]);
            }

            this._tick_do();

            this._renderengine.engine_tick();
        }, TICK);
    }

    get_tilemap() {
        return this._renderengine.tilemap;
    }

    lookup_char(ch_nr) {
        return this._cmd_dispatcher.lookup_char(ch_nr);
    }
}