import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Settings() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef(null);

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
      
      toast.success('Backup created successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create backup.');
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
      toast.error('Invalid file format. Please upload a .wkb or .zip file.');
      e.target.value = '';
      return;
    }

    if (!window.confirm('WARNING: This will overwrite ALL current data with the backup data. This action cannot be undone. Are you sure you want to proceed?')) {
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
      
      toast.success('Data restored successfully! Please log in again.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to restore backup.');
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-burnt to-bitcoin rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(247,147,26,0.2)]">
          <ShieldCheck className="w-6 h-6 text-pure" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-pure tracking-tight">System Settings</h1>
          <p className="text-stardust font-mono text-xs mt-1">Manage application data and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup & Restore Section */}
        <div className="bg-matter border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database className="w-32 h-32 text-bitcoin" />
          </div>
          
          <h2 className="text-xl font-heading font-semibold text-pure mb-2 flex items-center gap-2 relative z-10">
            <Database className="w-5 h-5 text-bitcoin" />
            Backup & Restore
          </h2>
          <p className="text-sm text-stardust mb-6 relative z-10">
            Create a complete backup of your entire application data, or restore from an existing backup package.
          </p>

          <div className="space-y-4 relative z-10">
            {/* Backup Button */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-pure text-sm">Create Backup</h3>
                  <p className="text-xs text-stardust mt-1">Generate a downloadable package of all current data.</p>
                </div>
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp || isRestoring}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-burnt to-bitcoin hover:from-burnt/90 hover:to-bitcoin/90 text-void font-bold py-2.5 px-5 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(247,147,26,0.3)] hover:shadow-[0_0_20px_rgba(247,147,26,0.4)] whitespace-nowrap"
                >
                  <Download className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                  {isBackingUp ? 'Generating...' : 'Create Backup'}
                </button>
              </div>
            </div>

            {/* Restore Button */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-pure text-sm">Restore Data</h3>
                  <p className="text-xs text-stardust mt-1">Restore your application data from a previous backup file.</p>
                </div>
                <button
                  onClick={handleRestoreClick}
                  disabled={isBackingUp || isRestoring}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-pure font-bold py-2.5 px-5 rounded-lg text-sm transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Upload className={`w-4 h-4 ${isRestoring ? 'animate-bounce' : ''}`} />
                  {isRestoring ? 'Restoring...' : 'Restore'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".wkb,.zip"
                  className="hidden"
                />
              </div>
              <div className="mt-4 flex items-start gap-2 text-[10px] text-amber-500/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Restoring will overwrite all current data. Make sure you have a recent backup before proceeding.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
