import { useState, useRef, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { 
  Paperclip, 
  Image, 
  FileText, 
  Music, 
  Video, 
  X, 
  Upload,
  Loader2,
  AlertCircle 
} from "lucide-react";

export default function FileUpload({ 
  onFileUploaded, 
  chatType = "direct", 
  receiverId,
  token,
  disabled = false 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [remainingUploads, setRemainingUploads] = useState(5);
  const [hasLoadedCount, setHasLoadedCount] = useState(false);
  const [currentReceiverId, setCurrentReceiverId] = useState(null);
  const [uploadProcessed, setUploadProcessed] = useState(false);
  const fileInputRef = useRef(null);
  
  const fileCountFetcher = useFetcher();
  const uploadFetcher = useFetcher();

  // **ARREGLADO: Cargar conteo solo cuando cambia receiverId y evitar duplicados**
  useEffect(() => {
    if (!receiverId || disabled || !chatType) return;
    
    const validReceiverId = String(receiverId).trim();
    if (!validReceiverId || validReceiverId === 'null' || validReceiverId === 'undefined') {
      console.warn('⚠️ FileUpload: Invalid receiverId, skipping file count:', receiverId);
      return;
    }

    if (validReceiverId !== currentReceiverId) {
      console.log('🔍 FileUpload: Getting file count for new receiverId:', validReceiverId);
      setCurrentReceiverId(validReceiverId);
      setHasLoadedCount(true);
      setRemainingUploads(5);
      
      fileCountFetcher.load(`/dashboard/get-file-count?chat_type=${chatType}&receiver_id=${validReceiverId}`);
    }
  }, [receiverId, chatType, disabled, currentReceiverId]);

  // **ARREGLADO: Procesar respuesta del conteo solo una vez**
  useEffect(() => {
    if (fileCountFetcher.data && fileCountFetcher.state === 'idle' && hasLoadedCount && currentReceiverId) {
      console.log('📊 FileUpload: Processing file count response:', fileCountFetcher.data);
      const count = fileCountFetcher.data.count || 0;
      setRemainingUploads(5 - count);
    }
  }, [fileCountFetcher.data, fileCountFetcher.state, hasLoadedCount, currentReceiverId]);

  // **ARREGLADO: Procesar respuesta de subida UNA SOLA VEZ**
  useEffect(() => {
    if (uploadFetcher.data && uploadFetcher.state === 'idle' && !uploadProcessed) {
      console.log('📤 FileUpload: Processing upload response:', uploadFetcher.data);
      
      if (uploadFetcher.data.success) {
        setRemainingUploads(uploadFetcher.data.remaining_uploads || 0);
        
        // **ARREGLADO: Usar datos correctos para el callback**
        const fileData = {
          file_id: uploadFetcher.data.file_id,
          file_name: uploadFetcher.data.filename, // **USAR filename del response**
          file_type: uploadFetcher.data.file_type,
          file_size: uploadFetcher.data.file_size,
          download_url: uploadFetcher.data.download_url
        };
        
        console.log('📎 FileUpload: Calling onFileUploaded with:', fileData);
        onFileUploaded(fileData);

        setSelectedFile(null);
        setShowPreview(false);
        setIsUploading(false);
        setUploadProcessed(true);
        
        console.log('✅ FileUpload: Upload processed successfully');
      } else if (uploadFetcher.data.error) {
        alert(uploadFetcher.data.error);
        setIsUploading(false);
        setUploadProcessed(true);
      }
    }
    
    if (uploadFetcher.state === 'idle' && uploadFetcher.data === undefined && isUploading && !uploadProcessed) {
      console.error('❌ FileUpload: Upload failed - no response data');
      setIsUploading(false);
      setUploadProcessed(true);
      alert('Error al subir archivo - no se recibió respuesta del servidor');
    }
  }, [uploadFetcher.data, uploadFetcher.state, isUploading, uploadProcessed, onFileUploaded]);

  // **ARREGLADO: Controlar estado de loading y resetear processed flag**
  useEffect(() => {
    if (uploadFetcher.state === 'submitting') {
      console.log('⏳ FileUpload: Starting upload...');
      setIsUploading(true);
      setUploadProcessed(false);
    }
  }, [uploadFetcher.state]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 2MB.");
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/webm'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de archivo no permitido.");
      return;
    }

    setSelectedFile(file);
    setShowPreview(true);
  };

  const uploadFile = async () => {
    if (!selectedFile || !receiverId || !chatType) {
      console.error('❌ FileUpload: Missing required data for upload');
      alert('Error: Datos incompletos para subir archivo');
      return;
    }

    const validReceiverId = String(receiverId).trim();
    if (!validReceiverId || validReceiverId === 'null' || validReceiverId === 'undefined' || validReceiverId === '') {
      console.error('❌ FileUpload: Invalid receiverId:', receiverId);
      alert('Error: ID de receptor inválido');
      return;
    }

    if (isUploading) {
      console.warn('⚠️ FileUpload: Upload already in progress, ignoring new request');
      return;
    }

    console.log('📁 FileUpload: Starting file upload:', {
      fileName: selectedFile.name,
      chatType,
      receiverId: validReceiverId,
      fileSize: selectedFile.size
    });

    setUploadProcessed(false);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('chat_type', chatType);
    formData.append('receiver_id', validReceiverId);

    uploadFetcher.submit(formData, {
      method: 'post',
      action: '/dashboard/upload-chat-file',
      encType: 'multipart/form-data'
    });
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (file.type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading || remainingUploads <= 0}
        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
        title={remainingUploads <= 0 ? "Límite de archivos alcanzado (5 máximo)" : "Adjuntar archivo"}
      >
        <Paperclip className="h-5 w-5" />
      </button>

      {!disabled && remainingUploads <= 2 && remainingUploads > 0 && (
        <div className="absolute -top-8 left-0 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 whitespace-nowrap">
          {remainingUploads} restantes
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx,.mp3,.wav,.ogg,.m4a,.mp4,.avi,.mov,.webm"
      />

      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="bg-purple-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg">Adjuntar archivo</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedFile(null);
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {remainingUploads <= 2 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Límite de archivos</p>
                    <p>Solo puedes subir {remainingUploads} archivo{remainingUploads !== 1 ? 's' : ''} más en este chat (máximo 5 por conversación).</p>
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center mb-4">
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="max-w-full max-h-48 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      {getFileIcon(selectedFile)}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{selectedFile.name}</h4>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium text-gray-900 truncate ml-2">{selectedFile.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Tamaño:</span>
                  <span className="font-medium text-gray-900">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium text-gray-900">{selectedFile.type}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={uploadFile}
                  disabled={isUploading || remainingUploads <= 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : remainingUploads <= 0 ? (
                    "Límite alcanzado"
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar archivo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
