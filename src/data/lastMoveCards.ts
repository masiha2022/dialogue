import { LastMoveCard, SavedRoster } from '../types/game';

export const DEFAULT_LAST_MOVE_CARDS: LastMoveCard[] = [
  {
    id: 'lm-green-mile',
    title: 'مسیر سبز',
    description:
      'بازیکن خروجی یک نفر را انتخاب می‌کند؛ نقش آن فرد فقط برای گرداننده مشخص می‌شود یا در سناریو پدرخوانده بدون استعلام، از خروج امشب مصون می‌ماند (مطابق توافق میز).',
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'lm-handcuffs',
    title: 'دستبند',
    description:
      'بازیکن خروجی دستبند را به یک بازیکن زنده می‌بندد؛ فرد انتخاب‌شده در شب پیشِ‌رو هیچ توانایی شبانه‌ای نخواهد داشت.',
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'lm-identity-reveal',
    title: 'افشای هویت',
    description:
      'بازیکن خروجی نام یک بازیکن زنده را اعلام می‌کند و گرداننده موظف است نقش دقیق یا استعلام مثبت/منفی او را برای جمع افشا کند.',
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'lm-beautiful-mind',
    title: 'ذهن زیبا',
    description:
      'بازیکن خروجی می‌تواند نقش دقیق یک بازیکن (مثلاً نوستراداموس یا زودیاک یا پدرخوانده) را حدس بزند؛ در صورت درست بودن، آن بازیکن بلافاصله از بازی خارج می‌شود و فرد خروجی به بازی برمی‌گردد!',
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'lm-silence-lambs',
    title: 'سکوت بره‌ها',
    description:
      'دو بازیکن زنده به انتخاب فرد خروجی، در روز آینده حق صحبت کردن و دفاع ندارند (یا تا قبل از رأی‌گیری فقط با ایما و اشاره نظر می‌دهند).',
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'lm-final-shot',
    title: 'شلیک نهایی',
    description:
      'تیر شب مافیا به جای شب، در همین لحظه با نظر بازیکن خروجی به یکی از بازیکنان شلیک می‌شود (یا در سناریوی تک‌تیرانداز، شلیک آخر محسوب می‌شود).',
    enabled: false,
    isBuiltIn: true,
  },
  {
    id: 'lm-face-off',
    title: 'تغییر چهره',
    description:
      'بازیکن خروجی کارت نقش خود را به‌صورت مخفیانه با یک بازیکن زنده تعویض می‌کند؛ هر دو نفر از شب بعد با نقش جدید ادامه می‌دهند.',
    enabled: false,
    isBuiltIn: true,
  },
  {
    id: 'lm-lie-redirect',
    title: 'تغییر مسیر رای',
    description:
      'حکم خروج لغو شده و به جای بازیکن فعلی، نفر دومِ دادگاه با بیشترین رأی از بازی خارج می‌شود.',
    enabled: false,
    isBuiltIn: true,
  },
];

export const DEFAULT_ROSTERS: SavedRoster[] = [
  {
    id: 'roster-sample-friends',
    name: 'جمع دوستانه (۱۰ نفر نمونه)',
    players: [
      'علی',
      'سارا',
      'امیر',
      'نیلوفر',
      'رضا',
      'مریم',
      'حسین',
      'نازنین',
      'مهدی',
      'پریسا',
    ],
    updatedAt: 1700000000000,
  },
];
