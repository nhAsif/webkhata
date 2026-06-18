import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  RefreshCw 
} from 'lucide-react';
import { 
  getDailyVocabulary, 
  searchVocabulary, 
  getBookmarkedWords, 
  getPracticeWords, 
  getProgressStats, 
  updateProgress 
} from '../../api/vocabulary';
import toast from 'react-hot-toast';

function WordCard({ item, onBookmarkToggle, isBookmarked }) {
  const word = item.word || item; // handles both DailyVocabularyResponse and VocabularyWordResponse
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <button 
          onClick={() => onBookmarkToggle(word.id, !isBookmarked)}
          className="text-stardust hover:text-bitcoin transition-colors"
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-6 h-6 text-bitcoin fill-bitcoin/20" />
          ) : (
            <Bookmark className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-3xl font-bold text-pure mb-1">{word.word}</h3>
        <p className="text-lg text-bitcoin font-medium">{word.bangla_meaning}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-white/10 text-stardust text-xs uppercase tracking-wider rounded-full font-mono">
          {word.part_of_speech}
        </span>
      </div>

      <div className="space-y-4 text-sm mt-6">
        {(word.synonyms) && (
          <div>
            <span className="text-stardust block text-xs uppercase tracking-wider font-mono mb-1">Synonyms</span>
            <p className="text-pure">{word.synonyms}</p>
          </div>
        )}
        
        {(word.antonyms) && (
          <div>
            <span className="text-stardust block text-xs uppercase tracking-wider font-mono mb-1">Antonyms</span>
            <p className="text-pure">{word.antonyms}</p>
          </div>
        )}

        {word.example_sentence && (
          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-stardust block text-xs uppercase tracking-wider font-mono mb-1">Example</span>
            <p className="text-pure italic">"{word.example_sentence}"</p>
            {word.bangla_sentence_meaning && (
              <p className="text-stardust mt-1 text-sm">{word.bangla_sentence_meaning}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParentVocabulary() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'daily'); // daily, practice, saved, search
  
  const [dailyWords, setDailyWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [practiceWords, setPracticeWords] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  
  const [savedWords, setSavedWords] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // We maintain a local set of bookmarked word IDs for immediate UI updates
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    loadStats();
    loadDaily();
    loadSaved();
    if (location.state?.tab === 'practice') {
      startPractice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const s = await getProgressStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDaily = async () => {
    try {
      setLoading(true);
      const words = await getDailyVocabulary();
      setDailyWords(words);
      if (words.length > 0) {
        markViewed(words[0].word_id);
      }
    } catch (err) {
      toast.error('Failed to load daily words');
    } finally {
      setLoading(false);
    }
  };

  const loadSaved = async () => {
    try {
      const saved = await getBookmarkedWords();
      setSavedWords(saved);
      setBookmarkedIds(new Set(saved.map(s => s.word_id)));
    } catch (err) {
      console.error(err);
    }
  };

  const markViewed = async (word_id) => {
    try {
      await updateProgress({ word_id, viewed: true });
      // Optionally reload stats without showing loading state
      const s = await getProgressStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBookmark = async (word_id, isBookmarked) => {
    try {
      await updateProgress({ word_id, bookmarked: isBookmarked });
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (isBookmarked) next.add(word_id);
        else next.delete(word_id);
        return next;
      });
      // Optionally update saved list in background
      const saved = await getBookmarkedWords();
      setSavedWords(saved);
    } catch (err) {
      toast.error('Failed to update bookmark');
    }
  };

  const nextDaily = () => {
    if (currentIndex < dailyWords.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      markViewed(dailyWords[nextIdx].word_id);
    }
  };

  const prevDaily = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const startPractice = async () => {
    try {
      setLoading(true);
      setActiveTab('practice');
      const words = await getPracticeWords();
      setPracticeWords(words);
      setPracticeIndex(0);
      if (words.length === 0) {
        toast('No previous words to practice yet!', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Failed to load practice words');
    } finally {
      setLoading(false);
    }
  };

  const nextPractice = () => {
    if (practiceIndex < practiceWords.length - 1) {
      setPracticeIndex(practiceIndex + 1);
    } else {
      toast.success('Practice complete!');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const results = await searchVocabulary(searchQuery);
      setSearchResults(results);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-pure tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-bitcoin" />
            Daily Vocabulary
          </h1>
          <p className="text-stardust mt-1">Learn 20 new words every day to improve your English.</p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-bitcoin">{stats.today_viewed}/{stats.today_total}</div>
              <div className="text-[10px] text-stardust uppercase tracking-wider font-mono">Today</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center hidden sm:block">
              <div className="text-2xl font-bold text-pure">{stats.words_learned_this_week}</div>
              <div className="text-[10px] text-stardust uppercase tracking-wider font-mono">This Week</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-pure">{stats.total_words_learned}</div>
              <div className="text-[10px] text-stardust uppercase tracking-wider font-mono">Total Learned</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-lg font-mono text-sm tracking-wide transition-colors ${
            activeTab === 'daily' ? 'bg-bitcoin/20 text-bitcoin' : 'text-stardust hover:text-pure hover:bg-white/5'
          }`}
        >
          Today's Words
        </button>
        <button
          onClick={startPractice}
          className={`px-4 py-2 rounded-lg font-mono text-sm tracking-wide transition-colors ${
            activeTab === 'practice' ? 'bg-bitcoin/20 text-bitcoin' : 'text-stardust hover:text-pure hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2"><Shuffle className="w-4 h-4"/> Practice</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-lg font-mono text-sm tracking-wide transition-colors ${
            activeTab === 'saved' ? 'bg-bitcoin/20 text-bitcoin' : 'text-stardust hover:text-pure hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2"><Bookmark className="w-4 h-4"/> Saved ({savedWords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-lg font-mono text-sm tracking-wide transition-colors ${
            activeTab === 'search' ? 'bg-bitcoin/20 text-bitcoin' : 'text-stardust hover:text-pure hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2"><Search className="w-4 h-4"/> Search</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading && activeTab !== 'search' ? (
          <div className="flex items-center justify-center h-[400px]">
            <RefreshCw className="w-8 h-8 text-bitcoin animate-spin" />
          </div>
        ) : (
          <>
            {/* Daily Tab */}
            {activeTab === 'daily' && dailyWords.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center text-stardust font-mono text-sm mb-4">
                  Word {currentIndex + 1} of {dailyWords.length}
                </div>
                <WordCard 
                  item={dailyWords[currentIndex]} 
                  isBookmarked={bookmarkedIds.has(dailyWords[currentIndex].word_id)}
                  onBookmarkToggle={toggleBookmark}
                />
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={prevDaily}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 text-pure transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" /> Previous
                  </button>
                  <button
                    onClick={nextDaily}
                    disabled={currentIndex === dailyWords.length - 1}
                    className="px-6 py-2 bg-gradient-to-r from-burnt to-bitcoin hover:from-burnt/90 hover:to-bitcoin/90 text-void font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'daily' && dailyWords.length === 0 && !loading && (
              <div className="text-center py-20 text-stardust">
                <p>No words available today. Please check back later.</p>
              </div>
            )}

            {/* Practice Tab */}
            {activeTab === 'practice' && (
              <div className="max-w-2xl mx-auto">
                {practiceWords.length > 0 ? (
                  <>
                    <div className="text-center text-stardust font-mono text-sm mb-4">
                      Practice Word {practiceIndex + 1} of {practiceWords.length}
                    </div>
                    <WordCard 
                      item={practiceWords[practiceIndex]} 
                      isBookmarked={bookmarkedIds.has(practiceWords[practiceIndex].id)}
                      onBookmarkToggle={toggleBookmark}
                    />
                    
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={nextPractice}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-pure font-bold rounded-xl flex items-center gap-2 transition-all"
                      >
                        {practiceIndex < practiceWords.length - 1 ? 'Next Word' : 'Finish'} <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-stardust">
                    <p>No previous words to practice yet. Learn some daily words first!</p>
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div>
                {savedWords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedWords.map((item) => (
                      <WordCard 
                        key={item.id} 
                        item={item} 
                        isBookmarked={bookmarkedIds.has(item.word_id)}
                        onBookmarkToggle={toggleBookmark}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-stardust">
                    <Bookmark className="w-12 h-12 text-stardust/30 mx-auto mb-4" />
                    <p>You haven't saved any words yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div>
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by english word, meaning or part of speech..."
                    className="w-full bg-void border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-pure focus:outline-none focus:border-bitcoin transition-colors"
                  />
                  <Search className="w-5 h-5 text-stardust absolute left-4 top-1/2 -translate-y-1/2" />
                  <button 
                    type="submit" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-pure px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    Search
                  </button>
                </form>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <RefreshCw className="w-6 h-6 text-bitcoin animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map((word) => (
                      <WordCard 
                        key={word.id} 
                        item={word} 
                        isBookmarked={bookmarkedIds.has(word.id)}
                        onBookmarkToggle={toggleBookmark}
                      />
                    ))}
                  </div>
                )}
                
                {!loading && searchResults.length === 0 && searchQuery && (
                  <div className="text-center py-10 text-stardust">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
