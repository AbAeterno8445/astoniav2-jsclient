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

    constructor(player, render_eng, game_eng, sfx_player) {
        this.pl = player;
        this._render_eng = render_eng;
        this._game_eng = game_eng;
        this._sfx_player = sfx_player;

        this._svload = 0;

        // sv_setmap vars
        this.lastn = 0;
        this.map_cnt = [0, 0, 0, 0, 0, 0, 0, 0];

        // sv_log vars
        this._log_text = "";
        this._log_buffer = [];
        setInterval(() => this.log_pop(), 20);

        // lookup characters
        this._tmplook = new CharLook();
        this._shop = new CharLook();

        // Flag to end connection
        this.exit = 0;
    }

    static xcrypt(val) {
        var secret = "Ifhjf64hH8sa,-#39ddj843tvxcv0434dvsdc40G#34Trefc349534Y5#34trecerr9435#erZt#eA534#5erFtw#Trwec,9345mwrxm gerte-534lMIZDN(/dn8sfn8&DBDB/D&s8efnsd897)DDzD'D'D''Dofs,t0943-rg-gdfg-gdf.t,e95.34u.5retfrh.wretv.569v4#asf.59m(D)/ND/DDLD;gd+dsa,fw9r,x  OD(98snfsfa";

        var res = 0;
        res += secret.charCodeAt(val & 255);
        res += secret.charCodeAt((val >> 8) & 255) << 8;
        res += secret.charCodeAt((val >> 16) & 255) << 16;
        res += secret.charCodeAt((val >> 24) & 255) << 24;
        res ^= 0x5a7ce52e;
        return res;
    }

    sv_cmd(buf_arr) {
        var buf = Buffer.from(buf_arr);
    
        if (buf[0] & sv_cmds["SV_SETMAP"]) {
            //console.log("received setmap command");
            //console.log("at sv_cmd - setmap - buf:", buf);
            return this.sv_setmap(buf, buf[0] & ~sv_cmds["SV_SETMAP"]);
        }
    
        //var cmd_name = getKeyByValue(sv_cmds, buf[0]);
        //console.log("received", cmd_name, "command");
    
        switch (buf[0]) {
            case sv_cmds["SV_SETCHAR_NAME1"]: this.pl.name = "";
            case sv_cmds["SV_SETCHAR_NAME2"]: this.sv_setchar_name(buf); break;
            case sv_cmds["SV_SETCHAR_NAME3"]: this.sv_setchar_name_end(buf); break;
    
            case sv_cmds["SV_SETCHAR_MODE"]: this.sv_setchar_mode(buf); return 2;
            case sv_cmds["SV_SETCHAR_ATTRIB"]: this.sv_setchar_attrib(buf); return 8;
            case sv_cmds["SV_SETCHAR_SKILL"]: this.sv_setchar_skill(buf); return 8;
            case sv_cmds["SV_SETCHAR_HP"]: this.sv_setchar_hp(buf); return 13;
            case sv_cmds["SV_SETCHAR_ENDUR"]: this.sv_setchar_endur(buf); return 13;
            case sv_cmds["SV_SETCHAR_MANA"]: this.sv_setchar_mana(buf); return 13;
            case sv_cmds["SV_SETCHAR_AHP"]: this.sv_setchar_ahp(buf); return 3;
            case sv_cmds["SV_SETCHAR_AEND"]: this.sv_setchar_aend(buf); return 3;
            case sv_cmds["SV_SETCHAR_AMANA"]: this.sv_setchar_amana(buf); return 3;
            case sv_cmds["SV_SETCHAR_DIR"]: this.sv_setchar_dir(buf); return 2;
    
            case sv_cmds["SV_SETCHAR_PTS"]: this.sv_setchar_pts(buf); return 13;
            case sv_cmds["SV_SETCHAR_GOLD"]: this.sv_setchar_gold(buf); return 13;
            case sv_cmds["SV_SETCHAR_ITEM"]: this.sv_setchar_item(buf); return 9;
            case sv_cmds["SV_SETCHAR_WORN"]: this.sv_setchar_worn(buf); return 9;
            case sv_cmds["SV_SETCHAR_SPELL"]: this.sv_setchar_spell(buf); return 9;
            case sv_cmds["SV_SETCHAR_OBJ"]: this.sv_setchar_obj(buf); return 5;
    
            case sv_cmds["SV_SETMAP3"]: return this.sv_setmap3(buf, 20);
            case sv_cmds["SV_SETMAP4"]: return this.sv_setmap3(buf, 0);
            case sv_cmds["SV_SETMAP5"]: return this.sv_setmap3(buf, 2);
            case sv_cmds["SV_SETMAP6"]: return this.sv_setmap3(buf, 6);
            case sv_cmds["SV_SETORIGIN"]: this.sv_setorigin(buf); return 5;
    
            case sv_cmds["SV_TICK"]: this.sv_tick(buf); return 2;
    
            case sv_cmds["SV_LOG0"]: this.sv_log(buf, 0); break;
            case sv_cmds["SV_LOG1"]: this.sv_log(buf, 1); break;
            case sv_cmds["SV_LOG2"]: this.sv_log(buf, 2); break;
            case sv_cmds["SV_LOG3"]: this.sv_log(buf, 3); break;
    
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
    
            case sv_cmds["SV_LOOK1"]: this.sv_look1(buf); break;
            case sv_cmds["SV_LOOK2"]: this.sv_look2(buf); break;
            case sv_cmds["SV_LOOK3"]: this.sv_look3(buf); break;
            case sv_cmds["SV_LOOK4"]: this.sv_look4(buf); break;
            case sv_cmds["SV_LOOK5"]: this.sv_look5(buf); break;
            case sv_cmds["SV_LOOK6"]: this.sv_look6(buf); break;
    
            case sv_cmds["SV_SETTARGET"]: this.sv_settarget(buf); return 13;
    
            case sv_cmds["SV_PLAYSOUND"]: this.sv_playsound(buf); return 13;
    
            case sv_cmds["SV_EXIT"]: this.sv_exit(buf); break;
    
            case sv_cmds["SV_LOAD"]: this.sv_load(buf); return 5;
    
            case sv_cmds["SV_UNIQUE"]: return 9;
    
            case sv_cmds["SV_IGNORE"]: break;
    
            default:
                console.log(buf);
                console.log("WARNING: unknown SV", buf[0]);
                this.log_add("WARNING: Received unknown SV command " + buf[0], FNT_RED);
                return -1;
        }
    
        return 16;
    }

    sv_tick(buf) {
        this._render_eng.ctick = buf.readUInt8(1);
    }

    sv_load(buf) {
        this._svload = buf.readUInt32LE(1);
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

    sv_setchar_name(buf) { this.pl.name += buf.slice(1, 16).toString(); }

    sv_setchar_name_end(buf) {
        this.pl.name += buf.slice(1, 11).toString();
        for (var i = 0; i < this.pl.name.length; i++) {
            if (this.pl.name[i] == '\0') {
                this.pl.name = this.pl.name.slice(0, i);
                break;
            }
        }
        this.pl.race = buf.readInt32LE(11);

        var pl_newfile = './characters/' + this.pl.name + '.json';
        if (this.pl.file != pl_newfile && fs.existsSync(this.pl.file)) {
            fs.renameSync(this.pl.file, pl_newfile);
        }

        this.pl.file = pl_newfile;
        this.pl.savefile();
        
        this._game_eng.removeLookChar(this.pl.usnr);

        this._game_eng.updateMaincharData();
    }

    sv_setchar_mode(buf) {
        this.pl.mode = buf[1];
        this._game_eng.updateMaincharData();
    }

    sv_setchar_hp(buf) {
        for (var i = 0; i < 6; i++) this.pl.hp[i] = buf.readUInt16LE(1 + i * 2);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_endur(buf) {
        for (var i = 0; i < 6; i++) this.pl.end[i] = buf.readInt16LE(1 + i * 2);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_mana(buf) {
        for (var i = 0; i < 6; i++) this.pl.mana[i] = buf.readInt16LE(1 + i * 2);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_attrib(buf) {
        var n = buf[1];
        if (n < 0 || n > 4) return;

        for (var i = 0; i < 6; i++) this.pl.attrib[n][i] = buf[2 + i];
        this._game_eng.updateMaincharData();
    }

    sv_setchar_skill(buf) {
        var n = buf[1];
        if (n < 0 || n > 49) return;

        for (var i = 0; i < 6; i++) this.pl.skill[n][i] = buf[2 + i];
        this._game_eng.updateMaincharData();
    }

    sv_setchar_ahp(buf) { this.pl.a_hp = buf.readUInt16LE(1); this._game_eng.updateMaincharData(); }
    sv_setchar_aend(buf) { this.pl.a_end = buf.readUInt16LE(1); this._game_eng.updateMaincharData(); }
    sv_setchar_amana(buf) { this.pl.a_mana = buf.readUInt16LE(1); this._game_eng.updateMaincharData(); }
    
    sv_setchar_dir(buf) { this.pl.dir = buf[1]; }

    sv_setchar_pts(buf) {
        this.pl.points = buf.readUInt32LE(1);
        this.pl.points_tot = buf.readUInt32LE(5);
        this.pl.kindred = buf.readUInt32LE(9);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_gold(buf) {
        this.pl.gold = buf.readUInt32LE(1);
        this.pl.armor = buf.readUInt32LE(5);
        this.pl.weapon = buf.readUInt32LE(9);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_item(buf) {
        var n = buf.readUInt32LE(1);
        if (n < 0 || n > 39) console.log("WARNING: Invalid setchar item. n:", n);
        this.pl.item[n] = buf.readInt16LE(5);
        this.pl.item_p[n] = buf.readInt16LE(7);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_worn(buf) {
        var n = buf.readUInt32LE(1);
        if (n < 0 || n > 19) console.log("WARNING: Invalid setchar worn. n:", n);
        this.pl.worn[n] = buf.readInt16LE(5);
        this.pl.worn_p[n] = buf.readInt16LE(7);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_spell(buf) {
        var n = buf.readUInt32LE(1);
        if (n < 0 || n > 19) console.log("WARNING: Invalid setchar spell. n:", n);
        this.pl.spell[n] = buf.readInt16LE(5);
        this.pl.active[n] = buf.readInt16LE(7);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_obj(buf) {
        this.pl.citem = buf.readInt16LE(1);
        this.pl.citem_p = buf.readInt16LE(3);
        this._game_eng.updateMaincharData();
    }

    sv_setchar_obj(buf) {
        this.pl.citem = buf.readInt16LE(1);
        this.pl.citem_p = buf.readInt16LE(3);
        this._game_eng.updateMaincharData();
    }

    sv_look1(buf) {
        this._tmplook.worn[0] = buf.readUInt16LE(1);
        this._tmplook.worn[2] = buf.readUInt16LE(3);
        this._tmplook.worn[3] = buf.readUInt16LE(5);
        this._tmplook.worn[5] = buf.readUInt16LE(7);
        this._tmplook.worn[6] = buf.readUInt16LE(9);
        this._tmplook.worn[7] = buf.readUInt16LE(11);
        this._tmplook.worn[8] = buf.readUInt16LE(13);
        this._tmplook.autoflag = buf.readUInt16LE(15);
    }

    sv_look2(buf) {
        this._tmplook.worn[9] = buf.readUInt16LE(1);
        this._tmplook.sprite = buf.readUInt16LE(3);
        this._tmplook.points = buf.readUInt32LE(5);
        this._tmplook.hp = buf.readUInt32LE(9);
        this._tmplook.worn[10] = buf.readUInt16LE(13);
    }

    sv_look3(buf) {
        this._tmplook.end = buf.readUInt16LE(1);
        this._tmplook.a_hp = buf.readUInt16LE(3);
        this._tmplook.a_end = buf.readUInt16LE(5);
        this._tmplook.nr = buf.readUInt16LE(7);
        this._tmplook.id = buf.readUInt16LE(9);
        this._tmplook.mana = buf.readUInt16LE(11);
        this._tmplook.a_mana = buf.readUInt16LE(13);
    }

    sv_look4(buf) {
        this._tmplook.worn[1] = buf.readUInt16LE(1);
        this._tmplook.worn[4] = buf.readUInt16LE(3);
        this._tmplook.extended = buf[5];
        this._tmplook.pl_price = buf.readUInt32LE(6);
        this._tmplook.worn[11] = buf.readUInt16LE(10);
        this._tmplook.worn[12] = buf.readUInt16LE(12);
        this._tmplook.worn[13] = buf.readUInt16LE(14);
    }

    sv_look5(buf) {
        var lookname = buf.slice(1, 16).toString();
        for (var i = 0; i < lookname.length; i++) {
            if (lookname[i] == '\0') {
                lookname = lookname.slice(0, i);
                break;
            }
        }
        this._tmplook.name = lookname;

        if (!this._tmplook.extended) {
            if (!this._tmplook.autoflag) {
                // flag looked-at character for display
            }
            var newlook = new CharLook();
            Object.assign(newlook, this._tmplook);
            this._game_eng.addLookChar(newlook);
        }
    }

    sv_look6(buf) {
        var s = buf[1];

        for (var n = s; n < Math.min(62, s + 2); n++) {
            this._tmplook.item[n] = buf.readUInt16LE(2 + (n - s) * 6);
            this._tmplook.price[n] = buf.readUInt32LE(4 + (n - s) * 6);
        }
        if (n == 62) {
            // open shop
            this._game_eng.clearShop();
            for (var i = 0; i < 62; i++) {
                if (this._tmplook.item[i] > 0) {
                    this._game_eng.addShopItem(i, this._tmplook.nr, getNumSpritePath(this._tmplook.item[i]), this._tmplook.price[i]);
                }
            }
            this._game_eng.toggleShop(true);
            Object.assign(this._shop, this._tmplook);
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
            this.log_add("WARNING: corrupt setmap!", FNT_RED);
            console.log("Received n:", n, "= x:", n % renderdistance, "y:", Math.floor(n / renderdistance));
            return -1;
        }
    
        this.lastn = n;
        flags = buf.readUInt8(1);
        if (!flags) {
            console.log(buf);
            console.log("WARNING: no flags in setmap!");
            this.log_add("WARNING: no flags in setmap!", FNT_RED);
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
            this.log_add("WARNING: corrupt setmap3!", FNT_RED);
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

    sv_log(buf, font) {
        var buf_read = buf.slice(1, 16);
        for (var i = 0; i < buf_read.length; i++) {
            var ch = String.fromCharCode(buf_read[i])
            this._log_text += ch;
            if (ch == String.fromCharCode(10)) {
                this.log_add(this._log_text.trim(), font);
                //this._game_eng.chatLogger.chat_logmsg_format(this._log_text.trim(), font);
                this._log_text = "";
                return;
            }
        }
    }

    log_add(msg, font) {
        this._log_buffer.push([msg, font]);
    }

    log_pop() {
        var log = this._log_buffer.shift();
        if (log) this._game_eng.chatLogger.chat_logmsg_format(log[0], log[1]);
    }

    sv_playsound(buf) {
        var nr = buf.readUInt32LE(1);
        
        this._sfx_player.play_sfx(nr);
    }

    sv_settarget(buf) {
        this.pl.attack_cn = buf.readUInt16LE(1);
        this.pl.goto_x = buf.readUInt16LE(3);
        this.pl.goto_y = buf.readUInt16LE(5);
        this.pl.misc_action = buf.readUInt16LE(7);
        this.pl.misc_target1 = buf.readUInt16LE(9);
        this.pl.misc_target2 = buf.readUInt16LE(11);
    }

    sv_exit(buf) {
        var reason = buf.readUInt32LE(1);

        var log = "EXIT: " + this.get_logout_reason(reason);
        this.log_add(log, FNT_YELLOW);
        console.log(log);

        this.exit = 1;
    }

    get_logout_reason(reason_nr) {
        if (reason_nr < 1 || reason_nr > this._logout_reason.length) return "Reason unknown.";
        return this._logout_reason[reason_nr];
    }
}