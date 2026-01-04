
import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { User, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadsTable from './components/LeadsTable';
import Followups from './components/Followups';
import UsersList from './components/UsersList';
import Reports from './components/Reports';
import Login from './components/Login';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('crm_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await api.get<User>('/auth/me');
      setUser(userData);
      api.setToken(token);
    } catch (err) {
      console.error('Auth failed', err);
      localStorage.removeItem('crm_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-500 font-medium">Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={checkAuth} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'leads': return <LeadsTable user={user} />;
      case 'followups': return <Followups user={user} />;
      case 'reports': return <Reports user={user} />;
      case 'users': return user.role === UserRole.ADMIN ? <UsersList /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={() => {
          localStorage.removeItem('crm_token');
          setUser(null);
        }}
      />
      <main className="flex-1 overflow-y-auto h-full p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-slate-500 text-sm">Welcome back, {user.name} ({user.role})</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
            <div className="h-8 w-8 bg-indigo-100 text-indigo-700 flex items-center justify-center rounded-full font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="text-xs">
              <p className="font-semibold">{user.name}</p>
              <p className="text-slate-400">{user.email}</p>
            </div>
          </div>
        </header>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
