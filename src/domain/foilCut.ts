export type FoilCut = { startX: number; width: number; direction: 1 | -1; from: number };
export const CUT_COMPLETE = 0.94;

export function beginFoilCut(x: number, width: number, progress = 0, direction: 1 | -1 = 1): FoilCut | null {
  if (!Number.isFinite(x) || !Number.isFinite(width) || width < 80 || x < 0 || x > width) return null;
  if (progress > 0 && progress < CUT_COMPLETE) {
    const head = width * (direction === 1 ? progress : 1 - progress);
    return Math.abs(x - head) <= width * 0.2 ? {startX:x,width,direction,from:progress} : null;
  }
  const edge = width * 0.2;
  if (x > edge && x < width - edge) return null;
  return { startX: x, width, direction: x <= edge ? 1 : -1, from:0 };
}

export function advanceFoilCut(cut: FoilCut, x: number, drift: number) {
  if (!Number.isFinite(x) || !Number.isFinite(drift) || Math.abs(drift) > 32) return 0;
  const distance = (x - cut.startX) * cut.direction;
  const remaining = cut.direction === 1 ? cut.width - cut.startX : cut.startX;
  return Math.max(cut.from, Math.min(1, cut.from + distance / remaining * (1-cut.from)));
}
