import React from 'react';
import { X, Coffee, Sparkles, Flame, Leaf, Heart, MessageSquare, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TeaRecipe, ActiveTeaBuff, Visitor } from '../types/game';
import { TEA_RECIPES, VISITORS_POOL } from '../game/bookGenerator';
import { synthAudio } from '../audio/synthAudio';

interface TeaRoomModalProps {
  activeBuff: ActiveTeaBuff | null;
  onBrewTea: (recipe: TeaRecipe) => void;
  deweyPoints: number;
  onClose: () => void;
}

export const TeaRoomModal: React.FC<TeaRoomModalProps> = ({
  activeBuff,
  onBrewTea,
  deweyPoints,
  onClose,
}) => {
  const [brewingRecipeId, setBrewingRecipeId] = React.useState<string | null>(null);
  const [visitors, setVisitors] = React.useState<Visitor[]>(VISITORS_POOL);
  const [guestbookNotes, setGuestbookNotes] = React.useState<string[]>([
    '“Your quiet corner by the rose window gave me solace after a long voyage.” — Lady Aurelia',
    '“The scent of warm bergamot and old parchment is the sweetest fragrance in the county.” — Prof. Bramble',
    '“I will return tomorrow to finish chapter seven!” — Barnaby',
  ]);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const handleBrew = (recipe: TeaRecipe) => {
    setBrewingRecipeId(recipe.id);
    synthAudio.playTeaBrewing();

    setTimeout(() => {
      onBrewTea(recipe);
      setBrewingRecipeId(null);
      setFeedback(`✨ Fresh pot of ${recipe.name} brewed! Enjoy the calming aroma.`);
      setTimeout(() => setFeedback(null), 3000);
    }, 800);
  };

  const handleServeVisitor = (visitor: Visitor) => {
    synthAudio.playTeaBrewing();
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 } });

    // Mark as visited and add note
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitor.id ? { ...v, hasVisited: true } : v))
    );

    if (visitor.thankYouNote) {
      setGuestbookNotes((prev) => [visitor.thankYouNote!, ...prev]);
    }

    setFeedback(`Served ${visitor.name} a warm cup of ${visitor.favoriteTea}! They left a sweet note in the guestbook.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 pointer-events-auto select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-100">Cozy Library Tea Room</h2>
              <p className="text-xs text-stone-400">
                Brew calming herbal infusions for active buffs and welcome visiting patrons to rest and read.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-6 py-2 bg-amber-950/80 border-b border-amber-800/40 text-xs text-amber-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Buff Status */}
          {activeBuff && (
            <div className="p-3.5 bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border border-amber-500/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold text-amber-200 font-cinzel">
                    Active Tea Infusion: {activeBuff.name}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {activeBuff.buffType === 'combo_freeze' && 'Combo multiplier is suspended from decaying.'}
                    {activeBuff.buffType === 'dewey_boost' && '+60% bonus Dewey Points from every shelved book!'}
                    {activeBuff.buffType === 'rare_chance' && '3x higher chance of finding Rare and Vintage editions!'}
                    {activeBuff.buffType === 'patron_tips' && 'Double ribbon rewards and patron appreciation.'}
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-900/60 px-2.5 py-1 rounded-full border border-amber-600/30">
                {Math.max(0, Math.ceil((activeBuff.expiresAt - Date.now()) / 1000))}s left
              </span>
            </div>
          )}

          {/* Section 1: Herbal Tea Blends */}
          <div>
            <h3 className="font-cinzel font-semibold text-xs text-amber-300 uppercase tracking-wider mb-3">
              Herbal Infusions & Blends
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {TEA_RECIPES.map((recipe) => {
                const isBrewing = brewingRecipeId === recipe.id;
                const isCurrentBuff = activeBuff?.recipeId === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col justify-between gap-3 hover:border-amber-700/60 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: recipe.color }}
                          />
                          <h4 className="font-cinzel font-bold text-sm text-stone-100">
                            {recipe.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded-full">
                          {recipe.buffDurationSeconds}s duration
                        </span>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed">
                        {recipe.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {recipe.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-stone-900/90 text-amber-200/80 px-2 py-0.5 rounded border border-stone-800"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400 font-mono">
                        Free Community Kettle
                      </span>

                      <button
                        onClick={() => handleBrew(recipe)}
                        disabled={isBrewing}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                          isCurrentBuff
                            ? 'bg-amber-900/50 text-amber-300 border border-amber-600/50'
                            : 'bg-amber-700 hover:bg-amber-600 text-amber-50 shadow'
                        }`}
                      >
                        {isBrewing ? 'Brewing...' : isCurrentBuff ? 'Re-infuse Pot' : 'Brew Cuppa'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Visiting Patrons Lounge */}
          <div>
            <h3 className="font-cinzel font-semibold text-xs text-amber-300 uppercase tracking-wider mb-3">
              Visiting Patrons in the Armchairs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {visitors.map((vis) => {
                return (
                  <div
                    key={vis.id}
                    className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-cinzel font-bold text-xs text-amber-200">
                          {vis.name}
                        </span>
                        <span className="text-[10px] text-stone-400 font-playfair italic">
                          {vis.title}
                        </span>
                      </div>

                      <p className="text-xs text-stone-300 font-playfair italic bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                        “{vis.dialogue[0]}”
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-stone-400">
                        <span>Favorite Tea:</span>
                        <strong className="text-amber-300">{vis.favoriteTea}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400 font-mono">
                        Prefers {vis.preferredGenre.toUpperCase()}
                      </span>

                      <button
                        onClick={() => handleServeVisitor(vis)}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-cinzel transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Coffee className="w-3 h-3 text-amber-400" />
                        <span>Serve Tea</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Library Guestbook Notes */}
          <div>
            <h3 className="font-cinzel font-semibold text-xs text-amber-300 uppercase tracking-wider mb-3">
              Visitor Guestbook Entries
            </h3>

            <div className="space-y-2">
              {guestbookNotes.slice(0, 4).map((note, i) => (
                <div
                  key={i}
                  className="p-3 bg-stone-950/40 border border-stone-800 rounded-xl text-xs text-stone-300 font-playfair italic leading-relaxed"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
