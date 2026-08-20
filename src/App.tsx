import React from 'react';
import { VitalsProvider, useVitals } from './context/VitalsContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmergencyModal } from './components/EmergencyModal';

import { DashboardView } from './views/DashboardView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { PatientsView } from './views/PatientsView';
import { PriorityMonitorView } from './views/PriorityMonitorView';
import { AlertsView } from './views/AlertsView';
import { HistoryView } from './views/HistoryView';
import { ReportsView } from './views/ReportsView';
import { DevicesView } from './views/DevicesView';
import { AIAnalysisView } from './views/AIAnalysisView';
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab } = useVitals();

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'monitoring':
        return <LiveMonitoringView />;
      case 'patients':
        return <PatientsView />;
      case 'priority':
        return <PriorityMonitorView />;
      case 'alerts':
        return <AlertsView />;
      case 'history':
        return <HistoryView />;
      case 'reports':
        return <ReportsView />;
      case 'devices':
        return <DevicesView />;
      case 'ai':
        return <AIAnalysisView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {renderView()}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <VitalsProvider>
      <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
        <EmergencyModal />
      </div>
    </VitalsProvider>
  );
};

export default App;
