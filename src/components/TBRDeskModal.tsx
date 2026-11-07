import React from 'react';
import { X, Layers, Clock, Send, Award, CheckCircle2, Bookmark, BookOpen, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookItem, LoanRecord, BorrowedInRecord } from '../types/game';
import { GENRE_COLORS } from '../game/bookGenerator';
import { synthAudio } from '../audio/synthAudio';

interface TBRDeskModalProps {
  tbrBooks: BookItem[];
  loanedOutRecords: LoanRecord[];
  borrowedInRecords: BorrowedInRecord[];
  onMoveTBRToDesk: (book: BookItem) => void;
  onSendLoanReminder: (recordId: string) => void;
  onCollectLoanReturn: (recordId: string) => void;
  onCatalogBorrowedIn: (recordId: string) => void;
  onClose: () => void;
}

export const TBRDeskModal: React.FC<TBRDeskModalProps> = ({
  tbrBooks,
  loanedOutRecords,
  borrowedInRecords,
  onMoveTBRToDesk,
  onSendLoanReminder,
  onCollectLoanReturn,
  onCatalogBorrowedIn,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'tbr' | 'loaned' | 'borrowed'>('tbr');
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 pointer-events-auto select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-100">
                TBR Piles & Loan Ledger
              </h2>
              <p className="text-xs text-stone-400">
                Manage your To-Be-Read queues, patron book loans, and inter-library borrowed manuscripts.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-6 gap-3">
          <button
            onClick={() => {
              synthAudio.playButtonClick();
              setActiveTab('tbr');
            }}
            className={`py-3 px-3 text-xs font-cinzel font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tbr'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>TBR Stacks ({tbrBooks.length})</span>
          </button>

          <button
            onClick={() => {
              synthAudio.playButtonClick();
              setActiveTab('loaned');
            }}
            className={`py-3 px-3 text-xs font-cinzel font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'loaned'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Loaned to Patrons ({loanedOutRecords.length})</span>
          </button>

          <button
            onClick={() => {
              synthAudio.playButtonClick();
              setActiveTab('borrowed');
            }}
            className={`py-3 px-3 text-xs font-cinzel font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'borrowed'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Borrowed In Manuscripts ({borrowedInRecords.length})</span>
          </button>
        </div>

        {/* Notification Banner */}
        {feedback && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: TBR Stacks */}
          {activeTab === 'tbr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                <span>Volumes awaiting inspection and personal reading by the librarian:</span>
                <span className="font-mono text-amber-400">{tbrBooks.length} queued tomes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tbrBooks.map((book) => {
                  const genreConf = GENRE_COLORS[book.genre];
                  return (
                    <div
                      key={book.id}
                      className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-16 rounded-sm shadow-inner shrink-0"
                          style={{ backgroundColor: genreConf.spine }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-800 text-amber-300">
                              {book.genre}
                            </span>
                            <span className="text-[11px] font-mono text-stone-400">
                              Dewey {book.deweyDecimal}
                            </span>
                          </div>
                          <h4 className="font-cinzel font-bold text-sm text-amber-100 mt-1">
                            {book.title}
                          </h4>
                          <p className="text-xs text-stone-400 font-playfair italic">
                            By {book.author} ({book.year})
                          </p>
                          <p className="text-[11px] text-stone-300 mt-2 bg-stone-900/80 p-2 rounded-xl">
                            {book.lore}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                        <span className="text-xs font-mono text-amber-300">
                          +{book.value} Dewey Points
                        </span>

                        <button
                          onClick={() => {
                            synthAudio.playBookPickup();
                            onMoveTBRToDesk(book);
                            showFeedback(`Moved "${book.title}" to Sorting Desk!`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-600/40 text-amber-100 text-xs font-cinzel font-semibold transition-all cursor-pointer"
                        >
                          Send to Sorting Desk
                        </button>
                      </div>
                    </div>
                  );
                })}

                {tbrBooks.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-stone-400 text-xs font-cinzel">
                    The TBR pile is temporarily clear! New recommendations will arrive from patrons.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Loaned Out to Patrons */}
          {activeTab === 'loaned' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 mb-2">
                Keep track of books currently borrowed by town residents. Stamp reminder notices or process returned tomes:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loanedOutRecords.map((loan) => {
                  return (
                    <div
                      key={loan.id}
                      className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold font-cinzel text-amber-200">
                            Patron: {loan.patronName}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/40">
                            {loan.dueDate}
                          </span>
                        </div>

                        <h4 className="font-cinzel font-bold text-sm text-stone-100 mt-2">
                          “{loan.bookTitle}”
                        </h4>
                        <div className="text-xs text-stone-400 font-mono mt-0.5">
                          Genre: {loan.genre}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                        <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                          <span>+{loan.rewardPoints} Dewey</span>
                          <span>+{loan.rewardRibbons} Ribbon</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              synthAudio.playButtonClick();
                              onSendLoanReminder(loan.id);
                              showFeedback(`Sent friendly reminder bookmark to ${loan.patronName}!`);
                            }}
                            title="Send postal reminder note"
                            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              synthAudio.playBookShelved(2);
                              confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 } });
                              onCollectLoanReturn(loan.id);
                              showFeedback(`Collected "${loan.bookTitle}" from ${loan.patronName}!`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 text-xs font-cinzel font-semibold transition-colors cursor-pointer"
                          >
                            Collect Return
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loanedOutRecords.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-stone-400 text-xs font-cinzel">
                    No books are currently out on loan.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Borrowed In Manuscripts */}
          {activeTab === 'borrowed' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 mb-2">
                Special rare manuscripts on loan to our library from the Capital Athenaeum:
              </div>

              <div className="space-y-4">
                {borrowedInRecords.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-amber-950/20 border border-amber-600/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900 text-amber-200">
                            Inter-Library Loan
                          </span>
                          <span className="text-xs text-stone-400">
                            From: <strong className="text-amber-200">{item.originLibrary}</strong>
                          </span>
                          <span className="text-xs text-amber-400 font-mono">
                            ({item.daysRemaining} days remaining)
                          </span>
                        </div>

                        <h3 className="font-cinzel font-bold text-lg text-amber-100 mt-1">
                          {item.book.title}
                        </h3>
                        <p className="text-xs text-stone-400 font-playfair italic">
                          {item.book.author} · Dewey {item.book.deweyDecimal}
                        </p>
                        <p className="text-xs text-stone-300 mt-1 max-w-xl">
                          {item.book.lore}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-stone-400">Cataloging Bounty</div>
                          <div className="text-base font-bold font-mono text-amber-300">
                            +{item.rewardPoints} Dewey · +{item.rewardRibbons} Ribbons
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            synthAudio.playVintageRestoration();
                            confetti({ particleCount: 35, spread: 70, origin: { y: 0.6 } });
                            onCatalogBorrowedIn(item.id);
                            showFeedback(`Cataloged & transcribed "${item.book.title}"!`);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-100 text-xs font-cinzel font-semibold rounded-xl shadow transition-all cursor-pointer"
                        >
                          Transcribe & Catalog
                        </button>
                      </div>
                    </div>
                  );
                })}

                {borrowedInRecords.length === 0 && (
                  <div className="text-center py-12 text-stone-400 text-xs font-cinzel">
                    All inter-library manuscripts have been cataloged!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
