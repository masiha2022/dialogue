import { HomeBackdropId } from '../types/game';

export interface HomeBackdropOption {
  id: HomeBackdropId;
  label: string;
  subtitle: string;
}

export const HOME_BACKDROP_OPTIONS: HomeBackdropOption[] = [
  {
    id: 'logo',
    label: 'لوگوی دیالوگ',
    subtitle: 'پیش‌فرض برند',
  },
  {
    id: 'crimson-moon',
    label: 'ماه سرخ',
    subtitle: 'شب مرموز',
  },
  {
    id: 'city-noir',
    label: 'شهر شب',
    subtitle: 'فضای نوآر',
  },
  {
    id: 'spotlight',
    label: 'نور صحنه',
    subtitle: 'مینیمال مدرن',
  },
  {
    id: 'custom',
    label: 'تصویر دلخواه',
    subtitle: 'از گالری',
  },
];

/**
 * Resizes and compresses a selected image file into a lightweight JPEG data URL
 * so it persists reliably offline in localStorage without exceeding quota.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxDimension = 960,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('empty_result'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('decode_failed'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
        const targetW = Math.max(1, Math.round((img.width || 1) * scale));
        const targetH = Math.max(1, Math.round((img.height || 1) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
