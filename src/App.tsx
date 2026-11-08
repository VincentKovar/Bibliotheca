import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CloudSaveData,
  LibrarianAvatar,
  GameStats,
  BookItem,
  BookGenre,
  ActiveTeaBuff,
  TeaRecipe,
  LibraryUpgrade,
  WeatherType,
  DailyQuest,
} from './types/game';
import {
  cloudSaveService,
  createInitialCloudData,
  DEFAULT_AVATAR,
  DEFAULT_STATS,
} from './game/cloudSave';
import { Library3DScene, CameraPreset, StationHit } from './game/three/scene';
import { synthAudio } from './audio/synthAudio';
import { generateRandomBook, VINTAGE_BOOKS_CATALOG } from './game/bookGenerator';
import {
  generateDailyQuests,
  getTodayDateString,
  rerollQuest,
  ALL_QUESTS_DAILY_BONUS,
} from './game/questGenerator';

import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { BookOrganizerModal } from './components/BookOrganizerModal';
import { TBRDeskModal } from './components/TBRDeskModal';
import { TeaRoomModal } from './components/TeaRoomModal';
import { AvatarEditorModal } from './components/AvatarEditorModal';
import { UpgradesModal } from './components/UpgradesModal';
import { VintageCodexModal } from './components/VintageCodexModal';
import { PauseModal } from './components/PauseModal';
import { DailyQuestsModal } from './components/DailyQuestsModal';

