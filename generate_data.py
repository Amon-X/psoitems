#!/usr/bin/env python3
"""
Extract item data from Form1.cs and generate web/data/v1.js and web/data/v2.js
Run from the web/ directory: python3 generate_data.py
"""

import re, os, json

SRC = os.path.join(os.path.dirname(__file__),
                   "..", "Psov2 Items", "Form1.cs")


def parse_dictionary(cs_text):
    """Extract dictionary.Add("key", "value") entries from Form1.cs.
    Handles escaped quotes (\\") inside the value string."""
    result = {}
    # Match C# string literals that may contain \" escapes
    for m in re.finditer(r'dictionary\.Add\("([^"]+)",\s*"((?:[^"\\]|\\.)*)"\)', cs_text):
        key = m.group(1)
        val = m.group(2).replace('\\"', '"')
        result[key] = val
    return result

# ---------------------------------------------------------------------------
# Lookup tables (copied from Form1.cs)
# ---------------------------------------------------------------------------

SPECIAL = {
    "0":"","1":"Draw","2":"Drain","3":"Fill","4":"Gush","5":"Heart",
    "6":"Mind","7":"Soul","8":"Geist","9":"Master's","10":"Lord's",
    "11":"King's","12":"Charge","13":"Spirit","14":"Berserk","15":"Ice",
    "16":"Frost","17":"Freeze","18":"Blizzard","19":"Bind","20":"Hold",
    "21":"Seize","22":"Arrest","23":"Heat","24":"Fire","25":"Flame",
    "26":"Burning","27":"Shock","28":"Thunder","29":"Storm","30":"Tempest",
    "31":"Dim","32":"Shadow","33":"Dark","34":"Hell","35":"Panic",
    "36":"Riot","37":"Havoc","38":"Chaos","39":"Devil's","40":"Demon's",
}

STAT = {
    "0":"","1":"15 mst","2":"5 lck","3":"10 evp","4":"5 lck","5":"10 hp",
    "6":"-15 evp","7":"10 dfp","8":"10 mst","9":"15 dfp","10":"5 evp",
    "11":"10 lck","12":"-30 evp","13":"10 lck","14":"20 dfp","15":"20 mst",
    "16":"15 evp","17":"5 all","18":"10 all","19":"-20 evp","20":"10 all",
    "21":"30 mst","22":"15 ata","23":"20 ata","24":"15 atp","25":"35 atp",
    "26":"10 atp","27":"-5 evp","28":"-10 evp","29":"-10 ata","30":"35 mst",
    "31":"40 mst","32":"45 mst","33":"50 mst","34":"55 mst","35":"30 dfp",
    "36":"35 mst","37":"15 all","38":"20 all",
}

UNIT_STAT = {
    "0":"ATP","1":"MST","2":"ATA","3":"EVP","4":"HP","5":"TP",
    "6":"DFP","7":"LCK","8":"Ability","9":"EFR","10":"EIC",
    "11":"ETH","12":"ELT","13":"EDK","14":"All Resist",
    "15":"Current HP over time","16":"Current TP over time",
    "17":"Fills PB over time","18":"Technique Levels",
    "19":"Attack Speed","20":"Status Cure","21":"Makes all traps visible",
}

UNIT_FLAG = {"0": "reduces", "1": "+", "2": "++"}

MAG_BLAST = {
    "0":"Farlla","1":"Estlla","2":"Golla","3":"Pilla",
    "4":"Leilla","5":"Mylla & Youlla","255":"",
}

MAG_ACTION = {"4":"Shifta/Deband","6":"Resta","8":"Invulnerability","7":"Reverser","0":""}

MAG_TYPE = {"0":"Mag","1":"Lv10 evo","2":"Lv35 evo","3":"Lv35 evo","4":"Special"}

DIFF = {"0":"Normal","1":"Hard","2":"Very Hard","3":"Ultimate"}

AREA = {
    "1":"Forest 1","2":"Forest 2","3":"Cave 1","4":"Cave 2","5":"Cave 3",
    "6":"Mine 1","7":"Mine 2","8":"Ruins 1","9":"Ruins 2","10":"Ruins 3",
    "-1":"",
}

