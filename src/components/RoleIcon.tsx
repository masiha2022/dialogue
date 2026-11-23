import React from 'react';
import {
  Bomb,
  BookOpen,
  Compass,
  Crosshair,
  Crown,
  Eye,
  Feather,
  Flame,
  Footprints,
  Gavel,
  Gem,
  Ghost,
  HeartPulse,
  Hourglass,
  Key,
  Link,
  Lock,
  Megaphone,
  Moon,
  Radio,
  Scale,
  Search,
  Shield,
  Skull,
  Sparkles,
  Sun,
  Swords,
  Syringe,
  Target,
  User,
  VenetianMask,
  Zap,
} from 'lucide-react';
import { RoleIconName } from '../types/game';

export interface RoleIconOption {
  name: RoleIconName;
  label: string;
}

export const ROLE_ICON_OPTIONS: RoleIconOption[] = [
  { name: 'crown', label: 'رئیس / فرمانده' },
  { name: 'skull', label: 'مافیا / قاتل' },
  { name: 'venetian-mask', label: 'دزد / شیاد / ناتو' },
  { name: 'search', label: 'کارآگاه / محقق' },
  { name: 'heart-pulse', label: 'پزشک / درمانگر' },
  { name: 'crosshair', label: 'تکاور / اسنایپر' },
  { name: 'shield', label: 'نگهبان / زره‌پوش' },
  { name: 'bomb', label: 'بمب‌گذار / انتحاری' },
  { name: 'scale', label: 'بازپرس / عدالت' },
  { name: 'gavel', label: 'قاضی / دادگاه' },
  { name: 'eye', label: 'پیشگو / ناظر' },
  { name: 'lock', label: 'گروگان‌گیر / قفل' },
  { name: 'key', label: 'کلیددار / زندان‌بان' },
  { name: 'swords', label: 'شکارچی / مبارز' },
  { name: 'flame', label: 'افسونگر / جادوگر' },
  { name: 'sparkles', label: 'جان‌سخت / ویژه' },
  { name: 'megaphone', label: 'مذاکره‌کننده' },
  { name: 'moon', label: 'گرگینه / شب‌خسب' },
  { name: 'sun', label: 'شهردار / روز' },
  { name: 'ghost', label: 'روح / جاسوس مخفی' },
  { name: 'zap', label: 'الکترو / شوک' },
  { name: 'feather', label: 'افشاگر / شاعر' },
  { name: 'link', label: 'هم‌بند / دوقلو' },
  { name: 'book-open', label: 'دانشمند / عالم' },
  { name: 'gem', label: 'ثروتمند / گنج‌یاب' },
  { name: 'compass', label: 'ردیاب / ناخدا' },
  { name: 'target', label: 'هدف‌گیر / حرفه‌ای' },
  { name: 'syringe', label: 'سم‌ساز / پزشک ویژه' },
  { name: 'radio', label: 'بی‌سیم‌چی / رابط' },
  { name: 'footprints', label: 'تعقیب‌گر / سایه' },
  { name: 'hourglass', label: 'عمر / زمان‌دار' },
  { name: 'user', label: 'شهروند / روستایی' },
];

interface RoleIconProps {
  name?: RoleIconName;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

export const RoleIcon: React.FC<RoleIconProps> = ({
  name = 'shield',
  className = 'w-5 h-5',
  style,
  strokeWidth = 2,
}) => {
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
    case 'venetian-mask':
      return <VenetianMask {...props} />;
    case 'bomb':
      return <Bomb {...props} />;
    case 'user':
      return <User {...props} />;
    case 'eye':
      return <Eye {...props} />;
    case 'scale':
      return <Scale {...props} />;
    case 'swords':
      return <Swords {...props} />;
    case 'lock':
      return <Lock {...props} />;
    case 'flame':
      return <Flame {...props} />;
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
    case 'gem':
      return <Gem {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'target':
      return <Target {...props} />;
    case 'syringe':
      return <Syringe {...props} />;
    case 'radio':
      return <Radio {...props} />;
    case 'footprints':
      return <Footprints {...props} />;
    case 'hourglass':
      return <Hourglass {...props} />;
    default:
      return <Shield {...props} />;
  }
};
