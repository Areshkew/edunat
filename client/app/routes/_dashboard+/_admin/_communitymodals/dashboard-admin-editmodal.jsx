import { AlertCircle } from "lucide-react";
import { useSubmit } from "@remix-run/react";

export default function EditCommunityModal({ isOpen, onClose, community, actionData }) {
  const submit = useSubmit();

  if (!isOpen || !community) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Submit the form data
    submit(formData, { method: "post" });
    
    // Close the modal immediately, like the delete modal does
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Editar comunidad
        </h3>

        {/* Only show error messages, not success messages */}
        {actionData && !actionData.success && actionData.detail && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{actionData.detail}</p>
          </div>
        )}

        {actionData && !actionData.success && !actionData.detail && actionData.error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{actionData.error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="_action" value="update" />
          <input type="hidden" name="community_id" value={community?.id} />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={community?.name || ""}
              placeholder="Nombre de la comunidad" 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              name="about" 
              defaultValue={community?.about || ""}
              placeholder="Descripción de la comunidad"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 min-h-[100px]"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
            <select
              name="visibility"
              defaultValue={community?.visibility ?? 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="1">Activa</option>
              <option value="0">Inactiva</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}