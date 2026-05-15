import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, Save, ExternalLink, Info, CheckCircle2, AlertCircle, ShieldCheck, Key, Database } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

export const Settings = () => {
  const { user } = useAuth();
  const [folderId, setFolderId] = React.useState(user?.gdrive_folder_id || '');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  // Admin Registration State
  const [adminPass, setAdminPass] = React.useState('');
  const [adminLoading, setAdminLoading] = React.useState(false);
  const [adminStatus, setAdminStatus] = React.useState<'idle' | 'success' | 'error' | 'wrong'>('idle');

  // Global Settings (Admins only)
  const [globalFolderId, setGlobalFolderId] = React.useState('');
  const [globalLoading, setGlobalLoading] = React.useState(false);

  React.useEffect(() => {
    if (user?.role === 'admin') {
      const fetchGlobalConfig = async () => {
        const configRef = doc(db, 'config', 'google_drive');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setGlobalFolderId(configSnap.data().folder_id || '');
        }
      };
      fetchGlobalConfig();
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setStatus('idle');
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        gdrive_folder_id: folderId
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (adminPass !== 'adminpkl3375') {
      setAdminStatus('wrong');
      setTimeout(() => setAdminStatus('idle'), 3000);
      return;
    }

    setAdminLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { role: 'admin' });
      setAdminStatus('success');
      // Force refresh or logout? For now just success
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error(error);
      setAdminStatus('error');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveGlobalDrive = async () => {
    if (user?.role !== 'admin') return;
    setGlobalLoading(true);
    try {
      const configRef = doc(db, 'config', 'google_drive');
      await setDoc(configRef, { folder_id: globalFolderId }, { merge: true });
      alert('Berhasil menyimpan konfigurasi global!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan konfigurasi global.');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
        <p className="text-slate-500 font-medium">Kelola integrasi dan akses akun Anda.</p>
      </div>

      {/* Admin Registration Section (Only if not admin) */}
      {user?.role !== 'admin' && (
        <div className="card-base p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Daftar sebagai Admin</h3>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Masukkan password admin untuk mendapatkan hak akses pengelolaan sistem (Master Data, User, dll).
          </p>
          <form onSubmit={handlePromoteAdmin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Password Admin
              </label>
              <div className="relative">
                <input 
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Password..."
                  className="input-base pl-10"
                  required
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {adminStatus === 'wrong' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-600 text-xs font-bold">Password Salah!</motion.div>
                )}
                {adminStatus === 'success' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-600 text-xs font-bold">Berhasil! Memuat ulang...</motion.div>
                )}
              </AnimatePresence>
              <button disabled={adminLoading} type="submit" className="btn-primary">
                {adminLoading ? 'Memproses...' : 'Promote ke Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Individual GDrive Section */}
      <div className="card-base p-8 space-y-6">
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-blue-200">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">Integrasi Drive Pribadi</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              PDF laporan akan disimpan di folder Drive pilihan Anda jika diisi. Jika kosong, akan menggunakan folder default sistem.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Google Drive Folder ID <Info className="w-3.5 h-3.5 text-slate-300" />
            </label>
            <input 
              type="text"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="Contoh: 1abcXYZ123..."
              className="input-base"
            />
            <p className="text-[10px] text-slate-400 font-medium italic mt-1">
              *Kosongkan untuk menggunakan folder default admin.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <AnimatePresence>
              {status === 'success' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Tersimpan!
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Global GDrive Section (Admins Only) */}
      {user?.role === 'admin' && (
        <div className="card-base p-8 space-y-6 border-blue-200 bg-slate-50/30">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Database className="w-5 h-5" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Konfigurasi Global (Admin)</h3>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Folder ID di bawah akan digunakan sebagai fallback jika user tidak menentukan folder Drive-nya sendiri.
          </p>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Folder ID</label>
              <input 
                type="text"
                value={globalFolderId}
                onChange={(e) => setGlobalFolderId(e.target.value)}
                placeholder="Folder ID untuk semua laporan..."
                className="input-base bg-white"
              />
            </div>
            <button 
              onClick={handleSaveGlobalDrive}
              disabled={globalLoading}
              className="w-full btn-primary"
            >
              {globalLoading ? 'Menyimpan...' : 'Simpan Konfigurasi Global'}
            </button>

            <div className="pt-4 border-t border-slate-200 mt-6">
              <a 
                href={`https://console.firebase.google.com/project/${user.id ? 'current-project' : ''}/firestore/databases/default/data`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Database className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Buka Database Firestore</p>
                    <p className="text-[10px] font-medium opacity-70">Kelola data mentah via Firebase Console</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
