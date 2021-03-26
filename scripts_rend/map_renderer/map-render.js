var cv_xoff = -280;
var cv_yoff = 360;

const mapCanvas = new CanvasHandler(document.getElementById('cv-map'));
mapCanvas.setDefaultOffset(cv_xoff, cv_yoff, true);
mapCanvas.setLoadingImage("./gfx/00035.png");

var doc_keyheld = { ctrl: 0, shift: 0, alt: 0 };

// Sprite loading
var loaded_gfx = {};
// Pre-loaded images
loadGFX(getSpritePath(31)); // Target tile
loadGFX(getSpritePath(32)); // Drop at position
loadGFX(getSpritePath(33)); // Take from position
loadGFX(getSpritePath(34)); // Attack target
loadGFX(getSpritePath(45)); // Give target
for (var i = 240; i < 267; i++)
    loadGFX(getSpritePath(i)); // Grave
for (var i = 280; i < 297; i++)
    loadGFX(getSpritePath(i)); // Death mist
for (var i = 1078; i < 1082; i++)
    loadGFX(getSpritePath(i)); // Injured fx

function getCursorIso(e) {
    var mpos = CanvasHandler.getCursorPosition(mapCanvas.cv, e);
    var x = mpos.x + 160;
    var y = mpos.y + 8;

    var mx = 2 * y + x - (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);
    var my = x - 2 * y + (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);

    mx = Math.floor(mx / 32) - 17;
    my = Math.floor(my / 32) - 13;

    return { x: mx, y: my };
}

/** CANVAS EVENTS */
// Mouse hovering tile
var tile_hovered = -1;
mapCanvas.cv.addEventListener('mousemove', function (e) {
    var mpos = getCursorIso(e);

    if (mpos.x >= 0 && mpos.y >= 0 && mpos.x < renderdistance && mpos.y < renderdistance) {
        tile_hovered = mpos.x + mpos.y * renderdistance;
    } else {
        tile_hovered = -1;
    }
});

mapCanvas.cv.addEventListener('mouseleave', function (e) {
    tile_hovered = -1;
});