# Monster hex code → (normal name, ultimate name)
# Matches the foreach post-processing loop in Form1.cs (~line 2094)
MONSTER = {
    "0x00": ("",              ""),
    "0x01": ("Hildebear",     "Hildelt"),
    "0x02": ("Hildeblue",     "Hildetorr"),
    "0x03": ("Mothmant",      "Mothvert"),
    "0x04": ("Monest",        "Mothvist"),
    "0x05": ("Rag Rappy",     "El Rappy"),
    "0x06": ("Al Rappy",      "Pal Rappy"),
    "0x07": ("Savage Wolf",   "Gulgus"),
    "0x08": ("Barbarous Wolf","Gulgus-gue"),
    "0x09": ("Booma",         "Bartle"),
    "0x0a": ("Gobooma",       "Barble"),
    "0x0b": ("Gigobooma",     "Tollaw"),
    "0x0c": ("Grass Assassin","Crimson Assassin"),
    "0x0d": ("Poison Lily",   "Ob Lily"),
    "0x0e": ("Nar Lily",      "Mil Lily"),
    "0x0f": ("Nano Dragon",   "Nano Dragon"),
    "0x10": ("Evil Shark",    "Vulmer"),
    "0x11": ("Pal Shark",     "Govulmer"),
    "0x12": ("Guil Shark",    "Melqueek"),
    "0x13": ("Pouifully Slime","Pouifully Slime"),
    "0x14": ("Pouilly Slime", "Pouilly Slime"),
    "0x15": ("Pan Arms",      "Pan Arms"),
    "0x16": ("Migium",        "Migium"),
    "0x17": ("Hidoom",        "Hidoom"),
    "0x18": ("Dubchic",       "Dubchich"),
    "0x19": ("Garanz",        "Baranz"),
    "0x1a": ("Sinow Beat",    "Sinow Blue"),
    "0x1b": ("Sinow Gold",    "Sinow Red"),
    "0x1c": ("Canadine",      "Canabin"),
    "0x1d": ("Canane",        "Canune"),
    "0x1e": ("Delsaber",      "Delsaber"),
    "0x1f": ("Chaos Sorcerer","Gran Sorcerer"),
    "0x22": ("Dark Gunner",   "Dark Gunner"),
    "0x23": ("Death Gunner",  "Death Gunner"),
    "0x24": ("Chaos Bringer", "Dark Bringer"),
    "0x25": ("Dark Belra",    "Indi Belra"),
    "0x26": ("Claw",          "Claw"),
    "0x27": ("Bulc",          "Bulc"),
    "0x28": ("Bulclaw",       "Bulclaw"),
    "0x29": ("Dimenian",      "Arlan"),
    "0x2a": ("La Dimenian",   "Merlan"),
    "0x2b": ("So Dimenian",   "Del-D"),
    "0x2c": ("Dragon",        "Sil Dragon"),
    "0x2d": ("De Rol Le",     "Dal Ral Lie"),
    "0x2e": ("VOL OPT",       "VOL OPT ver.2"),
    "0x2f": ("Dark Falz",     "Dark Falz"),
    "0x32": ("Gilchic",       "Gillchich"),
}

# ---------------------------------------------------------------------------
# Parser helpers
# ---------------------------------------------------------------------------

def extract_method(cs_text, name):
    """Return the body of the named method by finding its start then the next method header."""
    start_patterns = [
        f'private void {name}()',
        f'public void {name}()',
        f'private void {name}(',
        f'public void {name}(',
    ]
    start = -1
    for pat in start_patterns:
        idx = cs_text.find(pat)
        if idx != -1:
            start = idx
            break
    if start == -1:
        print(f"WARNING: method {name} not found")
        return ""
    # Find next method declaration after start
    next_m = re.search(r'\n        (?:private|public) (?:void|static|partial)', cs_text[start + 10:])
    end = start + 10 + next_m.start() if next_m else len(cs_text)
    return cs_text[start:end]


def parse_rows(cs_text, method_name):
    body = extract_method(cs_text, method_name)
    rows = []
    for match in re.finditer(r'Rows\.Add\(([^;]+)\)', body):
        args_str = match.group(1)
        args = [a.strip().strip('"') for a in re.split(r',\s*(?=")', args_str)]
        rows.append(args)
    return rows


def parse_rows_from_view(cs_text, method_name, view_name):
    """Extract Rows.Add calls only for a specific DataGridView within a method."""
    body = extract_method(cs_text, method_name)
    rows = []
    for match in re.finditer(rf'{re.escape(view_name)}\.Rows\.Add\(([^;]+)\)', body):
        args_str = match.group(1)
        args = [a.strip().strip('"') for a in re.split(r',\s*(?=")', args_str)]
        rows.append(args)
    return rows


# ---------------------------------------------------------------------------
# Version helpers
# ---------------------------------------------------------------------------

def weapon_version(index):
    return 1 if int(index) < 214 else 2


