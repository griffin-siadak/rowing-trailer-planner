export interface Boat {
  id: string;
  name: string;
  manufacturer?: string;
  boatClass: string;
  lengthM: number;
  widthM: number;
  weightKg: number;
  guest?: boolean;   // true = visiting/guest boat, undefined/false = home boat
}

export interface BoatPlacement {
  id: string;
  boatId: string;
  tier: number;
  xM: number;        // lateral centre from trailer centreline (0 = centre)
  zCenterM: number;  // longitudinal centre from trailer centre (0 = midpoint)
  slung?: boolean;
}

export interface TowerGroup {
  id: string;
  count: number;    // 1–4 towers side by side (perpendicular to trailer)
  xCenter: number;  // lateral centre from trailer centreline (m); 0 = dead-centre
}

export interface Trailer {
  id: string;
  name: string;
  bedLengthM: number;
  tiers: number;
  trailerWidthM: number;
  tongueLengthM: number;
  towerGroups: TowerGroup[];
}
