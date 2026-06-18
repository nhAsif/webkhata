import api from './client';

export const getDailyVocabulary = () => api.get('/vocabulary/daily').then(res => res.data);
export const searchVocabulary = (q) => api.get('/vocabulary/search', { params: { q } }).then(res => res.data);
export const getBookmarkedWords = () => api.get('/vocabulary/bookmarked').then(res => res.data);
export const getPracticeWords = () => api.get('/vocabulary/practice').then(res => res.data);
export const getProgressStats = () => api.get('/vocabulary/progress/stats').then(res => res.data);
export const updateProgress = (data) => api.post('/vocabulary/progress', data).then(res => res.data);
