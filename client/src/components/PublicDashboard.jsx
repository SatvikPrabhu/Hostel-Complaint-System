import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle,
  UserCheck, 
  AlertCircle,
  Calendar,
  Filter,
  Moon,
  Sun,
  ThumbsUp,
  X
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const PublicDashboard = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_URL}/complaints/public`);
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setLoading(false);
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

  const handleSupport = async (complaintId) => {
    try {
      await axios.post(`${API_URL}/complaints/${complaintId}/support`, { comment }, {
        withCredentials: true
      });
      fetchComplaints();
      setComment('');
    } catch (error) {
      console.error('Failed to support complaint:', error);
    }
  };

  const fetchComments = async (complaintId) => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`${API_URL}/complaints/${complaintId}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (complaintId) => {
    if (!comment.trim()) return;

    if (!user) {
      alert('Please login to add comments');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${API_URL}/complaints/${complaintId}/comments`, {
        content: comment,
        userId: user.id
      });
      setComment('');
      fetchComments(complaintId);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
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

  const handleOpenDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
    fetchComments(complaint.id);
  };

  const handleCloseDetail = () => {
    setSelectedComplaint(null);
    setShowDetailModal(false);
    setComment('');
  };

  const filteredComplaints = filter === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filter);

  const stats = {
    total: complaints.length,
    reviewBoard: complaints.filter(c => c.status === 'review_board').length,
    pending: complaints.filter(c => c.status === 'pending').length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
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
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Public Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
              </button>
              {user ? (
                <button
                  onClick={() => navigate(`/${user.role}-dashboard`)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  Back to Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Assigned</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.assigned}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-blue-600 bg-blue-100 p-2 rounded-lg" />
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
                <div 
                  key={complaint.id} 
                  className="card p-6 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                  onClick={() => handleOpenDetail(complaint)}
                >
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
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{complaint.description}</p>

                      {complaint.media_path && (
                        <div className="mb-3 h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                          {isVideo(complaint.media_path) ? (
                            <video
                              src={`http://localhost:5000/uploads/${complaint.media_path}`}
                              controls
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <img
                              src={`http://localhost:5000/uploads/${complaint.media_path}`}
                              alt="Complaint media"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
                        {complaint.worker_name && (
                          <div>
                            <span className="font-medium">Worker:</span> {complaint.worker_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="font-medium">{complaint.support_count || 0} supporters</span>
                        </div>
                      </div>

                      {deadlineStatus && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${deadlineStatus.bg} ${deadlineStatus.color} mb-3`}>
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            Deadline: {new Date(complaint.deadline).toLocaleDateString()}
                          </span>
                          <span className="font-semibold">({deadlineStatus.status.toUpperCase()})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Complaint Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complaint Details</h2>
              <button
                onClick={handleCloseDetail}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Priority Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`badge ${getStatusBadge(selectedComplaint.status)}`}>
                  {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`badge ${getPriorityBadge(selectedComplaint.priority)}`}>
                  {selectedComplaint.priority.toUpperCase()}
                </span>
              </div>

              {/* Category and Description */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedComplaint.category.charAt(0).toUpperCase() + selectedComplaint.category.slice(1)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{selectedComplaint.description}</p>
              </div>

              {/* Media */}
              {selectedComplaint.media_path && (
                <div className="h-80 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                  {isVideo(selectedComplaint.media_path) ? (
                    <video
                      src={`http://localhost:5000/uploads/${selectedComplaint.media_path}`}
                      controls
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <img
                      src={`http://localhost:5000/uploads/${selectedComplaint.media_path}`}
                      alt="Complaint media"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}

              {/* Progress Bar */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Progress</span>
                  {selectedComplaint.status === 'rejected' ? (
                    <span className="text-red-600 font-semibold">Rejected</span>
                  ) : (
                    <span className="font-semibold">{getProgressPercentage(selectedComplaint.status)}%</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      selectedComplaint.status === 'rejected' ? 'bg-red-500' : 'bg-primary-600'
                    }`}
                    style={{ width: selectedComplaint.status === 'rejected' ? '100%' : `${getProgressPercentage(selectedComplaint.status)}%` }}
                  ></div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Supporters</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedComplaint.support_count || 0}</p>
                </div>
                {selectedComplaint.worker_name && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <UserCheck className="w-4 h-4" />
                      <span>Assigned Worker</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedComplaint.worker_name}</p>
                  </div>
                )}
              </div>

              {/* Deadline */}
              {selectedComplaint.deadline && (() => {
                const deadlineStatus = getDeadlineStatus(selectedComplaint.deadline);
                return (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${deadlineStatus.bg} ${deadlineStatus.color}`}>
                    <Calendar className="w-4 h-4" />
                    <span>
                      Deadline: {new Date(selectedComplaint.deadline).toLocaleDateString()}
                    </span>
                    <span className="font-semibold">({deadlineStatus.status.toUpperCase()})</span>
                  </div>
                );
              })()}

              {/* Feedback Section */}
              {selectedComplaint.status === 'completed' && selectedComplaint.feedback_rating && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student Feedback</h4>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= selectedComplaint.feedback_rating ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({selectedComplaint.feedback_rating}/5)</span>
                  </div>
                  {selectedComplaint.feedback_comments && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{selectedComplaint.feedback_comments}"</p>
                  )}
                </div>
              )}

              {/* Display Comments */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Comments ({comments.length})</h4>
                {loadingComments ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No comments yet. Be the first to comment!</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {c.user_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          c.user_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          c.user_role === 'worker' ? 'bg-blue-100 text-blue-800' :
                          c.user_role === 'supervisor' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {c.user_role}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add a comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field min-h-[80px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Share your thoughts or additional details..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddComment(selectedComplaint.id)}
                    disabled={!comment.trim()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Post Comment
                  </button>
                  {user && (
                    <button
                      onClick={() => handleSupport(selectedComplaint.id)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Support
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicDashboard;