// Click command
mapCanvas.cv.addEventListener('mousedown', function (e) {
    var mpos = getCursorIso(e);

    if (mpos.x >= 0 && mpos.y >= 0 && mpos.x < renderdistance && mpos.y < renderdistance) {
        var tilemap = sockClient.get_tilemap();
        var tile_at = mpos.x + mpos.y * renderdistance;

        if (tilemap[tile_at].flags & ISITEM && doc_keyheld.shift) {
            if (tilemap[tile_at].flags & ISUSABLE) {
                sockClient.send_client_command(cl_cmds["CL_CMD_USE"], { x: mpos.x, y: mpos.y });
            } else {
                sockClient.send_client_command(cl_cmds["CL_CMD_PICKUP"], { x: mpos.x, y: mpos.y });
            }
        } else {
            sockClient.send_client_command(cl_cmds["CL_CMD_MOVE"], { x: mpos.x, y: mpos.y });
        }
    }
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
function getSpritePath(n) {
    return "./gfx/" + padSpriteNum(n) + ".png";
}

var hideWalls = false;
function toggleWalls() {
    hideWalls = !hideWalls;
    renderMap();
}

// Map rendering
var char_cv = document.createElement('canvas');
var char_cv_ctx = char_cv.getContext('2d');
function renderMap(tilemap) {
    if (!tilemap) return;

    mapCanvas.clearContext();

    var x1 = 0;
    var x2 = renderdistance;
    var y1 = 0;
    var y2 = renderdistance;

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
            if (tile_hovered == tile_id && !doc_keyheld.ctrl && !doc_keyheld.shift) {
                gfx_filter = "brightness(200%)";
                fx_suff = "hover";
            }

            if (tile.ba_sprite) {
                var spr_p = loadGFX(getSpritePath(tile.ba_sprite), gfx_filter, fx_suff);
                mapCanvas.drawImageIsometric(spr_p, j, i, pl_xoff, pl_yoff, 0);
            }

            // Target position image
            if (tile.x == pl.goto_x && tile.y == pl.goto_y) {
                mapCanvas.drawImageIsometric(getSpritePath(31), j, i, pl_xoff, pl_yoff, 0);
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
                // Shift hover effect
                if (doc_keyheld.shift && tile_hovered == tile_id && tilemap[tile_id].flags & (ISUSABLE|ISITEM)) {
                    gfx_filter = "brightness(200%)";
                    fx_suff = "hover";
                }
                var it_spr = loadGFX(getSpritePath(tile.obj1), gfx_filter, fx_suff);
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
                var char_img = mapCanvas.getImage(getSpritePath(tile.obj2));
                if (char_img) {
                    char_cv.width = char_img.width;
                    char_cv.height = char_img.height;
                    char_cv_ctx.clearRect(0, 0, char_img.width, char_img.height);

                    char_cv_ctx.filter = gfx_filter;
                    char_cv_ctx.drawImage(char_img, 0, 0);

                    mapCanvas.drawImageIsometric(char_cv, j, i, pl_xoff + obj_xoff + 16, pl_yoff + obj_yoff, 0);
                }
            }

            /** PLAYER COMMAND SPRITES */
            // Attack target sprite
            if (pl.attack_cn && pl.attack_cn == tilemap[tile_id].ch_nr)
                mapCanvas.drawImageIsometric(getSpritePath(34), j, i, pl_xoff, pl_yoff);

            // Give target sprite
            if (pl.misc_action == DR_GIVE && pl.misc_target1 == tilemap[tile_id].ch_nr)
                mapCanvas.drawImageIsometric(getSpritePath(45), j, i, pl_xoff, pl_yoff);
            
            // Drop at position
            if (pl.misc_action == DR_DROP && pl.misc_target1 == tilemap[tile_id].x && pl.misc_target2 == tilemap[tile_id].y)
                mapCanvas.drawImageIsometric(getSpritePath(32), j, i, pl_xoff, pl_yoff);
            
            // Pickup from position
            if (pl.misc_action == DR_PICKUP && pl.misc_target1 == tilemap[tile_id].x && pl.misc_target2 == tilemap[tile_id].y)
                mapCanvas.drawImageIsometric(getSpritePath(33), j, i, pl_xoff, pl_yoff);
            
            // Use at position
            if (pl.misc_action == DR_USE && pl.misc_target1 == tilemap[tile_id].x && pl.misc_target2 == tilemap[tile_id].y)
                mapCanvas.drawImageIsometric(getSpritePath(45), j, i, pl_xoff, pl_yoff);

            /** MAP EFFECTS */
            // Injury effects
            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == INJURED)
                mapCanvas.drawImageIsometric(getSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);

            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1))
                mapCanvas.drawImageIsometric(getSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);

            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED2))
                mapCanvas.drawImageIsometric(getSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);

            if ((tilemap[tile_id].flags & (INJURED|INJURED1|INJURED2)) == (INJURED|INJURED1|INJURED2))
                mapCanvas.drawImageIsometric(getSpritePath(1079), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);
            
            // Death mist
            if (tilemap[tile_id].flags & DEATH) {
                var m_spr = 280 + ((tilemap[tile_id].flags & DEATH) >> 17) - 1;
                if (tilemap[tile_id].obj2) {
                    mapCanvas.drawImageIsometric(getSpritePath(m_spr), j, i, pl_xoff + tilemap[tile_id].obj_xoff, pl_yoff + tilemap[tile_id].obj_yoff);
                } else {
                    mapCanvas.drawImageIsometric(getSpritePath(m_spr), j, i, pl_xoff, pl_yoff);
                }
            }

            // Grave
            if (tilemap[tile_id].flags & TOMB) {
                var grave_spr = loadGFX(240 + ((tilemap[tile_id].flags & TOMB) >> 12) - 1, gfx_filter, fx_suff);
                mapCanvas.drawImageIsometric(grave_spr, j, i, pl_xoff, pl_yoff);
            }
        }
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
        loadGFX(getSpritePath(ch_spr + 8 * i), filter, filter_suff);
    }
    // Animations
    for (var i = 0; i < 384; i++) {
        loadGFX(getSpritePath(ch_spr + 64 + i), filter, filter_suff);
    }
}