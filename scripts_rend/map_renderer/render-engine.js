class RenderEngine {
    speedtab = [
    //   1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],	//20
        [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1],	//19
        [1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1],	//18
        [1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1],	//17
        [1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1],	//16
        [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],	//15
        [1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1],	//14
        [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],	//13
        [0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,0,1],	//12
        [0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],	//11
        [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],	//10
        [1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0],	//9
        [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,1,0],	//8
        [0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],	//7
        [0,1,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0],	//6
        [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],	//5
        [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],	//4
        [0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0],	//3
        [0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0],	//2
        [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]	//1
    ];

    speedsteptab = [
    //   1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0
        [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],	//20
        [4,4,4,4,4,4,4,4,4,2,4,4,4,4,4,4,4,4,4,4],	//19
        [4,4,4,4,4,2,4,4,4,4,4,4,4,4,2,4,4,4,4,4],	//18
        [4,4,4,2,4,4,4,4,4,2,4,4,4,4,4,4,2,4,4,4],	//17
        [4,4,2,4,4,4,4,2,4,4,4,4,2,4,4,4,4,2,4,4],	//16
        [4,4,2,4,4,4,2,4,4,4,2,4,4,4,2,4,4,4,2,4],	//15
        [4,2,4,4,2,4,4,4,2,4,4,2,4,4,2,4,4,2,4,4],	//14
        [4,2,4,4,2,4,4,2,4,4,2,4,4,2,4,4,2,4,4,2],	//13
        [2,4,4,2,4,4,2,4,2,4,4,2,4,4,2,4,2,4,2,4],	//12
        [2,4,2,4,2,4,2,4,4,2,4,2,4,2,4,2,4,4,2,4],	//11
        [4,2,4,2,4,2,4,2,4,2,4,2,4,2,4,2,4,2,4,2],	//10
        [4,2,4,2,4,2,4,1,3,4,2,4,2,4,2,4,1,2,4,2],	//9
        [4,1,2,4,1,3,4,2,4,1,2,4,1,3,4,2,4,2,4,2],	//8
        [2,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4,1,3,4],	//7
        [3,4,1,3,4,1,2,3,4,1,3,4,1,3,4,1,3,4,1,2],	//6
        [2,3,4,1,2,3,4,1,2,3,4,1,2,3,4,1,2,3,4,1],	//5
        [2,3,4,1,1,2,3,4,1,1,2,3,4,1,1,2,3,4,1,1],	//4
        [2,3,4,4,1,1,2,2,3,4,1,1,2,2,3,4,4,1,1,2],	//3
        [2,3,3,4,4,4,1,1,1,2,2,2,3,3,4,1,1,1,2,2],	//2
        [3,3,3,3,3,4,4,4,4,4,1,1,1,1,1,2,2,2,2,2]	//1
    ];

    stattab = [0, 1, 1, 6, 6, 2, 3, 4, 5, 7, 4];

    constructor() {
        this.ctick = 0;
        this.ticker = 0;

        this.resetTilemap();
    }

    resetTilemap() {
        this.tilemap = {};
        for (var i = 0; i < renderdistance; i++) {
            for (var j = 0; j < renderdistance; j++) {
                var tile_id = i + j * renderdistance;
                var tile = new MapTile(tile_id, i, j, SPR_EMPTY, 0);
                this.tilemap[tile_id] = tile;
            }
        }
    }

    speedo(n) {
        return this.speedtab[this.tilemap[n].ch_speed][this.ctick];
    }

    /** Before a character can arrive at their new position, the obj offset briefly becomes 0 again,
     * making the character jump back in the current tile (before reaching the new one). This causes the
     * occasional rubberband effect while characters move around. **/

    // walk left -> speedstep(maptile n, 32, 8, 1)
    speedstep(n, d, s, update) {
        var hard_step, soft_step, total_step, speed, dist, z, m;
        speed = this.tilemap[n].ch_speed;
        hard_step = this.tilemap[n].ch_status - d;
    
        if (!update) return 32 * hard_step / s;
    
        z = this.ctick;
        soft_step = 0;
        m = hard_step;
    
        while (m) {
            z--;
            if (z < 0) z = 19;
            soft_step++;
            if (this.speedtab[speed][z]) m--;
        }
        while (1) {
            z--;
            if (z < 0) z = 19;
            if (this.speedtab[speed][z]) break;
            soft_step++;
        }
    
        z = this.ctick;
        total_step = soft_step;
        m = s - hard_step;
    
        while (1) {
            if (this.speedtab[speed][z]) m--;
            if (m < 1) break;
            z++;
            if (z > 19) z = 0;
            total_step++;
        }
        dist = 32 * (soft_step)/(total_step + 1);
    
        return dist;
    }

    do_idle(ani, sprite) {
        switch(sprite) {
            case 22480: return ani; // flame
        }
        return 0;
    }

    eng_char(n) {
        var tmp, update = 1;
    
        if (this.tilemap[n].flags & STUNNED) update = 0;
    
        switch(this.tilemap[n].ch_status) {
            // idle up
            case 0:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                this.tilemap[n].idle_ani++;
                if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                return this.tilemap[n].ch_sprite + 0 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            // idle down
            case 1:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                if (this.speedo(n) && update) {
                    this.tilemap[n].idle_ani++;
                    if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                }
                return this.tilemap[n].ch_sprite + 8 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            // idle left
            case 2:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                if (this.speedo(n) && update) {
                    this.tilemap[n].idle_ani++;
                    if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                }
                return this.tilemap[n].ch_sprite + 16 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            // idle right
            case 3:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                if (this.speedo(n) && update) {
                    this.tilemap[n].idle_ani++;
                    if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                }
                return this.tilemap[n].ch_sprite + 24 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            // idle left-up
            case 4:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                if (this.speedo(n) && update) {
                    this.tilemap[n].idle_ani++;
                    if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                }
                return this.tilemap[n].ch_sprite + 32 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            // idle left-down
            case 5:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                if (this.speedo(n) && update) {
                    this.tilemap[n].idle_ani++;
                    if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                }
                return this.tilemap[n].ch_sprite + 40 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            // idle right-up
            case 6:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                if (this.speedo(n) && update) {
                    this.tilemap[n].idle_ani++;
                    if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                }
                return this.tilemap[n].ch_sprite + 48 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            // idle right-down
            case 7:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                if (this.speedo(n) && update) {
                    this.tilemap[n].idle_ani++;
                    if (this.tilemap[n].idle_ani > 7) this.tilemap[n].idle_ani = 0;
                }
                return this.tilemap[n].ch_sprite + 56 + this.do_idle(this.tilemap[n].idle_ani, this.tilemap[n].ch_sprite);
            
            // walk up
            case 16:
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22:
                this.tilemap[n].obj_xoff = -this.speedstep(n, 16, 8, update) / 2;
                this.tilemap[n].obj_yoff = this.speedstep(n, 16, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 16) + 64;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 23:
                this.tilemap[n].obj_xoff = -this.speedstep(n, 16, 8, update) / 2;
                this.tilemap[n].obj_yoff = this.speedstep(n, 16, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 16) + 64;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 16;
                return tmp;
            
            // walk down
            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 29:
            case 30:
                this.tilemap[n].obj_xoff = this.speedstep(n, 24, 8, update) / 2;
                this.tilemap[n].obj_yoff = -this.speedstep(n, 24, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 24) + 72;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 31:
                this.tilemap[n].obj_xoff = this.speedstep(n, 24, 8, update) / 2;
                this.tilemap[n].obj_yoff = -this.speedstep(n, 24, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 24) + 72;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 24;
                return tmp;
            
            // walk left
            case 32:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
            case 38:
                this.tilemap[n].obj_xoff = -this.speedstep(n, 32, 8, update) / 2;
                this.tilemap[n].obj_yoff = -this.speedstep(n, 32, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 32) + 80;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 39:
                this.tilemap[n].obj_xoff = -this.speedstep(n, 32, 8, update) / 2;
                this.tilemap[n].obj_yoff = -this.speedstep(n, 32, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 32) + 80;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 32;
                return tmp;
            
            // walk right
            case 40:
            case 41:
            case 42:
            case 43:
            case 44:
            case 45:
            case 46:
                this.tilemap[n].obj_xoff = this.speedstep(n, 40, 8, update) / 2;
                this.tilemap[n].obj_yoff = this.speedstep(n, 40, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 40) + 88;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 47:
                this.tilemap[n].obj_xoff = this.speedstep(n, 40, 8, update) / 2;
                this.tilemap[n].obj_yoff = this.speedstep(n, 40, 8, update) / 4;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 40) + 88;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 40;
                return tmp;
            
            // left+up
            case 48:
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
            case 58:
                this.tilemap[n].obj_xoff = -this.speedstep(n, 48, 12, update);
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 48) * 8 / 12 + 96;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return Math.round(tmp);
            case 59:
                this.tilemap[n].obj_xoff = -this.speedstep(n, 48, 12, update);
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 48) * 8 / 12 + 96;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 48;
                return Math.round(tmp);
            
            // left+down
            case 60:
            case 61:
            case 62:
            case 63:
            case 64:
            case 65:
            case 66:
            case 67:
            case 68:
            case 69:
            case 70:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = -this.speedstep(n, 60, 12, update) / 2;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 60) * 8 / 12 + 104;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return Math.round(tmp);
            case 71:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = -this.speedstep(n, 60, 12, update) / 2;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 60) * 8 / 12 + 104;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 60;
                return Math.round(tmp);
            
            // right+up
            case 72:
            case 73:
            case 74:
            case 75:
            case 76:
            case 77:
            case 78:
            case 79:
            case 80:
            case 81:
            case 82:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = this.speedstep(n, 72, 12, update) / 2;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 72) * 8 / 12 + 112;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return Math.round(tmp);
            case 83:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = this.speedstep(n, 72, 12, update) / 2;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 72) * 8 / 12 + 112;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 72;
                return Math.round(tmp);
            
            // right+down
            case 84:
            case 85:
            case 86:
            case 87:
            case 88:
            case 89:
            case 90:
            case 91:
            case 92:
            case 93:
            case 94:
                this.tilemap[n].obj_xoff = this.speedstep(n, 84, 12, update);
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 84) * 8 / 12 + 120;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return Math.round(tmp);
            case 95:
                this.tilemap[n].obj_xoff = this.speedstep(n, 84, 12, update);
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 84) * 8 / 12 + 120;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 84;
                return Math.round(tmp);
            
            // turn up to left-up
            case 96:
            case 97:
            case 98:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 96) + 128;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 99:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 96) + 128;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 96;
                return tmp;
            
            // turn left-up to up
            case 100:
            case 101:
            case 102:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 100) + 132;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 103:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 100) + 132;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 100;
                return tmp;
            
            // turn up to right-up
            case 104:
            case 105:
            case 106:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 104) + 136;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 107:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 104) + 136;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 104;
                return tmp;
            
            // turn right-up to right
            case 108:
            case 109:
            case 110:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 108) + 140;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 111:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 108) + 140;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 108;
                return tmp;
            
            // turn down to left-down
            case 112:
            case 113:
            case 114:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 112) + 144;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 115:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 112) + 144;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 112;
                return tmp;
            
            // turn left-down to left
            case 116:
            case 117:
            case 118:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 116) + 148;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 119:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 116) + 148;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 116;
                return tmp;
            
            // turn down to right-down
            case 120:
            case 121:
            case 122:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 120) + 152;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 123:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 120) + 152;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 120;
                return tmp;
            
            // turn right-down to down
            case 124:
            case 125:
            case 126:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 124) + 156;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 127:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 124) + 156;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 124;
                return tmp;
            
            // turn left to left-up
            case 128:
            case 129:
            case 130:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 128) + 160;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 131:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 128) + 160;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 128;
                return tmp;
            
            // turn left-up to up
            case 132:
            case 133:
            case 134:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 132) + 164;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 135:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 132) + 164;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 132;
                return tmp;
            
            // turn left to left-down
            case 136:
            case 137:
            case 138:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 136) + 168;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 139:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 136) + 168;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 136;
                return tmp;
            
            // turn left-down to down
            case 140:
            case 141:
            case 142:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 140) + 172;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 143:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 140) + 172;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 140;
                return tmp;
            
            // turn right to right-up
            case 144:
            case 145:
            case 146:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 144) + 176;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 147:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 144) + 176;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 144;
                return tmp;
            
            // turn right-up to up
            case 148:
            case 149:
            case 150:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 148) + 180;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 151:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 148) + 180;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 148;
                return tmp;
            
            // turn right to right-down
            case 152:
            case 153:
            case 154:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 152) + 184;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 155:
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 152) + 184;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 152;
                return tmp;
            
            // turn right-down to down
            case 156:
            case 157:
            case 158:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 156) + 188;
                if (this.speedo(n) && update) this.tilemap[n].ch_status++;
                return tmp;
            case 159:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 156) + 188;
                //if (this.speedo(n) && update) this.tilemap[n].ch_status = 156;
                return tmp;
            
            // misc up
            case 160:
            case 161:
            case 162:
            case 163:
            case 164:
            case 165:
            case 166:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 160) + 192 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5);
                if (this.speedo(n && update)) this.tilemap[n].ch_status++;
                return tmp;
            case 167:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 160) + 192 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5);
                //if (this.speedo(n && update)) this.tilemap[n].ch_status = 160;
                return tmp;
            
            // misc down
            case 168:
            case 169:
            case 170:
            case 171:
            case 172:
            case 173:
            case 174:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 168) + 200 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5);
                if (this.speedo(n && update)) this.tilemap[n].ch_status++;
                return tmp;
            case 175:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 168) + 200 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5);
                //if (this.speedo(n && update)) this.tilemap[n].ch_status = 168;
                return tmp;
            
            // misc left
            case 176:
            case 177:
            case 178:
            case 179:
            case 180:
            case 181:
            case 182:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 176) + 208 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5)>>>0;
                if (this.speedo(n && update)) this.tilemap[n].ch_status++;
                return tmp;
            case 183:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 176) + 208 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5)>>>0;
                //if (this.speedo(n && update)) this.tilemap[n].ch_status = 176;
                return tmp;
            
            // misc right
            case 184:
            case 185:
            case 186:
            case 187:
            case 188:
            case 189:
            case 190:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 184) + 216 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5)>>>0;
                if (this.speedo(n && update)) this.tilemap[n].ch_status++;
                return tmp;
            case 191:
                this.tilemap[n].obj_xoff = 0;
                this.tilemap[n].obj_yoff = 0;
                tmp = this.tilemap[n].ch_sprite + (this.tilemap[n].ch_status - 184) + 216 + ((this.stattab[this.tilemap[n].ch_stat_off])<<5)>>>0;
                //if (this.speedo(n && update)) this.tilemap[n].ch_status = 184;
                return tmp;
            
            default:
                console.log("Unknown ch_status", this.tilemap[n].ch_status);
                return this.tilemap[n].ch_sprite;
        }
    }

    eng_item(n) {
        switch(this.tilemap[n].it_status) {
            case 0:
            case 1:
                return this.tilemap[n].it_sprite;
            
            // four sprite animation, 2-step
            case 2:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite;
            
            case 3:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 2;
            
            case 4:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 4;
            
            case 5:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status = 2;
                return this.tilemap[n].it_sprite + 6;
            
            // two sprite animation, 1-step
            case 6:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite;
            
            case 7:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status = 6;
                return this.tilemap[n].it_sprite + 1;
            
            // eight sprite animation, 1-step
            case 8:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite;
            
            case 9:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 1;
    
            case 10:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 2;
    
            case 11:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 3;
    
            case 12:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 4;
    
            case 13:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 5;
    
            case 14:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 6;
    
            case 15:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status = 8;
                return this.tilemap[n].it_sprite + 7;
            
            // five sprite animation, 1-step, random
            case 16:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite;
    
            case 17:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 1;
    
            case 18:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 2;
    
            case 19:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status++;
                return this.tilemap[n].it_sprite + 3;
    
            case 20:
                if (this.speedtab[10][this.ctick]) this.tilemap[n].it_status = 16;
                return this.tilemap[n].it_sprite + 4;
            
            case 21: return this.tilemap[n].it_sprite + (this.ticker & 63);
    
            default:
                console.log("Unknown it_status", this.tilemap[n].it_status);
                return this.tilemap[n].it_sprite;
        }
    }

    engine_tick() {
        this.ticker++;

        if (this.ctick < 19) this.ctick++;
        else this.ctick = 0;
    
        for (var n = 0; n < renderdistance * renderdistance; n++) {
            this.tilemap[n].obj1 = 0;
            this.tilemap[n].obj2 = 0;
        }
    
        for (var n = 0; n < renderdistance * renderdistance; n++) {
            if (this.tilemap[n].it_sprite) {
                var tmp = this.eng_item(n);
                this.tilemap[n].obj1 = tmp;
            }
    
            if (this.tilemap[n].ch_sprite) {
                var tmp = this.eng_char(n);
                this.tilemap[n].obj2 = tmp;
            }
        }
    }

    /** MAP FUNCTIONS **/

    get_tile_coords(x, y) {
        var t = x + y * renderdistance;
        if (!this.tilemap.hasOwnProperty(t)) return null;
        return {x: this.tilemap[t].x, y: this.tilemap[t].y};
    }

    set_tile_data(n, data) {
        if (!this.tilemap.hasOwnProperty(n)) return;

        Object.assign(this.tilemap[n], data);
    }

    map_shift_up() {
        for (var ty = renderdistance - 1; ty >= 2; ty--) {
            for (var tx = 0; tx < renderdistance - 1; tx++) {
                var t_old = tx + ty * renderdistance;
                var t_new = tx + (ty - 1) * renderdistance;
                Object.assign(this.tilemap[t_old], this.tilemap[t_new]);
            }
        }
    }

    map_shift_down() {
        for (var ty = 2; ty < renderdistance - 1; ty++) {
            for (var tx = 0; tx < renderdistance - 1; tx++) {
                var t_old = tx + ty * renderdistance;
                var t_new = tx + (ty + 1) * renderdistance;
                Object.assign(this.tilemap[t_old], this.tilemap[t_new]);
            }
        }
    }

    map_shift_left() {
        for (var ty = 0; ty < renderdistance - 1; ty++) {
            for (var tx = renderdistance - 1; tx >= 2; tx--) {
                var t_old = tx + ty * renderdistance;
                var t_new = (tx - 1) + ty * renderdistance;
                Object.assign(this.tilemap[t_old], this.tilemap[t_new]);
            }
        }
    }

    map_shift_right() {
        for (var ty = 0; ty < renderdistance - 1; ty++) {
            for (var tx = 2; tx < renderdistance - 1; tx++) {
                var t_old = tx + ty * renderdistance;
                var t_new = (tx + 1) + ty * renderdistance;
                Object.assign(this.tilemap[t_old], this.tilemap[t_new]);
            }
        }
    }
}