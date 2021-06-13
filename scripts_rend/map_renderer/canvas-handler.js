class CanvasHandler {
    constructor(cv, width = null, height = null) {
        this.cv = cv;

        if (width == null) this.cv.width = cv.clientWidth;
        else this.cv.width = width;

        if (height == null) this.cv.height = cv.clientHeight;
        else this.cv.height = height;

        this.ctx = this.cv.getContext('2d');

        this.drawXOffset = 0;
        this.defaultXoff = 0;
        this.drawYOffset = 0;
        this.defaultYoff = 0;

        // Returns loadingImg after non-loaded images take longer than loadingTimeout to load
        this.loadingImg = null;
        this.loadingTimeout = 1000;

        /** Keys are the path to the image, values are the images themselves.        
         *  e.g. loadedImages["/assets/tiles/floors/00950.png"] = Image() */
        this.loadedImages = {};
        this.avgColors = {};
        this.redrawTimeout = 100;

        this.onLoadCallback = null;
    }

    static getCursorPosition(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
    
        return { x: x, y: y };
    }

    resetOffset() {
        this.drawXOffset = this.defaultXoff;
        this.drawYOffset = this.defaultYoff;
    }

    setDefaultOffset(xoff, yoff, reset) {
        this.defaultXoff = xoff;
        this.defaultYoff = yoff;
        if (reset) this.resetOffset();
    }

    setLoadingImage(img_path, timeout = 1000) {
        this.loadImage(img_path);
        this.loadingImg = img_path;
        this.loadingTimeout = timeout;
    }

    /** Load an image for future drawing.
     * If asImgData is 1, loads a canvas object with the given filter applied,
     * then draws the image into it.
     * altpath lets you store the given image with a different name - useful
     * to make more versions of the same image with different filters.              
     * avgcol = true will store average image color in avgColors[<img path>] (default true) */
    loadImage(path, asImgData = 1, filter = "none", altpath = null, avgcol = true) {
        if (this.loadedImages.hasOwnProperty(path) && !altpath ||
            this.loadedImages.hasOwnProperty(altpath) && altpath) {
            return;
        }

        var orig_path = path;
        let newImg = new Image();
        if (!asImgData) {
            newImg.onload = () => {
                if (altpath) path = altpath;
                this.loadedImages[path] = newImg;

                if (this.onLoadCallback) this.onLoadCallback();
            };
        } else {
            var cv_tmp = document.createElement('canvas');
            var ctx_tmp = cv_tmp.getContext('2d');
            newImg.onload = () => {
                cv_tmp.width = newImg.width;
                cv_tmp.height = newImg.height;

                ctx_tmp.filter = filter;
                ctx_tmp.drawImage(newImg, 0, 0);

                if (altpath) path = altpath;
                this.loadedImages[path] = cv_tmp;

                // Load average color using colorthief
                if (avgcol && !this.avgColors.hasOwnProperty(orig_path)) {
                    var ct = new ColorThief();
                    this.avgColors[orig_path] = ct.getColor(newImg);
                }

                if (this.onLoadCallback) this.onLoadCallback();
            };
        }
        newImg.src = path;
        if (altpath) path = altpath;
        this.loadedImages[path] = null;

        // Loading image if non-loaded after timeout
        setTimeout(() => {
            if (this.loadedImages[path] === null) {
                this.loadedImages[path] = this.loadedImages[this.loadingImg];
            }
        }, this.loadingTimeout);
    }

    /** Load a list of images for future drawing */
    loadImages(pathList) {
        for (let imgP of pathList) {
            this.loadImage(imgP);
        }
    }

    /** Will call the given function once an image is finished loading with loadImage(). */
    onImageLoadCallback(callback) {
        this.onLoadCallback = callback;
    }

    getImage(path) {
        if (!this.loadedImages.hasOwnProperty(path)) {
            return null;
        }
        return this.loadedImages[path];
    }

    loadAvgcolors(file_path) {
        fs.readFile(file_path, 'utf-8', (err, data) => {
            if (err) return console.log(err);

            this.avgColors = JSON.parse(data);
            console.log("Minimap color data: loaded", Object.keys(this.avgColors).length, "entries.");
        });
    }

    /** Average color is returned as list: [r, g, b] */
    getImageAvgcol(path) {
        if (!this.avgColors.hasOwnProperty(path)) {
            return null;
        }
        return this.avgColors[path];
    }

    clearLoadedImages() {
        this.loadedImages = {};
    }

    clearContext(width = null, height = null) {
        if (width == null) {
            if (this.cv.clientWidth != this.cv.width) this.cv.width = this.cv.clientWidth;
        } else {
            this.cv.width = width;
        }

        if (height == null) {
            if (this.cv.clientHeight != this.cv.height) this.cv.height = this.cv.clientHeight;
        } else {
            this.cv.height = height;
        }

        this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    }

    /** If enqueue is 1, will queue given image for loading before drawing it (if it hasn't been loaded before).
     * img can be a canvas element, which will draw it directly. */
    drawImage(img, x, y, enqueue = 1) {
        var drawimg;
        if (!(img instanceof HTMLCanvasElement)) {
            // Image not loaded yet
            if (!this.loadedImages[img] && enqueue) {
                this.loadImage(img);

                // Queue for re-drawing
                if (enqueue) {
                    setTimeout(() => {
                        this.drawImage(img, x, y, enqueue);
                    }, this.redrawTimeout);
                }

                return;
            }
            drawimg = this.loadedImages[img];
        } else {
            drawimg = img;
        }
        this.ctx.drawImage(drawimg, this.drawXOffset + x, this.drawYOffset + y);
    }

    /** X and Y in tiles. img can be path to loaded image, or a canvas element to draw directly */
    drawImageIsometric(img, x, y, xoff = 0, yoff = 0, redraw = 1) {
        var drawimg;
        if (!(img instanceof HTMLCanvasElement)) {
            // Image not loaded yet
            var img_loaded = this.loadedImages.hasOwnProperty(img);
            if (!img_loaded || (img_loaded && this.loadedImages[img] === null)) {
                if (redraw) {
                    this.loadImage(img);
                    setTimeout(() => {
                        this.drawImageIsometric(img, x, y, xoff, yoff, 1);
                    }, this.redrawTimeout);
                }

                return;
            }
            drawimg = this.loadedImages[img];
        } else {
            drawimg = img;
        }
        var drawX = (x + y) * 16 + xoff - drawimg.width / 2;
        var drawY = (y - x) * 8 - (drawimg.height - 32) + yoff;
        this.ctx.drawImage(drawimg, this.drawXOffset + drawX, this.drawYOffset + drawY);
    }
}