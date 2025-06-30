import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  Server, 
  Download, 
  Settings, 
  Activity,
  Menu,
  X
} from 'lucide-react'

// 导入页面组件
import Dashboard from './pages/Dashboard'
import VPSManagement from './pages/VPSManagement'
import TorrentManagement from './pages/TorrentManagement'
import SettingsPage from './pages/Settings'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: '仪表板', href: '/', icon: Activity, description: '系统概览和统计' },
    { name: 'VPS管理', href: '/vps', icon: Server, description: '管理VPS服务器' },
    { name: '种子管理', href: '/torrents', icon: Download, description: '管理种子文件' },
    { name: '设置', href: '/settings', icon: Settings, description: '系统设置' },
  ]

  const currentPage = navigation.find(item => item.href === location.pathname)

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* 移动端侧边栏背景 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"></div>
        </div>
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo区域 */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-500">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white bg-opacity-20 backdrop-blur-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-white">qBittorrent</h1>
              <p className="text-sm text-blue-100">管理中心</p>
            </div>
          </div>
          <button
            className="lg:hidden text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-4 h-5 w-5 ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* 底部信息 */}
        <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">版本 1.0.0</p>
            <p className="text-xs text-gray-400 mt-1">© 2025 qBittorrent Manager</p>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* 移动端顶部栏 */}
        <div className="sticky top-0 z-30 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentPage?.name || 'qBittorrent 管理器'}
            </h1>
            <div className="w-10" /> {/* 占位符保持居中 */}
          </div>
        </div>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {/* 桌面端页面标题 */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6 hidden lg:block">
              <div className="flex items-center">
                {currentPage?.icon && (
                  <currentPage.icon className="h-8 w-8 text-blue-600 mr-3" />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{currentPage?.name}</h1>
                  <p className="text-gray-600 mt-1">{currentPage?.description}</p>
                </div>
              </div>
            </div>

            {/* 路由内容 */}
            <div className="px-4 sm:px-6 lg:px-8 py-8 fade-in">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vps" element={<VPSManagement />} />
                <Route path="/torrents" element={<TorrentManagement />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
