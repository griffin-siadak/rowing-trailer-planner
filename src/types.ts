export interface Boat {
  id: string;
  name: string;
  manufacturer?: string;
  boatClass: string;
  lengthM: number;
  widthM: number;
  weightKg: number;
}

export interface BoatPlacement {
  id: string;
  boatId: string;
  tier: number;
  xM: number;        // lateral centre from trailer centreline (0 = centre)
  zCenterM: number;  // longitudinal centre from trailer centre (0 = midpoint)
  slung?: boolean;
}

export interface Trailer {
  id: string;
  name: string;
  bedLengthM: number;
  tiers: number;
  trailerWidthM: number;
  tongueLengthM: number;
  towerCount: number;
}
