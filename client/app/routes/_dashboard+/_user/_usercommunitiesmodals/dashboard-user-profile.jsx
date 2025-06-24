import { useState, useEffect } from "react";
import { 
  X, User, Phone, Calendar, Globe, 
  MapPin, Languages, Users,
  GraduationCap, UserCheck, Loader2, Heart, Sparkles,
  BookOpen, Coffee, Lightbulb, Gift, Zap, Target
} from "lucide-react";

export default function UserProfileModal({ isOpen, onClose, profileData, loading = false }) {
  const [activeSection, setActiveSection] = useState('about');
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Nuevo miembro';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `Miembro desde hace ${diffDays} días`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Miembro desde hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `Miembro desde hace ${years} ${years === 1 ? 'año' : 'años'}`;
      }
    } catch (e) {
      return 'Nuevo miembro';
    }
  };

  const ProfileSection = ({ id, icon: Icon, title, isActive, onClick, activeColor, inactiveColor }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
        isActive ? activeColor : 'hover:bg-gray-100 text-gray-600'
      }`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : inactiveColor}`} />
      <span className="font-medium">{title}</span>
      {isActive && <Sparkles className="h-4 w-4 ml-auto animate-pulse flex-shrink-0 text-white" />}
    </button>
  );

  const InfoCard = ({ icon: Icon, title, content, iconColor, bgColor, actionText, onAction }) => {
    if (!content || content.trim() === '') return null;
    
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-start space-x-4">
          <div className={`p-3 ${iconColor} rounded-xl text-white group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-700 leading-relaxed break-words">{content}</p>
            {actionText && onAction && (
              <button
                onClick={onAction}
                className={`mt-3 inline-flex items-center px-4 py-2 ${iconColor} text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium`}
              >
                {actionText}
                <Globe className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden transform transition-all duration-300">
        {/* BALANCED SIZE HEADER - not too big, not too small */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-5 text-white">
          {/* Simplified header layout with balanced design */}
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-xl font-bold">Perfil de Usuario</h2>
            
            {/* Keep the reliable close button */}
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          
          {/* Medium-sized user profile content */}
          {loading ? (
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-xl animate-pulse flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="h-7 bg-white bg-opacity-20 rounded-lg w-44 mb-2 animate-pulse"></div>
                <div className="h-5 bg-white bg-opacity-20 rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          ) : profileData ? (
            <div className="flex items-center space-x-4">
              <div className="relative group">
                {profileData.photo && profileData.photo.trim() !== '' ? (
                  <img
                    src={profileData.photo}
                    alt={`Foto de ${profileData.username}`}
                    className="w-20 h-20 rounded-xl object-cover border-3 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-20 h-20 bg-white bg-opacity-20 rounded-xl flex items-center justify-center border-3 border-white shadow-lg ${profileData.photo && profileData.photo.trim() !== '' ? 'hidden' : 'flex'}`}
                >
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1 flex items-center">
                  <span className="truncate">{profileData.name || profileData.username}</span>
                  <Sparkles className="h-5 w-5 ml-2 text-yellow-300 animate-pulse flex-shrink-0" />
                </h2>
                <p className="text-blue-100 text-sm mb-2">@{profileData.username}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="flex items-center bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="whitespace-nowrap">{formatDate(profileData.member_since)}</span>
                  </div>
                  {profileData.academic_level && (
                    <div className="flex items-center bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      <GraduationCap className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="whitespace-nowrap">{profileData.academic_level}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-xl flex items-center justify-center border-3 border-white shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Cargando perfil...</h2>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs - Horizontal scroll */}
        <div className="px-8 py-4 bg-gray-50 border-b flex-shrink-0">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <ProfileSection 
              id="about" 
              icon={UserCheck} 
              title="Acerca de mí" 
              isActive={activeSection === 'about'}
              onClick={() => setActiveSection('about')}
              activeColor="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105"
              inactiveColor="text-purple-500"
            />
            <ProfileSection 
              id="skills" 
              icon={Lightbulb} 
              title="Lo que ofrezco" 
              isActive={activeSection === 'skills'}
              onClick={() => setActiveSection('skills')}
              activeColor="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg transform scale-105"
              inactiveColor="text-emerald-500"
            />
            <ProfileSection 
              id="needs" 
              icon={Target} 
              title="Lo que busco" 
              isActive={activeSection === 'needs'}
              onClick={() => setActiveSection('needs')}
              activeColor="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105"
              inactiveColor="text-orange-500"
            />
            <ProfileSection 
              id="contact" 
              icon={Phone} 
              title="Contacto" 
              isActive={activeSection === 'contact'}
              onClick={() => setActiveSection('contact')}
              activeColor="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
              inactiveColor="text-blue-500"
            />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
            </div>
          ) : !profileData ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto mb-6 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Cargando perfil</h3>
              <p className="text-gray-600">Obteniendo información del usuario...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* About Section */}
              {activeSection === 'about' && (
                <div className="space-y-6">
                  {profileData.about && (
                    <InfoCard 
                      icon={Heart}
                      title="Mi historia"
                      content={profileData.about}
                      iconColor="bg-purple-500"
                    />
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileData.birth_city && (
                      <InfoCard 
                        icon={MapPin}
                        title="Ciudad de origen"
                        content={profileData.birth_city}
                        iconColor="bg-green-500"
                      />
                    )}
                    
                    {profileData.residence_city && (
                      <InfoCard 
                        icon={Coffee}
                        title="Vive en"
                        content={profileData.residence_city}
                        iconColor="bg-amber-500"
                      />
                    )}
                    
                    {profileData.language && (
                      <InfoCard 
                        icon={Languages}
                        title="Idioma preferido"
                        content={profileData.language}
                        iconColor="bg-indigo-500"
                      />
                    )}
                    
                    {profileData.gender && (
                      <InfoCard 
                        icon={Users}
                        title="Género"
                        content={profileData.gender}
                        iconColor="bg-pink-500"
                      />
                    )}
                  </div>
                  
                  {/* Si no hay información */}
                  {!profileData.about && !profileData.birth_city && !profileData.residence_city && !profileData.language && !profileData.gender && (
                    <div className="text-center py-12">
                      <UserCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-lg">Este usuario no ha compartido información personal</p>
                      <p className="text-gray-400 text-sm mt-2">¡Tal vez puedas conocerlo mejor en los otros apartados!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Skills/Offers Section */}
              {activeSection === 'skills' && (
                <div className="space-y-6">
                  {profileData.offers ? (
                    <InfoCard 
                      icon={Gift}
                      title="¡Esto es lo que puedo enseñarte!"
                      content={profileData.offers}
                      iconColor="bg-emerald-500"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Gift className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-lg">Este usuario aún no ha compartido sus habilidades</p>
                      <p className="text-gray-400 text-sm mt-2">¡Tal vez puedas preguntarle directamente!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Needs Section */}
              {activeSection === 'needs' && (
                <div className="space-y-6">
                  {profileData.needs ? (
                    <InfoCard 
                      icon={Lightbulb}
                      title="¡Esto es lo que me gustaría aprender!"
                      content={profileData.needs}
                      iconColor="bg-orange-500"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-lg">Este usuario no ha especificado sus necesidades</p>
                      <p className="text-gray-400 text-sm mt-2">¡Conecta con él para descubrir intereses comunes!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Section */}
              {activeSection === 'contact' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileData.phone_number && (
                      <InfoCard 
                        icon={Phone}
                        title="Teléfono"
                        content={profileData.phone_number}
                        iconColor="bg-green-500"
                      />
                    )}
                    
                    {profileData.whatsapp && (
                      <InfoCard 
                        icon={Phone}
                        title="WhatsApp"
                        content={profileData.whatsapp}
                        iconColor="bg-emerald-500"
                        actionText="Abrir WhatsApp"
                        onAction={() => window.open(`https://wa.me/${profileData.whatsapp}`)}
                      />
                    )}
                    
                    {profileData.webpage && (
                      <InfoCard 
                        icon={Globe}
                        title="Sitio web"
                        content={profileData.webpage}
                        iconColor="bg-purple-500"
                        actionText="Visitar sitio"
                        onAction={() => window.open(profileData.webpage.startsWith('http') ? profileData.webpage : `https://${profileData.webpage}`)}
                      />
                    )}
                  </div>
                  
                  {/* Si no hay información de contacto */}
                  {!profileData.phone_number && !profileData.whatsapp && !profileData.webpage && (
                    <div className="text-center py-12">
                      <Phone className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-lg">Este usuario no ha compartido información de contacto</p>
                      <p className="text-gray-400 text-sm mt-2">¡Puedes conectar con él a través de la plataforma!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Simple Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
