
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Lead, User } from '../types';

const Followups: React.FC<{ user: User }> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const data = await api.get<Lead[]>('/followups');
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFollowups(); }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr);

  const overdue = leads.filter(l => l.nextFollowupDate && new Date(l.nextFollowupDate) < todayDate);
  const forToday = leads.filter(l => l.nextFollowupDate && new Date(l.nextFollowupDate).toISOString().split('T')[0] === todayStr);

  const renderTaskCard = (lead: Lead) => (
    <div key={lead.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.id}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          lead.status === 'New' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
        }`}>
          {lead.status}
        </span>
      </div>
      <div className="mb-4">
        <h4 className="font-bold text-slate-900 text-base">{lead.studentName}</h4>
        <p className="text-sm font-semibold text-indigo-600">{lead.phone}</p>
        <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tight">{lead.course}</p>
      </div>
      <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Last Remark</p>
        <p className="text-xs text-slate-700 italic">"{lead.lastRemark || 'No remarks yet'}"</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setSelectedLead(lead)}
          className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          Update Task
        </button>
        <a 
          href={`tel:${lead.phone}`}
          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </div>
    </div>
  );

  return (
    <div className="pb-10 space-y-8">
      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>)}
          </div>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase text-red-600 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                Critical Overdue ({overdue.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overdue.map(renderTaskCard)}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold uppercase text-indigo-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-700 rounded-full"></span>
              Tasks For Today ({forToday.length})
            </h3>
            {forToday.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400 font-medium">
                No tasks scheduled for today. Great job!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forToday.map(renderTaskCard)}
              </div>
            )}
          </section>
        </>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <h2 className="text-lg font-bold">Update Lead: {selectedLead.studentName}</h2>
              <p className="text-xs text-slate-500 mt-1">Status: {selectedLead.status} | Course: {selectedLead.course}</p>
            </div>
            <form className="p-6 space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                await api.put('/followups', {
                  id: selectedLead.id,
                  remark: formData.get('remark'),
                  status: formData.get('status'),
                  nextFollowupDate: formData.get('nextDate')
                });
                setSelectedLead(null);
                fetchFollowups();
              } catch (err) { alert('Update failed'); }
            }}>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Conversation Note</label>
                <textarea name="remark" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-28 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="What did you discuss with the student?"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Status</label>
                  <select name="status" defaultValue={selectedLead.status} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold">
                    <option value="Follow-up">Follow-up</option>
                    <option value="Converted">Converted</option>
                    <option value="Dead">Dead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Next Date</label>
                  <input type="date" name="nextDate" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedLead(null)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors">Dismiss</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-indigo-700 transform active:scale-95 transition-all">Complete Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Followups;
