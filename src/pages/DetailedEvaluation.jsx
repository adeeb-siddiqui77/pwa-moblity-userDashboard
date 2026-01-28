import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9897/api/pitstops';

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('access_token');

export default function DetailedEvaluation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [pitstopId, setPitstopId] = useState(null);
  const [pitstopData, setPitstopData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [categoryResult, setCategoryResult] = useState(null);
  
  // Rating states
  const [ratings, setRatings] = useState({
    distanceFromHighway: 0,
    parkingSpace: 0,
    accessRoad: 0,
    coveredWorkArea: 0,
    lighting: 0,
    powerSupply: 0,
    compressor: 0,
    hydraulicJack: 0,
    impactWrench: 0,
    torqueWrench: 0,
    beadBreaker: 0,
    inflatorGaugeAccuracy: 0,
    tyreBuffingMachine: 0,
    tyreRepairKit: 0,
    tyreSealant: 0,
    hotSpotter: 0,
    handTools: 0,
    serviceVehicle: 0,
    nsdGauge: 0,
    tyreSizesKnowledge: 0,
    tubelessRepairSkill: 0,
    radialCutRepairSkill: 0,
    firstAidKit: 0,
    safetyGear: 0,
    fireExtinguisher: 0,
    licenses: 0,
  });

  const handleRating = (field, value) => {
    setRatings(prev => ({
      ...prev,
      [field]: prev[field] === value ? 0 : value
    }));
  };

  const handleContinue = async () => {
    if (!pitstopId) {
      alert('No pitstop ID found');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await axios.post(
        `${API_BASE_URL}/categorize`,
        {
          pitstopId,
          ratings
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Show modal with category result
        setCategoryResult(response.data.data);
        setShowModal(true);
        
        // Log debug info to console
        if (response.data.data.debugInfo) {
          console.log('Categorization Debug Info:', response.data.data.debugInfo);
        }

        // Auto-close and redirect for Category D after 5 seconds
        if (response.data.data.category === 'D') {
          setTimeout(() => {
            setShowModal(false);
            navigate('/pitstop-onboarding');
          }, 5000);
        }
      } else {
        alert('Failed to categorize pitstop');
      }
    } catch (error) {
      console.error('Categorization error:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to categorize pitstop');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('pitstopId');
    if (id) {
      setPitstopId(id);
      loadPitstopData(id);
    } else {
      // No pitstopId provided, redirect back
      navigate('/pitstop-onboarding');
    }
  }, []);

  const loadPitstopData = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const pitstop = response.data.pitstop;
        setPitstopData(pitstop);
        
        // Load existing ratings if they exist
        if (pitstop.ratings) {
          setRatings(prev => ({
            ...prev,
            ...pitstop.ratings
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load pitstop data:', error.response?.data || error.message);
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
          Detailed Evaluation
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Main Heading */}
        <h1 className="text-lg font-bold text-black mb-6">Location & Accessibility</h1>

        {/* Step 1: Location & Accessibility */}
        <div className="mb-8">
          {/* Rating Items Container */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-500 block mb-1">Step 1:</span>
              <h2 className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                Location & Accessibility
              </h2>
            </div>
            
            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            <div className="space-y-6">
              {/* Distance from Highway */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Distance from Highway:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating('distanceFromHighway', star)}
                      className="focus:outline-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= ratings.distanceFromHighway ? 'var(--brand)' : '#D1D5DB'}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parking/ Working Space */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Parking/ Working Space:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating('parkingSpace', star)}
                      className="focus:outline-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= ratings.parkingSpace ? 'var(--brand)' : '#D1D5DB'}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Access Road */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Access Road:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating('accessRoad', star)}
                      className="focus:outline-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= ratings.accessRoad ? 'var(--brand)' : '#D1D5DB'}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Infrastructure */}
        <div className="mb-8">
          {/* Rating Items Container */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-500 block mb-1">Step 2:</span>
              <h2 className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                Infrastructure
              </h2>
            </div>
            
            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            <div className="space-y-6">
              {/* Covered Work Area */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Covered Work Area:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating('coveredWorkArea', star)}
                      className="focus:outline-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= ratings.coveredWorkArea ? 'var(--brand)' : '#D1D5DB'}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lighting */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Lighting:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating('lighting', star)}
                      className="focus:outline-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= ratings.lighting ? 'var(--brand)' : '#D1D5DB'}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Power Supply */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Power Supply:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating('powerSupply', star)}
                      className="focus:outline-none"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= ratings.powerSupply ? 'var(--brand)' : '#D1D5DB'}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Tools & Equipment */}
        <div className="mb-8">
          {/* Rating Items Container */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-500 block mb-1">Step 3:</span>
              <h2 className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                Tools & Equipment
              </h2>
            </div>
            
            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            <div className="space-y-6">
              {/* Compressor */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Compressor:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('compressor', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.compressor ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hydraulic Jack */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Hydraulic Jack:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('hydraulicJack', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.hydraulicJack ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Wrench */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Impact Wrench:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('impactWrench', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.impactWrench ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Torque Wrench */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Torque Wrench:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('torqueWrench', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.torqueWrench ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bead Breaker */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Bead Breaker:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('beadBreaker', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.beadBreaker ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inflator Gauge Accuracy */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Inflator Gauge Accuracy:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('inflatorGaugeAccuracy', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.inflatorGaugeAccuracy ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tyre Buffing Machine */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Tyre Buffing Machine:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('tyreBuffingMachine', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.tyreBuffingMachine ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tyre Repair Kit (Complete) */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Tyre Repair Kit (Complete):</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('tyreRepairKit', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.tyreRepairKit ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tyre Sealant (for tyre) */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Tyre Sealant (for tyre):</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('tyreSealant', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.tyreSealant ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hot Spotter (for tube) */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Hot Spotter (for tube):</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('hotSpotter', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.hotSpotter ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hand Tools */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Hand Tools:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('handTools', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.handTools ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Vehicle */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Service Vehicle:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('serviceVehicle', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.serviceVehicle ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* NSD Gauge */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">NSD Gauge:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('nsdGauge', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.nsdGauge ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Personnel & Skills */}
        <div className="mb-8">
          {/* Rating Items Container */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-500 block mb-1">Step 4:</span>
              <h2 className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                Personnel & Skills
              </h2>
            </div>
            
            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            <div className="space-y-6">
              {/* Tyre Sizes knowledge */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Tyre Sizes knowledge:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('tyreSizesKnowledge', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.tyreSizesKnowledge ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tubeless Repair Skill */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Tubeless Repair Skill:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('tubelessRepairSkill', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.tubelessRepairSkill ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Radial/Cut Repair Skill */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Radial/Cut Repair Skill:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('radialCutRepairSkill', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.radialCutRepairSkill ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Safety & Compliance */}
        <div className="mb-8">
          {/* Rating Items Container */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-500 block mb-1">Step 5:</span>
              <h2 className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                Safety & Compliance
              </h2>
            </div>
            
            {/* Divider */}
            <div className="border-b border-gray-200 mb-6"></div>

            <div className="space-y-6">
              {/* First Aid Kit */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">First Aid Kit:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('firstAidKit', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.firstAidKit ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Gear */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Safety Gear:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('safetyGear', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.safetyGear ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fire Extinguisher */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Fire Extinguisher:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('fireExtinguisher', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.fireExtinguisher ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Licenses */}
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">Licenses:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((star) => (
                    <button key={star} onClick={() => handleRating('licenses', star)} className="focus:outline-none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= ratings.licenses ? 'var(--brand)' : '#D1D5DB'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {loading ? 'Processing...' : 'Continue'}
        </button>
      </div>

      {/* Category Result Modal */}
      {showModal && categoryResult && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {categoryResult.category !== 'D' ? (
              /* Categories A, B, C - Eligible */
              <div className="text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  You're eligible to continue
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  This pitstop has been classified under Category {categoryResult.category} based on the evaluation.
                  <br />
                  You can now proceed with onboarding.
                  <br />
                  Redirecting you to the onboarding form…
                </p>

                {/* Continue Button */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate(`/pitstop-additional-details?pitstopId=${pitstopId}&category=${categoryResult.category}`);
                  }}
                  className="w-full py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  Continue
                </button>
              </div>
            ) : (
              /* Category D - Not Eligible */
              <div className="text-center">
                {/* Warning Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Not eligible at this time
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed">
                  Your details have been saved.
                  <br />
                  Please retry after 5 days.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
