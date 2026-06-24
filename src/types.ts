export interface Boat {
  id: string;
  name: string;
  manufacturer?: string;
  boatClass: string;
  lengthM: number;
  widthM: number;
  weightKg: number;
  guest?: boolean;   // true = visiting/guest boat, undefined/false = home/club boat
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
  tiers: TierDef[];        // ordered top → bottom
  towerGroups: TowerGroup[];
  axles: AxleDef[];
}
