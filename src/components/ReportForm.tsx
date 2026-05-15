import React from 'react';
import { 
  Send, 
  Paperclip, 
  Calendar as CalendarIcon, 
  Clock, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const ReportForm = () => {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  
  // Firestore data states
  const { user } = useAuth();
  const [teams, setTeams] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);

  const [formData, setFormData] = React.useState({
    team_id: '',
    activity_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    jam_selesai: '',
    penjelasan: '',
    nama_kegiatan: '',
  });
  const [file, setFile] = React.useState<File | null>(null);
  const [fileBase64, setFileBase64] = React.useState<string | null>(null);
  const [timeError, setTimeError] = React.useState<string | null>(null);

  const validateTime = (mulai: string, selesai: string) => {
    if (!mulai || !selesai) return true;
    const [h1, m1] = mulai.split(':').map(Number);
    const [h2, m2] = selesai.split(':').map(Number);
    const t1 = h1 * 60 + m1;
    const t2 = h2 * 60 + m2;
    return t2 >= t1;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File terlalu besar (Maks 5MB)');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  React.useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAct = onSnapshot(collection(db, 'activities'), (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubTeams();
      unsubAct();
    };
  }, []);

  const filteredActivities = activities.filter(a => a.team_id === formData.team_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!validateTime(formData.jam_mulai, formData.jam_selesai)) {
      setTimeError('Jam selesai tidak boleh lebih awal dari jam mulai');
      return;
    }
    setTimeError(null);

    setLoading(true);
    try {
      const selectedTeamItem = teams.find(t => t.id === formData.team_id);
      const selectedActivityItem = activities.find(a => a.id === formData.activity_id);

      const payload = {
        reportData: {
          ...formData,
          user_id: user.id,
          userName: user.name,
          teamName: selectedTeamItem?.nama || '',
          activityName: selectedActivityItem?.nama || '',
          subActivityName: formData.nama_kegiatan, // Use custom input
          jam: `${formData.jam_mulai} - ${formData.jam_selesai}`
        },
        attachment: fileBase64 ? {
          name: file?.name,
          type: file?.type,
          data: fileBase64.split(',')[1] // Raw base64 data
        } : null
      };

      const res = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Server returned non-JSON:', text);
        throw new Error(res.status === 413 ? 'File terlalu besar untuk dikirim (limit server exceeded)' : `Server error: ${res.status}`);
      }

      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          team_id: '',
          activity_id: '',
          tanggal: new Date().toISOString().split('T')[0],
          jam_mulai: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          jam_selesai: '',
          penjelasan: '',
          nama_kegiatan: '',
        });
        setFile(null);
        setFileBase64(null);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error(error);
      alert('Gagal mengirim laporan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Lapor Kegiatan Harian</h2>
        <p className="text-slate-500">Isi detail kegiatan Anda hari ini dengan lengkap dan jujur.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tim */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Pilih Tim <Info className="w-3.5 h-3.5 text-slate-300" />
              </label>
              <select 
                value={formData.team_id}
                onChange={(e) => {
                  setFormData({ ...formData, team_id: e.target.value, activity_id: '' });
                }}
                className="input-base"
                required
              >
                <option value="">Pilih Tim...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.nama}</option>
                ))}
              </select>
            </div>

            {/* Kegiatan */}
            <div className={cn("space-y-1 transition-opacity", !formData.team_id && "opacity-50 pointer-events-none")}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Kegiatan</label>
              <select 
                value={formData.activity_id}
                onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
                className="input-base"
                required
              >
                <option value="">Pilih Kegiatan...</option>
                {filteredActivities.map(a => (
                  <option key={a.id} value={a.id}>{a.nama}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Kegiatan */}
          <div className={cn("space-y-1 transition-opacity", !formData.activity_id && "opacity-50 pointer-events-none")}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Kegiatan</label>
            <input 
              type="text"
              value={formData.nama_kegiatan}
              onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
              placeholder="Jelaskan nama kegiatan khusus Anda..."
              className="input-base"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Tanggal
              </label>
              <input 
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="input-base"
                required
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Jam Mulai
                  </label>
                  <input 
                    type="time"
                    value={formData.jam_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Jam Selesai
                  </label>
                  <input 
                    type="time"
                    value={formData.jam_selesai}
                    onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                    className="input-base"
                    required
                  />
                </div>
              </div>
              <AnimatePresence>
                {timeError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[10px] text-rose-600 font-bold px-1"
                  >
                    * {timeError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Penjelasan Kegiatan</label>
            <textarea 
              rows={4}
              value={formData.penjelasan}
              onChange={(e) => setFormData({ ...formData, penjelasan: e.target.value })}
              placeholder="Jelaskan apa yang Anda kerjakan secara detail..."
              className="input-base resize-none"
              required
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Bukti Dukung</label>
            <div 
              onClick={() => document.getElementById('file-upload')?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
            >
              <input 
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Paperclip className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-700 capitalize">
                {file ? file.name : 'Klik atau seret file ke sini'}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium italic">PNG, JPG, PDF (Maks 5MB)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? 'Memproses...' : <>Kirim Laporan <Send className="w-4 h-4" /></>}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 z-50"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Laporan Berhasil Disubmit</p>
              <p className="text-[10px] text-slate-400">Sync Google Drive & KeepUp Selesai</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
