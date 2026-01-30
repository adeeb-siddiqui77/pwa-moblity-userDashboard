import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PROSPECT_API_URL = 'http://localhost:9897/api/prospect';

export default function PitStopForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pitstopName: '',
    ownerName: '',
    contactNumber: '',
    location: '',
    inflationCapability: null,
    hydraulicJack: null,
    repairKits: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const getLocationFromCoordinates = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const GOOGLE_API_KEY = 'AIzaSyDagX1h0n0zsQtAZ9bCaD9zdmjWx_1cLoo';
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
            
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            
            if (data.status === 'OK' && data.results.length > 0) {
              const formattedAddress = data.results[0].formatted_address;
              resolve(formattedAddress);
            } else {
              reject('Failed to get location');
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => reject(error)
      );
    });
  };

  const handleGetLocation = async () => {
    try {
      setLoading(true);
      const address = await getLocationFromCoordinates();
      setFormData((prev) => ({
        ...prev,
        location: address,
      }));
    } catch (error) {
      console.error('Failed to get location:', error);
      alert('Failed to get location. Please enter manually.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsProspect = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${PROSPECT_API_URL}/create`, {
        ...formData,
        category: null,
        evaluationStage: 'before_evaluation',
        isIncomplete: true
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to save prospect:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Check if required fields are filled
      const hasRequiredFields = formData.pitstopName && formData.ownerName && 
                                formData.contactNumber && formData.location;

      // Check if all three checkboxes are "Yes"
      const allCheckboxesYes = 
        formData.inflationCapability === true && 
        formData.hydraulicJack === true && 
        formData.repairKits === true;

      // If required fields are missing OR checkboxes not all checked
      if (!hasRequiredFields || !allCheckboxesYes) {
        // Save as prospect
        await saveAsProspect();
        // Show modal
        setShowModal(true);
        setLoading(false);
        return;
      }

      // All required fields filled and all checkboxes Yes -> navigate to detailed evaluation
      navigate('/detailed-evaluation', { 
        state: { 
          formData: formData 
        } 
      });
    } catch (error) {
      console.error('Failed to submit form:', error.response?.data || error.message);
      alert('Failed to submit form. Please try again.');
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
          className="text-xl text-black hover:text-gray-900"
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
          <div className="text-sm font-semibold text-gray-500 mb-4">Step 1: </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Personal Details</h2>

          {/* PitStop Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">PitStop Name</label>
            <input
              type="text"
              name="pitstopName"
              value={formData.pitstopName}
              onChange={handleInputChange}
              placeholder="Enter pitstop name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={loading}
                className="flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                style={{ color: 'var(--brand)' }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="currentColor"
                  />
                </svg>
                <span>Fetch Current Location</span>
              </button>
            </div>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter location"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Step 2: Critical Must-Haves */}
        <div className="mb-8">
          <div className="text-sm font-semibold text-gray-500 mb-4">Step 2:</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Critical Must-Haves</h2>

          {/* Item 1: Inflation Capability */}
          <div className="mb-6  rounded-lg p-4">
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
          <div className="mb-6  rounded-lg p-4">
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
          <div className="mb-6 rounded-lg p-4">
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl animate-fadeIn">
              {/* Info icon with purple circle background */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-purple-100 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">i</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">Details Saved for Review</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                We've securely saved the information you submitted. However, this pitstop doesn't meet all the required criteria to complete onboarding at this stage.
              </p>
              
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-lg text-white font-semibold text-base transition-all hover:opacity-90"
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
    </div>
  );
}
