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

const render_consts = {
    INJURED: (1<<0) >>> 0,
    INJURED1: (1<<1) >>> 0,
    INJURED2: (1<<2) >>> 0,
    STONED: (1<<3) >>> 0,
    INFRARED: (1<<4) >>> 0,
    UWATER: (1<<5) >>> 0,

    ISUSABLE: (1<<7) >>> 0,
    ISITEM: (1<<8) >>> 0,
    ISCHAR: (1<<9) >>> 0,
    INVIS: (1<<10) >>> 0,
    STUNNED: (1<<11) >>> 0,

    TOMB: ((1<<12)|(1<<13)|(1<<14)|(1<<15)|(1<<16)) >>> 0,
    TOMB1: (1<<12) >>> 0,
    DEATH: ((1<<17)|(1<<18)|(1<<19)|(1<<20)|(1<<21)) >>> 0,
    DEATH1: (1<<17) >>> 0,

    EMAGIC: ((1<<22)|(1<<23)|(1<<24)) >>> 0,
    EMAGIC1: (1<<22) >>> 0,
    GMAGIC: ((1<<25)|(1<<26)|(1<<27)) >>> 0,
    GMAGIC1: (1<<25) >>> 0,
    CMAGIC: ((1<<28)|(1<<29)|(1<<30)) >>> 0,
    CMAGIC1: (1<<28) >>> 0,

    TPURPLE: (1<<31) >>> 0,

    SPR_EMPTY: 999,

    TICKS: 36,
    TICK: (1000/36), // (1000/TICK)
    QSIZE: 8
}

const renderdistance = 54;

module.exports = {
    sv_cmds: sv_cmds,
    cl_cmds: cl_cmds,
    renderdistance: renderdistance,
    render_consts: render_consts
}