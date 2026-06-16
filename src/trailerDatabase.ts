// ── Rowing Shell Trailer Database ─────────────────────────────────────────────
//
// Sources:
//   MO Trailer Corp.  — motrailers.com/shell-trailers/ (bed lengths, rack counts)
//   Vespoli USA       — vespoli.com/trailers/ (same models as MO)
//   Mackay Trailers   — mackaytrailers.com/aluminium-rowing-shell-series/
//   Trailex           — trailex.com (full dimensions published)
//   Adirondack Rowing — adirondackrowing.com (Trailex reseller, confirmed specs)
//
// dataConfidence values:
//   'manufacturer_spec' — number comes directly from a published spec sheet or page
//   'estimated'         — derived from capacity claims, photos, or class-typical values
//
// Trailer orientation convention (matches 3D visualiser):
//   Z axis  = longitudinal (trailer length / boat bow–stern direction)
//   X axis  = lateral      (side-by-side boat positions)
//   Y axis  = vertical     (tier stacking)
//
// Slot convention:
//   tiers        — vertical rack levels (bottom = tier 0)
//   slotsPerTier — boats sitting side-by-side at each level
//   totalSlots   — tiers × slotsPerTier (some trailers have mixed tiers)

export interface TrailerRecord {
  id: number;
  manufacturer: string;
  modelName: string;
  country: string;
  bedLengthM: number;       // physical trailer frame length (boats may overhang)
  overallLengthM: number;   // including tongue & hitch
  widthM: number;           // trailer deck outer width
  heightM: number;          // height to top of loaded rack structure
  tiers: number;            // vertical rack levels
  slotsPerTier: number;     // boats per level (side by side)
  totalSlots: number;
  maxBoatLengthM: number;   // longest hull it can legally carry (with overhang)
  gvmKg: number | null;     // gross vehicle mass / GVWR
  axles: number;
  material: string;
  notes: string;
  dataConfidence: 'manufacturer_spec' | 'estimated';
}

