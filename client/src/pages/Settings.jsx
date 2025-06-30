import React, { useState, useEffect } from 'react'
import { 
  Save, 
  RefreshCw, 
  Bell,
  Clock,
  Database,
  Shield
} from 'lucide-react'

function Settings() {
  const [settings, setSettings] = useState({
    // 监控设置
    monitoringInterval: 5, // 分钟
    enableNotifications: true,
    notificationSound: true,
    
    // 界面设置
    autoRefresh: true,
    refreshInterval: 30, // 秒
    theme: 'light',
    language: 'zh-CN',
    
    // 安全设置
    sessionTimeout: 60, // 分钟
    enableLogging: true,
    logLevel: 'info',
    
    // 性能设置
    maxConcurrentConnections: 10,
    connectionTimeout: 10, // 秒
    retryAttempts: 3
  })
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // 这里应该调用API保存设置
      // await axios.post('/api/settings', settings)
      
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('保存设置失败:', error)
      alert('保存设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      setSettings({
        monitoringInterval: 5,
        enableNotifications: true,
        notificationSound: true,
        autoRefresh: true,
        refreshInterval: 30,
        theme: 'light',
        language: 'zh-CN',
        sessionTimeout: 60,
        enableLogging: true,
        logLevel: 'info',
        maxConcurrentConnections: 10,
        connectionTimeout: 10,
        retryAttempts: 3
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="btn btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重置默认
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? '保存中...' : saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 监控设置 */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">监控设置</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                监控检查间隔
              </label>
              <select
                value={settings.monitoringInterval}
                onChange={(e) => setSettings({ ...settings, monitoringInterval: parseInt(e.target.value) })}
                className="input"
              >
                <option value={1}>1分钟</option>
                <option value={5}>5分钟</option>
                <option value={10}>10分钟</option>
                <option value={15}>15分钟</option>
                <option value={30}>30分钟</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableNotifications"
                checked={settings.enableNotifications}
                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enableNotifications" className="ml-2 block text-sm text-gray-900">
                启用状态变化通知
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificationSound"
                checked={settings.notificationSound}
                onChange={(e) => setSettings({ ...settings, notificationSound: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="notificationSound" className="ml-2 block text-sm text-gray-900">
                启用通知声音
              </label>
            </div>
          </div>
        </div>

        {/* 界面设置 */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <RefreshCw className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">界面设置</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="ml-2 block text-sm text-gray-900">
                启用自动刷新
              </label>
            </div>
            
            {settings.autoRefresh && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自动刷新间隔
                </label>
                <select
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={10}>10秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>1分钟</option>
                  <option value={300}>5分钟</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                主题
              </label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                className="input"
              >
                <option value="light">浅色主题</option>
                <option value="dark">深色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                语言
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="input"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* 安全设置 */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">安全设置</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会话超时时间
              </label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                className="input"
              >
                <option value={30}>30分钟</option>
                <option value={60}>1小时</option>
                <option value={120}>2小时</option>
                <option value={480}>8小时</option>
                <option value={0}>永不超时</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableLogging"
                checked={settings.enableLogging}
                onChange={(e) => setSettings({ ...settings, enableLogging: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enableLogging" className="ml-2 block text-sm text-gray-900">
                启用操作日志记录
              </label>
            </div>
            
            {settings.enableLogging && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日志级别
                </label>
                <select
                  value={settings.logLevel}
                  onChange={(e) => setSettings({ ...settings, logLevel: e.target.value })}
                  className="input"
                >
                  <option value="error">错误</option>
                  <option value="warn">警告</option>
                  <option value="info">信息</option>
                  <option value="debug">调试</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 性能设置 */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">性能设置</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大并发连接数
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxConcurrentConnections}
                onChange={(e) => setSettings({ ...settings, maxConcurrentConnections: parseInt(e.target.value) })}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                连接超时时间 (秒)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.connectionTimeout}
                onChange={(e) => setSettings({ ...settings, connectionTimeout: parseInt(e.target.value) })}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                重试次数
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={settings.retryAttempts}
                onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) })}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">系统信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">版本:</span>
            <span className="ml-2 text-gray-600">v1.0.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">构建时间:</span>
            <span className="ml-2 text-gray-600">{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">运行时间:</span>
            <span className="ml-2 text-gray-600">刚刚启动</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
