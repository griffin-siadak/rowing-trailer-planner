// Parametric hull shape. Curves are control-point values at fixed stations
// running bow (index 0) → stern (last), see STATIONS in boatShape.ts.
export interface BoatShape {
  beam: number[];          // half-beam (m) at each station — the plan-view outline
  depth: number[];         // hull depth (m, sheer→keel) at each station
  rocker: number[];        // keel rise (m) above its lowest point at each station
  riggingWidthM: number;   // rigger span/spread (m); stored — riggers travel de-rigged so unused in packing
  boatType: 'sweep' | 'scull';
  loadKg: number;          // crew + equipment load (on-water; not carried on the trailer)
  pitchLateralDeg: number; // oarlock lateral pitch — metadata, does not affect packing
  pitchSternDeg: number;   // oarlock stern pitch — metadata, does not affect packing
}

// Paint scheme + markings, editable per boat. Defaults derive from the
// manufacturer's real-world colours.
export interface BoatLivery {
  hullColor: string;
  deckColor: string;
  stripeColor: string;
  gunwaleStripeM: number;  // stripe height just below the gunwale (m); 0 = none
  spineStripeM: number;    // stripe width along the deck spine (m); 0 = none
  showName: boolean;       // paint the boat's name on both sides of the bow
  namePosM: number;        // decal centre, metres aft of the bow tip
  nameHeightM: number;     // decal text height (m)
  nameColor: string;
}

export interface Boat {
  id: string;
  name: string;
  manufacturer?: string;
  boatClass: string;
  lengthM: number;   // LOA (length overall)
  widthM: number;    // max beam (kept in sync with 2 × max(shape.beam))
  weightKg: number;  // hull weight — what the trailer actually carries
  guest?: boolean;   // true = visiting/guest boat, undefined/false = home/club boat
  shape?: BoatShape;
  livery?: BoatLivery;
}

export interface BoatPlacement {
  id: string;
  boatId: string;
  tier: number;
  xM: number;        // lateral centre from trailer centreline (0 = centre)
  zCenterM: number;  // longitudinal centre from trailer centre (0 = midpoint)
  slung?: boolean;
}

// One horizontal rack level. Index 0 = top tier, last = bottom tier.
export interface TierDef {
  id: string;
  heightM: number;     // vertical spacing between this tier and the one below it
  railWidthM: number;  // lateral width spanned by this tier's pad/rail
}

// A transverse frame of vertical posts at one point along the trailer length.
export interface TowerGroup {
  id: string;
  zPosM: number;       // longitudinal position (0 = bed centre, + = front/bow)
  postXs: number[];    // lateral X of each post (0 = centreline); 1–2 posts
  postWidthM: number;  // post thickness (m)
}

// A road axle carrying two wheels.
export interface AxleDef {
  id: string;
  zPosM: number;        // longitudinal position (0 = bed centre, + = front)
  trackWidthM: number;  // outboard distance between the two wheels (m)
  wheelDiaM: number;    // wheel diameter (m)
}

export interface Trailer {
  id: string;
  name: string;
  bedLengthM: number;
  trailerWidthM: number;   // overall frame / tray width
  tongueLengthM: number;
  beamWidthM: number;      // chassis side-beam tube width
  beamSpacingM: number;    // lateral spacing between the two chassis side-beams (centre-to-centre)
  trayHeightM: number;     // height of the U-tray wall above the deck floor (independent of the bottom tier)
  tiers: TierDef[];        // ordered top → bottom
  towerGroups: TowerGroup[];
  axles: AxleDef[];
}
