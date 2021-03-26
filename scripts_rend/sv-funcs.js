//const { sv_cmds, renderdistance } = require("./gendefs");

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

class ServerCMDDispatcher {

    _logout_reason = [
        "unknown",                                          //0
        "Client failed challenge.",                         //1
        "Client was idle too long.",                        //2
        "No room to drop character.",                       //3
        "Invalid parameters.",                              //4
        "Character already active or no player character.", //5
        "Invalid password.",                                //6
        "Client too slow.",                                 //7
        "Receive failure.",                                 //8
        "Server is being shutdown.",                        //9
        "You entered a Tavern.",                            //10
        "Client version too old. Update needed.",           //11
        "Aborting on user request.",                        //12
        "this should never show up",                        //13
        "You have been banned for an hour. Enhance your social behaviour before you come back."                 //14
    ];

    constructor(render_eng, sfx_player) {
        this._render_eng = render_eng;
        this._sfx_player = sfx_player;

        // sv_setmap vars
        this.lastn = 0;
        this.map_cnt = [0, 0, 0, 0, 0, 0, 0, 0];

        // sv_log vars
        this._log_text = "";

        // Flag to end connection
        this.exit = 0;
    }

    sv_cmd(buf_arr) {
        var buf = Buffer.from(buf_arr);
    
        if (buf[0] & sv_cmds["SV_SETMAP"]) {
            //console.log("received setmap command");
            //console.log("at sv_cmd - setmap - buf:", buf);
            return this.sv_setmap(buf, buf[0] & ~sv_cmds["SV_SETMAP"]);
        }
    
        var cmd_name = getKeyByValue(sv_cmds, buf[0]);
        //console.log("received", cmd_name, "command");
    
        switch (buf[0]) {
            case sv_cmds["SV_SETCHAR_NAME1"]: break;
            case sv_cmds["SV_SETCHAR_NAME2"]: break;
            case sv_cmds["SV_SETCHAR_NAME3"]: break;
    
            case sv_cmds["SV_SETCHAR_MODE"]: return 2;
            case sv_cmds["SV_SETCHAR_ATTRIB"]: return 8;
            case sv_cmds["SV_SETCHAR_SKILL"]: return 8;
            case sv_cmds["SV_SETCHAR_HP"]: return 13;
            case sv_cmds["SV_SETCHAR_ENDUR"]: return 13;
            case sv_cmds["SV_SETCHAR_MANA"]: return 13;
            case sv_cmds["SV_SETCHAR_AHP"]: return 3;
            case sv_cmds["SV_SETCHAR_AEND"]: return 3;
            case sv_cmds["SV_SETCHAR_AMANA"]: return 3;
            case sv_cmds["SV_SETCHAR_DIR"]: return 2;
    
            case sv_cmds["SV_SETCHAR_PTS"]: return 13;
            case sv_cmds["SV_SETCHAR_GOLD"]: return 13;
            case sv_cmds["SV_SETCHAR_ITEM"]: return 9;
            case sv_cmds["SV_SETCHAR_WORN"]: return 9;
            case sv_cmds["SV_SETCHAR_SPELL"]: return 9;
            case sv_cmds["SV_SETCHAR_OBJ"]: return 5;
    
            case sv_cmds["SV_SETMAP3"]: return this.sv_setmap3(buf, 20);
            case sv_cmds["SV_SETMAP4"]: return this.sv_setmap3(buf, 0);
            case sv_cmds["SV_SETMAP5"]: return this.sv_setmap3(buf, 2);
            case sv_cmds["SV_SETMAP6"]: return this.sv_setmap3(buf, 6);
            case sv_cmds["SV_SETORIGIN"]: this.sv_setorigin(buf); return 5;
    
            case sv_cmds["SV_TICK"]: this.sv_tick(buf); return 2;
    
            case sv_cmds["SV_LOG0"]: this.sv_log(buf); break;
            case sv_cmds["SV_LOG1"]: this.sv_log(buf); break;
            case sv_cmds["SV_LOG2"]: this.sv_log(buf); break;
            case sv_cmds["SV_LOG3"]: this.sv_log(buf); break;
    
            case sv_cmds["SV_SCROLL_RIGHT"]: this.sv_scroll_right(); return 1;
            case sv_cmds["SV_SCROLL_LEFT"]: this.sv_scroll_left(); return 1;
            case sv_cmds["SV_SCROLL_DOWN"]: this.sv_scroll_down(); return 1;
            case sv_cmds["SV_SCROLL_UP"]: this.sv_scroll_up(); return 1;
    
            case sv_cmds["SV_SCROLL_RIGHTDOWN"]:
                this.sv_scroll_right();
                this.sv_scroll_down();
                return 1;
            case sv_cmds["SV_SCROLL_RIGHTUP"]:
                this.sv_scroll_right();
                this.sv_scroll_up();
                return 1;
            case sv_cmds["SV_SCROLL_LEFTDOWN"]:
                this.sv_scroll_left();
                this.sv_scroll_down();
                return 1;
            case sv_cmds["SV_SCROLL_LEFTUP"]:
                this.sv_scroll_left();
                this.sv_scroll_up();
                return 1;
    
            case sv_cmds["SV_LOOK1"]: break;
            case sv_cmds["SV_LOOK2"]: break;
            case sv_cmds["SV_LOOK3"]: break;
            case sv_cmds["SV_LOOK4"]: break;
            case sv_cmds["SV_LOOK5"]: break;
            case sv_cmds["SV_LOOK6"]: break;
    
            case sv_cmds["SV_SETTARGET"]: this.sv_settarget(buf); return 13;
    
            case sv_cmds["SV_PLAYSOUND"]: this.sv_playsound(buf); return 13;
    
            case sv_cmds["SV_EXIT"]: this.sv_exit(buf); break;
    
            case sv_cmds["SV_LOAD"]: return 5;
    
            case sv_cmds["SV_UNIQUE"]: return 9;
    
            case sv_cmds["SV_IGNORE"]: break;
    
            default:
                console.log(buf);
                console.log("WARNING: unknown SV", buf[0]);
                return -1;
        }
    
        return 16;
    }

