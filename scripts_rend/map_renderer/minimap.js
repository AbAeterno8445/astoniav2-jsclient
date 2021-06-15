class MinimapRenderer {
    constructor() {
        this.minimapCanvas = document.getElementById('cv-minimap');
        this.minimapCanvas.width = 128;
        this.minimapCanvas.height = 128;
        this.minimapCanvasCtx = this.minimapCanvas.getContext('2d');

        this.last_plx = 0;
        this.last_ply = 0;

        // "x/y": "<color code>"
        // example: "512/500": "#ff00cc"
        this.tilemap = {};
    }

    updateMinimap(mapdata, pl_x, pl_y, zoom=1) {
        if (!pl_x && !pl_y) return;
        if (pl_x == this.last_plx && pl_y == this.last_ply) return;

        this.last_plx = pl_x;
        this.last_ply = pl_y;

        this.minimapCanvasCtx.clearRect(0, 0, 128, 128);

        for (var i = 0; i < renderdistance; i++) {
            for (var j = 0; j < renderdistance; j++) {
                var tile_id = i + j * renderdistance;
                var tile = mapdata[tile_id];
                if (!tile) continue;
                if (!tile.avgcol || tile.ba_sprite == SPR_EMPTY || tile.flags & INVIS) continue;

                this.tilemap[tile.x + "/" + tile.y] = `rgb(${tile.avgcol[0]},${tile.avgcol[1]},${tile.avgcol[2]})`;
            }
        }

        for (var i = 0; i < 128; i++) {
            for (var j = 0; j < 128; j++) {
                var tile_x = pl_x - 64 + j;
                var tile_y = pl_y - 64 + i;
                var tile_id = tile_x + "/" + tile_y;
                if (!this.tilemap[tile_id]) continue;

                this.minimapCanvasCtx.fillStyle = this.tilemap[tile_id];
                this.minimapCanvasCtx.fillRect(i * zoom - 64 * (zoom - 1), j * zoom - 64 * (zoom - 1), zoom, zoom);
            }
        }

        // Player - yellow pixel
        this.minimapCanvasCtx.fillStyle = "#ffff00";
        this.minimapCanvasCtx.fillRect(64, 64, zoom, zoom);
    }
}