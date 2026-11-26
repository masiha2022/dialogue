import React from 'react';
import {
  Award,
  Ban,
  Bird,
  Bomb,
  BookOpen,
  Briefcase,
  Cat,
  Clapperboard,
  Coins,
  Compass,
  Crosshair,
  Crown,
  Dog,
  Eye,
  Feather,
  Fingerprint,
  Flame,
  Flashlight,
  Footprints,
  Gavel,
  Gem,
  Ghost,
  Glasses,
  Handshake,
  HeartCrack,
  HeartPulse,
  Hourglass,
  Key,
  Link,
  Lock,
  Martini,
  Megaphone,
  Moon,
  Radar,
  Radio,
  Scale,
  ScrollText,
  Search,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  Sun,
  Sword,
  Swords,
  Syringe,
  Target,
  Trophy,
  User,
  UserCheck,
  UserX,
  VenetianMask,
  WandSparkles,
  Wind,
  Zap,
} from 'lucide-react';
import { BuiltInRoleIconName, RoleIconName } from '../types/game';

export interface RoleIconOption {
  name: BuiltInRoleIconName;
  label: string;
}

export const ROLE_ICON_OPTIONS: RoleIconOption[] = [
  { name: 'crown', label: 'رئیس' },
  { name: 'skull', label: 'مافیا' },
  { name: 'venetian-mask', label: 'نقاب' },
  { name: 'search', label: 'کارآگاه' },
  { name: 'heart-pulse', label: 'پزشک' },
  { name: 'crosshair', label: 'اسنایپر' },
  { name: 'shield', label: 'زره‌پوش' },
  { name: 'shield-alert', label: 'محافظ' },
  { name: 'bomb', label: 'بمب‌گذار' },
  { name: 'scale', label: 'بازپرس' },
  { name: 'gavel', label: 'قاضی' },
  { name: 'eye', label: 'ناظر' },
  { name: 'lock', label: 'گروگان‌گیر' },
  { name: 'key', label: 'کلیددار' },
  { name: 'swords', label: 'شکارچی' },
  { name: 'sword', label: 'شمشیر' },
  { name: 'flame', label: 'افسونگر' },
  { name: 'wand-sparkles', label: 'ساحر' },
  { name: 'sparkles', label: 'جان‌سخت' },
  { name: 'megaphone', label: 'مذاکره' },
  { name: 'moon', label: 'گرگینه' },
  { name: 'sun', label: 'شهردار' },
  { name: 'ghost', label: 'جاسوس' },
  { name: 'zap', label: 'الکترو' },
  { name: 'feather', label: 'افشاگر' },
  { name: 'link', label: 'دوقلو' },
  { name: 'book-open', label: 'عالم' },
  { name: 'scroll-text', label: 'وصیت' },
  { name: 'gem', label: 'گنج' },
  { name: 'coins', label: 'رشوه' },
  { name: 'compass', label: 'ردیاب' },
  { name: 'target', label: 'هدف' },
  { name: 'syringe', label: 'سم‌ساز' },
  { name: 'radio', label: 'بی‌سیم' },
  { name: 'radar', label: 'رادار' },
  { name: 'footprints', label: 'تعقیب' },
  { name: 'hourglass', label: 'زمان' },
  { name: 'fingerprint', label: 'هویت‌یاب' },
  { name: 'flashlight', label: 'نورانداز' },
  { name: 'glasses', label: 'عینک' },
  { name: 'briefcase', label: 'وکیل' },
  { name: 'handshake', label: 'پیمان' },
  { name: 'heart-crack', label: 'خیانت' },
  { name: 'martini', label: 'کازینو' },
  { name: 'clapperboard', label: 'کارگردان' },
  { name: 'bird', label: 'کلاغ' },
  { name: 'cat', label: 'گربه' },
  { name: 'dog', label: 'سگ' },
  { name: 'wind', label: 'سایه' },
  { name: 'ban', label: 'ساکت' },
  { name: 'award', label: 'مدال' },
  { name: 'trophy', label: 'قهرمان' },
  { name: 'user-check', label: 'معتمد' },
  { name: 'user-x', label: 'تبعیدی' },
  { name: 'user', label: 'شهروند' },
];

