import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import axios from 'axios';
import {
  Building2,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  UserCheck,
  Filter,
  X,
  Moon,
  Sun,
  Bell
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDeadline, setEditDeadline] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        withCredentials: true
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        withCredentials: true
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [complaintsRes, workersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/complaints`, { withCredentials: true }),
        axios.get(`${API_URL}/users/workers`, { withCredentials: true }),
        axios.get(`${API_URL}/stats/dashboard`, { withCredentials: true })
      ]);
      setComplaints(complaintsRes.data.complaints);
      setWorkers(workersRes.data.workers);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAssignWorker = async (workerId) => {
    try {
      await axios.put(
        `${API_URL}/complaints/${selectedComplaint.id}/assign`,
        { workerId },
        { withCredentials: true }
      );
      setShowAssignModal(false);
      setSelectedComplaint(null);
      fetchData();
    } catch (error) {
      console.error('Failed to assign worker:', error);
      alert('Failed to assign worker. Please try again.');
    }
  };

  const handleUpdateStatus = async (complaintId, status) => {
    try {
      await axios.put(
        `${API_URL}/complaints/${complaintId}/status`,
        { status },
        { withCredentials: true }
      );
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleEditDetails = async () => {
    try {
      await axios.put(
        `${API_URL}/complaints/${selectedComplaint.id}/details`,
        { deadline: editDeadline || null, priority: editPriority },
        { withCredentials: true }
      );
      setShowEditModal(false);
      setSelectedComplaint(null);
      setEditDeadline('');
      setEditPriority('');
      fetchData();
    } catch (error) {
      console.error('Failed to update details:', error);
      alert('Failed to update details. Please try again.');
    }
  };

  const openEditModal = (complaint) => {
    setSelectedComplaint(complaint);
    setEditDeadline(complaint.deadline ? complaint.deadline.split('T')[0] : '');
    setEditPriority(complaint.priority);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      review_board: 'bg-indigo-100 text-indigo-800',
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return styles[priority] || 'bg-gray-100 text-gray-800';
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-50' };
    if (diffDays <= 2) return { status: 'urgent', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (diffDays <= 7) return { status: 'approaching', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const getProgressPercentage = (status) => {
    const progressMap = {
      review_board: 0,
      pending: 20,
      assigned: 40,
      in_progress: 80,
      completed: 100,
      rejected: 0
    };
    return progressMap[status] || 0;
  };

  const filteredComplaints = filter === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">HostelCare</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/public')}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                Public Dashboard
              </button>
              <button
                onClick={() => navigate('/user-management')}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                User Management
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No notifications</p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-primary-600 bg-primary-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 bg-yellow-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inProgress || 0}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-purple-600 bg-purple-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 bg-green-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 bg-blue-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Workers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalWorkers || 0}</p>
              </div>
              <UserCheck className="w-10 h-10 text-indigo-600 bg-indigo-100 p-2 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Complaints</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field pl-10 pr-10 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="review_board">Review Board</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="card p-12 text-center dark:bg-gray-800 dark:border-gray-700">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No complaints found</h3>
            <p className="text-gray-600 dark:text-gray-300">There are no complaints matching the current filter.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto dark:bg-gray-800 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">#{complaint.id}</td>
                    <td className="px-6 py-4">
                      <div className="min-w-[150px]">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{complaint.student_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{complaint.hostel_block} - {complaint.room_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getPriorityBadge(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(complaint.status)}`}>
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {complaint.worker_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[100px]">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {complaint.status === 'rejected' ? (
                            <span className="text-red-600 font-medium">Rejected</span>
                          ) : (
                            <span>{getProgressPercentage(complaint.status)}%</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              complaint.status === 'rejected' ? 'bg-red-500' : 'bg-primary-600'
                            }`}
                            style={{ width: complaint.status === 'rejected' ? '100%' : `${getProgressPercentage(complaint.status)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {complaint.deadline ? (() => {
                        const deadlineStatus = getDeadlineStatus(complaint.deadline);
                        return (
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${deadlineStatus.bg} ${deadlineStatus.color}`}>
                            <span className="font-medium">
                              {new Date(complaint.deadline).toLocaleDateString()}
                            </span>
                            <span className="font-semibold">({deadlineStatus.status.toUpperCase()})</span>
                          </div>
                        );
                      })() : <span className="text-sm text-gray-400">No deadline</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(complaint)}
                          className="btn-secondary text-xs px-3 py-1"
                        >
                          Edit
                        </button>
                        {complaint.status === 'review_board' && (
                          <button
                            onClick={() => handleUpdateStatus(complaint.id, 'pending')}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Approve
                          </button>
                        )}
                        {complaint.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowAssignModal(true);
                            }}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Assign
                          </button>
                        )}
                        {complaint.status === 'assigned' && (
                          <button
                            onClick={() => handleUpdateStatus(complaint.id, 'in_progress')}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            Start
                          </button>
                        )}
                        {complaint.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(complaint.id, 'completed')}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Assign Worker Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Worker</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedComplaint(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Complaint:</strong> {selectedComplaint.category.charAt(0).toUpperCase() + selectedComplaint.category.slice(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Student:</strong> {selectedComplaint.student_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Worker
                </label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Choose a worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleAssignWorker(selectedWorker)}
                disabled={!selectedWorker}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Worker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {showEditModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Complaint Details</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedComplaint(null);
                  setEditDeadline('');
                  setEditPriority('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Complaint:</strong> {selectedComplaint.category.charAt(0).toUpperCase() + selectedComplaint.category.slice(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Student:</strong> {selectedComplaint.student_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <button
                onClick={handleEditDetails}
                className="btn-primary w-full"
              >
                Update Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
