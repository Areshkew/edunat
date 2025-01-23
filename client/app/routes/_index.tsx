import React, { useState, useEffect } from 'react';
import { Link } from "@remix-run/react";

export default function Index() {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState({ students: 0, courses: 0, satisfaction: 0 });

  // Animación de contador para las estadísticas
  useEffect(() => {
    setIsVisible(true);
    const duration = 2000; // 2 segundos para la animación
    const steps = 50;
    const targetValues = { students: 10000, courses: 200, satisfaction: 95 };
    
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        setCount({
          students: Math.floor((targetValues.students / steps) * i),
          courses: Math.floor((targetValues.courses / steps) * i),
          satisfaction: Math.floor((targetValues.satisfaction / steps) * i)
        });
      }, (duration / steps) * i);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="flex items-center">
                <span className="text-3xl">📚</span>
                <span className="ml-2 text-2xl font-bold text-indigo-600">Edunat</span>
              </span>
              <div className="hidden md:flex items-center ml-12 space-x-8">
                <Link to="/cursos" className="text-gray-700 hover:text-indigo-600 font-medium">
                  Cursos
                </Link>
                <Link to="/profesores" className="text-gray-700 hover:text-indigo-600 font-medium">
                  Profesores
                </Link>
                <Link to="/comunidad" className="text-gray-700 hover:text-indigo-600 font-medium">
                  Comunidad
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-indigo-600 font-medium">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-150">
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section con altura fija */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 h-[500px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl 
              animate-fade-in-down">
              Aprende. Crece. Destaca.
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-indigo-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl
              animate-fade-in-up">
              Descubre una nueva forma de aprender con cursos diseñados para impulsar tu carrera profesional.
            </p>
            <div className="mt-10 flex justify-center animate-bounce-slow">
              <Link to="/cursos" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium 
                hover:bg-gray-50 hover:scale-105 transition duration-300 transform">
                Explorar cursos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Ahora visible debajo del hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-3 transition-all duration-1000 
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">👥</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">+{count.students.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Estudiantes activos</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">📚</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">+{count.courses}</h3>
                  <p className="text-sm text-gray-500">Cursos disponibles</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">⭐</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{count.satisfaction}%</h3>
                  <p className="text-sm text-gray-500">Tasa de satisfacción</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Cursos destacados</h2>
          <p className="mt-4 text-lg text-gray-600">
            Explora nuestros cursos más populares y comienza tu viaje de aprendizaje
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Desarrollo Web Fullstack",
              description: "Aprende a crear aplicaciones web modernas desde cero",
              price: "$99.99",
              image: "🌐"
            },
            {
              title: "Diseño UX/UI",
              description: "Domina las mejores prácticas de diseño de interfaces",
              price: "$89.99",
              image: "🎨"
            },
            {
              title: "Marketing Digital",
              description: "Estrategias efectivas para el mundo digital",
              price: "$79.99",
              image: "📱"
            }
          ].map((course, index) => (
            <div key={index} 
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="h-48 w-full bg-indigo-100 flex items-center justify-center">
                <span className="text-6xl">{course.image}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                <p className="mt-2 text-gray-600">
                  {course.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-indigo-600 font-medium">{course.price}</span>
                  <Link to="/cursos" className="text-indigo-600 hover:text-indigo-700 font-medium 
                    hover:translate-x-2 transition-transform duration-300">
                    Ver más →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700 transform skew-y-3">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 transform -skew-y-3">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">
              ¿Listo para comenzar tu viaje de aprendizaje?
            </h2>
            <div className="mt-8 flex justify-center">
              <Link to="/registro" 
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium 
                hover:bg-gray-50 hover:scale-110 transition duration-300 transform">
                Comienza gratis
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Plataforma</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/cursos" className="text-base text-gray-300 hover:text-white">
                    Cursos
                  </Link>
                </li>
                <li>
                  <Link to="/profesores" className="text-base text-gray-300 hover:text-white">
                    Profesores
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Soporte</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/ayuda" className="text-base text-gray-300 hover:text-white">
                    Centro de ayuda
                  </Link>
                </li>
                <li>
                  <Link to="/contacto" className="text-base text-gray-300 hover:text-white">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/privacidad" className="text-base text-gray-300 hover:text-white">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terminos" className="text-base text-gray-300 hover:text-white">
                    Términos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Redes sociales</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-base text-gray-400">
              &copy; 2025 Edunat. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 1s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
}