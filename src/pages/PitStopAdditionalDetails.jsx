import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9897/api/pitstops';

export default function PitStopAdditionalDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pitstopId, setPitstopId] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const totalSteps = 10;
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1.1: Personal Details
    ownerName: '',
    ownerAge: '',
    mobileNo: '',
    otp: '',
    aadhaarNo: '',
    
    // Step 1.2: Experience & Qualification
    qualification: '',
    certificateTraining: '',
    experienceTyreFitment: '',
    experienceOther: '',
    associationWithTransporter: 'no',
    transporterName: '',
    tyreAssociation: '',
    rsaTieUp: '',
    rsaRating: '',
    
    // Step 1.3: Family Details
    maritalStatus: '',
    children: '',
    livingWithFamily: 'no',
    houseOwnership: '',
    
    // Step 2.1: Address Details
    googleMapsLink: '',
    nearbyLandmark: '',
    highwayName: '',
    sideOfHighway: '',
    district: '',
    state: '',
    pincode: '',
    
    // Step 2.2: Nearby Services
    pitstopType: 'Hub',
    distanceFuelPump: '',
    distanceDhaba: '',
    distanceHub: '',
    distanceUTurnSameSide: '',
    distanceUTurnOppositeSide: '',
    
    // Step 3.1: Repair Services
    tyreSizes: '',
    tubeTypeTyreRepair: '',
    tubelessTyreRepair: '',
    radialCutRepairSkills: '',
    repairServicesOther: '',
    
    // Step 3.2: Communication
    readingWritingCapability: '',
    languagesKnown: '',
    
    // Step 4.1: Operating Hours
    operationalTiming: '',
    numberOfWorkers: '',
    contactNumberWorker1: '',
    contactNumberWorker2: '',
    contactNumberWorker3: '',
    contactNumberWorker4: '',
    contactNumberWorker5: '',
    
    // Step 4.2: Business
    monthlyTurnover: '',
    tyreRotations: '',
    tyreFitment: '',
    tyreInflations: '',
    radialTyreRepairs: '',
    nylonTyreRepairs: '',
    tubelessTyreRepairs: '',
    tubeTypeTyreRepairs: '',
    
    // Step 4.3: Pricing
    tubePunctureRepairCost: '',
    patchRepairCost: '',
    tyreFitmentRemovalCost: '',
    tyreInflationCost: '',
    
    // Step 5.1: Tools
    compressorType: '',
    compressorCapacity: '',
    impactWrench: '',
    wheelSpanner: '',
    pneumaticGun: '',
    jack: '',
    hotSpotter: '',
    otherTools: '',
    
    // Step 6.1: Details
    otherShopName: '',
    otherShopGeoLocation: '',
    willingnessToInvest: '',
    interestInStockingTyres: '',
    
    // Step 7.1: Details
    smartphone: '',
    internetAvailability: '',
    banksUpiPaymentsEnabled: '',
    
    // Step 8.1: Details
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upi: '',
    gstRegistration: '',
    loanEmiObligations: '',
    
    // Step 9.1: Details
    raisedConcreteBed: '',
    nightLighting: '',
    seatingDriversShelter: '',
    tyreStorageFacility: '',
    tyresStorage: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loiFile, setLoiFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    if (!pitstopId) return;
    
    const savedData = localStorage.getItem(`pitstop_${pitstopId}_formData`);
    const savedStep = localStorage.getItem(`pitstop_${pitstopId}_currentStep`);
    const savedCompleted = localStorage.getItem(`pitstop_${pitstopId}_completedSteps`);
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Merge with default values to ensure all fields are defined
      setFormData(prevData => ({ ...prevData, ...parsedData }));
    }
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
    if (savedCompleted) {
      setCompletedSteps(JSON.parse(savedCompleted));
    }
  }, [pitstopId]);

  useEffect(() => {
    const id = searchParams.get('pitstopId');
    const cat = searchParams.get('category');
    
    if (id && cat) {
      setPitstopId(id);
      setCategory(cat);
    } else {
      // Missing parameters, redirect back
      navigate('/pitstop-onboarding');
    }
  }, []);

  const handleInputChange = (e) => {
    const fieldName = e.target.name;
    setFormData({
      ...formData,
      [fieldName]: e.target.value
    });
    
    // Clear error for this field when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors({
        ...fieldErrors,
        [fieldName]: undefined
      });
    }
  };

  const handleVerifyMobile = async () => {
    if (!pitstopId || formData.mobileNo.length !== 10) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/send-otp`,
        {
          pitstopId,
          mobileNo: formData.mobileNo
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setOtpSent(true);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pitstopId || !formData.otp) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/verify-otp`,
        {
          pitstopId,
          otp: formData.otp
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setOtpVerified(true);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement form submission logic
  };

  const saveToLocalStorage = () => {
    if (pitstopId) {
      localStorage.setItem(`pitstop_${pitstopId}_formData`, JSON.stringify(formData));
      localStorage.setItem(`pitstop_${pitstopId}_currentStep`, currentStep.toString());
      localStorage.setItem(`pitstop_${pitstopId}_completedSteps`, JSON.stringify(completedSteps));
    }
  };

  const handleSaveAsDraft = async () => {
    setDraftSaving(true);
    saveToLocalStorage();
    // Small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    setDraftSaving(false);
    // Show draft modal
    setShowDraftModal(true);
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      // Step 1.1: Personal Details
      if (!formData.ownerName.trim()) errors.ownerName = 'Owner Name is required';
      if (!formData.ownerAge) errors.ownerAge = 'Owner Age is required';
      if (!formData.mobileNo.trim()) errors.mobileNo = 'Mobile Number is required';
      else if (formData.mobileNo.length !== 10) errors.mobileNo = 'Mobile Number must be 10 digits';
      if (!otpVerified) errors.otp = 'Please verify OTP';
      if (!formData.aadhaarNo.trim()) errors.aadhaarNo = 'Aadhaar Number is required';
      else if (formData.aadhaarNo.length !== 12) errors.aadhaarNo = 'Aadhaar Number must be 12 digits';
      
      // Step 1.2: Experience & Qualification
      if (!formData.qualification.trim()) errors.qualification = 'Qualification is required';
      if (!formData.certificateTraining.trim()) errors.certificateTraining = 'Certificate Training is required';
      if (!formData.experienceTyreFitment.trim()) errors.experienceTyreFitment = 'Experience in Tyre Fitment is required';
      // experienceOther is optional (no asterisk)
      if (formData.associationWithTransporter === 'yes' && !formData.transporterName.trim()) {
        errors.transporterName = 'Transporter Name is required';
      }
      if (!formData.rsaTieUp.trim()) errors.rsaTieUp = 'RSA Tie-up is required';
      
      // Step 1.3: Family Details
      // maritalStatus is optional (no asterisk)
      // children is optional (no asterisk)
      if (!formData.houseOwnership.trim()) errors.houseOwnership = 'House Ownership is required';
    }
    
    if (step === 2) {
      // Step 2.1: Address Details
      if (!formData.nearbyLandmark.trim()) errors.nearbyLandmark = 'Nearby Landmark is required';
      if (!formData.highwayName.trim()) errors.highwayName = 'Highway Name/Number is required';
      if (!formData.sideOfHighway.trim()) errors.sideOfHighway = 'Side of Highway is required';
      if (!formData.district.trim()) errors.district = 'District is required';
      if (!formData.state.trim()) errors.state = 'State is required';
      if (!formData.pincode.trim()) errors.pincode = 'Pincode is required';
      else if (formData.pincode.length !== 6) errors.pincode = 'Pincode must be 6 digits';
      
      // Step 2.2: Nearby Services - pitstopType has default value 'Hub', so always valid
    }
    
    if (step === 3) {
      // Step 3.1: Repair Services
      if (!formData.tyreSizes) errors.tyreSizes = 'Tyre Sizes selection is required';
      if (!formData.tubeTypeTyreRepair) errors.tubeTypeTyreRepair = 'Tube type tyre repair selection is required';
      if (!formData.tubelessTyreRepair) errors.tubelessTyreRepair = 'Tubeless tyre repair selection is required';
      if (!formData.radialCutRepairSkills) errors.radialCutRepairSkills = 'Radial/Cut Repair Skills selection is required';
      if (!formData.repairServicesOther.trim()) errors.repairServicesOther = 'Any Other is required';
      
      // Step 3.2: Communication
      if (!formData.readingWritingCapability) errors.readingWritingCapability = 'Reading & Writing Capability selection is required';
      if (!formData.languagesKnown.trim()) errors.languagesKnown = 'Languages known is required';
    }
    
    if (step === 4) {
      // Step 4.1: Operating Hours
      if (!formData.operationalTiming.trim()) errors.operationalTiming = 'Operational Timing is required';
      if (!formData.numberOfWorkers.trim()) errors.numberOfWorkers = 'Number of workers is required';
      
      // Step 4.2: Business
      if (!formData.monthlyTurnover.trim()) errors.monthlyTurnover = 'Monthly Turnover is required';
    }
    
    if (step === 5) {
      // Step 5.1: Tools
      if (!formData.compressorType.trim()) errors.compressorType = 'Compressor Type is required';
      if (!formData.compressorCapacity.trim()) errors.compressorCapacity = 'Compressor Capacity is required';
      if (!formData.impactWrench) errors.impactWrench = 'Impact Wrench selection is required';
      if (!formData.wheelSpanner) errors.wheelSpanner = 'Wheel Spanner selection is required';
      if (!formData.pneumaticGun) errors.pneumaticGun = 'Pneumatic Gun selection is required';
      if (!formData.jack) errors.jack = 'Jack selection is required';
      if (!formData.hotSpotter.trim()) errors.hotSpotter = 'Hot Spotter (model, capacity) is required';
      if (!formData.otherTools.trim()) errors.otherTools = 'Other tools is required';
    }
    
    if (step === 7) {
      // Step 7.1: Details
      if (!formData.smartphone) errors.smartphone = 'Smartphone selection is required';
      if (!formData.internetAvailability) errors.internetAvailability = 'Internet Availability selection is required';
      if (!formData.banksUpiPaymentsEnabled) errors.banksUpiPaymentsEnabled = 'Banks/UPI Payments Enabled selection is required';
    }
    
    if (step === 8) {
      // Step 8.1: Details
      if (!formData.bankName.trim()) errors.bankName = 'Bank Name is required';
      if (!formData.accountHolderName.trim()) errors.accountHolderName = 'Account Holder Name is required';
      if (!formData.accountNumber.trim()) errors.accountNumber = 'Account Number is required';
      if (!formData.ifscCode.trim()) errors.ifscCode = 'IFSC Code is required';
      if (!formData.upi.trim()) errors.upi = 'UPI (if available) is required';
      if (!formData.gstRegistration.trim()) errors.gstRegistration = 'GST Registration (if available) is required';
    }
    
    if (step === 9) {
      // Step 9.1: Details
      if (!formData.raisedConcreteBed) errors.raisedConcreteBed = 'Raised concrete bed for working selection is required';
      if (!formData.nightLighting) errors.nightLighting = 'Night Lighting selection is required';
      if (!formData.seatingDriversShelter) errors.seatingDriversShelter = 'Seating/Shelter for Drivers selection is required';
      if (!formData.tyreStorageFacility) errors.tyreStorageFacility = 'Tyre storage facility selection is required';
      if (!formData.tyresStorage) errors.tyresStorage = 'Tyres (if storage is available) selection is required';
    }
    
    // Add validation for step 10 when it is implemented
    if (step >= 10 && step <= 10) {
      // Placeholder for future step validations
      // return {}; // Allow navigation for now
    }
    
    return errors;
  };

  const handleNext = () => {
    // Validate current step
    const validationErrors = validateStep(currentStep);
    
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      
      // Scroll to first error field
      const firstErrorField = Object.keys(validationErrors)[0];
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }
    
    // Clear errors if validation passes
    setFieldErrors({});
    
    // Mark current step as completed and save
    const updatedCompletedSteps = completedSteps.includes(currentStep) 
      ? completedSteps 
      : [...completedSteps, currentStep];
    
    setCompletedSteps(updatedCompletedSteps);
    
    // Move to next step
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Save to localStorage with updated values
      if (pitstopId) {
        localStorage.setItem(`pitstop_${pitstopId}_formData`, JSON.stringify(formData));
        localStorage.setItem(`pitstop_${pitstopId}_currentStep`, nextStep.toString());
        localStorage.setItem(`pitstop_${pitstopId}_completedSteps`, JSON.stringify(updatedCompletedSteps));
      }
      
      window.scrollTo(0, 0);
    } else {
      // Final step - submit form to backend
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // For demo: Only send Step 1.1 Personal Details
      const submitPayload = {
        pitstopId,
        category,
        status: 'pending',
        // Step 1.1 fields only
        ownerName: formData.ownerName,
        ownerAge: formData.ownerAge,
        mobileNo: formData.mobileNo,
        aadhaarNo: formData.aadhaarNo
      };
      
      // Send as JSON (no file upload for demo)
      const response = await axios.post(
        `${API_BASE_URL}/submit-additional-details`,
        submitPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        clearLocalStorageAndShowSuccess();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorageAndShowSuccess = () => {
    // Clear localStorage after successful submission
    if (pitstopId) {
      localStorage.removeItem(`pitstop_${pitstopId}_formData`);
      localStorage.removeItem(`pitstop_${pitstopId}_currentStep`);
      localStorage.removeItem(`pitstop_${pitstopId}_completedSteps`);
    }
    
    // Show success modal
    setShowSuccessModal(true);
  };

  const handleStepClick = (step) => {
    // Only allow clicking on completed steps
    if (completedSteps.includes(step)) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };

  // Calculate which steps to display in stepper (show 4 at a time)
  const getVisibleSteps = () => {
    if (currentStep <= 4) {
      return [1, 2, 3, 4];
    } else if (currentStep >= totalSteps) {
      return [totalSteps - 3, totalSteps - 2, totalSteps - 1, totalSteps];
    } else {
      // Show current step and 3 steps ahead (sliding window)
      return [currentStep - 3, currentStep - 2, currentStep - 1, currentStep];
    }
  };

  const visibleSteps = getVisibleSteps();

  const steps = [
    { number: 1, label: 'Personal\nProfile' },
    { number: 2, label: 'Location\nDetails' },
    { number: 3, label: 'Capability &\nSkills' },
    { number: 4, label: 'Current\nOperations' },
    { number: 5, label: 'Tools &\nEquipment' },
    { number: 6, label: 'Growth\nPotential' },
    { number: 7, label: 'Digital\nReadiness' },
    { number: 8, label: 'Payment' },
    { number: 9, label: 'Infrastructure' },
    { number: 10, label: 'LOI\nSubmission' },
  ];

  const visibleStepObjects = visibleSteps.map(num => steps[num - 1]);

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
        <h1 className="text-lg font-bold text-black">
          Onboarding Details
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Progress Stepper */}
        <div className="mb-8 max-w-3xl mx-auto">
          <div className="flex items-start justify-between relative">
            {visibleStepObjects.map((step, index) => (
              <div 
                key={step.number} 
                className="flex flex-col items-center relative cursor-pointer" 
                style={{ flex: '0 0 auto' }}
                onClick={() => handleStepClick(step.number)}
              >
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    completedSteps.includes(step.number)
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'text-white'
                      : 'bg-white border-2 border-orange-500 text-gray-400'
                  }`}
                  style={
                    currentStep === step.number && !completedSteps.includes(step.number)
                      ? { backgroundColor: 'var(--brand)' }
                      : {}
                  }
                >
                  {completedSteps.includes(step.number) ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                
                {/* Label */}
                <p
                  className={`text-xs mt-2 text-center whitespace-pre-line ${
                    currentStep === step.number
                      ? 'font-semibold text-gray-900'
                      : completedSteps.includes(step.number)
                      ? 'font-medium text-green-600'
                      : 'text-gray-500'
                  }`}
                  style={{ maxWidth: '70px' }}
                >
                  {step.label}
                </p>
                
                {/* Connector Line - positioned absolutely */}
                {index < visibleStepObjects.length - 1 && (
                  <div
                    className={`absolute h-0.5 top-5 transition-all ${
                      completedSteps.includes(step.number) ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    style={{
                      left: 'calc(50% + 20px)',
                      width: '80px'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1 Form Content */}
        {currentStep === 1 && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Step 1.1 : Personal Details
              </h2>

              <div className="space-y-6">
            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.ownerName 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="MD Suns Tabrez"
              />
              {fieldErrors.ownerName && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.ownerName}</p>
              )}
            </div>

            {/* Owner Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Age<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="ownerAge"
                value={formData.ownerAge}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.ownerAge 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="Type Here"
              />
              {fieldErrors.ownerAge && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.ownerAge}</p>
              )}
            </div>

            {/* User's Mobile No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User's Mobile No.<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-20 border rounded-lg focus:outline-none ${
                    fieldErrors.mobileNo 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-gray-400'
                  }`}
                  placeholder="9794537826"
                  maxLength="10"
                />
                <button
                  type="button"
                  onClick={handleVerifyMobile}
                  disabled={formData.mobileNo.length !== 10}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                  style={{ color: 'var(--brand)' }}
                >
                  Verify
                </button>
              </div>
              {fieldErrors.mobileNo && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.mobileNo}</p>
              )}
            </div>

            {/* Enter OTP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-32 border rounded-lg focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    fieldErrors.otp 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-gray-400'
                  }`}
                  placeholder={otpSent ? "Enter 4-digit OTP" : "Click Verify to receive OTP"}
                  maxLength="4"
                  disabled={!otpSent || otpVerified}
                />
                {otpSent && !otpVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={formData.otp.length !== 4 || loading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    Verify OTP
                  </button>
                )}
                {otpVerified && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                    ✓ Verified
                  </div>
                )}
              </div>
              {fieldErrors.otp && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.otp}</p>
              )}
            </div>

            {/* Aadhaar No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar No.<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="aadhaarNo"
                value={formData.aadhaarNo}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.aadhaarNo 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="Type Here"
                maxLength="12"
              />
              {fieldErrors.aadhaarNo && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.aadhaarNo}</p>
              )}
            </div>
              </div>
            </div>

            {/* Step 1.2: Experience & Qualification */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Step 1.2 : Experience & Qualification
              </h2>

              <div className="space-y-6">
            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.qualification 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="Type Here"
              />
              {fieldErrors.qualification && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.qualification}</p>
              )}
            </div>

            {/* Certificate/Training Received in Past */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate/ Training Received in Past<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="certificateTraining"
                value={formData.certificateTraining}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.certificateTraining 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="45"
              />
              {fieldErrors.certificateTraining && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.certificateTraining}</p>
              )}
            </div>

            {/* Experience in Tyre Fitment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience in Tyre Fitment<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="experienceTyreFitment"
                value={formData.experienceTyreFitment}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.experienceTyreFitment 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="Type Here"
              />
              {fieldErrors.experienceTyreFitment && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.experienceTyreFitment}</p>
              )}
            </div>

            {/* Experience other than Tyre Fitment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience other than Tyre Fitment
              </label>
              <input
                type="text"
                name="experienceOther"
                value={formData.experienceOther}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="Type Here"
              />
            </div>

            {/* Association with a transporter */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Association with a transporter<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="associationWithTransporter"
                    value="yes"
                    checked={formData.associationWithTransporter === 'yes'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        associationWithTransporter: e.target.checked ? 'yes' : 'no'
                      });
                    }}
                    className="w-5 h-5 accent-orange-500 rounded"
                  />
                  <span className="text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="associationWithTransporter"
                    value="no"
                    checked={formData.associationWithTransporter === 'no'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        associationWithTransporter: e.target.checked ? 'no' : 'yes'
                      });
                    }}
                    className="w-5 h-5 accent-gray-400 rounded"
                  />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
            </div>

            {/* Name of Transporter - conditional */}
            {formData.associationWithTransporter === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name of Transporter<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="transporterName"
                  value={formData.transporterName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                    fieldErrors.transporterName 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-gray-400'
                  }`}
                  placeholder="Name of Transporter"
                />
                {fieldErrors.transporterName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.transporterName}</p>
                )}
              </div>
            )}

            {/* Affiliation to any tyre/technician association */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliation to any tyre/ technician association
              </label>
              <input
                type="text"
                name="tyreAssociation"
                value={formData.tyreAssociation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="Type Here"
              />
            </div>

            {/* Tie-up with any other RSA provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tie - up with any other RSA provider<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rsaTieUp"
                value={formData.rsaTieUp}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.rsaTieUp 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="Type Here"
              />
              {fieldErrors.rsaTieUp && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.rsaTieUp}</p>
              )}
            </div>

            {/* Rating by RSA provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating by RSA provider
              </label>
              <input
                type="text"
                name="rsaRating"
                value={formData.rsaRating}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="Type Here"
              />
            </div>
              </div>
            </div>

            {/* Step 1.3: Family Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
              Step 1.3 : Family Details
            </h2>

            <div className="space-y-6">
              {/* Marital Status */}
            {/* Marital Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marital Status
              </label>
              <input
                type="text"
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.maritalStatus 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="Type Here"
              />
              {fieldErrors.maritalStatus && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.maritalStatus}</p>
              )}
            </div>

            {/* Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Children
              </label>
              <input
                type="text"
                name="children"
                value={formData.children}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                  fieldErrors.children 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                placeholder="Type Here"
              />
              {fieldErrors.children && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.children}</p>
              )}
            </div>

            {/* Living with Family */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Living with Family<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="livingWithFamily"
                    value="yes"
                    checked={formData.livingWithFamily === 'yes'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        livingWithFamily: e.target.checked ? 'yes' : 'no'
                      });
                    }}
                    className="w-5 h-5 accent-orange-500 rounded"
                  />
                  <span className="text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="livingWithFamily"
                    value="no"
                    checked={formData.livingWithFamily === 'no'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        livingWithFamily: e.target.checked ? 'no' : 'yes'
                      });
                    }}
                    className="w-5 h-5 accent-gray-400 rounded"
                  />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
            </div>

            {/* Living House Ownership */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Living House Ownership<span className="text-red-500">*</span>
              </label>
              <select
                name="houseOwnership"
                value={formData.houseOwnership}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-gray-500 ${
                  fieldErrors.houseOwnership 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-gray-400'
                }`}
                required
              >
                <option value="">Tap to Select</option>
                <option value="owned">Owned</option>
                <option value="rented">Rented</option>
                <option value="leased">Leased</option>
                <option value="other">Other</option>
              </select>
              {fieldErrors.houseOwnership && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.houseOwnership}</p>
              )}
            </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons and Messages */}
        <>
          {currentStep === 1 && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSaveAsDraft}
                disabled={loading || draftSaving}
                className="flex-1 py-3 rounded-lg font-semibold border-2 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
              >
                {draftSaving && (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {draftSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handleNext}
                disabled={loading || (otpSent && !otpVerified)}
                className="flex-1 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                {loading ? 'Processing...' : 'Next'}
              </button>
            </div>
          )}
          
          {currentStep === 2 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 2.1 : Address Details
                </h2>

                <div className="space-y-6">
                {/* Google Maps Link */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Google Maps Link
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (navigator.geolocation) {
                          setLoading(true);
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const { latitude, longitude } = position.coords;
                              const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                              
                              try {
                                // Call Google Geocoding API
                                const GOOGLE_API_KEY = 'AIzaSyDagX1h0n0zsQtAZ9bCaD9zdmjWx_1cLoo';
                                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
                                
                                const response = await fetch(geocodeUrl);
                                const data = await response.json();
                                
                                if (data.status === 'OK' && data.results.length > 0) {
                                  
                                  const addressComponents = data.results[0].address_components;
                                  
                                  // Extract location details
                                  let district = '';
                                  let state = '';
                                  let pincode = '';
                                  let landmark = '';
                                  
                                  addressComponents.forEach(component => {
                                    if (component.types.includes('administrative_area_level_3')) {
                                      district = component.long_name;
                                    }
                                    if (component.types.includes('administrative_area_level_1')) {
                                      state = component.long_name;
                                    }
                                    if (component.types.includes('postal_code')) {
                                      pincode = component.long_name;
                                    }
                                    if (component.types.includes('sublocality_level_1') || component.types.includes('locality')) {
                                      if (!landmark) landmark = component.long_name;
                                    }
                                  });
                                  
                                  // Update form data with all fetched values
                                  setFormData({
                                    ...formData,
                                    googleMapsLink: mapsLink,
                                    district: district,
                                    state: state,
                                    pincode: pincode,
                                    nearbyLandmark: landmark
                                  });
                                } else {
                                  // Just set the maps link if geocoding fails
                                  setFormData({ ...formData, googleMapsLink: mapsLink });
                                }
                              } catch (error) {
                                console.error('Geocoding error:', error);
                                setFormData({ ...formData, googleMapsLink: mapsLink });
                              } finally {
                                setLoading(false);
                              }
                            },
                            (error) => {
                              setLoading(false);
                            }
                          );
                        }
                      }}
                      disabled={loading}
                      className="flex items-center gap-2 font-medium text-sm disabled:opacity-50"
                      style={{ color: 'var(--brand)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {loading ? 'Fetching...' : 'Fetch Current Location'}
                    </button>
                  </div>
                  <input
                    type="text"
                    name="googleMapsLink"
                    value={formData.googleMapsLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    placeholder=""
                    readOnly
                  />
                </div>

                {/* Nearby Landmark */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nearby Landmark<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nearbyLandmark"
                    value={formData.nearbyLandmark}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                      fieldErrors.nearbyLandmark 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gray-400'
                    }`}
                    placeholder="Type Here"
                    required
                  />
                  {fieldErrors.nearbyLandmark && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.nearbyLandmark}</p>
                  )}
                </div>

                {/* Highway Name / Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Highway Name / Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="highwayName"
                    value={formData.highwayName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                      fieldErrors.highwayName 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gray-400'
                    }`}
                    placeholder="Type Here"
                    required
                  />
                  {fieldErrors.highwayName && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.highwayName}</p>
                  )}
                </div>

                {/* Side of Highway */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Side of Highway<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sideOfHighway"
                    value={formData.sideOfHighway}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                      fieldErrors.sideOfHighway 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gray-400'
                    }`}
                    placeholder="Type Here"
                    required
                  />
                  {fieldErrors.sideOfHighway && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.sideOfHighway}</p>
                  )}
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                      fieldErrors.district 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gray-400'
                    }`}
                    placeholder="Type Here"
                    required
                  />
                  {fieldErrors.district && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.district}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none text-gray-500 ${
                      fieldErrors.state 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gray-400'
                    }`}
                    required
                  >
                    <option value="">Tap to Select</option>
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Puducherry">Puducherry</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                  {fieldErrors.state && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.state}</p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                      fieldErrors.pincode 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gray-400'
                    }`}
                    placeholder="Type Here"
                    pattern="[0-9]{6}"
                    maxLength="6"
                    required
                  />
                  {fieldErrors.pincode && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.pincode}</p>
                  )}
                </div>
              </div>
              </div>

              {/* Step 2.2: Nearby Services */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 2.2 : Nearby Services (on the same highway side)
                </h2>

                <div className="space-y-6">
                {/* Pitstop Type */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Pitstop Type<span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="pitstopType"
                          value="Hub"
                          checked={formData.pitstopType === 'Hub'}
                          onChange={handleInputChange}
                          className="appearance-none w-6 h-6 border-2 border-gray-400 rounded-full cursor-pointer"
                        />
                        {formData.pitstopType === 'Hub' && (
                          <span 
                            className="absolute w-3.5 h-3.5 rounded-full pointer-events-none"
                            style={{ backgroundColor: 'var(--brand)' }}
                          />
                        )}
                      </div>
                      <span className="text-gray-700">Hub</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="pitstopType"
                          value="Highway"
                          checked={formData.pitstopType === 'Highway'}
                          onChange={handleInputChange}
                          className="appearance-none w-6 h-6 border-2 border-gray-400 rounded-full cursor-pointer"
                        />
                        {formData.pitstopType === 'Highway' && (
                          <span 
                            className="absolute w-3.5 h-3.5 rounded-full pointer-events-none"
                            style={{ backgroundColor: 'var(--brand)' }}
                          />
                        )}
                      </div>
                      <span className="text-gray-700">Highway</span>
                    </label>
                  </div>
                </div>

                {/* Distance from nearest fuel pump */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance from nearest fuel pump
                  </label>
                  <input
                    type="text"
                    name="distanceFuelPump"
                    value={formData.distanceFuelPump}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    placeholder="Type Here"
                  />
                </div>

                {/* Distance from nearest dhaba/ restaurant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance from nearest dhaba/ restaurant
                  </label>
                  <input
                    type="text"
                    name="distanceDhaba"
                    value={formData.distanceDhaba}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    placeholder="Type Here"
                  />
                </div>

                {/* Distance from nearest hub */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance from nearest hub
                  </label>
                  <input
                    type="text"
                    name="distanceHub"
                    value={formData.distanceHub}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    placeholder="Type Here"
                  />
                </div>

                {/* Distance from nearest U - turn on the same side */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance from nearest U - turn on the same side
                  </label>
                  <input
                    type="text"
                    name="distanceUTurnSameSide"
                    value={formData.distanceUTurnSameSide}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    placeholder="Type Here"
                  />
                </div>

                {/* Distance from nearest U - turn on the opposite side */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance from nearest U - turn on the opposite side
                  </label>
                  <input
                    type="text"
                    name="distanceUTurnOppositeSide"
                    value={formData.distanceUTurnOppositeSide}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    placeholder="Type Here"
                  />
                </div>
              </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 3.1 : Repair Services
                </h2>

                <div className="space-y-6">
                  {/* Tyre Sizes */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Tyre Sizes<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tyreSizes"
                            value="yes"
                            checked={formData.tyreSizes === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tyreSizes: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.tyreSizes) {
                                setFieldErrors({ ...fieldErrors, tyreSizes: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.tyreSizes === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.tyreSizes === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.tyreSizes === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tyreSizes"
                            value="no"
                            checked={formData.tyreSizes === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tyreSizes: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.tyreSizes) {
                                setFieldErrors({ ...fieldErrors, tyreSizes: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.tyreSizes && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.tyreSizes}</p>
                  )}

                  {/* Tube type tyre repair */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Tube type tyre repair<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tubeTypeTyreRepair"
                            value="yes"
                            checked={formData.tubeTypeTyreRepair === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tubeTypeTyreRepair: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.tubeTypeTyreRepair) {
                                setFieldErrors({ ...fieldErrors, tubeTypeTyreRepair: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.tubeTypeTyreRepair === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.tubeTypeTyreRepair === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.tubeTypeTyreRepair === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tubeTypeTyreRepair"
                            value="no"
                            checked={formData.tubeTypeTyreRepair === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tubeTypeTyreRepair: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.tubeTypeTyreRepair) {
                                setFieldErrors({ ...fieldErrors, tubeTypeTyreRepair: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.tubeTypeTyreRepair && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.tubeTypeTyreRepair}</p>
                  )}

                  {/* Tubeless tyre repair */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Tubeless tyre repair<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tubelessTyreRepair"
                            value="yes"
                            checked={formData.tubelessTyreRepair === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tubelessTyreRepair: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.tubelessTyreRepair) {
                                setFieldErrors({ ...fieldErrors, tubelessTyreRepair: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.tubelessTyreRepair === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.tubelessTyreRepair === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.tubelessTyreRepair === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tubelessTyreRepair"
                            value="no"
                            checked={formData.tubelessTyreRepair === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tubelessTyreRepair: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.tubelessTyreRepair) {
                                setFieldErrors({ ...fieldErrors, tubelessTyreRepair: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.tubelessTyreRepair && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.tubelessTyreRepair}</p>
                  )}

                  {/* Radial/ Cut Repair Skills */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Radial/ Cut Repair Skills<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="radialCutRepairSkills"
                            value="yes"
                            checked={formData.radialCutRepairSkills === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                radialCutRepairSkills: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.radialCutRepairSkills) {
                                setFieldErrors({ ...fieldErrors, radialCutRepairSkills: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.radialCutRepairSkills === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.radialCutRepairSkills === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.radialCutRepairSkills === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="radialCutRepairSkills"
                            value="no"
                            checked={formData.radialCutRepairSkills === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                radialCutRepairSkills: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.radialCutRepairSkills) {
                                setFieldErrors({ ...fieldErrors, radialCutRepairSkills: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.radialCutRepairSkills && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.radialCutRepairSkills}</p>
                  )}

                  {/* Any Other */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Any Other<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="repairServicesOther"
                      value={formData.repairServicesOther}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.repairServicesOther 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.repairServicesOther && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.repairServicesOther}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3.2: Communication */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 3.2 : Communication
                </h2>

                <div className="space-y-6">
                  {/* Reading & Writing Capability */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Reading & Writing Capability<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="readingWritingCapability"
                            value="yes"
                            checked={formData.readingWritingCapability === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                readingWritingCapability: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.readingWritingCapability) {
                                setFieldErrors({ ...fieldErrors, readingWritingCapability: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.readingWritingCapability === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.readingWritingCapability === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.readingWritingCapability === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="readingWritingCapability"
                            value="no"
                            checked={formData.readingWritingCapability === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                readingWritingCapability: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.readingWritingCapability) {
                                setFieldErrors({ ...fieldErrors, readingWritingCapability: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.readingWritingCapability && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.readingWritingCapability}</p>
                  )}

                  {/* Languages known */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages known<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="languagesKnown"
                      value={formData.languagesKnown}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.languagesKnown 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.languagesKnown && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.languagesKnown}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 4.1 : Operating Hours
                </h2>

                <div className="space-y-6">
                  {/* Operational Timing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operational Timing<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="operationalTiming"
                      value={formData.operationalTiming}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.operationalTiming 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.operationalTiming && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.operationalTiming}</p>
                    )}
                  </div>

                  {/* Number of workers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of workers<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="numberOfWorkers"
                      value={formData.numberOfWorkers}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.numberOfWorkers 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.numberOfWorkers && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.numberOfWorkers}</p>
                    )}
                  </div>

                  {/* Contact Number - Worker 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number - Worker 1
                    </label>
                    <input
                      type="text"
                      name="contactNumberWorker1"
                      value={formData.contactNumberWorker1}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Contact Number - Worker 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number - Worker 2
                    </label>
                    <input
                      type="text"
                      name="contactNumberWorker2"
                      value={formData.contactNumberWorker2}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Contact Number - Worker 3 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number - Worker 3
                    </label>
                    <input
                      type="text"
                      name="contactNumberWorker3"
                      value={formData.contactNumberWorker3}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Contact Number - Worker 4 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number - Worker 4
                    </label>
                    <input
                      type="text"
                      name="contactNumberWorker4"
                      value={formData.contactNumberWorker4}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Contact Number - Worker 5 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number - Worker 5
                    </label>
                    <input
                      type="text"
                      name="contactNumberWorker5"
                      value={formData.contactNumberWorker5}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4.2: Business */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 4.2 : Business
                </h2>

                <div className="space-y-6">
                  {/* Monthly Turnover */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Turnover<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="monthlyTurnover"
                      value={formData.monthlyTurnover}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.monthlyTurnover 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.monthlyTurnover && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.monthlyTurnover}</p>
                    )}
                  </div>

                  {/* Tyre Rotations (per day) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tyre Rotations (per day)
                    </label>
                    <input
                      type="text"
                      name="tyreRotations"
                      value={formData.tyreRotations}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Tyre Fitment (per day) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tyre Fitment (per day)
                    </label>
                    <input
                      type="text"
                      name="tyreFitment"
                      value={formData.tyreFitment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Tyre Inflations (per day) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tyre Inflations (per day)
                    </label>
                    <input
                      type="text"
                      name="tyreInflations"
                      value={formData.tyreInflations}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Radial Tyre Repairs (per day) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Radial Tyre Repairs (per day)
                    </label>
                    <input
                      type="text"
                      name="radialTyreRepairs"
                      value={formData.radialTyreRepairs}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Nylon Tyre Repairs (per day) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nylon Tyre Repairs (per day)
                    </label>
                    <input
                      type="text"
                      name="nylonTyreRepairs"
                      value={formData.nylonTyreRepairs}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Tubeless Tyre Repairs (per day) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tubeless Tyre Repairs (per day)
                    </label>
                    <input
                      type="text"
                      name="tubelessTyreRepairs"
                      value={formData.tubelessTyreRepairs}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Tube Type Tyre Repairs (per day) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tube Type Tyre Repairs (per day)
                    </label>
                    <input
                      type="text"
                      name="tubeTypeTyreRepairs"
                      value={formData.tubeTypeTyreRepairs}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4.3: Pricing */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 4.3 : Pricing
                </h2>

                <div className="space-y-6">
                  {/* Tube Puncture Repair Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tube Puncture Repair Cost
                    </label>
                    <input
                      type="text"
                      name="tubePunctureRepairCost"
                      value={formData.tubePunctureRepairCost}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Patch Repair Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patch Repair Cost
                    </label>
                    <input
                      type="text"
                      name="patchRepairCost"
                      value={formData.patchRepairCost}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Tyre Fitment/ Removal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tyre Fitment/ Removal
                    </label>
                    <input
                      type="text"
                      name="tyreFitmentRemovalCost"
                      value={formData.tyreFitmentRemovalCost}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Tyre Inflation Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tyre Inflation Cost
                    </label>
                    <input
                      type="text"
                      name="tyreInflationCost"
                      value={formData.tyreInflationCost}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 5.1 : Tools
                </h2>

                <div className="space-y-6">
                  {/* Compressor Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compressor Type<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="compressorType"
                      value={formData.compressorType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.compressorType 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.compressorType && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.compressorType}</p>
                    )}
                  </div>

                  {/* Compressor Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compressor Capacity<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="compressorCapacity"
                      value={formData.compressorCapacity}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.compressorCapacity 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.compressorCapacity && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.compressorCapacity}</p>
                    )}
                  </div>

                  {/* Impact Wrench */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Impact Wrench<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="impactWrench"
                            value="yes"
                            checked={formData.impactWrench === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                impactWrench: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.impactWrench) {
                                setFieldErrors({ ...fieldErrors, impactWrench: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.impactWrench === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.impactWrench === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.impactWrench === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="impactWrench"
                            value="no"
                            checked={formData.impactWrench === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                impactWrench: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.impactWrench) {
                                setFieldErrors({ ...fieldErrors, impactWrench: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.impactWrench && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.impactWrench}</p>
                  )}

                  {/* Wheel Spanner */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Wheel Spanner<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="wheelSpanner"
                            value="yes"
                            checked={formData.wheelSpanner === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                wheelSpanner: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.wheelSpanner) {
                                setFieldErrors({ ...fieldErrors, wheelSpanner: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.wheelSpanner === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.wheelSpanner === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.wheelSpanner === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="wheelSpanner"
                            value="no"
                            checked={formData.wheelSpanner === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                wheelSpanner: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.wheelSpanner) {
                                setFieldErrors({ ...fieldErrors, wheelSpanner: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.wheelSpanner && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.wheelSpanner}</p>
                  )}

                  {/* Pneumatic Gun */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Pneumatic Gun<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="pneumaticGun"
                            value="yes"
                            checked={formData.pneumaticGun === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                pneumaticGun: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.pneumaticGun) {
                                setFieldErrors({ ...fieldErrors, pneumaticGun: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.pneumaticGun === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.pneumaticGun === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.pneumaticGun === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="pneumaticGun"
                            value="no"
                            checked={formData.pneumaticGun === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                pneumaticGun: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.pneumaticGun) {
                                setFieldErrors({ ...fieldErrors, pneumaticGun: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.pneumaticGun && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.pneumaticGun}</p>
                  )}

                  {/* Jack */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Jack<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="jack"
                            value="yes"
                            checked={formData.jack === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                jack: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.jack) {
                                setFieldErrors({ ...fieldErrors, jack: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.jack === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.jack === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.jack === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="jack"
                            value="no"
                            checked={formData.jack === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                jack: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.jack) {
                                setFieldErrors({ ...fieldErrors, jack: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.jack && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.jack}</p>
                  )}

                  {/* Hot Spotter (model, capacity) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hot Spotter (model, capacity)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="hotSpotter"
                      value={formData.hotSpotter}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.hotSpotter 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.hotSpotter && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.hotSpotter}</p>
                    )}
                  </div>

                  {/* Other tools (if any) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other tools (if any)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="otherTools"
                      value={formData.otherTools}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.otherTools 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.otherTools && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.otherTools}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 6 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 6.1 : Details
                </h2>

                <div className="space-y-6">
                  {/* Other Shop Name (if exists) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Shop Name (if exists)
                    </label>
                    <input
                      type="text"
                      name="otherShopName"
                      value={formData.otherShopName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Other Shop Geo - Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Shop Geo - Location
                    </label>
                    <input
                      type="text"
                      name="otherShopGeoLocation"
                      value={formData.otherShopGeoLocation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Willingness to invest in more tools (if supported) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Willingness to invest in more tools (if supported)
                    </label>
                    <input
                      type="text"
                      name="willingnessToInvest"
                      value={formData.willingnessToInvest}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>

                  {/* Interest in stocking tyres */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interest in stocking tyres
                    </label>
                    <input
                      type="text"
                      name="interestInStockingTyres"
                      value={formData.interestInStockingTyres}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 7 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 7.1 : Details
                </h2>

                <div className="space-y-6">
                  {/* Smartphone */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Smartphone<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="smartphone"
                            value="yes"
                            checked={formData.smartphone === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                smartphone: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.smartphone) {
                                setFieldErrors({ ...fieldErrors, smartphone: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.smartphone === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.smartphone === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.smartphone === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="smartphone"
                            value="no"
                            checked={formData.smartphone === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                smartphone: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.smartphone) {
                                setFieldErrors({ ...fieldErrors, smartphone: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.smartphone && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.smartphone}</p>
                  )}

                  {/* Internet Availability */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Internet Availability<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="internetAvailability"
                            value="yes"
                            checked={formData.internetAvailability === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                internetAvailability: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.internetAvailability) {
                                setFieldErrors({ ...fieldErrors, internetAvailability: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.internetAvailability === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.internetAvailability === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.internetAvailability === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="internetAvailability"
                            value="no"
                            checked={formData.internetAvailability === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                internetAvailability: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.internetAvailability) {
                                setFieldErrors({ ...fieldErrors, internetAvailability: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.internetAvailability && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.internetAvailability}</p>
                  )}

                  {/* Banks/ UPI Payments Enabled */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Banks/ UPI Payments Enabled<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="banksUpiPaymentsEnabled"
                            value="yes"
                            checked={formData.banksUpiPaymentsEnabled === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                banksUpiPaymentsEnabled: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.banksUpiPaymentsEnabled) {
                                setFieldErrors({ ...fieldErrors, banksUpiPaymentsEnabled: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.banksUpiPaymentsEnabled === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.banksUpiPaymentsEnabled === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.banksUpiPaymentsEnabled === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="banksUpiPaymentsEnabled"
                            value="no"
                            checked={formData.banksUpiPaymentsEnabled === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                banksUpiPaymentsEnabled: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.banksUpiPaymentsEnabled) {
                                setFieldErrors({ ...fieldErrors, banksUpiPaymentsEnabled: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.banksUpiPaymentsEnabled && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.banksUpiPaymentsEnabled}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStep === 8 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 8.1 : Details
                </h2>

                <div className="space-y-6">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.bankName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.bankName && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.bankName}</p>
                    )}
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.accountHolderName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.accountHolderName && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.accountHolderName}</p>
                    )}
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.accountNumber 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.accountNumber && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.accountNumber}</p>
                    )}
                  </div>

                  {/* IFSC Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.ifscCode 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.ifscCode && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.ifscCode}</p>
                    )}
                  </div>

                  {/* UPI (if available) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UPI (if available)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="upi"
                      value={formData.upi}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.upi 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.upi && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.upi}</p>
                    )}
                  </div>

                  {/* GST Registration (if available) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Registration (if available)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="gstRegistration"
                      value={formData.gstRegistration}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${
                        fieldErrors.gstRegistration 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:border-gray-400'
                      }`}
                      placeholder="Type Here"
                    />
                    {fieldErrors.gstRegistration && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.gstRegistration}</p>
                    )}
                  </div>

                  {/* Loan/ EMI Obligations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan/ EMI Obligations
                    </label>
                    <input
                      type="text"
                      name="loanEmiObligations"
                      value={formData.loanEmiObligations}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                      placeholder="Type Here"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 9 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 9.1 : Details
                </h2>

                <div className="space-y-6">
                  {/* Raised concrete bed for working */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Raised concrete bed for working<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="raisedConcreteBed"
                            value="yes"
                            checked={formData.raisedConcreteBed === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                raisedConcreteBed: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.raisedConcreteBed) {
                                setFieldErrors({ ...fieldErrors, raisedConcreteBed: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.raisedConcreteBed === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.raisedConcreteBed === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.raisedConcreteBed === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="raisedConcreteBed"
                            value="no"
                            checked={formData.raisedConcreteBed === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                raisedConcreteBed: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.raisedConcreteBed) {
                                setFieldErrors({ ...fieldErrors, raisedConcreteBed: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.raisedConcreteBed && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.raisedConcreteBed}</p>
                  )}

                  {/* Night Lighting */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Night Lighting<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="nightLighting"
                            value="yes"
                            checked={formData.nightLighting === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                nightLighting: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.nightLighting) {
                                setFieldErrors({ ...fieldErrors, nightLighting: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.nightLighting === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.nightLighting === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.nightLighting === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="nightLighting"
                            value="no"
                            checked={formData.nightLighting === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                nightLighting: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.nightLighting) {
                                setFieldErrors({ ...fieldErrors, nightLighting: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.nightLighting && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.nightLighting}</p>
                  )}

                  {/* Seating/ Shelter for Drivers */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Seating/ Shelter for Drivers<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="seatingDriversShelter"
                            value="yes"
                            checked={formData.seatingDriversShelter === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                seatingDriversShelter: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.seatingDriversShelter) {
                                setFieldErrors({ ...fieldErrors, seatingDriversShelter: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.seatingDriversShelter === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.seatingDriversShelter === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.seatingDriversShelter === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="seatingDriversShelter"
                            value="no"
                            checked={formData.seatingDriversShelter === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                seatingDriversShelter: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.seatingDriversShelter) {
                                setFieldErrors({ ...fieldErrors, seatingDriversShelter: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.seatingDriversShelter && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.seatingDriversShelter}</p>
                  )}

                  {/* Tyre storage facility with proper space and area covered */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Tyre storage facility with proper space and area covered<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tyreStorageFacility"
                            value="yes"
                            checked={formData.tyreStorageFacility === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tyreStorageFacility: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.tyreStorageFacility) {
                                setFieldErrors({ ...fieldErrors, tyreStorageFacility: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.tyreStorageFacility === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.tyreStorageFacility === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.tyreStorageFacility === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tyreStorageFacility"
                            value="no"
                            checked={formData.tyreStorageFacility === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tyreStorageFacility: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.tyreStorageFacility) {
                                setFieldErrors({ ...fieldErrors, tyreStorageFacility: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.tyreStorageFacility && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.tyreStorageFacility}</p>
                  )}

                  {/* Tyres (if storage is available) */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Tyres (if storage is available)<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tyresStorage"
                            value="yes"
                            checked={formData.tyresStorage === 'yes'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tyresStorage: e.target.checked ? 'yes' : ''
                              });
                              if (fieldErrors.tyresStorage) {
                                setFieldErrors({ ...fieldErrors, tyresStorage: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 rounded cursor-pointer"
                            style={{
                              borderColor: formData.tyresStorage === 'yes' ? 'var(--brand)' : '#9ca3af',
                              backgroundColor: formData.tyresStorage === 'yes' ? 'var(--brand)' : 'transparent'
                            }}
                          />
                          {formData.tyresStorage === 'yes' && (
                            <svg
                              className="absolute w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="tyresStorage"
                            value="no"
                            checked={formData.tyresStorage === 'no'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tyresStorage: e.target.checked ? 'no' : ''
                              });
                              if (fieldErrors.tyresStorage) {
                                setFieldErrors({ ...fieldErrors, tyresStorage: undefined });
                              }
                            }}
                            className="appearance-none w-6 h-6 border-2 border-gray-400 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {fieldErrors.tyresStorage && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.tyresStorage}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStep === 10 && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Step 10.1 : LOI Upload
                </h2>

                <div className="space-y-4">
                  {/* File Upload Area */}
                  <div
                    className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: '#f5f5f5', minHeight: '400px' }}
                    onClick={() => document.getElementById('loiFileInput').click()}
                  >
                    <input
                      id="loiFileInput"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setLoiFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center h-full">
                      {/* Lightning Icon */}
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                        style={{ backgroundColor: 'var(--brand)' }}
                      >
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                      </div>
                      {loiFile ? (
                        <div className="text-center">
                          <p className="text-gray-700 font-medium mb-2">
                            {loiFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(loiFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-sm text-gray-500 mt-4">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-500 text-sm">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-gray-400 text-xs mt-2">
                            PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!loiFile) {
                        return;
                      }
                      
                      setUploadingFile(true);
                      try {
                        // Here you would implement the actual file upload logic
                        // For now, we'll just simulate it
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        // You can add your upload API call here
                      } catch (error) {
                        console.error('Upload error:', error);
                      } finally {
                        setUploadingFile(false);
                      }
                    }}
                    disabled={!loiFile || uploadingFile}
                    className="w-full py-4 rounded-lg font-semibold text-white disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    {uploadingFile && (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {uploadingFile ? 'Uploading...' : 'Upload LOI Form'}
                  </button>
                </div>
              </div>
            </>
          )}

          {currentStep > 10 && (
            <div className="mt-6">
              <p className="text-center text-gray-500">All steps completed!</p>
            </div>
          )}

          {currentStep > 1 && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSaveAsDraft}
                disabled={loading || draftSaving}
                className="flex-1 py-3 rounded-lg font-semibold border-2 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
              >
                {draftSaving && (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {draftSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                {currentStep === totalSteps ? 'Submit' : 'Next'}
              </button>
            </div>
          )}
          
          {otpSent && !otpVerified && currentStep === 1 && (
            <p className="text-sm text-red-600 text-center mt-2">
              Please verify your mobile number to continue
            </p>
          )}
        </>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 px-4">
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
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/pitstop-onboarding');
              }}
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

      {/* Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            {/* Yellow hourglass icon with layered circle backgrounds */}
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24">
                {/* Outer light yellow circle */}
                <div className="absolute inset-0 bg-yellow-100 rounded-full opacity-40"></div>
                {/* Middle yellow circle */}
                <div className="absolute inset-3 bg-yellow-200 rounded-full opacity-60"></div>
                {/* Inner yellow circle with icon */}
                <div className="absolute inset-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 2C6 1.44772 6.44772 1 7 1H17C17.5523 1 18 1.44772 18 2V5C18 5.55228 17.5523 6 17 6C17 8.20914 15.2091 10 13 10H11C8.79086 10 7 8.20914 7 6C6.44772 6 6 5.55228 6 5V2ZM17 18C17.5523 18 18 18.4477 18 19V22C18 22.5523 17.5523 23 17 23H7C6.44772 23 6 22.5523 6 22V19C6 18.4477 6.44772 18 7 18C7 15.7909 8.79086 14 11 14H13C15.2091 14 17 15.7909 17 18ZM8 2V4.17071C8.88504 5.27239 10.3453 6 12 6C13.6547 6 15.115 5.27239 16 4.17071V2H8ZM16 19.8293C15.115 18.7276 13.6547 18 12 18C10.3453 18 8.88504 18.7276 8 19.8293V22H16V19.8293Z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">Saved to Drafts</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Your form has been saved to drafts, you can finish this anytime.
            </p>
            
            <button
              onClick={() => {
                setShowDraftModal(false);
                navigate('/pitstop-onboarding');
              }}
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

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            {/* Red/pink exclamation icon with layered circle backgrounds */}
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24">
                {/* Outer light pink circle */}
                <div className="absolute inset-0 bg-red-100 rounded-full opacity-40"></div>
                {/* Middle pink circle */}
                <div className="absolute inset-3 bg-red-200 rounded-full opacity-60"></div>
                {/* Inner red circle with exclamation mark */}
                <div className="absolute inset-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">Error</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              An error occurred while submitting your form. Please retry.
            </p>
            
            <button
              onClick={() => {
                setShowErrorModal(false);
              }}
              className="w-full py-3 rounded-lg text-white font-semibold text-base"
              style={{
                background: 'var(--brand)',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      </div>
    
  );
}
