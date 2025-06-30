import React from 'react'
import { HardDrive, Download, Upload, Activity } from 'lucide-react'

function VPSInfoCard({ vps, vpsInfo, torrentsCount, compact = false }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond) => {
    return formatBytes(bytesPerSecond) + '/s'
  }

  if (!vpsInfo || !vpsInfo.success) {
    return (
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
        {compact ? '离线' : '无法获取VPS信息'}
      </div>
    )
  }

  const { globalStats, mainData } = vpsInfo
  const freeSpace = mainData?.server_state?.free_space_on_disk || 0
  const dlSpeed = globalStats?.dl_info_speed || 0
  const upSpeed = globalStats?.up_info_speed || 0
  const totalDownloaded = mainData?.server_state?.alltime_dl || 0
  const totalUploaded = mainData?.server_state?.alltime_ul || 0

  // 计算磁盘使用情况（每台机器固定100GB存储）
  const getDiskUsage = () => {
    if (freeSpace > 0) {
      const totalSpace = 100 * 1024 * 1024 * 1024 // 100GB in bytes
      const usedSpace = totalSpace - freeSpace
      const usagePercent = (usedSpace / totalSpace) * 100

      return {
        used: usedSpace,
        total: totalSpace,
        free: freeSpace,
        percent: Math.max(0, Math.min(usagePercent, 100)) // 确保在0-100%范围内
      }
    }
    return null
  }

  const diskUsage = getDiskUsage()

  if (compact) {
    // 紧凑模式：用于仪表板和VPS管理页面
    return (
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
          <HardDrive className="h-3.5 w-3.5 text-gray-500" />
          <span className="font-medium">{formatBytes(freeSpace)}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          <Download className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-medium">{formatSpeed(dlSpeed)}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-md">
          <Upload className="h-3.5 w-3.5 text-green-500" />
          <span className="font-medium">{formatSpeed(upSpeed)}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
          <Activity className="h-3.5 w-3.5 text-purple-500" />
          <span className="font-medium">{torrentsCount}</span>
        </div>
      </div>
    )
  }

  // 详细模式：用于种子管理页面
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 传输统计 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center mb-3">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800">传输统计</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">下载速度:</span>
            <span className="font-medium text-blue-600">{formatSpeed(dlSpeed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">上传速度:</span>
            <span className="font-medium text-green-600">{formatSpeed(upSpeed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">总下载:</span>
            <span className="font-medium text-gray-800">{formatBytes(totalDownloaded)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">总上传:</span>
            <span className="font-medium text-gray-800">{formatBytes(totalUploaded)}</span>
          </div>
        </div>
      </div>

      {/* 存储空间 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
        <div className="flex items-center mb-3">
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <HardDrive className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-800">存储空间</h3>
        </div>
        <div className="space-y-3 text-sm">
          {diskUsage && (
            <>
              {/* 磁盘使用进度条 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">磁盘使用:</span>
                  <span className="font-medium text-gray-800">{diskUsage.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      diskUsage.percent > 90 ? 'bg-red-500' :
                      diskUsage.percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${diskUsage.percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>已用: {formatBytes(diskUsage.used)}</span>
                  <span>总计: {formatBytes(diskUsage.total)}</span>
                </div>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">可用空间:</span>
            <span className="font-medium text-green-600">{formatBytes(freeSpace)}</span>
          </div>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
        <div className="flex items-center mb-3">
          <div className="p-2 bg-purple-100 rounded-lg mr-3">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">系统信息</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">种子数:</span>
            <span className="font-medium text-purple-600">{torrentsCount}</span>
          </div>
          {mainData?.server_state && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">连接状态:</span>
                <span className="font-medium text-gray-800">{mainData.server_state.connection_status || '未知'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DHT节点:</span>
                <span className="font-medium text-gray-800">{mainData.server_state.dht_nodes || 0}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VPSInfoCard
