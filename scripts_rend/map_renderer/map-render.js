var cv_xoff = -280;
var cv_yoff = 360;

const mapCanvas = new CanvasHandler(document.getElementById('cv-map'));
mapCanvas.setDefaultOffset(cv_xoff, cv_yoff, true);
mapCanvas.setLoadingImage("./gfx/00035.png");

const fontDrawer = new FontDrawer();
for (var i = 700; i <= 703; i++) fontDrawer.load_font(i, getNumSpritePath(i));
for (var i = 1960; i <= 1967; i++) fontDrawer.load_font(i, getNumSpritePath(i));

var doc_keyheld = { ctrl: 0, shift: 0, alt: 0 };
var doc_mouseheld = { left: 0, middle: 0, right: 0 };

const cursor_default = "./gfx/MOUSE.png";

// Sprite loading
var loaded_gfx = {};
// Pre-loaded images
loadGFX(getNumSpritePath(31)); // Target tile (player movement)
loadGFX(getNumSpritePath(32)); // Drop at position
loadGFX(getNumSpritePath(33)); // Take from position
loadGFX(getNumSpritePath(34)); // Attack target
loadGFX(getNumSpritePath(45)); // Give target/Use target
for (var i = 240; i < 267; i++)
    loadGFX(getNumSpritePath(i)); // Grave
for (var i = 280; i < 297; i++)
    loadGFX(getNumSpritePath(i)); // Death mist
for (var i = 1078; i < 1082; i++)
    loadGFX(getNumSpritePath(i)); // Injured fx

function setCursorImg(img_path, offset = 0) {
    mapCanvas.cv.style.cursor = "url(" + img_path + ") " + offset + " " + offset + ", auto";
}

// Get isometric tile position of cursor within mapcanvas
function getCursorIso(e) {
    var mpos = CanvasHandler.getCursorPosition(mapCanvas.cv, e);
    var in_canvas = 1;
    if (mpos.x < 0 || mpos.y < 0 || mpos.x > mapCanvas.cv.width || mpos.y > mapCanvas.cv.height) in_canvas = 0;

    var x = mpos.x + 160;
    var y = mpos.y + 16;

    var mx = 2 * y + x - (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);
    var my = x - 2 * y + (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);

    mx = Math.floor(mx / 32) - 17;
    my = Math.floor(my / 32) - 12;

    return { x: mx, y: my, in: in_canvas };
}

// Check surrounding tiles from given start position for given flag
/** Returns a list of found tiles matching flag, sorted by distance to start point (closest -> farthest) */
function scanMapFlag(tilemap, startpos, flag) {
    if (tilemap[startpos].flags & flag) return [{ m: startpos, x: startpos % renderdistance, y: Math.floor(startpos / renderdistance) }];

    var found_obj = [];
    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            if (j == 0 && i == 0) continue;

            var m = startpos + j + i * renderdistance;
            if (m >= 0 && m <= renderdistance * renderdistance) {
                if (tilemap[m].flags & flag) {
                    found_obj.push({
                        m: m,
                        x: m % renderdistance,
                        y: Math.floor(m / renderdistance),
                        dist: Math.abs(j + i)
                    });
                }
            }
        }
    }

    found_obj.sort((a, b) => (a.dist > b.dist) ? 1 : -1);
    return found_obj;
}

