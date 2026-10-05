// Quantize a small image, then choose a frequent hue rather than a hash of its title.
export function albumColor(pixels: ArrayLike<number>): string {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++; bucket.r += r; bucket.g += g; bucket.b += b; buckets.set(key, bucket);
  }
  let best: { count: number; r: number; g: number; b: number } | undefined;
  let score = -1;
  const all = [...buckets.values()];
  const total = all.reduce((sum, bucket) => sum + bucket.count, 0);
  const colorful = all.filter(bucket => {
    const rgb = [bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count];
    return Math.max(...rgb) > 35 && Math.max(...rgb) - Math.min(...rgb) > 50;
  });
  const candidates = colorful.reduce((sum, bucket) => sum + bucket.count, 0) >= total * 0.08 ? colorful : all;
  for (const bucket of candidates) {
    const rgb = [bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count];
    const saturation = (Math.max(...rgb) - Math.min(...rgb)) / 255;
    const weight = bucket.count * (1 + saturation * 1.8);
    if (weight > score) { score = weight; best = bucket; }
  }
  return best ? '#' + [best.r, best.g, best.b].map(value => Math.round(value / best!.count).toString(16).padStart(2, '0')).join('') : '#887565';
}
export function labelInk(hex: string): string {
  const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.32 ? '#1c1c20' : '#fff4e4';
}
// Shared material tones keep the SVG and the 3D object in the same album hue.
export function recordPalette(color:string) {
  const base=/^#[a-f0-9]{6}$/i.test(color)?color:'#887565';
  const mix=(target:number,amount:number)=>'#'+[1,3,5].map(index=>Math.round(parseInt(base.slice(index,index+2),16)*(1-amount)+target*amount).toString(16).padStart(2,'0')).join('');
  const label=mix(255,0.12);
  const rgb=[1,3,5].map(index=>parseInt(label.slice(index,index+2),16)/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
  const luminance=rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
  const ink=(luminance+0.05)/0.05>=1.05/(luminance+0.05)?'#000000':'#ffffff';
  return {base,label,ink,edge:mix(255,0.4),highlight:mix(255,0.65),shadow:mix(0,0.36),back:mix(0,0.18)};
}
