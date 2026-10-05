import { albumColor } from '../domain/palette';
export function extractAlbumColor(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { image.onload = null; image.onerror = null; reject(new Error('Image timeout')); }, 12000);
    image.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
        const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
        context.drawImage(image, 0, 0, 32, 32); resolve(albumColor(context.getImageData(0, 0, 32, 32).data));
      } catch (error) { reject(error); }
    };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Image unavailable')); }; image.src = url;
  });
}
