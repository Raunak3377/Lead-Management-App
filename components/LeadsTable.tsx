
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Lead, User } from '../types';

const LeadsTable: React.FC<{ user: User }> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await api.get<Lead[]>('/leads');
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(l => 
    l.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm) ||
    l.id?.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);
    try {
      if (editingLead) {
        await api.put('/leads', { ...payload, leadId: editingLead.id });
      } else {
        await api.post('/leads', payload);
      }
      setShowAddModal(false);
      setEditingLead(null);
      fetchLeads();
    } catch (err) {
      alert('Failed to save lead');
    }
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search leads by name, phone or ID..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <button 
          onClick={() => { setEditingLead(null); setShowAddModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Add New Lead
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remark</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4 h-12 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">No leads found.</td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-500">{lead.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{lead.studentName}</div>
                      <div className="text-[10px] text-slate-400">{lead.city}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{lead.phone}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-600">{lead.course}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        lead.status === 'New' ? 'bg-blue-100 text-blue-600' :
                        lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-600' :
                        lead.status === 'Dead' ? 'bg-red-100 text-red-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate italic text-xs">"{lead.lastRemark}"</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEdit(lead)}
                        className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 justify-end ml-auto group"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingLead ? 'Modify Lead Details' : 'Onboard New Lead'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Name</label>
                <input name="studentName" required defaultValue={editingLead?.studentName || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                <input name="phone" required defaultValue={editingLead?.phone || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="+1234567890" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source</label>
                <select name="source" defaultValue={editingLead?.source || 'Web Search'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option>Web Search</option>
                  <option>Social Media</option>
                  <option>Referral</option>
                  <option>Direct Mail</option>
                  <option>Organic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course Interest</label>
                <input name="course" required defaultValue={editingLead?.course || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Data Science" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                <input name="city" required defaultValue={editingLead?.city || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="City name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lead Status</label>
                <select name="status" defaultValue={editingLead?.status || 'New'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold">
                  <option value="New">New</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Converted">Converted</option>
                  <option value="Dead">Dead</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Next Follow-up Date</label>
                <input name="nextFollowupDate" type="date" defaultValue={editingLead?.nextFollowupDate ? new Date(editingLead.nextFollowupDate).toISOString().split('T')[0] : ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Latest Remark</label>
                <textarea name="remark" required defaultValue={editingLead?.lastRemark || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm h-24" placeholder="Enter conversion notes or next steps..."></textarea>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 text-slate-600 font-semibold text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                  {editingLead ? 'Apply Changes' : 'Confirm & Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
