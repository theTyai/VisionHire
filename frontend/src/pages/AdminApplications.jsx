import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Download, Search, CheckCircle, XCircle } from 'lucide-react';
import AppLayout from '../components/common/AppLayout';

export default function AdminApplications() {
  const { token } = useSelector(s => s.auth);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({ isApplicationOpen: true, isOAEnabled: false });

  useEffect(() => {
    fetchApplications();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSetting = async (key) => {
    try {
      const newValue = !settings[key];
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: newValue })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setApplications(apps => apps.map(app => app._id === id ? data.data : app));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCSV = () => {
    if (applications.length === 0) return;
    
    // Headers
    const headers = ['Name', 'Scholar No', 'Branch', 'Section', 'Email', 'Primary Domain', 'Secondary Domain', 'Status', 'Date Applied'];
    
    // Rows
    const csvRows = applications.map(app => [
      `"${app.name}"`,
      `"${app.scholarNo}"`,
      `"${app.branch}"`,
      `"${app.section}"`,
      `"${app.email}"`,
      `"${app.primaryDomain}"`,
      `"${app.secondaryDomain}"`,
      `"${app.status}"`,
      `"${new Date(app.createdAt).toLocaleDateString()}"`
    ]);
    
    const csvString = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vision_recruitment_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = applications.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.scholarNo.includes(searchTerm) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout title="Recruitment Applications">
      
      {/* Phase Management */}
      <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="font-display font-bold text-lg mb-4 text-white">Phase Management</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900/50 border border-white/5">
            <div>
              <div className="font-bold text-gray-200">Accept Applications</div>
              <div className="text-sm text-gray-400">Enable or disable the public recruitment form.</div>
            </div>
            <button 
              onClick={() => handleToggleSetting('isApplicationOpen')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isApplicationOpen ? 'bg-brand-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isApplicationOpen ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900/50 border border-white/5">
            <div>
              <div className="font-bold text-gray-200">Online Assessment Signups</div>
              <div className="text-sm text-gray-400">Allow applicants to register their test accounts.</div>
            </div>
            <button 
              onClick={() => handleToggleSetting('isOAEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isOAEnabled ? 'bg-brand-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isOAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Name, Scholar No, Email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-brand-500"
          />
        </div>
        
        <button 
          onClick={downloadCSV}
          disabled={applications.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50"
        >
          <Download size={18} />
          Download CSV
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-900 border-b border-gray-100 dark:border-white/10 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-4">Candidate</th>
                <th className="p-4">Details</th>
                <th className="p-4">Domains</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">Loading applications...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">No applications found.</td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr key={app._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">{app.name}</div>
                      <div className="text-sm text-gray-500">{app.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{app.scholarNo}</div>
                      <div className="text-xs text-gray-500">{app.branch} - {app.section}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm"><span className="text-brand-500 font-semibold text-xs uppercase">PRI:</span> {app.primaryDomain}</div>
                      <div className="text-sm"><span className="text-accent-500 font-semibold text-xs uppercase">SEC:</span> {app.secondaryDomain}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase
                        ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500' : ''}
                        ${app.status === 'reviewed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500' : ''}
                        ${app.status === 'shortlisted' ? 'bg-green-100 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-500' : ''}
                        ${app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500' : ''}
                      `}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {app.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateStatus(app._id, 'shortlisted')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors" title="Shortlist">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleUpdateStatus(app._id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Reject">
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                      {app.status !== 'pending' && (
                         <button onClick={() => handleUpdateStatus(app._id, 'pending')} className="text-xs text-gray-500 hover:text-white underline">
                           Reset Status
                         </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
