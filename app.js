/* =============================================================================
   PSO v2 Item Database — main application logic

   Data flow (current):
     version button click → loadVersion(ver) → fetch data/[ver].js (sets window.PSO_DATA)
     → renderTab(currentTab)

   WASM data flow (future stub — see handleFileUpload):
     file input change → handleFileUpload(file) → read ArrayBuffer
     → PSO_WASM.parsePSOData(buffer) → same render path
   ============================================================================= */

"use strict";

// ---------------------------------------------------------------------------
// Priority bitflag — mirrors Form1.cs Priority enum
// ---------------------------------------------------------------------------
const PRIORITY = { Hunter: 1, Ranger: 2, Force: 4, Human: 8, Android: 16, Newman: 32, Male: 64, Female: 128 };

function hasFlag(val, flag) { return (val & flag) === flag; }

// Returns array of class names that can equip the item.
// For weapons, pass the stat requirements so HUcast/etc. are filtered by max stats.
// For armor/shields/mags, pass atpReq=0, mstReq=0, ataReq=0 (no stat filtering).
function decodeClasses(classByte, atpReq, mstReq, ataReq) {
  const v = classByte;
  const classes = [];
  if (hasFlag(v, PRIORITY.Hunter) && hasFlag(v, PRIORITY.Android) && hasFlag(v, PRIORITY.Male))
    if (atpReq <= 1611 && mstReq <= 0 && ataReq <= 181) classes.push("HUcast");
  if (hasFlag(v, PRIORITY.Hunter) && hasFlag(v, PRIORITY.Human) && hasFlag(v, PRIORITY.Male))
    if (atpReq <= 1401 && mstReq <= 713 && ataReq <= 161) classes.push("HUmar");
  if (hasFlag(v, PRIORITY.Hunter) && hasFlag(v, PRIORITY.Newman) && hasFlag(v, PRIORITY.Female))
    if (atpReq <= 1150 && mstReq <= 986 && ataReq <= 164) classes.push("HUnewearl");
  if (hasFlag(v, PRIORITY.Ranger) && hasFlag(v, PRIORITY.Android) && hasFlag(v, PRIORITY.Male))
    if (atpReq <= 1267 && mstReq <= 222 && ataReq <= 222) classes.push("RAcast");
  if (hasFlag(v, PRIORITY.Ranger) && hasFlag(v, PRIORITY.Android) && hasFlag(v, PRIORITY.Female))
    if (atpReq <= 1214 && mstReq <= 0 && ataReq <= 230) classes.push("RAcaseal");
  if (hasFlag(v, PRIORITY.Ranger) && hasFlag(v, PRIORITY.Human) && hasFlag(v, PRIORITY.Male))
    if (atpReq <= 1037 && mstReq <= 756 && ataReq <= 210) classes.push("RAmar");
  if (hasFlag(v, PRIORITY.Force) && hasFlag(v, PRIORITY.Human) && hasFlag(v, PRIORITY.Female))
    if (atpReq <= 865 && mstReq <= 1274 && ataReq <= 158) classes.push("FOmarl");
  if (hasFlag(v, PRIORITY.Force) && hasFlag(v, PRIORITY.Newman) && hasFlag(v, PRIORITY.Male))
    if (atpReq <= 735 && mstReq <= 1421 && ataReq <= 141) classes.push("FOnewm");
  if (hasFlag(v, PRIORITY.Force) && hasFlag(v, PRIORITY.Newman) && hasFlag(v, PRIORITY.Female))
    if (atpReq <= 579 && mstReq <= 1607 && ataReq <= 148) classes.push("FOnewearl");
  return classes;
}