function mouseCommand(event) {
    var cursor_img = cursor_default;
    var mpos = getCursorIso(event);

    try {
        var tilemap = sockClient.get_tilemap();
    } catch (err) { // Catches mouse events firing error before sockClient is loaded
        return;
    }

    if (mpos.in && mpos.x >= 0 && mpos.y >= 0 && mpos.x < renderdistance && mpos.y < renderdistance) {
        tile_hovered = mpos.x + mpos.y * renderdistance;
    } else {
        tile_hovered = -1;
    }

    if (tile_hovered > -1) {
        if (doc_keyheld.shift) {
            var scan = scanMapFlag(tilemap, tile_hovered, ISITEM);
            if (scan.length > 0) {
                tile_hovered = scan[0].m;
                mpos.x = scan[0].x;
                mpos.y = scan[0].y;
                if (tilemap[tile_hovered].flags & ISUSABLE) {
                    //cursor_img = getNumSpritePath();

                    if (doc_mouseheld.left) {
                        // Use item
                        sockClient.send_client_command(cl_cmds["CL_CMD_USE"], { x: mpos.x, y: mpos.y });
                    } else if (doc_mouseheld.right) {
                        // Look at item
                        sockClient.send_client_command(cl_cmds["CL_CMD_LOOK_ITEM"], { x: mpos.x, y: mpos.y });
                    }
                } else {
                    //cursor_img = getNumSpritePath();

                    if (doc_mouseheld.left) {
                        // Pick up item
                        sockClient.send_client_command(cl_cmds["CL_CMD_PICKUP"], { x: mpos.x, y: mpos.y });
                    } else if (doc_mouseheld.right) {
                        // Look at item
                        sockClient.send_client_command(cl_cmds["CL_CMD_LOOK_ITEM"], { x: mpos.x, y: mpos.y });
                    }
                }
            } else if (pl.citem && doc_mouseheld.left) {
                // Drop item
                sockClient.send_client_command(cl_cmds["CL_CMD_DROP"], { x: mpos.x, y: mpos.y });
            }
        } else if (doc_keyheld.ctrl || doc_keyheld.alt) {
            var scan = scanMapFlag(tilemap, tile_hovered, ISCHAR);
            if (scan.length > 0) {
                tile_hovered = scan[0].m;
                mpos.x = scan[0].x;
                mpos.y = scan[0].y;
                if (doc_keyheld.ctrl) {
                    //cursor_img = getNumSpritePath();

                    if (doc_mouseheld.left) {
                        if (pl.citem) {
                            // Give character
                            sockClient.send_client_command(cl_cmds["CL_CMD_GIVE"], { target: tilemap[tile_hovered].ch_nr });
                        } else {
                            // Attack character
                            sockClient.send_client_command(cl_cmds["CL_CMD_ATTACK"], { target: tilemap[tile_hovered].ch_nr });
                        }
                    } else if (doc_mouseheld.right) {
                        // Look at character
                        sockClient.send_client_command(cl_cmds["CL_CMD_LOOK"], { target: tilemap[tile_hovered].ch_nr });
                    }
                } else {
                    //cursor_img = getNumSpritePath();

                    if (doc_mouseheld.right) {
                        // Look at character
                        sockClient.send_client_command(cl_cmds["CL_CMD_LOOK"], { target: tilemap[tile_hovered].ch_nr });
                    }
                }
            }
        } else {
            if (doc_mouseheld.left) {
                // Move to position
                sockClient.send_client_command(cl_cmds["CL_CMD_MOVE"], { x: mpos.x, y: mpos.y });
            } else if (doc_mouseheld.right) {
                // Look at position
                sockClient.send_client_command(cl_cmds["CL_CMD_TURN"], { x: mpos.x, y: mpos.y });
            }
        }
    }
    doc_mouseheld.left = 0;
    doc_mouseheld.middle = 0;
    doc_mouseheld.right = 0;

    if (!pl.citem) setCursorImg(cursor_img);
}

/** CANVAS EVENTS */
// Mouse hovering tile
var tile_hovered = -1;
mapCanvas.cv.addEventListener('mousemove', function (e) {
    mouseCommand(e);
});

mapCanvas.cv.addEventListener('mouseup', function (e) {
    mouseCommand(e);
});

mapCanvas.cv.addEventListener('mouseleave', function (e) {
    tile_hovered = -1;
});

document.addEventListener('mousedown', function (e) {
    if (e.button == 0) doc_mouseheld.left = 1;
    else if (e.button == 1) doc_mouseheld.middle = 1;
    else if (e.button == 2) doc_mouseheld.right = 1;
});

document.addEventListener('mouseup', function(e) {
    mouseCommand(e);
    if (e.button == 0) doc_mouseheld.left = 0;
    else if (e.button == 1) doc_mouseheld.middle = 0;
    else if (e.button == 2) doc_mouseheld.right = 0;
});

// Key events
document.addEventListener("keydown", function (event) {
    switch (event.key) {
        case "Shift": doc_keyheld.shift = 1; break;
        case "Alt": doc_keyheld.alt = 1; break;
        case "Control": doc_keyheld.ctrl = 1; break;
    }
});
document.addEventListener("keyup", function (event) {
    switch (event.key) {
        case "Shift": doc_keyheld.shift = 0; break;
        case "Alt": doc_keyheld.alt = 0; break;
        case "Control": doc_keyheld.ctrl = 0; break;
    }
});

/** MAP RENDERING */

function padSpriteNum(num) { return ("00000" + num).substr(-5); }
function getNumSpritePath(n) {
    return "./gfx/" + padSpriteNum(n) + ".png";
}

var hideWalls = true;
function autohide(x, y)
{
	if (x >= renderdistance / 2 || y <= renderdistance / 2) return 0;
	return 1;
}

// Map rendering
var char_cv = document.createElement('canvas');
var char_cv_ctx = char_cv.getContext('2d');

var citem_last = 0;

