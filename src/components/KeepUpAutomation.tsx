import React from 'react';
import { 
  CloudUpload, 
  FileSpreadsheet, 
  Play, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const KeepUpAutomation = () => {
  const [status, setStatus] = React.useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [progress, setProgress] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([]);

  const runAutomation = async () => {
    setStatus('running');
    setLogs(['Initiating KeepUp Automation Service...', 'Loading automation drivers...']);
    
    const steps = [
      'Authenticating with KeepUp portal...',
      'Opening upload page...',
      'Uploading Excel file...',
      'Validating data consistency...',
      'Submitting to BPS central system...',
      'Finalizing synchronization...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 1500));
      setProgress(((i + 1) / steps.length) * 100);
      setLogs(prev => [...prev, steps[i]]);
    }

    setStatus('success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Submit Ke KipApp (KeepUp)</h2>
          <p className="text-slate-500">Otomatisasi pengiriman data laporan ke sistem pusat BPS.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-100">
          <ShieldAlert className="w-3 h-3" /> System Integration Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Laporan_Januari_2024.xlsx</p>
                <p className="text-xs text-slate-500">1.2 MB • Digenerate otomatis oleh SatuInApp</p>
              </div>
              <button className="text-blue-600 p-2 hover:bg-white rounded-lg transition-colors">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {status === 'idle' && (
              <button 
                onClick={runAutomation}
                className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
              >
                Mulai Otomatisasi <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            {status === 'running' && (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-700">Sedang memproses pengiriman...</p>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>
            )}

            {status === 'success' && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Sinkronisasi Berhasil!</h4>
                  <p className="text-sm text-slate-500">Data telah berhasil diupload ke website KeepUp.</p>
                </div>
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200"
                >
                  Selesai
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl p-6 h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Logs</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex-1 font-mono text-[11px] text-slate-300 space-y-2 overflow-y-auto max-h-[300px] no-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                  <span className={cn(i === logs.length - 1 && "text-blue-400")}>{log}</span>
                </div>
              ))}
              {status === 'running' && (
                <div className="flex gap-2 animate-pulse">
                  <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-blue-400 font-bold">Executing task...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