    sv_tick(buf) {
        this._render_eng.ctick = buf.readUInt8(1);
    }

    sv_setorigin(buf) {
        var xp = buf.readUInt16LE(1);
        var yp = buf.readUInt16LE(3);

        var x, y, n;
        for (y = n = 0; y < renderdistance; y++) {
            for (x = 0; x < renderdistance; x++, n++) {
                this._render_eng.set_tile_data(n, {
                    x: x + xp,
                    y: y + yp
                });
            }
        }
    }

    sv_setmap(buf, off) {
        var n, p, flags;

        if (buf.length < 2) return buf.length;
    
        if (off) {
            n = this.lastn + off;
            p = 2;
        } else {
            if (buf.length < 4) return buf.length;

            n = buf.readUInt16LE(2);
            p = 4;
        }
    
        if (n < 0 || n > renderdistance * renderdistance) {
            console.log("WARNING: corrupt setmap!");
            console.log("Received n:", n, "= x:", n % renderdistance, "y:", Math.floor(n / renderdistance));
            return -1;
        }
    
        this.lastn = n;
        flags = buf.readUInt8(1);
        if (!flags) {
            console.log(buf);
            console.log("WARNING: no flags in setmap!");
            return -1;
        }
    
        var mapdata = {};
        if (flags & 1) {
            if (buf.length < p + 2) return p;
            mapdata.ba_sprite = buf.readUInt16LE(p); p += 2;
            this.map_cnt[0]++;
        }
        if (flags & 2) {
            if (buf.length < p + 8) return p;
            mapdata.flags = buf.readUInt32LE(p); p += 4;
            mapdata.flags3 = buf.readUInt32LE(p); p += 4;
            this.map_cnt[1]++;
        }
        if (flags & 4) {
            if (buf.length < p + 4) return p;
            mapdata.flags2 = buf.readUInt32LE(p); p += 4;
            this.map_cnt[2]++;
        }
        if (flags & 8) {
            if (buf.length < p + 2) return p;
            mapdata.it_sprite = buf.readUInt16LE(p); p += 2;
            this.map_cnt[3]++;
        }
        if (flags & 16) {
            if (buf.length < p + 1) return p;
            mapdata.it_status = buf.readUInt8(p); p += 1;
            this.map_cnt[4]++;
        }
        if (flags & 32) {
            if (buf.length < p + 4) return p;
            mapdata.ch_sprite = buf.readUInt16LE(p); p += 2;
            mapdata.ch_status = buf.readUInt8(p); p += 1;
            mapdata.ch_stat_off = buf.readUInt8(p); p += 1;
            this.map_cnt[5]++;
        }
        if (flags & 64) {
            if (buf.length < p + 5) return p;
            mapdata.ch_nr = buf.readUInt16LE(p); p += 2;
            mapdata.ch_id = buf.readUInt16LE(p); p += 2;
            mapdata.ch_speed = buf.readUInt8(p); p += 1;
            this.map_cnt[6]++;
        }
        if (flags & 128) {
            if (buf.length < p + 1) return p;
            mapdata.ch_proz = buf.readUInt8(p); p += 1;
            this.map_cnt[7]++;
        }
        this._render_eng.set_tile_data(n, mapdata);
        return p;
    }

