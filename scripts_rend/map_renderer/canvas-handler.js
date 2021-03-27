class CanvasHandler {
    constructor(cv) {
        this.cv = cv;
        this.cv.width = cv.clientWidth;
        this.cv.height = cv.clientHeight;
        this.ctx = this.cv.getContext('2d');

        this.drawXOffset = 0;
        this.defaultXoff = 0;
        this.drawYOffset = 0;
        this.defaultYoff = 0;

        // If an image that's not loaded tries to be drawn, returns this image instead
        this.loadingImg = null;

        /** Keys are the path to the image, values are the images themselves.        
         *  e.g. loadedImages["/assets/tiles/floors/00950.png"] = Image() */
        this.loadedImages = {};
        this.redrawTimeout = 100;
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

    setLoadingImage(img_path) {
        this.loadImage(img_path);
        this.loadingImg = img_path;
    }

    /** Load an image for future drawing.
     * If asImgData is 1, loads a canvas object with the given filter applied,
     * then draws the image into it.
     * altpath lets you store the given image with a different name - useful
     * to make more versions of the same image with different filters */
    loadImage(path, asImgData = 1, filter = "none", altpath = null) {
        if (this.loadedImages.hasOwnProperty(path) && !altpath ||
            this.loadedImages.hasOwnProperty(altpath) && altpath) {
            return;
        }
        var newImg = new Image();
        if (!asImgData) {
            newImg.onload = () => {
                if (altpath) path = altpath;
                this.loadedImages[path] = newImg;
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
            };
        }
        newImg.src = path;
        if (altpath) path = altpath;
        this.loadedImages[path] = null;
    }

    /** Load a list of images for future drawing */
    loadImages(pathList) {
        for (let imgP of pathList) {
            this.loadImage(imgP);
        }
    }

    getImage(path) {
        if (!this.loadedImages.hasOwnProperty(path)) {
            return null;
        }
        return this.loadedImages[path];
    }

    clearLoadedImages() {
        this.loadedImages = {};
    }

    clearContext() {
        if (this.cv.clientWidth != this.cv.width || this.cv.clientHeight != this.cv.height) {
            this.cv.width = this.cv.clientWidth;
            this.cv.height = this.cv.clientHeight;
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
                
                if (this.loadingImg) {
                    this.drawImage(this.loadingImg, x, y, 0);
                }

                return;
            }
        } else {
            drawimg = img;
        }
        drawimg = this.loadedImages[img];
        this.ctx.drawImage(drawimg, this.drawXOffset + x, this.drawYOffset + y);
    }

    /** X and Y in tiles. img can be path to loaded image, or a canvas element to draw directly */
    drawImageIsometric(img, x, y, xoff = 0, yoff = 0, redraw = 1) {
        var drawimg;
        if (!(img instanceof HTMLCanvasElement)) {
            // Image not loaded yet
            if (!this.loadedImages.hasOwnProperty(img) || (this.loadedImages.hasOwnProperty(img) && this.loadedImages[img] === null)) {
                if (redraw) {
                    this.loadImage(img);
                    setTimeout(() => {
                        this.drawImageIsometric(img, x, y, xoff, yoff, 1);
                    }, this.redrawTimeout);
                }

                if (this.loadingImg) {
                    this.drawImageIsometric(this.loadingImg, x, y, xoff, yoff, 0);
                }

                return;
            }
            drawimg = this.loadedImages[img];
        } else {
            drawimg = img;
        }
        var drawX = (x + y) * 16 - (drawimg.width - 32) + xoff;
        var drawY = (y - x) * 8 - (drawimg.height - 32) + yoff;
        this.ctx.drawImage(drawimg, this.drawXOffset + drawX, this.drawYOffset + drawY);
    }
}