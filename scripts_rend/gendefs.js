const gameConfig = JSON.parse(fs.readFileSync("./config.json"), 'utf-8');

// Taken from mjackson's color-conversion-algorithms.js
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [h, s, l];
}

const sv_cmds = {
    "SV_EMPTY": 0,
    "SV_CHALLENGE": 1,
    "SV_NEWPLAYER": 2,
    "SV_SETCHAR_NAME1": 3,
    "SV_SETCHAR_NAME2": 4,
    "SV_SETCHAR_NAME3": 5,
    "SV_SETCHAR_MODE": 6,

    "SV_SETCHAR_ATTRIB": 7,
    "SV_SETCHAR_SKILL": 8,

    "SV_SETCHAR_HP": 12,
    "SV_SETCHAR_ENDUR": 13,
    "SV_SETCHAR_MANA": 14,

    "SV_SETCHAR_AHP": 20,
    "SV_SETCHAR_PTS": 21,
    "SV_SETCHAR_GOLD": 22,
    "SV_SETCHAR_ITEM": 23,
    "SV_SETCHAR_WORN": 24,
    "SV_SETCHAR_OBJ": 25,

    "SV_TICK": 27,

    "SV_LOOK1": 29,
    "SV_SCROLL_RIGHT": 30,
    "SV_SCROLL_LEFT": 31,
    "SV_SCROLL_UP": 32,
    "SV_SCROLL_DOWN": 33,
    "SV_LOGIN_OK": 34,
    "SV_SCROLL_RIGHTUP": 35,
    "SV_SCROLL_RIGHTDOWN": 36,
    "SV_SCROLL_LEFTUP": 37,
    "SV_SCROLL_LEFTDOWN": 38,
    "SV_LOOK2": 39,
    "SV_LOOK3": 40,
    "SV_LOOK4": 41,
    "SV_SETTARGET": 42,
    "SV_SETMAP2": 43,
    "SV_SETORIGIN": 44,
    "SV_SETMAP3": 45,
    "SV_SETCHAR_SPELL": 46,
    "SV_PLAYSOUND": 47,
    "SV_EXIT": 48,
    "SV_MSG": 49,
    "SV_LOOK5": 50,
    "SV_LOOK6": 51,

    "SV_LOG": 52,
    "SV_LOG0": 52,
    "SV_LOG1": 53,
    "SV_LOG2": 54,
    "SV_LOG3": 55,

    "SV_LOAD": 56,
    "SV_CAP": 57,
    "SV_MOD1": 58,
    "SV_MOD2": 59,
    "SV_MOD3": 60,
    "SV_MOD4": 61,
    "SV_MOD5": 62,
    "SV_MOD6": 63,
    "SV_MOD7": 64,
    "SV_MOD8": 65,
    "SV_SETMAP4": 66,
    "SV_SETMAP5": 67,
    "SV_SETMAP6": 68,
    "SV_SETCHAR_AEND": 69,
    "SV_SETCHAR_AMANA": 70,
    "SV_SETCHAR_DIR": 71,
    "SV_UNIQUE": 72,
    "SV_IGNORE": 73,

    "SV_SETMAP": 128
}

const cl_cmds = {
    "CL_EMPTY": 0,
    "CL_NEWLOGIN": 1,
    "CL_LOGIN": 2,
    "CL_CHALLENGE": 3,
    "CL_PERF_REPORT": 4,
    "CL_CMD_MOVE": 5,
    "CL_CMD_PICKUP": 6,
    "CL_CMD_ATTACK": 7,
    "CL_CMD_MODE": 8,
    "CL_CMD_INV": 9,
    "CL_CMD_STAT": 10,
    "CL_CMD_DROP": 11,
    "CL_CMD_GIVE": 12,
    "CL_CMD_LOOK": 13,
    "CL_CMD_INPUT1": 14,
    "CL_CMD_INPUT2": 15,
    "CL_CMD_INV_LOOK": 16,
    "CL_CMD_LOOK_ITEM": 17,
    "CL_CMD_USE": 18,
    "CL_CMD_SETUSER": 19,
    "CL_CMD_TURN": 20,
    "CL_CMD_AUTOLOOK": 21,
    "CL_CMD_INPUT3": 22,
    "CL_CMD_INPUT4": 23,
    "CL_CMD_RESET": 24,
    "CL_CMD_SHOP": 25,
    "CL_CMD_SKILL": 26,
    "CL_CMD_INPUT5": 27,
    "CL_CMD_INPUT6": 28,
    "CL_CMD_INPUT7": 29,
    "CL_CMD_INPUT8": 30,
    "CL_CMD_EXIT": 31,
    "CL_CMD_UNIQUE": 32,
    "CL_PASSWD": 33,

    "CL_CMD_CTICK": 255
}

