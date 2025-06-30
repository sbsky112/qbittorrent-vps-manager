import React, { useState, useEffect } from 'react'
import {
  Server,
  Download,
  Upload,
  HardDrive,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'
import VPSInfoCard from '../components/VPSInfoCard'

function Dashboard() {
  const [vpsStats, setVpsStats] = useState([])
  const [globalStats, setGlobalStats] = useState({
    totalVPS: 0,
    onlineVPS: 0,
    totalTorrents: 0,
    totalDownloadSpeed: 0,
    totalUploadSpeed: 0
  })
  const [loading, setLoading] = useState(true)
  const [vpsInfos, setVpsInfos] = useState({})

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // 每30秒刷新一次
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 获取VPS状态和种子信息
      const [statusResponse, torrentsResponse] = await Promise.all([
        axios.get('/api/vps/status'),
        axios.get('/api/torrents')
      ])

      const statusData = statusResponse.data
      const torrentsData = torrentsResponse.data

      // 合并VPS状态和种子信息
      const stats = statusData.map(vps => {
        const vpsTorentData = torrentsData.find(t => t.vps?.id === vps.id)
        return {
          ...vps,
          status: vps.status || 'unknown',
          responseTime: vps.response_time,
          torrents: vpsTorentData?.torrents || [],
          error: vps.error_message || vpsTorentData?.error
        }
      })

      setVpsStats(stats)

      // 获取VPS详细信息
      fetchVPSInfos(stats.filter(vps => vps.status === 'online'))

      // 计算全局统计
      const onlineVPS = stats.filter(vps => vps.status === 'online').length
      const totalTorrents = stats.reduce((sum, vps) => sum + (vps.torrents?.length || 0), 0)

      setGlobalStats({
        totalVPS: stats.length,
        onlineVPS,
        totalTorrents,
        totalDownloadSpeed: 0, // 这里需要从实际API获取
        totalUploadSpeed: 0
      })

    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVPSInfos = async (onlineVpsList) => {
    const infoPromises = onlineVpsList.map(async (vps) => {
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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond) => {
    return formatBytes(bytesPerSecond) + '/s'
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
        <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
        <button
          onClick={fetchDashboardData}
          className="btn btn-secondary"
        >
          刷新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Server className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">VPS总数</p>
              <p className="text-2xl font-semibold text-gray-900">{globalStats.totalVPS}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">在线VPS</p>
              <p className="text-2xl font-semibold text-gray-900">{globalStats.onlineVPS}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总种子数</p>
              <p className="text-2xl font-semibold text-gray-900">{globalStats.totalTorrents}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">在线率</p>
              <p className="text-2xl font-semibold text-gray-900">
                {globalStats.totalVPS > 0 ? Math.round((globalStats.onlineVPS / globalStats.totalVPS) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VPS状态列表 */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">VPS状态</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>地址</th>
                <th>状态</th>
                <th>系统信息</th>
                <th>最后检查</th>
              </tr>
            </thead>
            <tbody>
              {vpsStats.map((vps) => (
                <tr key={vps.id}>
                  <td className="font-medium">{vps.name}</td>
                  <td>{vps.host}:{vps.port}</td>
                  <td>
                    <span className={vps.status === 'online' ? 'status-online' : 'status-offline'}>
                      {vps.status === 'online' ? '在线' : '离线'}
                    </span>
                  </td>
                  <td>
                    {vps.status === 'online' && vpsInfos[vps.id] ? (
                      <VPSInfoCard
                        vps={vps}
                        vpsInfo={vpsInfos[vps.id]}
                        torrentsCount={vps.torrents?.length || 0}
                        compact={true}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">
                        {vps.status === 'online' ? '获取中...' : '离线'}
                      </span>
                    )}
                  </td>
                  <td>{new Date().toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
