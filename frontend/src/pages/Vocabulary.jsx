import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, RefreshCw, Users, CheckCircle, XCircle } from 'lucide-react';
import { getVocabularyDates, getVocabularyHistory, getStudentVocabularyStats, getStudentPracticeResults } from '../api/vocabulary';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Vocabulary() {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [historyWords, setHistoryWords] = useState([]);
  const [studentStats, setStudentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('words');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPracticeResults, setStudentPracticeResults] = useState([]);
  const [loadingPractice, setLoadingPractice] = useState(false);

  useEffect(() => {
    loadDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadHistory(selectedDate);
    }
  }, [selectedDate]);

  const loadDates = async () => {
    try {
      setLoading(true);
      const availableDates = await getVocabularyDates();
      setDates(availableDates);
      if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      }
    } catch (err) {
      toast.error('Failed to load vocabulary dates');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (date) => {
    try {
      setLoading(true);
      const [words, stats] = await Promise.all([
        getVocabularyHistory(date),
        getStudentVocabularyStats(date)
      ]);
      setHistoryWords(words);
      setStudentStats(stats);
    } catch (err) {
      toast.error('Failed to load vocabulary history');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    try {
      setLoadingPractice(true);
      const results = await getStudentPracticeResults(student.student_id, selectedDate);
      setStudentPracticeResults(results);
    } catch (err) {
      toast.error('Failed to load practice results');
    } finally {
      setLoadingPractice(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-pure tracking-tight flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-bitcoin" />
            Vocabulary History
          </h1>
          <p className="text-sm text-stardust mt-1">
            View daily vocabulary generated for students
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <Calendar className="w-4 h-4 text-stardust" />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-pure font-mono text-sm focus:ring-0 outline-none cursor-pointer"
          >
            {dates.length === 0 && <option value="">No dates available</option>}
            {dates.map((d) => (
              <option key={d} value={d} className="bg-void text-pure">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('words')}
          className={`px-4 py-2 rounded-lg font-mono text-sm tracking-wide transition-colors flex items-center gap-2 ${
            activeTab === 'words' ? 'bg-bitcoin/20 text-bitcoin' : 'text-stardust hover:text-pure hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Word List
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-lg font-mono text-sm tracking-wide transition-colors flex items-center gap-2 ${
            activeTab === 'stats' ? 'bg-bitcoin/20 text-bitcoin' : 'text-stardust hover:text-pure hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" /> Student Progress
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <RefreshCw className="w-8 h-8 text-bitcoin animate-spin" />
        </div>
      ) : activeTab === 'words' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyWords.map((item) => {
              const word = item.word;
              return (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-bitcoin/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-pure">{word.word}</h3>
                    <span className="px-2 py-1 bg-white/10 text-stardust text-[10px] uppercase tracking-wider rounded font-mono">
                      {word.part_of_speech}
                    </span>
                  </div>
                  <p className="text-bitcoin font-medium mb-4">{word.bangla_meaning}</p>
                  
                  {word.synonyms && (
                    <div className="mb-2 text-sm">
                      <span className="text-stardust font-mono text-[10px] uppercase block">Synonyms</span>
                      <span className="text-pure">{word.synonyms}</span>
                    </div>
                  )}
                  
                  {word.example_sentence && (
                    <div className="mt-4 pt-3 border-t border-white/5 text-sm">
                      <p className="text-pure italic">"{word.example_sentence}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!loading && historyWords.length === 0 && (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
              <BookOpen className="w-12 h-12 text-stardust/30 mx-auto mb-4" />
              <p className="text-stardust">No vocabulary words found for this date.</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-xs font-mono uppercase tracking-wider text-stardust font-medium">Student Name</th>
                  <th className="p-4 text-xs font-mono uppercase tracking-wider text-stardust font-medium text-center">Words Viewed</th>
                  <th className="p-4 text-xs font-mono uppercase tracking-wider text-stardust font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {studentStats.map((stat) => (
                  <tr key={stat.student_id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <button 
                        onClick={() => handleStudentClick(stat)}
                        className="text-pure font-medium hover:text-bitcoin transition-colors underline decoration-white/30 underline-offset-4"
                      >
                        {stat.student_name}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-mono bg-white/5 px-2 py-1 rounded text-sm text-stardust">
                        {stat.viewed} / {stat.total}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center">
                      {stat.completed ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stardust bg-white/5 px-3 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {studentStats.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-stardust">No active students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Practice Results Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={`Practice History: ${selectedStudent?.student_name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-stardust mb-4">
            Showing practice sessions for <span className="text-bitcoin font-bold">{selectedDate}</span>.
          </p>
          
          {loadingPractice ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-6 h-6 text-bitcoin animate-spin" />
            </div>
          ) : studentPracticeResults.length > 0 ? (
            <div className="space-y-3">
              {studentPracticeResults.map((result) => (
                <div key={result.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-pure font-bold capitalize mb-1">{result.mode} Practice</div>
                    <div className="text-xs text-stardust font-mono">
                      {new Date(result.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-bitcoin">
                      {result.score} <span className="text-sm text-stardust">/ {result.total_questions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-stardust">No practice results found for this date.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
