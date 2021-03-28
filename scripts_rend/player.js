class MainPlayer {
    constructor() {
        this.name = "";

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
    }
}