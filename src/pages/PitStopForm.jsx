import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9897/api/pitstops';

export default function PitStopForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    pitstopName: '',
    ownerName: '',
    contactNumber: '',
    location: '',
    inflationCapability: null,
    hydraulicJack: null,
    repairKits: null,
  });

  // Load existing draft or create new one on component mount
  useEffect(() => {
    const existingDraftId = searchParams.get('draftId');
    if (existingDraftId) {
      loadExistingDraft(existingDraftId);
    } else {
      createNewDraft();
    }
  }, []);

  const loadExistingDraft = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const draft = response.data.pitstop;
        setDraftId(draft._id);
        setFormData({
          pitstopName: draft.pitstopName || '',
          ownerName: draft.ownerName || '',
          contactNumber: draft.contactNumber || '',
          location: draft.location || '',
          inflationCapability: draft.inflationCapability,
          hydraulicJack: draft.hydraulicJack,
          repairKits: draft.repairKits,
        });
      }
    } catch (error) {
      console.error('Failed to load draft:', error.response?.data || error.message);
    }
  };

  const createNewDraft = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE_URL}/create-draft`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDraftId(response.data.pitstop._id);
      }
    } catch (error) {
      console.error('Failed to create draft:', error.response?.data || error.message);
    }
  };

  // Auto-save on field change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draftId && (formData.pitstopName || formData.ownerName || formData.contactNumber || formData.location)) {
        saveDraft();
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [formData, draftId]);

  const saveDraft = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token || !draftId) {
        return;
      }
      const response = await axios.post(`${API_BASE_URL}/save-draft`, {
        pitstopId: draftId,
        ...formData,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log('Draft saved successfully');
      }
    } catch (error) {
      console.error('Failed to save draft:', error.response?.data || error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCheckboxChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setFieldErrors({});
      setSuccessMessage('');

      // Validate required fields
      const errors = {};
      if (!formData.pitstopName) errors.pitstopName = 'PitStop name is required';
      if (!formData.ownerName) errors.ownerName = 'Owner name is required';
      if (!formData.contactNumber) errors.contactNumber = 'Contact number is required';
      if (!formData.location) errors.location = 'Location is required';

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('access_token');

      if (!draftId) {
        setLoading(false);
        return;
      }

      console.log('Submitting pitstop with ID:', draftId);

      const response = await axios.post(
        `${API_BASE_URL}/submit/${draftId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Submit response:', response.data);

      if (response.data.success) {
        setSuccessMessage('Form submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit form:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-xl hover:text-gray-900"
          style={{ color: 'var(--brand)' }}
        >
          ←
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
          Technical Evaluation Checklist
        </h1>
      </div>

      {/* Form Content */}
      <div className="px-4 py-6">
        {/* Step 1: Personal Details */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Step 1: Personal Details</h2>

          {/* PitStop Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">PitStop Name</label>
            <input
              type="text"
              name="pitstopName"
              value={formData.pitstopName}
              onChange={handleInputChange}
              placeholder="Enter pitstop name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                fieldErrors.pitstopName
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-orange-500'
              }`}
            />
            {fieldErrors.pitstopName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.pitstopName}</p>
            )}
          </div>

          {/* Owner Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              placeholder="Enter owner name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                fieldErrors.ownerName
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-orange-500'
              }`}
            />
            {fieldErrors.ownerName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.ownerName}</p>
            )}
          </div>

          {/* Contact Number */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <div className="flex gap-2">
              <div className="w-20 px-3 py-3 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center font-semibold text-gray-700">
                +91
              </div>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="Enter contact number"
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.contactNumber
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-orange-500'
                }`}
              />
            </div>
            {fieldErrors.contactNumber && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.contactNumber}</p>
            )}
          </div>

          {/* Location */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter location"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                fieldErrors.location
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-orange-500'
              }`}
            />
            {fieldErrors.location && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.location}</p>
            )}
          </div>
        </div>

        {/* Step 2: Critical Must-Haves */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Step 2: Critical Must-Haves</h2>

          {/* Item 1: Inflation Capability */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800 flex-1">Inflation capability (compressor {'>'}= 120 PSI or equivalent)</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inflationCapability === true}
                    onChange={() => handleCheckboxChange('inflationCapability', true)}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-gray-700 font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inflationCapability === false}
                    onChange={() => handleCheckboxChange('inflationCapability', false)}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-gray-700 font-medium">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Item 2: Hydraulic Jack */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800 flex-1">Hydraulic jack (suited for Trucks)</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hydraulicJack === true}
                    onChange={() => handleCheckboxChange('hydraulicJack', true)}
                    className="w-5 h-5 accent-orange-500"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span className="text-gray-700 font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hydraulicJack === false}
                    onChange={() => handleCheckboxChange('hydraulicJack', false)}
                    className="w-5 h-5 accent-orange-500"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span className="text-gray-700 font-medium">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Item 3: Repair Kits */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800 flex-1">Repair kits: tube/tubeless/cut/radial patches</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.repairKits === true}
                    onChange={() => handleCheckboxChange('repairKits', true)}
                    className="w-5 h-5 accent-orange-500"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span className="text-gray-700 font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.repairKits === false}
                    onChange={() => handleCheckboxChange('repairKits', false)}
                    className="w-5 h-5 accent-orange-500"
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span className="text-gray-700 font-medium">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn"
            style={{
              background: 'var(--brand)',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        {/* Success Message Modal */}
        {successMessage && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
              {/* Green checkmark icon with circle background */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">Details saved successfully</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                We've securely saved the information you submitted. However, this action doesn't mean we've completed onboarding of this stage.
              </p>
              
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-lg text-white font-semibold text-base"
                style={{
                  background: 'var(--brand)',
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}


      </div>

      {/* Draft Status */}
      {draftId && !successMessage && (
        <div className="px-4 pb-4 text-center text-sm text-green-600">
          ✓ Draft saved automatically
        </div>
      )}
    </div>
  );
}
