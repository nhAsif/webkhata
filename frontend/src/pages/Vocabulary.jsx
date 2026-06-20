import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, RefreshCw, Users, CheckCircle, XCircle } from 'lucide-react';
import { getVocabularyDates, getVocabularyHistory, getStudentVocabularyStats, getStudentPracticeResults } from '../api/vocabulary';
import Modal from '../components/Modal';
import Button from '../components/Button';
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
          <h1 className="text-3xl font-heading text-black font-black uppercase tracking-tight flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-black stroke-[3px]" />
            Vocabulary History
          </h1>
          <p className="text-black/60 font-body font-bold mt-1">
            View daily vocabulary generated for students
          </p>
        </div>

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

      <div className="flex gap-2 border-b-4 border-black pb-4">
        <button
          onClick={() => setActiveTab('words')}
          className={`px-4 py-2 border-4 transition-all duration-100 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide cursor-pointer ${
            activeTab === 'words'
              ? 'bg-[#FFD93D] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'border-transparent text-black hover:bg-neutral-100 hover:border-black'
          }`}
        >
          <BookOpen className="w-4 h-4 stroke-[2.5px]" /> Word List
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 border-4 transition-all duration-100 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wide cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-[#FFD93D] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
              : 'border-transparent text-black hover:bg-neutral-100 hover:border-black'
          }`}
        >
          <Users className="w-4 h-4 stroke-[2.5px]" /> Student Progress
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <RefreshCw className="w-8 h-8 text-black animate-spin" />
        </div>
      ) : activeTab === 'words' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyWords.map((item) => {
              const word = item.word;
              return (
                <div key={item.id} className="bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-2xl font-heading font-black text-black uppercase tracking-tight">
                        {word.word}
                        {word.bangla_pronunciation && (
                          <span className="text-lg text-black/60 font-body ml-2 capitalize normal-case">({word.bangla_pronunciation})</span>
                        )}
                      </h3>
                      <span className="px-2 py-0.5 border-2 border-black bg-[#C4B5FD]/30 text-black text-[10px] uppercase tracking-wider font-mono font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {word.part_of_speech}
                      </span>
                    </div>
                    <p className="text-[#FF6B6B] font-display font-black text-lg mb-4">৳ {word.bangla_meaning}</p>
                    
                    {word.synonyms && (
                      <div className="mb-4 text-sm font-semibold">
                        <span className="text-black/55 font-mono text-[10px] uppercase block font-bold">Synonyms</span>
                        <span className="text-black font-body">{word.synonyms}</span>
                      </div>
                    )}
                  </div>
                  
                  {word.example_sentence && (
                    <div className="mt-4 pt-3 border-t-2 border-black/10 text-sm -mx-5 px-5 bg-neutral-50/50">
                      <p className="text-black/80 font-body font-semibold italic">"{word.example_sentence}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!loading && historyWords.length === 0 && (
            <div className="text-center py-20 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen className="w-12 h-12 text-black/35 mx-auto mb-4 stroke-[2.5px]" />
              <p className="text-black/60 font-bold">No vocabulary words found for this date.</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black bg-[#FAF6EE]">
                  <th className="p-4 text-xs font-black uppercase text-black font-heading">Student Name</th>
                  <th className="p-4 text-xs font-black uppercase text-black font-heading text-center">Words Viewed</th>
                  <th className="p-4 text-xs font-black uppercase text-black font-heading text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black bg-white">
                {studentStats.map((stat) => (
                  <tr key={stat.student_id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <button 
                        onClick={() => handleStudentClick(stat)}
                        className="text-black font-black hover:text-[#FF6B6B] transition-colors underline decoration-black/30 underline-offset-4 font-heading"
                      >
                        {stat.student_name}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-mono border-2 border-black bg-[#FAF6EE] px-2.5 py-1 text-sm text-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {stat.viewed} / {stat.total}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center">
                      {stat.completed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black bg-[#4ADE80] border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <CheckCircle className="w-3.5 h-3.5 stroke-[2.5px]" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black/70 bg-[#E2E8F0] border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <XCircle className="w-3.5 h-3.5 stroke-[2.5px]" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {studentStats.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-black/60 font-bold">No active students found.</td>
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
          <p className="text-black/75 font-semibold mb-4">
            Showing practice sessions for <span className="text-[#FF6B6B] font-black font-mono">{selectedDate}</span>.
          </p>
          
          {loadingPractice ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-6 h-6 text-black animate-spin" />
            </div>
          ) : studentPracticeResults.length > 0 ? (
            <div className="space-y-3">
              {studentPracticeResults.map((result) => (
                <div key={result.id} className="bg-[#FAF6EE] border-2 border-black p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <div className="text-black font-black font-heading uppercase tracking-tight text-base capitalize mb-1">{result.mode} Practice</div>
                    <div className="text-xs text-black/60 font-mono font-semibold">
                      {new Date(result.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-display font-black text-black">
                      {result.score} <span className="text-sm text-black/65 font-bold font-body">/ {result.total_questions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-black/60 font-bold">No practice results found for this date.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
