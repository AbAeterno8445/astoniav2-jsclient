class SocketClient {
    constructor(player, game_eng, sfx_player, conn_data) {
        this.pl = player;
        this._game_eng = game_eng;
        this._renderengine = new RenderEngine();
        this._cmd_dispatcher = new ServerCMDDispatcher(player, this._renderengine, this._game_eng, sfx_player);

        // Zlib inflate decompressor
        if (zlib_compression == 1) {
            this.zlib_inf = zlib.createInflate({ flush: zlib.constants.Z_SYNC_FLUSH, chunkSize: 12 * 1024 });
            this.zlib_inf.on('data', (data) => {
                this.zlib_inf._outOffset = 0; // Hack to prevent zlib resetting between data chunks
                this._tick_procdata(data);
                this.comp_tick_proc = false;
            });
        }

        this._init(conn_data.ip, conn_data.port, conn_data.version);
    }

    _init(ip, port, version) {
        this.sv_ip = ip;
        this.sv_port = port;
        this.sv_version = version;

        this._client = null;
        this._tickbuf = new Array(); // Buffer with received data

        this._pdata_state = 0; // For sending player data (name, description)

        this.logged = false; // Logged-in state

        this.first_render = false; // First render (for floors)

        if (zlib_compression == 1)
            this.comp_tick_proc = false; // True while processing compressed tick

        this._cmd_dispatcher.exit = 0;
    }

    log_add(msg, font) {
        this._cmd_dispatcher.log_add(msg, font);
    }

    /** Logs a message then displays the 'return to selection' button - useful for errors */
    log_failure(msg, font) {
        this.log_add(msg, font);
        this._game_eng.chatLogger.chat_logbutton_retmenu();
    }

    /** Existing chardata needs usnr, pass1 & pass2 fields */
    connect(newchar, chardata, password, callback) {
        this.log_add("Connecting...", FNT_YELLOW);
        this._client = net.createConnection({ host: this.sv_ip, port: this.sv_port }, () => {
            console.log("connected to server.");
            this.log_add("Connected to server.", FNT_YELLOW);

            this._pdata_state = 0;

            var buf = Buffer.alloc(16);
            if (password) {
                buf[0] = cl_cmds["CL_PASSWD"];
                buf.write(password.substring(0, 15), 1);
                this._client.write(buf);
            }

            buf = Buffer.alloc(16);
            if (newchar) {
                buf[0] = cl_cmds["CL_NEWLOGIN"];
            } else {
                buf[0] = cl_cmds["CL_LOGIN"];
                buf.writeUInt32LE(chardata.usnr, 1);
                buf.writeUInt32LE(chardata.pass1, 5);
                buf.writeUInt32LE(chardata.pass2, 9);
            }
            this._client.write(buf);

            try {
                this.render_engine_loop();
            } catch (err) {
                this.log_add("Could not connect:" + err, FNT_RED);
                callback(err);
            }

            callback(null);
        });

        this._client.on('error', (err) => callback(err));

        this._client.on('data', (data) => this._recv_data(data));

        this._client.on('end', () => {
            console.log("disconnected from server.");

            this.log_add("Disconnected from server.", FNT_RED);
            this._renderengine.resetTilemap();
            this._game_eng.mapCanvas.clearContext();
            this._game_eng.chatLogger.chat_logbutton_retmenu();
            this._init(this.sv_ip, this.sv_port, this.sv_version);
        });
    }

    _recv_data(data) {
        this._tickbuf.push(...data);
    }

    // Login-process related server commands
    _login_proc() {
        var buf = Buffer.from(this._tickbuf);
        if (buf.length < 2) return;

        switch(buf[0]) {
            case sv_cmds["SV_CHALLENGE"]:
                setTimeout(() => {
                    var tmp = buf.readUInt32LE(1);

                    var buf_ans = Buffer.alloc(16);
                    buf_ans[0] = cl_cmds["CL_CHALLENGE"];
                    buf_ans.writeUInt32LE(ServerCMDDispatcher.xcrypt(tmp), 1);
                    buf_ans.writeUInt32LE(this.sv_version, 5);
                    buf_ans.writeUInt32LE(this.pl.race, 9);
                    this._client.write(buf_ans);

                    console.log("sent challenge.");
                }, 500);
            break;

            case sv_cmds["SV_NEWPLAYER"]:
                this.logged = true;
                this.pl.usnr = buf.readUInt32LE(1);
                this.pl.pass1 = buf.readUInt32LE(5);
                this.pl.pass2 = buf.readUInt32LE(9);
                this.pl.savefile();
                this.pl.toggleAutosave(true);

                console.log("logged in as new character.");
            break;

            case sv_cmds["SV_LOGIN_OK"]:
                this.logged = true;
                this.pl.toggleAutosave(true);
                console.log("logged in.");
            break;

            case sv_cmds["SV_EXIT"]:
                var tmp = buf.readUInt32LE(1);

                var log = "EXIT: " + this._cmd_dispatcher.get_logout_reason(tmp);
                this.log_add(log);
                console.log(log);
                this._client.end();
            break;

            case sv_cmds["SV_CAP"]:
                var tmp = buf.readUInt32LE(1);
                var prio = buf.readUInt32LE(5);

                var log = "Server response: Player limit reached. Your place in queue: " + tmp + "Priority: " + prio;
                this.log_add(log);
                console.log(log);
            break;
        }

        // All login process packets are 16 bytes - change this if a difference arises
        this._tickbuf = this._tickbuf.slice(16);
    }

    _tick_do() {
        if (this._tickbuf.length < 2) return 0;
        if (this.comp_tick_proc) return 0;

        /*while(this._tickbuf.length >= 2) {
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
        }*/

        while (this._tickbuf.length >= 2 && !this.comp_tick_proc) {
            var data = Buffer.from(this._tickbuf);
            var buf = [];

            var comp = data.readUInt16LE(0) & 0x8000;
            var len = data.readUInt16LE(0) & 0x7fff;
            if (len > this._tickbuf.length) return 0;

            this._cmd_dispatcher.lastn = -1; // reset sv_setmap

            var csize = len - 2;
            if (csize) {
                buf = this._tickbuf.slice(2, csize + 2);
                this._tickbuf = this._tickbuf.slice(len);
            } else {
                this._tickbuf = this._tickbuf.slice(2);
                continue;
            }

            if (comp && zlib_compression == 1) {
                this.zlib_inf.write(Buffer.from(buf));
                this.comp_tick_proc = true;
            } else {
                this._tick_procdata(buf);
            }
        }
    }

    _tick_procdata(data_buf) {
        var buf_arr = [...data_buf];

        var idx = 0;
        while (idx < buf_arr.length) {
            var ret = this._cmd_dispatcher.sv_cmd(buf_arr.slice(idx));
            if (ret == -1) {
                this._client.end();
                throw "syntax error in server data";
            }
            idx += ret;
        }
    }

    send_client_command(cmd, data) {
        var buf = Buffer.alloc(16);
        buf[0] = cmd;

        switch(cmd) {
            case cl_cmds["CL_CMD_SETUSER"]:
                if (this._pdata_state < 6) {
                    // Send player name
                    var pname = this.pl.name;
                    if (this.pl.newname) pname = this.pl.newname;
                    
                    buf[1] = 0;
                    buf[2] = 13 * this._pdata_state;

                    for (var i = 0; i < 13; i++) {
                        var pos = i + 13 * this._pdata_state;
                        buf[i + 3] = pname.charCodeAt(pos);
                    }
                } else if (this._pdata_state < 12) {
                    // Send player description (part 1)
                    buf[1] = 1;
                    buf[2] = 13 * (this._pdata_state - 6);

                    for (var i = 0; i < 13; i++) {
                        var pos = i + 13 * (this._pdata_state - 6);
                        buf[i + 3] = this.pl.description.charAt(pos);
                    }
                } else if (this._pdata_state < 18) {
                    // Send player description (part 2)
                    buf[1] = 2;
                    buf[2] = 13 * (this._pdata_state - 12);

                    for (var i = 0; i < 13; i++) {
                        var pos = i + 13 * (this._pdata_state - 6);
                        buf[i + 3] = this.pl.description.charAt(pos);
                    }

                    if (this._pdata_state == 17) this.log_add("Sent user data.", FNT_YELLOW);
                }
            break;

            case cl_cmds["CL_CMD_CTICK"]:
                buf.writeInt32LE(this._renderengine.ticker, 1);
            break;

            case cl_cmds["CL_CMD_AUTOLOOK"]:
                buf.writeInt32LE(data.ch_nr, 1);
            break;

            case cl_cmds["CL_CMD_INPUT1"]:
            case cl_cmds["CL_CMD_INPUT2"]:
            case cl_cmds["CL_CMD_INPUT3"]:
            case cl_cmds["CL_CMD_INPUT4"]:
            case cl_cmds["CL_CMD_INPUT5"]:
            case cl_cmds["CL_CMD_INPUT6"]:
            case cl_cmds["CL_CMD_INPUT7"]:
            case cl_cmds["CL_CMD_INPUT8"]:
                buf.write(data.input, 1);
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
            break;

            case cl_cmds["CL_CMD_GIVE"]:
            case cl_cmds["CL_CMD_ATTACK"]:
            case cl_cmds["CL_CMD_LOOK"]:
                buf.writeUInt32LE(data.target, 1);
            break;

            case cl_cmds["CL_CMD_INV"]:
            case cl_cmds["CL_CMD_INV_LOOK"]:
            case cl_cmds["CL_CMD_SKILL"]:
                buf.writeUInt32LE(data.data1, 1);
                buf.writeUInt32LE(data.data2, 5);
                buf.writeUInt32LE(data.data3, 9);
            break;

            case cl_cmds["CL_CMD_SHOP"]:
            case cl_cmds["CL_CMD_MODE"]:
            case cl_cmds["CL_CMD_STAT"]:
                buf.writeUInt16LE(data.x1, 1);
                buf.writeUInt32LE(data.x2, 3);
            break;

            default:
                console.log("WARNING: Unhandled client command", cmd, "- data:", data);
                return;
        }

        this._client.write(buf);
    }

    flush_game_commands() {
        do {
            var cmd = this._game_eng.popCommand();
            if (cmd) this.send_client_command(cmd[0], cmd[1]);
        } while (cmd);
    }

    render_engine_loop() {
        // Login state
        if (!this.logged) {
            this._login_proc();
            setTimeout(() => this.render_engine_loop(), TICK);
            return;
        }

        var tick_start = Date.now();

        if (this._pdata_state < 18 && this._renderengine.ticker % 4 == 0) {
            this.send_client_command(cl_cmds["CL_CMD_SETUSER"]);
            this._pdata_state++;
        }

        this.flush_game_commands();

        if ((this._renderengine.ticker & 15) == 0) {
            this.send_client_command(cl_cmds["CL_CMD_CTICK"]);
        }

        if (!this.first_render) {
            this.first_render = true;
            
            // Ensure floors are rendered on login
            setTimeout(() => {
                this._game_eng.update_floors = true;
                this._game_eng.update_minimap = true;
            }, 3000);
        }

        this._tick_do();

        this._renderengine.engine_tick();
        this._game_eng.renderMap(this._renderengine.tilemap);

        if (!this._cmd_dispatcher.exit) {
            var tick_diff = Date.now() - tick_start;
            setTimeout(() => this.render_engine_loop(), TICK - tick_diff);
        } else {
            this._cmd_dispatcher.exit = 0;
            this._client.end();
        }
    }
}