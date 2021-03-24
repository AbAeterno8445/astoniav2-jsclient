var cv_xoff = -280;
var cv_yoff = 360;

const mapCanvas = new CanvasHandler(document.getElementById('cv-map'));
mapCanvas.setDefaultOffset(cv_xoff, cv_yoff, true);

var map_renderdist = 54;

var hideWalls = false;
function toggleWalls() {
    hideWalls = !hideWalls;
    renderMap();
}

mapCanvas.cv.addEventListener('mousedown', function(e) {
    var mpos = getCursorPosition(mapCanvas.cv, e);
    var x = mpos.x + 160;
    var y = mpos.y + 8;

    var mx = 2 * y + x - (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((map_renderdist - 34) / 2 * 32);
    var my = x - 2 * y + (mapCanvas.drawYOffset * 2) - mapCanvas.drawXOffset + ((map_renderdist - 34) / 2 * 32);

    mx = Math.floor(mx / 32) - 17;
    my = Math.floor(my / 32) - 13;

    if (mx >= 0 && my >= 0 && mx < map_renderdist && my < map_renderdist) {
        winapi_send({ req: "cmd_walk", x: mx, y: my });
    }
});

function padSpriteNum(num) { return ("00000" + num).substr(-5); }
function getSpritePath(n) {
    return "./gfx/" + padSpriteNum(n) + ".png";
}

function renderMap(tilemap) {
    if (!tilemap) return;

    mapCanvas.clearContext();

    var x1 = 0;
    var x2 = map_renderdist;
    var y1 = 0;
    var y2 = map_renderdist;
    var plr_tile_id = (map_renderdist / 2) + (map_renderdist / 2) * map_renderdist;
    
    for (var i = y1; i < y2; i++) {
        for (var j = x2 - 1; j > x1; j--) {
            var tile_id = i + j * map_renderdist;
            var tile = tilemap[tile_id];
            if (!tile) continue;

            // Main player offset
            /*if (tile_id == plr_tile_id) {
                var xoff = Math.round(-tilemap[tile_id].obj_xoff);
                var yoff = Math.round(-tilemap[tile_id].obj_xoff);
                mapCanvas.setDefaultOffset(cv_xoff + iso_xoff, cv_yoff + iso_yoff, true);
            }*/

            // Load new character sprite sets
            if (tile.ch_sprite && !loaded_chars.hasOwnProperty(tile.ch_sprite)) {
                loadCharGFX(tile.ch_sprite);
            }
            
            // Floor
            if (tile.ba_sprite) {
                mapCanvas.drawImageIsometric(getSpritePath(tile.ba_sprite), j, i);
            }
            // Item
            if (tile.obj1) {
                mapCanvas.drawImageIsometric(getSpritePath(tile.obj1), j, i);
            }
            // Character
            if (tile.obj2) {
                mapCanvas.drawImageIsometric(getSpritePath(tile.obj2), j, i, 16, 0);
            }
        }
    }
}

// For loading all character sprites
var loaded_chars = {};
function loadCharGFX(ch_spr) {
    if (loaded_chars.hasOwnProperty(ch_spr)) return;
    loaded_chars[ch_spr] = true;

    var allgfx = [];
    // Idle sprites
    for (var i = 0; i < 8; i++) {
        allgfx.push(getSpritePath(ch_spr + 8 * i));
    }
    // Animations
    for (var i = 0; i < 384; i++) {
        allgfx.push(getSpritePath(ch_spr + 64 + i));
    }

    mapCanvas.loadImages(allgfx);
}