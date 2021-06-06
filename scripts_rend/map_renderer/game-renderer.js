function padSpriteNum(nr) { return ("00000" + nr).substr(-5); }
function getNumSpritePath(nr) { return "./gfx/" + padSpriteNum(nr) + ".png"; }

/** Load all of a character's animations (given the first sprite number) into a CanvasHandler object */
function loadCharGFX(cv_handler, ch_spr) {
    // Idle sprites
    for (var i = 0; i < 8; i++) {
        cv_handler.loadImage(getNumSpritePath(ch_spr + 8 * i));
    }
    // Animations
    for (var i = 0; i < 384; i++) {
        cv_handler.loadImage(getNumSpritePath(ch_spr + 64 + i));
    }
}

class GameRenderer {
    constructor(player) {
        this.pl = player;

        // Command queue
        this.cmdQueue = [];

        // Map drawing canvas
        this.mapCanvas = new CanvasHandler(document.getElementById('cv-map'));
        this.mapCanvas.setDefaultOffset(-280, 360, true);
        this.mapCanvas.setLoadingImage(getNumSpritePath(35));

        // v2 font text drawer
        this.fontDrawer = new FontDrawer();
        // preload font files
        for (var i = 0; i <= 3; i++) this.fontDrawer.load_font(i, getNumSpritePath(700 + i));
        for (var i = 1960; i <= 1967; i++) this.fontDrawer.load_font(i, getNumSpritePath(i));

        this.chatLogger = new ChatLogger(this.fontDrawer, FNT_YELLOW);

        // Keys/mouse held
        this.doc_keyheld = { ctrl: 0, shift: 0, alt: 0 };
        this.doc_mouseheld = { left: 0, middle: 0, right: 0 };

        // Default mouse image
        this.cursor_default = "./gfx/MOUSE.png";

        // Pre-load basic images
        this.mapCanvas.loadImage(getNumSpritePath(31)); // Target tile (player movement)
        this.mapCanvas.loadImage(getNumSpritePath(32)); // Drop at position
        this.mapCanvas.loadImage(getNumSpritePath(33)); // Take from position
        this.mapCanvas.loadImage(getNumSpritePath(34)); // Attack target
        this.mapCanvas.loadImage(getNumSpritePath(45)); // Give target/Use target
        for (var i = 1078; i < 1082; i++) {
            this.mapCanvas.loadImage(getNumSpritePath(i)); // Injured char fx
        }

        // Hovered tile in map
        this.tile_hovered = -1;

        // Map rendering variables
        this.hide_walls = true;

        this.selected_char = 0;

        this.char_cv = document.createElement('canvas');
        this.char_cv_ctx = this.char_cv.getContext('2d');

        this.char_hbar_cv = document.createElement('canvas');
        this.char_hbar_cv.height = 1;

        this.citem_last = 0;

        this.charlookup_req = {};
        this.look_chars = {};

        this.charname_imgs = {};

        this.chat_history = [];
        this.chat_history_sel = 0;

        // Inventory display
        this.div_inv = document.getElementById('div-inv');
        this.inv_elems = {};
        for (let i = 0; i < 40; i++) {
            var tmp_invelem = document.createElement('div');
            tmp_invelem.className = 'div-invitem';

            this.inv_elems[i] = tmp_invelem;

            // Inv slot click
            tmp_invelem.onclick = () => {
                var d1 = 6;
                if (this.doc_keyheld.shift) d1 = 0;
                this.queueCommand(cl_cmds.CL_CMD_INV, { data1: d1, data2: i, data3: this.selected_char });
            };

            // Inv slot right click
            tmp_invelem.oncontextmenu = () => {
                this.queueCommand(cl_cmds.CL_CMD_INV_LOOK, { data1: i, data2: 0, data3: this.selected_char });
            };

            this.div_inv.appendChild(tmp_invelem);
        }

        // Associate canvas & document events
        this.last_tilemap = null;
        this.mapCanvas.cv.addEventListener('mousemove', (e) => { this.mouseCommand(e); });
        this.mapCanvas.cv.addEventListener('mouseup', (e) => { this.mouseCommand(e); });
        this.mapCanvas.cv.addEventListener('mouseleave', (e) => { this.tile_hovered = -1; });

        document.addEventListener('mousedown', (e) => {
            if (e.button == 0) this.doc_mouseheld.left = 1;
            else if (e.button == 1) this.doc_mouseheld.middle = 1;
            else if (e.button == 2) this.doc_mouseheld.right = 1;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button == 0) this.doc_mouseheld.left = 0;
            else if (e.button == 1) this.doc_mouseheld.middle = 0;
            else if (e.button == 2) this.doc_mouseheld.right = 0;
        });

        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case "Shift": this.doc_keyheld.shift = 1; break;
                case "Alt": this.doc_keyheld.alt = 1; break;
                case "Control": this.doc_keyheld.ctrl = 1; break;
                case "Enter":
                    var chat_inp = document.getElementById('inp-chatbox');
                    if (document.activeElement != chat_inp) {
                        chat_inp.focus();
                    } else {
                        var chat_inpmsg = chat_inp.value.trim();

                        this.chat_history.unshift(chat_inpmsg);
                        if (this.chat_history.length > 100) this.chat_history.pop();

                        if (chat_inpmsg.length > 0) {
                            for (var i = 0; i < 8; i ++) {
                                this.queueCommand(cl_cmds["CL_CMD_INPUT" + (i + 1)], {
                                    input: chat_inpmsg.slice(i * 15, i * 15 + 16)
                                });
                            }
                            chat_inp.value = "";
                        }
                        this.chat_history_sel = 0;
                        chat_inp.blur();
                    }
                break;
                case "ArrowUp":
                    var chat_inp = document.getElementById('inp-chatbox');
                    if (document.activeElement == chat_inp && this.chat_history.length > 0) {
                        if (this.chat_history_sel < this.chat_history.length) this.chat_history_sel++;

                        chat_inp.value = this.chat_history[this.chat_history_sel - 1];
                    }
                break;
                case "ArrowDown":
                    var chat_inp = document.getElementById('inp-chatbox');
                    if (document.activeElement == chat_inp && this.chat_history.length > 0) {
                        if (this.chat_history_sel > 1) this.chat_history_sel--;

                        chat_inp.value = this.chat_history[this.chat_history_sel - 1];
                    }
                break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case "Shift": this.doc_keyheld.shift = 0; break;
                case "Alt": this.doc_keyheld.alt = 0; break;
                case "Control": this.doc_keyheld.ctrl = 0; break;
            }
        });

        // Toggle walls button
        document.getElementById('but-togglewalls').onclick = () => { this.hide_walls = !this.hide_walls; };
    }

    /** Queue a server command */
    queueCommand(cmd_id, cmd_data) {
        this.cmdQueue.push([cmd_id, cmd_data]);
    }

    /** Attempt to get a server command from the queue, returns null if empty */
    popCommand() {
        if (!this.cmdQueue.length) return null;
        return this.cmdQueue.shift();
    }

    /** Register a looked-at character info. Receives a CharLook() object */
    addLookChar(ch) {
        this.look_chars[ch.nr] = ch;
    }

    removeLookChar(nr) {
        if (this.look_chars.hasOwnProperty(nr)) delete this.look_chars[nr];
    }

    setCursorImg(img_path, offset = 0) {
        this.mapCanvas.cv.style.cursor = `url(${img_path}) ${offset} ${offset}, auto`;
        document.body.style.cursor = `url(${img_path}) ${offset} ${offset}, auto`;
    }

    /** Get isometric tile position of cursor within map canvas. Receives mouse event */
    getCursorIso(e) {
        var mpos = CanvasHandler.getCursorPosition(this.mapCanvas.cv, e);
        var in_canvas = 1;
        if (mpos.x < 0 || mpos.y < 0 || mpos.x > this.mapCanvas.cv.width || mpos.y > this.mapCanvas.cv.height) in_canvas = 0;

        var x = mpos.x + 160;
        var y = mpos.y + 16;

        var mx = 2 * y + x - (this.mapCanvas.drawYOffset * 2) - this.mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);
        var my = x - 2 * y + (this.mapCanvas.drawYOffset * 2) - this.mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);

        mx = Math.floor(mx / 32) - 17;
        my = Math.floor(my / 32) - 12;

        return { x: mx, y: my, in: in_canvas };
    }

    /** Check surrounding tiles from given start position for given flag.
     * Returns a list of found tiles matching flag, sorted by distance to start point (closest -> farthest) */
    scanMapFlag(tilemap, startpos, flag) {
        if (!tilemap) return;

        if (tilemap[startpos].flags & flag) return [{
            m: startpos,
            x: startpos % renderdistance,
            y: Math.floor(startpos / renderdistance)
        }];

        var found_objs = [];
        for (var i = -2; i <= 2; i++) {
            for (var j = -2; j <= 2; j++) {
                if (j == 0 && i == 0) continue;

                var m = startpos + j + i * renderdistance;
                if (m >= 0 && m <= renderdistance * renderdistance) {
                    if (tilemap[m].flags & flag) {
                        found_objs.push({
                            m: m,
                            x: m % renderdistance,
                            y: Math.floor(m / renderdistance),
                            dist: Math.abs(j + i)
                        });
                    }
                }
            }
        }

        found_objs.sort((a, b) => (a.dist > b.dist) ? 1 : -1);
        return found_objs;
    }

    /** General mouse event */
    mouseCommand(event) {
        var tilemap = this.last_tilemap;
        if (!tilemap) return;

        var cursor_img = this.cursor_default;
        var mpos = this.getCursorIso(event);

        if (mpos.in && mpos.x >= 0 && mpos.y >= 0 && mpos.x < renderdistance && mpos.y < renderdistance) {
            this.tile_hovered = mpos.x + mpos.y * renderdistance;
        } else {
            this.tile_hovered = -1;
        }

        if (this.tile_hovered > -1) {
            if (this.doc_keyheld.shift) {
                if (!this.pl.citem) {
                    var scan = this.scanMapFlag(tilemap, this.tile_hovered, ISITEM);
                    if (scan.length > 0) {
                        this.tile_hovered = scan[0].m;
                        mpos.x = scan[0].x;
                        mpos.y = scan[0].y;
                        if (tilemap[this.tile_hovered].flags & ISUSABLE) {
                            //cursor_img = getNumSpritePath();

                            if (this.doc_mouseheld.left) {
                                // Use item
                                this.queueCommand(cl_cmds["CL_CMD_USE"], { x: mpos.x, y: mpos.y });
                            } else if (this.doc_mouseheld.right) {
                                // Look at item
                                this.queueCommand(cl_cmds["CL_CMD_LOOK_ITEM"], { x: mpos.x, y: mpos.y });
                            }
                        } else {
                            //cursor_img = getNumSpritePath();

                            if (this.doc_mouseheld.left) {
                                // Pick up item
                                this.queueCommand(cl_cmds["CL_CMD_PICKUP"], { x: mpos.x, y: mpos.y });
                            } else if (this.doc_mouseheld.right) {
                                // Look at item
                                this.queueCommand(cl_cmds["CL_CMD_LOOK_ITEM"], { x: mpos.x, y: mpos.y });
                            }
                        }
                    }
                } else if (this.doc_mouseheld.left) {
                    if (tilemap[this.tile_hovered].flags & ISUSABLE) {
                        // Use citem on hovered item
                        this.queueCommand(cl_cmds["CL_CMD_USE"], { x: mpos.x, y: mpos.y });
                    } else {
                        // Drop item
                        this.queueCommand(cl_cmds["CL_CMD_DROP"], { x: mpos.x, y: mpos.y });
                    }
                }
            } else if (this.doc_keyheld.ctrl || this.doc_keyheld.alt) {
                var scan = this.scanMapFlag(tilemap, this.tile_hovered, ISCHAR);
                if (scan.length > 0) {
                    this.tile_hovered = scan[0].m;
                    mpos.x = scan[0].x;
                    mpos.y = scan[0].y;
                    if (this.doc_keyheld.ctrl) {
                        //cursor_img = getNumSpritePath();

                        if (this.doc_mouseheld.left) {
                            if (this.pl.citem) {
                                // Give character
                                this.queueCommand(cl_cmds["CL_CMD_GIVE"], { target: tilemap[this.tile_hovered].ch_nr });
                            } else {
                                // Attack character
                                this.queueCommand(cl_cmds["CL_CMD_ATTACK"], { target: tilemap[this.tile_hovered].ch_nr });
                            }
                        } else if (this.doc_mouseheld.right) {
                            // Look at character
                            this.queueCommand(cl_cmds["CL_CMD_LOOK"], { target: tilemap[this.tile_hovered].ch_nr });
                        }
                    } else {
                        //cursor_img = getNumSpritePath();

                        if (this.doc_mouseheld.left) {
                            // Select character
                            var tgt_nr = tilemap[this.tile_hovered].ch_nr;
                            if (this.selected_char != tgt_nr) this.selected_char = tgt_nr;
                            else this.selected_char = 0;

                        } else if (this.doc_mouseheld.right) {
                            // Look at character
                            this.queueCommand(cl_cmds["CL_CMD_LOOK"], { target: tilemap[this.tile_hovered].ch_nr });
                        }
                    }
                } else if (this.doc_mouseheld.left && this.doc_keyheld.alt && this.selected_char) {
                    // Deselect character when alt-clicking away
                    this.selected_char = 0;
                }
            } else {
                if (this.doc_mouseheld.left) {
                    // Move to position
                    this.queueCommand(cl_cmds["CL_CMD_MOVE"], { x: mpos.x, y: mpos.y });
                } else if (this.doc_mouseheld.right) {
                    // Look at position
                    this.queueCommand(cl_cmds["CL_CMD_TURN"], { x: mpos.x, y: mpos.y });
                }
            }
        }
        this.doc_mouseheld.left = 0;
        this.doc_mouseheld.middle = 0;
        this.doc_mouseheld.right = 0;

        if (!this.pl.citem) this.setCursorImg(cursor_img);
    }

    autohide(x, y) {
        if (x >= renderdistance / 2 || y <= renderdistance / 2) return 0;
        return 1;
    }

    /** Draws the given image into the map isometrically */
    mapDraw(img, x, y, xoff, yoff, redraw) {
        this.mapCanvas.drawImageIsometric(img, x, y, xoff, yoff, redraw);
    }

    /** Draws the sprite with the given number into the map isometrically */
    mapDrawNum(nr, x, y, xoff, yoff, redraw) {
        this.mapDraw(getNumSpritePath(nr), x, y, xoff, yoff, redraw);
    }

    /** Main map rendering function */
    renderMap(tilemap) {
        if (!tilemap) return;
        this.last_tilemap = tilemap;

        this.mapCanvas.clearContext();

        var x1 = 2;
        var x2 = renderdistance - 1;
        var y1 = 2;
        var y2 = renderdistance - 2;

        // Main player offset
        var pl_xoff = 0;
        var pl_yoff = 0;
        var plr_tile_id = (renderdistance / 2) + (renderdistance / 2) * renderdistance;

        if (tilemap[plr_tile_id]) {
            pl_xoff = -Math.round(tilemap[plr_tile_id].obj_xoff);
            pl_yoff = -Math.round(tilemap[plr_tile_id].obj_yoff);
        }

        // Draw all floors first
        for (var i = y1; i < y2; i++) {
            for (var j = x2 - 1; j > x1; j--) {
                var tile_id = i + j * renderdistance;
                var tile = tilemap[tile_id];
                if (!tile) continue;

                var fx_suff = "l" + tile.light;
                var gfx_filter = "brightness(" + Math.round((16 - tile.light) * 100 / 16) + "%)";

                // Hovered tile effect
                if (this.tile_hovered == tile_id && !this.doc_keyheld.ctrl && !this.doc_keyheld.alt) {
                    if (!this.doc_keyheld.shift || (this.doc_keyheld.shift && !(tilemap[this.tile_hovered].flags & ISITEM) && this.pl.citem)) {
                        gfx_filter = "brightness(200%)";
                        fx_suff = "hover";
                    }
                }

                if (tile.ba_sprite) {
                    var spr_suff = getNumSpritePath(tile.ba_sprite) + fx_suff;
                    this.mapCanvas.loadImage(getNumSpritePath(tile.ba_sprite), 1, gfx_filter, spr_suff);
                    this.mapDraw(spr_suff, j, i, pl_xoff, pl_yoff, 0);
                }

                // Target position image
                if (tile.x == this.pl.goto_x && tile.y == this.pl.goto_y) {
                    this.mapDrawNum(31, j, i, pl_xoff, pl_yoff, 0);
                }
            }
        }

        // Items & characters next
        for (var i = y1; i < y2; i++) {
            for (var j = x2 - 1; j > x1; j--) {
                var tile_id = i + j * renderdistance;
                var tile = tilemap[tile_id];
                if (!tile) continue;

                var fx_suff = "l" + tile.light;
                var gfx_filter_first = "brightness(" + Math.round((16 - tile.light) * 100 / 16) + "%)";
                var gfx_filter = gfx_filter_first;

                // Load new character sprite sets
                if (tile.ch_sprite && !this.mapCanvas.getImage(getNumSpritePath(tile.ch_sprite))) {
                    loadCharGFX(this.mapCanvas, tile.ch_sprite);
                }

                // Item
                if (tile.obj1) {
                    var it = tile.obj1;
                    // Autohide
                    if (this.hide_walls && !(tilemap[tile_id].flags & ISITEM) && !this.autohide(i, j)) it++;

                    // Shift hover effect
                    if (this.doc_keyheld.shift && this.tile_hovered == tile_id && tilemap[tile_id].flags & (ISUSABLE|ISITEM)) {
                        gfx_filter = "brightness(200%)";
                        fx_suff = "hover";
                    }
                    var it_spr_suff = getNumSpritePath(it) + fx_suff;

                    this.mapCanvas.loadImage(getNumSpritePath(it), 1, gfx_filter, it_spr_suff);
                    this.mapDraw(it_spr_suff, j, i, pl_xoff, pl_yoff, 0);
                }

                // Reset filter for characters
                gfx_filter = gfx_filter_first;

                // Character
                var obj_xoff = Math.round(tilemap[tile_id].obj_xoff);
                var obj_yoff = Math.round(tilemap[tile_id].obj_yoff);

                if (tile.obj2) {
                    // Selected char effect
                    if (this.selected_char == tilemap[tile_id].ch_nr) {
                        gfx_filter += " sepia(90%) hue-rotate(90deg) saturate(4)";
                    }

                    // Ctrl / Alt hover effect
                    if ((this.doc_keyheld.ctrl || this.doc_keyheld.alt) && this.tile_hovered == tile_id) {
                        gfx_filter += " brightness(200%)";
                    }

                    // Draw characters into a temporary canvas, apply filter, then print it (makes filtering characters more efficient)
                    var char_img = this.mapCanvas.getImage(getNumSpritePath(tile.obj2));
                    if (char_img) {
                        this.char_cv.width = char_img.width;
                        this.char_cv.height = char_img.height;
                        this.char_cv_ctx.clearRect(0, 0, char_img.width, char_img.height);

                        this.char_cv_ctx.filter = gfx_filter;
                        this.char_cv_ctx.drawImage(char_img, 0, 0);

                        this.mapDraw(this.char_cv, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff, 0);
                    }
                }

                /** PLAYER COMMAND SPRITES */
                // Attack target sprite
                if (this.pl.attack_cn && this.pl.attack_cn == tilemap[tile_id].ch_nr)
                    this.mapDrawNum(34, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                // Give target sprite
                if (this.pl.misc_action == DR_GIVE && this.pl.misc_target1 == tilemap[tile_id].ch_nr)
                    this.mapDrawNum(45, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);
                
                // Drop at position
                if (this.pl.misc_action == DR_DROP && this.pl.misc_target1 == tilemap[tile_id].x && this.pl.misc_target2 == tilemap[tile_id].y)
                    this.mapDrawNum(32, j, i, pl_xoff, pl_yoff);
                
                // Pickup from position
                if (this.pl.misc_action == DR_PICKUP && this.pl.misc_target1 == tilemap[tile_id].x && this.pl.misc_target2 == tilemap[tile_id].y)
                    this.mapDrawNum(33, j, i, pl_xoff, pl_yoff);
                
                // Use at position
                if (this.pl.misc_action == DR_USE && this.pl.misc_target1 == tilemap[tile_id].x && this.pl.misc_target2 == tilemap[tile_id].y)
                    this.mapDrawNum(45, j, i, pl_xoff, pl_yoff);

                /** MAP EFFECTS */
                // Injury effects
                if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == INJURED)
                    this.mapDrawNum(1079, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1))
                    this.mapDrawNum(1080, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED2))
                    this.mapDrawNum(1081, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1|INJURED2))
                    this.mapDrawNum(1082, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);
                
                // Death mist
                if (tilemap[tile_id].flags & DEATH) {
                    var m_spr = 280 + ((tilemap[tile_id].flags & DEATH) >> 17) - 1;
                    if (tilemap[tile_id].obj2) {
                        this.mapDrawNum(m_spr, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);
                    } else {
                        this.mapDrawNum(m_spr, j, i, pl_xoff, pl_yoff);
                    }
                }

                // Grave
                if (tilemap[tile_id].flags & TOMB) {
                    var grave_sprnum = 240 + ((tilemap[tile_id].flags & TOMB) >> 12) - 1;
                    var grave_spr_suff = getNumSpritePath(grave_sprnum) + fx_suff;
                    this.mapCanvas.loadImage(getNumSpritePath(grave_sprnum), 1, gfx_filter, grave_spr_suff);
                    this.mapDraw(grave_spr_suff, j, i, pl_xoff, pl_yoff);
                }

                // Character info
                let ch_nr = tilemap[tile_id].ch_nr;
                if (ch_nr) {
                    let char_info = null;
                    if (this.look_chars.hasOwnProperty(ch_nr)) char_info = this.look_chars[ch_nr];

                    if (!char_info && !this.charlookup_req.hasOwnProperty(ch_nr)) {
                        // Queue new character for lookup
                        this.charlookup_req[ch_nr] = 1;

                        setTimeout(() => {
                            delete this.charlookup_req[ch_nr];
                        }, 2000);

                        this.queueCommand(cl_cmds["CL_CMD_AUTOLOOK"], { ch_nr: ch_nr });

                    } else if (char_info) {
                        // Character name
                        var chname_img;
                        var chname_full = char_info.name;
                        if (tilemap[tile_id].ch_proz) chname_full += " " + tilemap[tile_id].ch_proz + "%";

                        if (!this.charname_imgs.hasOwnProperty(chname_full)) {
                            chname_img = this.fontDrawer.get_text_img(FNT_YELLOW, chname_full);
                            this.charname_imgs[chname_full] = chname_img;
                        }
                        chname_img = this.charname_imgs[chname_full];

                        if (chname_img) {
                            var chname_xoff = Math.round(pl_xoff + obj_xoff);
                            var chname_yoff = Math.round(pl_yoff + obj_yoff - this.char_cv.height + 4);
                            this.mapDraw(chname_img, j, i, chname_xoff, chname_yoff);
                        }

                        // Healthbar
                        if (tilemap[tile_id].ch_proz) {
                            this.char_hbar_cv.width = Math.ceil(48 * tilemap[tile_id].ch_proz / 100);
                            this.char_hbar_cv.getContext('2d').fillStyle = 'red';
                            this.char_hbar_cv.getContext('2d').fillRect(0, 0, this.char_hbar_cv.width, 1);

                            var hbar_xoff = pl_xoff + obj_xoff - Math.floor((48 - this.char_hbar_cv.width) / 2);
                            var hbar_yoff = pl_yoff + obj_yoff - this.char_cv.height + 9;
                            this.mapDraw(this.char_hbar_cv, j, i, hbar_xoff, hbar_yoff);
                        }
                    }
                }
            }
        }

        if (this.pl.citem) {
            this.setCursorImg(getNumSpritePath(this.pl.citem), 16);
            this.citem_last = this.pl.citem;
        } else if (this.citem_last) {
            this.setCursorImg(this.cursor_default);
            this.citem_last = 0;
        }

        // Update inventory items
        for (var i = 0; i < 40; i++) {
            if (this.pl.item[i]) {
                this.inv_elems[i].style.backgroundImage = "url(" + getNumSpritePath(this.pl.item[i]) + ")";
            } else {
                this.inv_elems[i].style.backgroundImage = "none";
            }
        }
    }
}