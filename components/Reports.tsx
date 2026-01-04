
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';

const Reports: React.FC<{ user: User }> = ({ user }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Corrected call to api.get to ensure route and params are separate
      const res = await api.get<any>('/reports', filters);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Synthesizing Productivity Data...</p>
    </div>
  );

  const renderProgressBar = (label: string, val: number, total: number, color = 'indigo') => {
    const pct = total > 0 ? ((val / total) * 100).toFixed(0) : '0';
    return (
      <div key={label} className="mb-4">
        <div className="flex justify-between text-xs mb-1 font-bold">
          <span className="text-slate-600 uppercase tracking-tighter">{label}</span>
          <span className="text-slate-400">{val} ({pct}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className={`bg-${color}-500 h-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
          <input 
            type="date" 
            className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
          <input 
            type="date" 
            className="w-full p-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          />
        </div>
        <button 
          onClick={fetchReports}
          className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors"
        >
          Refresh Analytics
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                Conversion Funnel
              </h3>
              {Object.entries(data.byStatus).map(([k, v]: [string, any]) => 
                renderProgressBar(k, v, Object.values(data.byStatus).reduce((a:any,b:any)=>a+b, 0) as number)
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                Channel Source
              </h3>
              {Object.entries(data.bySource).map(([k, v]: [string, any]) => 
                renderProgressBar(k, v, Object.values(data.bySource).reduce((a:any,b:any)=>a+b, 0) as number, 'emerald')
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                Course Popularity
              </h3>
              {Object.entries(data.byCourse).map(([k, v]: [string, any]) => 
                renderProgressBar(k, v, Object.values(data.byCourse).reduce((a:any,b:any)=>a+b, 0) as number, 'orange')
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Counselor Daily Productivity</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Daily Activity Logs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Work Date</th>
                    <th className="px-6 py-4">Counselor</th>
                    <th className="px-6 py-4 text-center">Leads Added</th>
                    <th className="px-6 py-4 text-center">Updates Done</th>
                    <th className="px-6 py-4 text-center text-emerald-600">Conversions</th>
                    <th className="px-6 py-4 text-center text-red-600">Dead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.dailyProductivity.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.date}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{item.counselor}</td>
                      <td className="px-6 py-4 text-center font-medium">{item.added}</td>
                      <td className="px-6 py-4 text-center font-medium text-blue-600">{item.updated}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.converted}</td>
                      <td className="px-6 py-4 text-center text-red-400 font-medium">{item.dead}</td>
                    </tr>
                  ))}
                  {data.dailyProductivity.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium italic">No activity recorded for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
