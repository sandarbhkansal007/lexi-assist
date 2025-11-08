import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, Calendar, Users, FileText, BarChart3, 
  Search, Plus, Clock, AlertCircle, CheckCircle, 
  Menu, X, LogOut, Bell, Home, Briefcase,
  TrendingUp, FileCheck, Eye, Upload, Trash2, Wand2
} from 'lucide-react';

// Mock API service
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const api = {
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  getToken: () => localStorage.getItem('token'),
  clearToken: () => localStorage.removeItem('token'),
  
  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    // Start with base headers
    const baseHeaders = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Conditionally add Content-Type if not FormData
    // FormData sets its own Content-Type with boundary
    if (!(options.body instanceof FormData)) {
      baseHeaders['Content-Type'] = 'application/json';
    }

    const headers = { ...baseHeaders, ...options.headers };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  auth: {
    login: (credentials) => api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (data) => api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getCurrentUser: () => api.request('/auth/me'),
  },

  cases: {
    getAll: () => api.request('/cases'),
    getOne: (id) => api.request(`/cases/${id}`),
    create: (data) => api.request('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => api.request(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => api.request(`/cases/${id}`, { method: 'DELETE' }),
    findSimilar: (id) => api.request(`/cases/${id}/similar`, { method: 'POST' }),
    generateSummary: (id) => api.request(`/cases/${id}/summary`, { method: 'POST' }),
    // NEW: Document management routes
    uploadDocument: (id, formData) => api.request(`/cases/${id}/document`, {
      method: 'POST',
      body: formData, // Pass FormData directly
    }),
    deleteDocument: (id, docId) => api.request(`/cases/${id}/document/${docId}`, {
      method: 'DELETE'
    }),
  },

  clients: {
    getAll: () => api.request('/clients'),
    getOne: (id) => api.request(`/clients/${id}`),
    create: (data) => api.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => api.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => api.request(`/clients/${id}`, { method: 'DELETE' }),
  },

  hearings: {
    getAll: () => api.request('/hearings'),
    getUpcoming: () => api.request('/hearings/upcoming'),
    create: (data) => api.request('/hearings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => api.request(`/hearings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => api.request(`/hearings/${id}`, { method: 'DELETE' }),
  },
};

// Main App Component
export default function LexiAssist() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // NEW: State for reminders dropdown
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.auth.getCurrentUser()
        .then(userData => {
          setUser(userData);
          loadNotifications(); // Load notifications for logged-in user
          setIsLoading(false);
        })
        .catch(() => {
          api.clearToken();
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // NEW: Function to load notifications
  const loadNotifications = () => {
    api.hearings.getUpcoming()
      .then(hearings => {
        setNotifications(hearings);
        setHasUnread(hearings.length > 0);
      })
      .catch(console.error);
  };

  // NEW: Toggle notifications
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (hasUnread) {
      setHasUnread(false); // Mark as "read" when opened
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await api.auth.login(credentials);
      api.setToken(response.token);
      setUser(response.user);
      loadNotifications(); // Load notifications on login
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (data) => {
    try {
      const response = await api.auth.register(data);
      api.setToken(response.token);
      setUser(response.user);
      loadNotifications(); // Load notifications on register
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    setCurrentPage('dashboard');
    setNotifications([]); // Clear notifications
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scale className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading LexiAssist...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-3">
              <Scale className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">LexiAssist</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* NEW: Functional Bell Icon */}
            <div className="relative">
              <button 
                onClick={toggleNotifications} 
                className="p-2 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold text-gray-900">Upcoming Hearings</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm p-4 text-center">No upcoming hearings.</p>
                    ) : (
                      notifications.map(hearing => (
                        <div key={hearing._id} className="p-3 hover:bg-gray-50 border-b border-gray-100">
                          <p className="font-medium text-sm text-gray-900">{hearing.case?.title || 'Unknown Case'}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(hearing.date).toLocaleDateString()} at {hearing.time}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Lawyer</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static lg:translate-x-0 z-40 w-64 h-[calc(100vh-73px)] bg-white border-r border-gray-200 transition-transform duration-200`}>
          <nav className="p-4 space-y-2">
            <NavItem icon={Home} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
            <NavItem icon={Briefcase} label="Cases" active={currentPage === 'cases'} onClick={() => setCurrentPage('cases')} />
            <NavItem icon={Users} label="Clients" active={currentPage === 'clients'} onClick={() => setCurrentPage('clients')} />
            <NavItem icon={Calendar} label="Hearings" active={currentPage === 'hearings'} onClick={() => setCurrentPage('hearings')} />
            <NavItem icon={FileText} label="Documents" active={currentPage === 'documents'} onClick={() => setCurrentPage('documents')} />
            <NavItem icon={BarChart3} label="Analytics" active={currentPage === 'analytics'} onClick={() => setCurrentPage('analytics')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-[calc(100vh-73px)]">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'cases' && <CasesPage />}
          {currentPage === 'clients' && <ClientsPage />}
          {currentPage === 'hearings' && <HearingsPage />}
          {currentPage === 'documents' && <DocumentsPage />}
          {currentPage === 'analytics' && <AnalyticsPage />}
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-600 font-medium' 
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

// Auth Page
function AuthPage({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    barCouncilId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin({ email: formData.email, password: formData.password });
      } else {
        await onRegister(formData);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Scale className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">LexiAssist</h1>
          <p className="text-gray-600 mt-2">Your AI Legal Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bar Council ID (Optional)</label>
              <input
                type="text"
                value={formData.barCouncilId}
                onChange={(e) => setFormData({ ...formData, barCouncilId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    clients: 0,
    upcomingHearings: 0
  });
  const [recentCases, setRecentCases] = useState([]);
  const [upcomingHearings, setUpcomingHearings] = useState([]);

  useEffect(() => {
    Promise.all([
      api.cases.getAll(),
      api.clients.getAll(),
      api.hearings.getUpcoming()
    ]).then(([cases, clients, hearings]) => {
      setStats({
        totalCases: cases.length,
        activeCases: cases.filter(c => c.status === 'ongoing' || c.status === 'hearing').length,
        clients: clients.length,
        upcomingHearings: hearings.length
      });
      setRecentCases(cases.slice(0, 5));
      setUpcomingHearings(hearings.slice(0, 5));
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your legal practice</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Briefcase} label="Total Cases" value={stats.totalCases} color="blue" />
        <StatCard icon={TrendingUp} label="Active Cases" value={stats.activeCases} color="green" />
        <StatCard icon={Users} label="Clients" value={stats.clients} color="purple" />
        <StatCard icon={Calendar} label="Upcoming Hearings" value={stats.upcomingHearings} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Cases</h2>
          <div className="space-y-3">
            {recentCases.length === 0 ? (
              <p className="text-gray-500 text-sm">No cases yet. Create your first case!</p>
            ) : (
              recentCases.map((case_) => (
                <div key={case_._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{case_.title}</p>
                    <p className="text-sm text-gray-500">{case_.caseNumber}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                    {case_.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Hearings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Hearings</h2>
          <div className="space-y-3">
            {upcomingHearings.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming hearings scheduled.</p>
            ) : (
              upcomingHearings.map((hearing) => (
                <div key={hearing._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{hearing.case?.title || 'Unknown Case'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(hearing.date).toLocaleDateString()} at {hearing.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Cases Page
function CasesPage() {
  const [cases, setCases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadCases();
    api.clients.getAll().then(setClients).catch(console.error);
  }, []);

  const loadCases = () => {
    api.cases.getAll().then(setCases).catch(console.error);
  };

  const handleCreateCase = () => {
    setSelectedCase(null);
    setShowModal(true);
  };

  const handleEditCase = (case_) => {
    setSelectedCase(case_);
    setShowModal(true);
  };

  const handleDeleteCase = async (id) => {
    // Re-implementing without window.confirm
    // You should use a custom modal for this in a real app
    const userIsSure = true; // Simulating confirmation
    if (userIsSure) {
      try {
        await api.cases.delete(id);
        loadCases();
      } catch (error) {
        // Use a toast or custom modal for errors
        console.error('Failed to delete case', error);
      }
    }
  };

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 mt-1">Manage all your legal cases</p>
        </div>
        <button
          onClick={handleCreateCase}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Case</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No cases found. Create your first case!</p>
            </div>
          ) : (
            filteredCases.map((case_) => (
              <div key={case_._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{case_.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                      {case_.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{case_.caseNumber}</span>
                    <span>•</span>
                    <span>{case_.caseType}</span>
                    <span>•</span>
                    <span>{case_.court || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditCase(case_)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCase(case_._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <CaseModal
          case_={selectedCase}
          clients={clients}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadCases();
          }}
        />
      )}
    </div>
  );
}

// Case Modal (HEAVILY UPDATED)
function CaseModal({ case_, clients, onClose, onSave }) {
  const [formData, setFormData] = useState({
    caseNumber: case_?.caseNumber || '',
    title: case_?.title || '',
    client: case_?.client?._id || '',
    caseType: case_?.caseType || '',
    court: case_?.court || '',
    filingDate: case_?.filingDate ? new Date(case_.filingDate).toISOString().split('T')[0] : '',
    status: case_?.status || 'filed',
    description: case_?.description || '',
    summary: case_?.summary || '' // NEW
  });
  
  // NEW: State for AI features and documents
  const [documents, setDocuments] = useState(case_?.documents || []);
  const [similarCases, setSimilarCases] = useState(case_?.similarCases || []);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState({ summary: false, similar: false });
  const [docLoading, setDocLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const caseData = { ...formData, documents, similarCases };
      if (case_) {
        await api.cases.update(case_._id, caseData);
      } else {
        await api.cases.create(caseData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save case', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: AI Summary Generation
  const handleGenerateSummary = async () => {
    if (!case_) return;
    setAiLoading(prev => ({ ...prev, summary: true }));
    try {
      const response = await api.cases.generateSummary(case_._id);
      setFormData(prev => ({ ...prev, summary: response.summary }));
    } catch (error) {
      console.error('Failed to generate summary', error);
    } finally {
      setAiLoading(prev => ({ ...prev, summary: false }));
    }
  };
  
  // NEW: AI Similar Case Finder
  const handleFindSimilarCases = async () => {
    if (!case_) return;
    setAiLoading(prev => ({ ...prev, similar: true }));
    try {
      const response = await api.cases.findSimilar(case_._id);
      setSimilarCases(response);
    } catch (error) {
      console.error('Failed to find similar cases', error);
    } finally {
      setAiLoading(prev => ({ ...prev, similar: false }));
    }
  };

  // NEW: Document Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !case_) return;

    const formData = new FormData();
    formData.append('document', file);
    
    setDocLoading(true);
    try {
      const updatedCase = await api.cases.uploadDocument(case_._id, formData);
      setDocuments(updatedCase.documents);
    } catch (error) {
      console.error('Failed to upload document', error);
    } finally {
      setDocLoading(false);
      fileInputRef.current.value = null; // Reset file input
    }
  };

  // NEW: Document Deletion
  const handleDeleteDocument = async (docId) => {
    if (!case_) return;
    try {
      const updatedCase = await api.cases.deleteDocument(case_._id, docId);
      setDocuments(updatedCase.documents);
    } catch (error) {
      console.error('Failed to delete document', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {case_ ? 'Edit Case' : 'New Case'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Case Details */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-medium text-gray-900 mb-2">Case Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Number</label>
                <input
                  type="text"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                <select
                  value={formData.caseType}
                  onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Civil">Civil</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Family">Family</option>
                  <option value="Property">Property</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                <input
                  type="text"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filing Date</label>
                <input
                  type="date"
                  value={formData.filingDate}
                  onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="filed">Filed</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="hearing">Hearing</option>
                  <option value="closed">Closed</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </fieldset>
          
          {/* AI Features - Only show when editing an existing case */}
          {case_ && (
            <>
              {/* AI Summary */}
              <fieldset className="space-y-2">
                <legend className="text-lg font-medium text-gray-900">AI Assistant</legend>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Case Summary</label>
                    <button
                      type="button"
                      onClick={handleGenerateSummary}
                      disabled={aiLoading.summary}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>{aiLoading.summary ? 'Generating...' : 'Generate Summary'}</span>
                    </button>
                  </div>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Click 'Generate Summary' or write your own."
                  />
                </div>
              </fieldset>
              
              {/* Similar Cases */}
              <fieldset className="space-y-2">
                <div className="flex items-center justify-between">
                  <legend className="text-lg font-medium text-gray-900">Similar Cases</legend>
                  <button
                    type="button"
                    onClick={handleFindSimilarCases}
                    disabled={aiLoading.similar}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    <span>{aiLoading.similar ? 'Searching...' : 'Find Similar Cases'}</span>
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {similarCases.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No similar cases found yet.</p>
                  ) : (
                    similarCases.map((c, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">{c.caseTitle}</p>
                        <p className="text-sm text-blue-600">{c.citation}</p>
                        <p className="text-sm text-gray-700 mt-1">{c.verdict}</p>
                      </div>
                    ))
                  )}
                </div>
              </fieldset>

              {/* Document Management */}
              <fieldset className="space-y-2">
                <legend className="text-lg font-medium text-gray-900">Case Documents</legend>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{docLoading ? 'Uploading...' : 'Upload Document'}</span>
                  </label>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No documents uploaded.</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </fieldset>
            </>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white py-4 px-6 -m-6 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// Clients Page
function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    api.clients.getAll().then(setClients).catch(console.error);
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleDeleteClient = async (id) => {
    // You should use a custom modal for this
    const userIsSure = true; 
    if (userIsSure) {
      try {
        await api.clients.delete(id);
        loadClients();
      } catch (error) {
        console.error('Failed to delete client', error);
      }
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client database</p>
        </div>
        <button
          onClick={handleCreateClient}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Client</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No clients found. Add your first client!</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div key={client._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{client.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{client.email}</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <ClientModal
          client={selectedClient}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadClients();
          }}
        />
      )}
    </div>
  );
}

// Client Modal
function ClientModal({ client, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    idProof: client?.idProof || '',
    notes: client?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (client) {
        await api.clients.update(client._id, formData);
      } else {
        await api.clients.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save client', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Edit Client' : 'New Client'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof</label>
            <input
              type="text"
              value={formData.idProof}
              onChange={(e) => setFormData({ ...formData, idProof: e.target.value })}
              placeholder="e.g., Aadhar, PAN, Passport"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Hearings Page
function HearingsPage() {
  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);

  useEffect(() => {
    loadHearings();
    api.cases.getAll().then(setCases).catch(console.error);
  }, []);

  const loadHearings = () => {
    api.hearings.getAll().then(setHearings).catch(console.error);
  };

  const handleCreateHearing = () => {
    setSelectedHearing(null);
    setShowModal(true);
  };

  const handleEditHearing = (hearing) => {
    setSelectedHearing(hearing);
    setShowModal(true);
  };

  const handleDeleteHearing = async (id) => {
    // You should use a custom modal for this
    const userIsSure = true; 
    if (userIsSure) {
      try {
        await api.hearings.delete(id);
        loadHearings();
      } catch (error) {
        console.error('Failed to delete hearing', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hearings</h1>
          <p className="text-gray-600 mt-1">Track all your court hearings</p>
        </div>
        <button
          onClick={handleCreateHearing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Schedule Hearing</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {hearings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hearings scheduled.</p>
            </div>
          ) : (
            hearings.map((hearing) => (
              <div key={hearing._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-blue-600 font-medium">
                      {new Date(hearing.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {new Date(hearing.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {hearing.case?.title || 'Unknown Case'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {hearing.time}
                      </span>
                      <span>{hearing.court}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hearing.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        hearing.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {hearing.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditHearing(hearing)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteHearing(hearing._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <HearingModal
          hearing={selectedHearing}
          cases={cases}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadHearings();
          }}
        />
      )}
    </div>
  );
}

// Hearing Modal
function HearingModal({ hearing, cases, onClose, onSave }) {
  const [formData, setFormData] = useState({
    case: hearing?.case?._id || '',
    date: hearing?.date ? new Date(hearing.date).toISOString().split('T')[0] : '',
    time: hearing?.time || '',
    court: hearing?.court || '',
    judge: hearing?.judge || '',
    type: hearing?.type || 'hearing',
    notes: hearing?.notes || '',
    status: hearing?.status || 'scheduled'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (hearing) {
        await api.hearings.update(hearing._id, formData);
      } else {
        await api.hearings.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save hearing', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {hearing ? 'Edit Hearing' : 'Schedule Hearing'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Case</label>
            <select
              value={formData.case}
              onChange={(e) => setFormData({ ...formData, case: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Case</option>
              {cases.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
              <input
                type="text"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judge</label>
              <input
                type="text"
                value={formData.judge}
                onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="hearing">Hearing</option>
                <option value="filing">Filing</option>
                <option value="argument">Argument</option>
                <option value="judgment">Judgment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Hearing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Documents Page (Now functional)
function DocumentsPage() {
  const [allCases, setAllCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.cases.getAll().then(setAllCases).catch(console.error);
  }, []);

  // Get a flat list of all documents from all cases
  const allDocuments = allCases.reduce((acc, case_) => {
    const caseDocs = case_.documents.map(doc => ({
      ...doc,
      caseTitle: case_.title,
      caseId: case_._id
    }));
    return [...acc, ...caseDocs];
  }, []);

  const filteredDocuments = allDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.caseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">Search all documents across all your cases</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents by name or case title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No documents found.</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600">
                      Case: <span className="font-medium">{doc.caseTitle}</span>
                    </p>
                  </div>
                </div>
                <button 
                  className="text-sm text-blue-600 hover:underline"
                  // In a real app, this would link to the document URL
                  onClick={() => alert(`Document path: ${doc.url}`)}
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


// Analytics Page
function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalCases: 0,
    wonCases: 0,
    lostCases: 0,
    ongoingCases: 0
  });

  useEffect(() => {
    api.cases.getAll().then(cases => {
      setStats({
        totalCases: cases.length,
        wonCases: cases.filter(c => c.status === 'won').length,
        lostCases: cases.filter(c => c.status === 'lost').length,
        ongoingCases: cases.filter(c => c.status === 'ongoing' || c.status === 'hearing').length
      });
    }).catch(console.error);
  }, []);

  const winRate = (stats.wonCases + stats.lostCases > 0)
    ? ((stats.wonCases / (stats.wonCases + stats.lostCases)) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-sm font-medium">Total Cases</span>
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCases}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-sm font-medium">Won Cases</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.wonCases}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-sm font-medium">Ongoing Cases</span>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.ongoingCases}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 text-sm font-medium">Win Rate</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{winRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Distribution</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Won</span>
              <span className="text-sm font-medium text-gray-900">{stats.wonCases}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${stats.totalCases ? (stats.wonCases / stats.totalCases) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Ongoing</span>
              <span className="text-sm font-medium text-gray-900">{stats.ongoingCases}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${stats.totalCases ? (stats.ongoingCases / stats.totalCases) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Lost</span>
              <span className="text-sm font-medium text-gray-900">{stats.lostCases}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ width: `${stats.totalCases ? (stats.lostCases / stats.totalCases) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for status colors
function getStatusColor(status) {
  const colors = {
    filed: 'bg-gray-100 text-gray-700',
    ongoing: 'bg-blue-100 text-blue-700',
    hearing: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}