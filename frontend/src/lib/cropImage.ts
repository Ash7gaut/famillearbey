import type { Area } from 'react-easy-crop';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Impossible de charger l\'image')));
    image.crossOrigin = 'anonymous';
    image.src = src;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  crop: Area,
  outputSize = 512,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas indisponible');

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Échec du recadrage'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      0.92,
    );
  });
}
