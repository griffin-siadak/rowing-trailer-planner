import type { Boat, BoatLivery } from './types';

// Real-world paint schemes per manufacturer: hull/deck colours plus the
// signature striping where a maker has one (e.g. Filippi's blue lines on
// white, Empacher's black edging on chrome-yellow).
interface LiverySeed {
  hull: string; deck: string; stripe: string;
  gunwale?: number;  // gunwale stripe height (m); default 0 = none
  spine?: number;    // deck spine stripe width (m); default 0 = none
}

const LIVERY_SEEDS: Record<string, LiverySeed> = {
  'Filippi':                 { hull: '#f4f2ec', deck: '#f4f2ec', stripe: '#1a4fa0', gunwale: 0.030, spine: 0.028 },
  'Empacher':                { hull: '#f0c020', deck: '#f0c020', stripe: '#141414', gunwale: 0.025, spine: 0.024 },
  'WinTech Racing':          { hull: '#1555b8', deck: '#0f3e8a', stripe: '#ffffff' },
  'Swift Racing':            { hull: '#8090a0', deck: '#606e7a', stripe: '#e83030' },
  'Pocock Racing Shells':    { hull: '#1c2d60', deck: '#c0c4cc', stripe: '#e8b400' },
  'Vespoli USA':             { hull: '#181818', deck: '#e85000', stripe: '#e85000', gunwale: 0.022 },
  'Hudson Boat Works':       { hull: '#0d2a50', deck: '#1840a0', stripe: '#e02020' },
  'Janousek & Stampfli':     { hull: '#8a9db0', deck: '#b0c2d0', stripe: '#1a4fa0' },
  'Sykes Racing':            { hull: '#e8eaec', deck: '#d4d8dc', stripe: '#187840' },
  'Kaschper':                { hull: '#1a2038', deck: '#2a3460', stripe: '#c0c4cc' },
  'Carl Douglas':            { hull: '#c09030', deck: '#a87020', stripe: '#402808' },
  'Resolute Racing Shells':  { hull: '#1a1a1a', deck: '#2c2c2c', stripe: '#c02030' },
  'Van Dusen':               { hull: '#b8c4cc', deck: '#a0aeb8', stripe: '#c02030' },
  'Fluidesign':              { hull: '#0c1520', deck: '#18283a', stripe: '#30b0e0' },
  'Kanghua':                 { hull: '#c00000', deck: '#f0f0f0', stripe: '#f0f0f0', gunwale: 0.024 },
  'BBG':                     { hull: '#dce4f0', deck: '#c4d0e4', stripe: '#3050a0' },
};

// Perceived luminance → pick a legible name colour for the hull.
function contrastText(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 140 ? '#1e293b' : '#ffffff';
}

export function defaultLivery(manufacturer: string | undefined, fallbackHull: string): BoatLivery {
  const seed = manufacturer ? LIVERY_SEEDS[manufacturer] : undefined;
  const hull = seed?.hull ?? fallbackHull;
  return {
    hullColor: hull,
    deckColor: seed?.deck ?? hull,
    stripeColor: seed?.stripe ?? contrastText(hull),
    gunwaleStripeM: seed?.gunwale ?? 0,
    spineStripeM: seed?.spine ?? 0,
    showName: true,
    namePosM: 0.65,      // decal centre ~26" aft of the bow tip
    nameHeightM: 0.055,
    nameColor: contrastText(hull),
  };
}

// A boat's livery, deriving the manufacturer default if none is stored.
export function liveryOf(boat: Boat, fallbackHull = '#2563eb'): BoatLivery {
  return boat.livery ?? defaultLivery(boat.manufacturer, fallbackHull);
}
