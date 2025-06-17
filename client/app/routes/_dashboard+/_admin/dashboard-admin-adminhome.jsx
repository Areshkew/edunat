import { useState } from "react";
import { Form, Link } from "@remix-run/react";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign,
  BarChart2,
  Plus,
  ArrowRight,
  Shield,
  Activity,
  Boxes,
  Calendar,
  Eye
} from "lucide-react";

// Componente simple para gráfico de barras
function SimpleBarChart({ data, title }) {
  if (!data || Object.keys(data).length === 0) return null;
  
  const maxValue = Math.max(...Object.values(data));
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{key}</span>
              <span className="text-sm font-bold text-gray-900">{value}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 relative">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente simple para gráfico circular
function SimplePieChart({ data, title, colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'] }) {
  if (!data || Object.keys(data).length === 0) return null;
  
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 42 42" className="w-32 h-32">
            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#E5E7EB" strokeWidth="3"/>
            {Object.entries(data).map(([key, value], index) => {
              const percentage = (value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              const color = colors[index % colors.length];
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={key}
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 21 21)"
                />
              );
            })}
          </svg>
        </div>
        <div className="ml-4 space-y-2">
          {Object.entries(data).map(([key, value], index) => (
            <div key={key} className="flex items-center text-sm">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-gray-600">{key}: {value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente para gráfico de barras verticales
function VerticalBarChart({ data, title, color = '#3B82F6' }) {
  if (!data || Object.keys(data).length === 0) return null;
  
  const maxValue = Math.max(...Object.values(data));
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      <div className="flex items-end justify-between space-x-1 h-96">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 mb-2">{value}</div>
            <div className="relative w-full h-48 flex items-end">
              <div 
                className="w-full rounded-t-md transition-all duration-500"
                style={{ 
                  height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                  backgroundColor: color,
                  minHeight: value > 0 ? '4px' : '0px'
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-8 text-center leading-tight transform -rotate-45 origin-top w-20 h-16 flex items-start justify-center">
              <span className="whitespace-nowrap">{key}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente para gráfico de crecimiento mensual - Líneas
function MonthlyGrowthChart({ data, title }) {
  if (!data || data.length === 0) return null;
  
  const chartData = data.slice(-6);
  const maxValue = Math.max(...chartData.map(d => Math.max(d.users, d.transactions, d.courses, d.communities)));
  const chartHeight = 320;
  const padding = { top: 30, right: 40, bottom: 90, left: 70 };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-800 mb-6">{title}</h3>
      <div className="w-full overflow-x-auto">
        <svg 
          width="100%" 
          height={chartHeight} 
          viewBox={`0 0 600 ${chartHeight}`}
          className="min-w-[600px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background */}
          <rect width="600" height={chartHeight} fill="white" />
          
          {/* Grid lines horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - padding.bottom - (ratio * (chartHeight - padding.top - padding.bottom));
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={600 - padding.right}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text
                  x={padding.left - 15}
                  y={y + 4}
                  textAnchor="end"
                  fill="#374151"
                  fontSize="12"
                  fontFamily="system-ui, sans-serif"
                >
                  {Math.round(maxValue * ratio)}
                </text>
              </g>
            );
          })}
          
          {/* Calculate points for lines */}
          {(() => {
            const getPoints = (values) => {
              return values.map((value, index) => {
                const x = padding.left + (index * (600 - padding.left - padding.right)) / (values.length - 1);
                const y = chartHeight - padding.bottom - ((value / maxValue) * (chartHeight - padding.top - padding.bottom));
                return { x, y, value };
              });
            };
            
            const userPoints = getPoints(chartData.map(d => d.users));
            const transactionPoints = getPoints(chartData.map(d => d.transactions));
            const coursePoints = getPoints(chartData.map(d => d.courses));
            const communityPoints = getPoints(chartData.map(d => d.communities));
            
            return (
              <>
                {/* Lines with improved styling */}
                <polyline
                  points={userPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))"
                />
                <polyline
                  points={transactionPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))"
                />
                <polyline
                  points={coursePoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))"
                />
                <polyline
                  points={communityPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))"
                />
                
                {/* Grid lines verticales y puntos de datos */}
                {chartData.map((monthData, index) => {
                  const x = padding.left + (index * (600 - padding.left - padding.right)) / (chartData.length - 1);
                  const userY = chartHeight - padding.bottom - ((monthData.users / maxValue) * (chartHeight - padding.top - padding.bottom));
                  const transactionY = chartHeight - padding.bottom - ((monthData.transactions / maxValue) * (chartHeight - padding.top - padding.bottom));
                  const courseY = chartHeight - padding.bottom - ((monthData.courses / maxValue) * (chartHeight - padding.top - padding.bottom));
                  const communityY = chartHeight - padding.bottom - ((monthData.communities / maxValue) * (chartHeight - padding.top - padding.bottom));
                  
                  return (
                    <g key={index}>
                      {/* Líneas verticales de grid */}
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={chartHeight - padding.bottom}
                        stroke="#F3F4F6"
                        strokeWidth="1"
                        strokeDasharray="2,3"
                      />
                      
                      {/* Puntos de datos con mejor diseño */}
                      <circle cx={x} cy={userY} r="5" fill="#3B82F6" stroke="white" strokeWidth="2" />
                      <circle cx={x} cy={transactionY} r="5" fill="#10B981" stroke="white" strokeWidth="2" />
                      <circle cx={x} cy={courseY} r="5" fill="#F59E0B" stroke="white" strokeWidth="2" />
                      <circle cx={x} cy={communityY} r="5" fill="#8B5CF6" stroke="white" strokeWidth="2" />
                      
                      {/* Etiquetas de mes mejoradas */}
                      <text
                        x={x}
                        y={chartHeight - padding.bottom + 30}
                        textAnchor="start"
                        fill="#374151"
                        fontSize="10"
                        fontFamily="system-ui, sans-serif"
                        transform={`rotate(-30 ${x} ${chartHeight - padding.bottom + 30})`}
                      >
                        {monthData.monthName}
                      </text>
                      
                      {/* Tooltips con valores */}
                      <g className="opacity-0 hover:opacity-100 transition-opacity">
                        <rect 
                          x={x - 25} 
                          y={Math.min(userY, transactionY, courseY, communityY) - 45} 
                          width="50" 
                          height="35" 
                          fill="rgba(0,0,0,0.8)" 
                          rx="4"
                        />
                        <text 
                          x={x} 
                          y={Math.min(userY, transactionY, courseY, communityY) - 25} 
                          textAnchor="middle" 
                          fill="white" 
                          fontSize="10"
                        >
                          {monthData.monthName}
                        </text>
                      </g>
                    </g>
                  );
                })}
                
                {/* Etiqueta del eje Y */}
                <text
                  x={20}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="12"
                  fontFamily="system-ui, sans-serif"
                  transform={`rotate(-90 20 ${chartHeight / 2})`}
                >
                  Cantidad Total
                </text>
              </>
            );
          })()}
        </svg>
      </div>
      
      {/* Legend mejorada - Más compacta */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
        <div className="flex items-center px-2 py-1 bg-blue-50 rounded border border-blue-200">
          <div className="w-3 h-0.5 bg-blue-500 mr-1.5 rounded-full"></div>
          <span className="text-gray-700">Usuarios</span>
        </div>
        <div className="flex items-center px-2 py-1 bg-green-50 rounded border border-green-200">
          <div className="w-3 h-0.5 bg-green-500 mr-1.5 rounded-full"></div>
          <span className="text-gray-700">Transacciones</span>
        </div>
        <div className="flex items-center px-2 py-1 bg-yellow-50 rounded border border-yellow-200">
          <div className="w-3 h-0.5 bg-yellow-500 mr-1.5 rounded-full"></div>
          <span className="text-gray-700">Cursos</span>
        </div>
        <div className="flex items-center px-2 py-1 bg-purple-50 rounded border border-purple-200">
          <div className="w-3 h-0.5 bg-purple-500 mr-1.5 rounded-full"></div>
          <span className="text-gray-700">Comunidades</span>
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Muestra el total acumulado de cada categoría por mes
      </div>
    </div>
  );
}

export default function AdminHome({ user, userRole, stats, adminStats, monthlyGrowth, error }) {
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar el dashboard</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-indigo-600" />
                  Panel de Administración
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {user ? `Bienvenido ${user.username || user.email}, aquí tienes un resumen del sistema.` : 'Resumen general del sistema.'}
                </p>
              </div>
              <div className="bg-gray-100 rounded-lg px-6 py-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-800">
                    {new Date().toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }).replace(/^\w/, c => c.toUpperCase())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Users Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Usuarios
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Communities Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Boxes className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Comunidades
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCommunities}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Cursos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCourses}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Transacciones
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalTransactions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Points Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Puntos Total
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalRevenue.toLocaleString()} pts
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Acciones Administrativas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/dashboard/users"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-6 w-6 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Gestionar Usuarios</span>
                </Link>
                
                <Link
                  to="/dashboard/communities"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Boxes className="h-6 w-6 text-indigo-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Gestionar Comunidades</span>
                </Link>
                
                <Link
                  to="/dashboard/transactions"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <DollarSign className="h-6 w-6 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Ver Transacciones</span>
                </Link>
                
                <Link
                  to="/dashboard/courses"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-6 w-6 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Ver Cursos</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Monthly Growth - Larger */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Crecimiento del Sistema
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.newUsersThisMonth}</div>
                  <div className="text-sm text-blue-600">Nuevos usuarios este mes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.monthlyTransactions}</div>
                  <div className="text-sm text-green-600">Transacciones del mes</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.monthlyMessages}</div>
                  <div className="text-sm text-purple-600">Mensajes del mes</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.monthlyCourses}</div>
                  <div className="text-sm text-yellow-600">Cursos del mes</div>
                </div>
              </div>
            </div>
          </div>

          {/* System Health - Smaller */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                Estado del Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado del servidor</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base de datos</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Conectada
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de usuarios</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalUsers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Users */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Usuarios Recientes
              </h3>
            </div>
            <div className="p-4">
              {stats.recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentUsers.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-blue-600">Registrado: {new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios recientes</h3>
                  <p className="mt-1 text-sm text-gray-500">Los nuevos usuarios aparecerán aquí.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Communities */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Boxes className="h-5 w-5 mr-2" />
                Comunidades Recientes
              </h3>
            </div>
            <div className="p-4">
              {stats.recentCommunities.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentCommunities.slice(0, 5).map((community, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-indigo-50 to-white rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{community.name}</p>
                          <div className="flex items-center mt-1 space-x-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                              {community.members} miembros
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              community.visibility === 'Visible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {community.visibility}
                            </span>
                          </div>
                          {community.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{community.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Boxes className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay comunidades recientes</h3>
                  <p className="mt-1 text-sm text-gray-500">Las nuevas comunidades aparecerán aquí.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3">
              <h3 className="text-lg font-medium text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Transacciones Recientes
              </h3>
            </div>
            <div className="p-4">
              {stats.recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-yellow-50 to-white rounded-lg border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{transaction.type}</p>
                          <p className="text-xs text-gray-500">Fecha: {new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            {transaction.amount} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay transacciones recientes</h3>
                  <p className="mt-1 text-sm text-gray-500">Las transacciones aparecerán aquí.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {adminStats && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gráficos Estadísticos</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Usuarios por Rol */}
              <SimplePieChart 
                data={{
                  'Usuarios': adminStats.distributions.usersByRole[0] || 0,
                  'Admins': adminStats.distributions.usersByRole[1] || 0
                }}
                title="Distribución de Usuarios por Rol"
                colors={['#3B82F6', '#EF4444']}
              />

              {/* Cursos por Estado */}
              <SimplePieChart 
                data={{
                  'Próximos': adminStats.distributions.coursesByStatus[0] || 0,
                  'En progreso': adminStats.distributions.coursesByStatus[1] || 0,
                  'Completados': adminStats.distributions.coursesByStatus[2] || 0
                }}
                title="Estado de Cursos"
                colors={['#F59E0B', '#10B981', '#8B5CF6']}
              />

              {/* Comunidades por Visibilidad */}
              <SimplePieChart 
                data={{
                  'Ocultas': adminStats.distributions.communitiesByVisibility[0] || 0,
                  'Visibles': adminStats.distributions.communitiesByVisibility[1] || 0
                }}
                title="Visibilidad de Comunidades"
                colors={['#EF4444', '#10B981']}
              />

              {/* Notificaciones por Tipo */}
              <SimplePieChart 
                data={{
                  'Info': adminStats.distributions.notificationsByType[0] || 0,
                  'Advertencia': adminStats.distributions.notificationsByType[1] || 0,
                  'Alerta': adminStats.distributions.notificationsByType[2] || 0
                }}
                title="Notificaciones por Tipo"
                colors={['#3B82F6', '#F59E0B', '#EF4444']}
              />
            </div>

            {/* Academic Level Chart - Wider with better labels */}
            <div className="mb-8">
              <VerticalBarChart 
                data={{
                  'No especificado': adminStats.distributions.usersByAcademic[0] || 0,
                  'Preescolar': adminStats.distributions.usersByAcademic[1] || 0,
                  'Primaria': adminStats.distributions.usersByAcademic[2] || 0,
                  'Secundaria': adminStats.distributions.usersByAcademic[3] || 0,
                  'Media/Bach.': adminStats.distributions.usersByAcademic[4] || 0,
                  'Técnico': adminStats.distributions.usersByAcademic[5] || 0,
                  'Tecnológico': adminStats.distributions.usersByAcademic[6] || 0,
                  'Universitario': adminStats.distributions.usersByAcademic[7] || 0,
                  'Especialización': adminStats.distributions.usersByAcademic[8] || 0,
                  'Maestría': adminStats.distributions.usersByAcademic[9] || 0,
                  'Doctorado': adminStats.distributions.usersByAcademic[10] || 0
                }}
                title="Usuarios por Nivel Académico"
                color="#10B981"
              />
            </div>

            {/* Top Users and Growth Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Top Usuarios por Puntos</h3>
                <div className="space-y-2">
                  {adminStats.rankings?.topUsersByPoints?.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">{user.username}</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-600">{user.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {monthlyGrowth && (
                <MonthlyGrowthChart 
                  data={monthlyGrowth}
                  title="Crecimiento Histórico (Últimos 6 Meses)"
                />
              )}
            </div>

            {/* Métricas del Sistema */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Métricas del Sistema</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{adminStats.totals.messages}</div>
                  <div className="text-sm text-blue-600">Mensajes Directos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{adminStats.totals.notifications}</div>
                  <div className="text-sm text-green-600">Notificaciones</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{adminStats.totals.points}</div>
                  <div className="text-sm text-yellow-600">Puntos Totales</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{adminStats.totals.communityMessages}</div>
                  <div className="text-sm text-purple-600">Mensajes en Comunidades</div>
                </div>
              </div>
            </div>

            {/* Rankings */}
            {adminStats.rankings && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Top Message Senders */}
                {adminStats.rankings.topMessageSenders?.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Usuarios más Activos (Mensajes)</h3>
                    <div className="space-y-3">
                      {adminStats.rankings.topMessageSenders.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <span className="text-sm font-medium text-gray-900">{user.username}</span>
                          <span className="text-sm text-gray-600">{user.messages} mensajes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumen General */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Resumen General</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Promedio puntos/usuario:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {adminStats.averages?.pointsPerUser || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mensajes por usuario:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {adminStats.averages?.messagesPerUser || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cursos por instructor:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {adminStats.averages?.coursesPerInstructor || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Usuarios por comunidad:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {adminStats.averages?.usersPerCommunity || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
