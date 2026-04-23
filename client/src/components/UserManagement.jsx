import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import axios from 'axios';
import {
  Building2,
  UserPlus,
  Briefcase,
  Shield,
  X,
  Moon,
  Sun,
  Trash2
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const UserManagement = () => {
  const { logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  
  const [workers, setWorkers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  
  const [workerForm, setWorkerForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  
  const [supervisorForm, setSupervisorForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [workersRes, supervisorsRes] = await Promise.all([
        axios.get(`${API_URL}/users/workers`, { withCredentials: true }),
        axios.get(`${API_URL}/users/supervisors`, { withCredentials: true })
      ]);
      setWorkers(workersRes.data.workers || []);
      setSupervisors(supervisorsRes.data.supervisors || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/users/workers`, workerForm, { withCredentials: true });
      setShowWorkerModal(false);
      setWorkerForm({ name: '', email: '', password: '', phone: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create worker');
    }
  };

  const handleCreateSupervisor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/users/supervisors`, supervisorForm, { withCredentials: true });
      setShowSupervisorModal(false);
      setSupervisorForm({ name: '', email: '', password: '', phone: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create supervisor');
    }
  };

  const handleDeleteUser = async (userId, role) => {
    if (!window.confirm(`Are you sure you want to delete this ${role}?`)) return;

    try {
      await axios.delete(`${API_URL}/users/${userId}`, { withCredentials: true });
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">HostelCare</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">User Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="btn-secondary text-sm"
              >
                Back to Dashboard
              </button>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Management</h2>
          <p className="text-gray-600 dark:text-gray-300">Create and manage workers and supervisors</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Workers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{workers.length}</p>
              </div>
              <Briefcase className="w-12 h-12 text-blue-600 bg-blue-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Supervisors</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{supervisors.length}</p>
              </div>
              <Shield className="w-12 h-12 text-purple-600 bg-purple-100 p-2 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowWorkerModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Worker
          </button>
          <button
            onClick={() => setShowSupervisorModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Supervisor
          </button>
        </div>

        {/* Workers List */}
        <div className="card p-6 dark:bg-gray-800 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Workers
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : workers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-4">No workers found</p>
          ) : (
            <div className="space-y-3">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{worker.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{worker.email}</p>
                    {worker.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{worker.phone}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteUser(worker.id, 'worker')}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supervisors List */}
        <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Supervisors
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : supervisors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-4">No supervisors found</p>
          ) : (
            <div className="space-y-3">
              {supervisors.map((supervisor) => (
                <div key={supervisor.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{supervisor.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{supervisor.email}</p>
                    {supervisor.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{supervisor.phone}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteUser(supervisor.id, 'supervisor')}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Worker</h2>
              <button
                onClick={() => setShowWorkerModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={workerForm.email}
                  onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={workerForm.password}
                  onChange={(e) => setWorkerForm({ ...workerForm, password: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={workerForm.phone}
                  onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <button type="submit" className="w-full btn-primary">
                Create Worker
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Supervisor Modal */}
      {showSupervisorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Supervisor</h2>
              <button
                onClick={() => setShowSupervisorModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateSupervisor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={supervisorForm.name}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, name: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={supervisorForm.email}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, email: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={supervisorForm.password}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, password: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={supervisorForm.phone}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, phone: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <button type="submit" className="w-full btn-primary">
                Create Supervisor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