export const TRAILER_DB: TrailerRecord[] = [

  // ── MO Trailer Corp. ──────────────────────────────────────────────────────
  // Goshen, Indiana, USA. Galvanized steel, Torflex axles, LED lights.
  // Bed lengths confirmed; widths, heights, GVM estimated from US DOT norms.
  // "Racks" = tiers, "Arms" = slots per tier — phrasing used on their site.
  {
    id: 1,
    manufacturer: 'MO Trailer Corp.',
    modelName: '32\' Shell Trailer',
    country: 'USA',
    bedLengthM: 9.75,
    overallLengthM: 11.3,
    widthM: 2.44,
    heightM: 2.44,
    tiers: 2,
    slotsPerTier: 2,
    totalSlots: 4,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 2,
    material: 'Galvanized steel',
    notes: 'Two racks with two arms each. Fits up to 3 fours; customisable for shorter boats. Composite deck flooring.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 2,
    manufacturer: 'MO Trailer Corp.',
    modelName: '36\' Shell Trailer',
    country: 'USA',
    bedLengthM: 10.97,
    overallLengthM: 12.5,
    widthM: 2.44,
    heightM: 2.60,
    tiers: 3,
    slotsPerTier: 3,
    totalSlots: 9,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 2,
    material: 'Galvanized steel',
    notes: 'Three racks with three arms each. Up to 6 eights and 3 fours (9 boats).',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 3,
    manufacturer: 'MO Trailer Corp.',
    modelName: '39\' Shell Trailer',
    country: 'USA',
    bedLengthM: 11.89,
    overallLengthM: 13.4,
    widthM: 2.44,
    heightM: 2.60,
    tiers: 3,
    slotsPerTier: 4,
    totalSlots: 12,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 3,
    material: 'Galvanized steel',
    notes: 'Three racks with four arms each. Up to 9 eights and 3 fours (12 boats).',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 4,
    manufacturer: 'MO Trailer Corp.',
    modelName: '41\' Shell Trailer',
    country: 'USA',
    bedLengthM: 12.50,
    overallLengthM: 14.0,
    widthM: 2.44,
    heightM: 2.74,
    tiers: 3,
    slotsPerTier: 5,
    totalSlots: 15,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 3,
    material: 'Galvanized steel',
    notes: 'Three racks with five arms each. Up to 9 eights and 6 fours (15 boats). Largest standard MO model.',
    dataConfidence: 'manufacturer_spec',
  },

  // ── Vespoli USA ───────────────────────────────────────────────────────────
  // New Haven, CT, USA. Trailers appear identical to MO models in capacity
  // and description; likely same manufacturer or shared supplier.
  {
    id: 5,
    manufacturer: 'Vespoli USA',
    modelName: '32\' Shell Trailer',
    country: 'USA',
    bedLengthM: 9.75,
    overallLengthM: 11.3,
    widthM: 2.44,
    heightM: 2.44,
    tiers: 2,
    slotsPerTier: 2,
    totalSlots: 4,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 2,
    material: 'Galvanized steel',
    notes: 'Up to 3 fours; customisable for shorter boats. Hot-dip galvanized frame, torsion axles.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 6,
    manufacturer: 'Vespoli USA',
    modelName: '36\' Shell Trailer',
    country: 'USA',
    bedLengthM: 10.97,
    overallLengthM: 12.5,
    widthM: 2.44,
    heightM: 2.60,
    tiers: 3,
    slotsPerTier: 3,
    totalSlots: 9,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 2,
    material: 'Galvanized steel',
    notes: 'Up to 6 eights and 3 fours (9 boats).',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 7,
    manufacturer: 'Vespoli USA',
    modelName: '39\' Shell Trailer',
    country: 'USA',
    bedLengthM: 11.89,
    overallLengthM: 13.4,
    widthM: 2.44,
    heightM: 2.60,
    tiers: 3,
    slotsPerTier: 4,
    totalSlots: 12,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 3,
    material: 'Galvanized steel',
    notes: 'Up to 9 eights and 3 fours (12 boats).',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 8,
    manufacturer: 'Vespoli USA',
    modelName: '41\' Shell Trailer',
    country: 'USA',
    bedLengthM: 12.50,
    overallLengthM: 14.0,
    widthM: 2.44,
    heightM: 2.74,
    tiers: 3,
    slotsPerTier: 5,
    totalSlots: 15,
    maxBoatLengthM: 18.9,
    gvmKg: null,
    axles: 3,
    material: 'Galvanized steel',
    notes: 'Up to 9 eights and 6 fours (15 boats). Catwalk, load boxes, powered lifter options.',
    dataConfidence: 'manufacturer_spec',
  },

  // ── Mackay Trailers ───────────────────────────────────────────────────────
  // Shepparton, Victoria, Australia. Aluminium alloy structure with
  // galvanised steel axles, springs, and hardware. Customisable rack count.
  // GVM figures confirmed from their website. Tiers/slots estimated from
  // published boat capacities (e.g. "4 eights + 1 quad").
  {
    id: 9,
    manufacturer: 'Mackay Trailers',
    modelName: 'ALR97-14HD-M',
    country: 'Australia',
    bedLengthM: 9.70,
    overallLengthM: 11.2,
    widthM: 2.50,
    heightM: 2.44,
    tiers: 3,
    slotsPerTier: 2,
    totalSlots: 6,
    maxBoatLengthM: 18.9,
    gvmKg: 1750,
    axles: 1,
    material: 'Aluminium alloy, galvanised steel axle',
    notes: 'Single axle. Mechanical or hydraulic brakes. Rated for 4 eights + 1 quad (5 boats); 2–3 rack positions listed. Aluminium checkerplate flooring.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 10,
    manufacturer: 'Mackay Trailers',
    modelName: 'ALR97T-13-M',
    country: 'Australia',
    bedLengthM: 9.70,
    overallLengthM: 11.2,
    widthM: 2.50,
    heightM: 2.60,
    tiers: 3,
    slotsPerTier: 3,
    totalSlots: 9,
    maxBoatLengthM: 18.9,
    gvmKg: 1999,
    axles: 2,
    material: 'Aluminium alloy, galvanised steel tandem axle',
    notes: 'Tandem axle. Rated for 4 eights + 4 quads (8 boats); 3–4 rack positions listed.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 11,
    manufacturer: 'Mackay Trailers',
    modelName: 'ALR106T-14-M',
    country: 'Australia',
    bedLengthM: 10.60,
    overallLengthM: 12.1,
    widthM: 2.50,
    heightM: 2.60,
    tiers: 3,
    slotsPerTier: 3,
    totalSlots: 9,
    maxBoatLengthM: 18.9,
    gvmKg: 1999,
    axles: 2,
    material: 'Aluminium alloy, galvanised steel tandem axle',
    notes: 'Tandem axle. Rated for 5 eights + 2 quads (7 boats); 3–4 rack positions listed.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 12,
    manufacturer: 'Mackay Trailers',
    modelName: 'ALR106T-14-EB',
    country: 'Australia',
    bedLengthM: 10.60,
    overallLengthM: 12.1,
    widthM: 2.50,
    heightM: 2.90,
    tiers: 4,
    slotsPerTier: 3,
    totalSlots: 12,
    maxBoatLengthM: 18.9,
    gvmKg: 2800,
    axles: 2,
    material: 'Aluminium alloy, electric brake tandem axle',
    notes: 'Electric brakes. Rated for 6 eights + 4 quads (10 boats); 4–5 rack positions listed. Highest GVM Mackay shell model.',
    dataConfidence: 'manufacturer_spec',
  },

  // ── Trailex ───────────────────────────────────────────────────────────────
  // Brookfield, Ohio, USA. Aluminium construction. Small-club / individual use.
  // All dimensions confirmed from trailex.com product pages.
  {
    id: 13,
    manufacturer: 'Trailex',
    modelName: 'SUT-220-S (Spring)',
    country: 'USA',
    bedLengthM: 4.63,
    overallLengthM: 5.60,
    widthM: 1.35,
    heightM: 0.90,
    tiers: 1,
    slotsPerTier: 2,
    totalSlots: 2,
    maxBoatLengthM: 5.18,
    gvmKg: 100,
    axles: 1,
    material: 'Aluminum',
    notes: '220 lb capacity. Spring suspension. Two sculls or kayaks side by side. Lightest trailer in the Trailex range.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 14,
    manufacturer: 'Trailex',
    modelName: 'SUT-220-ST (Torsion)',
    country: 'USA',
    bedLengthM: 4.63,
    overallLengthM: 5.60,
    widthM: 1.35,
    heightM: 0.90,
    tiers: 1,
    slotsPerTier: 2,
    totalSlots: 2,
    maxBoatLengthM: 5.18,
    gvmKg: 100,
    axles: 1,
    material: 'Aluminum',
    notes: '220 lb capacity. Torsion suspension. Same frame as SUT-220-S.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 15,
    manufacturer: 'Trailex',
    modelName: 'SUT-350-ST (Torsion)',
    country: 'USA',
    bedLengthM: 5.64,
    overallLengthM: 6.60,
    widthM: 1.32,
    heightM: 0.90,
    tiers: 1,
    slotsPerTier: 2,
    totalSlots: 2,
    maxBoatLengthM: 6.71,
    gvmKg: 159,
    axles: 1,
    material: 'Aluminum',
    notes: '350 lb capacity. Boats up to 22 ft. Torsion suspension. For longer singles or pairs.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 16,
    manufacturer: 'Trailex',
    modelName: 'UT-1000-6-04 (Low)',
    country: 'USA',
    bedLengthM: 5.31,
    overallLengthM: 6.50,
    widthM: 2.23,
    heightM: 2.03,
    tiers: 2,
    slotsPerTier: 3,
    totalSlots: 6,
    maxBoatLengthM: 7.32,
    gvmKg: 454,
    axles: 1,
    material: 'Aluminum',
    notes: '1000 lb capacity. Holds 6 boats up to 24 ft. Adjustable aluminium crossbars with vinyl protection. Lower profile version.',
    dataConfidence: 'manufacturer_spec',
  },
  {
    id: 17,
    manufacturer: 'Trailex',
    modelName: 'UT-1000-8-04 (Tall)',
    country: 'USA',
    bedLengthM: 5.31,
    overallLengthM: 6.50,
    widthM: 2.23,
    heightM: 2.51,
    tiers: 2,
    slotsPerTier: 3,
    totalSlots: 6,
    maxBoatLengthM: 7.32,
    gvmKg: 454,
    axles: 1,
    material: 'Aluminum',
    notes: '1000 lb capacity. Holds 6 boats up to 24 ft. Taller rack version of the UT-1000-6-04 for larger boats.',
    dataConfidence: 'manufacturer_spec',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export const TRAILER_MANUFACTURERS = [...new Set(TRAILER_DB.map(t => t.manufacturer))].sort();

export function getTrailerModels(manufacturer: string): TrailerRecord[] {
  return TRAILER_DB.filter(t => t.manufacturer === manufacturer);
}

export function getTrailerById(id: number): TrailerRecord | undefined {
  return TRAILER_DB.find(t => t.id === id);
}