def armor_version(index):
    idx = int(index)
    if idx < 395:        return 1
    elif idx < 407:      return 2
    elif 424 < idx <= 445: return 1
    else:                return 2


def shield_version(index):
    return 1 if int(index) <= 445 else 2


# ---------------------------------------------------------------------------
# Row builders
# ---------------------------------------------------------------------------

def make_weapon(row, desc=""):
    # cols: name classes minAtp maxAtp atpReq mstReq ataReq grind photon special ata stat index stars
    name, classes, minAtp, maxAtp, atpReq, mstReq, ataReq, grind, photon, special, ata, stat, index, stars = row[:14]
    d = {
        "name":    name,
        "classes": int(classes),
        "minAtp":  int(minAtp),
        "maxAtp":  int(maxAtp),
        "atpReq":  int(atpReq),
        "mstReq":  int(mstReq),
        "ataReq":  int(ataReq),
        "grind":   int(grind),
        "photon":  int(photon),
        "special": SPECIAL.get(special, special),
        "ata":     int(ata),
        "stat":    STAT.get(stat, stat),
        "stars":   int(stars),
        "version": weapon_version(index),
    }
    if desc:
        d["desc"] = desc
    return d


def make_armor(row, desc=""):
    # cols: name baseDfp baseEvp classes levelReq efr eth eic edk elt dfpRange evpRange index stars stat
    name, baseDfp, baseEvp, classes, levelReq, efr, eth, eic, edk, elt, dfpRange, evpRange, index, stars, stat = row[:15]
    d = {
        "name":      name,
        "classes":   int(classes),
        "baseDfp":   int(baseDfp),
        "baseEvp":   int(baseEvp),
        "levelReq":  int(levelReq),
        "efr":       int(efr),
        "eth":       int(eth),
        "eic":       int(eic),
        "edk":       int(edk),
        "elt":       int(elt),
        "dfpRange":  int(dfpRange),
        "evpRange":  int(evpRange),
        "stars":     int(stars),
        "stat":      STAT.get(stat, stat),
        "version":   armor_version(index),
    }
    if desc:
        d["desc"] = desc
    return d


def make_shield(row, desc=""):
    name, baseDfp, baseEvp, classes, levelReq, efr, eth, eic, edk, elt, dfpRange, evpRange, index, stars, stat = row[:15]
    d = {
        "name":      name,
        "classes":   int(classes),
        "baseDfp":   int(baseDfp),
        "baseEvp":   int(baseEvp),
        "levelReq":  int(levelReq),
        "efr":       int(efr),
        "eth":       int(eth),
        "eic":       int(eic),
        "edk":       int(edk),
        "elt":       int(elt),
        "dfpRange":  int(dfpRange),
        "evpRange":  int(evpRange),
        "stars":     int(stars),
        "stat":      STAT.get(stat, stat),
        "version":   shield_version(index),
    }
    if desc:
        d["desc"] = desc
    return d


def make_unit(row, desc=""):
    # cols: name index stat amount flag stars
    name, index, stat, amount, flag, stars = row[:6]
    d = {
        "name":   name,
        "index":  int(index),
        "stat":   UNIT_STAT.get(stat, stat),
        "amount": int(amount),
        "flag":   UNIT_FLAG.get(flag, flag),
        "stars":  int(stars),
    }
    if desc:
        d["desc"] = desc
    return d


def make_mag(row, desc=""):
    # cols: name id feed blast activation pbfill tenthHp death boss
    #        pbfillflag tenthHpflag deathflag bossflag class type version
    name      = row[0]
    mag_id    = int(row[1])
    feed      = int(row[2])
    blast     = MAG_BLAST.get(row[3], row[3])
    activ     = int(row[4])
    pbfill    = MAG_ACTION.get(row[5], row[5])
    tenth_hp  = MAG_ACTION.get(row[6], row[6])
    death     = MAG_ACTION.get(row[7], row[7])
    boss      = MAG_ACTION.get(row[8], row[8])
    mag_class = int(row[13]) if len(row) > 13 else 255
    mag_type  = MAG_TYPE.get(row[14], row[14]) if len(row) > 14 else ""
    ver       = int(row[15]) if len(row) > 15 else 1
    d = {
        "name":       name,
        "id":         mag_id,
        "feedTable":  feed,
        "blast":      blast,
        "activation": activ,
        "pbFill":     pbfill,
        "tenthHp":    tenth_hp,
        "death":      death,
        "boss":       boss,
        "charClass":  mag_class,
        "type":       mag_type,
        "version":    ver,
    }
    if desc:
        d["desc"] = desc
    return d