    sv_setmap3(buf, cnt) {
        if (buf.length < 6) return;

        var n = buf.readUInt32LE(1);
        var tmp = buf.readUInt8(5);
        var p = 6;
        if (n < 0 || n >= renderdistance * renderdistance) {
            console.log("WARNING: corrupt setmap3!");
            return -1;
        }

        this._render_eng.set_tile_data(n, { light: tmp });
    
        if (cnt > 0) {
            for (var m = n + 2; m < n + cnt + 2; m += 2, p++) {
                if (m < renderdistance * renderdistance) {
                    tmp = buf[p];
                    this._render_eng.set_tile_data(m, { light: (tmp & 15) });
                    this._render_eng.set_tile_data(m - 1, { light: (tmp >> 4) });
                }
            }
        }
    
        return p;
    }

    sv_scroll_up() { this._render_eng.map_shift_up(); }
    sv_scroll_down() { this._render_eng.map_shift_down(); }
    sv_scroll_left() { this._render_eng.map_shift_left(); }
    sv_scroll_right() { this._render_eng.map_shift_right(); }

    sv_log(buf) {
        var buf_read = buf.slice(1, 16);
        for (var i = 0; i < buf_read.length; i++) {
            var ch = String.fromCharCode(buf_read[i])
            this._log_text += ch;
            if (ch == String.fromCharCode(10)) {
                console.log("Received log: < ", this._log_text.trim(), ">");
                chat_logmsg(this._log_text.trim());
                this._log_text = "";
                return;
            }
        }
    }

    sv_playsound(buf) {
        var nr = buf.readUInt32LE(1);
        
        this._sfx_player.play_sfx(nr);
    }

    sv_settarget(buf) {
        pl.attack_cn = buf.readUInt16LE(1);
        pl.goto_x = buf.readUInt16LE(3);
        pl.goto_y = buf.readUInt16LE(5);
        pl.misc_action = buf.readUInt16LE(7);
        pl.misc_target1 = buf.readUInt16LE(9);
        pl.misc_target2 = buf.readUInt16LE(11);
    }

    sv_exit(buf) {
        var reason = buf.readUInt32LE(1);

        if (reason < 1 || reason > 12) console.log("EXIT: Reason unknown.");
        else console.log("EXIT:", this._logout_reason[reason]);

        this.exit = 1;
    }
}