var cv_xoff = -280;
var cv_yoff = 360;

const mapCanvas = new CanvasHandler(document.getElementById('cv-map'));
mapCanvas.setDefaultOffset(cv_xoff, cv_yoff, true);
mapCanvas.setLoadingImage("./gfx/00035.png");

// Sprite loading
var loaded_gfx = {};
// Pre-loaded images
loadGFX(getSpritePath(31)); // Target tile

var hideWalls = false;
function toggleWalls() {
    hideWalls = !hideWalls;
    renderMap();
}

function getCursorIso(e) {
    var mpos = CanvasHandler.getCursorPosition(mapCanvas.cv, e);
    var x = mpos.x + 160;
    var y = mpos.y + 8;

    var mx = 2 * y + x - (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);
    var my = x - 2 * y + (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((renderdistance - 34) / 2 * 32);

    mx = Math.floor(mx / 32) - 17;
    my = Math.floor(my / 32) - 13;

    return {x: mx, y: my};
}

// Mouse hovering tile
var tile_hovered = -1;
mapCanvas.cv.addEventListener('mousemove', function(e) {
    var mpos = getCursorIso(e);

    if (mpos.x >= 0 && mpos.y >= 0 && mpos.x < renderdistance && mpos.y < renderdistance) {
        tile_hovered = mpos.x + mpos.y * renderdistance;
    } else {
        tile_hovered = -1;
    }
});

mapCanvas.cv.addEventListener('mouseleave', function(e) {
    tile_hovered = -1;
});

// Click to move
mapCanvas.cv.addEventListener('mousedown', function(e) {
    var mpos = getCursorIso(e);

    if (mpos.x >= 0 && mpos.y >= 0 && mpos.x < renderdistance && mpos.y < renderdistance) {
        sockClient.send_client_command(cl_cmds["CL_CMD_MOVE"], { x: mpos.x, y: mpos.y});
    }
});

function padSpriteNum(num) { return ("00000" + num).substr(-5); }
function getSpritePath(n) {
    return "./gfx/" + padSpriteNum(n) + ".png";
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
            var light_filter = "brightness(" + Math.round((16 - tile.light) * 100 / 16) + "%)";

            // Hovered tile effect
            if (tile_hovered == tile_id) {
                light_filter = "brightness(200%)";
                fx_suff = "hover";
            }

            if (tile.ba_sprite) {
                var spr_p = loadGFX(getSpritePath(tile.ba_sprite), light_filter, fx_suff);
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

            var light_filter = "brightness(" + Math.round((16 - tile.light) * 100 / 16) + "%)";

            // Load new character sprite sets
            if (tile.ch_sprite && !loaded_gfx[tile.ch_sprite]) {
                loadCharGFX(tile.ch_sprite);
            }
            
            // Item
            if (tile.obj1) {
                var it_spr = loadGFX(getSpritePath(tile.obj1), light_filter, "l" + tile.light);
                mapCanvas.drawImageIsometric(it_spr, j, i, pl_xoff, pl_yoff, 0);
            }
            // Character
            if (tile.obj2) {
                var obj_xoff = Math.round(tilemap[tile_id].obj_xoff);
                var obj_yoff = Math.round(tilemap[tile_id].obj_yoff);

                // Draw characters into a temporary canvas, apply filter, then print it (makes filtering characters more efficient)
                var char_img = mapCanvas.getImage(getSpritePath(tile.obj2));
                if (char_img) {
                    char_cv.width = char_img.width;
                    char_cv.height = char_img.height;
                    char_cv_ctx.clearRect(0, 0, char_img.width, char_img.height);

                    char_cv_ctx.filter = light_filter;
                    char_cv_ctx.drawImage(char_img, 0, 0);

                    mapCanvas.drawImageIsometric(char_cv, j, i, pl_xoff + obj_xoff + 16, pl_yoff + obj_yoff, 0);
                }
            }
        }
    }
}

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