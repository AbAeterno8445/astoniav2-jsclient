class MapTile {
    constructor(id, x, y, floor, item) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.ba_sprite = floor; // Sprite # of floor
        this.it_sprite = item;  // Sprite # of item
        this.it_status = 0;     // For items with animations

        this.avgcol = null;

        this.ch_sprite = 0;
        this.ch_status = 0;     // What the character is doing, animation-wise
        this.ch_stat_off = 0;
        this.ch_speed = 0;      // Speed of animation
        this.ch_nr = 0;         // Character ID
        this.ch_id = 0;         // Character 'crc'
        this.ch_proz = 0;

        this.light = 0;
        this.flags = 0;
        this.flags2 = 0;
        this.flags3 = 0;

        this.obj1 = 0;
        this.obj2 = 0;
        this.obj_xoff = 0;
        this.obj_yoff = 0;

        this.idle_ani = 0;
    }
}