class MainPlayer {
    constructor() {
        this.file = "";
        this.name = "";
        this.newname = ""; // New char name

        this.mode = 0; // 0: slow, 1: medium, 2: fast

        // character attributes+abilities
	    // [0]=bare value, [1]=modifier, [2]=total value
        this.attrib = [];
        for (var i = 0; i < 6; i++) this.attrib.push([0, 0, 0, 0, 0, 0]);

        this.skill = [];
        for (var i = 0; i < 100; i++) this.skill.push([0, 0, 0, 0, 0, 0]);

        this.hp = [0, 0, 0, 0, 0, 0];
        this.end = [0, 0, 0, 0, 0, 0];
        this.mana = [0, 0, 0, 0, 0, 0];

        // temporary attributes
        this.a_hp = 0;
        this.a_end = 0;
        this.a_mana = 0;

        this.points = 0;
        this.points_tot = 0;
        this.kindred = 0;

        this.gold = 0;

        this.item = [];
        this.item_p = [];
        for (var i = 0; i < 40; i++) {
            this.item.push(0);
            this.item_p.push(0);
        }

        this.worn = [];
        this.worn_p = [];
        for (var i = 0; i < 20; i++) {
            this.worn.push(0);
            this.worn_p.push(0);
        }

        this.spell = [];
        this.active = [];
        for (var i = 0; i < 20; i++) {
            this.spell.push(0);
            this.active.push(0);
        }

        this.armor = 0;
        this.weapon = 0;

        this.citem = 0;
        this.citem_p = 0;

        this.attack_cn = 0;
        this.goto_x = 0;
        this.goto_y = 0;
        this.misc_action = 0;
        this.misc_target1 = 0;
        this.misc_target2 = 0;
        this.dir = 0;

        this.usnr = 0;
        this.pass1 = 0;
        this.pass2 = 0;

        // Extra savefile data
        this.description = "";
        this.race = 0;
        this.creation = 0;
    }

    /** Loads character data using the 'file' var (remember to set it before calling this).
     * Returns 1 on success, 0 on failure */
    loadfile() {
        if (!this.file) return 0;
        if (!fs.existsSync(this.file)) return 0;

        try {
            var chardata = JSON.parse(fs.readFileSync(this.file));
            this.name = chardata.name;
            this.race = chardata.race;
            this.creation = chardata.creation;
            this.points_tot = chardata.points;
            this.description = chardata.description;
            this.usnr = chardata.usnr;
            this.pass1 = chardata.pass1;
            this.pass2 = chardata.pass2;
        } catch (err) {
            console.log("ERROR - Reading character file:", err);
            return 0;
        }
        return 1;
    }

    savefile() {
        if (!this.name) return;
        if (!this.file) this.file = './characters/' + this.name + '.json';

        var savedata = {
            name: this.name,
            race: this.race,
            creation: this.creation,
            points: this.points_tot,
            description: this.description,
            usnr: this.usnr,
            pass1: this.pass1,
            pass2: this.pass2
        };
        fs.writeFileSync(this.file, JSON.stringify(savedata));
    }

    attrib_needed(n, v) {
        if (v >= this.attrib[n][2])	return HIGH_VAL;
	    return Math.floor(v * v * v * this.attrib[n][3] / 20);
    }

    hp_needed(v)
    {
        if (v >= this.hp[2]) return HIGH_VAL;

        return Math.floor(v * this.hp[3]);
    }

    end_needed(v)
    {
        if (v >= this.end[2]) return HIGH_VAL;

        return Math.floor(v * this.end[3] / 2);
    }

    mana_needed(v)
    {
        if (v >= this.mana[2]) return HIGH_VAL;

        return Math.floor(v * this.mana[3]);
    }

    skill_needed(n, v)
    {
        if (v >= this.skill[n][2]) return HIGH_VAL;

        return Math.floor(Math.max(v, v * v * v * this.skill[n][3] / 40));
    }
}