const rank_names = [
    "Private",
	"Private First Class",
	"Lance Corporal",
	"Corporal",
	"Sergeant",
	"Staff Sergeant",
	"Master Sergeant",
	"First Sergeant",
	"Sergeant Major",
	"Second Lieutenant",
	"First Lieutenant",
	"Captain",
	"Major",
	"Lieutenant Colonel",
	"Colonel",
	"Brigadier General",
	"Major General",
	"Lieutenant General",
	"General",
	"Field Marshal",
	"Knight",
	"Baron",
	"Earl",
	"Warlord"
];

const rank_xptable = [
    50,         // 0
    850,        // 1
    4900,       // 2
    17700,      // 3
    48950,      // 4
    113750,     // 5
    233800,     // 6
    438600,     // 7
    766650,     // 8
    1266650,    // 9
    1998700,    // 10
    3035500,    // 11
    4463550,    // 12
    6384350,    // 13
    8915600,    // 14
    12192400,   // 15
    16368450,   // 16
    21617250,   // 17
    28133300,   // 18
    36133300,   // 19
    49014500,   // 20
    63000600,   // 21
    80977100    // 22
];

function points2rank (v) {
    for (var i = 0; i < rank_xptable.length; i++) {
        if (v < rank_xptable[i]) return i;
    }
    return rank_xptable.length;
}

function rank2points (v) {
    if (v < 0 || v >= rank_xptable.length) return 0;
    return rank_xptable[v];
}

const HIGH_VAL = (1<<30) >>> 0;

const at_name = [
	"Braveness",
	"Willpower",
	"Intuition",
	"Agility",
	"Strength"
];

const AT_BRAVE = 0;
const AT_WILL = 1;
const AT_INT = 2;
const AT_AGIL = 3;
const AT_STREN = 4;

