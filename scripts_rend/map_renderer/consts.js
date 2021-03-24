// Map flags
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

// Directions
const DX_RIGHT = 1;
const DX_LEFT = 2;
const DX_UP = 3;
const DX_DOWN = 4;