export const DISC_RADIUS = { CD: 1.2, VINILO: 1.48 } as const;
export const CD_HUB_RADIUS = 0.36;
export const CD_HOLE_RADIUS = 0.15;
export const CD_PRINT_RADIUS = DISC_RADIUS.CD - 0.026;
export function discArtworkRadius(format: 'CD' | 'VINILO') { return 63 * DISC_RADIUS[format] / DISC_RADIUS.VINILO; }