const skilltab = [
    {nr: 0, sortkey: 'C', name: "Hand to Hand", name_short: "H2H", desc: "Fighting without weapons.", attrib: [AT_BRAVE, AT_AGIL, AT_STREN]},
    {nr: 1, sortkey: 'C', name: "Karate", name_short: "Karate", desc: "Fighting without weapons and doing damage.", attrib: [AT_BRAVE, AT_AGIL, AT_STREN]},
	{nr: 2, sortkey: 'C', name: "Dagger", name_short: "Dagger", desc: "Fighting with daggers or similar weapons.", attrib: [AT_BRAVE, AT_AGIL, AT_INT]},
	{nr: 3, sortkey: 'C', name: "Sword", name_short: "Sword", desc: "Fighting with swords or similar weapons.", attrib: [AT_BRAVE, AT_AGIL, AT_STREN]},
	{nr: 4, sortkey: 'C', name: "Axe", name_short: "Axe", desc: "Fighting with axes or similar weapons.", attrib: [AT_BRAVE, AT_STREN, AT_STREN]},
	{nr: 5, sortkey: 'C', name: "Staff", name_short: "Staff", desc: "Fighting with staves or similar weapons.", attrib: [AT_AGIL, AT_STREN, AT_STREN]},
	{nr: 6, sortkey: 'C', name: "Two-Handed", name_short: "Two-Handed", desc: "Fighting with two-handed weapons.", attrib: [AT_AGIL, AT_STREN, AT_STREN]},

    {nr: 7, sortkey: 'G', name: "Lock-Picking", name_short: "Lock-Pick", desc: "Opening doors without keys.", attrib: [AT_INT, AT_WILL, AT_AGIL]},
	{nr: 8, sortkey: 'G', name: "Stealth", name_short: "Stealth", desc: "Moving without being seen or heard.", attrib: [AT_INT, AT_WILL, AT_AGIL]},
    {nr: 9, sortkey: 'G', name: "Perception", name_short: "Perception", desc: "Seeing and hearing.", attrib: [AT_INT, AT_WILL, AT_AGIL]},

    {nr: 10, sortkey: 'M', name: "Swimming", name_short: "Swim", desc: "Moving through water without drowning.", attrib: [AT_INT, AT_WILL, AT_AGIL]},
	{nr: 11, sortkey: 'R', name: "Magic Shield", name_short: "Magic Sh.", desc: "Spell: Create a magic shield (Cost: 25 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},

    {nr: 12, sortkey: 'G', name: "Bartering", name_short: "Barter", desc: "Getting good prices from merchants.", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 13, sortkey: 'G', name: "Repair", name_short: "Repair", desc: "Repairing items.", attrib: [AT_INT, AT_WILL, AT_AGIL]},

    {nr: 14, sortkey: 'R', name: "Light", name_short: "Light", desc: "Spell: Create light (Cost: 5 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 15, sortkey: 'R', name: "Recall", name_short: "Recall", desc: "Spell: Teleport to temple (Cost: 15 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 16, sortkey: 'R', name: "Guardian Angel", name_short: "Guardian A.", desc: "Spell: Avoid loss of HPs and items on death.", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 17, sortkey: 'R', name: "Protection", name_short: "Protect", desc: "Spell: Enhance Armor of target (Cost: 15 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 18, sortkey: 'R', name: "Enhance Weapon", name_short: "Enhance W.", desc: "Spell: Enhance Weapon of target (Cost: 15 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 19, sortkey: 'R', name: "Stun", name_short: "Stun", desc: "Spell: Make target motionless (Cost: 20 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 20, sortkey: 'R', name: "Curse", name_short: "Curse", desc: "Spell: Decrease attributes of target (Cost: 35 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 21, sortkey: 'R', name: "Bless", name_short: "Bless", desc: "Spell: Increase attributes of target (Cost: 35 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 22, sortkey: 'R', name: "Identify", name_short: "Identify", desc: "Spell: Read stats of item/character (Cost: 5 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},

    {nr: 23, sortkey: 'G', name: "Resistance", name_short: "Resist", desc: "Resist against magic.", attrib: [AT_INT, AT_WILL, AT_STREN]},

    {nr: 24, sortkey: 'R', name: "Blast", name_short: "Blast", desc: "Spell: Inflict injuries to target (Cost: varies).", attrib: [AT_INT, AT_WILL, AT_STREN]},
	{nr: 25, sortkey: 'R', name: "Dispel Magic", name_short: "Dispel", desc: "Spell: Removes curse magic from target (Cost: 25 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},

    {nr: 26, sortkey: 'R', name: "Heal", name_short: "Heal", desc: "Spell: Heal injuries (Cost: 25 Mana).", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 27, sortkey: 'R', name: "Ghost Companion", name_short: "Ghost C.", desc: "Spell: Create a ghost to attack an enemy.", attrib: [AT_BRAVE, AT_INT, AT_WILL]},

    {nr: 28, sortkey: 'B', name: "Regenerate", name_short: "Regen", desc: "Regenerate Hitpoints faster.", attrib: [AT_STREN, AT_STREN, AT_STREN]},
	{nr: 29, sortkey: 'B', name: "Rest", name_short: "Rest", desc: "Regenerate Endurance faster.", attrib: [AT_AGIL, AT_AGIL, AT_AGIL]},
	{nr: 30, sortkey: 'B', name: "Meditate", name_short: "Meditate", desc: "Regenerate Mana faster.", attrib: [AT_INT, AT_WILL, AT_WILL]},

    {nr: 31, sortkey: 'G', name: "Sense Magic", name_short: "Sense M.", desc: "Find out who casts what at you.", attrib: [AT_BRAVE, AT_INT, AT_WILL]},
	{nr: 32, sortkey: 'G', name: "Immunity", name_short: "Immunity", desc: "Partial immunity against negative magic.", attrib: [AT_BRAVE, AT_AGIL, AT_STREN]},
	{nr: 33, sortkey: 'G', name: "Surround Hit", name_short: "Surround", desc: "Hit all your enemies at once.", attrib: [AT_BRAVE, AT_AGIL, AT_STREN]},
	{nr: 34, sortkey: 'G', name: "Concentrate", name_short: "Concentrate", desc: "Reduces mana cost for all spells.", attrib: [AT_WILL, AT_WILL, AT_WILL]},
	{nr: 35, sortkey: 'G', name: "Warcry", name_short: "Warcry", desc: "Frighten all enemies in hearing distance.", attrib: [AT_BRAVE, AT_BRAVE, AT_STREN]}
];

const INJURED = (1<<0) >>> 0;
const INJURED1 = (1<<1) >>> 0;
const INJURED2 = (1<<2) >>> 0;
const STONED = (1<<3) >>> 0;
const INFRARED = (1<<4) >>> 0;
const UWATER = (1<<5) >>> 0;

const ISUSABLE = (1<<7) >>> 0;
const ISITEM = (1<<8) >>> 0;
const ISCHAR = (1<<9) >>> 0;
const INVIS = (1<<10) >>> 0;
const STUNNED = (1<<11) >>> 0;

const TOMB = ((1<<12)|(1<<13)|(1<<14)|(1<<15)|(1<<16)) >>> 0;
const TOMB1 = (1<<12) >>> 0;
const DEATH = ((1<<17)|(1<<18)|(1<<19)|(1<<20)|(1<<21)) >>> 0;
const DEATH1 = (1<<17) >>> 0;

const EMAGIC = ((1<<22)|(1<<23)|(1<<24)) >>> 0;
const EMAGIC1 = (1<<22) >>> 0;
const GMAGIC = ((1<<25)|(1<<26)|(1<<27)) >>> 0;
const GMAGIC1 = (1<<25) >>> 0;
const CMAGIC = ((1<<28)|(1<<29)|(1<<30)) >>> 0;
const CMAGIC1 = (1<<28) >>> 0;

const TPURPLE = (1<<31) >>> 0;

const MF_MOVEBLOCK = (1<<0) >>> 0;
const MF_SIGHTBLOCK = (1<<1) >>> 0;
const MF_INDOORS = (1<<2) >>> 0;
const MF_UWATER = (1<<3) >>> 0;
const MF_NOLAG = (1<<4) >>> 0;
const MF_NOMONST = (1<<5) >>> 0;
const MF_BANK = (1<<6) >>> 0;
const MF_TAVERN = (1<<7) >>> 0;
const MF_NOMAGIC = (1<<8) >>> 0;
const MF_DEATHTRAP = (1<<9) >>> 0;

const MF_ARENA = (1<<11) >>> 0;

const MF_NOEXPIRE = (1<<13) >>> 0;

const DR_IDLE = 0;
const DR_DROP = 1;
const DR_PICKUP = 2;
const DR_GIVE = 3;
const DR_USE = 4;
const DR_BOW = 5;
const DR_WAVE = 6;
const DR_TURN = 7;
const DR_SINGLEBUILD = 8;
const DR_AREABUILD1 = 9;
const DR_AREABUILD2 = 10;

const SPR_EMPTY = 999;

const FNT_RED = 0;
const FNT_YELLOW = 1;
const FNT_GREEN = 2;
const FNT_BLUE = 3;
//const FNT_OBFUSCATED = 4;
const FNT_PURPLE = 1960;
const FNT_TURQUOISE = 1961;
const FNT_PINK = 1962;
const FNT_ORANGE = 1963;
const FNT_AQUA = 1964;
const FNT_SILVER = 1965;
const FNT_EMERALD = 1966;
const FNT_DEMON = 1967;

const TICKS = 18;
const TICK = (1000/TICKS);
const QSIZE = 8;

const MAPX = 1024;
const MAPY = 1024;

const renderdistance = gameConfig.GFX.render_distance;

const sv_version = 0x020E07;