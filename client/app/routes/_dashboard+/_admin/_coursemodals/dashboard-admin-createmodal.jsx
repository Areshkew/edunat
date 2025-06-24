import React, { useState, useEffect } from "react";
import { Form, useNavigation } from "@remix-run/react";
import { X, Loader2, Info, AlertCircle } from "lucide-react";

export default function CreateCourseModal({ isOpen, onClose, actionData }) {
  // Form state
  const [name, setName] = useState("");
  const [classroomLink, setClassroomLink] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("0");
  const [cost, setCost] = useState(0);

  // Validation state
  const [errors, setErrors] = useState({});
  const [isTouched, setIsTouched] = useState({});

  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("_action") === "create";

  // Max character limits
  const MAX_NAME_LENGTH = 100;
  const MAX_LINK_LENGTH = 255;

  // Calculate min end date (one day after start date)
  const getMinEndDate = () => {
    if (!startDate) return "";

    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Format as YYYY-MM-DD
    return nextDay.toISOString().split("T")[0];
  };

  // Set today's date as min for start date
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "El nombre del curso es obligatorio";
    } else if (name.trim().length > MAX_NAME_LENGTH) {
      newErrors.name = `El nombre no debe exceder los ${MAX_NAME_LENGTH} caracteres`;
    }

    // Validate classroom link - now required
    if (!classroomLink.trim()) {
      newErrors.classroomLink = "El enlace del aula virtual es obligatorio";
    } else if (classroomLink.length > MAX_LINK_LENGTH) {
      newErrors.classroomLink = `El enlace no debe exceder los ${MAX_LINK_LENGTH} caracteres`;
    } else {
      // Simple URL format validation
      try {
        // Add protocol if missing to avoid URL constructor error
        const url = classroomLink.match(/^https?:\/\//)
          ? classroomLink
          : `https://${classroomLink}`;
        new URL(url);
      } catch (e) {
        newErrors.classroomLink = "El formato del enlace no es válido";
      }
    }

    // Validate start date
    if (!startDate) {
      newErrors.startDate = "La fecha de inicio es obligatoria";
    }

    // Validate end date - now required
    if (!endDate) {
      newErrors.endDate = "La fecha de finalización es obligatoria";
    } else if (startDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = "La fecha de finalización debe ser posterior a la fecha de inicio";
    }

    // Validate cost - ensure it's a valid number
    if (cost < 0) {
      newErrors.cost = "El costo no puede ser negativo";
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    // Mark all fields as touched
    const fields = { name: true, classroomLink: true, startDate: true, endDate: true, cost: true };
    setIsTouched(fields);

    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);

    // Prevent submission if there are errors
    if (Object.keys(formErrors).length > 0) {
      e.preventDefault();
    }
  };

  // Real-time validation as user types
  useEffect(() => {
    if (Object.keys(isTouched).length > 0) {
      const formErrors = validateForm();
      setErrors(formErrors);
    }
  }, [name, classroomLink, startDate, endDate, cost]);

  // Clear form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setClassroomLink("");
      setStartDate("");
      setEndDate("");
      setStatus("0");
      setCost(0);
      setErrors({});
      setIsTouched({});
    }
  }, [isOpen]);

  // Remove auto-close logic - let parent handle success states
  
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Curso</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full p-1"
            disabled={isSubmitting}
            type="button"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        
        <Form method="post" className="p-5" onSubmit={handleSubmit}>
          <input type="hidden" name="_action" value="create" />
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre del Curso*
                </label>
                <span className="text-xs text-gray-500">
                  {name.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                type="text"
                id="name"
                name="name"
                required
                maxLength={MAX_NAME_LENGTH}
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setIsTouched({...isTouched, name: true})}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.name && isTouched.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ej: Introducción a la programación"
                disabled={isSubmitting}
              />
              {errors.name && isTouched.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.name}
                </p>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="classroom_link" className="block text-sm font-medium text-gray-700">
                  Enlace del Aula Virtual*
                </label>
                <span className="text-xs text-gray-500">
                  {classroomLink.length}/{MAX_LINK_LENGTH}
                </span>
              </div>
              <input
                type="url"
                id="classroom_link"
                name="classroom_link"
                required
                maxLength={MAX_LINK_LENGTH}
                value={classroomLink}
                onChange={e => setClassroomLink(e.target.value)}
                onBlur={() => setIsTouched({...isTouched, classroomLink: true})}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.classroomLink && isTouched.classroomLink ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://classroom.example.com"
                disabled={isSubmitting}
              />
              {errors.classroomLink && isTouched.classroomLink ? (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.classroomLink}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <Info size={14} /> Enlace al aula virtual o reunión donde se impartirá el curso
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio*
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  required
                  min={getTodayDate()}
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    // If end date exists and is now before start date, clear it
                    if (endDate && new Date(endDate) < new Date(e.target.value)) {
                      setEndDate("");
                    }
                  }}
                  onBlur={() => setIsTouched({...isTouched, startDate: true})}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.startDate && isTouched.startDate ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.startDate && isTouched.startDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.startDate}
                  </p>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    Fecha de Finalización*
                  </label>
                </div>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  required
                  value={endDate}
                  min={getMinEndDate()}
                  onChange={e => setEndDate(e.target.value)}
                  onBlur={() => setIsTouched({...isTouched, endDate: true})}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.endDate && isTouched.endDate ? "border-red-500" : "border-gray-300"
                  } ${!startDate ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  disabled={isSubmitting || !startDate}
                />
                {errors.endDate && isTouched.endDate ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.endDate}
                  </p>
                ) : (
                  !startDate && (
                    <p className="mt-1 text-xs text-gray-500">
                      Primero selecciona una fecha de inicio
                    </p>
                  )
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado inicial
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isSubmitting}
                >
                  <option value="0">Próximo</option>
                  <option value="1">En progreso</option>
                  <option value="2">Completado</option>
                </select>
              </div>

              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Costo en puntos*
                </label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  required
                  min="0"
                  step="1"
                  value={cost}
                  onChange={e => {
                    const value = parseInt(e.target.value) || 0;
                    setCost(Math.max(0, value));
                  }}
                  onBlur={() => setIsTouched({...isTouched, cost: true})}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.cost && isTouched.cost ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                  disabled={isSubmitting}
                />
                {errors.cost && isTouched.cost ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.cost}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={14} /> Puntos necesarios para unirse al curso (mínimo 0)
                  </p>
                )}
              </div>
            </div>
            
            {/* Server error message */}
            {actionData?.error && actionData?._action === "create" && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{actionData.error}</p>
                </div>
              </div>
            )}
            
            {/* Success message */}
            {actionData?.success && actionData?._action === "create" && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-sm text-green-700">Curso creado con éxito</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || Object.keys(errors).length > 0}
                className={`px-4 py-2 text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center min-w-[120px] ${
                  isSubmitting || Object.keys(errors).length > 0
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <span>Crear Curso</span>
                )}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