export interface RoleEmojiPreset {
  emoji: string;
  label: string;
}

export const ROLE_EMOJI_PRESETS: RoleEmojiPreset[] = [
  { emoji: '🕵️', label: 'کارآگاه' },
  { emoji: '🎩', label: 'پدرخوانده' },
  { emoji: '🕶️', label: 'مامور' },
  { emoji: '🎭', label: 'دوچهره' },
  { emoji: '🥷', label: 'نینجا' },
  { emoji: '🧛', label: 'خون‌آشام' },
  { emoji: '🧙', label: 'جادوگر' },
  { emoji: '👑', label: 'رئیس' },
  { emoji: '💀', label: 'جمجمه' },
  { emoji: '👻', label: 'روح' },
  { emoji: '🐺', label: 'گرگینه' },
  { emoji: '🦊', label: 'روباه' },
  { emoji: '🦉', label: 'جغد' },
  { emoji: '🦇', label: 'خفاش' },
  { emoji: '🦅', label: 'عقاب' },
  { emoji: '🐍', label: 'مار' },
  { emoji: '🦂', label: 'عقرب' },
  { emoji: '🕷️', label: 'عنکبوت' },
  { emoji: '🔪', label: 'چاقو' },
  { emoji: '🗡️', label: 'خنجر' },
  { emoji: '⚔️', label: 'شمشیر' },
  { emoji: '🛡️', label: 'سپر' },
  { emoji: '🔫', label: 'اسنایپر' },
  { emoji: '🎯', label: 'هدف' },
  { emoji: '💣', label: 'بمب' },
  { emoji: '🧨', label: 'دینامیت' },
  { emoji: '💉', label: 'سم' },
  { emoji: '🧪', label: 'معجون' },
  { emoji: '🩺', label: 'پزشک' },
  { emoji: '🔮', label: 'پیشگو' },
  { emoji: '⚖️', label: 'عدالت' },
  { emoji: '📜', label: 'طومار' },
  { emoji: '🗝️', label: 'کلید' },
  { emoji: '🔒', label: 'قفل' },
  { emoji: '⛓️', label: 'زنجیر' },
  { emoji: '💎', label: 'الماس' },
  { emoji: '🪙', label: 'سکه' },
  { emoji: '💰', label: 'گنج' },
  { emoji: '🥂', label: 'ضیافت' },
  { emoji: '🥃', label: 'نوآر' },
  { emoji: '🌙', label: 'شب' },
  { emoji: '☀️', label: 'خورشید' },
  { emoji: '⚡', label: 'صاعقه' },
  { emoji: '🔥', label: 'آتش' },
  { emoji: '❄️', label: 'یخ' },
  { emoji: '👁️', label: 'چشم' },
  { emoji: '🧠', label: 'نابغه' },
  { emoji: '🫀', label: 'قلب' },
  { emoji: '🩸', label: 'خون' },
  { emoji: '🧩', label: 'معما' },
  { emoji: '🃏', label: 'جوکر' },
  { emoji: '🎲', label: 'تاس' },
  { emoji: '🎙️', label: 'میکروفن' },
  { emoji: '📻', label: 'بی‌سیم' },
  { emoji: '🔦', label: 'چراغ' },
  { emoji: '⏳', label: 'زمان' },
  { emoji: '🧭', label: 'قطب‌نما' },
  { emoji: '🪶', label: 'کلاغ' },
  { emoji: '👮', label: 'کلانتر' },
  { emoji: '🎪', label: 'سیرک' },
];

export async function compressRoleIconImage(file: File): Promise<RoleIconName> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image'));
    el.src = dataUrl;
  });

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return `img:${dataUrl}`;
  }

  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

  const webp = canvas.toDataURL('image/webp', 0.85);
  return `img:${webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png')}`;
}

