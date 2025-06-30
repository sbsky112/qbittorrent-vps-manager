import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import axios from 'axios'
import VPSInfoCard from '../components/VPSInfoCard'

function VPSManagement() {
  const [vpsList, setVpsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVPS, setEditingVPS] = useState(null)
  const [testingVPS, setTestingVPS] = useState(null)
  const [vpsInfos, setVpsInfos] = useState({})
  const [vpsTorrentCounts, setVpsTorrentCounts] = useState({})

  useEffect(() => {
    fetchVPSList()
  }, [])

  const fetchVPSList = async () => {
    try {
      const response = await axios.get('/api/vps')
      setVpsList(response.data)
      // 获取VPS详细信息和种子数量
      fetchVPSInfos(response.data)
      fetchTorrentCounts(response.data)
    } catch (error) {
      console.error('获取VPS列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVPSInfos = async (vpsList) => {
    const infoPromises = vpsList.filter(vps => vps.enabled).map(async (vps) => {
      try {
        const response = await axios.get(`/api/torrents/${vps.id}/info`, { timeout: 10000 })
        return {
          vpsId: vps.id,
          info: response.data
        }
      } catch (error) {
        console.error(`获取VPS ${vps.name} 详细信息失败:`, error)
        return {
          vpsId: vps.id,
          info: null
        }
      }
    })

    const results = await Promise.all(infoPromises)
    const newVpsInfos = {}
    results.forEach(result => {
      if (result) {
        newVpsInfos[result.vpsId] = result.info
      }
    })
    setVpsInfos(newVpsInfos)
  }

  const fetchTorrentCounts = async (vpsList) => {
    const countPromises = vpsList.filter(vps => vps.enabled).map(async (vps) => {
      try {
        const response = await axios.get(`/api/torrents/${vps.id}`, { timeout: 10000 })
        return {
          vpsId: vps.id,
          count: response.data.success ? (response.data.data?.length || 0) : 0
        }
      } catch (error) {
        console.error(`获取VPS ${vps.name} 种子数量失败:`, error)
        return {
          vpsId: vps.id,
          count: 0
        }
      }
    })

    const results = await Promise.all(countPromises)
    const newTorrentCounts = {}
    results.forEach(result => {
      if (result) {
        newTorrentCounts[result.vpsId] = result.count
      }
    })
    setVpsTorrentCounts(newTorrentCounts)
  }

  const handleAddVPS = () => {
    setEditingVPS(null)
    setShowAddModal(true)
  }

  const handleEditVPS = (vps) => {
    setEditingVPS(vps)
    setShowAddModal(true)
  }

  const handleDeleteVPS = async (vpsId) => {
    if (!confirm('确定要删除这个VPS配置吗？')) {
      return
    }

    try {
      await axios.delete(`/api/vps/${vpsId}`)
      await fetchVPSList()
    } catch (error) {
      console.error('删除VPS失败:', error)
      alert('删除VPS失败: ' + error.response?.data?.error || error.message)
    }
  }

  const handleTestConnection = async (vpsId) => {
    setTestingVPS(vpsId)
    try {
      const response = await axios.post(`/api/vps/${vpsId}/test`)
      if (response.data.success) {
        alert(`连接测试成功！响应时间: ${response.data.responseTime}ms`)
      } else {
        alert('连接测试失败: ' + response.data.error)
      }
    } catch (error) {
      console.error('测试连接失败:', error)
      alert('测试连接失败: ' + error.response?.data?.error || error.message)
    } finally {
      setTestingVPS(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">VPS管理</h1>
        <button
          onClick={handleAddVPS}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加VPS
        </button>
      </div>

      {/* VPS列表 */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>地址</th>
                <th>端口</th>
                <th>用户名</th>
                <th>状态</th>
                <th>系统信息</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {vpsList.map((vps) => (
                <tr key={vps.id}>
                  <td className="font-medium">{vps.name}</td>
                  <td>{vps.host}</td>
                  <td>{vps.port}</td>
                  <td>{vps.username}</td>
                  <td>
                    <span className={vps.enabled ? 'status-online' : 'status-offline'}>
                      {vps.enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    {vps.enabled && vpsInfos[vps.id] ? (
                      <VPSInfoCard
                        vps={vps}
                        vpsInfo={vpsInfos[vps.id]}
                        torrentsCount={vpsTorrentCounts[vps.id] || 0}
                        compact={true}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">
                        {vps.enabled ? '获取中...' : '已禁用'}
                      </span>
                    )}
                  </td>
                  <td>{new Date(vps.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestConnection(vps.id)}
                        disabled={testingVPS === vps.id}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="测试连接"
                      >
                        {testingVPS === vps.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditVPS(vps)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVPS(vps.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {vpsList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无VPS配置，点击"添加VPS"开始添加
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑VPS模态框 */}
      {showAddModal && (
        <VPSModal
          vps={editingVPS}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchVPSList()
          }}
        />
      )}
    </div>
  )
}

// VPS添加/编辑模态框组件
function VPSModal({ vps, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: vps?.name || '',
    host: vps?.host || '',
    port: vps?.port || 8080,
    username: vps?.username || '',
    password: vps?.password || '',
    enabled: vps?.enabled !== undefined ? vps.enabled : true
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (vps) {
        // 编辑模式
        await axios.put(`/api/vps/${vps.id}`, formData)
      } else {
        // 添加模式
        await axios.post('/api/vps', formData)
      }
      onSuccess()
    } catch (error) {
      console.error('保存VPS配置失败:', error)
      alert('保存失败: ' + error.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      // 这里直接测试连接，不保存
      const response = await axios.post('/api/vps/test', formData)
      if (response.data.success) {
        alert(`连接测试成功！响应时间: ${response.data.responseTime}ms`)
      } else {
        alert('连接测试失败: ' + response.data.error)
      }
    } catch (error) {
      console.error('测试连接失败:', error)
      alert('测试连接失败: ' + error.response?.data?.error || error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {vps ? '编辑VPS配置' : '添加VPS配置'}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VPS名称"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                主机地址
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="IP地址或域名"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                端口
              </label>
              <input
                type="number"
                required
                className="input"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                placeholder="8080"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="qBittorrent用户名"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                required
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="qBittorrent密码"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                启用此VPS
              </label>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="btn btn-secondary flex items-center"
              >
                {testing ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                测试连接
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VPSManagement