def make_drop(row):
    # cols: diff sectionId monster monster2 dropRate dropPct dropRatio itemName area
    diff, sid, monster, monster2, drop_rate, drop_pct, drop_ratio, item_name, area = row[:9]
    resolved_diff = DIFF.get(diff, diff)
    is_ult = resolved_diff == "Ultimate"
    monster_names = MONSTER.get(monster.lower(), None)
    if monster_names is not None:
        resolved_monster = monster_names[1] if is_ult else monster_names[0]
    else:
        resolved_monster = monster
    return {
        "difficulty": resolved_diff,
        "sectionId":  int(sid, 16) if sid.startswith("0x") else int(sid),
        "monster":    resolved_monster,
        "dropRate":   drop_rate,
        "dropPct":    drop_pct,
        "dropRatio":  drop_ratio,
        "itemName":   item_name,
        "area":       AREA.get(area, area),
    }


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def write_js(path, data):
    # Write as plain JSON so the browser can fetch it reliably
    json_str = json.dumps(data, indent=2, ensure_ascii=False)
    json_path = path.replace(".js", ".json")
    with open(json_path, "w", encoding="utf-8") as f:
        f.write(json_str)
    print(f"Wrote {json_path}")


def main():
    with open(SRC, encoding="utf-8") as f:
        cs = f.read()

    desc_map = parse_dictionary(cs)

    weapons = [make_weapon(r, desc_map.get(r[0], "")) for r in parse_rows(cs, "loadWeapoms")]
    armors  = [make_armor(r,  desc_map.get(r[0], "")) for r in parse_rows(cs, "loadArmors")]
    shields = [make_shield(r, desc_map.get(r[0], "")) for r in parse_rows(cs, "loadShields")]

    # Mags and units live inside loadDropsV2 (alongside the v2 drop data).
    # Filter to rows where col[1] is numeric (the active format has a numeric id;
    # the commented-out old format used text blast names in col[1]).
    mag_rows = [r for r in parse_rows_from_view(cs, "loadDropsV2", "dataGridView4")
                if len(r) > 1 and r[1].lstrip('-').isdigit()]
    mags  = [make_mag(r,  desc_map.get(r[0], "")) for r in mag_rows]
    units = [make_unit(r, desc_map.get(r[0], "")) for r in parse_rows_from_view(cs, "loadDropsV2", "dataGridView5")]

    # Drop tables: dataGridView6 has the sectionId column
    drops_v1 = []
    drops_v2 = []
    for method, target in [("loadDropsV1", drops_v1), ("loadDropsV2", drops_v2)]:
        for row in parse_rows_from_view(cs, method, "dataGridView6"):
            if len(row) >= 9:
                try:
                    target.append(make_drop(row))
                except Exception as e:
                    print(f"  skip drop row {row}: {e}")

    # Build per-version data sets
    for ver, ver_num, drops in [("v1", 1, drops_v1), ("v2", 2, drops_v2)]:
        if ver_num == 2:
            ver_weapons = weapons
            ver_armor   = armors
            ver_shields = shields
            ver_mags    = mags
        else:
            ver_weapons = [w for w in weapons if w["version"] == 1]
            ver_armor   = [a for a in armors  if a["version"] == 1]
            ver_shields = [s for s in shields if s["version"] == 1]
            ver_mags    = [m for m in mags    if m["version"] == 1]

        data = {
            "weapons": ver_weapons,
            "armor":   ver_armor,
            "shields": ver_shields,
            "units":   units,
            "mags":    ver_mags,
            "drops":   drops,
        }
        out = os.path.join(os.path.dirname(__file__), "data", f"{ver}.js")
        write_js(out, data)

    print(f"  weapons: {len(weapons)} ({sum(1 for w in weapons if w['version']==1)} v1, {sum(1 for w in weapons if w['version']==2)} v2)")
    print(f"  armors:  {len(armors)} ({sum(1 for a in armors if a['version']==1)} v1, {sum(1 for a in armors if a['version']==2)} v2)")
    print(f"  shields: {len(shields)} ({sum(1 for s in shields if s['version']==1)} v1, {sum(1 for s in shields if s['version']==2)} v2)")
    print(f"  units:   {len(units)}")
    print(f"  mags:    {len(mags)} ({sum(1 for m in mags if m['version']==1)} v1, {sum(1 for m in mags if m['version']==2)} v2)")
    print(f"  drops:   {len(drops_v1)} v1, {len(drops_v2)} v2")


if __name__ == "__main__":
    main()