// ---------------------------------------------------------------------------
// Special-case notes — mirrors the switch blocks in the C# selection handlers
// Format: { quest?, badge?, challenge?, enemyPart?, altDropName?, unobtainable?, notes? }
// ---------------------------------------------------------------------------
const WEAPON_NOTES = {
  "HILDEBEAR'S CANE":    { enemyPart: "Hildebear's Head",     montague: true },
  "HILDEBLUE'S CANE":   { enemyPart: "Hildeblue's Head",     montague: true },
  "P-ARMS'S BLADE":     { enemyPart: "P-arm's Arms",         montague: true },
  "S-BEAT'S BLADE":     { enemyPart: "S-beat's Arms",        montague: true },
  "S-RED'S BLADE":      { enemyPart: "S-red's Arms",         montague: true },
  "BARANZ LAUNCHER":    { enemyPart: "Parts of Baranz",      montague: true },
  "BERLA CANNON":       { enemyPart: "Belra's Right Arm",    montague: true },
  "C-SORCERER'S CANE":  { enemyPart: "Sorcerer's Right Arm", montague: true },
  "DELSABER'S BUSTER":  { enemyPart: "Delsaber's Right Arm", montague: true },
  "C-BRINGER'S RIFLE":  { enemyPart: "C-bringer's Right Arm",montague: true },
  "DRAGON'S CLAW":      { enemyPart: "Dragon's Claw",        montague: true },
  "EGG BLASTER":        { quest: "Towards the Future", notes: "Very Hard SS-Rank up to 15% weapon percent in two areas as well as hit\nVery Hard S-Rank up to 10% weapon percent in two areas as well as hit" },
  "NEI'S CLAW":         { quest: "Towards the Future", notes: "Very Hard SS-Rank up to 15% weapon percent in two areas as well as hit\nVery Hard S-Rank up to 10% weapon percent in two areas as well as hit" },
  "ANO RIFLE":          { quest: "Towards the Future", notes: "Ultimate min kill SS-Rank up to 15% weapon percent in two areas as well as hit" },
  "PLANTAIN HUGE FAN":  { quest: "Towards the Future", notes: "Ultimate max kill SS-Rank up to 15% weapon percent in two areas as well as hit" },
  "YAMIGARASU":         { quest: "Towards the Future", notes: "Ultimate max kill SS-Rank up to 15% weapon percent in two areas as well as hit" },
  "FLIGH FAN":          { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "PLANTAIN FAN":       { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "DRILL LOUNCHER":     { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "MASER BEAM":         { quest: "Towards the Future", notes: "Ultimate SS-Rank up to 15% weapon percent in two areas as well as hit\nUltimate S-Rank up to 10% weapon percent in two areas as well as hit" },
  "BROOM":              { badge: "7 Aluminum Badges", notes: "Badges obtained in Mop Up 3 (4 badges) and Endless Nightmare 3 (2 badges)\nTrade badges for item in Towards the Future or Lost Soul Blade" },
  "WOK OF AKIKO'S SHOP":{ badge: "7 Steel Badges",    notes: "Badges obtained in Mop Up 4 (4 badges) and Endless Nightmare 4 (2 badges)\nTrade badges for item in Towards the Future or Lost Soul Blade" },
  "CHAMELEON SCYTHE":   { badge: "3 Gold Badges",     notes: "Badges obtained in Famitsu Maximum Attack 1 Bronze Badge\nTrade 3 Bronze Badges for 1 Silver Badge, 3 Silver Badges for 1 Gold Badge\nTrade badges for item in Famitsu Maximum Attack" },
  "TOY HAMMER":         { badge: "3 Gold Badges",     notes: "Badges obtained in Famitsu Maximum Attack 1 Bronze Badge\nTrade 3 Bronze Badges for 1 Silver Badge, 3 Silver Badges for 1 Gold Badge\nTrade badges for item in Famitsu Maximum Attack" },
  "SAMBA MARACAS":      { badge: "3 Gold Badges",     notes: "Badges obtained in Famitsu Maximum Attack 1 Bronze Badge\nTrade 3 Bronze Badges for 1 Silver Badge, 3 Silver Badges for 1 Gold Badge\nTrade badges for item in Famitsu Maximum Attack" },
  "MARINA'S BAG":       { quest: "Towards the Future", notes: "Male and Female pair on Love Test\nTrade reward (ACCESSORIES) to nurse" },
  "GAME MAGAZNE":       { quest: "Sunset from the Secret Base" },
  "SUPPRESSED GUN":     { quest: "Soul of a Blacksmith", notes: "Trade blue material for item\nOnly once per character so decide if you would rather have SUPPRESSED GUN or GOD HANDS or TECHNICAL CROIZER" },
  "GOD HAND":           { quest: "Soul of a Blacksmith", notes: "Trade blue material for item\nOnly once per character so decide if you would rather have SUPPRESSED GUN or GOD HANDS or TECHNICAL CROIZER" },
  "TECHNICAL CROZIER":  { quest: "Soul of a Blacksmith", notes: "Trade blue material for item\nOnly once per character so decide if you would rather have SUPPRESSED GUN or GOD HANDS or TECHNICAL CROIZER" },
  "CHAIN SAWD":         { quest: "Dawn of E-access" },
  "FLAME VISIT":        { quest: "Dawn of E-access" },
  "STING TIP":          { quest: "Dawn of E-access" },
  "OROTIAGITO":         { quest: "Seek My Master", notes: "Convert AGITO (AUW 1975) into OROTIAGITO at the tekker", altDropName: "AGITO (AUW 1975)" },
  "S-RANK SABER":       { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK SWORD":       { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK BLADE":       { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK PARTISAN":    { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK SLICER":      { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK GUN":         { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK RIFLE":       { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK MECHGUN":     { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK SHOT":        { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK CANE":        { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK ROD":         { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK WAND":        { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK TWIN":        { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK CLAW":        { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK BAZOOKA":     { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK NEEDLE":      { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK SCYTHE":      { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK HAMMER":      { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK MOON":        { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK PSYCHOGUN":   { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK PUNCH":       { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK WINDMILL":    { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK HARISEN":     { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK J-BLADE":     { challenge: "Obtain S-Rank in Challenge Mode" },
  "S-RANK J-CUTTER":    { challenge: "Obtain S-Rank in Challenge Mode" },
  "HEART OF POUMN":     { quest: "Rappy's Holiday", notes: "Beat 'Gallon's Treachery' perfectly and obtain shiva stone" },
  "STIRKER OF CHAO":    { quest: "Towards the Future", notes: "Convert BRANCH OF PAKUPAKU. Play with a branch in your inventory, step into the sparkly in the hospital, then stand under the waterfall in r1 until the chao starts yammering at you\nDo the same with the STIRKER OF CHAO to convert it back", altDropName: "BRANCH OF PAKUPAKU" },
  "Soul Eater":         { quest: "from the depth", notes: "Obtained after doing the Sue subplot. Don't tell Sue your name." },
  "SONIC KNUCKLE":      { quest: "Tinkerbell's dog 2", notes: "Beat Sonic at Rock Paper Scissors to obtain item\ntrade item in central dome fire swirl for SONIC KNUCKLE" },
  "AKIKO'S FRYING PAN": { quest: "Secret Delivery", notes: "after you get the 'weapons approval'" },
  "GULD MILLA":         { unobtainable: true },
  "TSUMIKIRI J-SWORD":  { unobtainable: true },
  "DOUBLE CANNON":      { unobtainable: true },
  "AGITO (AUW 1975)": { notes:"This was patched in V2 to be a 1/137,659,209 drop for Very Hard Skyly from a Booma instead of 1/311, official v1 copies are 1/311. Some copies of v1 are patched" },
};

const ARMOR_NOTES = {
  "CHU CHU FEVER": { quest: "Sunset from the Secret Base" },
};

const SHIELD_NOTES = {
  "SHIELD OF DELSABER": { enemyPart: "Delsabre's Left Arm", montague: true, altDropName: "Delsaber's Left Arm"},
  "BLUE RING":          { quest: "Towards the Future", notes: "Ultimate min kill SS-Rank" },
  "WHITE RING":         { challenge: "Obtain A-Rank in Challenge Mode" },
  "YELLOW RING":        { challenge: "Obtain B-Rank in Challenge Mode" },
  "RED RING":           { unobtainable: true },
  "BLACK RING":         { unobtainable: true },
  "RIKO'S GLASSES":     { unobtainable: true },
  "RIKO'S EARRING":     { unobtainable: true },
  "SAFETY HEART":       { unobtainable: true },
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
  "DREAMCAST":      { magCombine: "Towards the Future", notes: "Combine SEGA SATURN with SH4, Power VR and Modem", altDropNames: ["SH4","Power VR","Modem"] },
  "Soniti":         { magCell: "Cell of MAG 502", notes: "ID Type A (viridia, skyly, purplenum, redria, yellowboze)", altDropName: "Cell of MAG 502" },
  "Pitri":          { magCell: "Cell of MAG 502", notes: "ID Type B (greenill, bluefull, pinkal, oran, whitill)",  altDropName: "Cell of MAG 502" },
  "Churel":         { magCell: "Cell of MAG 203", notes: "ID Type A (viridia, skyly, purplenum, redria, yellowboze)", altDropName: "Cell of MAG 502" },
  "Preta":          { magCell: "Cell of MAG 203", notes: "ID Type B (greenill, bluefull, pinkal, oran, whitill)",  altDropName: "Cell of MAG 502" },
  "ROBOCHAO":       { magCell: "Parts of RoboChao",  altDropName: "Parts of RoboChao" },
  "OPA-OPA":        { magCell: "Heart of Opa Opa",   altDropName: "Heart of Opa Opa" },
  "PIAN":           { magCell: "Heart of Pian",      altDropName: "Heart of Pian" },
  "CHAO":           { magCell: "Heart of Chao",      altDropName: "Heart of Chao" },
  "DAVIL'S TAIL":   { unobtainable: true },
  "ELENOR":         { unobtainable: true },
};

// ---------------------------------------------------------------------------
// Tab definitions — columns for each section
// Add or reorder columns here; the renderer picks them up automatically.
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
    { key: "area",       label: "Area",        width: "70px"  },
  ],
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentTab = "weapons";
let currentVersion = "v2";
let sortCol = null;
let sortDir = 1; // 1 = asc, -1 = desc
let searchTerm = "";
let classFilter = null;   // null = all, or one of the CLASS_NAMES strings
let sectionFilter = null; // null = all, or numeric index 0–9

const CLASS_NAMES = ["HUcast","HUmar","HUnewearl","RAcast","RAcaseal","RAmar","FOmarl","FOnewm","FOnewearl"];

// Tabs where class filtering applies (items have a classes/charClass bitflag)
const CLASS_FILTER_TABS = new Set(["weapons","armor","shields","mags"]);

// Mag name colour overrides — matches Form1.cs colouring logic
const MAG_GREEN = new Set(["Soniti","Churel","Preta","Pitri"]);
const MAG_GOLD  = new Set(["PIAN","OPA-OPA","CHAO","ROBOCHAO"]);

// ---------------------------------------------------------------------------
// Version loading
// Both v1 and v2 are fetched in parallel so the detail panel can show
// cross-version drop info without a visible delay.
// ---------------------------------------------------------------------------
const ALL_DATA = {};  // { v1: {...}, v2: {...} }

function fetchVersion(v) {
  if (ALL_DATA[v]) return Promise.resolve(ALL_DATA[v]);
  return fetch(`data/${v}.json`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => { ALL_DATA[v] = d; return d; });
}

function loadVersion(ver) {
  currentVersion = ver;
  window.PSO_DATA = null;
  showError("Loading data…");

  // Fetch both versions in parallel; render as soon as the requested one is ready.
  // When the other version finishes, refresh the open detail panel if one is selected.
  const other = ver === "v1" ? "v2" : "v1";
  fetchVersion(other).then(() => {
    const sel = document.querySelector("#table-body tr.selected");
    if (sel) sel.click();
  }).catch(() => {});

  fetchVersion(ver)
    .then(data => {
      window.PSO_DATA = data;
      renderTab(currentTab);
    })
    .catch(() => showError(`Could not load data/${ver}.json`));
}

// ---------------------------------------------------------------------------
// WASM STUB: File upload handler
//
// To activate this path:
//   1. Build pso_parser.c/cpp with Emscripten:
//        emcc pso_parser.c -o wasm/pso_parser.js \
//          -s EXPORTED_FUNCTIONS='["_parsePSOData"]' \
//          -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
//          -s ALLOW_MEMORY_GROWTH=1
//   2. In index.html, unhide #wasm-upload and add the <script> tag for
//      wasm/pso_parser.js.
//   3. Remove the "return;" line below and implement the ccall/cwrap
//      bridge to pass the ArrayBuffer to the WASM function.
//   4. PSO_WASM.parsePSOData should return an object with the same shape
//      as window.PSO_DATA set by the JSON data files so the render path
//      is unchanged.
// ---------------------------------------------------------------------------
function handleFileUpload(file) {
  return; // STUB — remove this line when WASM is ready

  /* WASM implementation goes here:

  const statusEl = document.getElementById("wasm-status");
  statusEl.textContent = "Parsing…";

  file.arrayBuffer().then(buffer => {
    const bytes = new Uint8Array(buffer);

    // Pass bytes to WASM parser — adjust ccall signature to match your exports
    const result = Module.ccall(
      "parsePSOData",
      "string",          // return type (JSON string or direct object)
      ["array", "number"],
      [bytes, bytes.length]
    );

    window.PSO_DATA = JSON.parse(result);
    statusEl.textContent = "Loaded: " + file.name;
    renderTab(currentTab);
  }).catch(err => {
    statusEl.textContent = "Error: " + err.message;
  });
  */
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
  if (!data) {
    showError("No data loaded.");
    return;
  }

  const rows = data[tab] ?? [];
  const columns = TAB_COLUMNS[tab] ?? [];

  renderHeaders(columns);
  renderRows(rows, columns);
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
      const cb = r.classes ?? r.charClass ?? 0;
      const atpReq = r.atpReq ?? 0;
      const mstReq = r.mstReq ?? 0;
      const ataReq = r.ataReq ?? 0;
      const classes = currentTab === "weapons"
        ? decodeClasses(cb, atpReq, mstReq, ataReq)
        : decodeClasses(cb, 0, 0, 0);
      return classes.includes(classFilter);
    });
  }

  if (sectionFilter !== null && currentTab === "drops") {
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
    if (row.srank)                                                          tr.classList.add("rare-srank");
    else if (MAG_GREEN.has(row.name))                                       tr.classList.add("rare-mag-green");
    else if (MAG_GOLD.has(row.name))                                        tr.classList.add("rare-mag-gold");
    else if (row.version === 2)                                             tr.classList.add("rare-v2");
    else if ((row.stars ?? 0) >= 9)                                        tr.classList.add("rare-v1");

    columns.forEach(col => {
      const td = document.createElement("td");
      if (col.key === "sectionId" && currentTab === "drops") {
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

  const rows = data[currentTab] ?? [];
  const columns = TAB_COLUMNS[currentTab] ?? [];

  // Update header sort indicators
  document.querySelectorAll("#table-head th").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.key === key) {
      th.classList.add(sortDir === 1 ? "sort-asc" : "sort-desc");
    }
  });

  renderRows(rows, columns);
}

function showError(msg) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = `<tr><td colspan="20" id="loading-msg">${msg}</td></tr>`;
}

// ---------------------------------------------------------------------------
// Mag feed tables — transcribed from Class1.cs magfarm constructor
// Each entry: [def, pow, dex, mind, synch, iq]
// ---------------------------------------------------------------------------
const FEED_ITEMS = ["Monomate","Dimate","Trimate","Monofluid","Difluid","Trifluid","Antidote","Antiparalysis","Sol Atomizer","Moon Atomizer","Star Atomizer"];
const FEED_TABLES = [
  // table 0
  [[5,40,5,0,3,2],[10,45,5,0,3,2],[15,50,10,0,4,3],[5,0,5,40,3,2],[10,0,5,45,3,2],[15,0,10,50,4,3],[5,10,40,0,3,2],[5,0,40,10,3,2],[15,30,15,25,1,3],[15,25,15,30,1,3],[25,25,25,25,5,5]],
  // table 1
  [[5,10,0,0,0,0],[5,15,3,0,1,1],[8,20,6,-5,2,2],[5,0,0,10,0,0],[5,0,3,15,1,1],[8,-5,6,20,2,2],[0,5,14,0,1,0],[0,0,14,5,0,1],[9,9,8,0,2,-2],[9,0,8,9,-2,2],[14,14,14,14,3,3]],
  // table 2
  [[0,9,0,-5,-1,0],[4,13,0,-10,0,1],[6,16,4,-15,1,2],[0,-5,0,9,-1,0],[4,-10,0,13,0,1],[6,-15,4,16,2,1],[-5,4,11,-5,1,-1],[-5,-5,11,4,0,0],[0,11,5,-5,-2,2],[5,-5,0,11,1,-1],[6,8,6,8,2,2]],
  // table 3
  [[0,4,0,0,-1,0],[5,7,0,-5,0,1],[4,14,4,-10,1,2],[0,0,0,4,0,0],[5,-5,0,7,1,0],[4,-10,4,14,2,1],[0,0,5,0,3,-3],[-5,-5,20,-5,0,2],[-10,8,5,8,-2,2],[7,6,-8,6,2,-2],[7,7,7,7,2,2]],
  // table 4
  [[-5,9,-5,0,-1,1],[0,11,0,-10,0,1],[3,14,0,-15,1,0],[-5,0,-5,9,-1,1],[0,-10,0,11,0,1],[3,-15,0,14,1,0],[-5,-5,15,-5,-1,1],[6,-3,0,-3,3,-2],[5,21,-5,-20,-2,3],[-5,-20,5,21,0,2],[5,5,5,5,2,2]],
  // table 5
  [[-4,13,-5,-5,-1,1],[0,16,0,-15,1,0],[3,19,0,-20,0,1],[-4,-5,-5,13,-1,1],[0,-15,0,16,1,0],[3,-20,0,19,0,1],[5,-6,6,-5,1,0],[0,-4,14,-10,1,-1],[4,17,-5,-15,-1,3],[-10,-15,5,21,0,1],[4,6,4,6,2,2]],
  // table 6
  [[-3,9,-3,-4,1,-1],[0,11,0,-10,0,1],[3,14,0,-15,0,1],[-3,9,-3,-4,1,1],[0,-10,0,11,0,1],[3,-15,0,14,0,1],[0,6,9,-15,-1,1],[0,-15,9,6,3,-2],[9,-20,-5,17,-1,2],[-3,17,7,-20,2,0],[0,10,0,10,2,2]],
  // table 7
  [[-5,20,-15,-5,0,-1],[0,25,-10,-16,1,0],[5,29,-5,-27,0,1],[-10,-5,-10,20,0,-1],[-5,-16,-5,25,1,0],[-5,-27,5,29,0,1],[-10,-10,28,-10,1,-1],[8,-15,20,-15,-1,1],[18,18,-15,-20,1,1],[-15,-20,18,18,1,1],[3,4,3,4,2,3]],
];

function renderFeedTable(tableIndex) {
  const t = FEED_TABLES[tableIndex];
  if (!t) return "";
  const header = `<div class="feed-header"><span></span><span>DEF</span><span>POW</span><span>DEX</span><span>MIND</span><span>SYNCH</span><span>IQ</span></div>`;
  const rows = FEED_ITEMS.map((name, i) => {
    const [def, pow, dex, mind, synch, iq] = t[i];
    return `<div class="feed-row"><span>${name}</span><span>${def}</span><span>${pow}</span><span>${dex}</span><span>${mind}</span><span>${synch}</span><span>${iq}</span></div>`;
  }).join("");
  return `<div class="feed-table">${header}${rows}</div>`;
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------
function matchDrops(itemName, data) {
  data = data ?? window.PSO_DATA;
  if (!data) return [];
  return (data.drops ?? []).filter(d => d.itemName === itemName);
}

function otherVersion() {
  return currentVersion === "v1" ? "v2" : "v1";
}

function otherVersionLabel() {
  return currentVersion === "v1" ? "Version 2" : "Version 1";
}

function renderDropRows(drops) {
  if (!drops.length) return "";
  return drops.map(d => {
    const source = d.monster && d.monster.trim() && d.monster.trim() !== " "
      ? d.monster
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

const SECTION_ID_NAMES = [
  "Viridia","Greenill","Skyly","Bluefull","Purplenum",
  "Pinkal","Redria","Oran","Yellowboze","Whitill"
];

const SECTION_ID_COLORS = [
  "#008000",  // Viridia    — Color.Green
  "#32CD32",  // Greenill   — Color.LimeGreen
  "#87CEEB",  // Skyly      — Color.SkyBlue
  "#4444ff",  // Bluefull   — Color.Blue (brightened for dark bg)
  "#cc66cc",  // Purplenum  — Color.Purple (brightened for dark bg)
  "#E9967A",  // Pinkal     — Color.DarkSalmon
  "#FF4444",  // Redria     — Color.Red (brightened for dark bg)
  "#FF8C00",  // Oran       — Color.DarkOrange
  "#FFD700",  // Yellowboze — Color.Gold
  "#A0A0A0",  // Whitill    — Color.Gray (brightened for dark bg)
];

function sectionIdName(id) {
  return SECTION_ID_NAMES[id] ?? String(id);
}

function showDetail(tab, row) {
  const placeholder = document.getElementById("detail-placeholder");
  const content     = document.getElementById("detail-content");

  placeholder.classList.add("hidden");
  content.classList.remove("hidden");

  const parts = [];

  // Item name heading — colour matches the row highlight
  let nameColor = "";
  if (row.srank)                  nameColor = "#f07898";
  else if (MAG_GREEN.has(row.name)) nameColor = "#4caf78";
  else if (MAG_GOLD.has(row.name))  nameColor = "#f0c040";
  else if (row.version === 2)       nameColor = "#e8895a";
  else if ((row.stars ?? 0) >= 9)   nameColor = "#f0c040";
  const nameStyle = nameColor ? ` style="color:${nameColor}"` : "";
  parts.push(`<h3${nameStyle}>${escHtml(row.name ?? "")}</h3>`);

  // Classes
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

  // Description
  if (row.desc) {
    parts.push(`<div class="detail-section">
      <div class="detail-section-title">Description</div>
      <div class="detail-description">${escHtml(row.desc)}</div>
    </div>`);
  }

  // Units tab: static note about Ability units
  if (tab === "units") {
    parts.push(`<div class="detail-section">
      <div class="detail-section-title">Notes</div>
      <div>Master/Ability gives 1 ATA<br>Hero/Ability gives 1 ATA<br>God/Ability gives 2 ATA</div>
    </div>`);
  }

  // Feed table (mags only)
  if (tab === "mags" && row.feedTable !== undefined) {
    const ft = renderFeedTable(row.feedTable);
    if (ft) {
      parts.push(`<div class="detail-section">
        <div class="detail-section-title">Feed Table ${row.feedTable}</div>
        ${ft}
      </div>`);
    }
  }

  // Drop information for the item itself (current version)
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

  // Cross-version drop information — only when checkbox is ticked
  if (tab !== "drops" && document.getElementById("show-other-ver")?.checked) {
    const otherData = ALL_DATA[otherVersion()];
    if (otherData) {
      const otherDrops = matchDrops(row.name ?? "", otherData);
      if (otherDrops.length) {
        parts.push(`<div class="detail-section">
          <div class="detail-section-title">Drop Information (${otherVersionLabel()})</div>
          ${renderDropRows(otherDrops)}
        </div>`);
      }
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
// Class filter bar
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

// ---------------------------------------------------------------------------
// Section ID filter bar
// ---------------------------------------------------------------------------
function updateSectionFilterBar() {
  const bar = document.getElementById("section-filter-bar");
  if (currentTab === "drops") {
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
    renderRows(window.PSO_DATA[currentTab] ?? [], TAB_COLUMNS[currentTab] ?? []);
  }
});

document.getElementById("class-filter-bar").querySelectorAll(".class-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    classFilter = classFilter === btn.dataset.cls ? null : btn.dataset.cls;
    updateClassFilterBar();
    if (window.PSO_DATA) {
      renderRows(window.PSO_DATA[currentTab] ?? [], TAB_COLUMNS[currentTab] ?? []);
    }
  });
});

document.getElementById("section-filter-bar").querySelectorAll(".section-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const sid = Number(btn.dataset.sid);
    sectionFilter = sectionFilter === sid ? null : sid;
    updateSectionFilterBar();
    if (window.PSO_DATA) {
      renderRows(window.PSO_DATA[currentTab] ?? [], TAB_COLUMNS[currentTab] ?? []);
    }
  });
});

// File upload input — wired up but no-op until WASM stub is implemented
document.getElementById("data-file")?.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) handleFileUpload(file);
});

// ---------------------------------------------------------------------------
// Initial load
// ---------------------------------------------------------------------------
loadVersion(currentVersion);
