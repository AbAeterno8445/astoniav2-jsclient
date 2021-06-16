class MinimapRenderer {
    constructor() {
        this.minimapCanvas = document.getElementById('cv-minimap');
        this.minimapCanvas.width = 128;
        this.minimapCanvas.height = 128;
        this.minimapCanvasCtx = this.minimapCanvas.getContext('2d');
        this.minimapCanvasCtx.imageSmoothingEnabled = false;

        this.tile_cv = document.createElement('canvas');
        this.tile_cv.width = 1024;
        this.tile_cv.height = 1024;
        this.tile_cv_ctx = this.tile_cv.getContext('2d');
    }

    drawTile(tile) {
        if (tile.ba_sprite == SPR_EMPTY || !tile.avgcol) return;
        this.tile_cv_ctx.fillStyle = `rgb(${tile.avgcol[0]},${tile.avgcol[1]},${tile.avgcol[2]})`;
        this.tile_cv_ctx.fillRect(tile.y, tile.x, 1, 1);
    }

    updateMinimap(pl_x, pl_y, zoom=1) {
        if (!pl_x && !pl_y) return;

        this.minimapCanvasCtx.clearRect(0, 0, 128, 128);
        this.minimapCanvasCtx.setTransform(zoom, 0, 0, zoom, 0, 0);

        var orig = Math.round(64 / zoom);
        this.minimapCanvasCtx.drawImage(this.tile_cv, pl_y - orig, pl_x - orig, 128, 128, 0, 0, 128, 128);

        // Player - yellow pixel
        this.minimapCanvasCtx.fillStyle = "#ffff00";
        this.minimapCanvasCtx.fillRect(orig, orig, 1, 1);
    }
}