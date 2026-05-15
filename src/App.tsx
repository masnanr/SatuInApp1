/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ReportForm } from './components/ReportForm';
import { ReportsTable } from './components/ReportsTable';
import { KeepUpAutomation } from './components/KeepUpAutomation';
import { Settings } from './components/Settings';
import { TeamManagement } from './components/TeamManagement';
import { MasterData } from './components/MasterData';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './lib/AuthContext';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = React.useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return <ReportsTable />;
      case 'report-form':
        return <ReportForm />;
      case 'keepup':
        return <KeepUpAutomation />;
      case 'settings':
        return <Settings />;
      case 'teams':
        return <TeamManagement />;
      case 'master':
        return <MasterData />;
      default:
        return <Dashboard />;
    }
  };

  // Override the sidebar navigation setter for now since Layout is self-contained
  // but in a real app would use a router or state management.
  // I'll wrap the components in a custom Layout that takes a setter.

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

