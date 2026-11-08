export type BookGenre =
  | 'fiction'
  | 'philosophy'
  | 'botany'
  | 'astronomy'
  | 'poetry'
  | 'arcane_history';

export type BookRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'vintage'
  | 'mythic';

export type WeatherType = 'clear' | 'soft_rain' | 'falling_leaves' | 'gentle_snow';

export type BookCondition = 'pristine' | 'well_loved' | 'tattered' | 'needs_restoration';

export interface BookItem {
  id: string;
  title: string;
  author: string;
  year: number;
  genre: BookGenre;
  rarity: BookRarity;
  deweyDecimal: string;
  condition: BookCondition;
  spineColor: string;
  accentColor: string;
  lore: string;
  restored: boolean;
  value: number; // Dewey points earned on shelving
  loanStatus?: 'in_library' | 'loaned_out' | 'borrowed_in' | 'tbr';
  loanDueDate?: number;
  borrowerName?: string;
  notes?: string;
}

export interface LibrarianAvatar {
  hairstyle: 'classic_bun' | 'scholar_beret' | 'messy_curls' | 'side_part' | 'wizard_hat' | 'headphones';
  hairColor: string;
  skinTone: string;
  eyewear: 'round_wire' | 'tortoise_shell' | 'half_moon' | 'none';
  outfitStyle: 'cardigan' | 'tweed_vest' | 'scholar_robe' | 'cozy_turtleneck';
  outfitColor: string;
  outfitTrimColor: string;
  accessory: 'cuppa_tea' | 'feather_quill' | 'brass_lantern' | 'vintage_tome';
  name: string;
}

export interface TeaRecipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  ingredients: string[];
  buffType: 'combo_freeze' | 'dewey_boost' | 'rare_chance' | 'patron_tips';
  buffDurationSeconds: number;
  buffValue: number;
}

export interface ActiveTeaBuff {
  recipeId: string;
  name: string;
  buffType: TeaRecipe['buffType'];
  expiresAt: number;
  buffValue: number;
}

export interface Visitor {
  id: string;
  name: string;
  title: string;
  preferredGenre: BookGenre;
  favoriteTea: string;
  avatarSeed: number;
  dialogue: string[];
  thankYouNote?: string;
  hasVisited: boolean;
}

export interface LibraryUpgrade {
  id: string;
  title: string;
  category: 'shelving' | 'tearoom' | 'aesthetics' | 'sanctuary';
  description: string;
  costPoints: number;
  costRibbons: number;
  unlocked: boolean;
  levelRequired: number;
  perkDescription: string;
}

export interface LoanRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  patronName: string;
  dueDate: string;
  daysRemaining: number;
  genre: BookGenre;
  rewardPoints: number;
  rewardRibbons: number;
  state: 'active' | 'overdue' | 'returned';
}

export interface BorrowedInRecord {
  id: string;
  book: BookItem;
  originLibrary: string;
  daysRemaining: number;
  cataloged: boolean;
  rewardPoints: number;
  rewardRibbons: number;
}

export interface GameStats {
  totalBooksShelved: number;
  highestCombo: number;
  vintageBooksRestored: number;
  teasBrewed: number;
  patronsHelped: number;
  libraryLevel: number;
  deweyPoints: number;
  gildedRibbons: number;
  experiencePoints: number;
  nextLevelExp: number;
}

export type QuestType =
  | 'shelve_genre'
  | 'shelve_total'
  | 'restore_vintage'
  | 'reach_combo'
  | 'brew_tea'
  | 'collect_loan'
  | 'deliver_tbr';

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  questType: QuestType;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  rewardPoints: number;
  rewardRibbons: number;
  genreTarget?: BookGenre;
  targetCombo?: number;
  iconName: string;
}

export interface CloudSaveData {
  slotId: number;
  slotName: string;
  timestamp: number;
  stats: GameStats;
  avatar: LibrarianAvatar;
  unlockedUpgradeIds: string[];
  unlockedVintageBookIds: string[];
  inventoryBooks: BookItem[];
  tbrBooks: BookItem[];
  loanedOutRecords: LoanRecord[];
  borrowedInRecords: BorrowedInRecord[];
  activeBuff: ActiveTeaBuff | null;
  timeOfDayHour: number; // 0 to 24 (e.g. 14.5 is 2:30 PM)
  version: number;
  dailyQuests?: DailyQuest[];
  lastQuestDate?: string;
  allQuestsClaimedBonus?: boolean;
}
