import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileCheck, 
  FolderKanban, 
  Activity, 
  TrendingUp, 
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, icon, trend, trendValue }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
  >
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
    <div className="flex items-end gap-2">
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <div className={cn(
        "text-[10px] font-bold mb-1 px-1.5 py-0.5 rounded",
        trend === 'up' ? "bg-emerald-50 text-emerald-600" : trend === 'down' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"
      )}>
        {trendValue}
      </div>
    </div>
  </motion.div>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const [reportCount, setReportCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  
  const [teamData, setTeamData] = useState<{labels: string[], values: number[]}>({ labels: [], values: [] });
  const [trendData, setTrendData] = useState<{labels: string[], values: number[]}>({ labels: [], values: [] });
  const [topContributors, setTopContributors] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Real-time reports and aggregation
    let qReports = query(collection(db, 'reports'));
    if (user.role !== 'admin') {
      qReports = query(collection(db, 'reports'), where('user_id', '==', user.id));
    }
    
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      setReportCount(snapshot.size);

      // Aggregations
      const teamMap: Record<string, number> = {};
      const dateMap: Record<string, number> = {};
      const userMap: Record<string, {name: string, avatar: string, count: number, team: string}> = {};

      docs.forEach(doc => {
        // Teams
        const team = doc.teamName || 'Tanpa Tim';
        teamMap[team] = (teamMap[team] || 0) + 1;

        // Daily Trend (last 7 entries)
        const date = doc.tanggal || 'N/A';
        dateMap[date] = (dateMap[date] || 0) + 1;

        // Contributors
        const uId = doc.user_id;
        if (!userMap[uId]) {
           userMap[uId] = { name: doc.userName || 'Anonymous', avatar: '', count: 0, team: doc.teamName || '' };
        }
        userMap[uId].count += 1;
      });

      // Prepare Bar Data
      setTeamData({
        labels: Object.keys(teamMap),
        values: Object.values(teamMap)
      });

      // Prepare Line Data (Sorted by date)
      const sortedDates = Object.keys(dateMap).sort().slice(-7);
      setTrendData({
        labels: sortedDates,
        values: sortedDates.map(d => dateMap[d])
      });

      // Prepare Contributors
      const sortedUsers = Object.values(userMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopContributors(sortedUsers);

    }, (error) => {
      console.error('Reports Error:', error);
    });

    // Counts
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUserCount(snap.size);
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeamCount(snap.size);
    });

    const unsubActs = onSnapshot(collection(db, 'activities'), (snap) => {
      setActivityCount(snap.size);
    });

    return () => {
      unsubReports();
      unsubUsers();
      unsubTeams();
      unsubActs();
    };
  }, [user]);

  const barData = {
    labels: teamData.labels.length > 0 ? teamData.labels : ['Belum Ada Data'],
    datasets: [
      {
        label: 'Kontribusi Laporan',
        data: teamData.values.length > 0 ? teamData.values : [0],
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const lineData = {
    labels: trendData.labels.length > 0 ? trendData.labels : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    datasets: [
      {
        label: 'Aktivitas Harian',
        data: trendData.values.length > 0 ? trendData.values : [0,0,0,0,0,0,0],
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const pieData = {
    labels: teamData.labels.length > 0 ? teamData.labels : ['No Data'],
    datasets: [
      {
        data: teamData.values.length > 0 ? teamData.values : [1],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(37, 99, 235, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ringkasan Statistik</h2>
          <p className="text-slate-500">Pantau performa dan kontribusi tim secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm">
            <option>Semua Tim</option>
            <option>Tim IT</option>
            <option>Tim HR</option>
          </select>
          <input 
            type="date" 
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Laporan" value={reportCount.toLocaleString()} icon={<FileCheck />} trend="up" trendValue="+12.5%" />
        <StatCard title="User Aktif" value={userCount.toLocaleString()} icon={<Users />} trend="up" trendValue="+3.2%" />
        <StatCard title="Total Tim" value={teamCount.toLocaleString()} icon={<FolderKanban />} trend="neutral" trendValue="0%" />
        <StatCard title="Kegiatan Master" value={activityCount.toLocaleString()} icon={<Activity />} trend="neutral" trendValue="0%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">Aktivitas Mingguan (Mei 2024)</h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Laporan</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><span className="w-3 h-3 bg-slate-200 rounded-sm"></span> Rata-rata</span>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <Bar 
              data={barData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Tren Pertumbuhan</h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                <TrendingUp className="w-3 h-3" /> +18.2%
              </span>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <Line 
              data={lineData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribusi Tim</h3>
          <div className="h-[250px] flex items-center justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Contributor</h3>
          <div className="space-y-4">
            {topContributors.length === 0 && (
              <p className="text-center text-slate-400 py-10 italic">Belum ada data kontributor</p>
            )}
            {topContributors.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold">
                    {c.avatar ? <img src={c.avatar} alt="user" /> : c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{c.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{c.count} Laporan</p>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(100, (c.count / (reportCount || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
