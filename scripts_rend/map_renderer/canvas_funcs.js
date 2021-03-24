class CanvasHandler {
    constructor(cv) {
        this.cv = cv;
        this.cv.width = cv.offsetWidth;
        this.cv.height = cv.offsetHeight;
        this.ctx = this.cv.getContext('2d');

        this.drawXOffset = 0;
        this.defaultXoff = 0;
        this.drawYOffset = 0;
        this.defaultYoff = 0;

        /** Keys are the path to the image, values are the images themselves.        
         *  e.g. loadedImages["/assets/tiles/floors/00950.png"] = Image() */
        this.loadedImages = {};
        this.redrawTimeout = 100;
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

    /** Load an image for future drawing */
    loadImage(path) {
        if (this.loadedImages.hasOwnProperty(path)) {
            return;
        }
        var newImg = new Image();
        newImg.setAttribute('loaded', '0');
        newImg.onload = () => {
            newImg.setAttribute('loaded', '1');
        };
        newImg.src = path;
        this.loadedImages[path] = newImg;
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
        if (this.cv.offsetWidth != this.cv.width || this.cv.offsetHeight != this.cv.height) {
            this.cv.width = this.cv.offsetWidth;
            this.cv.height = this.cv.offsetHeight;
        }
        this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    }

    /** If enqueue is 1, will queue given image for loading before drawing it (if it hasn't been loaded before) */
    drawImage(imgPath, x, y, enqueue) {
        // Image not loaded
        if (!this.loadedImages.hasOwnProperty(imgPath) && enqueue) {
            // Queue for re-drawing
            this.loadImage(imgPath);
            setTimeout(() => {
                this.drawImage(imgPath, x, y, enqueue);
            }, this.redrawTimeout);
            return;
        }
        var img = this.loadedImages[imgPath];
        if (img.getAttribute('loaded') === '0' && enqueue) {
            setTimeout(() => {
                this.drawImage(imgPath, x, y, enqueue);
            }, this.redrawTimeout);
            return;
        }
        this.ctx.drawImage(img, this.drawXOffset + x, this.drawYOffset + y);
    }

    /** X and Y in tiles */
    drawImageIsometric(imgPath, x, y, xoff = 0, yoff = 0, redraw = 1) {
        // Image not loaded
        if (!this.loadedImages.hasOwnProperty(imgPath) || (this.loadedImages.hasOwnProperty(imgPath) && this.loadedImages[imgPath].width == 0)) {
            if (redraw) {
                this.loadImage(imgPath);
                setTimeout(() => {
                    this.drawImageIsometric(imgPath, x, y, xoff, yoff, 1);
                }, this.redrawTimeout);
            }
            return;
        }
        var img = this.loadedImages[imgPath];
        var drawX = (x + y) * 16 - (img.width - 32) + xoff;
        var drawY = (y - x) * 8 - (img.height - 32) + yoff;
        this.drawImage(imgPath, drawX, drawY, false);
    }
}

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return { x: x, y: y };
}