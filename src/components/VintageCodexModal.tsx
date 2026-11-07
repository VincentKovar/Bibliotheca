import React from 'react';
import { X, Sparkles, BookOpen, Lock, ShieldCheck, Award } from 'lucide-react';
import { BookItem } from '../types/game';
import { VINTAGE_BOOKS_CATALOG, GENRE_COLORS } from '../game/bookGenerator';
import { synthAudio } from '../audio/synthAudio';

interface VintageCodexModalProps {
  unlockedVintageBookIds: string[];
  onClose: () => void;
}

export const VintageCodexModal: React.FC<VintageCodexModalProps> = ({
  unlockedVintageBookIds,
  onClose,
}) => {
  const [selectedBook, setSelectedBook] = React.useState<BookItem>(VINTAGE_BOOKS_CATALOG[0]);

  const isUnlocked = (id: string) => unlockedVintageBookIds.includes(id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 pointer-events-auto select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-100">
                The Grand Vintage Codex
              </h2>
              <p className="text-xs text-stone-400">
                Museum archive of rare first editions and illuminated manuscripts preserved in the glass vitrine.
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* List of Vintage Books (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-amber-300 font-cinzel font-semibold mb-1">
              <span>Restored Archive</span>
              <span className="font-mono text-stone-400">
                {unlockedVintageBookIds.length} / {VINTAGE_BOOKS_CATALOG.length} Editions
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
              {VINTAGE_BOOKS_CATALOG.map((book) => {
                const unlocked = isUnlocked(book.id);
                const isSelected = selectedBook?.id === book.id;
                const genreConf = GENRE_COLORS[book.genre];

                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      synthAudio.playBookPickup();
                      setSelectedBook(book);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-100 ring-1 ring-amber-400/50'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {unlocked ? (
                        <div
                          className="w-3.5 h-10 rounded-sm shadow-inner shrink-0"
                          style={{ backgroundColor: genreConf.spine }}
                        />
                      ) : (
                        <div className="w-3.5 h-10 rounded-sm bg-stone-800 flex items-center justify-center shrink-0">
                          <Lock className="w-3 h-3 text-stone-500" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className={`font-semibold text-xs truncate ${unlocked ? 'text-amber-100' : 'text-stone-500 italic'}`}>
                          {unlocked ? book.title : 'Undiscovered Rare Tome'}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          {unlocked ? `${book.author} (${book.year})` : 'Restoration challenge'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-amber-300 uppercase shrink-0">
                      {book.rarity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Inspection Showcase (7 cols) */}
          <div className="md:col-span-7 bg-stone-950/60 border border-amber-950/60 p-6 rounded-2xl flex flex-col justify-between">
            {isUnlocked(selectedBook.id) ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* Ornate Gold Gilded Cover Preview */}
                  <div
                    className="w-24 h-36 rounded-xl shadow-2xl p-3 flex flex-col justify-between shrink-0 border-2 border-amber-400/60 text-center relative overflow-hidden"
                    style={{ backgroundColor: selectedBook.spineColor }}
                  >
                    <div className="text-[10px] text-amber-300 font-cinzel font-bold leading-tight line-clamp-3">
                      {selectedBook.title}
                    </div>
                    <div className="text-[9px] text-amber-200/90 font-mono">
                      {selectedBook.year}
                    </div>
                    <div className="text-[9px] font-mono bg-black/50 text-amber-300 rounded py-0.5">
                      Dewey {selectedBook.deweyDecimal}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-600/40">
                        {selectedBook.rarity} 1st Edition
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        Published {selectedBook.year}
                      </span>
                    </div>

                    <h3 className="font-cinzel font-bold text-xl text-amber-100 mt-1.5">
                      {selectedBook.title}
                    </h3>
                    <p className="text-xs text-stone-400 font-playfair italic">
                      Author: {selectedBook.author}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Condition: Pristine Restoration
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800">
                  <span className="text-[11px] font-cinzel text-amber-400 font-semibold block mb-1">
                    Historical Folio Marginalia & Lore:
                  </span>
                  <p className="text-xs text-stone-300 font-playfair italic leading-relaxed">
                    “{selectedBook.lore}”
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400 font-mono bg-stone-900/50 p-3 rounded-xl border border-stone-800/80">
                  <span>Classification: Dewey {selectedBook.deweyDecimal}</span>
                  <span className="text-amber-300 font-bold">Catalog Value: {selectedBook.value} Dewey</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-auto text-center p-8 text-stone-400">
                <Lock className="w-12 h-12 text-stone-600 mb-3" />
                <h4 className="font-cinzel font-bold text-base text-amber-200">
                  Undiscovered Vintage First Edition
                </h4>
                <p className="text-xs text-stone-400 max-w-sm mt-2 leading-relaxed">
                  Restored during high combo shelving streaks, discovered in morning mail deliveries, or acquired through inter-library loans.
                </p>
              </div>
            )}

            <div className="text-right text-[11px] text-stone-500 font-mono pt-3 border-t border-stone-800/60">
              Preserved in the Library Glass Vitrine
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
