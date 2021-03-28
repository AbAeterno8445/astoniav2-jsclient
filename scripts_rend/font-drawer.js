class FontDrawer {
    font_str = " !\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

    constructor() {
        this.fonts = {};
        this.font_chars = {};

        this.font_dict = {};
        for (var i = 0; i < this.font_str.length; i++) {
            this.font_dict[this.font_str[i]] = i;
        }
    }

    load_font(id, img_path) {
        var font_img = new Image();
        font_img.onload = () => {
            this.fonts[id] = font_img;

            var char_cv = document.createElement('canvas');
            char_cv.width = 6;
            char_cv.height = 10;
            var char_ctx = char_cv.getContext('2d');

            this.font_chars[id] = {};
            for (var i = 0; i < this.font_str.length; i++) {
                char_ctx.clearRect(0, 0, 6, 10);
                char_ctx.drawImage(font_img, i * 6, 0, 6, 10, 0, 0, 6, 10);
                this.font_chars[id][this.font_str[i]] = char_cv.toDataURL();
            }
        };
        font_img.src = img_path;
        this.fonts[id] = null;
        this.font_chars[id] = null;
    }

    is_font_loaded(font_id) {
        return this.fonts.hasOwnProperty(font_id);
    }

    /** Returns a data url for the given character (can be used as an image's src) */
    get_char_imgsrc(font_id, char) {
        if (this.font_chars[font_id] == null) return null;
        if (!this.font_chars[font_id].hasOwnProperty(char)) return null;
        return this.font_chars[font_id][char];
    }

    /** Returns a canvas with the given text printed using the given font. If empty is 1, returns an empty canvas if message length is 0. */
    get_text_img(font_id, msg, empty = 0) {
        if (!this.fonts.hasOwnProperty(font_id)) return null;
        if (this.fonts[font_id] == null) return null;

        var txt_cv = document.createElement('canvas');
        txt_cv.width = msg.length * 6;
        txt_cv.height = 10;
        var txt_ctx = txt_cv.getContext('2d');

        msg = msg.trim();
        if (!msg.length) {
            if (!empty) return null;
            else return txt_cv;
        }

        for (var i = 0; i < msg.length; i++) {
            if (!this.font_dict.hasOwnProperty(msg[i])) continue;

            var ch_ind = this.font_dict[msg[i]];
            txt_ctx.drawImage(this.fonts[font_id], ch_ind * 6, 0, 6, 10, i * 6, 0, 6, 10);
        }
        
        return txt_cv;
    }
}