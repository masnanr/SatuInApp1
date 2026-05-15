import React from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus,
  Shield,
  Search,
  Loader2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const TeamManagement = () => {
  const [teams, setTeams] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newTeamName, setNewTeamName] = React.useState('');
  
  // Selection
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubTeams();
      unsubUsers();
    };
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await addDoc(collection(db, 'teams'), {
        nama: newTeamName.trim()
      });
      setNewTeamName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Hapus tim ini? Semua relasi kegiatan mungkin terpengaruh.')) return;
    try {
      await deleteDoc(doc(db, 'teams', id));
      if (selectedTeam === id) setSelectedTeam(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-slate-500 font-medium">Memuat Data Tim...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Tim</h2>
          <p className="text-slate-500 font-medium text-sm">Kelola daftar tim kerja dan anggota.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Teams List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-base p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Tambah Tim Baru</h3>
            <form onSubmit={handleCreateTeam} className="flex gap-2">
              <input 
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Nama Tim..."
                className="input-base text-sm"
                required
              />
              <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="card-base p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Daftar Tim</h3>
            <div className="space-y-2">
              {teams.map(team => (
                <div 
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer font-bold text-sm",
                    selectedTeam === team.id 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                      : "bg-white text-slate-600 border-slate-100 hover:border-indigo-400"
                  )}
                >
                  {team.nama}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      selectedTeam === team.id ? "hover:bg-indigo-500 text-white/80" : "text-slate-300 hover:text-rose-600"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Team Members / Users Overview */}
        <div className="lg:col-span-2">
          <div className="card-base p-8 space-y-6">
             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
               <div>
                 <h3 className="text-xl font-bold text-slate-800">
                    {selectedTeam ? `Anggota: ${teams.find(t => t.id === selectedTeam)?.nama}` : 'Semua Pengguna'}
                 </h3>
                 <p className="text-xs text-slate-500 font-medium">Klik tim di samping untuk melihat anggota spesifik.</p>
               </div>
               <div className="relative">
                 <input type="text" placeholder="Cari user..." className="input-base text-xs pl-9 min-w-[200px]" />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {users.map(u => (
                 <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                        <img src={u.avatar} alt="" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{u.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          {u.role === 'admin' ? <Shield className="w-3 h-3 text-amber-500" /> : null}
                          {u.email}
                        </p>
                      </div>
                    </div>
                    {/* Placeholder for role modification or team assignment */}
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter",
                      u.role === 'admin' ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                    )}>
                      {u.role}
                    </span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
