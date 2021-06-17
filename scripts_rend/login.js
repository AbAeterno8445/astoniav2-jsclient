class LoginHandler {
    constructor(player, sockClient) {
        this.pl = player;
        this.sockClient = sockClient;

        this.div_loginscreen = document.getElementById('div-loginscreen');
        this.div_maingame = document.getElementById('div-maingame');
        this.div_selectchar = document.getElementById('div-selectchar');
        this.div_newchar = document.getElementById('div-newchar');
        this.div_password = document.getElementById('div-password');
        this.inp_login_password = document.getElementById('inp-login-password');
        this.but_pass_enter = document.getElementById('button-pass-enter');

        this.elems_newchar = {
            cv_newcharprev: new CanvasHandler(document.getElementById('cv-newchar-preview')),
            radio_templar: document.getElementById('inp-newchar-rad-templar'),
            radio_merc: document.getElementById('inp-newchar-rad-merc'),
            radio_hara: document.getElementById('inp-newchar-rad-hara'),
            radio_male: document.getElementById('inp-newchar-rad-male'),
            radio_female: document.getElementById('inp-newchar-rad-female'),
            inp_newcharname: document.getElementById('inp-newchar-name'),
            inp_newcharpass: document.getElementById('inp-newchar-pass'),
            inp_newchardesc: document.getElementById('inp-newchar-desc')
        }
        this.spr_temp_m = 2000;
        this.spr_temp_f = 8144;
        this.spr_merc_m = 5072;
        this.spr_merc_f = 7120;
        this.spr_hara_m = 4048;
        this.spr_hara_f = 6096;

        // Load basic characters
        loadCharGFX(this.elems_newchar.cv_newcharprev, this.spr_temp_m); // Templar male
        loadCharGFX(this.elems_newchar.cv_newcharprev, this.spr_temp_f); // Templar female
        loadCharGFX(this.elems_newchar.cv_newcharprev, this.spr_merc_m); // Merc male
        loadCharGFX(this.elems_newchar.cv_newcharprev, this.spr_merc_f); // Merc female
        loadCharGFX(this.elems_newchar.cv_newcharprev, this.spr_hara_m); // Hara male
        loadCharGFX(this.elems_newchar.cv_newcharprev, this.spr_hara_f); // Hara female

        this.loginprev_char = 0;
        this.loginprev_frame = 0;
        this.loginprev_intv = null;
    }

    updateNewcharPreview() {
        if (this.elems_newchar.radio_male.checked) {
            if (this.elems_newchar.radio_templar.checked) this.loginprev_char = this.spr_temp_m;
            else if (this.elems_newchar.radio_merc.checked) this.loginprev_char = this.spr_merc_m;
            else if (this.elems_newchar.radio_hara.checked) this.loginprev_char = this.spr_hara_m;
        } else if (this.elems_newchar.radio_female) {
            if (this.elems_newchar.radio_templar.checked) this.loginprev_char = this.spr_temp_f;
            else if (this.elems_newchar.radio_merc.checked) this.loginprev_char = this.spr_merc_f;
            else if (this.elems_newchar.radio_hara.checked) this.loginprev_char = this.spr_hara_f;
        }

        // Character preview animation
        if (this.loginprev_intv) clearInterval(this.loginprev_intv);
        this.loginprev_intv = setInterval(() => {
            var char_img = getNumSpritePath(this.loginprev_char + 64 + this.loginprev_frame);
            this.elems_newchar.cv_newcharprev.clearContext();
            this.elems_newchar.cv_newcharprev.drawImage(char_img, 0, 0);

            this.loginprev_frame++;
            if (this.loginprev_frame > 383) this.loginprev_frame = 0;
        }, TICK);
    }

    toggleScreen(screen_div) {
        if (screen_div.style.display == "flex") {
            screen_div.style.display = "none";
        } else {
            screen_div.style.display = "flex";
        }
    }

    /** Creates a character selection 'card' for the given character data. Returns a div element */
    createCharCard(chardata) {
        var tmp_chardiv = document.createElement('div');
        tmp_chardiv.className = "div-charcard";

        var tmp_chardiv_imgdiv = document.createElement('div');
        tmp_chardiv_imgdiv.style.display = "flex";
        tmp_chardiv_imgdiv.style.alignItems = "center";

        var tmp_chardiv_img = document.createElement('div');
        tmp_chardiv_img.className = 'charbox64';

        var char_sprite = 35; // 35 for question mark sprite
        switch (chardata.race) {
            case 2: char_sprite = this.spr_merc_m; break;
            case 3: char_sprite = this.spr_temp_m; break;
            case 4: char_sprite = this.spr_hara_m; break;
            case 76: char_sprite = this.spr_merc_f; break;
            case 77: char_sprite = this.spr_temp_f; break;
            case 78: char_sprite = this.spr_hara_f; break;
        }
        
        tmp_chardiv_img.style.backgroundImage = "url(" + getNumSpritePath(char_sprite) + ")";
        tmp_chardiv_imgdiv.appendChild(tmp_chardiv_img);

        var pl_rank = points2rank(chardata.points);
        var tmp_chardiv_rankimg = document.createElement('div');
        tmp_chardiv_rankimg.style.width = "32px";
        tmp_chardiv_rankimg.style.height = "96px";
        if (pl_rank > 0) tmp_chardiv_rankimg.style.backgroundImage = "url(" + getNumSpritePath(10 + pl_rank) + ")";
        tmp_chardiv_imgdiv.appendChild(tmp_chardiv_rankimg);

        tmp_chardiv.appendChild(tmp_chardiv_imgdiv);

        var tmp_charname = document.createElement('span');
        tmp_charname.innerHTML = chardata.name;
        tmp_chardiv.appendChild(tmp_charname);

        var tmp_datadiv = document.createElement('div');
        tmp_datadiv.style.fontSize = "9pt";

        var tmp_char_creationdate = document.createElement('span');
        tmp_char_creationdate.innerHTML = "Created: " + chardata.creation;
        tmp_datadiv.appendChild(tmp_char_creationdate);

        tmp_chardiv.appendChild(tmp_datadiv);

        tmp_chardiv.appendChild(document.createElement('br'));

        var tmp_selbutton = document.createElement('button');
        tmp_selbutton.innerHTML = "Select";
        tmp_selbutton.onclick = () => {
            this.inp_login_password.value = "";
            this.toggleScreen(this.div_password);

            this.but_pass_enter.onclick = () => {
                this.toggleScreen(this.div_password);
                this.pl.file = './characters/' + chardata.name + '.json';
                if (this.pl.loadfile() == 0) {
                    console.log("Could not load selected character data.");
                    return;
                }
                this.loginCharacter(false, chardata);
            };
        };
        tmp_chardiv.appendChild(tmp_selbutton);

        var tmp_refresh_button = document.getElementById('but-refresh-charselect');
        tmp_refresh_button.onclick = () => this.updateCharSelect();

        return tmp_chardiv;
    }

    updateCharSelect() {
        // Remove old buttons
        while (this.div_selectchar.firstChild) {
            this.div_selectchar.removeChild(this.div_selectchar.firstChild);
        }

        var files = fs.readdirSync('./characters').filter(el => path.extname(el) === '.json');
        for (var i = 0; i < files.length; i++) {
            try {
                var chardata = JSON.parse(fs.readFileSync('./characters/' + files[i]));

                var char_card = this.createCharCard(chardata);
                this.div_selectchar.appendChild(char_card);
            } catch (err) {
                continue;
            }
        }

        // New character button
        var newchar_button = document.createElement('div');
        newchar_button.className = "charbox64 div-createchar-button";
        newchar_button.onclick = () => this.toggleScreen(this.div_newchar);

        var newchar_plus = document.createElement('span');
        newchar_plus.className = "unselectable";
        newchar_plus.innerHTML = "+";
        newchar_button.appendChild(newchar_plus);

        this.div_selectchar.appendChild(newchar_button);
    }

    createNewChar() {
        var charname = this.elems_newchar.inp_newcharname.value.trim();
        var char_time = new Date();

        this.updateCharSelect();
        this.toggleScreen(this.div_newchar);
        this.loginCharacter(true, this.pl);

        var tmp_race = "";
        var tmp_gender = "";
        if (this.elems_newchar.radio_templar.checked) tmp_race = "templar";
        else if (this.elems_newchar.radio_merc.checked) tmp_race = "merc";
        else if (this.elems_newchar.radio_hara.checked) tmp_race = "hara";

        if (this.elems_newchar.radio_male.checked) tmp_gender = "male";
        else if (this.elems_newchar.radio_female.checked) tmp_gender = "female";

        this.pl.name = charname;
        this.pl.newname = charname;
        this.pl.description = this.elems_newchar.inp_newchardesc.value.trim();
        this.pl.race = this.getRaceNum(tmp_race, tmp_gender);
        this.pl.creation = `${char_time.getFullYear()}-${char_time.getMonth() + 1}-${char_time.getDate()}`;

        var char_filepath = './characters/' + charname + '.json';
        this.pl.file = char_filepath;

        this.elems_newchar.inp_newcharname.value = "";
        this.elems_newchar.inp_newcharpass.value = "";
        this.elems_newchar.inp_newchardesc.value = "";
    }

    getRaceNum(race, gender) {
        if (gender == "male") {
            if (race == "templar") return 3;
            else if (race == "merc") return 2;
            else if (race == "hara") return 4;
        } else if (gender == "female") {
            if (race == "templar") return 77;
            else if (race == "merc") return 76;
            else if (race == "hara") return 78;
        }
        return null;
    }

    /** Attempt to log in as the given character. If newchar is 1 or true,
     * try to log in with given data as new character */
    loginCharacter(newchar, chardata) {
        try {
            this.div_loginscreen.style.display = "none";

            var pass_str = this.inp_login_password.value;
            if (newchar) pass_str = this.elems_newchar.inp_newcharpass.value;

            this.sockClient.connect(newchar, chardata, pass_str, (err) => {
                if (err) {
                    console.log("ERROR - Connecting to server:", err);
                    this.sockClient.log_failure("ERROR - Connecting to server: " + err.message, FNT_RED);
                }
            });

            this.div_maingame.style.display = "block";
        } catch (err) {
            console.log("ERROR - Trying to log in:", err, "- used chardata:", chardata);
            this.sockClient.log_failure("ERROR - Trying to log in: " + err.message, FNT_RED);
        }
    }

    returnToLogin() {
        if (this.div_loginscreen.style.display == "none") {
            this.updateCharSelect();
            this.div_maingame.style.display = "none";
            this.div_loginscreen.style.display = "block";

            mainPlayer.savefile();
            gameRenderer.resetVars();
        }
    }
}