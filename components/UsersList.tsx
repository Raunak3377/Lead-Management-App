
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, UserRole } from '../types';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.get<User[]>('/users');
      setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold">Staff Management</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          Add Staff
        </button>
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
          <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {users.map(u => (
            <tr key={u.id}>
              <td className="px-6 py-4 font-semibold">{u.name}</td>
              <td className="px-6 py-4 text-slate-500">{u.email}</td>
              <td className="px-6 py-4">{u.role}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{u.status}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-indigo-600 font-bold">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isAdding && (
         <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-6">Create Counselor Account</h2>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await api.post('/users', Object.fromEntries(fd));
                  setIsAdding(false);
                  fetchUsers();
                } catch(err) { alert('Error adding user'); }
              }}>
                <input name="name" required placeholder="Full Name" className="w-full p-3 border rounded-xl bg-slate-50" />
                <input name="email" type="email" required placeholder="Email Address" className="w-full p-3 border rounded-xl bg-slate-50" />
                <input name="password" required placeholder="Initial Password" type="password" className="w-full p-3 border rounded-xl bg-slate-50" />
                <select name="role" className="w-full p-3 border rounded-xl bg-slate-50">
                  <option value="Counselor">Counselor</option>
                  <option value="Admin">Admin</option>
                </select>
                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Create User</button>
                </div>
              </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default UsersList;
