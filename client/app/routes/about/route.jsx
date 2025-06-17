import { Link } from "@remix-run/react";
import { BookOpen, Users, MessageSquare, Star, ArrowLeft, ChevronRight } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Edunat
                </span>
              </div>
            </div>
            
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent">
              Acerca de Edunat
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Conectando mentes, creando futuro
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* What is Edunat */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Qué es Edunat?</h2>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            Edunat es una plataforma educativa innovadora que revoluciona la forma en que las personas aprenden y enseñan. 
            Nuestro objetivo es crear un ecosistema de aprendizaje colaborativo donde estudiantes, educadores y expertos 
            pueden conectarse, compartir conocimientos y crecer juntos.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            A través de una combinación única de cursos estructurados y comunidades de aprendizaje, 
            Edunat facilita el intercambio de conocimientos de manera orgánica y significativa, 
            adaptándose a las necesidades específicas de cada usuario.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Cursos Especializados</h3>
            <p className="text-gray-600">
              Accede a una amplia gama de cursos diseñados por expertos en diferentes áreas del conocimiento. 
              Desde programación hasta diseño, cada curso está estructurado para maximizar tu aprendizaje.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Comunidades de Aprendizaje</h3>
            <p className="text-gray-600">
              Únete a comunidades temáticas donde puedes hacer preguntas, compartir conocimientos y colaborar 
              con otros estudiantes que comparten tus intereses y objetivos de aprendizaje.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Red de Expertos</h3>
            <p className="text-gray-600">
              Conecta directamente con profesionales y expertos de la industria que pueden guiarte, 
              mentorearte y ayudarte a desarrollar las habilidades que necesitas para tu carrera.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-6">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sistema de Recompensas</h3>
            <p className="text-gray-600">
              Unete a las comunidades para ganar puntos. Utiliza estos puntos para acceder 
              a cursos premium y recursos exclusivos que acelerarán tu desarrollo profesional.
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Nuestra Misión</h3>
              <p className="text-purple-100 leading-relaxed">
                Democratizar el acceso a la educación de calidad, creando un espacio donde cualquier persona 
                puede aprender, enseñar y crecer, independientemente de su ubicación geográfica o situación económica.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Nuestra Visión</h3>
              <p className="text-purple-100 leading-relaxed">
                Ser la plataforma educativa líder que transforme la manera en que el mundo aprende, 
                fomentando una comunidad global de conocimiento colaborativo y crecimiento continuo.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Edunat */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">¿Por qué elegir Edunat?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Aprendizaje Personalizado</h4>
              <p className="text-gray-600">
                Adapta tu experiencia de aprendizaje según tus necesidades, ritmo y objetivos específicos.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Comunidad Activa</h4>
              <p className="text-gray-600">
                Forma parte de una comunidad vibrante de estudiantes y profesionales comprometidos con el crecimiento.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Contenido de Calidad</h4>
              <p className="text-gray-600">
                Accede a contenido curado y creado por expertos reconocidos en sus respectivos campos.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Listo para comenzar tu viaje de aprendizaje?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a Edunat hoy y descubre un mundo de posibilidades educativas
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Comenzar ahora
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
