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
  RefreshCw,
  Calendar,
  Info
} from 'lucide-react';
import { 
  getDailyVocabulary, 
  searchVocabulary, 
  getBookmarkedWords, 
  getProgressStats, 
  updateProgress,
  savePracticeResult,
  getVocabularyDates,
  getVocabularyHistory
} from '../../api/vocabulary';
import toast from 'react-hot-toast';

function WordCard({ item, onBookmarkToggle, isBookmarked }) {
  const word = item.word || item; // handles both DailyVocabularyResponse and VocabularyWordResponse
  return (
    <div className="bg-white border-4 border-black p-6 relative group overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 flex flex-col justify-between">
      <div className="absolute top-3 right-3 z-10">
        <button 
          onClick={() => onBookmarkToggle(word.id, !isBookmarked)}
          className="text-black hover:text-[#FF6B6B] transition-colors cursor-pointer bg-white p-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-5 h-5 text-[#FF6B6B] fill-[#FF6B6B]/20 stroke-[2.5px]" />
          ) : (
            <Bookmark className="w-5 h-5 stroke-[2.5px]" />
          )}
        </button>
      </div>

      <div>
        <div className="mb-2">
          <h3 className="text-2xl font-heading font-black text-black uppercase tracking-tight pr-12">{word.word}</h3>
          <div className="mt-2">
            <span className="inline-block px-2.5 py-0.5 border-2 border-black bg-[#C4B5FD]/30 text-black text-[10px] uppercase tracking-wider font-mono font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              {word.part_of_speech}
            </span>
          </div>
        </div>
        <p className="text-[#FF6B6B] font-display font-black text-lg mb-4">৳ {word.bangla_meaning}</p>
        
        <div className="space-y-4 text-sm mt-6 font-body font-bold text-black border-t-2 border-black/10 pt-4">
          {word.synonyms && (
            <div>
              <span className="text-black/55 block text-[10px] uppercase tracking-wider font-mono font-black mb-1">Synonyms</span>
              <p className="text-black font-semibold">{word.synonyms}</p>
            </div>
          )}
          
          {word.antonyms && (
            <div>
              <span className="text-black/55 block text-[10px] uppercase tracking-wider font-mono font-black mb-1">Antonyms</span>
              <p className="text-black font-semibold">{word.antonyms}</p>
            </div>
          )}

          {word.example_sentence && (
            <div className="mt-4 pt-3 border-t border-dashed border-black/10">
              <span className="text-black/55 block text-[10px] uppercase tracking-wider font-mono font-black mb-1">Example</span>
              <p className="text-black/85 font-semibold italic">"{word.example_sentence}"</p>
              {word.bangla_sentence_meaning && (
                <p className="text-black/60 mt-1 text-sm font-semibold">{word.bangla_sentence_meaning}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ParentVocabulary() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'daily'); // daily, practice, saved, search
  
  const [dailyWords, setDailyWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceMode, setPracticeMode] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [practiceFinished, setPracticeFinished] = useState(false);
  
  const [savedWords, setSavedWords] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // We maintain a local set of bookmarked word IDs for immediate UI updates
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [historyWords, setHistoryWords] = useState([]);

  useEffect(() => {
    loadStats();
    loadDaily();
    loadSaved();
    loadDates();
    if (location.state?.tab === 'practice') {
      setActiveTab('practice');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && selectedDate) {
      loadHistory(selectedDate);
    }
  }, [activeTab, selectedDate]);

  const loadDates = async () => {
    try {
      const availableDates = await getVocabularyDates();
      setDates(availableDates);
      if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async (date) => {
    try {
      setLoading(true);
      const words = await getVocabularyHistory(date);
      setHistoryWords(words);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

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

  const startPractice = (mode = null) => {
    setActiveTab('practice');
    setPracticeMode(mode);
    if (!mode) {
      setPracticeQuestions([]);
      return;
    }
    
    let eligibleWords = [...dailyWords];
    if (mode === 'synonym') {
      eligibleWords = eligibleWords.filter(w => {
        const word = w.word || w;
        return word.synonyms && word.synonyms.trim().length > 0;
      });
    } else if (mode === 'antonym') {
      eligibleWords = eligibleWords.filter(w => {
        const word = w.word || w;
        return word.antonyms && word.antonyms.trim().length > 0;
      });
    }
    
    if (eligibleWords.length < 4) {
      toast('Not enough daily words with this property to generate practice!', { icon: <Info className="w-5 h-5 text-blue-500 stroke-[3px]" /> });
      setPracticeMode(null);
      setPracticeQuestions([]);
      return;
    }
    
    const shuffledDaily = eligibleWords.sort(() => 0.5 - Math.random());
    const selectedWords = shuffledDaily.slice(0, 20);
    
    const questions = selectedWords.map(wordItem => {
      const wordObj = wordItem.word || wordItem;
      let correctAnswer = '';
      let questionPrefix = '';
      let distractorsPool = [];
      
      const otherWords = eligibleWords.filter(w => (w.word?.id || w.id) !== wordObj.id);
      
      if (mode === 'meaning') {
        questionPrefix = 'What is the meaning of';
        correctAnswer = wordObj.bangla_meaning;
        distractorsPool = otherWords.map(w => w.word?.bangla_meaning || w.bangla_meaning);
      } else if (mode === 'synonym') {
        questionPrefix = 'Which is a synonym for';
        correctAnswer = wordObj.synonyms;
        distractorsPool = otherWords.map(w => w.word?.synonyms || w.synonyms);
      } else if (mode === 'antonym') {
        questionPrefix = 'Which is an antonym for';
        correctAnswer = wordObj.antonyms;
        distractorsPool = otherWords.map(w => w.word?.antonyms || w.antonyms);
      } else if (mode === 'pos') {
        questionPrefix = 'What is the part of speech of';
        correctAnswer = wordObj.part_of_speech;
        distractorsPool = ['Noun', 'Pronoun', 'Verb', 'Adjective', 'Adverb', 'Preposition', 'Conjunction', 'Interjection'].filter(pos => pos.toLowerCase() !== correctAnswer.toLowerCase());
      }
      
      let distractors = [];
      if (mode === 'pos') {
        distractors = [...distractorsPool].sort(() => 0.5 - Math.random()).slice(0, 3);
      } else {
        const uniqueDistractors = [...new Set(distractorsPool)].filter(d => d !== correctAnswer);
        distractors = uniqueDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
        while (distractors.length < 3) {
            distractors.push(`Distractor ${Math.random().toString(36).substring(7)}`);
        }
      }
      
      const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());
      
      return {
        word: wordObj,
        questionPrefix,
        options,
        correctAnswer
      };
    });
    
    setPracticeQuestions(questions);
    setPracticeIndex(0);
    setSelectedOption(null);
    setScore(0);
    setPracticeFinished(false);
  };

  const handleOptionSelect = (option) => {
    if (selectedOption !== null) return; // already selected
    setSelectedOption(option);
    if (option === practiceQuestions[practiceIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextPractice = async () => {
    if (practiceIndex < practiceQuestions.length - 1) {
      setPracticeIndex(practiceIndex + 1);
      setSelectedOption(null);
    } else {
      setPracticeFinished(true);
      try {
        await savePracticeResult({
          mode: practiceMode,
          score: score,
          total_questions: practiceQuestions.length
        });
      } catch (err) {
        console.error('Failed to save practice result', err);
      }
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-black tracking-tight flex items-center gap-3 uppercase">
            <BookOpen className="w-8 h-8 text-black stroke-[3px]" />
            Daily Vocabulary
          </h1>
          <p className="text-black/60 font-body font-bold mt-1">Learn 20 new words every day to improve your English.</p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <div className="bg-white border-4 border-black px-4 py-2.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-2xl font-display font-black text-black">{stats.today_viewed}/{stats.today_total}</div>
              <div className="text-[10px] text-black/60 uppercase tracking-wider font-mono font-bold">Today</div>
            </div>
            <div className="bg-white border-4 border-black px-4 py-2.5 text-center hidden sm:block shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-2xl font-display font-black text-black">{stats.words_learned_this_week}</div>
              <div className="text-[10px] text-black/60 uppercase tracking-wider font-mono font-bold">This Week</div>
            </div>
            <div className="bg-white border-4 border-black px-4 py-2.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-2xl font-display font-black text-black">{stats.total_words_learned}</div>
              <div className="text-[10px] text-black/60 uppercase tracking-wider font-mono font-bold">Total Learned</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b-4 border-black pb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 border-4 transition-all duration-100 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-[#FFD93D] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'border-transparent text-black hover:bg-neutral-100 hover:border-black'
          }`}
        >
          Today's Words
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 border-4 transition-all duration-100 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#FFD93D] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'border-transparent text-black hover:bg-neutral-100 hover:border-black'
          }`}
        >
          <span className="flex items-center gap-2"><Calendar className="w-4 h-4 stroke-[2.5px]"/> History</span>
        </button>
        <button
          onClick={() => { setActiveTab('practice'); setPracticeMode(null); }}
          className={`px-4 py-2 border-4 transition-all duration-100 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide cursor-pointer ${
            activeTab === 'practice'
              ? 'bg-[#FFD93D] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'border-transparent text-black hover:bg-neutral-100 hover:border-black'
          }`}
        >
          <span className="flex items-center gap-2"><Shuffle className="w-4 h-4 stroke-[2.5px]"/> Practice</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 border-4 transition-all duration-100 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-[#FFD93D] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'border-transparent text-black hover:bg-neutral-100 hover:border-black'
          }`}
        >
          <span className="flex items-center gap-2"><Bookmark className="w-4 h-4 stroke-[2.5px]"/> Saved ({savedWords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 border-4 transition-all duration-100 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide cursor-pointer ${
            activeTab === 'search'
              ? 'bg-[#FFD93D] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'border-transparent text-black hover:bg-neutral-100 hover:border-black'
          }`}
        >
          <span className="flex items-center gap-2"><Search className="w-4 h-4 stroke-[2.5px]"/> Search</span>
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading && activeTab !== 'search' && activeTab !== 'practice' ? (
          <div className="flex items-center justify-center h-[400px]">
            <RefreshCw className="w-8 h-8 text-black animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'daily' && dailyWords.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center text-black/60 font-mono text-sm font-bold mb-4">
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
                    className="px-4 py-2 border-4 border-black bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-black font-heading font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5px]" /> Previous
                  </button>
                  <button
                    onClick={nextDaily}
                    disabled={currentIndex === dailyWords.length - 1}
                    className="px-6 py-2 border-4 border-black bg-[#FFD93D] hover:bg-[#FFD93D]/95 text-black font-heading font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Next <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'daily' && dailyWords.length === 0 && !loading && (
              <div className="text-center py-20 text-black/60 font-bold bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p>No words available today. Please check back later.</p>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-end mb-6">
                  <div className="flex items-center gap-3 bg-[#FAF6EE] border-4 border-black px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Calendar className="w-4 h-4 text-black stroke-[2.5px]" />
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent border-none text-black font-mono font-bold text-sm focus:ring-0 outline-none cursor-pointer"
                    >
                      {dates.length === 0 && <option value="">No dates available</option>}
                      {dates.map((d) => (
                        <option key={d} value={d} className="bg-white text-black">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {historyWords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {historyWords.map((item) => (
                      <WordCard 
                        key={item.id} 
                        item={item} 
                        isBookmarked={bookmarkedIds.has(item.word_id)}
                        onBookmarkToggle={toggleBookmark}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-black/60 font-bold bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <BookOpen className="w-12 h-12 text-black/35 mx-auto mb-4 stroke-[2.5px]" />
                    <p>No vocabulary words found for this date.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'practice' && (
              <div className="max-w-2xl mx-auto">
                {!practiceMode ? (
                  <div className="bg-white border-4 border-black p-10 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-3xl font-heading font-black text-black uppercase tracking-tight mb-6">Choose Practice Mode</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <button onClick={() => startPractice('meaning')} className="p-6 bg-[#FAF6EE] border-4 border-black hover:bg-[#C4B5FD]/20 hover:-translate-y-0.5 transition-all duration-100 text-lg font-heading font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer">Meaning</button>
                      <button onClick={() => startPractice('synonym')} className="p-6 bg-[#FAF6EE] border-4 border-black hover:bg-[#C4B5FD]/20 hover:-translate-y-0.5 transition-all duration-100 text-lg font-heading font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer">Synonyms</button>
                      <button onClick={() => startPractice('antonym')} className="p-6 bg-[#FAF6EE] border-4 border-black hover:bg-[#C4B5FD]/20 hover:-translate-y-0.5 transition-all duration-100 text-lg font-heading font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer">Antonyms</button>
                      <button onClick={() => startPractice('pos')} className="p-6 bg-[#FAF6EE] border-4 border-black hover:bg-[#C4B5FD]/20 hover:-translate-y-0.5 transition-all duration-100 text-lg font-heading font-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer">Parts of Speech</button>
                    </div>
                  </div>
                ) : practiceQuestions.length > 0 ? (
                  practiceFinished ? (
                    <div className="bg-white border-4 border-black p-10 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <h2 className="text-3xl font-heading font-black text-black uppercase tracking-tight mb-2">Practice Complete!</h2>
                      <p className="text-xl text-black/70 font-semibold mb-6">You scored <span className="text-[#FF6B6B] font-black font-mono">{score}</span> out of {practiceQuestions.length}</p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => startPractice(practiceMode)}
                          className="px-6 py-3 border-4 border-black bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-black font-heading font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
                        >
                          Practice Again
                        </button>
                        <button
                          onClick={() => setPracticeMode(null)}
                          className="px-6 py-3 border-4 border-black bg-white hover:bg-neutral-100 text-black font-heading font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
                        >
                          Change Mode
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border-4 border-black p-8 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-center text-black/60 font-mono text-sm font-bold mb-6 flex justify-between items-center">
                        <span>Question {practiceIndex + 1} of {practiceQuestions.length}</span>
                        <span>Score: {score}</span>
                      </div>
                      
                      <div className="mb-8 text-center">
                        <p className="text-black/55 text-xs uppercase tracking-widest mb-2 font-mono font-bold">{practiceQuestions[practiceIndex].questionPrefix}</p>
                        <h3 className="text-4xl font-heading font-black text-black uppercase tracking-tight">{practiceQuestions[practiceIndex].word.word}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {practiceQuestions[practiceIndex].options.map((option, idx) => {
                          const isSelected = selectedOption === option;
                          const isCorrect = option === practiceQuestions[practiceIndex].correctAnswer;
                          const showCorrect = selectedOption !== null && isCorrect;
                          const showWrong = isSelected && !isCorrect;
                          
                          let btnClass = "w-full text-left p-4 border-4 border-black font-heading font-black text-sm uppercase tracking-tight transition-all duration-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer ";
                          if (selectedOption === null) {
                            btnClass += "bg-[#FAF6EE] text-black hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";
                          } else if (showCorrect) {
                            btnClass += "bg-[#4ADE80] text-black";
                          } else if (showWrong) {
                            btnClass += "bg-[#FF6B6B] text-black";
                          } else {
                            btnClass += "bg-neutral-100 text-black/40 opacity-50 shadow-none";
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleOptionSelect(option)}
                              disabled={selectedOption !== null}
                              className={btnClass}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-bottom-2">
                        <button
                          onClick={nextPractice}
                          disabled={selectedOption === null}
                          className={`px-8 py-3 border-4 border-black font-heading font-bold flex items-center gap-2 transition-all ${
                            selectedOption === null
                              ? "bg-neutral-200 text-black/45 cursor-not-allowed opacity-60"
                              : "bg-[#FFD93D] hover:bg-[#FFD93D]/95 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer"
                          }`}
                        >
                          {practiceIndex < practiceQuestions.length - 1 ? 'Next Question' : 'View Results'} <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-20 text-black/60 font-bold bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <p>Not enough daily words available yet. Check today's words first!</p>
                  </div>
                )}
              </div>
            )}

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
                  <div className="text-center py-20 text-black/60 font-bold bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <Bookmark className="w-12 h-12 text-black/35 mx-auto mb-4 stroke-[2.5px]" />
                    <p>You haven't saved any words yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div>
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by english word, meaning or part of speech..."
                    className="w-full bg-white border-4 border-black py-4 pl-12 pr-4 text-black font-body font-semibold placeholder:text-black/35 focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <Search className="w-5 h-5 text-black absolute left-4 top-1/2 -translate-y-1/2 stroke-[2.5px]" />
                  <button 
                    type="submit" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-black bg-[#FFD93D] hover:bg-[#FFD93D]/90 text-black font-heading font-black text-xs uppercase px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                  >
                    Search
                  </button>
                </form>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <RefreshCw className="w-6 h-6 text-black animate-spin" />
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
                  <div className="text-center py-10 text-black/60 font-bold bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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
