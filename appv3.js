/* =============================================================================
   PSO GC / BB Item Database — main application logic (appv3.js)

   Supports versions: gc, bb
   12 character classes (GC V3 / BB V4) vs 9 in PC/V2
   ============================================================================= */

"use strict";

// ---------------------------------------------------------------------------
// Class flags — from newserv StaticGameData.cc ClassFlag enum
// MALE=0x01 HUMAN=0x02 NEWMAN=0x04 ANDROID=0x08 HUNTER=0x10 RANGER=0x20 FORCE=0x40
// ---------------------------------------------------------------------------
const CF = {
  MALE:    0x01,
  HUMAN:   0x02,
  NEWMAN:  0x04,
  ANDROID: 0x08,
  HUNTER:  0x10,
  RANGER:  0x20,
  FORCE:   0x40,
};
const FEED_TABLES = [
  // table 0
  [
    [3,3,5,40,5,0],
    [3,3,10,45,5,0],
    [4,4,15,50,10,0],
    [3,3,5,0,5,40],
    [3,3,10,0,5,45],
    [4,4,15,0,10,50],
    [3,3,5,10,40,0],
    [3,3,5,0,44,10],
    [4,1,15,30,15,25],
    [4,1,15,25,15,30],
    [6,5,25,25,25,25]
  ],

  // table 1
  [
    [0,0,5,10,0,-1],
    [2,1,6,15,3,-3],
    [3,2,12,21,4,-7],
    [0,0,5,0,0,8],
    [2,1,7,0,3,13],
    [3,2,7,-7,6,19],
    [0,1,0,5,15,0],
    [2,0,-1,0,14,5],
    [-2,2,10,11,8,0],
    [3,-2,9,0,9,11],
    [4,3,14,9,18,11]
  ],

  // table 2
  [
    [0,-1,1,9,0,-5],
    [3,0,1,13,0,-10],
    [4,1,8,16,2,-15],
    [0,-1,0,-5,0,9],
    [3,0,4,-10,0,13],
    [3,2,6,-15,5,17],
    [-1,1,-5,4,12,-5],
    [0,0,-5,-6,11,4],
    [4,-2,0,11,3,-5],
    [-1,1,4,-5,0,11],
    [4,2,7,8,6,9]
  ],

  // table 3
  [
    [0,-1,0,3,0,0],
    [2,0,5,7,0,-5],
    [3,1,4,14,6,-10],
    [0,0,0,0,0,4],
    [0,1,4,-5,0,8],
    [2,2,4,-10,3,15],
    [-3,3,0,0,7,0],
    [3,0,-4,-5,20,-5],
    [3,-2,-10,9,6,9],
    [-2,2,8,5,-8,7],
    [3,2,7,7,7,7]
  ],

  // table 4
  [
    [2,-1,-5,9,-5,0],
    [2,0,0,11,0,-10],
    [0,1,4,14,0,-15],
    [2,-1,-5,0,-6,10],
    [2,0,0,-10,0,11],
    [0,1,4,-15,0,15],
    [2,-1,-5,-5,16,-5],
    [-2,3,7,-3,0,-3],
    [4,-2,5,21,-5,-20],
    [3,0,-5,-20,5,21],
    [3,2,4,6,8,5]
  ],

  // table 5
  [
    [2,-1,-4,13,-5,-5],
    [0,1,0,16,0,-15],
    [2,0,3,19,-2,-18],
    [2,-1,-4,-5,-5,13],
    [0,1,0,-15,0,16],
    [2,0,3,-20,0,19],
    [0,1,5,-6,6,-5],
    [-1,1,0,-4,14,-10],
    [4,-1,4,17,-5,-15],
    [2,0,-10,-15,5,21],
    [3,2,2,8,3,6]
  ],

  // table 6
  [
    [-1,1,-3,9,-3,-4],
    [2,0,0,11,0,-10],
    [2,0,2,15,0,-16],
    [-1,1,-3,-4,-3,9],
    [2,0,0,-10,0,11],
    [2,0,-2,-15,0,19],
    [2,-1,0,6,9,-15],
    [-2,3,0,-15,9,6],
    [3,-1,9,-20,-5,17],
    [0,2,-5,20,5,-20],
    [3,2,0,11,0,11]
  ],

  // table 7
  [
    [-1,0,-4,21,-15,-5],
    [0,1,-1,27,-10,-16],
    [2,0,5,29,-7,-25],
    [-1,0,-10,-5,-10,21],
    [0,1,-5,-16,-5,25],
    [2,0,-7,-29,6,29],
    [-1,1,-10,-10,28,-10],
    [2,-1,9,-18,24,-15],
    [2,1,19,18,-15,-20],
    [2,1,-15,-20,19,18],
    [4,2,3,7,3,3]
  ],

  // table 8
  [
    [-1,1,-3,9,-3,-4],
    [2,0,0,11,0,-10],
    [2,0,4,14,0,-15],
    [-1,1,-3,-4,-3,9],
    [2,0,0,-10,0,11],
    [2,0,-4,-15,0,14],
    [2,-1,0,6,9,-15],
    [-2,3,0,-15,9,6],
    [3,-1,10,-20,-5,17],
    [0,2,-3,17,6,-20],
    [3,2,0,10,0,10]
  ],

  // table 9
  [
    [2,-1,-4,13,-5,-5],
    [0,1,0,16,0,-15],
    [2,0,4,19,-4,-20],
    [2,-1,-4,-5,-5,13],
    [0,1,0,-15,0,16],
    [2,0,4,-20,0,19],
    [0,1,5,-6,6,-5],
    [-1,1,0,-4,14,-10],
    [4,-1,5,17,-5,-15],
    [2,0,-10,-15,5,22],
    [3,2,4,6,4,6]
  ],

  // table 10
  [
    [-1,0,-5,20,-15,-5],
    [0,1,-2,25,-10,-16],
    [2,0,5,29,-5,-27],
    [-1,0,-10,-5,-10,20],
    [0,1,-5,-16,-5,25],
    [2,0,-5,-27,5,29],
    [-1,1,-10,-10,28,-10],
    [2,-1,8,-15,20,-15],
    [2,1,18,17,-15,-20],
    [2,1,-15,-20,18,18],
    [4,2,3,4,3,4]
  ]
];

