class ChatLogger {
    constructor(font_drawer, default_font) {
        this.font_drawer = font_drawer;

        this.default_font = default_font;

        this.log_limit = 100;

        this.div_chatbox = document.getElementById('div-chatbox');
        this.chat_scrolled = 0;

        // Disable auto-scroll if user scrolled somewhere, re-enable when scrolling to bottom
        this.div_chatbox.onscroll = () => {
            if (this.div_chatbox.scrollHeight - this.div_chatbox.offsetHeight - this.div_chatbox.scrollTop >= 1) {
                this.chat_scrolled = 1;
            } else {
                this.chat_scrolled = 0;
            }
        };

        this.log_elems = [];
    }

    chat_clear() {
        while (this.div_chatbox.firstChild) {
            this.div_chatbox.removeChild(this.div_chatbox.firstChild);
        }
        this.log_elems = [];
    }

    /** Log the given message and print it into the chatbox. font_dict receives a dictionary where the key is the message
     * index and value is what font to draw from that index onwards. e.g. font_dict = {0: FNT_YELLOW, 15: FNT_EMERALD, ...} */
    chat_logmsg(msg, font_dict = {}) {
        var div_logline = document.createElement('div');
        div_logline.className = 'div-logline';

        var font = this.default_font;
        for (var i = 0; i < msg.length; i++) {
            if (font_dict.hasOwnProperty(i) && this.font_drawer.is_font_loaded(font_dict[i])) {
                font = font_dict[i];
            }

            let char_img = document.createElement('img');
            char_img.width = 6;
            char_img.height = 10;

            var char_img_src = this.font_drawer.get_char_imgsrc(font, msg[i]);
            char_img.src = char_img_src;
            div_logline.appendChild(char_img);
        }

        this.div_chatbox.appendChild(div_logline);
        this.log_elems.push(div_logline);
        if (this.log_elems.length > this.log_limit) {
            var elem = this.log_elems.shift();
            elem.parentElement.removeChild(elem);
        }

        if (!this.chat_scrolled) this.div_chatbox.scrollTop = this.div_chatbox.scrollHeight;
    }

    /** Logs a message that uses the /|font| format */
    chat_logmsg_format(msg, default_font = null) {
        var format_flag = 0;
        var format_start = 0;
        var format_offset = 0;
        var tmp_font = "";
        var font_dict = {};

        if (default_font != null) font_dict[0] = default_font;

        for (var i = 1; i < msg.length; i++) {
            if (!format_flag) {
                if (msg[i - 1] == '/' && msg[i] == '|') {
                    format_flag = 1;
                    format_start = i - 1;
                }
            } else {
                if (msg[i] == '|') {
                    font_dict[format_start - format_offset] = parseInt(tmp_font, 10);
                    format_offset += i - format_start + 1;

                    tmp_font = "";
                    format_flag = 0;
                } else {
                    tmp_font += msg[i];
                }
            }
        }

        for (var fs in font_dict) {
            msg = msg.replace(`/|${font_dict[fs]}|`, '');
        }

        this.chat_logmsg(msg, font_dict);
    }

    /** Create a button and log it - returns the button element */
    chat_logbutton(value) {
        var tmp_button = document.createElement('button');
        tmp_button.innerHTML = value;

        this.div_chatbox.appendChild(document.createElement('br'));
        this.div_chatbox.appendChild(tmp_button);
        return tmp_button;
    }

    /** Create a button that returns to the character selection menu, and log it */
    chat_logbutton_retmenu() {
        setTimeout(() => {
            var menu_button = this.chat_logbutton("Return to selection");
            menu_button.onclick = () => {
                this.chat_clear();
                loginHandler.returnToLogin();
            };
        }, 1000);
    }
}