interface RoleIconProps {
  name?: RoleIconName;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

function getEmojiFontSizeClass(className: string): string {
  if (className.includes('w-12') || className.includes('w-11') || className.includes('w-10')) {
    return 'text-4xl';
  }
  if (className.includes('w-8') || className.includes('w-7') || className.includes('w-6')) {
    return 'text-2xl';
  }
  if (className.includes('w-5')) {
    return 'text-lg';
  }
  if (className.includes('w-3.5') || className.includes('w-3')) {
    return 'text-sm';
  }
  return 'text-base';
}

export const RoleIcon: React.FC<RoleIconProps> = ({
  name = 'shield',
  className = 'w-5 h-5',
  style,
  strokeWidth = 2,
}) => {
  if (name.startsWith('emoji:')) {
    const symbol = name.slice('emoji:'.length).trim() || '🎭';
    return (
      <span
        aria-hidden="true"
        className={`${className} ${getEmojiFontSizeClass(className)} inline-flex items-center justify-center leading-none select-none`}
        style={style}
      >
        {symbol}
      </span>
    );
  }

  if (name.startsWith('img:')) {
    const src = name.slice('img:'.length);
    return (
      <img
        src={src}
        alt=""
        className={`${className} rounded-lg object-cover select-none`}
      />
    );
  }

  const props = { className, style, strokeWidth };

  switch (name) {
    case 'crown':
      return <Crown {...props} />;
    case 'skull':
      return <Skull {...props} />;
    case 'search':
      return <Search {...props} />;
    case 'heart-pulse':
      return <HeartPulse {...props} />;
    case 'crosshair':
      return <Crosshair {...props} />;
    case 'shield':
      return <Shield {...props} />;
    case 'shield-alert':
      return <ShieldAlert {...props} />;
    case 'venetian-mask':
      return <VenetianMask {...props} />;
    case 'bomb':
      return <Bomb {...props} />;
    case 'user':
      return <User {...props} />;
    case 'user-check':
      return <UserCheck {...props} />;
    case 'user-x':
      return <UserX {...props} />;
    case 'eye':
      return <Eye {...props} />;
    case 'scale':
      return <Scale {...props} />;
    case 'swords':
      return <Swords {...props} />;
    case 'sword':
      return <Sword {...props} />;
    case 'lock':
      return <Lock {...props} />;
    case 'flame':
      return <Flame {...props} />;
    case 'wand-sparkles':
      return <WandSparkles {...props} />;
    case 'sparkles':
      return <Sparkles {...props} />;
    case 'megaphone':
      return <Megaphone {...props} />;
    case 'moon':
      return <Moon {...props} />;
    case 'sun':
      return <Sun {...props} />;
    case 'ghost':
      return <Ghost {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'key':
      return <Key {...props} />;
    case 'gavel':
      return <Gavel {...props} />;
    case 'feather':
      return <Feather {...props} />;
    case 'link':
      return <Link {...props} />;
    case 'book-open':
      return <BookOpen {...props} />;
    case 'scroll-text':
      return <ScrollText {...props} />;
    case 'gem':
      return <Gem {...props} />;
    case 'coins':
      return <Coins {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'target':
      return <Target {...props} />;
    case 'syringe':
      return <Syringe {...props} />;
    case 'radio':
      return <Radio {...props} />;
    case 'radar':
      return <Radar {...props} />;
    case 'footprints':
      return <Footprints {...props} />;
    case 'hourglass':
      return <Hourglass {...props} />;
    case 'fingerprint':
      return <Fingerprint {...props} />;
    case 'flashlight':
      return <Flashlight {...props} />;
    case 'glasses':
      return <Glasses {...props} />;
    case 'briefcase':
      return <Briefcase {...props} />;
    case 'handshake':
      return <Handshake {...props} />;
    case 'heart-crack':
      return <HeartCrack {...props} />;
    case 'martini':
      return <Martini {...props} />;
    case 'clapperboard':
      return <Clapperboard {...props} />;
    case 'bird':
      return <Bird {...props} />;
    case 'cat':
      return <Cat {...props} />;
    case 'dog':
      return <Dog {...props} />;
    case 'wind':
      return <Wind {...props} />;
    case 'ban':
      return <Ban {...props} />;
    case 'award':
      return <Award {...props} />;
    case 'trophy':
      return <Trophy {...props} />;
    default:
      return <Shield {...props} />;
  }
};
