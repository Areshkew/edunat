import { useState } from "react";
import { 
  BarChart2, 
  Users, 
  Boxes, 
  DollarSign, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  MessageSquare,
  Download,
  Plus,
  Settings,
  Shield,
  Activity,
  ExternalLink,
  FileSpreadsheet,
  Clock,
  Users2
} from "lucide-react";

export default function AdminHelp() {
  const [openSections, setOpenSections] = useState({
    dashboard: true,
    users: false,
    communities: false,
    transactions: false,
    courses: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionCard = ({ icon: Icon, title, description, isOpen, onToggle, children }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  const FeatureItem = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="p-1 bg-white rounded">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div>
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Ayuda - Administrador</h1>
          <p className="text-lg text-gray-600">
            Guía completa para administrar la plataforma Edunat
          </p>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <h2 className="text-xl font-semibold mb-2">¡Bienvenido, Administrador!</h2>
          <p className="text-indigo-100">
            Como administrador tienes control total sobre la plataforma Edunat. 
            Aquí encontrarás toda la información necesaria para gestionar usuarios, comunidades, cursos y más.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Dashboard Section */}
          <SectionCard
            icon={BarChart2}
            title="Dashboard - Centro de Control"
            description="Métricas, estadísticas y datos del sistema"
            isOpen={openSections.dashboard}
            onToggle={() => toggleSection('dashboard')}
          >
            <div className="mt-4 space-y-4">
              <p className="text-gray-700">
                El Dashboard te proporciona una vista completa del estado de la plataforma con métricas en tiempo real.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureItem
                  icon={Activity}
                  title="Métricas del Sistema"
                  description="Estadísticas generales de usuarios activos, comunidades y cursos"
                />
                <FeatureItem
                  icon={BarChart2}
                  title="Gráficos de Tendencias"
                  description="Visualización de crecimiento y actividad de la plataforma"
                />
                <FeatureItem
                  icon={Users}
                  title="Datos de Usuarios"
                  description="Información sobre registros, actividad y retención"
                />
                <FeatureItem
                  icon={DollarSign}
                  title="Estado de Transacciones"
                  description="Resumen de puntos en circulación y transacciones recientes"
                />
              </div>
            </div>
          </SectionCard>

          {/* Users Section */}
          <SectionCard
            icon={Users}
            title="Gestión de Usuarios"
            description="Administra todos los usuarios del sistema"
            isOpen={openSections.users}
            onToggle={() => toggleSection('users')}
          >
            <div className="mt-4 space-y-4">
              <p className="text-gray-700">
                Control completo sobre todos los usuarios de la plataforma con acceso a sus datos y permisos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureItem
                  icon={Eye}
                  title="Ver Datos de Usuarios"
                  description="Accede a perfiles completos y información detallada"
                />
                <FeatureItem
                  icon={Trash2}
                  title="Eliminar Usuarios"
                  description="Elimina cuentas de usuarios cuando sea necesario"
                />
                <FeatureItem
                  icon={Settings}
                  title="Gestionar Visibilidad"
                  description="Oculta o muestra usuarios en la plataforma"
                />
                <FeatureItem
                  icon={Shield}
                  title="Convertir en Administradores"
                  description="Otorga permisos de administrador a usuarios"
                />
                <FeatureItem
                  icon={Search}
                  title="Buscar y Filtrar"
                  description="Encuentra usuarios específicos rápidamente"
                />
                <FeatureItem
                  icon={Edit}
                  title="Editar Información"
                  description="Modifica datos de usuarios según sea necesario"
                />
              </div>
            </div>
          </SectionCard>

          {/* Communities Section */}
          <SectionCard
            icon={Boxes}
            title="Gestión de Comunidades"
            description="Administra comunidades, miembros y solicitudes"
            isOpen={openSections.communities}
            onToggle={() => toggleSection('communities')}
          >
            <div className="mt-4 space-y-4">
              <p className="text-gray-700">
                Control total sobre las comunidades: creación, gestión de miembros, chat y solicitudes.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureItem
                  icon={Plus}
                  title="Crear Comunidades"
                  description="Crea nuevas comunidades desde el panel administrativo"
                />
                <FeatureItem
                  icon={Search}
                  title="Buscar Comunidades"
                  description="Encuentra y filtra comunidades específicas"
                />
                <FeatureItem
                  icon={UserPlus}
                  title="Agregar Miembros"
                  description="Añade usuarios a comunidades directamente"
                />
                <FeatureItem
                  icon={UserMinus}
                  title="Eliminar Miembros"
                  description="Remueve miembros de comunidades cuando sea necesario"
                />
                <FeatureItem
                  icon={MessageSquare}
                  title="Administrar Chat"
                  description="Ve y modera los chats de las comunidades"
                />
                <FeatureItem
                  icon={Edit}
                  title="Editar Comunidades"
                  description="Modifica información y configuración de comunidades"
                />
                <FeatureItem
                  icon={Settings}
                  title="Gestionar Visibilidad"
                  description="Controla qué comunidades son visibles públicamente"
                />
                <FeatureItem
                  icon={Trash2}
                  title="Eliminar Comunidades"
                  description="Elimina comunidades completas cuando sea necesario"
                />
                <FeatureItem
                  icon={CheckCircle}
                  title="Ver Solicitudes"
                  description="Revisa y gestiona solicitudes para unirse a comunidades"
                />
              </div>
            </div>
          </SectionCard>

          {/* Transactions Section */}
          <SectionCard
            icon={DollarSign}
            title="Gestión de Transacciones"
            description="Administra logs de transacciones y exporta datos"
            isOpen={openSections.transactions}
            onToggle={() => toggleSection('transactions')}
          >
            <div className="mt-4 space-y-4">
              <p className="text-gray-700">
                Control completo sobre todas las transacciones del sistema con capacidad de exportación y filtrado.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureItem
                  icon={Activity}
                  title="Logs de Transacciones"
                  description="Ve todas las transacciones del sistema en tiempo real"
                />
                <FeatureItem
                  icon={Users2}
                  title="Transacciones Usuario-Usuario"
                  description="Monitorea transferencias de puntos entre usuarios"
                />
                <FeatureItem
                  icon={Boxes}
                  title="Puntos por Comunidades"
                  description="Ve puntos ganados al unirse a comunidades"
                />
                <FeatureItem
                  icon={FileSpreadsheet}
                  title="Exportar a Excel"
                  description="Descarga datos de transacciones en formato Excel"
                />
                <FeatureItem
                  icon={CheckCircle}
                  title="Estado: Completado"
                  description="Filtra transacciones completadas exitosamente"
                />
                <FeatureItem
                  icon={Clock}
                  title="Estado: Pendiente Comunidad"
                  description="Ve transacciones pendientes de aprobación de comunidad"
                />
                <FeatureItem
                  icon={Users}
                  title="Estado: Pendiente Usuario"
                  description="Monitorea transacciones pendientes de usuario"
                />
                <FeatureItem
                  icon={Search}
                  title="Filtrar por Estado"
                  description="Busca transacciones según su estado específico"
                />
              </div>
            </div>
          </SectionCard>

          {/* Courses Section */}
          <SectionCard
            icon={BookOpen}
            title="Gestión de Cursos"
            description="Administra cursos, estudiantes y aulas virtuales"
            isOpen={openSections.courses}
            onToggle={() => toggleSection('courses')}
          >
            <div className="mt-4 space-y-4">
              <p className="text-gray-700">
                Control completo sobre los cursos: creación, gestión de estudiantes y acceso a aulas de Google Classroom.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureItem
                  icon={Plus}
                  title="Crear Cursos"
                  description="Crea nuevos cursos desde el panel administrativo"
                />
                <FeatureItem
                  icon={Users}
                  title="Ver Estudiantes"
                  description="Accede a la lista completa de estudiantes inscritos"
                />
                <FeatureItem
                  icon={UserPlus}
                  title="Agregar Estudiantes"
                  description="Inscribe estudiantes a cursos directamente"
                />
                <FeatureItem
                  icon={UserMinus}
                  title="Eliminar Estudiantes"
                  description="Remueve estudiantes de cursos cuando sea necesario"
                />
                <FeatureItem
                  icon={Edit}
                  title="Editar Cursos"
                  description="Modifica información, contenido y configuración"
                />
                <FeatureItem
                  icon={ExternalLink}
                  title="Ir al Aula (Google Classroom)"
                  description="Accede directamente al aula virtual de Google"
                />
                <FeatureItem
                  icon={Settings}
                  title="Configurar Curso"
                  description="Ajusta permisos, precios y disponibilidad"
                />
                <FeatureItem
                  icon={Activity}
                  title="Monitorear Progreso"
                  description="Ve el progreso y actividad de los estudiantes"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Closing message */}
        <div className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-center text-white">
          <h3 className="text-lg font-semibold mb-2">¡Mantén Edunat Funcionando!</h3>
          <p className="text-indigo-100">
            Tu papel como administrador es crucial para el éxito de la plataforma. 
            ¡Gracias por mantener Edunat como un lugar seguro y productivo para aprender!
          </p>
        </div>
      </div>
    </div>
  );
}
