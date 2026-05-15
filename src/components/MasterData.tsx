import React from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Database, 
  Layers, 
  Subtitles,
  AlertCircle,
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
  orderBy 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export const MasterData = () => {
  const [teams, setTeams] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  
  // Selection states
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);

  // Input states
  const [newActivity, setNewActivity] = React.useState('');

  React.useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubActivities = onSnapshot(query(collection(db, 'activities'), orderBy('nama')), (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubTeams();
      unsubActivities();
    };
  }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !newActivity.trim()) return;
    try {
      await addDoc(collection(db, 'activities'), {
        nama: newActivity.trim(),
        team_id: selectedTeam
      });
      setNewActivity('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (!confirm('Hapus data ini?')) return;
    try {
      await deleteDoc(doc(db, coll, id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-slate-500 font-medium">Memuat Master Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Master Data Kegiatan</h2>
          <p className="text-slate-500 font-medium text-sm">Kelola struktur kegiatan utama tiap tim.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: SELECT TEAM */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <span className="w-6 h-6 bg-slate-100 rounded-full text-xs flex items-center justify-center">1</span>
            Pilih Tim
          </div>
          <div className="space-y-2">
            {teams.length === 0 && (
              <div className="p-4 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Belum ada tim. Buat di menu Tim.
              </div>
            )}
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => {
                  setSelectedTeam(team.id);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all border font-bold text-sm",
                  selectedTeam === team.id 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                    : "bg-white text-slate-600 border-slate-100 hover:border-blue-400 hover:bg-slate-50"
                )}
              >
                {team.nama}
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: MANAGE ACTIVITIES */}
        <div className={cn("card-base p-6 space-y-4 transition-all", !selectedTeam && "opacity-50 grayscale")}>
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <span className="w-6 h-6 bg-slate-100 rounded-full text-xs flex items-center justify-center">2</span>
            Kategori Kegiatan
          </div>
          
          {selectedTeam ? (
            <>
              <form onSubmit={handleAddActivity} className="flex gap-2">
                <input 
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Tambah Kategori Kegiatan..."
                  className="input-base text-sm"
                  required
                />
                <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </form>

              <div className="space-y-2 overflow-y-auto max-h-[600px] no-scrollbar">
                {activities.filter(a => a.team_id === selectedTeam).map(activity => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm"
                  >
                    <span className="text-sm font-bold text-slate-600">{activity.nama}</span>
                    <button 
                      onClick={() => handleDelete('activities', activity.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
             <p className="text-center text-xs text-slate-400 italic py-10">Pilih tim terlebih dahulu</p>
          )}
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
