import { useState } from "react";
import { 
  Home, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Coins, 
  ChevronDown, 
  ChevronRight,
  Search,
  Eye,
  Send,
  Clock,
  CheckCircle,
  UserPlus,
  Star,
  HelpCircle,
  ArrowRight
} from "lucide-react";

export default function UserHelp() {
  const [openSections, setOpenSections] = useState({
    dashboard: true,
    courses: false,
    communities: false,
    transactions: false,
    points: false
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
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Ayuda</h1>
          <p className="text-lg text-gray-600">
            Aprende a usar todas las funciones de tu panel de usuario
          </p>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <h2 className="text-xl font-semibold mb-2">¡Bienvenido a Edunat!</h2>
          <p className="text-indigo-100">
            Tu panel de usuario te permite acceder a cursos, conectar con comunidades, 
            gestionar tus puntos y mucho más. Explora cada sección para aprovechar al máximo la plataforma.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Dashboard Section */}
          <SectionCard
            icon={Home}
            title="Dashboard - Tu Página de Inicio"
            description="Tu punto de partida en Edunat"
            isOpen={openSections.dashboard}
            onToggle={() => toggleSection('dashboard')}
          >
            <div className="mt-4 space-y-4">
              <p className="text-gray-700">
                El Dashboard es tu página principal donde recibes una cálida bienvenida cada vez que inicias sesión. 
                Aquí encontrarás:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureItem
                  icon={Star}
                  title="Cursos Recomendados"
                  description="Descubre cursos populares y nuevos que podrían interesarte"
                />
                <FeatureItem
                  icon={ArrowRight}
                  title="Accesos Rápidos"
                  description="Enlaces directos a todas las secciones principales"
                />
              </div>
            </div>
          </SectionCard>

          {/* Courses Section */}
          <SectionCard
            icon={BookOpen}
            title="Cursos - Tu Aprendizaje"
            description="Gestiona y descubre nuevos cursos"
            isOpen={openSections.courses}
            onToggle={() => toggleSection('courses')}
          >
            <div className="mt-4 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-indigo-600" />
                  Mis Cursos
                </h4>
                <p className="text-gray-700 mb-3">
                  Aquí puedes ver todos los cursos en los que estás inscrito. Esta sección te permite:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  <FeatureItem
                    icon={ArrowRight}
                    title="Continuar Progreso"
                    description="Accede directamente al aula virtual de cada curso"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-indigo-600" />
                  Buscar Cursos
                </h4>
                <p className="text-gray-700 mb-3">
                  Explora nuestra biblioteca completa de cursos disponibles. Puedes:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FeatureItem
                    icon={Search}
                    title="Filtrar y Buscar"
                    description="Encuentra cursos por tema, instructor o estado"
                  />
                  <FeatureItem
                    icon={Coins}
                    title="Comprar con Puntos"
                    description="Usa tus puntos para inscribirte en cursos premium"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Communities Section */}
          <SectionCard
            icon={Users}
            title="Comunidades - Conecta y Aprende"
            description="Tu red de aprendizaje colaborativo"
            isOpen={openSections.communities}
            onToggle={() => toggleSection('communities')}
          >
            <div className="mt-4 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-indigo-600" />
                  Mis Comunidades
                </h4>
                <p className="text-gray-700 mb-3">
                  Ve todas las comunidades en las que participas. En cada comunidad puedes:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FeatureItem
                    icon={Eye}
                    title="Ver Detalles"
                    description="Información completa de la comunidad y sus miembros"
                  />
                  <FeatureItem
                    icon={MessageSquare}
                    title="Chat Comunitario"
                    description="Conecta y conversa con otros miembros"
                  />
                  <FeatureItem
                    icon={UserPlus}
                    title="Ver Perfiles"
                    description="Conoce a otros miembros y sus habilidades"
                  />
                  <FeatureItem
                    icon={Send}
                    title="Transferir Puntos"
                    description="Envía puntos a otros miembros"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-indigo-600" />
                  Buscar Comunidades
                </h4>
                <p className="text-gray-700 mb-3">
                  Descubre nuevas comunidades para unirte. <strong className="text-indigo-600">¡Importante! </strong> 
                  Unirse a comunidades es la única forma de ganar puntos en Edunat.
                </p>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-3">
                  <h5 className="font-medium text-indigo-900 mb-2">¿Cómo funciona?</h5>
                  <ol className="list-decimal list-inside text-sm text-indigo-800 space-y-1">
                    <li>Encuentra una comunidad que te interese</li>
                    <li>Envía una solicitud con puntos y una descripción</li>
                    <li>Espera la respuesta de un administrador</li>
                    <li>¡Si es aprobada, ganas puntos!</li>
                  </ol>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Transactions Section */}
          <SectionCard
            icon={Coins}
            title="Mis Transacciones - Gestiona tus Puntos"
            description="Control total de tu economía en Edunat"
            isOpen={openSections.transactions}
            onToggle={() => toggleSection('transactions')}
          >
            <div className="mt-4 space-y-4">
              <p className="text-gray-700">
                En esta sección puedes gestionar completamente tus puntos y transacciones. También aquí puedes ver tu balance de puntos actual:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureItem
                  icon={Coins}
                  title="Balance de Puntos"
                  description="Ve cuántos puntos tienes disponibles para usar"
                />
                <FeatureItem
                  icon={Eye}
                  title="Historial Completo"
                  description="Ve todas tus transacciones pasadas y actuales"
                />
                <FeatureItem
                  icon={Clock}
                  title="Solicitudes Pendientes"
                  description="Revisa transacciones que esperan tu aprobación"
                />
                <FeatureItem
                  icon={Send}
                  title="Enviar Puntos"
                  description="Transfiere puntos a otros usuarios de la plataforma"
                />
                <FeatureItem
                  icon={CheckCircle}
                  title="Aceptar/Rechazar"
                  description="Decide sobre las solicitudes de puntos que recibes"
                />
              </div>
            </div>
          </SectionCard>

          {/* Points System */}
          <SectionCard
            icon={Coins}
            title="Sistema de Puntos - Tu Moneda en Edunat"
            description="Entiende cómo funcionan los puntos"
            isOpen={openSections.points}
            onToggle={() => toggleSection('points')}
          >
            <div className="mt-4 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">¿Qué son los puntos?</h4>
                <p className="text-yellow-700 text-sm">
                  Los puntos son la moneda virtual de Edunat. Los usas para inscribirte en cursos premium 
                  y los ganas únicamente uniéndote a comunidades.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">¿Cómo puedes usar los puntos?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FeatureItem
                    icon={BookOpen}
                    title="Comprar Cursos"
                    description="Inscríbete en cursos premium usando tus puntos"
                  />
                  <FeatureItem
                    icon={Send}
                    title="Transferir a Usuarios"
                    description="Ayuda a otros miembros enviándoles puntos"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">¿Cómo puedes ganar puntos?</h4>
                <div className="space-y-3">
                  <FeatureItem
                    icon={Users}
                    title="Unirte a Comunidades"
                    description="La forma principal: envía solicitudes a comunidades con puntos iniciales"
                  />
                  <FeatureItem
                    icon={Send}
                    title="Transferencias de Usuarios"
                    description="Recibe puntos cuando otros usuarios te los transfieren"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Nota importante:</strong> Los puntos se ganan únicamente uniéndose a comunidades 
                    o cuando otros usuarios te los transfieren. No hay otras formas de ganar puntos en la plataforma.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Simple closing message */}
        <div className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-center text-white">
          <h3 className="text-lg font-semibold mb-2">¡Explora y Aprende!</h3>
          <p className="text-indigo-100">
            Ahora que conoces todas las funciones de Edunat, ¡es hora de comenzar tu viaje de aprendizaje!
          </p>
        </div>
      </div>
    </div>
  );
}
