import { DailyQuest, BookGenre } from '../types/game';

interface QuestTemplate {
  templateId: string;
  title: string;
  descriptionTemplate: string;
  questType: DailyQuest['questType'];
  targetCount: number;
  rewardPoints: number;
  rewardRibbons: number;
  genreTarget?: BookGenre;
  targetCombo?: number;
  iconName: string;
}

export const ALL_QUESTS_DAILY_BONUS = {
  deweyPoints: 450,
  gildedRibbons: 4,
};

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    templateId: 'shelve_fiction',
    title: 'Tales of the Shire',
    descriptionTemplate: 'Shelve {target} Fiction & Literature books into the 800s stacks.',
    questType: 'shelve_genre',
    targetCount: 4,
    rewardPoints: 220,
    rewardRibbons: 2,
    genreTarget: 'fiction',
    iconName: 'book',
  },
  {
    templateId: 'shelve_botany',
    title: 'The Herbalist’s Herbarium',
    descriptionTemplate: 'Shelve {target} Botany & Nature folios into the 580s section.',
    questType: 'shelve_genre',
    targetCount: 3,
    rewardPoints: 200,
    rewardRibbons: 2,
    genreTarget: 'botany',
    iconName: 'leaf',
  },
  {
    templateId: 'shelve_astronomy',
    title: 'Starlight Ephemeris',
    descriptionTemplate: 'Shelve {target} Astronomy & Cosmos celestial charts into the 520s stacks.',
    questType: 'shelve_genre',
    targetCount: 3,
    rewardPoints: 220,
    rewardRibbons: 2,
    genreTarget: 'astronomy',
    iconName: 'sparkles',
  },
  {
    templateId: 'shelve_philosophy',
    title: 'Contemplative Solitude',
    descriptionTemplate: 'Shelve {target} Philosophy & Ethics volumes into the 100s shelves.',
    questType: 'shelve_genre',
    targetCount: 3,
    rewardPoints: 240,
    rewardRibbons: 2,
    genreTarget: 'philosophy',
    iconName: 'feather',
  },
  {
    templateId: 'shelve_poetry',
    title: 'Ballads of the Wind',
    descriptionTemplate: 'Shelve {target} Poetry & Verse collections into the 810s alcove.',
    questType: 'shelve_genre',
    targetCount: 3,
    rewardPoints: 210,
    rewardRibbons: 2,
    genreTarget: 'poetry',
    iconName: 'feather',
  },
  {
    templateId: 'shelve_arcane',
    title: 'Lost Monastic Chronicles',
    descriptionTemplate: 'Shelve {target} Arcane History manuscripts into the 900s archive.',
    questType: 'shelve_genre',
    targetCount: 3,
    rewardPoints: 260,
    rewardRibbons: 3,
    genreTarget: 'arcane_history',
    iconName: 'book',
  },
  {
    templateId: 'restore_books',
    title: 'Gold-Leaf Restoration',
    descriptionTemplate: 'Restore and beeswax-rebind {target} delicate antique editions.',
    questType: 'restore_vintage',
    targetCount: 2,
    rewardPoints: 300,
    rewardRibbons: 3,
    iconName: 'sparkles',
  },
  {
    templateId: 'combo_streak',
    title: 'Bibliophile Zen Flow',
    descriptionTemplate: 'Reach a {target}x Combo Multiplier during book shelving.',
    questType: 'reach_combo',
    targetCount: 1,
    targetCombo: 2.5,
    rewardPoints: 280,
    rewardRibbons: 3,
    iconName: 'flame',
  },
  {
    templateId: 'brew_tea',
    title: 'Tea Master’s Kettle',
    descriptionTemplate: 'Brew {target} pots of soothing herbal infusions in the Tea Room.',
    questType: 'brew_tea',
    targetCount: 2,
    rewardPoints: 180,
    rewardRibbons: 2,
    iconName: 'coffee',
  },
  {
    templateId: 'shelve_total',
    title: 'Master of the Stacks',
    descriptionTemplate: 'Catalog and shelve {target} books of any category today.',
    questType: 'shelve_total',
    targetCount: 6,
    rewardPoints: 250,
    rewardRibbons: 2,
    iconName: 'layers',
  },
  {
    templateId: 'tbr_clear',
    title: 'TBR Tower Clearance',
    descriptionTemplate: 'Move {target} unread books from the TBR cart to the sorting desk.',
    questType: 'deliver_tbr',
    targetCount: 2,
    rewardPoints: 190,
    rewardRibbons: 2,
    iconName: 'layers',
  },
  {
    templateId: 'loan_return',
    title: 'Town Patron Register',
    descriptionTemplate: 'Process {target} returned book loans from village patrons.',
    questType: 'collect_loan',
    targetCount: 1,
    rewardPoints: 210,
    rewardRibbons: 2,
    iconName: 'clock',
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function generateDailyQuests(seedDate: string = getTodayDateString()): DailyQuest[] {
  // Simple deterministic hash based on date string so all visits on the same calendar day get consistent quests
  let hash = 0;
  for (let i = 0; i < seedDate.length; i++) {
    hash = (hash << 5) - hash + seedDate.charCodeAt(i);
    hash |= 0;
  }

  // Shuffle copy of templates
  const shuffled = [...QUEST_TEMPLATES].sort((a, b) => {
    const valA = Math.sin(hash + a.templateId.length * 13) * 10000;
    const valB = Math.sin(hash + b.templateId.length * 13) * 10000;
    return (valA - Math.floor(valA)) - (valB - Math.floor(valB));
  });

  // Pick 3 diverse quests (ensure different quest types where possible)
  const selected: QuestTemplate[] = [];
  const usedTypes = new Set<string>();

  for (const t of shuffled) {
    if (!usedTypes.has(t.questType) || selected.length < 3) {
      selected.push(t);
      usedTypes.add(t.questType);
      if (selected.length === 3) break;
    }
  }

  // Fallback if needed
  while (selected.length < 3) {
    selected.push(QUEST_TEMPLATES[selected.length]);
  }

  return selected.map((t, idx) => ({
    id: `quest_${seedDate}_${t.templateId}_${idx}`,
    title: t.title,
    description: t.descriptionTemplate
      .replace('{target}', t.targetCombo ? `${t.targetCombo}x` : t.targetCount.toString()),
    questType: t.questType,
    targetCount: t.targetCount,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardPoints: t.rewardPoints,
    rewardRibbons: t.rewardRibbons,
    genreTarget: t.genreTarget,
    targetCombo: t.targetCombo,
    iconName: t.iconName,
  }));
}

export function rerollQuest(questId: string, currentQuests: DailyQuest[]): DailyQuest | null {
  const existingTypes = new Set(currentQuests.map((q) => q.questType));
  const available = QUEST_TEMPLATES.filter((t) => !existingTypes.has(t.questType));
  const pool = available.length > 0 ? available : QUEST_TEMPLATES;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: `quest_reroll_${Date.now()}_${picked.templateId}`,
    title: picked.title,
    description: picked.descriptionTemplate.replace(
      '{target}',
      picked.targetCombo ? `${picked.targetCombo}x` : picked.targetCount.toString()
    ),
    questType: picked.questType,
    targetCount: picked.targetCount,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardPoints: picked.rewardPoints,
    rewardRibbons: picked.rewardRibbons,
    genreTarget: picked.genreTarget,
    targetCombo: picked.targetCombo,
    iconName: picked.iconName,
  };
}
