class CharLook {
    constructor() {
        this.autoflag = 0;
        this.worn = [];
        for (var i = 0; i < 20; i++) this.worn.push(0);
        this.sprite = 0;
        this.points = 0;
        this.name = "";
        this.hp = 0;
        this.end = 0;
        this.mana = 0;
        this.a_hp = 0;
        this.a_end = 0;
        this.a_mana = 0;
        this.nr = 0;
        this.id = 0;
        this.extended = 0;
        this.item = [];
        for (var i = 0; i < 40; i++) this.item.push(0);
        this.price = [];
        for (var i = 0; i < 62; i++) this.price.push(0);
        this.pl_price = 0;
    }
}