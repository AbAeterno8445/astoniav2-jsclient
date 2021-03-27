class FontDrawer {
    font_str = " !\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

    constructor() {
        this.fonts = {};

        this.font_dict = {};
        for (var i = 0; i < this.font_str.length; i++) {
            this.font_dict[this.font_str[i]] = i;
        }
    }

    load_font(id, img_path) {
        var font_img = new Image();
        font_img.onload = () => {
            this.fonts[id] = font_img;
        };
        font_img.src = img_path;
        this.fonts[id] = null;
    }

    get_text_img(font_id, msg) {
        if (!this.fonts.hasOwnProperty(font_id)) return null;
        if (this.fonts[font_id] == null) return null;

        var txt_cv = document.createElement('canvas');
        txt_cv.width = msg.length * 6;
        txt_cv.height = 10;
        var txt_ctx = txt_cv.getContext('2d');

        msg = msg.trim();
        if (!msg.length) return null;

        for (var i = 0; i < msg.length; i++) {
            if (!this.font_dict.hasOwnProperty(msg[i])) continue;

            var ch_ind = this.font_dict[msg[i]];
            txt_ctx.drawImage(this.fonts[font_id], ch_ind * 6, 0, 6, 10, i * 6, 0, 6, 10);
        }
        
        return txt_cv;
    }
}