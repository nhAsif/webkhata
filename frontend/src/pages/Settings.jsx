import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, ShieldCheck, Database, RefreshCw, Quote, BookOpen, Globe } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import { useTranslation } from '../contexts/LanguageContext';

export default function Settings() {
  const { language, setLanguage, t } = useTranslation();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef(null);
  const [isRefetchingQuotes, setIsRefetchingQuotes] = useState(false);
  const [isRefetchingWords, setIsRefetchingWords] = useState(false);

  const handleRefetchQuotes = async () => {
    try {
      setIsRefetchingQuotes(true);
      await api.post('/settings/refetch-quotes');
      toast.success(t('Daily quotes refetched successfully!'));
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to refetch quotes.'));
    } finally {
      setIsRefetchingQuotes(false);
    }
  };

  const handleRefetchWords = async () => {
    try {
      setIsRefetchingWords(true);
      await api.post('/settings/refetch-words', {}, { timeout: 60000 });
      toast.success(t("Today's words regenerated successfully!"));
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to regenerate today's words."));
    } finally {
      setIsRefetchingWords(false);
    }
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.get('/settings/backup', { responseType: 'blob' });
      
      const contentDisposition = res.headers['content-disposition'];
      
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      let filename = `webkhata-backup-${formattedDate}.wkb`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(t('Backup created successfully!'));
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to create backup.'));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.wkb') && !file.name.endsWith('.zip')) {
      toast.error(t('Invalid file format. Please upload a .wkb or .zip file.'));
      e.target.value = '';
      return;
    }

    if (!window.confirm(t('WARNING: This will overwrite ALL current data with the backup data. This action cannot be undone. Are you sure you want to proceed?'))) {
      e.target.value = '';
      return;
    }

    try {
      setIsRestoring(true);
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post('/settings/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success(t('Data restored successfully! Please log in again.'));
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to restore backup.'));
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-[#FF6B6B] border-4 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-black stroke-[3px]" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-black text-black tracking-tight uppercase">{t("System Settings")}</h1>
          <p className="text-black/60 font-mono text-xs mt-1 uppercase font-bold">{t("Manage application data and preferences")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Settings Section */}
        <div className="bg-white border-4 border-black p-6 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-100 md:col-span-2">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Globe className="w-32 h-32 text-black" />
          </div>
          
          <h2 className="text-xl font-heading font-black text-black mb-3 flex items-center gap-2 uppercase tracking-tight">
            <Globe className="w-5 h-5 text-black stroke-[3px]" />
            {t("Language Settings")}
          </h2>
          <p className="text-sm text-black/70 font-body font-semibold mb-6">
            {t("Switch between Bangla and English language for the application interface.")}
          </p>

          <div className="bg-[#FAF6EE] border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-black text-black text-base uppercase">{t("Select App Language")}</h3>
                <p className="text-xs text-black/60 font-bold mt-1">{t("Choose your preferred language.")}</p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setLanguage('en')}
                  variant={language === 'en' ? 'secondary' : 'outline'}
                  size="sm"
                  className="min-w-[120px] font-black"
                >
                  English
                </Button>
                <Button
                  onClick={() => setLanguage('bn')}
                  variant={language === 'bn' ? 'secondary' : 'outline'}
                  size="sm"
                  className="min-w-[120px] font-black"
                >
                  বাংলা
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Backup & Restore Section */}
        <div className="bg-white border-4 border-black p-6 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-100">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Database className="w-32 h-32 text-black" />
          </div>
          
          <h2 className="text-xl font-heading font-black text-black mb-3 flex items-center gap-2 uppercase tracking-tight">
            <Database className="w-5 h-5 text-black stroke-[3px]" />
            {t("Backup & Restore")}
          </h2>
          <p className="text-sm text-black/70 font-body font-semibold mb-6">
            {t("Create a complete backup of your entire application data, or restore from an existing backup package.")}
          </p>

          <div className="space-y-4">
            {/* Backup Button */}
            <div className="bg-[#FAF6EE] border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-black text-base uppercase">{t("Create Backup")}</h3>
                  <p className="text-xs text-black/60 font-bold mt-1">{t("Generate a downloadable package of all current data.")}</p>
                </div>
                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp || isRestoring}
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Download className={`w-4 h-4 stroke-[3px] ${isBackingUp ? 'animate-bounce' : ''}`} />
                  {isBackingUp ? t('Generating...') : t('Create Backup')}
                </Button>
              </div>
            </div>

            {/* Restore Button */}
            <div className="bg-[#FAF6EE] border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-black text-base uppercase">{t("Restore Data")}</h3>
                  <p className="text-xs text-black/60 font-bold mt-1">{t("Restore your application data from a previous backup file.")}</p>
                </div>
                <Button
                  onClick={handleRestoreClick}
                  disabled={isBackingUp || isRestoring}
                  variant="secondary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Upload className={`w-4 h-4 stroke-[3px] ${isRestoring ? 'animate-bounce' : ''}`} />
                  {isRestoring ? t('Restoring...') : t('Restore')}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".wkb,.zip"
                  className="hidden"
                />
              </div>
              <div className="mt-4 flex items-start gap-2.5 text-[11px] text-[#FF6B6B] bg-[#FF6B6B]/10 p-3.5 border-2 border-black font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 stroke-[3px] text-black" />
                <p>{t("Restoring will overwrite all current data. Make sure you have a recent backup before proceeding.")}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Management Section */}
        <div className="bg-white border-4 border-black p-6 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-100">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <RefreshCw className="w-32 h-32 text-black" />
          </div>
          
          <h2 className="text-xl font-heading font-black text-black mb-3 flex items-center gap-2 uppercase tracking-tight">
            <RefreshCw className="w-5 h-5 text-black stroke-[3px]" />
            {t("Manual Refresh")}
          </h2>
          <p className="text-sm text-black/70 font-body font-semibold mb-6">
            {t("Force the system to refetch or regenerate daily content like quotes and vocabulary words.")}
          </p>

          <div className="space-y-4">
            {/* Refetch Quotes Button */}
            <div className="bg-[#FAF6EE] border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-black text-base uppercase flex items-center gap-2">
                    <Quote className="w-4 h-4 stroke-[3px]" />
                    {t("Refetch Quotes")}
                  </h3>
                  <p className="text-xs text-black/60 font-bold mt-1">{t("Fetch new quotes from the AI to display on the dashboard.")}</p>
                </div>
                <Button
                  onClick={handleRefetchQuotes}
                  disabled={isRefetchingQuotes}
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 stroke-[3px] ${isRefetchingQuotes ? 'animate-spin' : ''}`} />
                  {isRefetchingQuotes ? t('Refetching...') : t('Refetch')}
                </Button>
              </div>
            </div>

            {/* Refetch Words Button */}
            <div className="bg-[#FAF6EE] border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-black text-black text-base uppercase flex items-center gap-2">
                    <BookOpen className="w-4 h-4 stroke-[3px]" />
                    {t("Regenerate Words")}
                  </h3>
                  <p className="text-xs text-black/60 font-bold mt-1">{t("Regenerate today's vocabulary words instantly via AI.")}</p>
                </div>
                <Button
                  onClick={handleRefetchWords}
                  disabled={isRefetchingWords}
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 stroke-[3px] ${isRefetchingWords ? 'animate-spin' : ''}`} />
                  {isRefetchingWords ? t('Regenerating...') : t('Regenerate')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
