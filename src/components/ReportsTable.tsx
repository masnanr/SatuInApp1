import React, { useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  FileIcon,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Calendar,
  Loader2,
  Paperclip
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { exportReportsToExcel } from '../services/excelService';

const Badge = ({ children, color }: any) => (
  <span className={cn(
    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
    color === 'blue' ? "bg-blue-50 text-blue-600" : 
    color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
    "bg-slate-100 text-slate-600"
  )}>
    {children}
  </span>
);

export const ReportsTable = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [reports, setReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    if (!user) return;

    const reportsRef = collection(db, 'reports');
    let q = query(reportsRef, orderBy('created_at', 'desc'));

    // If not admin, only show own reports
    if (user.role !== 'admin') {
      q = query(reportsRef, where('user_id', '==', user.id), orderBy('created_at', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(docs);
      setLoading(false);
    }, (error) => {
      console.error('Firestore Error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleExport = () => {
    const buffer = exportReportsToExcel(reports);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Kegiatan_${new Date().toLocaleDateString()}.xlsx`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="font-bold text-slate-800">Daftar Laporan Kegiatan</h4>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="Cari laporan..."
                className="pl-8 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Pegawai</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Nama Kegiatan</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase text-center">Waktu</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Penjelasan</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <motion.tr 
                  layout
                  key={report.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-default"
                >
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">{report.userName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{report.teamName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-slate-600 font-bold line-clamp-1">{report.subActivityName}</span>
                      <div>
                        <Badge color="blue">{report.activityName}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-500 whitespace-nowrap font-medium">{report.tanggal}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{report.jam}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 max-w-xs">
                    <p className="text-sm text-slate-500 line-clamp-1 italic">
                      {report.penjelasan}
                    </p>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 text-right">
                      {report.pdf_link && (
                        <a 
                          href={report.pdf_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-blue-600 hover:text-white transition-all"
                        >
                          PDF <FileIcon className="w-3 h-3" />
                        </a>
                      )}
                      {report.attachment_link && (
                        <a 
                          href={report.attachment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          BUKTI <Paperclip className="w-3 h-3" />
                        </a>
                      )}
                      {!report.pdf_link && !report.attachment_link && (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Files</span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Menampilkan 1-10 dari 124 laporan
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            {[1, 2, 3].map(p => (
              <button 
                key={p}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                  p === 1 ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {p}
              </button>
            ))}
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
