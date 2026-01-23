import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9897/api/pitstops';

export default function PitStopOnboarding() {
  const [activeTab, setActiveTab] = useState('vehicle');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingPitstops, setPendingPitstops] = useState([]);
  const [draftPitstops, setDraftPitstops] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch data on mount and when tab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      if (activeTab === 'vehicle') {
        // Fetch pending pitstops (Vehicle List)
        const response = await axios.get(`${API_BASE_URL}/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setPendingPitstops(response.data.pending);
        }
      } else if (activeTab === 'drafts') {
        // Fetch draft pitstops
        const response = await axios.get(`${API_BASE_URL}/drafts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setDraftPitstops(response.data.drafts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardNew = () => {
    navigate('/pitstop-form');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800">Executive Dashboard</h1>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search pitstops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors"
            style={{
              borderColor: 'var(--brand)',
            }}
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white px-4 pt-4 flex gap-2">
        <button
          onClick={() => setActiveTab('vehicle')}
          className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-colors ${
            activeTab === 'vehicle'
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={{
            background: activeTab === 'vehicle' ? 'var(--brand)' : undefined,
          }}
        >
          Vehicle List
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-colors ${
            activeTab === 'drafts'
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={{
            background: activeTab === 'drafts' ? 'var(--brand)' : undefined,
          }}
        >
          Drafts
        </button>
      </div>

      {/* Content Section */}
      <div className="px-4 py-6">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="text-gray-600">Loading...</div>
          </div>
        )}

        {!loading && activeTab === 'vehicle' && (
          <div>
            {pendingPitstops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-600 text-center">
                  No pitstops waiting for approval
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPitstops.map((pitstop) => (
                  <div
                    key={pitstop._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-800">{pitstop.pitstopName}</h3>
                    <p className="text-sm text-gray-600">Owner: {pitstop.ownerName}</p>
                    <p className="text-sm text-gray-600">Contact: {pitstop.contactNumber}</p>
                    <p className="text-sm text-gray-600">Location: {pitstop.location}</p>
                    <span className="inline-block mt-2 text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'drafts' && (
          <div>
            {draftPitstops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <p className="text-gray-600 text-center">
                  No draft submissions yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {draftPitstops.map((pitstop) => (
                  <div
                    key={pitstop._id}
                    onClick={() => navigate(`/pitstop-form?draftId=${pitstop._id}`)}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-800">{pitstop.pitstopName || 'Untitled'}</h3>
                    <p className="text-sm text-gray-600">Owner: {pitstop.ownerName || '-'}</p>
                    <p className="text-sm text-gray-600">Contact: {pitstop.contactNumber || '-'}</p>
                    <p className="text-sm text-gray-600">Location: {pitstop.location || '-'}</p>
                    <span className="inline-block mt-2 text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      Draft
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* On-board Button */}
        <div className="mt-8 mb-6 flex justify-center">
          <button
            onClick={handleOnboardNew}
            className="btn"
            style={{
              background: 'var(--brand)',
            }}
          >
            + On-board New Pitstops
          </button>
        </div>
      </div>
    </div>
  );
}