export default function App() {
  // Game Shell state
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>('title');
  const [activeModal, setActiveModal] = useState<
    null | 'desk' | 'tbr' | 'tea' | 'vitrine' | 'avatar' | 'upgrades' | 'quests'
  >(null);

  // Active Save Slot & Data
  const [activeSlotId, setActiveSlotId] = useState<number>(cloudSaveService.getActiveSlotId());
  const [saveData, setSaveData] = useState<CloudSaveData>(() => {
    const existing = cloudSaveService.loadSlot(activeSlotId);
    return existing || createInitialCloudData(activeSlotId);
  });

  // Dynamic game runtime stats
  const [stats, setStats] = useState<GameStats>(saveData.stats);
  const [avatar, setAvatar] = useState<LibrarianAvatar>(saveData.avatar);
  const [unlockedUpgradeIds, setUnlockedUpgradeIds] = useState<string[]>(saveData.unlockedUpgradeIds);
  const [unlockedVintageBookIds, setUnlockedVintageBookIds] = useState<string[]>(
    saveData.unlockedVintageBookIds
  );
  const [inventoryBooks, setInventoryBooks] = useState<BookItem[]>(saveData.inventoryBooks);
  const [tbrBooks, setTbrBooks] = useState<BookItem[]>(saveData.tbrBooks);
  const [loanedOutRecords, setLoanedOutRecords] = useState(saveData.loanedOutRecords);
  const [borrowedInRecords, setBorrowedInRecords] = useState(saveData.borrowedInRecords);
  const [activeBuff, setActiveBuff] = useState<ActiveTeaBuff | null>(saveData.activeBuff);
  const [timeOfDayHour, setTimeOfDayHour] = useState<number>(saveData.timeOfDayHour);

  // Daily Quests system state
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(() => {
    const today = getTodayDateString();
    if (saveData.dailyQuests && saveData.lastQuestDate === today) {
      return saveData.dailyQuests;
    }
    return generateDailyQuests(today);
  });
  const [lastQuestDate, setLastQuestDate] = useState<string>(
    () => saveData.lastQuestDate || getTodayDateString()
  );
  const [allQuestsClaimedBonus, setAllQuestsClaimedBonus] = useState<boolean>(
    () => saveData.allQuestsClaimedBonus || false
  );
  const [questToast, setQuestToast] = useState<string | null>(null);

  // Audio, Weather & UI
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoFiPlaying, setIsLoFiPlaying] = useState<boolean>(false);
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('overview');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [autoWeather, setAutoWeather] = useState<boolean>(true);

  // Combo system
  const [comboMultiplier, setComboMultiplier] = useState<number>(1.0);
  const [comboTimer, setComboTimer] = useState<number>(0); // remaining seconds
  const maxComboTime = unlockedUpgradeIds.includes('library_cat') ? 15 : 10;

  // 3D Scene ref
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Library3DScene | null>(null);

  // Cloud status listener
  useEffect(() => {
    return cloudSaveService.onSyncStatusChange((status) => {
      setCloudSyncStatus(status);
    });
  }, []);

  // Station click from 3D scene
  const handleStationClicked = useCallback((hit: StationHit) => {
    synthAudio.playBookPickup();
    if (hit.station === 'desk') {
      setActiveModal('desk');
    } else if (hit.station === 'tbr') {
      setActiveModal('tbr');
    } else if (hit.station === 'tea') {
      setActiveModal('tea');
    } else if (hit.station === 'vitrine') {
      setActiveModal('vitrine');
    } else if (hit.station === 'avatar') {
      setActiveModal('avatar');
    } else if (hit.station === 'bookshelf') {
      setActiveModal('desk');
    } else if (hit.station === 'cat') {
      // Pet the cat!
      synthAudio.playVintageRestoration();
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
    }
  }, []);

  // Initialize 3D Scene once
  useEffect(() => {
    if (!canvasMountRef.current) return;
    if (!sceneRef.current) {
      sceneRef.current = new Library3DScene(
        canvasMountRef.current,
        avatar,
        handleStationClicked
      );
      sceneRef.current.setTimeOfDay(timeOfDayHour);
      sceneRef.current.setWeather(weather);
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, [handleStationClicked]);

  // Update avatar live on 3D character when avatar changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.librarian.updateConfig(avatar);
    }
  }, [avatar]);

  // Relaxing Day-Night continuous slow cycle (24-hour cycle over ~8 minutes of real time)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDayHour((prev) => {
        const nextHour = (prev + 0.04) % 24;
        if (sceneRef.current) {
          sceneRef.current.setTimeOfDay(nextHour);
        }
        return nextHour;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Weather Visual Effects: transitions based on day-night cycle & gentle random chance
  useEffect(() => {
    if (!autoWeather) return;

    const weatherTimer = setInterval(() => {
      const hour = timeOfDayHour;
      let candidates: WeatherType[] = [];

      if (hour >= 5 && hour < 9) {
        // Dawn: fresh morning air with falling leaves or golden clarity
        candidates = ['clear', 'falling_leaves', 'falling_leaves', 'clear'];
      } else if (hour >= 9 && hour < 17) {
        // Crisp afternoon: cozy soft rain on windows, drifting leaves, or clear light
        candidates = ['clear', 'clear', 'soft_rain', 'falling_leaves'];
      } else if (hour >= 17 && hour < 20) {
        // Amber dusk: autumn leaves drifting through warm sunset or soft rain
        candidates = ['falling_leaves', 'falling_leaves', 'soft_rain', 'clear'];
      } else {
        // Midnight Starlight: gentle quiet snowfall or peaceful rain against the hearth
        candidates = ['gentle_snow', 'gentle_snow', 'soft_rain', 'clear'];
      }

      const nextWeather = candidates[Math.floor(Math.random() * candidates.length)];
      setWeather(nextWeather);
      if (sceneRef.current) {
        sceneRef.current.setWeather(nextWeather);
      }
    }, 45000); // Transitions every 45s for dynamic coziness

    return () => clearInterval(weatherTimer);
  }, [autoWeather, timeOfDayHour]);

  // Combo timer countdown tick
  useEffect(() => {
    if (comboMultiplier <= 1.0) return;

    // If tea buff is active with combo_freeze, do not decay!
    if (activeBuff && activeBuff.buffType === 'combo_freeze') return;

    const interval = setInterval(() => {
      setComboTimer((prev) => {
        if (prev <= 0.1) {
          // Combo decayed!
          setComboMultiplier(1.0);
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [comboMultiplier, activeBuff]);

  // Active tea buff expiration check
  useEffect(() => {
    if (!activeBuff) return;
    const interval = setInterval(() => {
      if (Date.now() >= activeBuff.expiresAt) {
        setActiveBuff(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeBuff]);

  // Check for daily quests calendar rollover
  useEffect(() => {
    const checkCalendarDate = () => {
      const today = getTodayDateString();
      if (today !== lastQuestDate) {
        setLastQuestDate(today);
        setDailyQuests(generateDailyQuests(today));
        setAllQuestsClaimedBonus(false);
        setQuestToast('📜 New Daily Quests arrived for today!');
        setTimeout(() => setQuestToast(null), 5000);
      }
    };
    checkCalendarDate();
    const interval = setInterval(checkCalendarDate, 60000);
    return () => clearInterval(interval);
  }, [lastQuestDate]);

  // Record daily quest progress
  const recordQuestProgress = useCallback(
    (
      type: DailyQuest['questType'],
      count: number = 1,
      extra?: { genre?: BookGenre; combo?: number }
    ) => {
      setDailyQuests((prevQuests) => {
        let anyCompletedJustNow = false;
        let completedQuestTitle = '';

        const updated = prevQuests.map((quest) => {
          if (quest.completed || quest.questType !== type) {
            return quest;
          }

          if (type === 'shelve_genre') {
            if (quest.genreTarget && extra?.genre && quest.genreTarget !== extra.genre) {
              return quest;
            }
          }

          if (type === 'reach_combo') {
            if (!extra?.combo || extra.combo < (quest.targetCombo || quest.targetCount)) {
              return quest;
            }
          }

          const nextCount =
            type === 'reach_combo'
              ? quest.targetCount
              : Math.min(quest.targetCount, quest.currentCount + count);

          const isNowCompleted = nextCount >= quest.targetCount;

          if (isNowCompleted && !quest.completed) {
            anyCompletedJustNow = true;
            completedQuestTitle = quest.title;
          }

          return {
            ...quest,
            currentCount: nextCount,
            completed: isNowCompleted,
          };
        });

        if (anyCompletedJustNow) {
          synthAudio.playVintageRestoration();
          confetti({
            particleCount: 50,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#c084fc'],
          });
          setQuestToast(`📜 Quest Complete: "${completedQuestTitle}"!`);
          setTimeout(() => {
            setQuestToast(null);
          }, 4500);
        }

        return updated;
      });
    },
    []
  );

  // Claim single quest reward
  const handleClaimQuestReward = (questId: string) => {
    const quest = dailyQuests.find((q) => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    setDailyQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );

    setStats((prev) => ({
      ...prev,
      deweyPoints: prev.deweyPoints + quest.rewardPoints,
      gildedRibbons: prev.gildedRibbons + quest.rewardRibbons,
      experiencePoints: prev.experiencePoints + Math.round(quest.rewardPoints / 2),
    }));
  };

  // Claim Grand Daily bonus
  const handleClaimAllBonus = () => {
    if (allQuestsClaimedBonus) return;
    const allDone = dailyQuests.length > 0 && dailyQuests.every((q) => q.completed);
    if (!allDone) return;

    setAllQuestsClaimedBonus(true);
    setStats((prev) => ({
      ...prev,
      deweyPoints: prev.deweyPoints + ALL_QUESTS_DAILY_BONUS.deweyPoints,
      gildedRibbons: prev.gildedRibbons + ALL_QUESTS_DAILY_BONUS.gildedRibbons,
      experiencePoints: prev.experiencePoints + 200,
    }));
  };

  // Reroll single quest
  const handleRerollQuest = (questId: string) => {
    const replacement = rerollQuest(questId, dailyQuests);
    if (!replacement) return;

    setDailyQuests((prev) =>
      prev.map((q) => (q.id === questId ? replacement : q))
    );
  };

  // Auto-Save progress to Cloud periodically
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (gameState === 'title') return;

      const currentSave: CloudSaveData = {
        slotId: activeSlotId,
        slotName: `Slot ${activeSlotId} Sanctuary`,
        timestamp: Date.now(),
        stats,
        avatar,
        unlockedUpgradeIds,
        unlockedVintageBookIds,
        inventoryBooks,
        tbrBooks,
        loanedOutRecords,
        borrowedInRecords,
        activeBuff,
        timeOfDayHour,
        dailyQuests,
        lastQuestDate,
        allQuestsClaimedBonus,
        version: 1,
      };

      cloudSaveService.saveToCloud(currentSave);
    }, 18000);

    return () => clearInterval(autoSaveTimer);
  }, [
    gameState,
    activeSlotId,
    stats,
    avatar,
    unlockedUpgradeIds,
    unlockedVintageBookIds,
    inventoryBooks,
    tbrBooks,
    loanedOutRecords,
    borrowedInRecords,
    activeBuff,
    timeOfDayHour,
    dailyQuests,
    lastQuestDate,
    allQuestsClaimedBonus,
  ]);

  // Handle Global Keys (Esc to pause/unpause, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        } else if (gameState === 'playing') {
          synthAudio.playButtonClick();
          setGameState('paused');
        } else if (gameState === 'paused') {
          synthAudio.playButtonClick();
          setGameState('playing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeModal]);

  // Start game from title screen
  const handleStartGame = (slotId: number) => {
    setActiveSlotId(slotId);
    cloudSaveService.setActiveSlotId(slotId);

    const loaded = cloudSaveService.loadSlot(slotId);
    const data = loaded || createInitialCloudData(slotId);

    setSaveData(data);
    setStats(data.stats);
    setAvatar(data.avatar);
    setUnlockedUpgradeIds(data.unlockedUpgradeIds);
    setUnlockedVintageBookIds(data.unlockedVintageBookIds);
    setInventoryBooks(data.inventoryBooks);
    setTbrBooks(data.tbrBooks);
    setLoanedOutRecords(data.loanedOutRecords);
    setBorrowedInRecords(data.borrowedInRecords);
    setActiveBuff(data.activeBuff);
    setTimeOfDayHour(data.timeOfDayHour);

    const today = getTodayDateString();
    if (data.dailyQuests && data.lastQuestDate === today) {
      setDailyQuests(data.dailyQuests);
      setLastQuestDate(data.lastQuestDate);
      setAllQuestsClaimedBonus(data.allQuestsClaimedBonus || false);
    } else {
      setDailyQuests(generateDailyQuests(today));
      setLastQuestDate(today);
      setAllQuestsClaimedBonus(false);
    }

    if (sceneRef.current) {
      sceneRef.current.librarian.updateConfig(data.avatar);
      sceneRef.current.setTimeOfDay(data.timeOfDayHour);
      sceneRef.current.setCameraPreset('overview');
    }

    setGameState('playing');
  };

  // Shelving a book
  const handleShelveBook = (book: BookItem, targetGenre: BookGenre): boolean => {
    if (book.genre !== targetGenre) {
      return false;
    }

    // Increase combo
    const nextCombo = Math.min(5.0, comboMultiplier + 0.5);
    setComboMultiplier(nextCombo);
    setComboTimer(maxComboTime);

    // Play synth audio based on combo count
    synthAudio.playBookShelved(Math.floor(nextCombo * 2));

    // Calculate points
    const pointBoost = activeBuff?.buffType === 'dewey_boost' ? activeBuff.buffValue : 0;
    const upgradeOakBoost = unlockedUpgradeIds.includes('antique_shelves') ? 0.25 : 0;
    const totalMultiplier = nextCombo * (1 + pointBoost + upgradeOakBoost);
    const pointsEarned = Math.round(book.value * totalMultiplier);
    const expEarned = Math.round(pointsEarned / 2);

    // If it's a rare/vintage book, unlock in Codex!
    if (book.rarity === 'vintage' || book.rarity === 'rare' || book.rarity === 'mythic') {
      const matchingCatalog = VINTAGE_BOOKS_CATALOG.find((v) => v.title === book.title);
      if (matchingCatalog && !unlockedVintageBookIds.includes(matchingCatalog.id)) {
        setUnlockedVintageBookIds((prev) => [...prev, matchingCatalog.id]);
      }
    }

    // Remove from inventory
    setInventoryBooks((prev) => prev.filter((b) => b.id !== book.id));

    // Track daily quests
    recordQuestProgress('shelve_genre', 1, { genre: book.genre });
    recordQuestProgress('shelve_total', 1);
    recordQuestProgress('reach_combo', 1, { combo: nextCombo });

    // Update stats and handle Level Up
    setStats((prev) => {
      const nextExp = prev.experiencePoints + expEarned;
      let newLevel = prev.libraryLevel;
      let nextThreshold = prev.nextLevelExp;
      let newRibbons = prev.gildedRibbons;

      if (nextExp >= prev.nextLevelExp) {
        // Level up!
        newLevel += 1;
        nextThreshold = Math.round(prev.nextLevelExp * 1.8);
        newRibbons += 3;

        synthAudio.playUpgradeUnlock();
        confetti({
          particleCount: 60,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981'],
        });
      }

      return {
        ...prev,
        deweyPoints: prev.deweyPoints + pointsEarned,
        experiencePoints: nextExp,
        nextLevelExp: nextThreshold,
        libraryLevel: newLevel,
        gildedRibbons: newRibbons,
        totalBooksShelved: prev.totalBooksShelved + 1,
        highestCombo: Math.max(prev.highestCombo, nextCombo),
      };
    });

    return true;
  };

  // Restore book
  const handleRestoreBook = (bookId: string) => {
    setInventoryBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            condition: 'pristine',
            restored: true,
            value: Math.round(b.value * 1.5),
          };
        }
        return b;
      })
    );
    setStats((prev) => ({
      ...prev,
      vintageBooksRestored: prev.vintageBooksRestored + 1,
      gildedRibbons: prev.gildedRibbons + 1,
    }));
    recordQuestProgress('restore_vintage', 1);
  };

  // Pull new books to sorting desk
  const handlePullNewBooks = () => {
    synthAudio.playBookPickup();
    const isRareBoost = activeBuff?.buffType === 'rare_chance';
    const newBatch = [
      generateRandomBook(undefined, isRareBoost ? 'vintage' : undefined),
      generateRandomBook(),
      generateRandomBook(),
    ];
    setInventoryBooks((prev) => [...prev, ...newBatch]);
  };

  // TBR: Move to Desk
  const handleMoveTBRToDesk = (book: BookItem) => {
    setTbrBooks((prev) => prev.filter((b) => b.id !== book.id));
    setInventoryBooks((prev) => [book, ...prev]);
    recordQuestProgress('deliver_tbr', 1);
  };

  // Loan: Reminder
  const handleSendLoanReminder = (recordId: string) => {
    setLoanedOutRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, daysRemaining: Math.max(0, r.daysRemaining - 1) } : r))
    );
  };

  // Loan: Collect Return
  const handleCollectLoanReturn = (recordId: string) => {
    const record = loanedOutRecords.find((r) => r.id === recordId);
    if (!record) return;

    const tipMultiplier = activeBuff?.buffType === 'patron_tips' ? activeBuff.buffValue : 1;
    const points = Math.round(record.rewardPoints * tipMultiplier);
    const ribbons = Math.round(record.rewardRibbons * tipMultiplier);

    setStats((prev) => ({
      ...prev,
      deweyPoints: prev.deweyPoints + points,
      gildedRibbons: prev.gildedRibbons + ribbons,
      patronsHelped: prev.patronsHelped + 1,
    }));

    setLoanedOutRecords((prev) => prev.filter((r) => r.id !== recordId));
    recordQuestProgress('collect_loan', 1);
  };

  // Borrowed In: Catalog
  const handleCatalogBorrowedIn = (recordId: string) => {
    const item = borrowedInRecords.find((r) => r.id === recordId);
    if (!item) return;

    setStats((prev) => ({
      ...prev,
      deweyPoints: prev.deweyPoints + item.rewardPoints,
      gildedRibbons: prev.gildedRibbons + item.rewardRibbons,
    }));

    setBorrowedInRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Tea Room: Brew Tea
  const handleBrewTea = (recipe: TeaRecipe) => {
    const newBuff: ActiveTeaBuff = {
      recipeId: recipe.id,
      name: recipe.name,
      buffType: recipe.buffType,
      expiresAt: Date.now() + recipe.buffDurationSeconds * 1000,
      buffValue: recipe.buffValue,
    };
    setActiveBuff(newBuff);
    setStats((prev) => ({ ...prev, teasBrewed: prev.teasBrewed + 1 }));
    recordQuestProgress('brew_tea', 1);
  };

  // Purchase Upgrade
  const handlePurchaseUpgrade = (upgrade: LibraryUpgrade) => {
    setStats((prev) => ({
      ...prev,
      deweyPoints: prev.deweyPoints - upgrade.costPoints,
      gildedRibbons: prev.gildedRibbons - upgrade.costRibbons,
    }));
    setUnlockedUpgradeIds((prev) => [...prev, upgrade.id]);
  };

  // Camera presets
  const handleSelectCameraPreset = (preset: CameraPreset) => {
    setActiveCameraPreset(preset);
    if (sceneRef.current) {
      sceneRef.current.setCameraPreset(preset);
    }
  };

  // Audio toggles
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    synthAudio.setMuted(newMuted);
  };

  const handleToggleLoFi = () => {
    if (isLoFiPlaying) {
      synthAudio.stopAmbientMusic();
      setIsLoFiPlaying(false);
    } else {
      synthAudio.startAmbientMusic();
      setIsLoFiPlaying(true);
    }
  };

  // Cloud Save actions from pause modal
  const handleManualSaveToCloud = async () => {
    const currentSave: CloudSaveData = {
      slotId: activeSlotId,
      slotName: `Slot ${activeSlotId} Sanctuary`,
      timestamp: Date.now(),
      stats,
      avatar,
      unlockedUpgradeIds,
      unlockedVintageBookIds,
      inventoryBooks,
      tbrBooks,
      loanedOutRecords,
      borrowedInRecords,
      activeBuff,
      timeOfDayHour,
      dailyQuests,
      lastQuestDate,
      allQuestsClaimedBonus,
      version: 1,
    };
    await cloudSaveService.saveToCloud(currentSave);
  };

  const handleExportSave = () => {
    const currentSave: CloudSaveData = {
      slotId: activeSlotId,
      slotName: `Slot ${activeSlotId} Sanctuary`,
      timestamp: Date.now(),
      stats,
      avatar,
      unlockedUpgradeIds,
      unlockedVintageBookIds,
      inventoryBooks,
      tbrBooks,
      loanedOutRecords,
      borrowedInRecords,
      activeBuff,
      timeOfDayHour,
      dailyQuests,
      lastQuestDate,
      allQuestsClaimedBonus,
      version: 1,
    };
    cloudSaveService.exportSaveAsJSON(currentSave);
  };

  const handleImportSave = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const imported = cloudSaveService.importSaveFromJSON(text);
      if (imported) {
        setStats(imported.stats);
        setAvatar(imported.avatar);
        setUnlockedUpgradeIds(imported.unlockedUpgradeIds);
        setUnlockedVintageBookIds(imported.unlockedVintageBookIds);
        setInventoryBooks(imported.inventoryBooks);
        setTbrBooks(imported.tbrBooks);
        setLoanedOutRecords(imported.loanedOutRecords);
        setBorrowedInRecords(imported.borrowedInRecords);
        setActiveBuff(imported.activeBuff);
        setTimeOfDayHour(imported.timeOfDayHour);

        const today = getTodayDateString();
        if (imported.dailyQuests && imported.lastQuestDate === today) {
          setDailyQuests(imported.dailyQuests);
          setLastQuestDate(imported.lastQuestDate);
          setAllQuestsClaimedBonus(imported.allQuestsClaimedBonus || false);
        } else {
          setDailyQuests(generateDailyQuests(today));
          setLastQuestDate(today);
          setAllQuestsClaimedBonus(false);
        }

        if (sceneRef.current) {
          sceneRef.current.librarian.updateConfig(imported.avatar);
          sceneRef.current.setTimeOfDay(imported.timeOfDayHour);
        }
        cloudSaveService.saveToCloud(imported);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950">
      {/* 1. 3D WebGL Canvas Viewport (Isolated mount, zero React rerender stalls) */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Title Screen (Game Shell requirement) */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          cloudSlots={cloudSaveService.getSlotSummaries()}
          activeSlotId={activeSlotId}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 3. Playing HUD Overlay */}
      {gameState === 'playing' && (
        <HUD
          stats={stats}
          comboMultiplier={comboMultiplier}
          comboTimeLeft={comboTimer / maxComboTime}
          activeBuff={activeBuff}
          timeOfDayHour={timeOfDayHour}
          onSetTimeOfDay={(hour) => {
            setTimeOfDayHour(hour);
            if (sceneRef.current) sceneRef.current.setTimeOfDay(hour);
          }}
          weather={weather}
          onSetWeather={(w) => {
            setWeather(w);
            setAutoWeather(false); // Player manually chose a weather
            if (sceneRef.current) sceneRef.current.setWeather(w);
          }}
          autoWeather={autoWeather}
          onToggleAutoWeather={() => setAutoWeather((prev) => !prev)}
          cloudSyncStatus={cloudSyncStatus}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isLoFiPlaying={isLoFiPlaying}
          onToggleLoFi={handleToggleLoFi}
          activeCameraPreset={activeCameraPreset}
          onSelectCameraPreset={handleSelectCameraPreset}
          onOpenStation={(station) => {
            if (station === 'desk') {
              handleSelectCameraPreset('desk');
              setActiveModal('desk');
            } else if (station === 'tbr') {
              handleSelectCameraPreset('desk');
              setActiveModal('tbr');
            } else if (station === 'tea') {
              handleSelectCameraPreset('tea_room');
              setActiveModal('tea');
            } else if (station === 'vitrine') {
              handleSelectCameraPreset('vitrine');
              setActiveModal('vitrine');
            } else if (station === 'avatar') {
              handleSelectCameraPreset('avatar');
              setActiveModal('avatar');
            } else if (station === 'upgrades') {
              setActiveModal('upgrades');
            } else if (station === 'quests') {
              setActiveModal('quests');
            }
          }}
          onOpenPause={() => setGameState('paused')}
          dailyQuests={dailyQuests}
          questToast={questToast}
        />
      )}

      {/* 4. Interactive Modals */}
      {activeModal === 'quests' && (
        <DailyQuestsModal
          quests={dailyQuests}
          allQuestsClaimedBonus={allQuestsClaimedBonus}
          onClaimQuestReward={handleClaimQuestReward}
          onClaimAllBonus={handleClaimAllBonus}
          onRerollQuest={handleRerollQuest}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'desk' && (
        <BookOrganizerModal
          books={inventoryBooks}
          onShelveBook={handleShelveBook}
          onRestoreBook={handleRestoreBook}
          onPullNewBooks={handlePullNewBooks}
          onClose={() => {
            setActiveModal(null);
            handleSelectCameraPreset('overview');
          }}
          comboMultiplier={comboMultiplier}
          deweyPointsBoost={activeBuff?.buffType === 'dewey_boost' ? activeBuff.buffValue : 0}
        />
      )}

      {activeModal === 'tbr' && (
        <TBRDeskModal
          tbrBooks={tbrBooks}
          loanedOutRecords={loanedOutRecords}
          borrowedInRecords={borrowedInRecords}
          onMoveTBRToDesk={handleMoveTBRToDesk}
          onSendLoanReminder={handleSendLoanReminder}
          onCollectLoanReturn={handleCollectLoanReturn}
          onCatalogBorrowedIn={handleCatalogBorrowedIn}
          onClose={() => {
            setActiveModal(null);
            handleSelectCameraPreset('overview');
          }}
        />
      )}

      {activeModal === 'tea' && (
        <TeaRoomModal
          activeBuff={activeBuff}
          onBrewTea={handleBrewTea}
          deweyPoints={stats.deweyPoints}
          onClose={() => {
            setActiveModal(null);
            handleSelectCameraPreset('overview');
          }}
        />
      )}

      {activeModal === 'avatar' && (
        <AvatarEditorModal
          avatar={avatar}
          onUpdateAvatar={(updated) => setAvatar(updated)}
          onClose={() => {
            setActiveModal(null);
            handleSelectCameraPreset('overview');
          }}
        />
      )}

      {activeModal === 'vitrine' && (
        <VintageCodexModal
          unlockedVintageBookIds={unlockedVintageBookIds}
          onClose={() => {
            setActiveModal(null);
            handleSelectCameraPreset('overview');
          }}
        />
      )}

      {activeModal === 'upgrades' && (
        <UpgradesModal
          unlockedUpgradeIds={unlockedUpgradeIds}
          deweyPoints={stats.deweyPoints}
          gildedRibbons={stats.gildedRibbons}
          libraryLevel={stats.libraryLevel}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 5. Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onSaveToCloud={handleManualSaveToCloud}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
          onReturnToTitle={() => {
            setGameState('title');
            handleSelectCameraPreset('overview');
          }}
          cloudSlots={cloudSaveService.getSlotSummaries()}
          activeSlotId={activeSlotId}
          onSelectSlot={(slotId) => {
            handleStartGame(slotId);
            setGameState('paused');
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}
    </div>
  );
}
