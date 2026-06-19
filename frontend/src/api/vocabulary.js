import api from './client';

export const getDailyVocabulary = () => api.get('/vocabulary/daily', { timeout: 60000 }).then(res => res.data);
export const searchVocabulary = (q) => api.get('/vocabulary/search', { params: { q } }).then(res => res.data);
export const getBookmarkedWords = () => api.get('/vocabulary/bookmarked').then(res => res.data);
export const getPracticeWords = () => api.get('/vocabulary/practice').then(res => res.data);

export const getVocabularyDates = async () => {
  const response = await api.get('/vocabulary/dates');
  return response.data;
};

export const getVocabularyHistory = async (date) => {
  const url = date ? `/vocabulary/history?date=${date}` : '/vocabulary/history';
  const response = await api.get(url);
  return response.data;
};

export const getStudentVocabularyStats = async (date) => {
  const url = date ? `/vocabulary/stats/students?date=${date}` : '/vocabulary/stats/students';
  const response = await api.get(url);
  return response.data;
};

export const savePracticeResult = (data) => api.post('/vocabulary/practice/results', data).then(res => res.data);

export const getStudentPracticeResults = async (studentId, date) => {
  const url = date ? `/vocabulary/stats/students/${studentId}/practice?date_str=${date}` : `/vocabulary/stats/students/${studentId}/practice`;
  const response = await api.get(url);
  return response.data;
};

export const getProgressStats = () => api.get('/vocabulary/progress/stats').then(res => res.data);
export const updateProgress = (data) => api.post('/vocabulary/progress', data).then(res => res.data);
