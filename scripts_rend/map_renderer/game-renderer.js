function padSpriteNum(nr) { return ("00000" + nr).substr(-5); }
function getNumSpritePath(nr) { return dirPath + "gfx/" + padSpriteNum(nr) + ".png"; }

/** Load all of a character's animations (given the first sprite number) into a CanvasHandler object */
function loadCharGFX(cv_handler, ch_spr) {
    // Idle sprites
    for (var i = 0; i < 8; i++) {
        cv_handler.loadImage(getNumSpritePath(ch_spr + 8 * i), 1, "none", null, false);
    }
    // Animations
    for (var i = 0; i < 384; i++) {
        cv_handler.loadImage(getNumSpritePath(ch_spr + 64 + i), 1, "none", null, false);
    }
}

class GameRenderer {
    constructor(player, sfxPlayer) {
        this.pl = player;
        this.sfxPlayer = sfxPlayer;

        // Command queue
        this.cmdQueue = [];

        // Map/floor drawing canvas
        var map_xoff = 0;
        var map_yoff = 360;
        if (renderdistance == 34) map_xoff = 64;
        else if (renderdistance == 54) map_xoff = -280;

        this.mapCanvas = new CanvasHandler(document.getElementById('cv-map'));
        this.mapCanvas.setDefaultOffset(map_xoff, map_yoff, true);
        this.mapCanvas.setLoadingImage(getNumSpritePath(35));

        this.floorCanvas = new CanvasHandler(document.createElement('canvas'), this.mapCanvas.cv.width, this.mapCanvas.cv.height);
        this.floorCanvas.setDefaultOffset(map_xoff, map_yoff, true);
        this.floorCanvas.setLoadingImage(getNumSpritePath(35));
        this.floorCanvas.onImageLoadCallback(() => { this.update_floors = true; });

        this.drawn_floors = {};
        this.update_floors = true;
        this.floors_clearctx = true;

        this.pl_lastpos = [0, 0];

        // Minimap renderer
        this.minimapRenderer = new MinimapRenderer();
        this.minimap_zoom = 1;
        this.update_minimap = true;

        // Minimap buttons
        document.getElementById("span-minimap-buttonplus").onclick = () => {   // Zoom in
            if (this.minimap_zoom < 4) this.minimap_zoom++;
            this.update_minimap = true;
        }
        document.getElementById("span-minimap-buttonminus").onclick = () => {  // Zoom out
            if (this.minimap_zoom > 1) this.minimap_zoom--;
            this.update_minimap = true;
        }

        // Load minimap color data
        this.mapCanvas.loadAvgcolors("./data/minimap/color_data.json");
        // Minimap autosave color data
        setInterval(() => {
            fs.writeFile("./data/minimap/color_data.json", JSON.stringify(this.mapCanvas.avgColors), (err) => {
                if (err) console.log(err);
            });
        }, 30000);

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
        this.cursor_default = dirPath + "gfx/MOUSE.png";

        // Pre-load basic images
        this.mapCanvas.loadImage(getNumSpritePath(32), 1, "none", null, false); // Drop at position
        this.mapCanvas.loadImage(getNumSpritePath(33), 1, "none", null, false); // Take from position
        this.mapCanvas.loadImage(getNumSpritePath(34), 1, "none", null, false); // Attack target
        this.mapCanvas.loadImage(getNumSpritePath(45), 1, "none", null, false); // Give target/Use target
        for (var i = 47; i < 63; i++)
            this.mapCanvas.loadImage(getNumSpritePath(i), 1, "none", null, false); // Build flags
        for (var i = 72; i < 85; i++)
            this.mapCanvas.loadImage(getNumSpritePath(i), 1, "none", null, false); // Build flags
        for (var i = 1078; i < 1082; i++)
            this.mapCanvas.loadImage(getNumSpritePath(i), 1, "none", null, false); // Injured char fx
        for (var i = 0; i < 8; i++)
            this.mapCanvas.loadImage(`${dirPath}gfx/misc/spell_fx${i}.png`, 1, "none", null, false); // Spell fx
        for (var i = 240; i < 268; i++)
            this.mapCanvas.loadImage(getNumSpritePath(i), 1, "none", null, false); // Grave skeleton falling fx
        for (var i = 280; i < 298; i++)
            this.mapCanvas.loadImage(getNumSpritePath(i), 1, "none", null, false); // Poof fx

        this.mapCanvas.loadImage(getNumSpritePath(31), 1, "none", null, false); // Target tile (player movement)
        this.mapCanvas.loadImage(dirPath + "gfx/misc/tile_hover.png", 1, "opacity(0.7)", null, false); // Tile hover

        // Hovered tile in map
        this.tile_hovered = -1;

        // Map rendering variables
        this.hide_walls = true;
        this.hide_hpbars = false;
        this.hide_hp = false;
        this.hide_names = false;

        // Skills
        this.div_skills = document.getElementById('div-skills');
        this.stat_points_used = 0;
        this.stat_raised = [];
        for (var i = 0; i < 108; i++) this.stat_raised.push(0);

        this.skillbind_selected = null;

        this.createSkillSlots();

        // Skill update button
        var skill_updbutton = document.getElementById('span-skill-updatebutton');
        skill_updbutton.onclick = () => {
            this.sfxPlayer.play_sfx("click");
            
            this.stat_points_used = 0;

            var m;
            for (let n = 0; n < this.stat_raised.length; n++) {
                if (this.stat_raised[n]) {
                    if (n > 7) {
                        m = skilltab[n-8].nr + 8;
                    } else m = n;
                    this.queueCommand(cl_cmds.CL_CMD_STAT, { x1: m, x2: this.stat_raised[n] });
                }
                this.stat_raised[n] = 0;
            }
        };
        skill_updbutton.oncontextmenu = () => {
            this.chatLogger.chat_logmsg_format("Make the changes permanent.", FNT_YELLOW);
        };

        // Character speed buttons
        this.but_speed_slow = document.getElementById('but-speed-slow');
        this.but_speed_slow.onclick = () => {
            this.queueCommand(cl_cmds.CL_CMD_MODE, { x1: 0, x2: 0 });
            this.sfxPlayer.play_sfx("click");
        };

        this.but_speed_normal = document.getElementById('but-speed-normal');
        this.but_speed_normal.onclick = () => {
            this.queueCommand(cl_cmds.CL_CMD_MODE, { x1: 1, x2: 0 });
            this.sfxPlayer.play_sfx("click");
        };

        this.but_speed_fast = document.getElementById('but-speed-fast');
        this.but_speed_fast.onclick = () => {
            this.queueCommand(cl_cmds.CL_CMD_MODE, { x1: 2, x2: 0 });
            this.sfxPlayer.play_sfx("click");
        };

        this.selected_char = 0;

        this.spellfx_cv = document.createElement('canvas');
        this.spellfx_cv.width = 64;
        this.spellfx_cv.height = 64;
        this.spellfx_cv_ctx = this.spellfx_cv.getContext('2d');

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
                this.sfxPlayer.play_sfx("click");
            };