// Each entry: [name, classFlags, maxAtp, maxMst, maxAta]
// classFlags = the combined bitflag for that class (from newserv class_flags[])
// maxAtp/maxMst/maxAta = GC V3 / BB V4 level-200 caps (from newserv max_stats_v3_v4[])
// Order matches newserv class IDs 0–11.
const CLASS_DEFS = [
  // name          flags                                              ATP   MST   ATA
  ["HUmar",    CF.HUNTER | CF.HUMAN   | CF.MALE,                   1387,  732, 1355],
  ["HUnewearl",CF.HUNTER | CF.NEWMAN,                              1227, 1177, 1388],
  ["HUcast",   CF.HUNTER | CF.ANDROID | CF.MALE,                   1629,    0, 1300],
  ["RAmar",    CF.RANGER | CF.HUMAN   | CF.MALE,                   1255,  665, 1739],
  ["RAcast",   CF.RANGER | CF.ANDROID | CF.MALE,                   1345,    0, 1530],
  ["RAcaseal", CF.RANGER | CF.ANDROID,                             1170,    0, 1580],
  ["FOmarl",   CF.FORCE  | CF.HUMAN,                                869, 1284, 1088],
  ["FOnewm",   CF.FORCE  | CF.NEWMAN  | CF.MALE,                    811, 1500, 1200],
  ["FOnewearl",CF.FORCE  | CF.NEWMAN,                               580, 1750, 1260],
  ["HUcaseal", CF.HUNTER | CF.ANDROID,                             1291,    0, 1500],
  ["FOmar",    CF.FORCE  | CF.HUMAN   | CF.MALE,                    999, 1340, 1010],
  ["RAmarl",   CF.RANGER | CF.HUMAN,                               1140, 1031, 1730],
];

const CLASS_NAMES = CLASS_DEFS.map(c => c[0]);

