import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import axios from 'axios';
import { 
  Building2, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Moon,
  Sun,
  LogOut,
  Calendar,
  X
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const SupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editDeadline, setEditDeadline] = useState('');
  const [editPriority, setEditPriority] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_URL}/complaints`, { withCredentials: true });
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpdateStatus = async (complaintId, status) => {
    try {
      await axios.put(
        `${API_URL}/complaints/${complaintId}/status`,
        { status },
        { withCredentials: true }
      );
      fetchComplaints();
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
      fetchComplaints();
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

  const stats = {
    total: complaints.length,
    reviewBoard: complaints.filter(c => c.status === 'review_board').length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    completed: complaints.filter(c => c.status === 'completed').length
  };

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
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Supervisor Dashboard</p>
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
                onClick={toggleDarkMode}
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-primary-600 bg-primary-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Review Board</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.reviewBoard}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-indigo-600 bg-indigo-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 bg-yellow-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inProgress}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-purple-600 bg-purple-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 bg-green-100 p-2 rounded-lg" />
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

        {/* Complaints List */}
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
          <div className="grid gap-4">
            {filteredComplaints.map((complaint) => {
              const deadlineStatus = getDeadlineStatus(complaint.deadline);
              return (
                <div key={complaint.id} className="card p-6 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`badge ${getStatusBadge(complaint.status)}`}>
                          {complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`badge ${getPriorityBadge(complaint.priority)}`}>
                          {complaint.priority.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          #{complaint.id} • {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{complaint.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
                        <div>
                          <span className="font-medium">Student:</span> {complaint.student_name}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {complaint.hostel_block} - Room {complaint.room_number}
                        </div>
                        {complaint.worker_name && (
                          <div>
                            <span className="font-medium">Worker:</span> {complaint.worker_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Supporters:</span> {complaint.support_count || 0}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progress</span>
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

                      {deadlineStatus && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${deadlineStatus.bg} ${deadlineStatus.color}`}>
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            Deadline: {new Date(complaint.deadline).toLocaleDateString()}
                          </span>
                          <span className="font-semibold">({deadlineStatus.status.toUpperCase()})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
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
                          onClick={() => handleUpdateStatus(complaint.id, 'assigned')}
                          className="btn-secondary text-xs px-3 py-1"
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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

export default SupervisorDashboard;