            // Inv slot right click
            tmp_invelem.oncontextmenu = () => {
                this.queueCommand(cl_cmds.CL_CMD_INV_LOOK, { data1: i, data2: 0, data3: this.selected_char });
                this.sfxPlayer.play_sfx("click");
            };

            this.div_inv.appendChild(tmp_invelem);
        }

        // Equipment display functionality (slot # must match server-side)
        // Each slot # contains object: { elem: <equip slot element>, default_img: <path to placeholder empty slot image> }
        this.equip_slot_elems = {
            0: { elem: document.getElementById('eq-helmet'), default_img: `${dirPath}gfx/ui/eq_helm.png` },
            1: { elem: document.getElementById('eq-amulet'), default_img: `${dirPath}gfx/ui/eq_amulet.png` },
            2: { elem: document.getElementById('eq-armor'), default_img: `${dirPath}gfx/ui/eq_armor.png` },
            3: { elem: document.getElementById('eq-sleeves'), default_img: `${dirPath}gfx/ui/eq_sleeves.png` },
            4: { elem: document.getElementById('eq-belt'), default_img: `${dirPath}gfx/ui/eq_belt.png` },
            5: { elem: document.getElementById('eq-legs'), default_img: `${dirPath}gfx/ui/eq_legs.png` },
            6: { elem: document.getElementById('eq-boots'), default_img: `${dirPath}gfx/ui/eq_boots.png` },
            7: { elem: document.getElementById('eq-offhand'), default_img: `${dirPath}gfx/ui/eq_offhand.png` },
            8: { elem: document.getElementById('eq-weapon'), default_img: `${dirPath}gfx/ui/eq_weapon.png` },
            9: { elem: document.getElementById('eq-cloak'), default_img: `${dirPath}gfx/ui/eq_cloak.png` },
            10: { elem: document.getElementById('eq-right-ring'), default_img: `${dirPath}gfx/ui/eq_ring.png` },
            11: { elem: document.getElementById('eq-left-ring'), default_img: `${dirPath}gfx/ui/eq_ring.png` }
        }

        for (let i in this.equip_slot_elems) {
            this.equip_slot_elems[i].elem.style.backgroundImage = "url(" + this.equip_slot_elems[i].default_img + ")";
            this.equip_slot_elems[i].elem.onclick = () => {
                var d1 = 5;
                if (this.doc_keyheld.shift) d1 = 1;
                this.queueCommand(cl_cmds.CL_CMD_INV, { data1: d1, data2: i, data3: this.selected_char });
                this.sfxPlayer.play_sfx("click");
            };
            this.equip_slot_elems[i].elem.oncontextmenu = () => {
                this.queueCommand(cl_cmds.CL_CMD_INV, { data1: 7, data2: i, data3: this.selected_char });
                this.sfxPlayer.play_sfx("click");
            };
        }

        // Character display elements
        this.cdisp_span_charname = document.getElementById('span-charname');
        this.cdisp_span_rankname = document.getElementById('span-rankname');
        this.cdisp_span_money = document.getElementById('span-money');

        this.cdisp_img_rank = document.getElementById('img-rank-display');
        this.cdisp_bar_hp = document.getElementById('span-displaybar-hp');
        this.cdisp_bar_end = document.getElementById('span-displaybar-end');
        this.cdisp_bar_mana = document.getElementById('span-displaybar-mana');

        this.cdisp_wv = document.getElementById('span-weaponvalue');
        this.cdisp_av = document.getElementById('span-armorvalue');
        this.cdisp_exp = document.getElementById('span-experience');
        this.cdisp_xpbar = document.getElementById('span-xpbar');

        this.cdisp_charcv = document.getElementById('cv-char-display');
        this.cdisp_charcv.width = 64;
        this.cdisp_charcv.height = 64;
        this.cdisp_charcv_ctx = this.cdisp_charcv.getContext('2d');

        this.div_buffs = document.getElementById('div-buffs');

        // Shop screen
        this.shop_screen = document.getElementById('div-shop');
        this.shop_div_items = document.getElementById('div-shopitems');
        this.shop_title = document.getElementById('h2-shoptitle');
        this.shop_span_money = document.getElementById('span-money-shop');
        this.shop_intv = null;
        this.shop_id = 0;
        this.shop_sellval = 0;

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
                    // Chat input history cycle up
                    var chat_inp = document.getElementById('inp-chatbox');
                    if (document.activeElement == chat_inp && this.chat_history.length > 0) {
                        if (this.chat_history_sel < this.chat_history.length) this.chat_history_sel++;

                        chat_inp.value = this.chat_history[this.chat_history_sel - 1];
                    }
                break;
                case "ArrowDown":
                    // Chat input history cycle down
                    var chat_inp = document.getElementById('inp-chatbox');
                    if (document.activeElement == chat_inp && this.chat_history.length > 0) {
                        if (this.chat_history_sel > 1) this.chat_history_sel--;

                        chat_inp.value = this.chat_history[this.chat_history_sel - 1];
                    }
                break;

                case "Escape": this.toggleShop(false); break;

                case "F1": if (!this.doc_keyheld.shift) this.but_speed_slow.click(); break;
                case "F2": if (!this.doc_keyheld.shift) this.but_speed_normal.click(); break;
                case "F3": if (!this.doc_keyheld.shift) this.but_speed_fast.click(); break;
            }

            // Skillbind hotkeys
            if (this.doc_keyheld.shift) {
                switch (e.key) {
                    case "F1":
                    case "F2":
                    case "F3":
                    case "F4":
                    case "F5":
                    case "F6":
                    case "F7":
                    case "F8":
                    case "F9":
                    case "F10":
                    case "F11":
                    case "F12":
                        document.getElementById(`span-skillbind${parseInt(e.key.substring(1))}`).click();
                    break;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case "Shift": this.doc_keyheld.shift = 0; break;
                case "Alt": this.doc_keyheld.alt = 0; break;
                case "Control": this.doc_keyheld.ctrl = 0; break;
            }
        });

        // Toggle buttons
        var but_hw = document.getElementById('but-togglewalls');
        but_hw.onclick = () => {
            this.hide_walls = !this.hide_walls;
            if (this.hide_walls) but_hw.style.border = "1px solid red";
            else but_hw.style.border = "1px solid white";
        };

        var but_hp = document.getElementById('but-togglehp');
        but_hp.onclick = () => {
            this.hide_hp = !this.hide_hp;
            if (this.hide_hp) but_hp.style.border = "1px solid red";
            else but_hp.style.border = "1px solid white";
        };

        var but_hpb = document.getElementById('but-togglehpbars');
        but_hpb.onclick = () => {
            this.hide_hpbars = !this.hide_hpbars;
            if (this.hide_hpbars) but_hpb.style.border = "1px solid red";
            else but_hpb.style.border = "1px solid white";
        };

        var but_n = document.getElementById('but-togglenames');
        but_n.onclick = () => {
            this.hide_names = !this.hide_names;
            if (this.hide_names) but_n.style.border = "1px solid red";
            else but_n.style.border = "1px solid white";
        };
    }

    /** Reset relevant variables, for exiting current character session */
    resetVars() {
        this.resetCursor();
        this.pl.reset();
        this.updateMaincharData();

        // Raised skills
        for (var i = 0; i < this.stat_raised.length; i++) {
            this.stat_raised[i] = 0;
        }
        this.stat_points_used = 0;
        
        this.skillbind_selected = null;
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

    toggleShop(tog, shop_id=0, is_shop=false) {
        if (this.shop_intv) clearInterval(this.shop_intv);

        if (tog) {
            if (is_shop) this.shop_title.innerHTML = "Shop";
            else this.shop_title.innerHTML = "Grave";

            this.shop_screen.style.display = "block";

            if (shop_id) {
                this.shop_id = shop_id;
                this.shop_intv = setInterval(() => {
                    this.queueCommand(cl_cmds.CL_CMD_LOOK, { target: shop_id });
                }, 500);
            }
        } else {
            this.shop_id = 0;
            this.shop_screen.style.display = "none";
        }
    }

    updateShopSellval(shop_id, val) {
        if (shop_id != this.shop_id) return;
        this.shop_sellval = val;
        this.updateMaincharData();
    }

    clearShop() {
        while (this.shop_div_items.firstChild) {
            this.shop_div_items.removeChild(this.shop_div_items.firstChild);
        }
    }

    addShopItem(item_id, shop_id, item_img, item_price) {
        var div_shopitem = document.createElement('div');
        div_shopitem.className = "div-shopitem";
        div_shopitem.onclick = () => {
            this.queueCommand(cl_cmds.CL_CMD_SHOP, { x1: shop_id, x2: item_id });
            this.sfxPlayer.play_sfx("click");
        };
        div_shopitem.oncontextmenu = () => {
            this.queueCommand(cl_cmds.CL_CMD_SHOP, { x1: shop_id, x2: item_id + 62 });
            this.sfxPlayer.play_sfx("click");
        };

        var img_shopitem = document.createElement('img');
        img_shopitem.className = "img-shopitem unselectable";
        img_shopitem.src = item_img;
        div_shopitem.appendChild(img_shopitem);

        if (item_price != 0) {
            var span_itemprice = document.createElement('span');
            span_itemprice.className = "unselectable";
            span_itemprice.style.display = "block";
            span_itemprice.innerHTML = `${Math.floor(item_price / 100)}G ${item_price % 100}S`;
            div_shopitem.appendChild(span_itemprice);
        }

        this.shop_div_items.appendChild(div_shopitem);
    }

    setCursorImg(img_path, offset = 0) {
        this.mapCanvas.cv.style.cursor = `url(${img_path}) ${offset} ${offset}, auto`;
        document.body.style.cursor = `url(${img_path}) ${offset} ${offset}, auto`;
    }

    resetCursor() {
        this.setCursorImg(this.cursor_default);
    }

    /** Get isometric tile position of cursor within map canvas. Receives mouse event */
    getCursorIso(e) {
        var mpos = CanvasHandler.getCursorPosition(this.mapCanvas.cv, e);
        var in_canvas = 1;
        if (mpos.x < 0 || mpos.y < 0 || mpos.x > this.mapCanvas.cv.width || mpos.y > this.mapCanvas.cv.height) in_canvas = 0;

        var x = mpos.x;
        if (renderdistance == 34) x += 480;
        else if (renderdistance == 54) x += 160;
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
                                this.sfxPlayer.play_sfx("click");
                            } else if (this.doc_mouseheld.right) {
                                // Look at item
                                this.queueCommand(cl_cmds["CL_CMD_LOOK_ITEM"], { x: mpos.x, y: mpos.y });
                                this.sfxPlayer.play_sfx("click");
                            }
                        } else {
                            //cursor_img = getNumSpritePath();

                            if (this.doc_mouseheld.left) {
                                // Pick up item
                                this.queueCommand(cl_cmds["CL_CMD_PICKUP"], { x: mpos.x, y: mpos.y });
                                this.sfxPlayer.play_sfx("click");
                            } else if (this.doc_mouseheld.right) {
                                // Look at item
                                this.queueCommand(cl_cmds["CL_CMD_LOOK_ITEM"], { x: mpos.x, y: mpos.y });
                                this.sfxPlayer.play_sfx("click");
                            }
                        }
                    }
                } else if (this.doc_mouseheld.left) {
                    if (tilemap[this.tile_hovered].flags & ISUSABLE) {
                        // Use citem on hovered item
                        this.queueCommand(cl_cmds["CL_CMD_USE"], { x: mpos.x, y: mpos.y });
                        this.sfxPlayer.play_sfx("click");
                    } else {
                        // Drop item
                        this.queueCommand(cl_cmds["CL_CMD_DROP"], { x: mpos.x, y: mpos.y });
                        this.sfxPlayer.play_sfx("click");
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
                                this.sfxPlayer.play_sfx("click");
                            } else {
                                // Attack character
                                this.queueCommand(cl_cmds["CL_CMD_ATTACK"], { target: tilemap[this.tile_hovered].ch_nr });
                                this.sfxPlayer.play_sfx("click");
                            }
                        } else if (this.doc_mouseheld.right) {
                            // Look at character
                            this.queueCommand(cl_cmds["CL_CMD_LOOK"], { target: tilemap[this.tile_hovered].ch_nr });
                            this.sfxPlayer.play_sfx("click");
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
                            this.sfxPlayer.play_sfx("click");
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
                    this.sfxPlayer.play_sfx("click");
                } else if (this.doc_mouseheld.right) {
                    // Look at position
                    this.queueCommand(cl_cmds["CL_CMD_TURN"], { x: mpos.x, y: mpos.y });
                    this.sfxPlayer.play_sfx("click");
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
        var plr_xpos = 0;
        var plr_ypos = 0;
        var pl_moved = false;

        if (tilemap[plr_tile_id]) {
            pl_xoff = -Math.round(tilemap[plr_tile_id].obj_xoff);
            pl_yoff = -Math.round(tilemap[plr_tile_id].obj_yoff);
            plr_xpos = tilemap[plr_tile_id].x;
            plr_ypos = tilemap[plr_tile_id].y;

            if (plr_xpos != this.pl_lastpos[0] || plr_ypos != this.pl_lastpos[1]) {
                pl_moved = true;
                this.pl_lastpos[0] = plr_xpos;
                this.pl_lastpos[1] = plr_ypos;
            }
        }

        // Draw all floors first
        if (this.update_floors || pl_moved) {
            this.update_floors = false;

            //var time_start = window.performance.now();
            if (this.floors_clearctx) {
                this.floors_clearctx = false;
                this.floorCanvas.clearContext(this.mapCanvas.cv.width, this.mapCanvas.cv.height);
            }
            for (var i = y1; i < y2; i++) {
                for (var j = x2 - 1; j > x1; j--) {
                    var tile_id = i + j * renderdistance;
                    var tile = tilemap[tile_id];
                    if (!tile) continue;
                    if (tile.flags & INVIS || !tile.ba_sprite) continue;

                    var fx_suff = "l" + tile.light;
                    var gfx_filter = "";
                    var gfx_filter_fx = "";
                    var first_fx = false;
                    var gfx_brightness = Math.round((16 - tile.light) * 100 / 16);

                    // Underwater effect
                    if (tile.flags & UWATER) {
                        if (!first_fx) {
                            first_fx = true;
                            gfx_filter_fx += " sepia(1) saturate(2)";
                            gfx_brightness = Math.ceil(gfx_brightness / 1.5);
                        }
                        gfx_filter_fx += " hue-rotate(240deg)";
                        fx_suff += "uwater";
                    }

                    gfx_filter = `brightness(${gfx_brightness}%) ${gfx_filter_fx}`;

                    var spr_path = getNumSpritePath(tile.ba_sprite);
                    var spr_suff = spr_path + fx_suff;

                    // Assign average color to tile
                    if (tile.it_sprite) {
                        var avgcol = this.mapCanvas.getImageAvgcol(getNumSpritePath(tile.it_sprite));
                        if (avgcol) tile.avgcol = avgcol.slice();
                    } else {
                        var avgcol = this.floorCanvas.getImageAvgcol(spr_path);
                        if (avgcol) tile.avgcol = avgcol.slice();
                    }

                    if (this.drawn_floors.hasOwnProperty(tile_id)) {
                        if (this.drawn_floors[tile_id] == spr_suff) continue;
                    }

                    if (!this.floorCanvas.getImage(spr_suff)) {
                        this.floorCanvas.loadImage(spr_path, 1, gfx_filter, spr_suff);
                    } else {
                        this.drawn_floors[tile_id] = spr_suff;
                    }

                    this.floorCanvas.drawImageIsometric(spr_suff, j, i, 0, 0, 0);
                }
            }
            //console.log("drawing floors took", window.performance.now() - time_start, "ms");
        }
        this.mapCanvas.ctx.drawImage(this.floorCanvas.cv, pl_xoff, pl_yoff);

        // Items & characters next
        for (var i = y1; i < y2; i++) {
            for (var j = x2 - 1; j > x1; j--) {
                var tile_id = i + j * renderdistance;
                var tile = tilemap[tile_id];
                if (!tile) continue;

                // Target position image
                if (tile.x == this.pl.goto_x && tile.y == this.pl.goto_y) {
                    this.mapDrawNum(31, j, i, pl_xoff, pl_yoff, 0);
                }

                if (tile.flags & INVIS) continue;

                // Hovered tile image
                if (this.tile_hovered == tile_id && !this.doc_keyheld.ctrl && !this.doc_keyheld.alt) {
                    if (!this.doc_keyheld.shift || (this.doc_keyheld.shift && !(tilemap[this.tile_hovered].flags & ISITEM) && this.pl.citem)) {
                        this.mapDraw(dirPath + "gfx/misc/tile_hover.png", j, i, pl_xoff, pl_yoff, 0);
                    }
                }

                var fx_suff = "l" + tile.light;
                var gfx_filter = "";
                var gfx_filter_fx = "";
                var first_fx = false;
                var tile_light = Math.round((16 - tile.light) * 100 / 16);

                var gfx_brightness = tile_light;

                // Load new character sprite sets
                if (tile.ch_sprite && !this.mapCanvas.getImage(getNumSpritePath(tile.ch_sprite))) {
                    loadCharGFX(this.mapCanvas, tile.ch_sprite);
                }

                // Item
                if (tile.obj1) {
                    var it = tile.obj1;
                    // Autohide
                    if (this.hide_walls && !(tile.flags & ISITEM) && !this.autohide(i, j)) it++;

                    // Underwater effect
                    if (tile.flags & UWATER) {
                        if (!first_fx) {
                            first_fx = true;
                            gfx_filter_fx = " sepia(90%) saturate(2)";
                            gfx_brightness = Math.ceil(gfx_brightness / 1.5);
                        }
                        gfx_filter_fx += " hue-rotate(210deg)";
                        fx_suff += "uwater";
                    }

                    // Shift hover effect
                    if (this.doc_keyheld.shift && this.tile_hovered == tile_id && tile.flags & (ISUSABLE|ISITEM)) {
                        gfx_brightness = 200;
                        fx_suff += "hover";
                    }

                    gfx_filter = `brightness(${gfx_brightness}%) ${gfx_filter_fx}`;

                    var it_spr_path = getNumSpritePath(it);
                    var it_spr_suff = it_spr_path + fx_suff;

                    this.mapCanvas.loadImage(it_spr_path, 1, gfx_filter, it_spr_suff);
                    this.mapDraw(it_spr_suff, j, i, pl_xoff, pl_yoff, 0);
                }

                // Reset filter for characters
                gfx_filter_fx = "";
                first_fx = false;
                gfx_brightness = tile_light;

                // Character
                var obj_xoff = Math.round(tile.obj_xoff);
                var obj_yoff = Math.round(tile.obj_yoff);

                if (tile.obj2) {
                    // Selected char effect
                    if (this.selected_char == tile.ch_nr) {
                        if (!first_fx) {
                            first_fx = true;
                            gfx_filter_fx += " sepia(90%) saturate(2)";
                            gfx_brightness = Math.ceil(gfx_brightness / 1.5);
                        }
                        gfx_filter_fx += " hue-rotate(90deg)";
                    } else {
                        // Underwater effect
                        if (tile.flags & UWATER) {
                            if (!first_fx) {
                                first_fx = true;
                                gfx_filter_fx += " sepia(90%) saturate(2)";
                                gfx_brightness = Math.ceil(gfx_brightness / 1.5);
                            }
                            gfx_filter_fx += " hue-rotate(210deg)"
                        }
                    }

                    // Ctrl / Alt hover effect
                    if ((this.doc_keyheld.ctrl || this.doc_keyheld.alt) && this.tile_hovered == tile_id) {
                        gfx_brightness = 200;
                    }

                    // Draw characters into a temporary canvas, apply filter, then print it (makes filtering characters more efficient)
                    var char_img = this.mapCanvas.getImage(getNumSpritePath(tile.obj2));
                    if (char_img) {
                        let tmp_char_cv = document.createElement('canvas');
                        tmp_char_cv.width = 64;
                        tmp_char_cv.height = 64;
                        let tmp_ctx = tmp_char_cv.getContext('2d');

                        gfx_filter = `brightness(${gfx_brightness}%) ${gfx_filter_fx}`;

                        tmp_ctx.filter = gfx_filter;
                        tmp_ctx.drawImage(char_img, 0, 0);

                        // Draw main character on display canvas as well
                        if (tile_id == plr_tile_id) {
                            this.cdisp_charcv_ctx.clearRect(0, 0, char_img.width, char_img.height);
                            this.cdisp_charcv_ctx.drawImage(char_img, 0, 0);
                        }

                        this.mapDraw(tmp_char_cv, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff, 0);
                    }
                }

                /** PLAYER COMMAND SPRITES */
                // Attack target sprite
                if (this.pl.attack_cn && this.pl.attack_cn == tile.ch_nr)
                    this.mapDrawNum(34, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                // Give target sprite
                if (this.pl.misc_action == DR_GIVE && this.pl.misc_target1 == tile.ch_nr)
                    this.mapDrawNum(45, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);
                
                // Drop at position
                if (this.pl.misc_action == DR_DROP && this.pl.misc_target1 == tile.x && this.pl.misc_target2 == tile.y)
                    this.mapDrawNum(32, j, i, pl_xoff, pl_yoff);
                
                // Pickup from position
                if (this.pl.misc_action == DR_PICKUP && this.pl.misc_target1 == tile.x && this.pl.misc_target2 == tile.y)
                    this.mapDrawNum(33, j, i, pl_xoff, pl_yoff);
                
                // Use at position
                if (this.pl.misc_action == DR_USE && this.pl.misc_target1 == tile.x && this.pl.misc_target2 == tile.y)
                    this.mapDrawNum(45, j, i, pl_xoff, pl_yoff);

                /** MAP EFFECTS */
                // Build flags
                if (tile.flags2 & MF_MOVEBLOCK) this.mapDrawNum(55, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_SIGHTBLOCK) this.mapDrawNum(84, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_INDOORS) this.mapDrawNum(56, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_UWATER) this.mapDrawNum(75, j, i, pl_xoff, pl_yoff, 0);
                //if (tile.flags2 & MF_NOFIGHT) this.mapDrawNum(58, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_NOMONST) this.mapDrawNum(59, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_BANK) this.mapDrawNum(60, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_TAVERN) this.mapDrawNum(61, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_NOMAGIC) this.mapDrawNum(62, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_DEATHTRAP) this.mapDrawNum(73, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_NOLAG) this.mapDrawNum(57, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_ARENA) this.mapDrawNum(76, j, i, pl_xoff, pl_yoff, 0);
                //if (tile.flags2 & MF_TELEPORT2) this.mapDrawNum(77, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & MF_NOEXPIRE) this.mapDrawNum(82, j, i, pl_xoff, pl_yoff, 0);
                if (tile.flags2 & 0x80000000) this.mapDrawNum(72, j, i, pl_xoff, pl_yoff, 0);
                
                // Injury effects
                if ((tile.flags & (INJURED|INJURED1|INJURED2)) == INJURED)
                    this.mapDrawNum(1079, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                if ((tile.flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1))
                    this.mapDrawNum(1080, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                if ((tile.flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED2))
                    this.mapDrawNum(1081, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);

                if ((tile.flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1|INJURED2))
                    this.mapDrawNum(1082, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);
                
                // Death mist
                if (tile.flags & DEATH) {
                    var m_spr = 280 + ((tile.flags & DEATH) >> 17) - 1;
                    if (tile.obj2) {
                        this.mapDrawNum(m_spr, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff);
                    } else {
                        this.mapDrawNum(m_spr, j, i, pl_xoff, pl_yoff);
                    }
                }

                // Grave
                if (tile.flags & TOMB) {
                    var grave_sprnum = 240 + ((tile.flags & TOMB) >> 12) - 1;
                    var grave_spr_suff = getNumSpritePath(grave_sprnum) + fx_suff;
                    this.mapCanvas.loadImage(getNumSpritePath(grave_sprnum), 1, gfx_filter, grave_spr_suff);
                    this.mapDraw(grave_spr_suff, j, i, pl_xoff, pl_yoff);
                }

                // Spell magic effect
                var spell_color = [0, 0, 0];
                var fx_str = 0;
                if (tile.flags & EMAGIC) {
                    spell_color[0] = 255;
                    fx_str = ((tile.flags & EMAGIC) >> 22) >>> 0;
                }
                if (tile.flags & GMAGIC) {
                    spell_color[1] = 255;
                    fx_str = ((tile.flags & GMAGIC) >> 25) >>> 0;
                }
                if (tile.flags & CMAGIC) {
                    spell_color[2] = 255;
                    fx_str = ((tile.flags & CMAGIC) >> 28) >>> 0;
                }

                if (spell_color[0] != 0 || spell_color[1] != 0 || spell_color[2] != 0) {
                    var spellfx_img = this.mapCanvas.getImage(dirPath + "gfx/misc/spell_fx" + (fx_str - 1) + ".png");
                    if (spellfx_img) {
                        var hue = Math.floor(rgbToHsl(spell_color[0], spell_color[1], spell_color[2])[0] * 360);

                        this.spellfx_cv_ctx.clearRect(0, 0, 64, 64);
                        this.spellfx_cv_ctx.filter = `brightness(0.7) sepia(1) saturate(10000%) hue-rotate(${hue}deg)`;
                        this.spellfx_cv_ctx.drawImage(spellfx_img, 0, 0);

                        this.mapDraw(this.spellfx_cv, j, i, pl_xoff, pl_yoff);
                    }
                }

                // Character info
                let ch_nr = tile.ch_nr;
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
                        if (!this.hide_names || !this.hide_hp) {
                            var chname_img;

                            var tmp_name = char_info.name;
                            if (this.hide_names) tmp_name = "";

                            var tmp_hp = tile.ch_proz + "%";
                            if (this.hide_hp || !tile.ch_proz) tmp_hp = "";
                            else if (!this.hide_names) tmp_name += " ";

                            var chname_full = tmp_name + tmp_hp;

                            if (!this.charname_imgs.hasOwnProperty(chname_full)) {
                                chname_img = this.fontDrawer.get_text_img(FNT_YELLOW, chname_full);
                                this.charname_imgs[chname_full] = chname_img;
                            }
                            chname_img = this.charname_imgs[chname_full];

                            if (chname_img) {
                                var chname_xoff = Math.round(pl_xoff + obj_xoff);
                                var chname_yoff = Math.round(pl_yoff + obj_yoff - 68);
                                this.mapDraw(chname_img, j, i, chname_xoff, chname_yoff);
                            }
                        }

                        // Healthbar
                        if (!this.hide_hpbars) {
                            if (tile.ch_proz) {
                                let hbar_width = Math.ceil(48 * tile.ch_proz / 100);

                                let tmp_char_hbar_cv = document.createElement('canvas');
                                tmp_char_hbar_cv.height = 1;
                                tmp_char_hbar_cv.width = hbar_width;

                                let tmp_hbar_ctx = tmp_char_hbar_cv.getContext('2d');
                                tmp_hbar_ctx.fillStyle = 'red';
                                tmp_hbar_ctx.fillRect(0, 0, hbar_width, 1);

                                var hbar_xoff = pl_xoff + obj_xoff - Math.floor((48 - hbar_width) / 2);
                                var hbar_yoff = pl_yoff + obj_yoff - 64;
                                this.mapDraw(tmp_char_hbar_cv, j, i, hbar_xoff, hbar_yoff);
                            }
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

        if (this.update_minimap || pl_moved) {
            this.update_minimap = false;
            this.minimapRenderer.updateMinimap(tilemap, plr_xpos, plr_ypos, this.minimap_zoom);
        }
    }

    raiseSkill(i) {
        var rep = 1;
        if (this.doc_keyheld.shift) rep = 10;
        else if (this.doc_keyheld.ctrl) rep = 90;

        for (var r = 0; r < rep; r++) {
            if (i < 5) {
                // Raise attribute
                var needed = this.pl.attrib_needed(i, this.pl.attrib[i][0] + this.stat_raised[i]);
                if (needed > this.pl.points - this.stat_points_used) break;
            } else if (i == 5) {
                // Raise hitpoints
                var needed = this.pl.hp_needed(this.pl.hp[0] + this.stat_raised[i]);
                if (needed > this.pl.points - this.stat_points_used) break;
            } else if (i == 6) {
                // Raise endurance
                var needed = this.pl.end_needed(this.pl.end[0] + this.stat_raised[i]);
                if (needed > this.pl.points - this.stat_points_used) break;
            } else if (i == 7) {
                // Raise mana
                var needed = this.pl.mana_needed(this.pl.mana[0] + this.stat_raised[i]);
                if (needed > this.pl.points - this.stat_points_used) break;
            } else {
                // Raise skill
                var m = skilltab[i - 8].nr;
                var needed = this.pl.skill_needed(m, this.pl.skill[m][0] + this.stat_raised[i]);
                if (needed > this.pl.points - this.stat_points_used) break;
            }

            this.stat_points_used += needed;
            this.stat_raised[i]++;
        }
        this.updateSkills();
    }

    lowerSkill(i) {
        var rep = 1;
        if (this.doc_keyheld.shift) rep = 10;
        else if (this.doc_keyheld.ctrl) rep = 90;

        for (var r = 0; r < rep; r++) {
            if (!this.stat_raised[i]) break;

            this.stat_raised[i]--;
            if (i < 5) {
                // Lower attribute
                this.stat_points_used -= this.pl.attrib_needed(i, this.pl.attrib[i][0] + this.stat_raised[i]);
            } else if (i == 5) {
                // Lower hitpoints
                this.stat_points_used -= this.pl.hp_needed(this.pl.hp[0] + this.stat_raised[i]);
            } else if (i == 6) {
                // Lower endurance
                this.stat_points_used -= this.pl.end_needed(this.pl.end[0] + this.stat_raised[i]);
            } else if (i == 7) {
                // Lower mana
                this.stat_points_used -= this.pl.mana_needed(this.pl.mana[0] + this.stat_raised[i]);
            } else {
                // Lower skill
                var m = skilltab[i - 8].nr;
                this.stat_points_used -= this.pl.skill_needed(m, this.pl.skill[m][0] + this.stat_raised[i]);
            }
        }
        this.updateSkills();
    }

    createSkillSlot(id_name, skill_name, upgplus_func, upgminus_func) {
        var div_skillslot = document.createElement('div');
        div_skillslot.id = `div-skillslot-${id_name}`;
        div_skillslot.className = "div-skillslot";
        div_skillslot.style.borderTop = "0";

        // Attrib name
        var span_skillname = document.createElement('span');
        span_skillname.id = `span-${id_name}-name`;
        span_skillname.className = "span-skill span-skill-title unselectable";
        span_skillname.innerHTML = skill_name;
        div_skillslot.appendChild(span_skillname);

        // Attrib value div
        var div_skill_val = document.createElement('div');
        div_skill_val.className = "span-skill div-skill-val unselectable";
        
        // Attrib value display
        var span_skill_val = document.createElement('span');
        span_skill_val.id = `span-${id_name}-value`;
        span_skill_val.innerHTML = "0";
        div_skill_val.appendChild(span_skill_val);

        // Attrib value '-' button
        var span_skill_button_upgminus = document.createElement('span');
        span_skill_button_upgminus.id = `span-${id_name}-button-upgminus`;
        span_skill_button_upgminus.className = "span-skill-upgbutton unselectable";
        div_skill_val.appendChild(span_skill_button_upgminus);

        span_skill_button_upgminus.onclick = upgminus_func;

        // Attrib value '+' button
        var span_skill_button_upgplus = document.createElement('span');
        span_skill_button_upgplus.id = `span-${id_name}-button-upgplus`;
        span_skill_button_upgplus.className = "span-skill-upgbutton unselectable";
        div_skill_val.appendChild(span_skill_button_upgplus);

        span_skill_button_upgplus.onclick = upgplus_func;

        div_skillslot.appendChild(div_skill_val);

        // Attrib upgrade requirement display
        var span_skill_upgval = document.createElement('span');
        span_skill_upgval.id = `span-${id_name}-upg`;
        span_skill_upgval.className = "span-skill span-skill-upg unselectable";
        div_skillslot.appendChild(span_skill_upgval);

        this.div_skills.appendChild(div_skillslot);
    }

    createSkillSlots() {
        // Attribute slots
        for (let i = 0; i < 5; i++) {
            this.createSkillSlot(`attrib${i}`, at_name[i], () => this.raiseSkill(i), () => this.lowerSkill(i));
        }

        // Health
        this.createSkillSlot("hp", "Hitpoints", () => this.raiseSkill(5), () => this.lowerSkill(5));
        // Endurance
        this.createSkillSlot("end", "Endurance", () => this.raiseSkill(6), () => this.lowerSkill(6));
        // Mana
        this.createSkillSlot("mana", "Mana", () => this.raiseSkill(7), () => this.lowerSkill(7));

        // Skill slots
        for (let i = 0; i < skilltab.length; i++) {
            this.createSkillSlot(`skill${i}`, skilltab[i].name, () => this.raiseSkill(8 + i), () => this.lowerSkill(8 + i));
            var elem_skillname = document.getElementById(`span-skill${i}-name`);
            elem_skillname.onclick = () => {
                this.queueCommand(cl_cmds.CL_CMD_SKILL, { data1: skilltab[i].nr, data2: this.selected_char, data3: skilltab[i].attrib[0] });
                this.sfxPlayer.play_sfx("click");
            };
            elem_skillname.oncontextmenu = () => {
                this.skillbind_selected = i;
                this.chatLogger.chat_logmsg_format(skilltab[i].desc, FNT_YELLOW);
            }
        }

        // Skill binds
        for (let i = 0; i < 12; i++) {
            let elem_skillbind = document.getElementById(`span-skillbind${i + 1}`);
            elem_skillbind.onclick = () => {
                if (this.pl.skillbinds[i] != null) {
                    var skill_data = skilltab[this.pl.skillbinds[i]];
                    this.queueCommand(cl_cmds.CL_CMD_SKILL, { data1: skill_data.nr, data2: this.selected_char, data3: skill_data.attrib[0] });
                }
                this.sfxPlayer.play_sfx("click");
            };
            elem_skillbind.oncontextmenu = () => {
                if (this.skillbind_selected != null) {
                    if (this.skillbind_selected == this.pl.skillbinds[i]) {
                        this.pl.skillbinds[i] = null;
                        elem_skillbind.innerHTML = "-";
                        this.chatLogger.chat_logmsg_format(`Skill bind ${i + 1} now set to none.`);
                    } else {
                        this.pl.skillbinds[i] = this.skillbind_selected;

                        var skill_n = skilltab[this.skillbind_selected].name_short;
                        elem_skillbind.innerHTML = skill_n;
                        this.chatLogger.chat_logmsg_format(`Skill bind ${i + 1} now set to ${skill_n}.`);
                    }
                } else if (this.pl.skillbinds[i] != null) {
                    this.chatLogger.chat_logmsg_format(skilltab[this.pl.skillbinds[i]].desc, FNT_YELLOW);
                }
            };
        }
    }

    updateSkill(id_name, value, can_raise, can_lower, upgreq_val) {
        let elem = document.getElementById(`span-${id_name}-value`);
        elem.innerHTML = value;

        elem = document.getElementById(`span-${id_name}-button-upgplus`);
        if (can_raise) elem.innerHTML = "+";
        else elem.innerHTML = "";

        elem = document.getElementById(`span-${id_name}-button-upgminus`);
        if (can_lower) elem.innerHTML = "-";
        else elem.innerHTML = "";

        elem = document.getElementById(`span-${id_name}-upg`);
        elem.innerHTML = upgreq_val;
    }

    updateSkills() {
        for (var i = 0; i < 8 + skilltab.length; i++) {
            var id_name, val, can_raise, upgreq_val;
            if (i < 5) {
                // Update attributes
                id_name = `attrib${i}`;
                val = this.pl.attrib[i][5] + this.stat_raised[i];
                can_raise = this.pl.attrib_needed(i, this.pl.attrib[i][0] + this.stat_raised[i]) <= this.pl.points - this.stat_points_used;
                upgreq_val = this.pl.attrib_needed(i, this.pl.attrib[i][0] + this.stat_raised[i]);
                if (this.pl.attrib_needed(i, this.pl.attrib[i][0] + this.stat_raised[i]) == HIGH_VAL) upgreq_val = "";

            } else if (i == 5) {
                // Update hitpoints
                id_name = "hp";
                val = this.pl.hp[5] + this.stat_raised[i];
                can_raise = this.pl.hp_needed(this.pl.hp[0] + this.stat_raised[i]) <= this.pl.points - this.stat_points_used;
                upgreq_val = this.pl.hp_needed(this.pl.hp[0] + this.stat_raised[i]);
                if (this.pl.hp_needed(this.pl.hp[0] + this.stat_raised[i]) == HIGH_VAL) upgreq_val = "";

            } else if (i == 6) {
                // Update endurance
                id_name = "end";
                val = this.pl.end[5] + this.stat_raised[i];
                can_raise = this.pl.end_needed(this.pl.end[0] + this.stat_raised[i]) <= this.pl.points - this.stat_points_used;
                upgreq_val = this.pl.end_needed(this.pl.end[0] + this.stat_raised[i]);
                if (this.pl.end_needed(i, this.pl.end[0] + this.stat_raised[i]) == HIGH_VAL) upgreq_val = "";

            } else if (i == 7) {
                // Update mana
                id_name = "mana";
                val = this.pl.mana[5] + this.stat_raised[i];
                can_raise = this.pl.mana_needed(this.pl.mana[0] + this.stat_raised[i]) <= this.pl.points - this.stat_points_used;
                upgreq_val = this.pl.mana_needed(this.pl.mana[0] + this.stat_raised[i]);
                if (this.pl.mana_needed(i, this.pl.mana[0] + this.stat_raised[i]) == HIGH_VAL) upgreq_val = "";

            } else {
                // Update skill
                id_name = `skill${i - 8}`;

                var m = skilltab[i - 8].nr;
                if (!this.pl.skill[m][0]) {
                    document.getElementById(`div-skillslot-${id_name}`).style.display = "none";
                    continue;
                } else {
                    document.getElementById(`div-skillslot-${id_name}`).style.display = null;
                }

                val = this.pl.skill[m][5] + this.stat_raised[i];
                can_raise = this.pl.skill_needed(m, this.pl.skill[m][0] + this.stat_raised[i]) <= this.pl.points - this.stat_points_used;
                upgreq_val = this.pl.skill_needed(m, this.pl.skill[m][0] + this.stat_raised[i]);
                if (this.pl.skill_needed(m, this.pl.skill[m][0] + this.stat_raised[i]) == HIGH_VAL) upgreq_val = "";
            }

            var can_lower = this.stat_raised[i] > 0;

            this.updateSkill(id_name, val, can_raise, can_lower, upgreq_val);
        }

        // Update value
        var elem = document.getElementById('span-skill-updatevalue');
        elem.innerHTML = this.pl.points - this.stat_points_used;
    }

    updateSkillbinds() {
        for (let i = 0; i < 12; i++) {
            let elem_skillbind = document.getElementById(`span-skillbind${i + 1}`);
            if (this.pl.skillbinds[i] != null) {
                elem_skillbind.innerHTML = skilltab[this.pl.skillbinds[i]].name_short;
            } else {
                elem_skillbind.innerHTML = "-";
            }
        }
    }

    updateMaincharData() {
        // Update inventory items
        for (var i = 0; i < 40; i++) {
            if (this.pl.item[i]) {
                this.inv_elems[i].style.backgroundImage = "url(" + getNumSpritePath(this.pl.item[i]) + ")";
            } else {
                this.inv_elems[i].style.backgroundImage = "none";
            }
        }

        // Update equipped items
        for (var i = 0; i < 20; i++) {
            if (!this.equip_slot_elems.hasOwnProperty(i)) continue;
            if (this.pl.worn[i]) {
                this.equip_slot_elems[i].elem.style.backgroundImage = "url(" + getNumSpritePath(this.pl.worn[i]) + ")";
            } else {
                this.equip_slot_elems[i].elem.style.backgroundImage = "url(" + this.equip_slot_elems[i].default_img + ")";
            }
        }

        // Update character display
        var pl_rank = points2rank(this.pl.points_tot)

        this.cdisp_span_charname.innerHTML = this.pl.name;
        this.cdisp_span_rankname.innerHTML = rank_names[pl_rank];
        this.cdisp_span_money.innerHTML = `Money: ${Math.floor(this.pl.gold / 100)}G ${this.pl.gold % 100}S`;
        this.cdisp_wv.innerHTML = `Weapon value: ${this.pl.weapon}`;
        this.cdisp_av.innerHTML = `Armor value: ${this.pl.armor}`;
        this.cdisp_exp.innerHTML = `Experience: ${this.pl.points_tot}`;

        // Rank img
        if (pl_rank > 0) {
            this.cdisp_img_rank.src = getNumSpritePath(10 + pl_rank);
            this.cdisp_img_rank.style.display = "block";
        } else {
            this.cdisp_img_rank.style.display = "none";
        }

        // Speed
        switch(this.pl.mode) {
            case 0: // Slow
                this.but_speed_slow.style.borderColor = "red";
                this.but_speed_normal.style.borderColor = null;
                this.but_speed_fast.style.borderColor = null;
            break;
            case 1: // Normal
                this.but_speed_slow.style.borderColor = null;
                this.but_speed_normal.style.borderColor = "red";
                this.but_speed_fast.style.borderColor = null;
            break;
            case 2: // Fast
                this.but_speed_slow.style.borderColor = null;
                this.but_speed_normal.style.borderColor = null;
                this.but_speed_fast.style.borderColor = "red";
            break;
        }

        // Exp bar
        var prevrank_xpreq = rank2points(pl_rank - 1);
        var xp_wid = 100;
        if (pl_rank < 23) xp_wid = ((this.pl.points_tot - prevrank_xpreq) / (rank2points(pl_rank) - prevrank_xpreq)) * 100;
        this.cdisp_xpbar.style.width = `${xp_wid}%`;

        // Shop money display
        this.shop_span_money.innerHTML = `Your money: ${Math.floor(this.pl.gold / 100)}G ${this.pl.gold % 100}S`;
        if (this.shop_sellval) {
            this.shop_span_money.innerHTML += ` - Item in hand value: ${Math.floor(this.shop_sellval / 100)}G ${this.shop_sellval % 100}S`;
        }

        // Buffs
        while (this.div_buffs.firstChild) this.div_buffs.removeChild(this.div_buffs.firstChild);
        for (var i = 0; i < 20; i++) {
            if (this.pl.spell[i]) {
                let tmp_buffdiv = document.createElement('div');

                let tmp_buffimg = document.createElement('img');
                tmp_buffimg.className = "unselectable";
                tmp_buffimg.style.width = "32px";
                tmp_buffimg.style.height = "32px";
                tmp_buffimg.src = getNumSpritePath(this.pl.spell[i]);
                tmp_buffdiv.appendChild(tmp_buffimg);

                let tmp_buffdur = document.createElement('span');
                tmp_buffdur.className = "unselectable";
                tmp_buffdur.style.position = "fixed";
                tmp_buffdur.style.width = "16px";
                tmp_buffdur.style.transform = "translate(-200%, 100%)";
                tmp_buffdur.innerHTML = this.pl.active[i];
                tmp_buffdiv.appendChild(tmp_buffdur);

                this.div_buffs.appendChild(tmp_buffdiv);
            }
        }

        this.cdisp_bar_hp.style.width = Math.floor((this.pl.a_hp / this.pl.hp[5]) * 80) + "px";
        this.cdisp_bar_end.style.width = Math.floor((this.pl.a_end / this.pl.end[5]) * 80) + "px";
        this.cdisp_bar_mana.style.width = Math.floor((this.pl.a_mana / this.pl.mana[5]) * 80) + "px";

        this.updateSkills();
        this.updateSkillbinds();
    }
}