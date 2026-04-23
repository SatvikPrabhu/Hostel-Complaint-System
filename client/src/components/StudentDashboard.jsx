import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import axios from 'axios';
import { 
  Building2, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Star,
  Upload,
  X,
  Image as ImageIcon,
  Moon,
  Sun
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    priority: 'medium',
    media: null,
    deadline: ''
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_URL}/complaints/my`, {
        withCredentials: true
      });
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

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('category', formData.category);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('priority', formData.priority);
    if (formData.deadline) {
      formDataToSend.append('deadline', formData.deadline);
    }
    if (formData.media) {
      formDataToSend.append('media', formData.media);
    }

    try {
      await axios.post(`${API_URL}/complaints`, formDataToSend, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      setFormData({ category: '', description: '', priority: 'medium', media: null, deadline: '' });
      fetchComplaints();
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    }
  };

  const handleSubmitFeedback = async (rating, comments) => {
    try {
      await axios.post(`${API_URL}/complaints/${selectedComplaint.id}/feedback`, 
        { rating, comments },
        { withCredentials: true }
      );
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
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

  const isVideo = (filename) => {
    if (!filename) return false;
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi'];
    const extension = filename.split('.').pop().toLowerCase();
    return videoExtensions.includes(extension);
  };

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
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Student Dashboard</p>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Student</p>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <FileText className="w-12 h-12 text-primary-600 bg-primary-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Review Board</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.reviewBoard}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-indigo-600 bg-indigo-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 bg-yellow-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.inProgress}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-purple-600 bg-purple-100 p-2 rounded-lg" />
            </div>
          </div>
          <div className="card p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 bg-green-100 p-2 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Complaints</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Complaint
          </button>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="card p-12 text-center dark:bg-gray-800 dark:border-gray-700">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No complaints yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Submit your first complaint to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Submit Complaint
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="card p-6 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`badge ${getStatusBadge(complaint.status)}`}>
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`badge ${getPriorityBadge(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{complaint.description}</p>
                    {complaint.media_path && (
                      <div className="mb-3 w-32 h-32 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        {isVideo(complaint.media_path) ? (
                          <video
                            src={`http://localhost:5000/uploads/${complaint.media_path}`}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={`http://localhost:5000/uploads/${complaint.media_path}`}
                            alt="Complaint media"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    {complaint.worker_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Assigned to: <span className="font-medium">{complaint.worker_name}</span>
                      </p>
                    )}
                    {complaint.deadline && (() => {
                      const deadlineStatus = getDeadlineStatus(complaint.deadline);
                      return (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${deadlineStatus.bg} ${deadlineStatus.color} mt-2`}>
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            Deadline: {new Date(complaint.deadline).toLocaleDateString()}
                          </span>
                          <span className="font-semibold">({deadlineStatus.status.toUpperCase()})</span>
                        </div>
                      );
                    })()}

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
                  </div>
                  <div className="flex gap-2">
                    {complaint.status === 'completed' && !complaint.feedback_rating && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setSelectedRating(0);
                        }}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Rate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit New Complaint</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select category</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="furniture">Furniture</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field min-h-[120px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Describe your issue in detail..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  {formData.media ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(formData.media)}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, media: null})}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({...formData, media: e.target.files[0]})}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="btn-secondary inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-8 w-full max-w-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rate Service</h2>
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setSelectedRating(0);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  How would you rate the service?
                </label>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= selectedRating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">
                    {selectedRating} star{selectedRating !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  className="input-field min-h-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Share your experience..."
                  id="feedback-comments"
                />
              </div>

              <button
                onClick={() => {
                  const comments = document.getElementById('feedback-comments').value;
                  handleSubmitFeedback(selectedRating, comments);
                }}
                disabled={selectedRating === 0}
                className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
