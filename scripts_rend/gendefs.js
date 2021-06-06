const gameConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), 'utf-8'));

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

const renderdistance = gameConfig.GFX.render_distance;

const sv_version = 0x020E07;