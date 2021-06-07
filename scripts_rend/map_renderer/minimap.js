class MinimapRenderer {
    constructor() {
        this.minimapCanvas = document.getElementById('cv-minimap');
        this.minimapCanvas.width = 128;
        this.minimapCanvas.height = 128;
        this.minimapCanvasCtx = this.minimapCanvas.getContext('2d');

        // "x/y": "<color code>"
        // example: "512/500": "#ff00cc"
        this.tilemap = {};

        this.origin_x = 0;
        this.origin_y = 0;
    }

    updateMinimap(mapdata, pl_x, pl_y) {
        if (!pl_x && !pl_y) return;

        this.origin_x = pl_x;
        this.origin_y = pl_y;

        this.minimapCanvasCtx.clearRect(0, 0, 128, 128);

        for (var i = 0; i < renderdistance; i++) {
            for (var j = 0; j < renderdistance; j++) {
                var tile_id = i + j * renderdistance;
                var tile = mapdata[tile_id];
                if (!tile) continue;

                // Wall - white pixel
                if (tile.obj1 && !(mapdata[tile_id].flags & ISITEM)) {
                    this.tilemap[tile.x + "/" + tile.y] = "#ffffff";
                } else {
                    this.tilemap[tile_id] = null;
                }
            }
        }

        for (var i = 0; i < 128; i++) {
            for (var j = 0; j < 128; j++) {
                var tile_x = pl_x - 64 + j;
                var tile_y = pl_y - 64 + i;
                var tile_id = tile_x + "/" + tile_y;
                if (!this.tilemap.hasOwnProperty(tile_id)) continue;
                if (!this.tilemap[tile_id]) continue;

                this.minimapCanvasCtx.fillStyle = this.tilemap[tile_id];
                this.minimapCanvasCtx.fillRect(i, j, 1, 1);
            }
        }

        // Player - yellow pixel
        this.minimapCanvasCtx.fillStyle = "#ffff00";
        this.minimapCanvasCtx.fillRect(64, 64, 1, 1);
    }
}