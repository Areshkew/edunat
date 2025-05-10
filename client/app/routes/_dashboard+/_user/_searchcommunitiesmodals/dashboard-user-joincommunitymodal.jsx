import React, { useState, useRef, useEffect } from 'react';
import { X, Shield, AlertCircle, Info, ChevronLeft, ChevronRight, Coins } from 'lucide-react';

export default function JoinCommunityModal({ community, onClose, onSubmit, isSubmitting }) {
  const [points, setPoints] = useState(100);
  const [pointsInput, setPointsInput] = useState("100"); // Add separate state for input field
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const modalRef = useRef(null);
  const reasonInputRef = useRef(null);

  // Handle clicking outside to close modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Focus reason textarea when switching to step 2
  useEffect(() => {
    if (step === 2 && reasonInputRef.current) {
      reasonInputRef.current.focus();
    }
  }, [step]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only process form submission in step 2
    if (step === 1) {
      validatePoints();
      if (points >= 1 && points <= 10000) {
        setError('');
        setStep(2);
      } else {
        setError('Los puntos solicitados deben estar entre 1 y 10000');
      }
      return;
    }
    
    // Validation for step 2
    if (points < 1 || points > 10000) {
      setError('Los puntos solicitados deben estar entre 1 y 10000');
      return;
    }
    
    if (!reason.trim()) {
      setError('Por favor, proporciona una razón para unirte y recibir puntos');
      return;
    }
    
    // Submit the form
    onSubmit(points, reason);
  };

  const handlePointsInputChange = (e) => {
    const value = e.target.value;
    setPointsInput(value); // Always update text input
    
    // Only update actual points value if it's a valid number
    if (value === "" || isNaN(value)) {
      return;
    }
    
    const numValue = parseInt(value);
    if (numValue >= 0) { // Allow zero temporarily while typing
      setPoints(Math.min(10000, numValue));
    }
  };

  // Sync points with pointsInput when changing with slider or buttons
  useEffect(() => {
    setPointsInput(points.toString());
  }, [points]);

  const validatePoints = () => {
    const numValue = parseInt(pointsInput);
    
    // If input is empty or not a valid number, set to minimum value
    if (pointsInput === "" || isNaN(numValue) || numValue < 1) {
      setPoints(1);
      setPointsInput("1");
    } 
    // If above max, set to max value
    else if (numValue > 10000) {
      setPoints(10000);
      setPointsInput("10000");
    }
    // Otherwise, ensure it's an integer
    else {
      setPoints(numValue);
      setPointsInput(numValue.toString());
    }
  };

  const nextStep = () => {
    if (step === 1) {
      validatePoints();
      
      if (points < 1 || points > 10000) {
        setError('Los puntos solicitados deben estar entre 1 y 10000');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
    setError('');
  };

  const handlePointsInputKeyDown = (e) => {
    // If Enter key is pressed in the points input
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      validatePoints();
      if (points >= 1 && points <= 10000) {
        setError('');
        setStep(2);
      } else {
        setError('Los puntos solicitados deben estar entre 1 y 10000');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-20 p-4 transition-opacity duration-300">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-white" />
              <h3 className="text-lg font-medium text-white">
                {step === 1 ? 'Solicitud de ingreso' : 'Detalles de solicitud'}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-white/80 mt-1 text-sm">
            {community.name}
          </p>
          
          {/* Progress indicators */}
          <div className="flex justify-center mt-3 space-x-1">
            <div className={`h-1 w-16 rounded-full ${step === 1 ? 'bg-white' : 'bg-white/40'} transition-all duration-300`}></div>
            <div className={`h-1 w-16 rounded-full ${step === 2 ? 'bg-white' : 'bg-white/40'} transition-all duration-300`}></div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r mb-4 text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                    Al unirte a la comunidad <span className="font-medium">{community.name}</span>, 
                    puedes solicitar puntos que te ayudarán a adquirir cursos y 
                    otros recursos educativos.
                  </p>
                  <div className="bg-indigo-50 p-3 rounded-md text-sm text-indigo-700 mb-3">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-indigo-500" />
                      <p>
                        Los administradores de la comunidad revisarán tu solicitud 
                        y decidirán si aprueban los puntos solicitados. Los puntos 
                        te permitirán acceder a contenido exclusivo.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <label htmlFor="points" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span>Puntos que solicitas</span>
                    <div className="relative ml-2">
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      {showTooltip && (
                        <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10">
                          Estos puntos te permitirán obtener cursos y recursos dentro de la plataforma
                        </div>
                      )}
                    </div>
                  </label>
                  
                  <div className="flex items-center">
                    <input
                      type="range"
                      id="points-slider"
                      min="1"
                      max="10000" // Full range for the slider
                      value={points}
                      onChange={(e) => setPoints(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      className="bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                      onClick={() => setPoints(Math.max(1, points - (points > 1000 ? 100 : (points > 100 ? 10 : 1))))}
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    
                    <div className="flex items-center bg-indigo-100 rounded-full px-6 py-2">
                      <input
                        type="text"
                        value={pointsInput}
                        onChange={handlePointsInputChange}
                        onBlur={validatePoints}
                        onKeyDown={handlePointsInputKeyDown}
                        className="w-20 bg-transparent text-center font-medium text-indigo-700 text-lg border-none focus:outline-none focus:ring-0"
                      />
                      <Coins className="h-5 w-5 text-indigo-500 ml-1" />
                    </div>
                    
                    <button
                      type="button"
                      className="bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                      onClick={() => setPoints(Math.min(10000, points + (points >= 1000 ? 100 : (points >= 100 ? 10 : 1))))}
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Mínimo 1 punto, máximo 10000 puntos
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button" 
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2.5 text-sm bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 mb-3 text-sm">
                    Explica por qué quieres unirte a esta comunidad y cómo utilizarías 
                    los <span className="font-medium">{points} puntos</span> que solicitas.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo para unirte y recibir puntos
                  </label>
                  <textarea
                    id="reason"
                    ref={reasonInputRef}
                    rows="5"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                    placeholder="Me gustaría unirme porque... Utilizaría los puntos para..."
                    required
                  ></textarea>
                  
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Esta información será vista por los administradores de la comunidad
                  </p>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Atrás
                  </button>
                  
                  <button
                    type="submit"
                    className={`inline-flex items-center px-5 py-2.5 text-sm bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors shadow-sm ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      "Enviar solicitud"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
