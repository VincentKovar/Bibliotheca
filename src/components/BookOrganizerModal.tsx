import React from 'react';
import { X, Check, Sparkles, BookOpen, Feather, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookItem, BookGenre } from '../types/game';
import { GENRE_COLORS, generateRandomBook } from '../game/bookGenerator';
import { synthAudio } from '../audio/synthAudio';

interface BookOrganizerModalProps {
  books: BookItem[];
  onShelveBook: (book: BookItem, targetGenre: BookGenre) => boolean;
  onRestoreBook: (bookId: string) => void;
  onPullNewBooks: () => void;
  onClose: () => void;
  comboMultiplier: number;
  deweyPointsBoost: number;
}

const SHELVES: { genre: BookGenre; label: string; deweyRange: string; color: string }[] = [
  { genre: 'fiction', label: 'Fiction & Literature', deweyRange: '800–899', color: '#9a3412' },
  { genre: 'philosophy', label: 'Philosophy & Ethics', deweyRange: '100–199', color: '#1e40af' },
  { genre: 'botany', label: 'Botany & Herbology', deweyRange: '580–589', color: '#166534' },
  { genre: 'astronomy', label: 'Astronomy & Cosmos', deweyRange: '520–529', color: '#3730a3' },
  { genre: 'poetry', label: 'Poetry & Ballads', deweyRange: '811–821', color: '#86198f' },
  { genre: 'arcane_history', label: 'Arcane History', deweyRange: '900–999', color: '#78350f' },
];