var charlookup_req = {};
var charname_imgs = {};

// Canvas source for character health bars
var char_hbar_cv = document.createElement('canvas');
char_hbar_cv.height = 1;

function renderMap(tilemap) {
    if (!tilemap) return;

    mapCanvas.clearContext();

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
            if (tile_hovered == tile_id && !doc_keyheld.ctrl && !doc_keyheld.alt) {
                if (!doc_keyheld.shift || (doc_keyheld.shift && !(tilemap[tile_hovered].flags & ISITEM) && pl.citem)) {
                    gfx_filter = "brightness(200%)";
                    fx_suff = "hover";
                }
            }

            if (tile.ba_sprite) {
                var spr_p = loadGFX(getNumSpritePath(tile.ba_sprite), gfx_filter, fx_suff);
                mapCanvas.drawImageIsometric(spr_p, j, i, pl_xoff, pl_yoff, 0);
            }

            // Target position image
            if (tile.x == pl.goto_x && tile.y == pl.goto_y) {
                mapCanvas.drawImageIsometric(getNumSpritePath(31), j, i, pl_xoff, pl_yoff, 0);
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
            if (tile.ch_sprite && !loaded_gfx[tile.ch_sprite]) {
                loadCharGFX(tile.ch_sprite);
            }

            // Item
            if (tile.obj1) {
                var it = tile.obj1;
                // Autohide
                if (hideWalls && !(tilemap[tile_id].flags & ISITEM) && !autohide(i, j)) it++;

                // Shift hover effect
                if (doc_keyheld.shift && tile_hovered == tile_id && tilemap[tile_id].flags & (ISUSABLE|ISITEM)) {
                    gfx_filter = "brightness(200%)";
                    fx_suff = "hover";
                }
                var it_spr = loadGFX(getNumSpritePath(it), gfx_filter, fx_suff);
                mapCanvas.drawImageIsometric(it_spr, j, i, pl_xoff, pl_yoff, 0);
            }

            // Reset filter for characters
            gfx_filter = gfx_filter_first;

            // Character
            if (tile.obj2) {
                var obj_xoff = Math.round(tilemap[tile_id].obj_xoff);
                var obj_yoff = Math.round(tilemap[tile_id].obj_yoff);

                // Ctrl hover effect
                if ((doc_keyheld.ctrl || doc_keyheld.alt) && tile_hovered == tile_id) gfx_filter = "brightness(200%)";

                // Draw characters into a temporary canvas, apply filter, then print it (makes filtering characters more efficient)
                var char_img = mapCanvas.getImage(getNumSpritePath(tile.obj2));
                if (char_img) {
                    char_cv.width = char_img.width;
                    char_cv.height = char_img.height;
                    char_cv_ctx.clearRect(0, 0, char_img.width, char_img.height);

                    char_cv_ctx.filter = gfx_filter;
                    char_cv_ctx.drawImage(char_img, 0, 0);

                    mapCanvas.drawImageIsometric(char_cv, j, i, pl_xoff + obj_xoff, pl_yoff + obj_yoff, 0);
                }
            }

            /** PLAYER COMMAND SPRITES */
            // Attack target sprite
            if (pl.attack_cn && pl.attack_cn == tilemap[tile_id].ch_nr)
                mapCanvas.drawImageIsometric(getNumSpritePath(34), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);

            // Give target sprite
            if (pl.misc_action == DR_GIVE && pl.misc_target1 == tilemap[tile_id].ch_nr)
                mapCanvas.drawImageIsometric(getNumSpritePath(45), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);
            
            // Drop at position
            if (pl.misc_action == DR_DROP && pl.misc_target1 == tilemap[tile_id].x && pl.misc_target2 == tilemap[tile_id].y)
                mapCanvas.drawImageIsometric(getNumSpritePath(32), j, i, pl_xoff, pl_yoff);
            
            // Pickup from position
            if (pl.misc_action == DR_PICKUP && pl.misc_target1 == tilemap[tile_id].x && pl.misc_target2 == tilemap[tile_id].y)
                mapCanvas.drawImageIsometric(getNumSpritePath(33), j, i, pl_xoff, pl_yoff);
            
            // Use at position
            if (pl.misc_action == DR_USE && pl.misc_target1 == tilemap[tile_id].x && pl.misc_target2 == tilemap[tile_id].y)
                mapCanvas.drawImageIsometric(getNumSpritePath(45), j, i, pl_xoff, pl_yoff);

            /** MAP EFFECTS */
            // Injury effects
            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == INJURED)
                mapCanvas.drawImageIsometric(getNumSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);

            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1))
                mapCanvas.drawImageIsometric(getNumSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);

            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED2))
                mapCanvas.drawImageIsometric(getNumSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);

            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1|INJURED2))
                mapCanvas.drawImageIsometric(getNumSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);
            
            // Death mist
            if (tilemap[tile_id].flags & DEATH) {
                var m_spr = 280 + ((tilemap[tile_id].flags & DEATH) >> 17) - 1;
                if (tilemap[tile_id].obj2) {
                    mapCanvas.drawImageIsometric(getNumSpritePath(m_spr), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);
                } else {
                    mapCanvas.drawImageIsometric(getNumSpritePath(m_spr), j, i, pl_xoff, pl_yoff);
                }
            }

            // Grave
            if (tilemap[tile_id].flags & TOMB) {
                var grave_sprnum = 240 + ((tilemap[tile_id].flags & TOMB) >> 12) - 1;
                var grave_spr = loadGFX(getNumSpritePath(grave_sprnum), gfx_filter, fx_suff);
                mapCanvas.drawImageIsometric(grave_spr, j, i, pl_xoff, pl_yoff);
            }

            // Character info
            let ch_nr = tilemap[tile_id].ch_nr;
            if (ch_nr) {
                let char_info = sockClient.lookup_char(ch_nr);
                if (!char_info && !charlookup_req.hasOwnProperty(ch_nr)) {
                    charlookup_req[ch_nr] = 1;
                    setTimeout(() => {
                        delete charlookup_req[ch_nr];
                    }, 2000);
                    sockClient.send_client_command(cl_cmds["CL_CMD_AUTOLOOK"], { ch_nr: ch_nr });
                } else if (char_info) {
                    // Character name
                    var chname_img;
                    var chname_full = char_info.name;
                    if (tilemap[tile_id].ch_proz) chname_full += " " + tilemap[tile_id].ch_proz + "%";

                    if (!charname_imgs.hasOwnProperty(chname_full)) {
                        chname_img = fontDrawer.get_text_img(FNT_YELLOW, chname_full);
                        charname_imgs[chname_full] = chname_img;
                    }
                    chname_img = charname_imgs[chname_full];

                    if (chname_img) {
                        var chname_xoff = Math.round(pl_xoff + tilemap[tile_id].obj_xoff);
                        var chname_yoff = Math.round(pl_yoff + tilemap[tile_id].obj_yoff - char_cv.height + 4);
                        mapCanvas.drawImageIsometric(chname_img, j, i, chname_xoff, chname_yoff);
                    }

                    // Healthbar
                    if (tilemap[tile_id].ch_proz) {
                        char_hbar_cv.width = Math.ceil(48 * tilemap[tile_id].ch_proz / 100);
                        char_hbar_cv.getContext('2d').fillStyle = 'red';
                        char_hbar_cv.getContext('2d').fillRect(0, 0, char_hbar_cv.width, 1);

                        var hbar_xoff = pl_xoff + tilemap[tile_id].obj_xoff - Math.floor((48 - char_hbar_cv.width) / 2);
                        var hbar_yoff = pl_yoff + tilemap[tile_id].obj_yoff - char_cv.height + 9;
                        mapCanvas.drawImageIsometric(char_hbar_cv, j, i, hbar_xoff, hbar_yoff);
                    }
                }
            }
        }
    }

    if (pl.citem) {
        setCursorImg(getNumSpritePath(pl.citem), 16);
        citem_last = pl.citem;
    } else if (citem_last) {
        setCursorImg(cursor_default);
        citem_last = 0;
    }
}

/** GFX LOADING FUNCS */

/** Returns the sprite path (with appended filter suffix if provided) */
function loadGFX(spr, filter = "none", filter_suff = "") {
    var spr_p = spr + filter_suff;
    if (loaded_gfx.hasOwnProperty(spr_p)) return spr_p;
    loaded_gfx[spr_p] = true;

    if (filter != "none") {
        mapCanvas.loadImage(spr, 1, filter, spr_p);
    } else {
        mapCanvas.loadImage(spr);
    }
    return spr_p;
}

function loadCharGFX(ch_spr, filter = "none", filter_suff = "") {
    var ch_spr_p = ch_spr + filter_suff;
    if (loaded_gfx.hasOwnProperty(ch_spr_p)) return;
    loaded_gfx[ch_spr_p] = true;

    // Idle sprites
    for (var i = 0; i < 8; i++) {
        loadGFX(getNumSpritePath(ch_spr + 8 * i), filter, filter_suff);
    }
    // Animations
    for (var i = 0; i < 384; i++) {
        loadGFX(getNumSpritePath(ch_spr + 64 + i), filter, filter_suff);
    }
}