// Returns array of class names that can equip the item.
// classFlags: raw uint16 from PMT (item's class_flags field).
// atpReq/mstReq/ataReq: weapon stat requirements (pass 0 for armor/shields/mags).
//
// Equip check: (classFlags & classCharFlag) === classCharFlag
// i.e. the item must have ALL bits set that the character's class requires.
function decodeClasses(classFlags, atpReq, mstReq, ataReq) {
  const result = [];
  for (const [name, charFlag, maxAtp, maxMst, maxAta] of CLASS_DEFS) {
    if ((classFlags & charFlag) !== charFlag) continue;
    if (atpReq > maxAtp) continue;
    if (mstReq > maxMst) continue;
    if (ataReq > maxAta) continue;
    result.push(name);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Special-case notes — GC / BB item metadata
// GC name differences from PC/V2: BELRA CANNON (not BERLA), BRINGER'S RIFLE,
// SORCERER'S CANE, FLIGHT FAN, DRILL LAUNCHER, AKIKO'S WOK (not WOK OF AKIKO'S SHOP)
// ---------------------------------------------------------------------------
const WEAPON_NOTES = {
  // Enemy parts → Montague weapon conversion
  "HILDEBEAR'S CANE":   { enemyPart: "Hildebear's Head",      montague: true },
  "HILDEBLUE'S CANE":   { enemyPart: "Hildeblue's Head",      montague: true },
  "P-ARMS'S BLADE":     { enemyPart: "P-arm's Arms",          montague: true },
  "S-BEAT'S BLADE":     { enemyPart: "S-beat's Arms",         montague: true },
  "S-RED'S BLADE":      { enemyPart: "S-red's Arms",          montague: true },
  "BARANZ LAUNCHER":    { enemyPart: "Parts of Baranz",       montague: true },
  "BELRA CANNON":       { enemyPart: "Belra's Right Arm",     montague: true },
  "SORCERER'S CANE":    { enemyPart: "Sorcerer's Right Arm",  montague: true },
  "DELSABER'S BUSTER":  { enemyPart: "Delsaber's Right Arm",  montague: true },
  "BRINGER'S RIFLE":    { enemyPart: "Bringer's Right Arm",   montague: true },
  "DRAGON'S CLAW":      { enemyPart: "Dragon's Claw",         montague: true },
  // Quest rewards
  "EGG BLASTER":        { quest: "Towards the Future", notes: "Very Hard SS-Rank up to 15% weapon percent in two areas as well as hit\nVery Hard S-Rank up to 10% weapon percent in two areas as well as hit" },
  "NEI'S CLAW":         { quest: "Towards the Future", notes: "Very Hard SS-Rank up to 15% weapon percent in two areas as well as hit\nVery Hard S-Rank up to 10% weapon percent in two areas as well as hit" },
  "ANO RIFLE":          { quest: "Towards the Future", notes: "Ultimate min kill SS-Rank up to 15% weapon percent in two areas as well as hit" },
  "PLANTAIN HUGE FAN":  { quest: "Towards the Future", notes: "Ultimate max kill SS-Rank up to 15% weapon percent in two areas as well as hit" },
  "YAMIGARASU":         { quest: "Towards the Future", notes: "Ultimate max kill SS-Rank up to 15% weapon percent in two areas as well as hit" },
  "FLIGHT FAN":         { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "PLANTAIN FAN":       { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "DRILL LAUNCHER":     { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "MASER BEAM":         { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "BROOM":              { badge: "7 Aluminum Badges", notes: "Badges obtained in Mop Up 3 (4 badges) and Endless Nightmare 3 (2 badges)\nTrade badges for item in Towards the Future or Lost Soul Blade" },
  "AKIKO'S WOK":        { badge: "7 Steel Badges",    notes: "Badges obtained in Mop Up 4 (4 badges) and Endless Nightmare 4 (2 badges)\nTrade badges for item in Towards the Future or Lost Soul Blade" },
  "CHAMELEON SCYTHE":   { badge: "3 Gold Badges",     notes: "Badges obtained in Famitsu Maximum Attack 1 Bronze Badge\nTrade 3 Bronze Badges for 1 Silver Badge, 3 Silver Badges for 1 Gold Badge\nTrade badges for item in Famitsu Maximum Attack" },
  "TOY HAMMER":         { badge: "3 Gold Badges",     notes: "Badges obtained in Famitsu Maximum Attack 1 Bronze Badge\nTrade 3 Bronze Badges for 1 Silver Badge, 3 Silver Badges for 1 Gold Badge\nTrade badges for item in Famitsu Maximum Attack" },
  "SAMBA MARACAS":      { badge: "3 Gold Badges",     notes: "Badges obtained in Famitsu Maximum Attack 1 Bronze Badge\nTrade 3 Bronze Badges for 1 Silver Badge, 3 Silver Badges for 1 Gold Badge\nTrade badges for item in Famitsu Maximum Attack" },
  "MARINA'S BAG":       { quest: "Towards the Future", notes: "Male and Female pair on Love Test\nTrade reward (ACCESSORIES) to nurse" },
  "GAME MAGAZNE":       { quest: "Sunset from the Secret Base" },
  "SUPPRESSED GUN":     { quest: "Soul of a Blacksmith", notes: "Trade blue material for item\nOnly once per character so decide if you would rather have SUPPRESSED GUN or GOD HANDS or TECHNICAL CROZIER" },
  "GOD HAND":           { quest: "Soul of a Blacksmith", notes: "Trade blue material for item\nOnly once per character so decide if you would rather have SUPPRESSED GUN or GOD HANDS or TECHNICAL CROZIER" },
  "TECHNICAL CROZIER":  { quest: "Soul of a Blacksmith", notes: "Trade blue material for item\nOnly once per character so decide if you would rather have SUPPRESSED GUN or GOD HANDS or TECHNICAL CROZIER" },
  "CHAIN SAWD":         { quest: "Dawn of E-access" },
  "FLIGHT CUTTER":      { quest: "Dawn of E-access" },
  "STING TIP":          { quest: "Dawn of E-access" },
  "OROTIAGITO":         { quest: "Seek My Master", notes: "Convert AGITO (AUW 1975) into OROTIAGITO at the tekker", altDropName: "AGITO" },
  "HEART OF POUMN":     { quest: "Rappy's Holiday", notes: "Beat 'Gallon's Treachery' perfectly and obtain shiva stone" },
  "STRIKER OF CHAO":    { quest: "Towards the Future", notes: "Convert BRANCH OF PAKUPAKU. Play with a branch in your inventory, step into the sparkly in the hospital, then stand under the waterfall in r1 until the chao starts yammering at you\nDo the same with the STRIKER OF CHAO to convert it back", altDropName: "BRANCH OF PAKUPAKU" },
  "Soul Eater":         { quest: "from the depth", notes: "Obtained after doing the Sue subplot. Don't tell Sue your name." },
  "SONIC KNUCKLE":      { quest: "Tinkerbell's dog 2", notes: "Beat Sonic at Rock Paper Scissors to obtain item\ntrade item in central dome fire swirl for SONIC KNUCKLE" },
  "AKIKO'S FRYING PAN": { quest: "Secret Delivery", notes: "after you get the 'weapons approval'" },
  // S-rank weapons — GC uses plain type names (SABER, SWORD, etc.), not "S-RANK SABER"
  // The PMT has entries for classes 0x70–0x8F; the game displays them as S-RANK <TYPE>
  "SABER":    { challenge: "Obtain S-Rank in Challenge Mode (also a common weapon)" },
  // Unobtainable
  "GULD MILLA":         { unobtainable: true },
  "TSUMIKIRI J-SWORD":  { unobtainable: true },
  "DOUBLE CANNON":      { unobtainable: true },
};

const ARMOR_NOTES = {
  "CHU CHU FEVER": { quest: "Sunset from the Secret Base" },
};

const SHIELD_NOTES = {
  "SHIELD OF DELSABER": { enemyPart: "Delsaber's Left Arm", montague: true },
  "BLUE RING":          { quest: "Towards the Future", notes: "Ultimate min kill SS-Rank" },
  "WHITE RING":         { challenge: "Obtain A-Rank in Challenge Mode" },
  "YELLOW RING":        { challenge: "Obtain B-Rank in Challenge Mode" },
  "RED RING":           { unobtainable: true },
  "SAFETY HEART":       { unobtainable: true },
  // BLACK RING has drop entries in GC (not unobtainable like PC/V2)
};

const MAG_NOTES = {
  "PANZER'S TAIL":  { badge: "7 Bone Badges", notes: "Badges obtained in Mop Up 2 (4 badges) and Endless Nightmare 2 (2 badges)\nTrade badges for item in Towards the Future or Lost Soul Blade" },
  "HAMBURGER":      { quest: "Sunset from the Secret Base" },
  "CHU CHU":        { quest: "Sunset from the Secret Base" },
  "KAPU KAPU":      { quest: "Sunset from the Secret Base" },
  "ANGEL'S WING":   { quest: "Sunset from the Secret Base" },
  "DEVIL'S WING":   { quest: "Sunset from the Secret Base" },
  "MARK3":          { quest: "Central Dome Fire Swirl", notes: "Trade it for \"glory in the past\" which is obtained in the same quest" },
  "MASTER SYSTEM":  { magCombine: "Towards the Future", notes: "Combine MARK 3 with Sound Source FM", altDropName: "Sound Source FM" },
  "GENESIS":        { magCombine: "Towards the Future", notes: "Combine MASTER SYSTEM with Parts of 68000", altDropName: "Parts of 68000" },
  "SEGA SATURN":    { magCombine: "Towards the Future", notes: "Combine GENESIS with SH2", altDropName: "SH2" },
  "DREAMCAST":      { magCombine: "Towards the Future", notes: "Combine SEGA SATURN with SH4, Power VR and Modem", altDropNames: ["SH4", "Power VR", "Modem"] },
  "Soniti":         { magCell: "Cell of MAG 502", notes: "ID Type A (viridia, skyly, purplenum, redria, yellowboze)", altDropName: "Cell of MAG 502" },
  "Pitri":          { magCell: "Cell of MAG 502", notes: "ID Type B (greenill, bluefull, pinkal, oran, whitill)",  altDropName: "Cell of MAG 502" },
  "Churel":         { magCell: "Cell of MAG 213", notes: "ID Type A (viridia, skyly, purplenum, redria, yellowboze)", altDropName: "Cell of MAG 213" },
  "Preta":          { magCell: "Cell of MAG 213", notes: "ID Type B (greenill, bluefull, pinkal, oran, whitill)",  altDropName: "Cell of MAG 213" },
  "ROBOCHAO":       { magCell: "Parts of RoboChao",  altDropName: "Parts of RoboChao" },
  "OPA-OPA":        { magCell: "Heart of Opa Opa",   altDropName: "Heart of Opa Opa" },
  "PIAN":           { magCell: "Heart of Pian",      altDropName: "Heart of Pian" },
  "CHAO":           { magCell: "Heart of Chao",      altDropName: "Heart of Chao" },
  "DAVIL'S TAIL":   { unobtainable: true },
  "ELENOR":         { unobtainable: true },
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TAB_COLUMNS = {
  weapons: [
    { key: "name",    label: "Name",       width: "160px" },
    { key: "classes", label: "Classes",    width: "60px"  },
    { key: "minAtp",  label: "Min ATP",    width: "65px"  },
    { key: "maxAtp",  label: "Max ATP",    width: "65px"  },
    { key: "atpReq",  label: "ATP Req",    width: "60px"  },
    { key: "mstReq",  label: "MST Req",    width: "60px"  },
    { key: "ataReq",  label: "ATA Req",    width: "60px"  },
    { key: "grind",   label: "Grind",      width: "50px"  },
    { key: "photon",  label: "Photon",     width: "55px"  },
    { key: "special", label: "Special",    width: "80px"  },
    { key: "ata",     label: "ATA",        width: "45px"  },
    { key: "stat",    label: "Stat Boost", width: "90px"  },
    { key: "stars",   label: "★",          width: "35px"  },
  ],
  armor: [
    { key: "name",     label: "Name",      width: "160px" },
    { key: "classes",  label: "Classes",   width: "60px"  },
    { key: "baseDfp",  label: "DFP",       width: "50px"  },
    { key: "baseEvp",  label: "EVP",       width: "50px"  },
    { key: "levelReq", label: "Lvl Req",   width: "55px"  },
    { key: "efr",      label: "EFR",       width: "45px"  },
    { key: "eth",      label: "ETH",       width: "45px"  },
    { key: "eic",      label: "EIC",       width: "45px"  },
    { key: "edk",      label: "EDK",       width: "45px"  },
    { key: "elt",      label: "ELT",       width: "45px"  },
    { key: "dfpRange", label: "DFP±",      width: "50px"  },
    { key: "evpRange", label: "EVP±",      width: "50px"  },
    { key: "stars",    label: "★",         width: "35px"  },
  ],
  shields: [
    { key: "name",     label: "Name",      width: "160px" },
    { key: "classes",  label: "Classes",   width: "60px"  },
    { key: "baseDfp",  label: "DFP",       width: "50px"  },
    { key: "baseEvp",  label: "EVP",       width: "50px"  },
    { key: "levelReq", label: "Lvl Req",   width: "55px"  },
    { key: "efr",      label: "EFR",       width: "45px"  },
    { key: "eth",      label: "ETH",       width: "45px"  },
    { key: "eic",      label: "EIC",       width: "45px"  },
    { key: "edk",      label: "EDK",       width: "45px"  },
    { key: "elt",      label: "ELT",       width: "45px"  },
    { key: "dfpRange", label: "DFP±",      width: "50px"  },
    { key: "evpRange", label: "EVP±",      width: "50px"  },
    { key: "stars",    label: "★",         width: "35px"  },
  ],
  units: [
    { key: "name",   label: "Name",      width: "180px" },
    { key: "index",  label: "Index",     width: "55px"  },
    { key: "stat",   label: "Stat",      width: "120px" },
    { key: "amount", label: "Amount",    width: "60px"  },
    { key: "flag",   label: "+/-",       width: "55px"  },
    { key: "stars",  label: "★",         width: "35px"  },
  ],
  mags: [
    { key: "name",       label: "Name",         width: "130px" },
    { key: "type",       label: "Type",         width: "80px"  },
    { key: "blast",      label: "Mag Blast",    width: "110px" },
    { key: "activation", label: "Activ %",      width: "60px"  },
    { key: "pbFill",     label: "PB Fill",      width: "110px" },
    { key: "tenthHp",    label: "1/10 HP",      width: "110px" },
    { key: "death",      label: "Death",        width: "110px" },
    { key: "boss",       label: "Boss",         width: "110px" },
  ],
  drops: [
    { key: "difficulty", label: "Diff",        width: "70px"  },
    { key: "sectionId",  label: "Section ID",  width: "80px"  },
    { key: "monster",    label: "Monster",     width: "130px" },
    { key: "dropRatio",  label: "Drop Rate",   width: "70px"  },
    { key: "dropPct",    label: "Drop %",      width: "65px"  },
    { key: "itemName",   label: "Item",        width: "160px" },
    { key: "area",       label: "Area",        width: "130px" },
  ],
  drops_ep2: [
    { key: "difficulty", label: "Diff",        width: "70px"  },
    { key: "sectionId",  label: "Section ID",  width: "80px"  },
    { key: "monster",    label: "Monster",     width: "130px" },
    { key: "dropRatio",  label: "Drop Rate",   width: "70px"  },
    { key: "dropPct",    label: "Drop %",      width: "65px"  },
    { key: "itemName",   label: "Item",        width: "160px" },
    { key: "area",       label: "Area",        width: "130px" },
  ],
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentTab = "weapons";
let currentVersion = "gc";
let sortCol = null;
let sortDir = 1;
let searchTerm = "";
let classFilter = null;
let sectionFilter = null;

const CLASS_FILTER_TABS = new Set(["weapons", "armor", "shields", "mags"]);
const DROP_TABS = new Set(["drops", "drops_ep2"]);

// ---------------------------------------------------------------------------
// Version loading
// ---------------------------------------------------------------------------
function loadVersion(ver) {
  currentVersion = ver;
  window.PSO_DATA = null;
  showError("Loading data…");

  fetch(`data/${ver}.json`)
    .then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(data => {
      window.PSO_DATA = data;
      renderTab(currentTab);
    })
    .catch(() => showError(`Could not load data/${ver}.json`));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderTab(tab) {
  currentTab = tab;
  sortCol = null;
  sortDir = 1;
  classFilter = null;
  sectionFilter = null;
  clearDetail();
  updateClassFilterBar();
  updateSectionFilterBar();

  const data = window.PSO_DATA;
  if (!data) { showError("No data loaded."); return; }

  const dataKey = tab === "drops_ep2" ? "drops_ep2" : tab;
  renderHeaders(TAB_COLUMNS[tab] ?? []);
  renderRows(data[dataKey] ?? [], TAB_COLUMNS[tab] ?? []);
}

function renderHeaders(columns) {
  const thead = document.getElementById("table-head");
  thead.innerHTML = "";
  const tr = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.label;
    th.dataset.key = col.key;
    if (col.width) th.style.width = col.width;
    th.addEventListener("click", () => sortByColumn(col.key));
    tr.appendChild(th);
  });
  thead.appendChild(tr);
}

function renderRows(rows, columns) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";

  const term = searchTerm.toLowerCase();
  let filtered = term
    ? rows.filter(r => String(r.name ?? "").toLowerCase().includes(term))
    : rows;

  if (classFilter && CLASS_FILTER_TABS.has(currentTab)) {
    filtered = filtered.filter(r => {
      const cf = r.classes ?? r.charClass ?? 0;
      const atpReq = currentTab === "weapons" ? (r.atpReq ?? 0) : 0;
      const mstReq = currentTab === "weapons" ? (r.mstReq ?? 0) : 0;
      const ataReq = currentTab === "weapons" ? (r.ataReq ?? 0) : 0;
      return decodeClasses(cf, atpReq, mstReq, ataReq).includes(classFilter);
    });
  }

  if (sectionFilter !== null && DROP_TABS.has(currentTab)) {
    filtered = filtered.filter(r => r.sectionId === sectionFilter);
  }

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        const numA = parseFloat(av);
        const numB = parseFloat(bv);
        if (!isNaN(numA) && !isNaN(numB)) return (numA - numB) * sortDir;
        return String(av).localeCompare(String(bv)) * sortDir;
      })
    : filtered;

  const fragment = document.createDocumentFragment();
  sorted.forEach(row => {
    const tr = document.createElement("tr");
    if ((row.stars ?? 0) >= 9) tr.classList.add("rare");

    columns.forEach(col => {
      const td = document.createElement("td");
      if (col.key === "sectionId" && DROP_TABS.has(currentTab)) {
        const id = row.sectionId;
        td.textContent = id !== undefined ? sectionIdName(id) : "";
        const color = id !== undefined ? (SECTION_ID_COLORS[id] ?? "") : "";
        if (color) { td.style.color = color; td.style.fontWeight = "bold"; }
      } else {
        td.textContent = row[col.key] ?? "";
      }
      tr.appendChild(td);
    });

    tr.addEventListener("click", () => {
      document.querySelectorAll("#table-body tr.selected").forEach(r => r.classList.remove("selected"));
      tr.classList.add("selected");
      showDetail(currentTab, row);
    });

    fragment.appendChild(tr);
  });
  tbody.appendChild(fragment);
}

function sortByColumn(key) {
  if (sortCol === key) {
    sortDir *= -1;
  } else {
    sortCol = key;
    sortDir = 1;
  }

  const data = window.PSO_DATA;
  if (!data) return;

  document.querySelectorAll("#table-head th").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.key === key) th.classList.add(sortDir === 1 ? "sort-asc" : "sort-desc");
  });

  const dataKey = currentTab === "drops_ep2" ? "drops_ep2" : currentTab;
  renderRows(data[dataKey] ?? [], TAB_COLUMNS[currentTab] ?? []);
}

function showError(msg) {
  document.getElementById("table-body").innerHTML =
    `<tr><td colspan="20" id="loading-msg">${msg}</td></tr>`;
}

// ---------------------------------------------------------------------------
// Section ID helpers
// ---------------------------------------------------------------------------
const SECTION_ID_NAMES = [
  "Viridia","Greenill","Skyly","Bluefull","Purplenum",
  "Pinkal","Redria","Oran","Yellowboze","Whitill",
];
const SECTION_ID_COLORS = [
  "#008000","#32CD32","#87CEEB","#4444ff","#cc66cc",
  "#E9967A","#FF4444","#FF8C00","#FFD700","#A0A0A0",
];
function sectionIdName(id) { return SECTION_ID_NAMES[id] ?? String(id); }

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------
function matchDrops(itemName) {
  const data = window.PSO_DATA;
  if (!data) return [];
  const ep1 = (data.drops ?? []).filter(d => d.itemName === itemName);
  const ep2 = (data.drops_ep2 ?? []).filter(d => d.itemName === itemName);
  return [...ep1, ...ep2];
}

function renderDropRows(drops) {
  if (!drops.length) return "";
  return drops.map(d => {
    const monsterStr = d.monster ? d.monster.trim() : "";
    const source = monsterStr && monsterStr !== " " && monsterStr !== "0x00"
      ? monsterStr
      : (d.area ?? "") + " box";
    const idName  = d.sectionId !== undefined ? sectionIdName(d.sectionId) : "";
    const idColor = d.sectionId !== undefined ? (SECTION_ID_COLORS[d.sectionId] ?? "") : "";
    const idStyle = idColor ? ` style="color:${idColor};font-weight:bold"` : "";
    return `<div class="detail-drop-row">
      <span>${d.difficulty ?? ""}</span>
      <span${idStyle}>${idName}</span>
      <span>${source}</span>
      <span>${d.dropRatio ?? ""}</span>
    </div>`;
  }).join("");
}

function showDetail(tab, row) {
  const placeholder = document.getElementById("detail-placeholder");
  const content     = document.getElementById("detail-content");
  placeholder.classList.add("hidden");
  content.classList.remove("hidden");

  const parts = [];
  parts.push(`<h3>${escHtml(row.name ?? "")}</h3>`);

  if (tab !== "drops") {
    let classes = [];
    if (tab === "weapons") {
      classes = decodeClasses(row.classes ?? 0, row.atpReq ?? 0, row.mstReq ?? 0, row.ataReq ?? 0);
    } else if (tab === "armor" || tab === "shields" || tab === "mags") {
      classes = decodeClasses(row.classes ?? row.charClass ?? 0, 0, 0, 0);
    }
    if (classes.length) {
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Classes</div>
        <div class="detail-classes">${classes.map(c => `<span class="detail-class-tag">${c}</span>`).join("")}</div>
      </div>`);
    }
  }

  if (row.desc) {
    parts.push(`<div class="detail-section">
      <div class="detail-section-title">Description</div>
      <div class="detail-description">${escHtml(row.desc)}</div>
    </div>`);
  }

  if (tab === "units") {
    parts.push(`<div class="detail-section">
      <div class="detail-section-title">Notes</div>
      <div>Master/Ability gives 1 ATA<br>Hero/Ability gives 1 ATA<br>God/Ability gives 2 ATA</div>
    </div>`);
  }

  const ownDrops = matchDrops(row.name ?? "");
  if (ownDrops.length) {
    parts.push(`<div class="detail-section">
      <div class="detail-section-title">Drop Information</div>
      ${renderDropRows(ownDrops)}
    </div>`);
  }

  // Special case notes
  const noteMap = tab === "weapons" ? WEAPON_NOTES
    : tab === "armor"   ? ARMOR_NOTES
    : tab === "shields" ? SHIELD_NOTES
    : tab === "mags"    ? MAG_NOTES
    : null;

  const note = noteMap ? noteMap[row.name ?? ""] : null;

  if (note) {
    if (note.unobtainable) {
      parts.push(`<div class="detail-section">
        <div class="detail-unobtainable">*** Unobtainable ***</div>
      </div>`);
    }

    if (note.enemyPart) {
      const epDrops = matchDrops(note.enemyPart);
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Enemy Part</div>
        <div>${escHtml(note.enemyPart)}</div>
        ${epDrops.length ? `<div class="detail-section-title" style="margin-top:0.4rem">Drop Information</div>${renderDropRows(epDrops)}` : ""}
        ${note.montague ? `<div class="detail-note" style="margin-top:0.35rem">To convert to a weapon unlock Dr. Montague in offline quests and bring item to him in Today's Rate</div>` : ""}
      </div>`);
    }

    if (note.quest) {
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Quest Reward</div>
        <div>${escHtml(note.quest)}</div>
      </div>`);
    }

    if (note.badge) {
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Quest Badge Reward</div>
        <div>${escHtml(note.badge)}</div>
      </div>`);
    }

    if (note.challenge) {
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Challenge Reward</div>
        <div>${escHtml(note.challenge)}</div>
      </div>`);
    }

    if (note.magCombine) {
      const altDrops = note.altDropName ? matchDrops(note.altDropName) : [];
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Mag Parts Combine in Quest</div>
        <div>${escHtml(note.magCombine)}</div>
        ${note.notes ? `<div class="detail-note" style="margin-top:0.35rem">${escHtml(note.notes)}</div>` : ""}
        ${altDrops.length ? `<div class="detail-section-title" style="margin-top:0.4rem">Drop Information</div>${renderDropRows(altDrops)}` : ""}
      </div>`);
    } else if (note.magCell) {
      const altDrops = note.altDropName ? matchDrops(note.altDropName) : [];
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Mag Cell</div>
        <div>${escHtml(note.magCell)}</div>
        ${note.notes ? `<div class="detail-note" style="margin-top:0.35rem">${escHtml(note.notes)}</div>` : ""}
        ${altDrops.length ? `<div class="detail-section-title" style="margin-top:0.4rem">Drop Information</div>${renderDropRows(altDrops)}` : ""}
      </div>`);
    } else if (note.altDropName && !note.magCombine && !note.magCell) {
      const altDrops = matchDrops(note.altDropName);
      if (altDrops.length) {
        parts.push(`<div class="detail-section">
          <div class="detail-section-title">Drop Information (${escHtml(note.altDropName)})</div>
          ${renderDropRows(altDrops)}
        </div>`);
      }
    }

    if (note.altDropNames) {
      note.altDropNames.forEach(name => {
        const altDrops = matchDrops(name);
        if (altDrops.length) {
          parts.push(`<div class="detail-section">
            <div class="detail-section-title">Drop Information (${escHtml(name)})</div>
            ${renderDropRows(altDrops)}
          </div>`);
        }
      });
    }

    if (note.notes && !note.magCombine && !note.magCell) {
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Notes</div>
        <div class="detail-note">${escHtml(note.notes).replace(/\n/g, "<br>")}</div>
      </div>`);
    }
  }

  content.innerHTML = parts.join("");
}

function clearDetail() {
  document.getElementById("detail-placeholder").classList.remove("hidden");
  document.getElementById("detail-content").classList.add("hidden");
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Filter bars
// ---------------------------------------------------------------------------
function updateClassFilterBar() {
  const bar = document.getElementById("class-filter-bar");
  if (CLASS_FILTER_TABS.has(currentTab)) {
    bar.classList.remove("hidden");
  } else {
    bar.classList.add("hidden");
  }
  bar.querySelectorAll(".class-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.cls === classFilter);
  });
}

function updateSectionFilterBar() {
  const bar = document.getElementById("section-filter-bar");
  if (DROP_TABS.has(currentTab)) {
    bar.classList.remove("hidden");
  } else {
    bar.classList.add("hidden");
  }
  bar.querySelectorAll(".section-btn").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.sid) === sectionFilter);
  });
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------
document.querySelectorAll(".ver-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".ver-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadVersion(btn.dataset.ver);
  });
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTab(btn.dataset.tab);
  });
});

document.getElementById("search-box").addEventListener("input", e => {
  searchTerm = e.target.value;
  if (window.PSO_DATA) {
    const dataKey = currentTab === "drops_ep2" ? "drops_ep2" : currentTab;
    renderRows(window.PSO_DATA[dataKey] ?? [], TAB_COLUMNS[currentTab] ?? []);
  }
});

document.getElementById("class-filter-bar").querySelectorAll(".class-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    classFilter = classFilter === btn.dataset.cls ? null : btn.dataset.cls;
    updateClassFilterBar();
    if (window.PSO_DATA) {
      const dataKey = currentTab === "drops_ep2" ? "drops_ep2" : currentTab;
      renderRows(window.PSO_DATA[dataKey] ?? [], TAB_COLUMNS[currentTab] ?? []);
    }
  });
});

document.getElementById("section-filter-bar").querySelectorAll(".section-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const sid = Number(btn.dataset.sid);
    sectionFilter = sectionFilter === sid ? null : sid;
    updateSectionFilterBar();
    if (window.PSO_DATA) {
      const dataKey = currentTab === "drops_ep2" ? "drops_ep2" : currentTab;
      renderRows(window.PSO_DATA[dataKey] ?? [], TAB_COLUMNS[currentTab] ?? []);
    }
  });
});

// ---------------------------------------------------------------------------
// Initial load
// ---------------------------------------------------------------------------
loadVersion(currentVersion);
