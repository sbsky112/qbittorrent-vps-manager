import React, { useState, useEffect } from 'react'
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Server
} from 'lucide-react'
import axios from 'axios'
import VPSInfoCard from '../components/VPSInfoCard'

function TorrentManagement() {
  const [torrentsData, setTorrentsData] = useState([])
  const [vpsList, setVpsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVPS, setSelectedVPS] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTorrents, setSelectedTorrents] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAction, setDeleteAction] = useState(null)
  const [operatingTorrents, setOperatingTorrents] = useState(new Set())
  const [successMessage, setSuccessMessage] = useState('')
  const [vpsInfos, setVpsInfos] = useState({})
  const [addMode, setAddMode] = useState('url') // 'url' 或 'file'
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [torrentUrl, setTorrentUrl] = useState('')
  const [autoStart, setAutoStart] = useState(true)
  const [targetVPS, setTargetVPS] = useState('') // 模态框中选择的目标VPS
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true) // 实时同步开关
  const [updateInterval, setUpdateInterval] = useState(null) // 定时器引用
  const [lastUpdateTime, setLastUpdateTime] = useState(null) // 最后更新时间

  // 显示成功消息
  const showSuccessMessage = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // 处理文件上传
  const handleFileUpload = async () => {
    if (!uploadFile || !targetVPS) {
      alert('请选择文件和VPS')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('torrent', uploadFile)
      formData.append('autoStart', autoStart.toString())

      const response = await axios.post(`/api/torrents/${targetVPS}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60秒超时
      })

      if (response.data.success) {
        showSuccessMessage(response.data.message)
        // 自动刷新对应VPS的数据
        setTimeout(() => {
          fetchTorrents()
        }, 1000)
        setShowAddModal(false)
        setUploadFile(null)
        setTargetVPS('')
        setTorrentUrl('')
        setAutoStart(true)
        setAddMode('url')
      } else {
        alert('上传失败: ' + response.data.error)
      }
    } catch (error) {
      console.error('上传种子文件失败:', error)
      alert('上传失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.name.toLowerCase().endsWith('.torrent')) {
        setUploadFile(file)
      } else {
        alert('请选择.torrent文件')
        event.target.value = ''
      }
    }
  }

  // 处理URL添加种子
  const handleAddTorrent = async () => {
    if (!torrentUrl || !targetVPS) {
      alert('请输入种子链接和选择VPS')
      return
    }

    setUploading(true)
    try {
      const response = await axios.post(`/api/torrents/${targetVPS}/add`, {
        url: torrentUrl,
        autoStart: autoStart
      })

      if (response.data.success) {
        showSuccessMessage('种子添加成功')
        // 自动刷新对应VPS的数据
        setTimeout(() => {
          fetchTorrents()
        }, 1000)
        setShowAddModal(false)
        setUploadFile(null)
        setTargetVPS('')
        setTorrentUrl('')
        setAutoStart(true)
        setAddMode('url')
      } else {
        alert('添加失败: ' + response.data.error)
      }
    } catch (error) {
      console.error('添加种子失败:', error)
      alert('添加失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // 实时更新效果
  useEffect(() => {
    if (isRealTimeEnabled && vpsList.length > 0) {
      // 立即获取一次数据（非实时更新，显示loading）
      fetchTorrents(false)

      // 设置定时器，每3秒更新一次（实时更新，不显示loading）
      const interval = setInterval(() => {
        fetchTorrents(true)
      }, 3000)

      setUpdateInterval(interval)

      // 清理函数
      return () => {
        if (interval) {
          clearInterval(interval)
        }
      }
    } else {
      // 如果关闭实时更新，清除定时器
      if (updateInterval) {
        clearInterval(updateInterval)
        setUpdateInterval(null)
      }
    }
  }, [isRealTimeEnabled, vpsList.length, selectedVPS])

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    }
  }, [])

  useEffect(() => {
    if (vpsList.length > 0) {
      fetchTorrents()
    }
  }, [vpsList.length]) // 只在VPS数量变化时重新获取

  // 可选的后台状态同步 - 每2分钟同步一次，不影响用户操作
  useEffect(() => {
    const backgroundSync = setInterval(() => {
      // 只有在没有正在进行的操作时才同步
      if (operatingTorrents.size === 0) {
        fetchTorrents()
      }
    }, 120000) // 2分钟

    return () => clearInterval(backgroundSync)
  }, [operatingTorrents.size])

  const fetchInitialData = async () => {
    try {
      const vpsResponse = await axios.get('/api/vps')
      setVpsList(vpsResponse.data)
    } catch (error) {
      console.error('获取VPS列表失败:', error)
    }
  }

  const fetchTorrents = async (isRealTimeUpdate = false) => {
    // 实时更新时不显示loading状态，避免界面闪烁
    if (!isRealTimeUpdate) {
      setLoading(true)
    }

    try {
      if (selectedVPS === 'all') {
        const response = await axios.get('/api/torrents', { timeout: 30000 })
        setTorrentsData(response.data)
        // 获取每个VPS的详细信息
        fetchVPSInfos(response.data)
      } else {
        const response = await axios.get(`/api/torrents/${selectedVPS}`, { timeout: 30000 })
        setTorrentsData([response.data])
        // 获取单个VPS的详细信息
        fetchVPSInfos([response.data])
      }
      // 更新最后更新时间
      setLastUpdateTime(new Date())
    } catch (error) {
      console.error('获取种子列表失败:', error)
      // 实时更新失败时不清空数据，保持当前状态
      if (!isRealTimeUpdate) {
        setTorrentsData([])
      }
    } finally {
      if (!isRealTimeUpdate) {
        setLoading(false)
      }
    }
  }

  const fetchVPSInfos = async (torrentsData) => {
    const infoPromises = torrentsData.map(async (vpsData) => {
      if (!vpsData.vps?.id) return null

      try {
        const response = await axios.get(`/api/torrents/${vpsData.vps.id}/info`, { timeout: 15000 })
        return {
          vpsId: vpsData.vps.id,
          info: response.data
        }
      } catch (error) {
        console.error(`获取VPS ${vpsData.vps.name} 详细信息失败:`, error)
        return {
          vpsId: vpsData.vps.id,
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

  const getStatusText = (state) => {
    const statusMap = {
      'downloading': '下载中',
      'uploading': '上传中',
      'pausedDL': '已暂停',
      'pausedUP': '已暂停',
      'queuedDL': '队列中',
      'queuedUP': '队列中',
      'stalledDL': '停滞',
      'stalledUP': '停滞',
      'checkingDL': '检查中',
      'checkingUP': '检查中',
      'error': '错误',
      'missingFiles': '文件缺失',
      'allocating': '分配中',
      'deleting': '删除中'
    }
    return statusMap[state] || state
  }

  const getStatusColor = (state) => {
    if (['downloading', 'uploading'].includes(state)) return 'status-online'
    if (['pausedDL', 'pausedUP'].includes(state)) return 'status-offline'
    if (['error', 'missingFiles'].includes(state)) return 'bg-red-100 text-red-800'
    if (state === 'deleting') return 'bg-orange-100 text-orange-800'
    return 'status-checking'
  }

  // 本地状态更新函数，提供即时反馈
  const updateLocalTorrentState = (action, vpsId, hashes) => {
    setTorrentsData(prevData => {
      return prevData.map(vpsData => {
        if (vpsData.vps?.id !== parseInt(vpsId)) {
          return vpsData
        }

        const updatedTorrents = vpsData.torrents?.map(torrent => {
          if (!hashes.includes(torrent.hash)) {
            return torrent
          }

          // 根据操作类型更新状态
          switch (action) {
            case 'pause':
              return {
                ...torrent,
                state: torrent.state.includes('DL') ? 'pausedDL' : 'pausedUP',
                dlspeed: 0,
                upspeed: 0
              }
            case 'resume':
              return {
                ...torrent,
                state: torrent.progress < 1 ? 'downloading' : 'uploading'
              }
            case 'delete':
            case 'deleteWithFiles':
              return {
                ...torrent,
                state: 'deleting', // 标记为删除中
                dlspeed: 0,
                upspeed: 0
              }
            default:
              return torrent
          }
        }) // 保留所有种子，包括删除中的

        return {
          ...vpsData,
          torrents: updatedTorrents
        }
      })
    })
  }

  // 删除操作完成后，真正移除种子
  const removeTorrentsFromState = (vpsId, hashes) => {
    setTorrentsData(prevData => {
      return prevData.map(vpsData => {
        if (vpsData.vps?.id !== parseInt(vpsId)) {
          return vpsData
        }

        const updatedTorrents = vpsData.torrents?.filter(torrent =>
          !hashes.includes(torrent.hash)
        ) || []

        return {
          ...vpsData,
          torrents: updatedTorrents
        }
      })
    })
  }

  const handleTorrentAction = async (action, vpsId, hashes) => {
    // 标记种子为操作中状态
    const operatingKeys = hashes.map(hash => `${vpsId}-${hash}`)
    setOperatingTorrents(prev => new Set([...prev, ...operatingKeys]))

    try {
      let endpoint = ''
      let method = 'post'
      let data = { hashes }

      switch (action) {
        case 'pause':
          endpoint = `/api/torrents/${vpsId}/pause`
          break
        case 'resume':
          endpoint = `/api/torrents/${vpsId}/resume`
          break
        case 'delete':
          endpoint = `/api/torrents/${vpsId}`
          method = 'delete'
          data = { hashes, deleteFiles: false }
          break
        case 'deleteWithFiles':
          endpoint = `/api/torrents/${vpsId}`
          method = 'delete'
          data = { hashes, deleteFiles: true }
          break
      }

      // 先更新本地状态，提供即时反馈
      updateLocalTorrentState(action, vpsId, hashes)

      if (method === 'delete') {
        await axios.delete(endpoint, { data })
      } else {
        await axios.post(endpoint, data)
      }

      // 对于删除操作，延迟移除种子并清空选择
      if (action.includes('delete')) {
        setTimeout(() => {
          removeTorrentsFromState(vpsId, hashes)
        }, 500) // 延迟500ms移除，让用户看到删除动画
        setSelectedTorrents([])
        showSuccessMessage('种子删除成功')
      }

      // 对于暂停/恢复操作，显示成功消息
      if (action === 'pause' || action === 'resume') {
        showSuccessMessage(`种子${action === 'pause' ? '暂停' : '恢复'}成功`)
      }

    } catch (error) {
      console.error(`执行操作 ${action} 失败:`, error)
      alert('操作失败: ' + error.response?.data?.error || error.message)
      // 操作失败时重新获取数据以恢复正确状态
      fetchTorrents()
    } finally {
      // 清除操作中状态
      setOperatingTorrents(prev => {
        const newSet = new Set(prev)
        operatingKeys.forEach(key => newSet.delete(key))
        return newSet
      })
    }
  }

  const handleSelectTorrent = (vpsId, hash) => {
    const key = `${vpsId}-${hash}`
    setSelectedTorrents(prev => 
      prev.includes(key) 
        ? prev.filter(item => item !== key)
        : [...prev, key]
    )
  }

  const handleSelectAll = (vpsId, torrents) => {
    const vpsKeys = torrents.map(t => `${vpsId}-${t.hash}`)
    const allSelected = vpsKeys.every(key => selectedTorrents.includes(key))

    if (allSelected) {
      setSelectedTorrents(prev => prev.filter(key => !vpsKeys.includes(key)))
    } else {
      setSelectedTorrents(prev => [...new Set([...prev, ...vpsKeys])])
    }
  }

  const handleBatchOperation = async (action) => {
    if (selectedTorrents.length === 0) {
      alert('请先选择要操作的种子')
      return
    }

    // 按VPS分组选中的种子
    const groupedByVPS = {}
    selectedTorrents.forEach(key => {
      const [vpsId, hash] = key.split('-')
      if (!groupedByVPS[vpsId]) {
        groupedByVPS[vpsId] = []
      }
      groupedByVPS[vpsId].push(hash)
    })

    try {
      // 先更新本地状态
      Object.entries(groupedByVPS).forEach(([vpsId, hashes]) => {
        updateLocalTorrentState(action, vpsId, hashes)
      })

      // 执行API调用
      const operations = Object.entries(groupedByVPS).map(async ([vpsId, hashes]) => {
        let endpoint = ''
        let method = 'post'
        let data = { hashes }

        switch (action) {
          case 'pause':
            endpoint = `/api/torrents/${vpsId}/pause`
            break
          case 'resume':
            endpoint = `/api/torrents/${vpsId}/resume`
            break
          case 'deleteWithFiles':
            endpoint = `/api/torrents/${vpsId}`
            method = 'delete'
            data = { hashes, deleteFiles: true }
            break
        }

        if (method === 'delete') {
          return axios.delete(endpoint, { data })
        } else {
          return axios.post(endpoint, data)
        }
      })

      await Promise.all(operations)

      // 对于删除操作，延迟移除种子
      if (action.includes('delete')) {
        setTimeout(() => {
          Object.entries(groupedByVPS).forEach(([vpsId, hashes]) => {
            removeTorrentsFromState(vpsId, hashes)
          })
        }, 500) // 延迟500ms移除，让用户看到删除动画
      }

      // 清空选择
      setSelectedTorrents([])

      showSuccessMessage(`批量${action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '删除'}操作完成`)
    } catch (error) {
      console.error('批量操作失败:', error)
      alert('批量操作失败: ' + error.message)
      // 操作失败时重新获取数据
      fetchTorrents()
    }
  }

  const handleDeleteTorrent = (vpsId, hashes) => {
    setDeleteAction({ type: 'single', vpsId, hashes })
    setShowDeleteModal(true)
  }

  const handleBatchDelete = () => {
    if (selectedTorrents.length === 0) {
      alert('请先选择要删除的种子')
      return
    }

    setDeleteAction({ type: 'batch', count: selectedTorrents.length })
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deleteAction.type === 'single') {
      handleTorrentAction('deleteWithFiles', deleteAction.vpsId, deleteAction.hashes)
    } else if (deleteAction.type === 'batch') {
      handleBatchOperation('deleteWithFiles')
    }
    setShowDeleteModal(false)
    setDeleteAction(null)
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
      {/* 成功消息提示 */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">种子管理</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedVPS}
            onChange={(e) => setSelectedVPS(e.target.value)}
            className="input w-48"
          >
            <option value="all">所有VPS</option>
            {vpsList.map(vps => (
              <option key={vps.id} value={vps.id}>
                {vps.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加种子
          </button>
          <button
            onClick={fetchTorrents}
            className="btn btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </button>

          {/* 实时同步开关 */}
          <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="realTimeSync"
                checked={isRealTimeEnabled}
                onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="realTimeSync" className="text-sm font-medium text-gray-700 cursor-pointer">
                实时同步
              </label>
              {isRealTimeEnabled && (
                <div className="flex items-center ml-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 ml-1">3s</span>
                </div>
              )}
            </div>

            {/* 最后更新时间 */}
            {lastUpdateTime && (
              <div className="text-xs text-gray-500 border-l border-gray-200 pl-3">
                最后更新: {lastUpdateTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedTorrents.length > 0 && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <span className="text-sm font-semibold text-blue-600">{selectedTorrents.length}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                已选择 {selectedTorrents.length} 个种子
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBatchOperation('pause')}
                className="btn btn-secondary btn-sm"
              >
                <Pause className="h-4 w-4 mr-1" />
                暂停
              </button>
              <button
                onClick={() => handleBatchOperation('resume')}
                className="btn btn-secondary btn-sm"
              >
                <Play className="h-4 w-4 mr-1" />
                恢复
              </button>
              <button
                onClick={() => handleBatchDelete()}
                className="btn btn-danger btn-sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 种子列表 */}
      <div className="space-y-6">
        {torrentsData.map((vpsData) => (
          <div key={vpsData.vps?.id || 'unknown'} className="card">
            <div className="card-header">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Server className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {vpsData.vps?.name || '未知VPS'}
                        </h3>
                        <span className={vpsData.success ? 'status-online' : 'status-offline'}>
                          {vpsData.success ? '在线' : '离线'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{vpsData.vps?.host}</p>
                    </div>
                  </div>
                  {/* VPS统计信息 */}
                  {vpsData.success && vpsInfos[vpsData.vps?.id] && (
                    <VPSInfoCard
                      vps={vpsData.vps}
                      vpsInfo={vpsInfos[vpsData.vps.id]}
                      torrentsCount={vpsData.torrents?.length || 0}
                      compact={false}
                    />
                  )}
                </div>
                <div className="flex items-center">
                  {vpsData.success && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {vpsData.torrents?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">种子</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {vpsData.success ? (
              <div className="overflow-hidden">
                <table className="table table-fixed w-full">
                  <colgroup>
                    <col className="w-12" />
                    <col className="w-80" />
                    <col className="w-24" />
                    <col className="w-20" />
                    <col className="w-32" />
                    <col className="w-24" />
                    <col className="w-24" />
                    <col className="w-20" />
                    <col className="w-20" />
                    <col className="w-20" />
                    <col className="w-24" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onChange={() => handleSelectAll(vpsData.vps.id, vpsData.torrents)}
                          checked={vpsData.torrents?.length > 0 && vpsData.torrents.every(t =>
                            selectedTorrents.includes(`${vpsData.vps.id}-${t.hash}`)
                          )}
                        />
                      </th>
                      <th className="text-left">名称</th>
                      <th className="text-center">状态</th>
                      <th className="text-right">大小</th>
                      <th className="text-center">进度</th>
                      <th className="text-right">下载</th>
                      <th className="text-right">上传</th>
                      <th className="text-right">已下载</th>
                      <th className="text-right">已上传</th>
                      <th className="text-center">分享率</th>
                      <th className="text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vpsData.torrents?.map((torrent) => (
                      <tr
                        key={torrent.hash}
                        className={torrent.state === 'deleting' ? 'opacity-50 transition-opacity duration-500' : ''}
                      >
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedTorrents.includes(`${vpsData.vps.id}-${torrent.hash}`)}
                            onChange={() => handleSelectTorrent(vpsData.vps.id, torrent.hash)}
                          />
                        </td>
                        <td className="font-medium truncate" title={torrent.name}>
                          {torrent.name}
                        </td>
                        <td className="text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(torrent.state)}`}>
                            {getStatusText(torrent.state)}
                          </span>
                        </td>
                        <td className="text-right font-mono text-sm">{formatBytes(torrent.size)}</td>
                        <td>
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-16 progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${(torrent.progress * 100).toFixed(1)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 min-w-[2.5rem] text-right">
                              {(torrent.progress * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono text-sm">{formatSpeed(torrent.dlspeed)}</td>
                        <td className="text-right font-mono text-sm">{formatSpeed(torrent.upspeed)}</td>
                        <td className="text-right font-mono text-sm">{formatBytes(torrent.completed || 0)}</td>
                        <td className="text-right font-mono text-sm">{formatBytes(torrent.uploaded || 0)}</td>
                        <td className="text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            (torrent.ratio || 0) >= 1 ? 'bg-green-100 text-green-800 border border-green-200' :
                            (torrent.ratio || 0) >= 0.5 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {(torrent.ratio || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {(() => {
                              const isOperating = operatingTorrents.has(`${vpsData.vps.id}-${torrent.hash}`)
                              const isDeleting = torrent.state === 'deleting'

                              if (isOperating || isDeleting) {
                                return (
                                  <div className="flex items-center justify-center w-6 h-6" title={isDeleting ? "删除中..." : "操作中..."}>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                                  </div>
                                )
                              }

                              return (
                                <>
                                  {['pausedDL', 'pausedUP'].includes(torrent.state) ? (
                                    <button
                                      onClick={() => handleTorrentAction('resume', vpsData.vps.id, [torrent.hash])}
                                      className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-all duration-200"
                                      title="恢复"
                                    >
                                      <Play className="h-3.5 w-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleTorrentAction('pause', vpsData.vps.id, [torrent.hash])}
                                      className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-md transition-all duration-200"
                                      title="暂停"
                                    >
                                      <Pause className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteTorrent(vpsData.vps.id, [torrent.hash])}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-all duration-200"
                                    title="删除"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {(!vpsData.torrents || vpsData.torrents.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    暂无种子
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-red-600">
                连接失败: {vpsData.error}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 添加种子模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">添加种子</h3>

              {/* 模式选择 */}
              <div className="mb-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAddMode('url')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      addMode === 'url'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    磁力链接/URL
                  </button>
                  <button
                    onClick={() => setAddMode('file')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      addMode === 'file'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    上传文件
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* VPS选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择VPS
                  </label>
                  <select
                    value={targetVPS}
                    onChange={(e) => setTargetVPS(e.target.value)}
                    className="input"
                  >
                    <option value="">请选择VPS</option>
                    {vpsList.filter(vps => vps.enabled).map(vps => (
                      <option key={vps.id} value={vps.id}>
                        {vps.name} ({vps.host})
                      </option>
                    ))}
                  </select>
                </div>

                {/* URL模式 */}
                {addMode === 'url' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      磁力链接或种子URL
                    </label>
                    <input
                      type="text"
                      value={torrentUrl}
                      onChange={(e) => setTorrentUrl(e.target.value)}
                      placeholder="magnet:?xt=urn:btih:... 或 http://..."
                      className="input"
                    />
                  </div>
                )}

                {/* 文件模式 */}
                {addMode === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择种子文件
                    </label>
                    <input
                      type="file"
                      accept=".torrent"
                      onChange={handleFileSelect}
                      className="input"
                    />
                    {uploadFile && (
                      <p className="text-sm text-gray-600 mt-1">
                        已选择: {uploadFile.name}
                      </p>
                    )}
                  </div>
                )}

                {/* 自动开始选项 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoStartAdd"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="autoStartAdd" className="ml-2 text-sm text-gray-700">
                    添加后自动开始下载
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setUploadFile(null)
                    setTargetVPS('')
                    setTorrentUrl('')
                    setAutoStart(true)
                    setAddMode('url')
                  }}
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  取消
                </button>
                <button
                  onClick={addMode === 'url' ? handleAddTorrent : handleFileUpload}
                  className="btn btn-primary"
                  disabled={
                    (addMode === 'url' && (!torrentUrl || !targetVPS)) ||
                    (addMode === 'file' && (!uploadFile || !targetVPS)) ||
                    uploading
                  }
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {addMode === 'url' ? '添加中...' : '上传中...'}
                    </div>
                  ) : (
                    addMode === 'url' ? '添加' : '上传'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteAction(null)
        }}
        onConfirm={confirmDelete}
        torrentCount={deleteAction?.type === 'single' ? deleteAction.hashes?.length : deleteAction?.count}
      />
    </div>
  )
}



// 删除确认模态框组件
function DeleteConfirmModal({ isOpen, onClose, onConfirm, torrentCount = 1 }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              ⚠️ 确认删除种子
            </h3>
          </div>

          <div className="px-6 py-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                您即将删除 <span className="font-semibold text-red-600">{torrentCount}</span> 个种子
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">
                      注意：将同时删除文件
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      此操作将从磁盘中永久删除种子文件，无法撤销！
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                如果您只想从qBittorrent中移除种子但保留文件，请取消此操作并使用其他方式删除。
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="btn btn-danger"
            >
              确认删除（含文件）
            </button>
          </div>
        </div>
      </div>


    </div>
  )
}



export default TorrentManagement
