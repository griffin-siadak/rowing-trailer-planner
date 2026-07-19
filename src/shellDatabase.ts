export interface ShellRecord {
  id: number;
  manufacturer: string;
  modelName: string;
  boatClass: string;
  category: string;
  lengthM: number;
  widthM: number | null;
  hullWeightKg: number | null;
  crewMinKg: number | null;
  crewMaxKg: number | null;
  material: string;
  notes: string;
  dataConfidence: string;
}

// Parsed from rowing_shells_export.csv — manufacturer_spec rows only (historical_reference excluded)
export const SHELL_DB: ShellRecord[] = [
  // ── Filippi ──────────────────────────────────────────────────────────────────
  // Source: official Filippi Formtabelle 2020 (mould table via ruderwerkstatt.de) —
  // length ü.A. (LOA), größte Breite (max beam), Mannschaftsgewicht (crew kg range).
  // Hull weights: FISA class minimums (all Filippi boats built to minimum weight).
  // Singles
  { id:5,   manufacturer:"Filippi", modelName:"F44 (1x)", boatClass:"1x", category:"racing", lengthM:7.40, widthM:0.260, hullWeightKg:14, crewMinKg:50,  crewMaxKg:60,  material:"Carbon/Kevlar/honeycomb", notes:"Flyweight women's hull, banana-shaped keel. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:3,   manufacturer:"Filippi", modelName:"F15 (1x)", boatClass:"1x", category:"racing", lengthM:7.77, widthM:0.280, hullWeightKg:14, crewMinKg:65,  crewMaxKg:75,  material:"Carbon/Kevlar/honeycomb", notes:"Lightweight hull, U cross-section similar to F45. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:6,   manufacturer:"Filippi", modelName:"F45 (1x)", boatClass:"1x", category:"racing", lengthM:7.86, widthM:0.280, hullWeightKg:14, crewMinKg:70,  crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Banana keel line, longer bow for powerful rowers. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:7,   manufacturer:"Filippi", modelName:"F07 (1x)", boatClass:"1x", category:"racing", lengthM:7.96, widthM:0.295, hullWeightKg:14, crewMinKg:70,  crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"U-shaped, flatter, more forgiving hull. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:4,   manufacturer:"Filippi", modelName:"F22 (1x)", boatClass:"1x", category:"racing", lengthM:8.00, widthM:0.290, hullWeightKg:14, crewMinKg:75,  crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Round cross-section, popular U23 boat. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:296, manufacturer:"Filippi", modelName:"F50 (1x)", boatClass:"1x", category:"racing", lengthM:8.04, widthM:0.270, hullWeightKg:14, crewMinKg:65,  crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Wide crew-range hull. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:1,   manufacturer:"Filippi", modelName:"F01 (1x)", boatClass:"1x", category:"racing", lengthM:8.10, widthM:0.266, hullWeightKg:14, crewMinKg:85,  crewMaxKg:95,  material:"Carbon/Kevlar/honeycomb/aluminium", notes:"Heavyweight hull, straight bottom line. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:2,   manufacturer:"Filippi", modelName:"F14 (1x)", boatClass:"1x", category:"racing", lengthM:8.33, widthM:0.290, hullWeightKg:14, crewMinKg:85,  crewMaxKg:100, material:"Carbon/Kevlar/titanium/honeycomb", notes:"Top-range heavyweight hull, U cross-section. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:297, manufacturer:"Filippi", modelName:"F47 (1x)", boatClass:"1x", category:"racing", lengthM:8.33, widthM:0.286, hullWeightKg:14, crewMinKg:90,  crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:298, manufacturer:"Filippi", modelName:"F39 (1x)", boatClass:"1x", category:"racing", lengthM:8.44, widthM:0.295, hullWeightKg:14, crewMinKg:95,  crewMaxKg:110, material:"Carbon/Kevlar/honeycomb", notes:"Super-heavyweight single. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  // Doubles / pairs (shared moulds)
  { id:8,   manufacturer:"Filippi", modelName:"F13 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.40,  widthM:0.330, hullWeightKg:27, crewMinKg:65, crewMaxKg:75,  material:"Carbon/Kevlar/honeycomb", notes:"Lightweight double/pair. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:299, manufacturer:"Filippi", modelName:"F46 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.56,  widthM:0.340, hullWeightKg:27, crewMinKg:75, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:300, manufacturer:"Filippi", modelName:"F30 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.60,  widthM:0.362, hullWeightKg:27, crewMinKg:75, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:301, manufacturer:"Filippi", modelName:"F36 (2x)",    boatClass:"2x",    category:"racing", lengthM:9.00,  widthM:0.420, hullWeightKg:27, crewMinKg:50, crewMaxKg:65,  material:"Carbon/Kevlar/honeycomb", notes:"Junior/flyweight double, extra beam for stability. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:302, manufacturer:"Filippi", modelName:"F17 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:10.00, widthM:0.372, hullWeightKg:27, crewMinKg:85, crewMaxKg:105, material:"Carbon/Kevlar/honeycomb", notes:"Heavyweight double/pair. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:165, manufacturer:"Filippi", modelName:"F24 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:10.01, widthM:0.385, hullWeightKg:27, crewMinKg:85, crewMaxKg:105, material:"Carbon/Kevlar/titanium/honeycomb", notes:"Top-range heavyweight double/pair. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:303, manufacturer:"Filippi", modelName:"F51 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:10.14, widthM:0.397, hullWeightKg:27, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Newest heavyweight double/pair mould. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:166, manufacturer:"Filippi", modelName:"F12 (2+)",    boatClass:"2+",    category:"racing", lengthM:10.10, widthM:0.400, hullWeightKg:32, crewMinKg:80, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Coxed pair. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  // Quads / coxless fours (shared moulds)
  { id:167, manufacturer:"Filippi", modelName:"F11 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:11.78, widthM:0.403, hullWeightKg:50, crewMinKg:55, crewMaxKg:75,  material:"Carbon/Kevlar/honeycomb", notes:"Lightweight quad/four. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:304, manufacturer:"Filippi", modelName:"F43 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:11.78, widthM:0.403, hullWeightKg:50, crewMinKg:60, crewMaxKg:75,  material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:305, manufacturer:"Filippi", modelName:"F34 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:11.70, widthM:0.480, hullWeightKg:50, crewMinKg:60, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Wide stable hull, also available as 4+. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:306, manufacturer:"Filippi", modelName:"F52 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:11.89, widthM:0.422, hullWeightKg:50, crewMinKg:70, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:307, manufacturer:"Filippi", modelName:"F31 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:12.10, widthM:0.443, hullWeightKg:50, crewMinKg:70, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:169, manufacturer:"Filippi", modelName:"F28 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:12.66, widthM:0.435, hullWeightKg:50, crewMinKg:75, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:168, manufacturer:"Filippi", modelName:"F38 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:12.80, widthM:0.447, hullWeightKg:50, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Heavyweight quad/four. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:308, manufacturer:"Filippi", modelName:"F25 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:12.72, widthM:0.438, hullWeightKg:50, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/titanium/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:309, manufacturer:"Filippi", modelName:"F40 (4x/4-)", boatClass:"4x/4-", category:"racing", lengthM:12.72, widthM:0.438, hullWeightKg:50, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:310, manufacturer:"Filippi", modelName:"F19 (4x/4-/4+)", boatClass:"4x/4-", category:"racing", lengthM:12.81, widthM:0.444, hullWeightKg:50, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Also offered coxed (4+). Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:311, manufacturer:"Filippi", modelName:"F20 (4-)",    boatClass:"4-",    category:"racing", lengthM:12.86, widthM:0.480, hullWeightKg:50, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Longest four mould. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:170, manufacturer:"Filippi", modelName:"F19 (4+)",    boatClass:"4+",    category:"racing", lengthM:12.81, widthM:0.444, hullWeightKg:51, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Coxed four on the F19 mould. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:312, manufacturer:"Filippi", modelName:"F34 (4+)",    boatClass:"4+",    category:"racing", lengthM:11.70, widthM:0.480, hullWeightKg:51, crewMinKg:60, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Coxed four on the wide F34 mould. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  // Eights
  { id:313, manufacturer:"Filippi", modelName:"F09 (8+)", boatClass:"8+", category:"racing", lengthM:16.50, widthM:0.580, hullWeightKg:96, crewMinKg:60, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Lightweight eight. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:314, manufacturer:"Filippi", modelName:"F42 (8+)", boatClass:"8+", category:"racing", lengthM:16.80, widthM:0.590, hullWeightKg:96, crewMinKg:60, crewMaxKg:85,  material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:315, manufacturer:"Filippi", modelName:"F49 (8+)", boatClass:"8+", category:"racing", lengthM:17.44, widthM:0.544, hullWeightKg:96, crewMinKg:85, crewMaxKg:100, material:"Carbon/Kevlar/honeycomb", notes:"Narrow-beam heavyweight eight. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:172, manufacturer:"Filippi", modelName:"F41 (8+)", boatClass:"8+", category:"racing", lengthM:17.63, widthM:0.600, hullWeightKg:96, crewMinKg:85, crewMaxKg:105, material:"Carbon/Kevlar/honeycomb", notes:"Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:171, manufacturer:"Filippi", modelName:"F29 (8+)", boatClass:"8+", category:"racing", lengthM:17.72, widthM:0.600, hullWeightKg:96, crewMinKg:85, crewMaxKg:105, material:"Carbon/Kevlar/titanium/honeycomb/aluminium", notes:"Flagship heavyweight eight. Formtabelle 2020.", dataConfidence:"manufacturer_spec" },
  { id:9,  manufacturer:"WinTech Racing",             modelName:"Filter SLW 55 (1x)",                       boatClass:"1x",                    category:"racing",       lengthM:6.965, widthM:null,  hullWeightKg:14,   crewMinKg:50,  crewMaxKg:60,  material:"Carbon (Cobra/Competitor)", notes:"~14kg across grades.", dataConfidence:"manufacturer_spec" },
  { id:10, manufacturer:"WinTech Racing",             modelName:"Filter LW 70 (1x)",                        boatClass:"1x",                    category:"racing",       lengthM:7.90,  widthM:null,  hullWeightKg:14,   crewMinKg:60,  crewMaxKg:75,  material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:11, manufacturer:"WinTech Racing",             modelName:"Filter MW 80 (1x)",                        boatClass:"1x",                    category:"racing",       lengthM:7.905, widthM:null,  hullWeightKg:14,   crewMinKg:75,  crewMaxKg:85,  material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:12, manufacturer:"WinTech Racing",             modelName:"Filter HW 95 (1x)",                        boatClass:"1x",                    category:"racing",       lengthM:8.12,  widthM:null,  hullWeightKg:14,   crewMinKg:85,  crewMaxKg:105, material:"Carbon (Cobra/Competitor)", notes:"Competitor grade ~17kg.", dataConfidence:"manufacturer_spec" },
  { id:13, manufacturer:"WinTech Racing",             modelName:"Filter SHW 110 (1x)",                      boatClass:"1x",                    category:"racing",       lengthM:8.33,  widthM:null,  hullWeightKg:14,   crewMinKg:105, crewMaxKg:120, material:"Carbon (Cobra/Competitor)", notes:"Competitor grade ~17kg.", dataConfidence:"manufacturer_spec" },
  { id:14, manufacturer:"WinTech Racing",             modelName:"FLX LW 70 (1x)",                           boatClass:"1x",                    category:"racing",       lengthM:7.277, widthM:null,  hullWeightKg:14,   crewMinKg:60,  crewMaxKg:75,  material:"Carbon (Cobra SE/International)", notes:"FLX = shorter/flatter alternate hull line.", dataConfidence:"manufacturer_spec" },
  { id:15, manufacturer:"WinTech Racing",             modelName:"FLX HW 95 (1x)",                           boatClass:"1x",                    category:"racing",       lengthM:7.90,  widthM:null,  hullWeightKg:14,   crewMinKg:85,  crewMaxKg:105, material:"Carbon (Cobra SE/International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:16, manufacturer:"WinTech Racing",             modelName:"Filter SLW 55 (2x/-)",                     boatClass:"2x/2-",                 category:"racing",       lengthM:9.03,  widthM:null,  hullWeightKg:27,   crewMinKg:50,  crewMaxKg:60,  material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:17, manufacturer:"WinTech Racing",             modelName:"Filter LW 70 (2x/-)",                      boatClass:"2x/2-",                 category:"racing",       lengthM:9.40,  widthM:null,  hullWeightKg:27,   crewMinKg:60,  crewMaxKg:80,  material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:18, manufacturer:"WinTech Racing",             modelName:"Filter MW 85 (2x/-)",                      boatClass:"2x/2-",                 category:"racing",       lengthM:9.575, widthM:null,  hullWeightKg:27,   crewMinKg:80,  crewMaxKg:90,  material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:19, manufacturer:"WinTech Racing",             modelName:"Filter HW 95 (2x/-)",                      boatClass:"2x/2-",                 category:"racing",       lengthM:9.87,  widthM:null,  hullWeightKg:27,   crewMinKg:90,  crewMaxKg:105, material:"Carbon (Cobra/Competitor)", notes:"Competitor grade ~32kg.", dataConfidence:"manufacturer_spec" },
  { id:20, manufacturer:"WinTech Racing",             modelName:"FLX SLW 55 (2x)",                          boatClass:"2x",                    category:"racing",       lengthM:8.70,  widthM:null,  hullWeightKg:27,   crewMinKg:50,  crewMaxKg:60,  material:"Carbon (Cobra SE/International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:21, manufacturer:"WinTech Racing",             modelName:"FLX HW 95 (2x/2-)",                        boatClass:"2x/2-",                 category:"racing",       lengthM:9.60,  widthM:null,  hullWeightKg:27,   crewMinKg:85,  crewMaxKg:105, material:"Carbon (Cobra SE/International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:22, manufacturer:"WinTech Racing",             modelName:"Filter SLW 55 (4x/-)",                     boatClass:"4x/4-",                 category:"racing",       lengthM:11.016,widthM:null,  hullWeightKg:50.5, crewMinKg:50,  crewMaxKg:60,  material:"Carbon (Cobra/Competitor)", notes:"Hull weight 50-52kg (Cobra/Comp), 56.5-59kg (Competitor 4x).", dataConfidence:"manufacturer_spec" },
  { id:23, manufacturer:"WinTech Racing",             modelName:"Filter LW 70 (4x/-)",                      boatClass:"4x/4-",                 category:"racing",       lengthM:11.82, widthM:null,  hullWeightKg:50.5, crewMinKg:60,  crewMaxKg:80,  material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:24, manufacturer:"WinTech Racing",             modelName:"Filter MW 85 (4x/-)",                      boatClass:"4x/4-",                 category:"racing",       lengthM:12.275,widthM:null,  hullWeightKg:50.5, crewMinKg:80,  crewMaxKg:90,  material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:25, manufacturer:"WinTech Racing",             modelName:"Filter HW 95 (4x/-)",                      boatClass:"4x/4-",                 category:"racing",       lengthM:12.77, widthM:null,  hullWeightKg:50.5, crewMinKg:90,  crewMaxKg:105, material:"Carbon (Cobra/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:26, manufacturer:"WinTech Racing",             modelName:"Filter (Short) HW 95 (4x/-)",              boatClass:"4x/4-",                 category:"racing",       lengthM:11.95, widthM:null,  hullWeightKg:50.5, crewMinKg:90,  crewMaxKg:105, material:"Carbon (Cobra/Competitor)", notes:"Shortened HW hull variant.", dataConfidence:"manufacturer_spec" },
  { id:27, manufacturer:"WinTech Racing",             modelName:"Filter SLW 60 (4+)",                       boatClass:"4+",                    category:"racing",       lengthM:11.81, widthM:null,  hullWeightKg:51,   crewMinKg:55,  crewMaxKg:65,  material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:28, manufacturer:"WinTech Racing",             modelName:"Filter LW 70 (4+)",                        boatClass:"4+",                    category:"racing",       lengthM:12.275,widthM:null,  hullWeightKg:51,   crewMinKg:65,  crewMaxKg:80,  material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:29, manufacturer:"WinTech Racing",             modelName:"Filter MW 80 (4+)",                        boatClass:"4+",                    category:"racing",       lengthM:12.77, widthM:null,  hullWeightKg:51,   crewMinKg:75,  crewMaxKg:90,  material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:30, manufacturer:"WinTech Racing",             modelName:"Filter HW 95 (4+)",                        boatClass:"4+",                    category:"racing",       lengthM:12.77, widthM:null,  hullWeightKg:51,   crewMinKg:90,  crewMaxKg:105, material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:31, manufacturer:"WinTech Racing",             modelName:"Filter Convertible Stern-Coxed LW 70 (4+)",boatClass:"4+",                    category:"racing",       lengthM:12.71, widthM:null,  hullWeightKg:51,   crewMinKg:60,  crewMaxKg:80,  material:"Carbon (International/Competitor)", notes:"Convertible stern-coxed 4+.", dataConfidence:"manufacturer_spec" },
  { id:32, manufacturer:"WinTech Racing",             modelName:"Filter Convertible Stern-Coxed HW 95 (4+)",boatClass:"4+",                    category:"racing",       lengthM:13.40, widthM:null,  hullWeightKg:51,   crewMinKg:90,  crewMaxKg:105, material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:33, manufacturer:"WinTech Racing",             modelName:"Filter Stern-Coxed SLW 60 (4+)",           boatClass:"4+",                    category:"racing",       lengthM:11.82, widthM:null,  hullWeightKg:51,   crewMinKg:55,  crewMaxKg:65,  material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:34, manufacturer:"WinTech Racing",             modelName:"Filter Stern-Coxed LW 70 (4+)",            boatClass:"4+",                    category:"racing",       lengthM:12.275,widthM:null,  hullWeightKg:51,   crewMinKg:65,  crewMaxKg:80,  material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:35, manufacturer:"WinTech Racing",             modelName:"Filter Stern-Coxed MW 80 (4+)",            boatClass:"4+",                    category:"racing",       lengthM:12.77, widthM:null,  hullWeightKg:51,   crewMinKg:75,  crewMaxKg:90,  material:"Carbon (International/Competitor)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:36, manufacturer:"WinTech Racing",             modelName:"King LW 75 (4+)",                          boatClass:"4+",                    category:"racing",       lengthM:12.47, widthM:null,  hullWeightKg:51,   crewMinKg:70,  crewMaxKg:80,  material:"King Racing carbon", notes:"King Racing Shells sub-brand.", dataConfidence:"manufacturer_spec" },
  { id:37, manufacturer:"WinTech Racing",             modelName:"King MW 85 (4+)",                          boatClass:"4+",                    category:"racing",       lengthM:12.90, widthM:null,  hullWeightKg:51,   crewMinKg:80,  crewMaxKg:90,  material:"King Racing carbon", notes:"", dataConfidence:"manufacturer_spec" },
  { id:38, manufacturer:"WinTech Racing",             modelName:"Filter SLW 65 (8+)",                       boatClass:"8+",                    category:"racing",       lengthM:16.55, widthM:null,  hullWeightKg:96,   crewMinKg:60,  crewMaxKg:75,  material:"Carbon (International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:39, manufacturer:"WinTech Racing",             modelName:"Filter LW 80 (8+)",                        boatClass:"8+",                    category:"racing",       lengthM:16.794,widthM:null,  hullWeightKg:96,   crewMinKg:70,  crewMaxKg:85,  material:"Carbon (International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:40, manufacturer:"WinTech Racing",             modelName:"Filter MW 85 (8+)",                        boatClass:"8+",                    category:"racing",       lengthM:17.17, widthM:null,  hullWeightKg:96,   crewMinKg:80,  crewMaxKg:90,  material:"Carbon (International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:41, manufacturer:"WinTech Racing",             modelName:"Filter HW 95 (8+)",                        boatClass:"8+",                    category:"racing",       lengthM:17.195,widthM:null,  hullWeightKg:96,   crewMinKg:90,  crewMaxKg:105, material:"Carbon (International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:42, manufacturer:"WinTech Racing",             modelName:"Filter SHW 110 (8+)",                      boatClass:"8+",                    category:"racing",       lengthM:17.604,widthM:null,  hullWeightKg:96,   crewMinKg:105, crewMaxKg:120, material:"Carbon (International)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:43, manufacturer:"WinTech Racing",             modelName:"King SLW 65 (8+)",                         boatClass:"8+",                    category:"racing",       lengthM:16.93, widthM:null,  hullWeightKg:96,   crewMinKg:60,  crewMaxKg:70,  material:"King Racing carbon", notes:"", dataConfidence:"manufacturer_spec" },
  { id:44, manufacturer:"WinTech Racing",             modelName:"King LW 75 (8+)",                          boatClass:"8+",                    category:"racing",       lengthM:17.54, widthM:null,  hullWeightKg:96,   crewMinKg:70,  crewMaxKg:80,  material:"King Racing carbon", notes:"", dataConfidence:"manufacturer_spec" },
  { id:45, manufacturer:"WinTech Racing",             modelName:"King MW 85 (8+)",                          boatClass:"8+",                    category:"racing",       lengthM:17.635,widthM:null,  hullWeightKg:96,   crewMinKg:80,  crewMaxKg:90,  material:"King Racing carbon", notes:"", dataConfidence:"manufacturer_spec" },
  { id:46, manufacturer:"WinTech Racing",             modelName:"A1x Adaptive (standard)",                  boatClass:"1x (PR1/PR2 adaptive)", category:"adaptive",     lengthM:6.315, widthM:null,  hullWeightKg:18,   crewMinKg:55,  crewMaxKg:100, material:"Carbon, adaptive fittings", notes:"Wider hull per FISA/World Rowing para-rowing rules.", dataConfidence:"manufacturer_spec" },
  { id:47, manufacturer:"WinTech Racing",             modelName:"A1x Adaptive HW 95",                       boatClass:"1x (PR1/PR2 adaptive)", category:"adaptive",     lengthM:6.315, widthM:null,  hullWeightKg:16.7, crewMinKg:65,  crewMaxKg:115, material:"Carbon, adaptive fittings", notes:"", dataConfidence:"manufacturer_spec" },
  { id:48, manufacturer:"WinTech Racing",             modelName:"TA2x Adaptive (PR2 Mix2x)",                boatClass:"2x (PR2 adaptive)",     category:"adaptive",     lengthM:9.14,  widthM:null,  hullWeightKg:29,   crewMinKg:55,  crewMaxKg:105, material:"Carbon, adaptive fittings", notes:"", dataConfidence:"manufacturer_spec" },
  { id:49, manufacturer:"WinTech Racing",             modelName:"Coastal 1x",                               boatClass:"coastal 1x",            category:"coastal",      lengthM:6.00,  widthM:null,  hullWeightKg:35,   crewMinKg:55,  crewMaxKg:105, material:"Coastal construction", notes:"Available in Competition/Club builds.", dataConfidence:"manufacturer_spec" },
  { id:50, manufacturer:"WinTech Racing",             modelName:"Coastal 2x",                               boatClass:"coastal 2x",            category:"coastal",      lengthM:7.50,  widthM:null,  hullWeightKg:60,   crewMinKg:55,  crewMaxKg:110, material:"Coastal construction", notes:"", dataConfidence:"manufacturer_spec" },
  { id:51, manufacturer:"WinTech Racing",             modelName:"Coastal 4x",                               boatClass:"coastal 4x",            category:"coastal",      lengthM:10.70, widthM:null,  hullWeightKg:140,  crewMinKg:55,  crewMaxKg:110, material:"Coastal construction", notes:"", dataConfidence:"manufacturer_spec" },
  { id:52, manufacturer:"WinTech Racing",             modelName:"Junior Racer SLW 55 (1x)",                 boatClass:"1x",                    category:"recreational", lengthM:6.96,  widthM:null,  hullWeightKg:18,   crewMinKg:50,  crewMaxKg:60,  material:"Fiberglass/carbon", notes:"", dataConfidence:"manufacturer_spec" },
  { id:53, manufacturer:"WinTech Racing",             modelName:"Junior Racer LW 70 (1x)",                  boatClass:"1x",                    category:"recreational", lengthM:7.90,  widthM:null,  hullWeightKg:19,   crewMinKg:60,  crewMaxKg:75,  material:"Fiberglass/carbon", notes:"", dataConfidence:"manufacturer_spec" },
  { id:54, manufacturer:"WinTech Racing",             modelName:"Explorer 21 (1x)",                         boatClass:"1x",                    category:"recreational", lengthM:6.31,  widthM:null,  hullWeightKg:18,   crewMinKg:55,  crewMaxKg:105, material:"Fiberglass, wide Stable Hull", notes:"21 ft recreational single, wide beam / shallow curve design.", dataConfidence:"manufacturer_spec" },
  { id:55, manufacturer:"WinTech Racing",             modelName:"Explorer 24 (1x)",                         boatClass:"1x",                    category:"recreational", lengthM:7.44,  widthM:null,  hullWeightKg:18,   crewMinKg:55,  crewMaxKg:110, material:"Fiberglass, wide Stable Hull", notes:"Slightly longer/leaner advanced recreational single.", dataConfidence:"manufacturer_spec" },
  { id:56, manufacturer:"WinTech Racing",             modelName:"Explorer 30 (2x)",                         boatClass:"2x",                    category:"recreational", lengthM:9.14,  widthM:null,  hullWeightKg:32,   crewMinKg:55,  crewMaxKg:105, material:"Fiberglass, wide Stable Hull", notes:"30 ft recreational double.", dataConfidence:"manufacturer_spec" },
  { id:57, manufacturer:"WinTech Racing",             modelName:"RowSUP (1x)",                              boatClass:"1x",                    category:"recreational", lengthM:4.27,  widthM:null,  hullWeightKg:14.4, crewMinKg:null,crewMaxKg:100, material:"Inflatable/board + rig", notes:"Stand-up-paddleboard hybrid rowing rig.", dataConfidence:"manufacturer_spec" },
  { id:58, manufacturer:"WinTech Racing",             modelName:"Odyssey Touring (4+)",                     boatClass:"4+",                    category:"touring",      lengthM:10.68, widthM:null,  hullWeightKg:80,   crewMinKg:60,  crewMaxKg:90,  material:"Touring construction", notes:"", dataConfidence:"manufacturer_spec" },
  { id:59, manufacturer:"WinTech Racing",             modelName:"Odyssey Touring (6+)",                     boatClass:"6+",                    category:"touring",      lengthM:13.50, widthM:null,  hullWeightKg:103,  crewMinKg:60,  crewMaxKg:90,  material:"Touring construction", notes:"", dataConfidence:"manufacturer_spec" },
  { id:60, manufacturer:"Swift Racing",               modelName:"121-* (1x, Carbon Pro line)",              boatClass:"1x",                    category:"racing",       lengthM:7.45,  widthM:null,  hullWeightKg:null, crewMinKg:50,  crewMaxKg:65,  material:"Carbon Pro / Elite Carbon / Club", notes:"", dataConfidence:"manufacturer_spec" },
  { id:61, manufacturer:"Swift Racing",               modelName:"109L- (1x)",                               boatClass:"1x",                    category:"racing",       lengthM:7.90,  widthM:null,  hullWeightKg:null, crewMinKg:55,  crewMaxKg:65,  material:"Carbon Pro / Elite Carbon / Club", notes:"", dataConfidence:"manufacturer_spec" },
  { id:62, manufacturer:"Swift Racing",               modelName:"122-* (1x, Carbon Pro line)",              boatClass:"1x",                    category:"racing",       lengthM:7.98,  widthM:null,  hullWeightKg:null, crewMinKg:60,  crewMaxKg:75,  material:"Carbon Pro / Elite Carbon / Club", notes:"", dataConfidence:"manufacturer_spec" },
  { id:63, manufacturer:"Swift Racing",               modelName:"109H- (1x)",                               boatClass:"1x",                    category:"racing",       lengthM:7.90,  widthM:null,  hullWeightKg:null, crewMinKg:65,  crewMaxKg:75,  material:"Carbon Pro / Elite Carbon / Club", notes:"", dataConfidence:"manufacturer_spec" },
  { id:64, manufacturer:"Swift Racing",               modelName:"123-* (1x, Carbon Pro line)",              boatClass:"1x",                    category:"racing",       lengthM:8.05,  widthM:null,  hullWeightKg:null, crewMinKg:70,  crewMaxKg:85,  material:"Carbon Pro / Elite Carbon / Club", notes:"", dataConfidence:"manufacturer_spec" },
  { id:65, manufacturer:"Swift Racing",               modelName:"127-* (1x)",                               boatClass:"1x",                    category:"racing",       lengthM:7.89,  widthM:null,  hullWeightKg:null, crewMinKg:70,  crewMaxKg:85,  material:"Carbon Pro / Elite Carbon / Club", notes:"", dataConfidence:"manufacturer_spec" },
  { id:66, manufacturer:"Swift Racing",               modelName:"124-* (1x, Carbon Pro line)",              boatClass:"1x",                    category:"racing",       lengthM:8.06,  widthM:null,  hullWeightKg:null, crewMinKg:75,  crewMaxKg:90,  material:"Carbon Pro / Elite Carbon / Club", notes:"", dataConfidence:"manufacturer_spec" },
  { id:67, manufacturer:"Swift Racing",               modelName:"125L-* (1x)",                              boatClass:"1x",                    category:"racing",       lengthM:8.26,  widthM:null,  hullWeightKg:null, crewMinKg:85,  crewMaxKg:100, material:"Carbon Pro / Elite Carbon / Club", notes:"Standard high-weight hull.", dataConfidence:"manufacturer_spec" },
  { id:68, manufacturer:"Swift Racing",               modelName:"125H-* (1x)",                              boatClass:"1x",                    category:"racing",       lengthM:8.26,  widthM:null,  hullWeightKg:null, crewMinKg:95,  crewMaxKg:110, material:"Carbon Pro / Elite Carbon / Club", notes:"+10mm depth vs 125L-, increased rowing space, >190cm rowers.", dataConfidence:"manufacturer_spec" },

  // ── Empacher ─────────────────────────────────────────────────────────────────
  // Source: empacher.com product pages. Lengths and widths per mould; hull weights
  // are class standard (14 / 27 / 50-52 / 96 kg). Crew weight = per-seat average.
  // Single sculls
  { id:69,  manufacturer:"Empacher", modelName:"R04/C04/X04 (1x)",  boatClass:"1x", category:"racing", lengthM:7.08, widthM:0.26, hullWeightKg:14, crewMinKg:45,  crewMaxKg:60,  material:"Carbon/Kevlar honeycomb", notes:"Flyweight hull.", dataConfidence:"manufacturer_spec" },
  { id:70,  manufacturer:"Empacher", modelName:"R14/C14/X14 (1x)",  boatClass:"1x", category:"racing", lengthM:7.40, widthM:0.26, hullWeightKg:14, crewMinKg:50,  crewMaxKg:65,  material:"Carbon/Kevlar honeycomb", notes:"Lightweight hull.", dataConfidence:"manufacturer_spec" },
  { id:71,  manufacturer:"Empacher", modelName:"R17/C17/X17 (1x)",  boatClass:"1x", category:"racing", lengthM:7.66, widthM:0.26, hullWeightKg:14, crewMinKg:65,  crewMaxKg:75,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:72,  manufacturer:"Empacher", modelName:"R16/C16/X16 (1x)",  boatClass:"1x", category:"racing", lengthM:7.78, widthM:0.26, hullWeightKg:14, crewMinKg:75,  crewMaxKg:85,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:73,  manufacturer:"Empacher", modelName:"R08/C08/X08 (1x)",  boatClass:"1x", category:"racing", lengthM:7.92, widthM:0.27, hullWeightKg:14, crewMinKg:80,  crewMaxKg:90,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:74,  manufacturer:"Empacher", modelName:"R09/C09/X09 (1x)",  boatClass:"1x", category:"racing", lengthM:8.05, widthM:0.27, hullWeightKg:14, crewMinKg:85,  crewMaxKg:95,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:75,  manufacturer:"Empacher", modelName:"R10/C10/X10 (1x)",  boatClass:"1x", category:"racing", lengthM:8.20, widthM:0.28, hullWeightKg:14, crewMinKg:90,  crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:76,  manufacturer:"Empacher", modelName:"R11/C11/X11 (1x)",  boatClass:"1x", category:"racing", lengthM:8.30, widthM:0.28, hullWeightKg:14, crewMinKg:95,  crewMaxKg:110, material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:77,  manufacturer:"Empacher", modelName:"R01/C01/X01 (1x)",  boatClass:"1x", category:"racing", lengthM:8.37, widthM:0.28, hullWeightKg:14, crewMinKg:100, crewMaxKg:120, material:"Carbon/Kevlar honeycomb", notes:"Super-heavyweight hull.", dataConfidence:"manufacturer_spec" },
  // Doubles — per-model lengths estimated from published range (9.24–9.91 m); widths estimated from range (0.31–0.34 m)
  { id:78,  manufacturer:"Empacher", modelName:"R29/C29/X29 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.24, widthM:0.31, hullWeightKg:27, crewMinKg:50,  crewMaxKg:65,  material:"Carbon/Kevlar honeycomb", notes:"Lengths within published range 9.24–9.91 m; per-model values estimated.", dataConfidence:"manufacturer_spec" },
  { id:79,  manufacturer:"Empacher", modelName:"R25/C25/X25 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.40, widthM:0.31, hullWeightKg:27, crewMinKg:65,  crewMaxKg:75,  material:"Carbon/Kevlar honeycomb", notes:"Per-model length estimated.", dataConfidence:"manufacturer_spec" },
  { id:80,  manufacturer:"Empacher", modelName:"R26/C26/X26 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.45, widthM:0.32, hullWeightKg:27, crewMinKg:65,  crewMaxKg:80,  material:"Carbon/Kevlar honeycomb", notes:"Per-model length estimated.", dataConfidence:"manufacturer_spec" },
  { id:81,  manufacturer:"Empacher", modelName:"R24/C24/X24 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.58, widthM:0.32, hullWeightKg:27, crewMinKg:75,  crewMaxKg:85,  material:"Carbon/Kevlar honeycomb", notes:"Per-model length estimated.", dataConfidence:"manufacturer_spec" },
  { id:82,  manufacturer:"Empacher", modelName:"R21/X21 (2x/2-)",     boatClass:"2x/2-", category:"racing", lengthM:9.66, widthM:0.33, hullWeightKg:27, crewMinKg:85,  crewMaxKg:95,  material:"Carbon/Kevlar honeycomb", notes:"Per-model length estimated.", dataConfidence:"manufacturer_spec" },
  { id:83,  manufacturer:"Empacher", modelName:"R20/C20/X20 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.75, widthM:0.33, hullWeightKg:27, crewMinKg:90,  crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"Per-model length estimated.", dataConfidence:"manufacturer_spec" },
  { id:84,  manufacturer:"Empacher", modelName:"R23/C23/X23 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.85, widthM:0.34, hullWeightKg:27, crewMinKg:95,  crewMaxKg:105, material:"Carbon/Kevlar honeycomb", notes:"Per-model length estimated.", dataConfidence:"manufacturer_spec" },
  { id:85,  manufacturer:"Empacher", modelName:"R32/C32/X32 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.91, widthM:0.34, hullWeightKg:27, crewMinKg:95,  crewMaxKg:105, material:"Carbon/Kevlar honeycomb", notes:"Longest/heaviest double variant.", dataConfidence:"manufacturer_spec" },
  // Coxless fours (hull weight 50 kg)
  { id:86,  manufacturer:"Empacher", modelName:"R41/C41/X41 (4-)",  boatClass:"4-",  category:"racing", lengthM:10.50, widthM:0.37, hullWeightKg:50, crewMinKg:null, crewMaxKg:65,  material:"Carbon/Kevlar honeycomb", notes:"≤65 kg/seat.", dataConfidence:"manufacturer_spec" },
  { id:87,  manufacturer:"Empacher", modelName:"R50/C50/X50 (4-)",  boatClass:"4-",  category:"racing", lengthM:11.70, widthM:0.41, hullWeightKg:50, crewMinKg:65,   crewMaxKg:85,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:88,  manufacturer:"Empacher", modelName:"R40/C40/X40 (4-)",  boatClass:"4-",  category:"racing", lengthM:11.78, widthM:0.43, hullWeightKg:50, crewMinKg:65,   crewMaxKg:80,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:89,  manufacturer:"Empacher", modelName:"R44/C44/X44 (4-)",  boatClass:"4-",  category:"racing", lengthM:12.02, widthM:0.44, hullWeightKg:50, crewMinKg:75,   crewMaxKg:95,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:90,  manufacturer:"Empacher", modelName:"R54/C54/X54 (4-)",  boatClass:"4-",  category:"racing", lengthM:11.88, widthM:0.41, hullWeightKg:50, crewMinKg:80,   crewMaxKg:95,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:91,  manufacturer:"Empacher", modelName:"R48/C48/X48 (4-)",  boatClass:"4-",  category:"racing", lengthM:12.43, widthM:0.43, hullWeightKg:50, crewMinKg:90,   crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:92,  manufacturer:"Empacher", modelName:"R55/C55/X55 (4-)",  boatClass:"4-",  category:"racing", lengthM:12.45, widthM:0.41, hullWeightKg:50, crewMinKg:90,   crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  // Quads (hull weight 52 kg)
  { id:93,  manufacturer:"Empacher", modelName:"R41/C41/X41 (4x)",  boatClass:"4x",  category:"racing", lengthM:10.50, widthM:0.37, hullWeightKg:52, crewMinKg:null, crewMaxKg:65,  material:"Carbon/Kevlar honeycomb", notes:"≤65 kg/seat.", dataConfidence:"manufacturer_spec" },
  { id:94,  manufacturer:"Empacher", modelName:"R47/C47/X47 (4x)",  boatClass:"4x",  category:"racing", lengthM:11.69, widthM:0.39, hullWeightKg:52, crewMinKg:65,   crewMaxKg:75,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:95,  manufacturer:"Empacher", modelName:"R40/C40/X40 (4x)",  boatClass:"4x",  category:"racing", lengthM:11.78, widthM:0.43, hullWeightKg:52, crewMinKg:65,   crewMaxKg:85,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:96,  manufacturer:"Empacher", modelName:"R50/C50/X50 (4x)",  boatClass:"4x",  category:"racing", lengthM:11.70, widthM:0.41, hullWeightKg:52, crewMinKg:65,   crewMaxKg:85,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:97,  manufacturer:"Empacher", modelName:"R44/C44/X44 (4x)",  boatClass:"4x",  category:"racing", lengthM:12.02, widthM:0.44, hullWeightKg:52, crewMinKg:75,   crewMaxKg:95,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:98,  manufacturer:"Empacher", modelName:"R54/C54/X54 (4x)",  boatClass:"4x",  category:"racing", lengthM:11.88, widthM:0.41, hullWeightKg:52, crewMinKg:80,   crewMaxKg:95,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:99,  manufacturer:"Empacher", modelName:"R48/C48/X48 (4x)",  boatClass:"4x",  category:"racing", lengthM:12.43, widthM:0.43, hullWeightKg:52, crewMinKg:90,   crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:100, manufacturer:"Empacher", modelName:"R55/C55/X55 (4x)",  boatClass:"4x",  category:"racing", lengthM:12.45, widthM:0.41, hullWeightKg:52, crewMinKg:90,   crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  // Coxed fours (hull weight 51 kg)
  { id:101, manufacturer:"Empacher", modelName:"R40/C40/X40 (4+)",  boatClass:"4+",  category:"racing", lengthM:11.78, widthM:0.43, hullWeightKg:51, crewMinKg:55,   crewMaxKg:70,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:102, manufacturer:"Empacher", modelName:"R50/C50/X50 (4+)",  boatClass:"4+",  category:"racing", lengthM:11.70, widthM:0.41, hullWeightKg:51, crewMinKg:55,   crewMaxKg:75,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:103, manufacturer:"Empacher", modelName:"R44/C44/X44 (4+)",  boatClass:"4+",  category:"racing", lengthM:12.02, widthM:0.44, hullWeightKg:51, crewMinKg:65,   crewMaxKg:80,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:104, manufacturer:"Empacher", modelName:"R54/C54/X54 (4+)",  boatClass:"4+",  category:"racing", lengthM:11.88, widthM:0.41, hullWeightKg:51, crewMinKg:65,   crewMaxKg:80,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:105, manufacturer:"Empacher", modelName:"R46/C46/X46 (4+)",  boatClass:"4+",  category:"racing", lengthM:12.26, widthM:0.46, hullWeightKg:51, crewMinKg:70,   crewMaxKg:90,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:106, manufacturer:"Empacher", modelName:"R48/C48/X48 (4+)",  boatClass:"4+",  category:"racing", lengthM:12.43, widthM:0.43, hullWeightKg:51, crewMinKg:80,   crewMaxKg:95,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:107, manufacturer:"Empacher", modelName:"R43/C43/X43 (4+)",  boatClass:"4+",  category:"racing", lengthM:13.58, widthM:0.47, hullWeightKg:51, crewMinKg:85,   crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"Longest 4+ mould.", dataConfidence:"manufacturer_spec" },
  // Eights (hull weight 96 kg)
  { id:108, manufacturer:"Empacher", modelName:"R89/C89/X89 (8+)",  boatClass:"8+",  category:"racing", lengthM:16.73, widthM:0.54, hullWeightKg:96, crewMinKg:65,   crewMaxKg:80,  material:"Carbon/Kevlar honeycomb", notes:"Lightweight eight.", dataConfidence:"manufacturer_spec" },
  { id:109, manufacturer:"Empacher", modelName:"R87/C87/X87 (8+)",  boatClass:"8+",  category:"racing", lengthM:16.90, widthM:0.54, hullWeightKg:96, crewMinKg:75,   crewMaxKg:90,  material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:110, manufacturer:"Empacher", modelName:"R80/C80/X80 (8+)",  boatClass:"8+",  category:"racing", lengthM:17.25, widthM:0.55, hullWeightKg:96, crewMinKg:85,   crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"New mould.", dataConfidence:"manufacturer_spec" },
  { id:111, manufacturer:"Empacher", modelName:"R88/C88/X88 (8+)",  boatClass:"8+",  category:"racing", lengthM:17.40, widthM:0.55, hullWeightKg:96, crewMinKg:90,   crewMaxKg:105, material:"Carbon/Kevlar honeycomb", notes:"", dataConfidence:"manufacturer_spec" },
  { id:112, manufacturer:"Empacher", modelName:"R86/C86/X86 (8+)",  boatClass:"8+",  category:"racing", lengthM:17.63, widthM:0.56, hullWeightKg:96, crewMinKg:85,   crewMaxKg:100, material:"Carbon/Kevlar honeycomb", notes:"Longest eight mould.", dataConfidence:"manufacturer_spec" },

  // ── Vespoli USA ──────────────────────────────────────────────────────────────
  // Source: vespoli.com. Lengths from website (ft/in converted). No width/hull weight published.
  // Doubles / Pairs
  { id:113, manufacturer:"Vespoli USA", modelName:"VHP29 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.1,  widthM:null, hullWeightKg:null, crewMinKg:50, crewMaxKg:66,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:114, manufacturer:"Vespoli USA", modelName:"VHP30 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.1,  widthM:null, hullWeightKg:null, crewMinKg:66, crewMaxKg:82,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:115, manufacturer:"Vespoli USA", modelName:"VHP32 (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.8,  widthM:null, hullWeightKg:null, crewMinKg:82, crewMaxKg:100, material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  // Coxed Fours
  { id:116, manufacturer:"Vespoli USA", modelName:"VHP39 (4+)", boatClass:"4+", category:"racing", lengthM:12.04, widthM:null, hullWeightKg:null, crewMinKg:54, crewMaxKg:68,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:117, manufacturer:"Vespoli USA", modelName:"VHP41 (4+)", boatClass:"4+", category:"racing", lengthM:12.70, widthM:null, hullWeightKg:null, crewMinKg:65, crewMaxKg:82,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:118, manufacturer:"Vespoli USA", modelName:"VHP43 (4+)", boatClass:"4+", category:"racing", lengthM:13.00, widthM:null, hullWeightKg:null, crewMinKg:82, crewMaxKg:100, material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  // Eights
  { id:119, manufacturer:"Vespoli USA", modelName:"VHP51 (8+)",   boatClass:"8+", category:"racing", lengthM:15.5,  widthM:null, hullWeightKg:null, crewMinKg:54, crewMaxKg:68,  material:"Advanced composite", notes:"Lightweight eight.", dataConfidence:"manufacturer_spec" },
  { id:120, manufacturer:"Vespoli USA", modelName:"VHP53 (8+)",   boatClass:"8+", category:"racing", lengthM:16.3,  widthM:null, hullWeightKg:null, crewMinKg:61, crewMaxKg:75,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:121, manufacturer:"Vespoli USA", modelName:"VHP55 (8+)",   boatClass:"8+", category:"racing", lengthM:16.8,  widthM:null, hullWeightKg:null, crewMinKg:68, crewMaxKg:82,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:122, manufacturer:"Vespoli USA", modelName:"VHP56 (8+)",   boatClass:"8+", category:"racing", lengthM:17.0,  widthM:null, hullWeightKg:null, crewMinKg:75, crewMaxKg:88,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:123, manufacturer:"Vespoli USA", modelName:"VHP57 (8+)",   boatClass:"8+", category:"racing", lengthM:17.4,  widthM:null, hullWeightKg:null, crewMinKg:79, crewMaxKg:93,  material:"Advanced composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:124, manufacturer:"Vespoli USA", modelName:"VHP57XL (8+)", boatClass:"8+", category:"racing", lengthM:17.4,  widthM:null, hullWeightKg:null, crewMinKg:88, crewMaxKg:102, material:"Advanced composite", notes:"Super-heavyweight eight.", dataConfidence:"manufacturer_spec" },

  // ── Kaschper Racing Shells ────────────────────────────────────────────────────
  // Source: nauticexpo PDF brochures. Lengths from 8+ brochure; single lengths estimated
  // from typical class lengths (no per-mould lengths published for singles).
  { id:125, manufacturer:"Kaschper", modelName:"Single — Flyweight (1x)",       boatClass:"1x", category:"racing", lengthM:7.4,   widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:57,  material:"3K & Unidirectional carbon, honeycomb", notes:"Flyweight class; exact hull length not published.", dataConfidence:"manufacturer_spec" },
  { id:126, manufacturer:"Kaschper", modelName:"Single — Lightweight (1x)",     boatClass:"1x", category:"racing", lengthM:7.9,   widthM:null, hullWeightKg:null, crewMinKg:57,   crewMaxKg:72,  material:"3K & Unidirectional carbon, honeycomb", notes:"Lightweight class; exact hull length not published.", dataConfidence:"manufacturer_spec" },
  { id:127, manufacturer:"Kaschper", modelName:"Single — Midweight (1x)",       boatClass:"1x", category:"racing", lengthM:8.0,   widthM:null, hullWeightKg:null, crewMinKg:72,   crewMaxKg:86,  material:"3K & Unidirectional carbon, honeycomb", notes:"Midweight class; exact hull length not published.", dataConfidence:"manufacturer_spec" },
  { id:128, manufacturer:"Kaschper", modelName:"Single — Heavyweight (1x)",     boatClass:"1x", category:"racing", lengthM:8.2,   widthM:null, hullWeightKg:null, crewMinKg:86,   crewMaxKg:100, material:"3K & Unidirectional carbon, honeycomb", notes:"Heavyweight class; exact hull length not published.", dataConfidence:"manufacturer_spec" },
  { id:129, manufacturer:"Kaschper", modelName:"Single — Super Heavyweight (1x)",boatClass:"1x", category:"racing", lengthM:8.4,   widthM:null, hullWeightKg:null, crewMinKg:100,  crewMaxKg:null,material:"3K & Unidirectional carbon, honeycomb", notes:"Super Heavyweight class; exact hull length not published.", dataConfidence:"manufacturer_spec" },
  { id:130, manufacturer:"Kaschper", modelName:"NX (1x — training)",            boatClass:"1x", category:"recreational", lengthM:8.0, widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Carbon composite", notes:"Training/recreational single; listed on nauticexpo.", dataConfidence:"manufacturer_spec" },
  { id:131, manufacturer:"Kaschper", modelName:"Eight XTM — Men/HW Women (8+)", boatClass:"8+", category:"racing", lengthM:17.67, widthM:0.572, hullWeightKg:null, crewMinKg:75,   crewMaxKg:null, material:"3K & Unidirectional carbon, honeycomb", notes:"XTM eight; 57 ft 10.5 in LOA, 22.5 in BWL.", dataConfidence:"manufacturer_spec" },

  // ── Sykes Racing ─────────────────────────────────────────────────────────────
  // Source: sykes.com.au. Published weight categories; exact lengths not on public pages.
  // Australian manufacturer; also distributes Empacher in Australia.
  { id:132, manufacturer:"Sykes Racing", modelName:"Single — SL 57–60 kg (1x)", boatClass:"1x", category:"racing", lengthM:7.6,  widthM:null, hullWeightKg:null, crewMinKg:57, crewMaxKg:60,  material:"Carbon (Classic or Elite)", notes:"SL weight class. Hull length not published; class-typical estimate used.", dataConfidence:"manufacturer_spec" },
  { id:133, manufacturer:"Sykes Racing", modelName:"Single — L 60–69 kg (1x)",  boatClass:"1x", category:"racing", lengthM:7.8,  widthM:null, hullWeightKg:null, crewMinKg:60, crewMaxKg:69,  material:"Carbon (Classic or Elite)", notes:"L weight class.", dataConfidence:"manufacturer_spec" },
  { id:134, manufacturer:"Sykes Racing", modelName:"Single — M 70–79 kg (1x)",  boatClass:"1x", category:"racing", lengthM:8.0,  widthM:null, hullWeightKg:null, crewMinKg:70, crewMaxKg:79,  material:"Carbon (Classic or Elite)", notes:"M weight class.", dataConfidence:"manufacturer_spec" },
  { id:135, manufacturer:"Sykes Racing", modelName:"Single — H 80–89 kg (1x)",  boatClass:"1x", category:"racing", lengthM:8.1,  widthM:null, hullWeightKg:null, crewMinKg:80, crewMaxKg:89,  material:"Carbon (Classic or Elite)", notes:"H weight class.", dataConfidence:"manufacturer_spec" },
  { id:136, manufacturer:"Sykes Racing", modelName:"Single — XH 90 kg+ (1x)",   boatClass:"1x", category:"racing", lengthM:8.3,  widthM:null, hullWeightKg:null, crewMinKg:90, crewMaxKg:null,material:"Carbon (Classic or Elite)", notes:"XH (extra-heavyweight) class.", dataConfidence:"manufacturer_spec" },

  // ── Hudson Boat Works ─────────────────────────────────────────────────────────
  // Source: hudsonboatworks.com. Dimensions not published on public website.
  // Known models from product pages; lengths are class-typical estimates.
  { id:137, manufacturer:"Hudson Boat Works", modelName:"Great White (1x)",      boatClass:"1x", category:"racing",       lengthM:8.2,  widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Carbon composite, aluminum riggers", notes:"Elite racing single. Exact dimensions not published.", dataConfidence:"manufacturer_spec" },
  { id:138, manufacturer:"Hudson Boat Works", modelName:"USP — Ultimate SHARK Predator (1x)", boatClass:"1x", category:"racing", lengthM:8.2, widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Carbon composite", notes:"High-performance single. Dimensions not published.", dataConfidence:"manufacturer_spec" },
  { id:139, manufacturer:"Hudson Boat Works", modelName:"SHARK Predator (2x/2-)",boatClass:"2x/2-", category:"racing",   lengthM:10.4, widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Carbon composite, aluminum riggers", notes:"Dimensions not published; class-typical length used.", dataConfidence:"manufacturer_spec" },
  { id:140, manufacturer:"Hudson Boat Works", modelName:"Hammerhead (8+)",        boatClass:"8+",   category:"racing",   lengthM:17.4, widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Carbon composite", notes:"Elite eight. Dimensions not published.", dataConfidence:"manufacturer_spec" },
  { id:141, manufacturer:"Hudson Boat Works", modelName:"COASTAL (Coastal 1x)",   boatClass:"coastal 1x", category:"coastal", lengthM:6.7, widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Carbon composite", notes:"Coastal/open-water single. Dimensions not published.", dataConfidence:"manufacturer_spec" },

  // ── Pocock Racing Shells ──────────────────────────────────────────────────────
  // Source: pocockracing.com / pocockparts.com.
  // Core K series: sized by crew weight range (Small/Medium/Large).
  // Core K2 waterline lengths from published spec sheet; all others estimated from
  // class-typical proportions and Pocock's published hull-weight/sizing philosophy.
  // Pocock does not publish detailed dimension tables for K1/K4/K8 — those entries
  // use dataConfidence:"estimated".

  // Core K2 (double scull / pair) — manufacturer_spec from product page
  { id:142, manufacturer:"Pocock Racing Shells", modelName:"Core K2 — Small (2x/2-)",   boatClass:"2x",  category:"racing", lengthM:9.38,  widthM:0.369, hullWeightKg:30,   crewMinKg:54,  crewMaxKg:73,  material:"Carbon composite, T-6 aluminum riggers", notes:"WLL 30.76 ft; hull weight ~30 kg fully rigged.", dataConfidence:"manufacturer_spec" },
  { id:143, manufacturer:"Pocock Racing Shells", modelName:"Core K2 — Medium (2x/2-)",  boatClass:"2x",  category:"racing", lengthM:9.44,  widthM:0.369, hullWeightKg:30,   crewMinKg:64,  crewMaxKg:84,  material:"Carbon composite, T-6 aluminum riggers", notes:"WLL 30.95 ft.", dataConfidence:"manufacturer_spec" },
  { id:144, manufacturer:"Pocock Racing Shells", modelName:"Core K2 — Large (2x/2-)",   boatClass:"2x",  category:"racing", lengthM:9.96,  widthM:0.358, hullWeightKg:32,   crewMinKg:79,  crewMaxKg:104, material:"Carbon composite, T-6 aluminum riggers", notes:"WLL 32.67 ft.", dataConfidence:"manufacturer_spec" },

  // Core K1 (single scull) — manufacturer specs from pocock.com/shells/core-k1/
  { id:145, manufacturer:"Pocock Racing Shells", modelName:"Core K1 — Small (1x)",      boatClass:"1x",  category:"racing", lengthM:7.92,  widthM:0.259, hullWeightKg:15.9, crewMinKg:59,  crewMaxKg:79,  material:"Carbon/fiberglass, syntactic resin core, T-6 aluminum riggers", notes:"WLL 26 ft, BWL 10.19 in, fully rigged 35 lbs.", dataConfidence:"manufacturer_spec" },
  { id:174, manufacturer:"Pocock Racing Shells", modelName:"Core K1 — Large (1x)",      boatClass:"1x",  category:"racing", lengthM:8.32,  widthM:0.274, hullWeightKg:16.8, crewMinKg:77,  crewMaxKg:104, material:"Carbon/fiberglass, syntactic resin core, T-6 aluminum riggers", notes:"WLL 27.3 ft, BWL 10.79 in, fully rigged 37 lbs.", dataConfidence:"manufacturer_spec" },

  // Core K4 (quad scull / coxless four) — dimensions estimated
  { id:146, manufacturer:"Pocock Racing Shells", modelName:"Core K4 — Small (4x/4-)",   boatClass:"4x",  category:"racing", lengthM:11.00, widthM:0.570, hullWeightKg:52,   crewMinKg:50,  crewMaxKg:68,  material:"Carbon composite, T-6 aluminum riggers", notes:"Lightweight/junior quad or four. Dimensions estimated.", dataConfidence:"estimated" },
  { id:175, manufacturer:"Pocock Racing Shells", modelName:"Core K4 — Medium (4x/4-)",  boatClass:"4x",  category:"racing", lengthM:12.30, widthM:0.580, hullWeightKg:52,   crewMinKg:65,  crewMaxKg:85,  material:"Carbon composite, T-6 aluminum riggers", notes:"Midweight quad or four. Dimensions estimated.", dataConfidence:"estimated" },
  { id:176, manufacturer:"Pocock Racing Shells", modelName:"Core K4 — Large (4x/4-)",   boatClass:"4x",  category:"racing", lengthM:13.40, widthM:0.590, hullWeightKg:54,   crewMinKg:80,  crewMaxKg:105, material:"Carbon composite, T-6 aluminum riggers", notes:"Heavyweight quad or four. Dimensions estimated.", dataConfidence:"estimated" },

  // Core K4+ (coxed four) — estimated
  { id:177, manufacturer:"Pocock Racing Shells", modelName:"Core K4+ — Medium (4+)",    boatClass:"4+",  category:"racing", lengthM:12.50, widthM:0.585, hullWeightKg:55,   crewMinKg:60,  crewMaxKg:85,  material:"Carbon composite, T-6 aluminum riggers", notes:"Coxed four, mid-size. Dimensions estimated.", dataConfidence:"estimated" },
  { id:178, manufacturer:"Pocock Racing Shells", modelName:"Core K4+ — Large (4+)",     boatClass:"4+",  category:"racing", lengthM:13.70, widthM:0.595, hullWeightKg:57,   crewMinKg:80,  crewMaxKg:105, material:"Carbon composite, T-6 aluminum riggers", notes:"Coxed four, heavyweight. Dimensions estimated.", dataConfidence:"estimated" },

  // Core K8 (eight) — dimensions estimated; Pocock eights typically 57–60 ft WLL
  { id:147, manufacturer:"Pocock Racing Shells", modelName:"Core K8 — Medium (8+)",     boatClass:"8+",  category:"racing", lengthM:17.02, widthM:0.536, hullWeightKg:90.7, crewMinKg:75,  crewMaxKg:86,  material:"Carbon/fiberglass, syntactic resin core, T-6 aluminum riggers", notes:"WLL ~55.83 ft estimated. Medium crew weight class.", dataConfidence:"estimated" },
  { id:179, manufacturer:"Pocock Racing Shells", modelName:"Core K8 — Large (8+)",      boatClass:"8+",  category:"racing", lengthM:17.58, widthM:0.556, hullWeightKg:95.3, crewMinKg:84,  crewMaxKg:104, material:"Carbon/fiberglass, syntactic resin core, T-6 aluminum riggers", notes:"WLL ~57.67 ft estimated. Heavyweight crew class.", dataConfidence:"estimated" },

  // Hypercarbon K1 — from pocock.com/shells/hypercarbon-k1/ (manufacturer_spec)
  { id:180, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K1 — Small (1x)", boatClass:"1x", category:"racing", lengthM:7.92,  widthM:0.259, hullWeightKg:13.2, crewMinKg:59,  crewMaxKg:79,  material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 26 ft, BWL 10.19 in, fully rigged 29 lbs.", dataConfidence:"manufacturer_spec" },
  { id:181, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K1 — Large (1x)", boatClass:"1x", category:"racing", lengthM:8.32,  widthM:0.273, hullWeightKg:13.6, crewMinKg:77,  crewMaxKg:104, material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 27.3 ft, BWL 10.75 in, fully rigged 30 lbs.", dataConfidence:"manufacturer_spec" },

  // Hypercarbon K2 — from pocock.com/shells/hypercarbon-k2/ (manufacturer_spec)
  { id:182, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K2 — Small LWT (2x/2-)", boatClass:"2x", category:"racing", lengthM:9.32,  widthM:null, hullWeightKg:26.3, crewMinKg:52,  crewMaxKg:61,  material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 30'7\". Pair 58 lbs / Double 61 lbs fully rigged.", dataConfidence:"manufacturer_spec" },
  { id:183, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K2 — Small (2x/2-)",     boatClass:"2x", category:"racing", lengthM:9.37,  widthM:null, hullWeightKg:26.3, crewMinKg:61,  crewMaxKg:70,  material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 30'9\".", dataConfidence:"manufacturer_spec" },
  { id:184, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K2 — Medium LWT (2x/2-)",boatClass:"2x", category:"racing", lengthM:9.42,  widthM:null, hullWeightKg:26.3, crewMinKg:68,  crewMaxKg:77,  material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 30'11\".", dataConfidence:"manufacturer_spec" },
  { id:185, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K2 — Medium (2x/2-)",    boatClass:"2x", category:"racing", lengthM:9.45,  widthM:null, hullWeightKg:26.3, crewMinKg:75,  crewMaxKg:84,  material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 31'0\".", dataConfidence:"manufacturer_spec" },
  { id:186, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K2 — Large (2x/2-)",     boatClass:"2x", category:"racing", lengthM:9.96,  widthM:null, hullWeightKg:26.8, crewMinKg:79,  crewMaxKg:91,  material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 32'8\".", dataConfidence:"manufacturer_spec" },
  { id:187, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K2 — XL (2x/2-)",        boatClass:"2x", category:"racing", lengthM:10.01, widthM:null, hullWeightKg:26.8, crewMinKg:88,  crewMaxKg:104, material:"All-carbon layup, foam core, carbon fiber riggers", notes:"WLL 32'10\".", dataConfidence:"manufacturer_spec" },

  // Hypercarbon K4+ — from pocock.com/shells/hypercarbon-k4/ (manufacturer_spec)
  { id:188, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K4+ — Small LWT (4+)", boatClass:"4+", category:"racing", lengthM:12.45, widthM:null, hullWeightKg:48.1, crewMinKg:52,  crewMaxKg:66,  material:"All-carbon layup, foam core, 7th-gen wing rigger", notes:"WLL 40'10\". Fully rigged 106 lbs.", dataConfidence:"manufacturer_spec" },
  { id:189, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K4+ — Small (4+)",     boatClass:"4+", category:"racing", lengthM:12.50, widthM:null, hullWeightKg:48.1, crewMinKg:64,  crewMaxKg:75,  material:"All-carbon layup, foam core, 7th-gen wing rigger", notes:"WLL 41'.", dataConfidence:"manufacturer_spec" },
  { id:190, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K4+ — Medium LWT (4+)",boatClass:"4+", category:"racing", lengthM:12.57, widthM:null, hullWeightKg:49.9, crewMinKg:68,  crewMaxKg:77,  material:"All-carbon layup, foam core, 7th-gen wing rigger", notes:"WLL 41'3\".", dataConfidence:"manufacturer_spec" },
  { id:191, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K4+ — Medium (4+)",    boatClass:"4+", category:"racing", lengthM:12.65, widthM:null, hullWeightKg:49.9, crewMinKg:73,  crewMaxKg:82,  material:"All-carbon layup, foam core, 7th-gen wing rigger", notes:"WLL 41'6\".", dataConfidence:"manufacturer_spec" },
  { id:192, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K4+ — Large (4+)",     boatClass:"4+", category:"racing", lengthM:12.93, widthM:null, hullWeightKg:50.8, crewMinKg:79,  crewMaxKg:91,  material:"All-carbon layup, foam core, 7th-gen wing rigger", notes:"WLL 42'5\".", dataConfidence:"manufacturer_spec" },
  { id:193, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon K4+ — XL (4+)",        boatClass:"4+", category:"racing", lengthM:13.00, widthM:null, hullWeightKg:50.8, crewMinKg:86,  crewMaxKg:102, material:"All-carbon layup, foam core, 7th-gen wing rigger", notes:"WLL 42'8\".", dataConfidence:"manufacturer_spec" },

  // Hypercarbon V8 — from pocock.com/shells/hypercarbon-v8/ (manufacturer_spec)
  { id:194, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon V8 — Small (8+)",  boatClass:"8+", category:"racing", lengthM:17.23, widthM:0.544, hullWeightKg:90.7, crewMinKg:59,  crewMaxKg:75,  material:"All-carbon, foam core, carbon or aluminum wing rigger", notes:"WLL 56.54 ft, BWL 21.42 in. Fully rigged 200 lbs.", dataConfidence:"manufacturer_spec" },
  { id:195, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon V8 — Medium (8+)", boatClass:"8+", category:"racing", lengthM:17.02, widthM:0.536, hullWeightKg:90.7, crewMinKg:75,  crewMaxKg:86,  material:"All-carbon, foam core, carbon or aluminum wing rigger", notes:"WLL 55.83 ft, BWL 21.08 in. Fully rigged 200 lbs.", dataConfidence:"manufacturer_spec" },
  { id:196, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon V8 — Large (8+)",  boatClass:"8+", category:"racing", lengthM:17.58, widthM:0.556, hullWeightKg:95.3, crewMinKg:84,  crewMaxKg:104, material:"All-carbon, foam core, carbon or aluminum wing rigger", notes:"WLL 57.67 ft, BWL 21.90 in. Fully rigged 210 lbs.", dataConfidence:"manufacturer_spec" },

  // Hypercarbon Comp V8 — from pocock.com/shells/hypercarbon-comp-v8/ (manufacturer_spec)
  // Same hull moulds as Hypercarbon V8; 6th-gen wing rigger, heavier due to extra hull carbon
  { id:197, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp V8 — Small (8+)",  boatClass:"8+", category:"racing", lengthM:17.23, widthM:0.544, hullWeightKg:93.9, crewMinKg:59,  crewMaxKg:75,  material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 56.54 ft, BWL 21.42 in. Fully rigged 207 lbs.", dataConfidence:"manufacturer_spec" },
  { id:198, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp V8 — Medium (8+)", boatClass:"8+", category:"racing", lengthM:17.02, widthM:0.536, hullWeightKg:93.9, crewMinKg:75,  crewMaxKg:86,  material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 55.83 ft, BWL 21.08 in. Fully rigged 207 lbs.", dataConfidence:"manufacturer_spec" },
  { id:199, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp V8 — Large (8+)",  boatClass:"8+", category:"racing", lengthM:17.58, widthM:0.556, hullWeightKg:95.3, crewMinKg:84,  crewMaxKg:104, material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 57.67 ft, BWL 21.90 in. Fully rigged 210 lbs.", dataConfidence:"manufacturer_spec" },

  // Hypercarbon Comp K4+ — from pocock.com/shells/hypercarbon-comp-k4/ (manufacturer_spec)
  // Same hull moulds as Hypercarbon K4+; enhanced hull layup
  { id:200, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp K4+ — Small LWT (4+)", boatClass:"4+", category:"racing", lengthM:12.45, widthM:null, hullWeightKg:48.1, crewMinKg:52, crewMaxKg:66, material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 40'10\". Fully rigged 106 lbs.", dataConfidence:"manufacturer_spec" },
  { id:201, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp K4+ — Small (4+)",     boatClass:"4+", category:"racing", lengthM:12.50, widthM:null, hullWeightKg:48.1, crewMinKg:64, crewMaxKg:75, material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 41'.", dataConfidence:"manufacturer_spec" },
  { id:202, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp K4+ — Medium LWT (4+)",boatClass:"4+", category:"racing", lengthM:12.57, widthM:null, hullWeightKg:49.9, crewMinKg:68, crewMaxKg:77, material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 41'3\".", dataConfidence:"manufacturer_spec" },
  { id:203, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp K4+ — Medium (4+)",    boatClass:"4+", category:"racing", lengthM:12.65, widthM:null, hullWeightKg:49.9, crewMinKg:73, crewMaxKg:82, material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 41'6\".", dataConfidence:"manufacturer_spec" },
  { id:204, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp K4+ — Large (4+)",     boatClass:"4+", category:"racing", lengthM:12.93, widthM:null, hullWeightKg:50.8, crewMinKg:79, crewMaxKg:91, material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 42'5\".", dataConfidence:"manufacturer_spec" },
  { id:205, manufacturer:"Pocock Racing Shells", modelName:"Hypercarbon Comp K4+ — XL (4+)",        boatClass:"4+", category:"racing", lengthM:13.00, widthM:null, hullWeightKg:50.8, crewMinKg:86, crewMaxKg:102, material:"All-carbon, foam core, 6th-gen wing rigger, extra hull carbon", notes:"WLL 42'8\".", dataConfidence:"manufacturer_spec" },

  // xVIII series — from pocock.com/shells/xviii/ (manufacturer_spec for Large; Medium estimated)
  // "First pure mathematically designed hull"; G7 carbon/titanium wing rigger
  { id:206, manufacturer:"Pocock Racing Shells", modelName:"xVIII — Medium (8+)", boatClass:"8+", category:"racing", lengthM:17.02, widthM:0.536, hullWeightKg:90.7, crewMinKg:75,  crewMaxKg:84,  material:"Carbon, G7 wing rigger, carbon/titanium footboard", notes:"Specs estimated — Pocock does not publish Medium xVIII dimensions separately.", dataConfidence:"estimated" },
  { id:207, manufacturer:"Pocock Racing Shells", modelName:"xVIII — Large (8+)",  boatClass:"8+", category:"racing", lengthM:17.37, widthM:null,  hullWeightKg:95.3, crewMinKg:84,  crewMaxKg:98,  material:"Carbon, G7 wing rigger, carbon/titanium footboard", notes:"WLL ~57 ft, fully rigged 210 lbs. Crew 185–215 lbs.", dataConfidence:"manufacturer_spec" },

  // ── Carl Douglas Racing Shells ────────────────────────────────────────────────
  // Source: carldouglasrowing.com. Only makes 1x, 2x, 2-. Six hull sizes by crew weight.
  // Exact lengths not published; class-typical values used.
  { id:148, manufacturer:"Carl Douglas", modelName:"Single — <60 kg (1x)",  boatClass:"1x",  category:"racing", lengthM:7.5,  widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:60,  material:"Wood/Kevlar composite", notes:"Traditional wood/Kevlar construction. Exact length not published.", dataConfidence:"manufacturer_spec" },
  { id:149, manufacturer:"Carl Douglas", modelName:"Single — 70 kg (1x)",   boatClass:"1x",  category:"racing", lengthM:7.8,  widthM:null, hullWeightKg:null, crewMinKg:65,   crewMaxKg:75,  material:"Wood/Kevlar composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:150, manufacturer:"Carl Douglas", modelName:"Single — 78 kg (1x)",   boatClass:"1x",  category:"racing", lengthM:7.95, widthM:null, hullWeightKg:null, crewMinKg:73,   crewMaxKg:83,  material:"Wood/Kevlar composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:151, manufacturer:"Carl Douglas", modelName:"Single — 85 kg (1x)",   boatClass:"1x",  category:"racing", lengthM:8.1,  widthM:null, hullWeightKg:null, crewMinKg:80,   crewMaxKg:90,  material:"Wood/Kevlar composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:152, manufacturer:"Carl Douglas", modelName:"Single — 92 kg (1x)",   boatClass:"1x",  category:"racing", lengthM:8.2,  widthM:null, hullWeightKg:null, crewMinKg:87,   crewMaxKg:97,  material:"Wood/Kevlar composite", notes:"", dataConfidence:"manufacturer_spec" },
  { id:153, manufacturer:"Carl Douglas", modelName:"Single — 100 kg+ (1x)", boatClass:"1x",  category:"racing", lengthM:8.35, widthM:null, hullWeightKg:null, crewMinKg:95,   crewMaxKg:null,material:"Wood/Kevlar composite", notes:"Super-heavyweight hull.", dataConfidence:"manufacturer_spec" },
  { id:154, manufacturer:"Carl Douglas", modelName:"Double (2x)",            boatClass:"2x",  category:"racing", lengthM:10.4, widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Wood/Kevlar composite", notes:"Six hull sizes available (as per singles); contact for specific size. Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:155, manufacturer:"Carl Douglas", modelName:"Sweep Pair (2-)",        boatClass:"2-",  category:"racing", lengthM:10.4, widthM:null, hullWeightKg:null, crewMinKg:null, crewMaxKg:null, material:"Wood/Kevlar composite", notes:"Six hull sizes available. Length estimated.", dataConfidence:"manufacturer_spec" },

  // ── Resolute Racing Shells ────────────────────────────────────────────────
  // Source: Bristol, RI, USA. Carbon/Nomex honeycomb construction. Founded by former
  // America's Cup hull designers. Website (resoluteracing.com) now redirects to
  // sykes.com.au after acquisition, but Resolute hulls remain in club fleets.
  // Published length/width specs were never posted publicly; class-typical values used.
  { id:156, manufacturer:"Resolute Racing Shells", modelName:"Single — LW (<59 kg)",    boatClass:"1x",  category:"racing", lengthM:7.6,  widthM:null, hullWeightKg:14, crewMinKg:null, crewMaxKg:59,  material:"Carbon/Nomex honeycomb", notes:"Lightweight single. Resolute 'Z-hull' design. Dimensions estimated; no public spec sheet.", dataConfidence:"manufacturer_spec" },
  { id:157, manufacturer:"Resolute Racing Shells", modelName:"Single — M (60–79 kg)",   boatClass:"1x",  category:"racing", lengthM:8.0,  widthM:null, hullWeightKg:14, crewMinKg:60,   crewMaxKg:79,  material:"Carbon/Nomex honeycomb", notes:"Middleweight single. Resolute 'Z-hull' design.", dataConfidence:"manufacturer_spec" },
  { id:158, manufacturer:"Resolute Racing Shells", modelName:"Single — HW (80 kg+)",    boatClass:"1x",  category:"racing", lengthM:8.2,  widthM:null, hullWeightKg:14, crewMinKg:80,   crewMaxKg:null,material:"Carbon/Nomex honeycomb", notes:"Heavyweight single.", dataConfidence:"manufacturer_spec" },
  { id:159, manufacturer:"Resolute Racing Shells", modelName:"Double (2x)",              boatClass:"2x",  category:"racing", lengthM:10.4, widthM:null, hullWeightKg:27, crewMinKg:null, crewMaxKg:null,material:"Carbon/Nomex honeycomb", notes:"Length estimated; contact for hull size options.", dataConfidence:"manufacturer_spec" },
  { id:160, manufacturer:"Resolute Racing Shells", modelName:"Coxless Pair (2-)",        boatClass:"2-",  category:"racing", lengthM:10.4, widthM:null, hullWeightKg:27, crewMinKg:null, crewMaxKg:null,material:"Carbon/Nomex honeycomb", notes:"Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:161, manufacturer:"Resolute Racing Shells", modelName:"Quad (4x)",                boatClass:"4x",  category:"racing", lengthM:13.4, widthM:null, hullWeightKg:52, crewMinKg:null, crewMaxKg:null,material:"Carbon/Nomex honeycomb", notes:"Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:162, manufacturer:"Resolute Racing Shells", modelName:"Coxless Four (4-)",        boatClass:"4-",  category:"racing", lengthM:13.4, widthM:null, hullWeightKg:52, crewMinKg:null, crewMaxKg:null,material:"Carbon/Nomex honeycomb", notes:"Features coxswain hammock option per factory tour. Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:163, manufacturer:"Resolute Racing Shells", modelName:"Coxed Four (4+)",          boatClass:"4+",  category:"racing", lengthM:13.4, widthM:null, hullWeightKg:55, crewMinKg:null, crewMaxKg:null,material:"Carbon/Nomex honeycomb", notes:"Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:164, manufacturer:"Resolute Racing Shells", modelName:"Eight (8+)",               boatClass:"8+",  category:"racing", lengthM:17.4, widthM:null, hullWeightKg:96, crewMinKg:null, crewMaxKg:null,material:"Carbon/Nomex honeycomb", notes:"Length estimated.", dataConfidence:"manufacturer_spec" },

  // ── Swift Racing — doubles, fours, eights ─────────────────────────────────────
  // Source: swiftracing.com product pages. Singles (ids 60-68) already in DB.
  // Lengths converted from cm. Hull weights: ~27kg (2x), ~52kg (4x), ~96kg (8+).
  // "Wing rigger only" models marked with * in Swift's model codes.

  // Doubles / pairs
  { id:208, manufacturer:"Swift Racing", modelName:"221-* (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.26,  widthM:null, hullWeightKg:27, crewMinKg:50,  crewMaxKg:65,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:209, manufacturer:"Swift Racing", modelName:"211L- (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.40,  widthM:null, hullWeightKg:27, crewMinKg:55,  crewMaxKg:65,  material:"Carbon (Cobra/Elite/Club)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:210, manufacturer:"Swift Racing", modelName:"222-* (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.43,  widthM:null, hullWeightKg:27, crewMinKg:60,  crewMaxKg:75,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:211, manufacturer:"Swift Racing", modelName:"211H- (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.40,  widthM:null, hullWeightKg:27, crewMinKg:65,  crewMaxKg:75,  material:"Carbon (Cobra/Elite/Club)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:212, manufacturer:"Swift Racing", modelName:"223-* (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.58,  widthM:null, hullWeightKg:27, crewMinKg:70,  crewMaxKg:85,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:213, manufacturer:"Swift Racing", modelName:"224-* (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.70,  widthM:null, hullWeightKg:27, crewMinKg:75,  crewMaxKg:90,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:214, manufacturer:"Swift Racing", modelName:"225-* (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.78,  widthM:null, hullWeightKg:27, crewMinKg:85,  crewMaxKg:100, material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:215, manufacturer:"Swift Racing", modelName:"226-* (2x/-)",  boatClass:"2x/2-", category:"racing", lengthM:9.95,  widthM:null, hullWeightKg:27, crewMinKg:90,  crewMaxKg:105, material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },

  // Coxless fours / quads
  { id:216, manufacturer:"Swift Racing", modelName:"421A (4x/-)",   boatClass:"4x/4-", category:"racing", lengthM:11.43, widthM:null, hullWeightKg:52, crewMinKg:50,  crewMaxKg:60,  material:"Carbon (Club A)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:217, manufacturer:"Swift Racing", modelName:"422 (4x/-)",    boatClass:"4x/4-", category:"racing", lengthM:11.75, widthM:null, hullWeightKg:52, crewMinKg:60,  crewMaxKg:75,  material:"Carbon (Cobra/Elite/Club)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:218, manufacturer:"Swift Racing", modelName:"423A (4x/-)",   boatClass:"4x/4-", category:"racing", lengthM:11.75, widthM:null, hullWeightKg:52, crewMinKg:65,  crewMaxKg:80,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:219, manufacturer:"Swift Racing", modelName:"426 (4x/-)",    boatClass:"4x/4-", category:"racing", lengthM:11.85, widthM:null, hullWeightKg:52, crewMinKg:70,  crewMaxKg:85,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:220, manufacturer:"Swift Racing", modelName:"424 (4x/-)",    boatClass:"4x/4-", category:"racing", lengthM:11.94, widthM:null, hullWeightKg:52, crewMinKg:80,  crewMaxKg:95,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:221, manufacturer:"Swift Racing", modelName:"408- (4x/-)",   boatClass:"4x/4-", category:"racing", lengthM:12.60, widthM:null, hullWeightKg:52, crewMinKg:90,  crewMaxKg:105, material:"Carbon (Cobra/Elite/Club)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:222, manufacturer:"Swift Racing", modelName:"425 (4x/-)",    boatClass:"4x/4-", category:"racing", lengthM:12.72, widthM:null, hullWeightKg:52, crewMinKg:90,  crewMaxKg:105, material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },

  // Coxed fours / quads
  { id:223, manufacturer:"Swift Racing", modelName:"423A+ (4+)",    boatClass:"4+",    category:"racing", lengthM:11.75, widthM:null, hullWeightKg:51, crewMinKg:50,  crewMaxKg:65,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:224, manufacturer:"Swift Racing", modelName:"426+ (4+)",     boatClass:"4+",    category:"racing", lengthM:11.85, widthM:null, hullWeightKg:51, crewMinKg:55,  crewMaxKg:70,  material:"Carbon (Cobra/Elite/Club)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:225, manufacturer:"Swift Racing", modelName:"424+ (4+)",     boatClass:"4+",    category:"racing", lengthM:11.94, widthM:null, hullWeightKg:51, crewMinKg:60,  crewMaxKg:75,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:226, manufacturer:"Swift Racing", modelName:"408+ (4+)",     boatClass:"4+",    category:"racing", lengthM:12.60, widthM:null, hullWeightKg:51, crewMinKg:75,  crewMaxKg:90,  material:"Carbon (Cobra/Elite/Club)", notes:"", dataConfidence:"manufacturer_spec" },
  { id:227, manufacturer:"Swift Racing", modelName:"425+ (4+)",     boatClass:"4+",    category:"racing", lengthM:12.72, widthM:null, hullWeightKg:51, crewMinKg:75,  crewMaxKg:90,  material:"Carbon (Cobra/Elite/Club)", notes:"Wing rigger only.", dataConfidence:"manufacturer_spec" },

  // Eights
  { id:228, manufacturer:"Swift Racing", modelName:"808+ (8+)",     boatClass:"8+",    category:"racing", lengthM:16.00, widthM:null, hullWeightKg:96, crewMinKg:50,  crewMaxKg:65,  material:"Carbon (Club A, aluminum back rigger)", notes:"Lightest available eight; Club A grade only.", dataConfidence:"manufacturer_spec" },
  { id:229, manufacturer:"Swift Racing", modelName:"821+ (8+)",     boatClass:"8+",    category:"racing", lengthM:16.85, widthM:null, hullWeightKg:96, crewMinKg:65,  crewMaxKg:80,  material:"Carbon (Cobra/Elite), wing rigger", notes:"", dataConfidence:"manufacturer_spec" },
  { id:230, manufacturer:"Swift Racing", modelName:"822+ (8+)",     boatClass:"8+",    category:"racing", lengthM:17.00, widthM:null, hullWeightKg:96, crewMinKg:75,  crewMaxKg:90,  material:"Carbon (Cobra/Elite), wing rigger", notes:"", dataConfidence:"manufacturer_spec" },
  { id:231, manufacturer:"Swift Racing", modelName:"823+ (8+)",     boatClass:"8+",    category:"racing", lengthM:17.60, widthM:null, hullWeightKg:96, crewMinKg:85,  crewMaxKg:100, material:"Carbon (Cobra/Elite), wing rigger", notes:"", dataConfidence:"manufacturer_spec" },

  // ── Janousek & Stampfli ───────────────────────────────────────────────────────
  // Source: janousekandstampfli.com. Janousek = glass fibre/carbon outer; Stampfli = full prepreg carbon.
  // Both brands use same hull shapes. Singles have one listed length per shape (multiple crew-weight sizes
  // are offered but per-size lengths not published). Fours listed length is the nominal hull length.
  // Eights: length estimated at ~17.4m (Karlisch-based S8 shape).

  // Singles
  { id:232, manufacturer:"Janousek & Stampfli", modelName:"A1 (1x)",         boatClass:"1x",    category:"racing",       lengthM:7.9,  widthM:null, hullWeightKg:14, crewMinKg:null, crewMaxKg:80,  material:"Prepreg carbon/glass honeycomb (Stampfli carbon)", notes:"Lightweight shape, deeper profile, good rough-water capability. Wing rigger only.", dataConfidence:"manufacturer_spec" },
  { id:233, manufacturer:"Janousek & Stampfli", modelName:"X1 (1x)",         boatClass:"1x",    category:"racing",       lengthM:8.1,  widthM:null, hullWeightKg:14, crewMinKg:null, crewMaxKg:110, material:"Prepreg carbon/glass honeycomb (Stampfli carbon)", notes:"Teardrop shape; more volume in stern than bow, added stability at front.", dataConfidence:"manufacturer_spec" },
  { id:234, manufacturer:"Janousek & Stampfli", modelName:"S1 (1x)",         boatClass:"1x",    category:"racing",       lengthM:8.2,  widthM:null, hullWeightKg:14, crewMinKg:null, crewMaxKg:110, material:"Prepreg carbon/glass honeycomb (Stampfli carbon)", notes:"Classic Stampfli shape; thinnest and least resistant.", dataConfidence:"manufacturer_spec" },
  { id:235, manufacturer:"Janousek & Stampfli", modelName:"FISA Single (1x)",boatClass:"1x",    category:"racing",       lengthM:8.0,  widthM:null, hullWeightKg:14, crewMinKg:null, crewMaxKg:110, material:"Prepreg carbon/glass honeycomb", notes:"FISA standard hull shape; full weight range. Length estimated.", dataConfidence:"manufacturer_spec" },

  // Doubles / pairs — VEB hull per janousekandstampfli.com search result (~9.9m for HW)
  { id:236, manufacturer:"Janousek & Stampfli", modelName:"VEB 2x/2- (LW)",  boatClass:"2x/2-", category:"racing",       lengthM:9.4,  widthM:null, hullWeightKg:27, crewMinKg:null, crewMaxKg:80,  material:"Prepreg carbon/glass honeycomb", notes:"VEB hull shape, lightweight variant. Length estimated.", dataConfidence:"estimated" },
  { id:237, manufacturer:"Janousek & Stampfli", modelName:"VEB 2x/2- (HW)",  boatClass:"2x/2-", category:"racing",       lengthM:9.9,  widthM:null, hullWeightKg:27, crewMinKg:80,  crewMaxKg:110, material:"Prepreg carbon/glass honeycomb", notes:"VEB hull shape; published 9.9m length for heavyweight variant.", dataConfidence:"manufacturer_spec" },

  // Fours / quads
  { id:238, manufacturer:"Janousek & Stampfli", modelName:"Short FISA 4x/- (LW)", boatClass:"4x/4-", category:"racing", lengthM:11.8, widthM:null, hullWeightKg:52, crewMinKg:null, crewMaxKg:80,  material:"Prepreg carbon/glass honeycomb", notes:"Developed at FISA's request as lightweight standard. Available as coxless four or quad.", dataConfidence:"manufacturer_spec" },
  { id:239, manufacturer:"Janousek & Stampfli", modelName:"VEB 4x/-/+ (std)", boatClass:"4x/4-", category:"racing",    lengthM:12.85,widthM:null, hullWeightKg:52, crewMinKg:null, crewMaxKg:110, material:"Prepreg carbon/glass honeycomb", notes:"Most popular design; coxless/coxed/bow-coxed variants available.", dataConfidence:"manufacturer_spec" },
  { id:240, manufacturer:"Janousek & Stampfli", modelName:"S4 4x/-/+ (long)", boatClass:"4x/4-", category:"racing",    lengthM:13.07,widthM:null, hullWeightKg:52, crewMinKg:null, crewMaxKg:110, material:"Prepreg carbon/glass honeycomb (Stampfli carbon wing option)", notes:"Classic long four; thinnest and least resistant shape.", dataConfidence:"manufacturer_spec" },

  // Eights
  { id:241, manufacturer:"Janousek & Stampfli", modelName:"S8 (8+)",          boatClass:"8+",    category:"racing",       lengthM:17.4, widthM:null, hullWeightKg:96, crewMinKg:60,  crewMaxKg:95,  material:"Prepreg carbon/glass honeycomb", notes:"Based on Karlisch shape; available as eight or eight/octuple convertible with 50/50 split. Length estimated.", dataConfidence:"estimated" },

  // ── Van Dusen ADVANTAGE (Composite Engineering) ───────────────────────────────
  // Source: composite-eng.com/rowing-shells-van-dusen/shell-models/
  // ADVANTAGE series in production since 1992. Hull IDs are internal mould numbers.
  // Dimensions converted from ft/in and in. Hull weights not published; class-typical used.

  { id:242, manufacturer:"Van Dusen",  modelName:"ADVANTAGE Flyweight (1x)",   boatClass:"1x",    category:"racing", lengthM:7.67,  widthM:0.243, hullWeightKg:14, crewMinKg:null, crewMaxKg:70,  material:"Carbon/Kevlar composite", notes:"Hull ID 20000. WLL 25.15 ft, BWL 9.58 in. Crew up to 155 lbs.", dataConfidence:"manufacturer_spec" },
  { id:243, manufacturer:"Van Dusen",  modelName:"ADVANTAGE Lightweight (1x)",  boatClass:"1x",    category:"racing", lengthM:7.92,  widthM:0.245, hullWeightKg:14, crewMinKg:64,  crewMaxKg:79,  material:"Carbon/Kevlar composite", notes:"Hull ID 14000. WLL 25.98 ft, BWL 9.64 in. Crew 140-175 lbs.", dataConfidence:"manufacturer_spec" },
  { id:244, manufacturer:"Van Dusen",  modelName:"ADVANTAGE Heavyweight (1x)",  boatClass:"1x",    category:"racing", lengthM:8.08,  widthM:0.264, hullWeightKg:14, crewMinKg:75,  crewMaxKg:100, material:"Carbon/Kevlar composite", notes:"Hull ID 16000. WLL 26.49 ft, BWL 10.38 in. Crew 165-220 lbs.", dataConfidence:"manufacturer_spec" },
  { id:245, manufacturer:"Van Dusen",  modelName:"ADVANTAGE Lightweight (2x/2-)",boatClass:"2x/2-",category:"racing", lengthM:9.92,  widthM:0.342, hullWeightKg:27, crewMinKg:59,  crewMaxKg:84,  material:"Carbon/Kevlar composite", notes:"Hull ID 17000. WLL 32.54 ft, BWL 13.46 in. Crew 130-185 lbs.", dataConfidence:"manufacturer_spec" },
  { id:246, manufacturer:"Van Dusen",  modelName:"ADVANTAGE Heavyweight (2x/2-)",boatClass:"2x/2-",category:"racing", lengthM:10.22, widthM:0.358, hullWeightKg:27, crewMinKg:77,  crewMaxKg:109, material:"Carbon/Kevlar composite", notes:"Hull ID 18000. WLL 33.53 ft, BWL 14.11 in. Crew 170-240 lbs.", dataConfidence:"manufacturer_spec" },

  // ── Peinert Boat Works ────────────────────────────────────────────────────────
  // Source: peinert.com/boats.html. Mattapoisett, MA, USA. Singles and recreational only.
  // Phantom = ultralight carbon; Peinert = fiberglass/composite construction.
  // Dimensions converted from ft/in and inches.

  { id:247, manufacturer:"Peinert Boat Works", modelName:"Phantom 25 (1x)",   boatClass:"1x",    category:"racing",       lengthM:7.70, widthM:0.251, hullWeightKg:11.3, crewMinKg:null, crewMaxKg:77,  material:"Ultralight carbon", notes:"LOA 25'3\", beam 9.9\". Hull ≤25 lbs. Crew up to 170 lbs.", dataConfidence:"manufacturer_spec" },
  { id:248, manufacturer:"Peinert Boat Works", modelName:"Phantom 26 (1x)",   boatClass:"1x",    category:"racing",       lengthM:8.00, widthM:0.279, hullWeightKg:14,   crewMinKg:73,   crewMaxKg:100, material:"Ultralight carbon", notes:"LOA 26'3\", beam 11\". Crew 160-220 lbs.", dataConfidence:"manufacturer_spec" },
  { id:249, manufacturer:"Peinert Boat Works", modelName:"Peinert 25 (1x)",   boatClass:"1x",    category:"racing",       lengthM:7.70, widthM:0.251, hullWeightKg:13.4, crewMinKg:null, crewMaxKg:77,  material:"Fiberglass/carbon composite", notes:"LOA 25'3\", beam 9.9\". Hull 29-30.5 lbs. Crew up to 170 lbs.", dataConfidence:"manufacturer_spec" },
  { id:250, manufacturer:"Peinert Boat Works", modelName:"Peinert 26 (1x)",   boatClass:"1x",    category:"racing",       lengthM:8.00, widthM:0.279, hullWeightKg:14.4, crewMinKg:73,   crewMaxKg:100, material:"Fiberglass/carbon composite", notes:"LOA 26'3\", beam 11\". Hull 31-32.5 lbs. Crew 160-220 lbs.", dataConfidence:"manufacturer_spec" },
  { id:251, manufacturer:"Peinert Boat Works", modelName:"Zephyr (1x)",       boatClass:"1x",    category:"recreational", lengthM:5.72, widthM:0.559, hullWeightKg:19.5, crewMinKg:null, crewMaxKg:null,material:"Fiberglass", notes:"LOA 18'9\", beam 22\". Hull 42-47 lbs. Stable novice/family/open-water boat.", dataConfidence:"manufacturer_spec" },

  // ── Fluidesign ───────────────────────────────────────────────────────────────
  // Source: rowfluidesign.com (London, Ontario, Canada; est. 1999). rowfluidesign.com
  // blocks automated fetches; specs below combine search-result snippets with class-typical
  // estimates for per-size dimensions not otherwise published.
  // Models: FluidMax (all-carbon, bow-mount carbon rigger), FluidElite (12k 2v2 carbon,
  // aluminum rigger), FluidCarbon (carbon/aramid blend), Fluid Classic (entry carbon).
  // All share the same hull shapes per size class.
  // Singles: 5 hull sizes confirmed; LW fits "115-145 lbs" (52-66 kg) per search results.
  //   Per-size lengths not published; estimated from doubles pattern + class norms.
  // Doubles: 3 sizes with published waterline lengths; beams estimated from "11.5-13 in" range.
  // Quads/Fours: convertible 4x/4- in one hull; coxed 4+/4x+ also available.
  //   Dimensions not published; estimated from class norms.

  // Singles (5 hull sizes; LW/SLW estimated ~7.7m, LW ~7.9m, MW ~8.1m, HW ~8.3m, SHW ~8.5m)
  { id:252, manufacturer:"Fluidesign", modelName:"1x — Super Lightweight",  boatClass:"1x",    category:"racing", lengthM:7.70,  widthM:null, hullWeightKg:14, crewMinKg:null, crewMaxKg:52,  material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"Smallest hull size (SLW). Crew up to ~115 lbs. Length estimated from class norms.", dataConfidence:"estimated" },
  { id:289, manufacturer:"Fluidesign", modelName:"1x — Lightweight",        boatClass:"1x",    category:"racing", lengthM:7.90,  widthM:null, hullWeightKg:14, crewMinKg:52,  crewMaxKg:66,  material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"LW hull. Crew 115-145 lbs per Fluidesign spec. Length estimated.", dataConfidence:"estimated" },
  { id:290, manufacturer:"Fluidesign", modelName:"1x — Midweight",          boatClass:"1x",    category:"racing", lengthM:8.10,  widthM:null, hullWeightKg:14, crewMinKg:66,  crewMaxKg:82,  material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"MW hull (~145-180 lbs). Length estimated.", dataConfidence:"estimated" },
  { id:291, manufacturer:"Fluidesign", modelName:"1x — Heavyweight",        boatClass:"1x",    category:"racing", lengthM:8.30,  widthM:null, hullWeightKg:14, crewMinKg:82,  crewMaxKg:100, material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"HW hull (~180-220 lbs). Length estimated.", dataConfidence:"estimated" },
  { id:292, manufacturer:"Fluidesign", modelName:"1x — Super Heavyweight",  boatClass:"1x",    category:"racing", lengthM:8.50,  widthM:null, hullWeightKg:14, crewMinKg:100, crewMaxKg:null,material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"Largest hull size (SHW, 220+ lbs). Length estimated.", dataConfidence:"estimated" },

  // Doubles / pairs (3 sizes; lengths from rowfluidesign.com search snippet)
  { id:253, manufacturer:"Fluidesign", modelName:"2x/2- — Lightweight",     boatClass:"2x/2-", category:"racing", lengthM:9.14,  widthM:0.292, hullWeightKg:27, crewMinKg:null, crewMaxKg:64,  material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"30 ft WLL. Crew up to 64 kg/seat. Beam estimated from published 11.5-13 in range.", dataConfidence:"manufacturer_spec" },
  { id:254, manufacturer:"Fluidesign", modelName:"2x/2- — Midweight",       boatClass:"2x/2-", category:"racing", lengthM:9.73,  widthM:0.305, hullWeightKg:27, crewMinKg:64,  crewMaxKg:82,  material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"31'11\" WLL. Crew 64-82 kg/seat.", dataConfidence:"manufacturer_spec" },
  { id:293, manufacturer:"Fluidesign", modelName:"2x/2- — Heavyweight",     boatClass:"2x/2-", category:"racing", lengthM:10.11, widthM:0.330, hullWeightKg:27, crewMinKg:82,  crewMaxKg:null,material:"Carbon (FluidMax/FluidElite/FluidCarbon/Classic hull)", notes:"33'2\" WLL. Crew 82+ kg/seat.", dataConfidence:"manufacturer_spec" },

  // Coxless four/quad (convertible 4x↔4- hull; one size)
  { id:294, manufacturer:"Fluidesign", modelName:"4x/4- (convertible)",     boatClass:"4x/4-", category:"racing", lengthM:13.4,  widthM:null, hullWeightKg:52, crewMinKg:null, crewMaxKg:null,material:"Carbon (FluidMax/FluidElite hull)", notes:"Convertible between 4x and 4- rigging in minutes. Dimensions estimated from class norm.", dataConfidence:"estimated" },

  // Coxed four/quad (coxed version of same hull platform)
  { id:295, manufacturer:"Fluidesign", modelName:"4x+/4+ (coxed)",          boatClass:"4+",    category:"racing", lengthM:13.7,  widthM:null, hullWeightKg:55, crewMinKg:null, crewMaxKg:null,material:"Carbon (FluidMax/FluidElite/FluidCarbon hull)", notes:"Coxed variants available in FluidMax, FluidElite, and FluidCarbon grades. Dimensions estimated.", dataConfidence:"estimated" },

  // ── Maas Boat Company ─────────────────────────────────────────────────────────
  // Source: maasboats.com. Cape Cod, MA. Open-water and club-racing design;
  // flared hull for extra stability on rough water. Dimensions from product pages.
  // Converted: 1 ft = 0.3048 m, 1 in = 0.0254 m, 1 lb = 0.4536 kg.

  { id:255, manufacturer:"Maas Boat Company", modelName:"Flyweight (1x)",   boatClass:"1x",  category:"recreational", lengthM:7.34,  widthM:0.305, hullWeightKg:17.3, crewMinKg:null, crewMaxKg:66,  material:"Carbon fiber / fiberglass composite", notes:"LOA 24'1\", BWL 12\", beam at washbox 16.5\". Fully rigged 37-39 lbs. Open-water racer, crew up to 140-145 lbs.", dataConfidence:"manufacturer_spec" },
  { id:256, manufacturer:"Maas Boat Company", modelName:"Maas 24 (1x)",     boatClass:"1x",  category:"recreational", lengthM:7.32,  widthM:0.356, hullWeightKg:19.0, crewMinKg:null, crewMaxKg:109, material:"Carbon fiber / fiberglass composite", notes:"LOA 24', BWL 14\", deck beam 20\". Fully rigged 41-43 lbs. Open-water racer, crew up to 240 lbs.", dataConfidence:"manufacturer_spec" },
  { id:257, manufacturer:"Maas Boat Company", modelName:"Double (2x)",       boatClass:"2x",  category:"recreational", lengthM:9.45,  widthM:0.375, hullWeightKg:31.8, crewMinKg:null, crewMaxKg:109, material:"Carbon fiber / fiberglass composite", notes:"LOA 31', BWL 14.75\", max beam 22.5\". Hull 70-72 lbs. Combined crew up to 480 lbs.", dataConfidence:"manufacturer_spec" },

  // ── Sykes Racing — doubles, fours, eights ────────────────────────────────────
  // Source: sykes.com.au. Australian manufacturer founded 1966; mould numbers per product pages.
  // Pairs and doubles share the same hull platform (interchangeable rigger sets).
  // Lengths not published; class-typical estimates used.

  // Pairs / doubles
  { id:258, manufacturer:"Sykes Racing", modelName:"Mould 213 (2x/2-)",  boatClass:"2x/2-", category:"racing", lengthM:9.40,  widthM:null, hullWeightKg:27, crewMinKg:60,  crewMaxKg:70,  material:"Carbon (Accelerator/Classic/Elite/Carbon)", notes:"Mould 213. Lightest pair/double hull. Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:259, manufacturer:"Sykes Racing", modelName:"Mould 214 (2x/2-)",  boatClass:"2x/2-", category:"racing", lengthM:9.70,  widthM:null, hullWeightKg:27, crewMinKg:70,  crewMaxKg:80,  material:"Carbon (Accelerator/Classic/Elite/Carbon)", notes:"Mould 214. Most popular pair/double hull. Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:260, manufacturer:"Sykes Racing", modelName:"Mould 223 (2x/2-)",  boatClass:"2x/2-", category:"racing", lengthM:9.90,  widthM:null, hullWeightKg:27, crewMinKg:80,  crewMaxKg:95,  material:"Carbon (Classic/Elite)", notes:"Mould 223. Heavyweight pair/double. Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:261, manufacturer:"Sykes Racing", modelName:"Mould 224 (2x/2-)",  boatClass:"2x/2-", category:"racing", lengthM:10.00, widthM:null, hullWeightKg:27, crewMinKg:85,  crewMaxKg:100, material:"Carbon (Classic/Elite/Carbon)", notes:"Mould 224. Super-heavyweight pair/double. Length estimated.", dataConfidence:"manufacturer_spec" },

  // Eights — 5th-generation moulds
  { id:262, manufacturer:"Sykes Racing", modelName:"Mould 857 (8+)",      boatClass:"8+",    category:"racing", lengthM:16.85, widthM:null, hullWeightKg:96, crewMinKg:60,  crewMaxKg:75,  material:"Carbon (Accelerator/Classic/Elite)", notes:"Mould 857. 5th-gen eight, lightweight crew. Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:263, manufacturer:"Sykes Racing", modelName:"Mould 858 (8+)",      boatClass:"8+",    category:"racing", lengthM:17.17, widthM:null, hullWeightKg:96, crewMinKg:70,  crewMaxKg:85,  material:"Carbon (Accelerator/Classic/Elite)", notes:"Mould 858. 5th-gen eight; designed around 187 lb (85 kg) midpoint. Length estimated.", dataConfidence:"manufacturer_spec" },
  { id:264, manufacturer:"Sykes Racing", modelName:"Mould 859 (8+)",      boatClass:"8+",    category:"racing", lengthM:17.50, widthM:null, hullWeightKg:96, crewMinKg:80,  crewMaxKg:100, material:"Carbon (Accelerator/Classic/Elite)", notes:"Mould 859. 5th-gen eight, heavyweight crew. Length estimated.", dataConfidence:"manufacturer_spec" },

  // ── Kanghua ───────────────────────────────────────────────────────────────────
  // Source: kanghua.co.uk/specifications/. Hangzhou, China; official World Rowing supplier.
  // Specs page gives length and beam ranges per class across all size variants.
  // Beam figures are the manufacturer's published max-beam range (coaming level, not waterline).
  // Entries added per class at lightweight (min length) and heavyweight (max length) endpoints.

  // Singles
  { id:265, manufacturer:"Kanghua", modelName:"1x — Lightweight",       boatClass:"1x",    category:"racing", lengthM:7.54,  widthM:0.395, hullWeightKg:14,   crewMinKg:50,  crewMaxKg:65,  material:"Carbon composite", notes:"Published range 7,540-8,330 mm, beam 395-495 mm. LW end.", dataConfidence:"manufacturer_spec" },
  { id:266, manufacturer:"Kanghua", modelName:"1x — Heavyweight",       boatClass:"1x",    category:"racing", lengthM:8.33,  widthM:0.495, hullWeightKg:14,   crewMinKg:85,  crewMaxKg:100, material:"Carbon composite", notes:"Published range 7,540-8,330 mm. HW end.", dataConfidence:"manufacturer_spec" },

  // Doubles / pairs
  { id:267, manufacturer:"Kanghua", modelName:"2x/2- — Lightweight",    boatClass:"2x/2-", category:"racing", lengthM:9.07,  widthM:0.505, hullWeightKg:27,   crewMinKg:50,  crewMaxKg:65,  material:"Carbon composite", notes:"Published range 9,070-9,920 mm, beam 505-550 mm. LW end.", dataConfidence:"manufacturer_spec" },
  { id:268, manufacturer:"Kanghua", modelName:"2x/2- — Heavyweight",    boatClass:"2x/2-", category:"racing", lengthM:9.92,  widthM:0.550, hullWeightKg:27,   crewMinKg:85,  crewMaxKg:100, material:"Carbon composite", notes:"Published range 9,070-9,920 mm. HW end.", dataConfidence:"manufacturer_spec" },

  // Quads / coxless fours
  { id:269, manufacturer:"Kanghua", modelName:"4x/4- — Lightweight",    boatClass:"4x/4-", category:"racing", lengthM:11.78, widthM:0.550, hullWeightKg:52,   crewMinKg:65,  crewMaxKg:80,  material:"Carbon composite", notes:"Published range 11,780-12,720 mm, beam 550-580 mm. LW end.", dataConfidence:"manufacturer_spec" },
  { id:270, manufacturer:"Kanghua", modelName:"4x/4- — Heavyweight",    boatClass:"4x/4-", category:"racing", lengthM:12.72, widthM:0.580, hullWeightKg:53,   crewMinKg:85,  crewMaxKg:105, material:"Carbon composite", notes:"Published range 11,780-12,720 mm. HW end.", dataConfidence:"manufacturer_spec" },

  // Coxed quads / fours
  { id:271, manufacturer:"Kanghua", modelName:"4x+/4+ — Lightweight",   boatClass:"4+",    category:"racing", lengthM:11.78, widthM:0.550, hullWeightKg:53,   crewMinKg:50,  crewMaxKg:70,  material:"Carbon composite", notes:"Published range 11,780-12,720 mm, beam 550-580 mm.", dataConfidence:"manufacturer_spec" },
  { id:272, manufacturer:"Kanghua", modelName:"4x+/4+ — Heavyweight",   boatClass:"4+",    category:"racing", lengthM:12.72, widthM:0.580, hullWeightKg:53,   crewMinKg:75,  crewMaxKg:95,  material:"Carbon composite", notes:"Published range 11,780-12,720 mm.", dataConfidence:"manufacturer_spec" },

  // Eights
  { id:273, manufacturer:"Kanghua", modelName:"8+/8x — Lightweight",    boatClass:"8+",    category:"racing", lengthM:16.29, widthM:0.670, hullWeightKg:96.5, crewMinKg:65,  crewMaxKg:80,  material:"Carbon composite", notes:"Published range 16,290-17,620 mm, beam 670-690 mm. Hull 96.5-110 kg.", dataConfidence:"manufacturer_spec" },
  { id:274, manufacturer:"Kanghua", modelName:"8+/8x — Heavyweight",    boatClass:"8+",    category:"racing", lengthM:17.62, widthM:0.690, hullWeightKg:110,  crewMinKg:85,  crewMaxKg:100, material:"Carbon composite", notes:"Published range 16,290-17,620 mm. HW end.", dataConfidence:"manufacturer_spec" },

  // Kanghua Phoenix Touring series
  { id:275, manufacturer:"Kanghua", modelName:"Phoenix Touring 1x",      boatClass:"1x",    category:"touring", lengthM:6.17, widthM:0.500, hullWeightKg:24.5, crewMinKg:65,  crewMaxKg:100, material:"Carbon composite, reinforced", notes:"Touring/recreational single. LOA 6,170 mm, beam 500 mm.", dataConfidence:"manufacturer_spec" },
  { id:276, manufacturer:"Kanghua", modelName:"Phoenix Touring 2x",      boatClass:"2x",    category:"touring", lengthM:7.70, widthM:0.570, hullWeightKg:40,   crewMinKg:65,  crewMaxKg:100, material:"Carbon composite, reinforced", notes:"Touring double. LOA 7,700 mm, beam 570 mm.", dataConfidence:"manufacturer_spec" },
  { id:277, manufacturer:"Kanghua", modelName:"Phoenix Touring 4x+",     boatClass:"4+",    category:"touring", lengthM:10.75,widthM:0.810, hullWeightKg:75,   crewMinKg:65,  crewMaxKg:100, material:"Carbon composite, reinforced", notes:"Touring coxed quad. LOA 10,750 mm, beam 810 mm.", dataConfidence:"manufacturer_spec" },

  // ── BBG Bootsmanufaktur Berlin ────────────────────────────────────────────────
  // Source: baumgarten-bootsbau.de (distributor). Berlin, Germany. East German heritage
  // manufacturer; reorganised 2016. Training and club racing shells.
  // Racing (Olympia X / Champion X) dimensions not publicly listed; training shells below.

  { id:278, manufacturer:"BBG", modelName:"Training Single Medium (1x)", boatClass:"1x",    category:"racing", lengthM:7.94,  widthM:0.270, hullWeightKg:18,   crewMinKg:65,  crewMaxKg:85,  material:"Carbon-Kevlar", notes:"BBG1-85. LOA 7.94 m, beam 27 cm. Club/recreational training single.", dataConfidence:"manufacturer_spec" },
  { id:279, manufacturer:"BBG", modelName:"Olympia X (1x)",              boatClass:"1x",    category:"racing", lengthM:8.10,  widthM:null,  hullWeightKg:14,   crewMinKg:null, crewMaxKg:100, material:"All-carbon", notes:"OX series; full-carbon elite racing single. Dimensions not publicly listed; length estimated.", dataConfidence:"estimated" },
  { id:280, manufacturer:"BBG", modelName:"Champion X (1x)",             boatClass:"1x",    category:"racing", lengthM:8.10,  widthM:null,  hullWeightKg:14,   crewMinKg:null, crewMaxKg:100, material:"All-carbon", notes:"CX series; club racing single, slightly heavier than OX. Dimensions not publicly listed; length estimated.", dataConfidence:"estimated" },

  // ── Kaschper Racing Shells — doubles, quads, eights ───────────────────────────
  // Source: kaschper.com. Lucan, Ontario. Two construction lines: Raven and Extreme.
  // Singles (ids 125-130) and XTM Eight (id 131) already in DB.
  // Doubles/quad/eight lengths estimated from class norms; no public spec sheet.

  { id:281, manufacturer:"Kaschper", modelName:"Double/Pair — LW (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.4,  widthM:null, hullWeightKg:27, crewMinKg:null, crewMaxKg:72,  material:"3K & Unidirectional carbon, honeycomb", notes:"Raven/Extreme layup. Lightweight class. Dimensions estimated; contact for per-size specs.", dataConfidence:"estimated" },
  { id:282, manufacturer:"Kaschper", modelName:"Double/Pair — HW (2x/2-)", boatClass:"2x/2-", category:"racing", lengthM:9.9,  widthM:null, hullWeightKg:27, crewMinKg:72,  crewMaxKg:null,material:"3K & Unidirectional carbon, honeycomb", notes:"Raven/Extreme layup. Heavyweight class. Dimensions estimated.", dataConfidence:"estimated" },
  { id:283, manufacturer:"Kaschper", modelName:"Quad — LW (4x/4-)",        boatClass:"4x/4-", category:"racing", lengthM:11.8, widthM:null, hullWeightKg:52, crewMinKg:null, crewMaxKg:72,  material:"3K & Unidirectional carbon, honeycomb", notes:"Raven/Extreme layup. Lightweight class. Dimensions estimated.", dataConfidence:"estimated" },
  { id:284, manufacturer:"Kaschper", modelName:"Quad — HW (4x/4-)",        boatClass:"4x/4-", category:"racing", lengthM:13.0, widthM:null, hullWeightKg:52, crewMinKg:72,  crewMaxKg:null,material:"3K & Unidirectional carbon, honeycomb", notes:"Raven/Extreme layup. Heavyweight class. Dimensions estimated.", dataConfidence:"estimated" },
  { id:285, manufacturer:"Kaschper", modelName:"Eight Raven (8+)",          boatClass:"8+",    category:"racing", lengthM:17.4, widthM:0.572, hullWeightKg:96, crewMinKg:null, crewMaxKg:null,material:"3K & Unidirectional carbon, honeycomb", notes:"Raven construction. Beam from published XTM spec (22.5 in). Length estimated.", dataConfidence:"estimated" },
  { id:286, manufacturer:"Kaschper", modelName:"Eight Extreme (8+)",        boatClass:"8+",    category:"racing", lengthM:17.4, widthM:0.572, hullWeightKg:90, crewMinKg:null, crewMaxKg:null,material:"Infused carbon skins, proprietary lightweight core", notes:"Extreme construction: lighter/stiffer than Raven. T-Wing rigger, Reactiv SS bearing seat.", dataConfidence:"estimated" },

  // ── Little River Marine ───────────────────────────────────────────────────────
  // Source: littlerivermarine.com. Cape Cod, MA. Recreational open-water sculling shells.
  // All models are 1x only; designed for coastal and sheltered-water rowing.

  { id:287, manufacturer:"Little River Marine", modelName:"Regatta (1x)",   boatClass:"1x",    category:"recreational", lengthM:6.38, widthM:0.483, hullWeightKg:14.1, crewMinKg:null, crewMaxKg:102, material:"Carbon composite", notes:"LOA 20'11\", LWL 20'4\", BWL 19\", beam at coaming 22\". Unrigged ~31 lbs. Crew up to 225 lbs.", dataConfidence:"manufacturer_spec" },
  { id:288, manufacturer:"Little River Marine", modelName:"Cambridge (1x)", boatClass:"1x",    category:"recreational", lengthM:6.38, widthM:0.533, hullWeightKg:15.0, crewMinKg:null, crewMaxKg:null,material:"Carbon composite", notes:"LOA 20'11\", LWL 20'4\", BWL 21\", beam at coaming 25\". Unrigged ~33 lbs. Open-water design.", dataConfidence:"manufacturer_spec" },
];

export const MANUFACTURERS = [...new Set(SHELL_DB.map(s => s.manufacturer))].sort();

export function getModels(manufacturer: string): ShellRecord[] {
  return SHELL_DB.filter(s => s.manufacturer === manufacturer);
}

export function filterByCrewWeight(shells: ShellRecord[], avgCrewWeightKg: number): ShellRecord[] {
  return shells.filter(s => {
    if (s.crewMinKg == null && s.crewMaxKg == null) return true;
    const min = s.crewMinKg ?? 0;
    const max = s.crewMaxKg ?? 999;
    return avgCrewWeightKg >= min && avgCrewWeightKg <= max;
  });
}

// Rowing seats implied by a class string ("4x/4-" → 4, "8+" → 8, "coastal 2x" → 2).
export function seatsOf(boatClass: string): number {
  const m = boatClass.match(/(\d)/);
  return m ? Number(m[1]) : 1;
}

// Max-beam estimate (m) for shells whose maker doesn't publish beam.
// Anchored on real published beams (Filippi Formtabelle, Empacher, Pocock):
// beam scales with seat count and, within a class, with per-seat crew weight.
// [beam at ≤55 kg/seat, beam at ≥105 kg/seat] per seat count:
const BEAM_RANGE: Record<number, [number, number]> = {
  1: [0.260, 0.296],
  2: [0.330, 0.397],
  4: [0.403, 0.480],
  6: [0.500, 0.560],
  8: [0.544, 0.600],
};

export function estimateWidthM(shell: ShellRecord): number {
  if (shell.widthM != null) return shell.widthM;
  const seats = seatsOf(shell.boatClass);
  // Coastal / adaptive hulls are far wider than flat-water shells
  if (/coastal/i.test(shell.boatClass) || shell.category === 'coastal') {
    return seats >= 4 ? 1.30 : seats === 2 ? 1.00 : 0.75;
  }
  if (/adaptive|PR[12]/i.test(shell.boatClass) || shell.category === 'adaptive') {
    return seats === 2 ? 0.515 : 0.51;
  }
  const [lo, hi] = BEAM_RANGE[seats] ?? BEAM_RANGE[1];
  const avg = shell.crewMinKg != null && shell.crewMaxKg != null
    ? (shell.crewMinKg + shell.crewMaxKg) / 2
    : (shell.crewMinKg ?? shell.crewMaxKg ?? 80);
  const t = Math.max(0, Math.min(1, (avg - 55) / 50));  // 55…105 kg/seat → 0…1
  return +(lo + (hi - lo) * t).toFixed(3);
}

// Total on-water crew load (kg) implied by a shell's crew-weight rating.
export function crewLoadKg(shell: ShellRecord): number {
  const avg = shell.crewMinKg != null && shell.crewMaxKg != null
    ? (shell.crewMinKg + shell.crewMaxKg) / 2
    : (shell.crewMinKg ?? shell.crewMaxKg ?? 80);
  return Math.round(avg * seatsOf(shell.boatClass));
}
