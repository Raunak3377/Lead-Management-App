
import React, { useState, useEffect } from 'react';
import { api } from '../api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>('/dashboard', dateRange);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const kpis = stats ? [
    { label: 'Total Leads', value: stats.totalLeads, color: 'indigo' },
    { label: 'New Leads', value: stats.newLeads, color: 'blue' },
    { label: 'Follow-ups Due', value: stats.followupsDue, color: 'orange' },
    { label: 'Converted', value: stats.converted, color: 'emerald' },
    { label: 'Dead', value: stats.dead, color: 'red' },
    { label: 'Conversion %', value: stats.conversionRate, color: 'purple' },
  ] : [];

  return (
    <div className="space-y-8 pb-10">
      {/* Date Range Picker */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
          <input 
            type="date" 
            className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
          <input 
            type="date" 
            className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>
        <button 
          onClick={fetchStats}
          className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          Update View
        </button>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : !stats ? (
        <div className="text-center p-10 bg-white rounded-xl shadow">Error loading stats</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-transform hover:scale-[1.02]">
                <span className="text-slate-500 text-sm font-medium">{kpi.label}</span>
                <div className="flex items-end justify-between mt-2">
                  <span className={`text-3xl font-bold text-${kpi.color}-600`}>{kpi.value}</span>
                  <div className={`p-2 bg-${kpi.color}-50 rounded-lg`}>
                    <svg className={`w-6 h-6 text-${kpi.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stats.counselors && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Counselor Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Counselor</th>
                      <th className="px-6 py-3 text-center">Assigned</th>
                      <th className="px-6 py-3 text-center">Converted</th>
                      <th className="px-6 py-3 text-right">Conv Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.counselors.map((c: any) => (
                      <tr key={c.name} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-700">{c.name}</td>
                        <td className="px-6 py-4 text-center text-slate-500 font-medium">{c.total}</td>
                        <td className="px-6 py-4 text-center text-emerald-600 font-bold">{c.converted}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full">{c.rate}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
