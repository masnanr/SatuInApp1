import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Database,
  CloudUpload,
  HardDrive,
  FolderKanban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

interface NavItemProps {
  key?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const NavItem = ({ icon, label, active, onClick, collapsed }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full px-3 py-2 transition-all rounded-md group",
      active 
        ? "bg-blue-600/10 text-blue-400" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <div className={cn("flex-shrink-0", collapsed ? "mx-auto" : "mr-3")}>
      {icon}
    </div>
    {!collapsed && (
      <span className="font-medium truncate text-left">{label}</span>
    )}
    {!collapsed && active && (
      <ChevronRight className="ml-auto w-4 h-4" />
    )}
  </button>
);

export const Layout = ({ children, currentView, setCurrentView }: { children: React.ReactNode, currentView: string, setCurrentView: (view: string) => void }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'report-form', label: 'Form Lapor', icon: <FileText className="w-5 h-5" /> },
    { id: 'reports', label: 'Data Laporan', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'teams', label: 'Tim', icon: <Users className="w-5 h-5" /> },
    { id: 'master', label: 'Master Data', icon: <Database className="w-5 h-5" />, adminOnly: true },
    { id: 'keepup', label: 'Submit KipApp', icon: <CloudUpload className="w-5 h-5" /> },
    { id: 'settings', label: 'Pengaturan', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className="hidden md:flex flex-col bg-slate-900 text-slate-300 z-30"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
            S
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-white tracking-tight">SatuInApp</span>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {!collapsed && (
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</div>
          )}
          {navigation.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => (
            <NavItem 
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <NavItem 
            icon={<LogOut className="w-5 h-5" />} 
            label="Logout" 
            onClick={logout} 
            collapsed={collapsed}
          />
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full mt-4 p-2 text-slate-500 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight /> : <Menu />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 z-20">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              {currentView === 'dashboard' ? 'Statistik Kontribusi Pegawai' : navigation.find(n => n.id === currentView)?.label || currentView}
            </h1>
            <div className="hidden md:block h-6 w-[1px] bg-slate-200"></div>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium">
              <LogOut className="w-4 h-4 rotate-90" /> {/* Just a separator icon placeholder */}
              <span>Mei 2024</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer group relative">
              <div className="w-8 h-8 rounded-full bg-blue-500 overflow-hidden border-2 border-white shadow-sm">
                <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="avatar" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 md:hidden shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
                    S
                  </div>
                  <span className="text-xl font-bold text-white px-2">SatuInApp</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</div>
                {navigation.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => (
                  <NavItem 
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={currentView === item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileOpen(false);
                    }}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