export const BookOrganizerModal: React.FC<BookOrganizerModalProps> = ({
  books,
  onShelveBook,
  onRestoreBook,
  onPullNewBooks,
  onClose,
  comboMultiplier,
  deweyPointsBoost,
}) => {
  const [selectedBookId, setSelectedBookId] = React.useState<string>(books[0]?.id || '');
  const [restorationStep, setRestorationStep] = React.useState<number>(0);
  const [feedbackMsg, setFeedbackMsg] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedBook = books.find((b) => b.id === selectedBookId) || books[0];

  React.useEffect(() => {
    if (!books.find((b) => b.id === selectedBookId) && books.length > 0) {
      setSelectedBookId(books[0].id);
      setRestorationStep(0);
    }
  }, [books, selectedBookId]);

  const handleRestorationStep = () => {
    if (!selectedBook) return;
    synthAudio.playBookPickup();
    if (restorationStep < 2) {
      setRestorationStep(restorationStep + 1);
    } else {
      // Completed restoration
      synthAudio.playVintageRestoration();
      onRestoreBook(selectedBook.id);
      setRestorationStep(0);
      setFeedbackMsg({ text: `✨ Restored & gilded "${selectedBook.title}"! (+50% value)`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleShelve = (targetGenre: BookGenre) => {
    if (!selectedBook) return;
    const isCorrect = selectedBook.genre === targetGenre;

    if (isCorrect) {
      // Trigger confetti
      confetti({
        particleCount: 28,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#fde68a', '#10b981'],
      });

      const success = onShelveBook(selectedBook, targetGenre);
      if (success) {
        setFeedbackMsg({
          text: `Correctly shelved into ${targetGenre.toUpperCase()}! Combo: ${comboMultiplier.toFixed(1)}x`,
          type: 'success',
        });
      }
    } else {
      synthAudio.playComboBreak();
      setFeedbackMsg({
        text: `Classification mismatch! Dewey ${selectedBook.deweyDecimal} belongs in ${selectedBook.genre.toUpperCase()}.`,
        type: 'error',
      });
    }

    setTimeout(() => setFeedbackMsg(null), 3200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 pointer-events-auto select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-100">Librarian Sorting Desk</h2>
              <p className="text-xs text-stone-400">
                Classify by Dewey classification, restore delicate bindings, and shelve onto library stacks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                synthAudio.playButtonClick();
                onPullNewBooks();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-cinzel transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Deliveries</span>
            </button>

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
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-b border-emerald-800/40'
                : 'bg-rose-950/90 text-rose-200 border-b border-rose-800/40'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Queue of books on the sorting desk (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-amber-300/80 font-cinzel font-semibold">
              <span>Sorting Queue ({books.length})</span>
              <span className="text-stone-400 font-mono text-[11px]">Select to Inspect</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
              {books.map((book) => {
                const isSelected = book.id === selectedBook?.id;
                const genreConf = GENRE_COLORS[book.genre];
                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      synthAudio.playBookPickup();
                      setSelectedBookId(book.id);
                      setRestorationStep(0);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-100 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-stone-800/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Book spine color pill */}
                      <div
                        className="w-3.5 h-10 rounded-sm shadow-inner shrink-0"
                        style={{ backgroundColor: genreConf.spine }}
                      />
                      <div className="truncate">
                        <div className="font-semibold text-xs truncate">{book.title}</div>
                        <div className="text-[11px] text-stone-400 truncate">{book.author} ({book.year})</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 text-amber-300">
                        {book.deweyDecimal}
                      </span>
                      {book.condition === 'needs_restoration' && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-rose-950 text-rose-300">
                          Restore
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {books.length === 0 && (
                <div className="p-8 text-center bg-stone-800/40 border border-dashed border-stone-700/60 rounded-2xl text-stone-400 text-xs">
                  Desk is clear! Click "New Deliveries" above to receive more volumes.
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected Book Inspection & Shelving (8 cols) */}
          {selectedBook ? (
            <div className="md:col-span-8 flex flex-col justify-between bg-stone-950/60 border border-amber-950/60 p-5 rounded-2xl">
              <div>
                {/* Book Header Card */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    {/* Simulated 3D Leather Cover Preview */}
                    <div
                      className="w-20 h-28 rounded-lg shadow-xl p-2.5 flex flex-col justify-between shrink-0 border border-amber-400/30 text-center relative overflow-hidden"
                      style={{ backgroundColor: GENRE_COLORS[selectedBook.genre].spine }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-amber-400/40" />
                      <div className="text-[9px] text-amber-200/90 font-cinzel font-bold leading-tight line-clamp-3">
                        {selectedBook.title}
                      </div>
                      <div className="text-[8px] text-amber-300/70 font-mono">
                        {selectedBook.year}
                      </div>
                      <div className="text-[9px] text-amber-100 font-mono bg-black/40 rounded py-0.5">
                        {selectedBook.deweyDecimal}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-600/40">
                          {selectedBook.rarity}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          Dewey: <strong className="text-amber-200">{selectedBook.deweyDecimal}</strong>
                        </span>
                      </div>

                      <h3 className="font-cinzel font-bold text-xl text-amber-100 mt-1">
                        {selectedBook.title}
                      </h3>
                      <p className="text-xs text-stone-400 font-playfair italic">
                        By {selectedBook.author} · Circa {selectedBook.year}
                      </p>

                      <p className="text-xs text-stone-300 mt-2 bg-stone-900/70 p-2.5 rounded-xl border border-stone-800 leading-relaxed">
                        {selectedBook.lore}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-stone-400">Shelving Value</div>
                    <div className="text-lg font-bold font-mono text-amber-300">
                      +{Math.round(selectedBook.value * (1 + deweyPointsBoost) * comboMultiplier)}
                      <span className="text-xs text-amber-400/80 font-normal ml-1">Dewey</span>
                    </div>
                  </div>
                </div>

                {/* Restoration Mini-Action if book needs restoration */}
                {selectedBook.condition === 'needs_restoration' && (
                  <div className="mb-5 p-3.5 bg-amber-950/40 border border-amber-600/40 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-200 font-cinzel">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Antique Book Restoration Required</span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {restorationStep === 0
                          ? 'Step 1: Dust fragile calfskin folio edges with goose feather.'
                          : restorationStep === 1
                          ? 'Step 2: Press and rebind loose spine threads with beeswax.'
                          : 'Step 3: Apply library gold-leaf seal!'}
                      </p>
                    </div>

                    <button
                      onClick={handleRestorationStep}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-100 rounded-xl text-xs font-cinzel font-semibold shadow transition-all cursor-pointer"
                    >
                      {restorationStep === 0
                        ? '1. Dust Folios'
                        : restorationStep === 1
                        ? '2. Rebind Spine'
                        : '3. Gold Stamp!'}
                    </button>
                  </div>
                )}
              </div>

              {/* Shelf Selection Destination Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-300/90 font-cinzel font-semibold">
                    Select Target Bookshelf:
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Match Dewey Range & Genre
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {SHELVES.map((shelf) => {
                    return (
                      <button
                        key={shelf.genre}
                        onClick={() => handleShelve(shelf.genre)}
                        className="p-3 rounded-xl border border-stone-700/80 hover:border-amber-500 bg-stone-900/90 hover:bg-amber-950/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-xs text-stone-200 group-hover:text-amber-200">
                            {shelf.label}
                          </span>
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: shelf.color }}
                          />
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-1">
                          Dewey {shelf.deweyRange}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="md:col-span-8 flex items-center justify-center text-center p-12 bg-stone-950/40 border border-stone-800 rounded-2xl text-stone-400">
              <div>
                <BookOpen className="w-10 h-10 mx-auto text-stone-600 mb-3" />
                <p className="text-sm font-cinzel">All volumes currently organized!</p>
                <p className="text-xs text-stone-500 mt-1">
                  Check the TBR cart or pull new deliveries.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
