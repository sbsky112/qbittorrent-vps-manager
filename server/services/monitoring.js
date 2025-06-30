const cron = require('node-cron');
const { getDatabase } = require('../database/init');
const { testVPSConnection } = require('./qbittorrent');

let monitoringActive = false;

function startMonitoring() {
  if (monitoringActive) {
    console.log('监控服务已在运行');
    return;
  }

  console.log('启动VPS监控服务...');
  monitoringActive = true;

  // 每5分钟检查一次VPS状态
  cron.schedule('*/5 * * * *', async () => {
    console.log('开始检查VPS状态...');
    await checkAllVPSStatus();
  });

  // 立即执行一次检查
  checkAllVPSStatus();
}

function stopMonitoring() {
  monitoringActive = false;
  console.log('VPS监控服务已停止');
}

async function checkAllVPSStatus() {
  try {
    const db = getDatabase();
    const allVps = await db.vpsConfigs.getAll();
    const vpsList = allVps.filter(vps => vps.enabled);

    console.log(`检查 ${vpsList.length} 台VPS的状态`);

    const checkPromises = vpsList.map(async (vps) => {
      try {
        const result = await testVPSConnection(vps);

        // 更新VPS状态到数据库
        await updateVPSStatus(vps.id, {
          status: result.success ? 'online' : 'offline',
          responseTime: result.responseTime,
          errorMessage: result.error || null
        });

        // 通过WebSocket广播状态更新
        if (global.broadcast) {
          global.broadcast({
            type: 'vps_status_update',
            data: {
              vpsId: vps.id,
              vpsName: vps.name,
              status: result.success ? 'online' : 'offline',
              responseTime: result.responseTime,
              error: result.error,
              timestamp: new Date().toISOString()
            }
          });
        }

        return {
          vpsId: vps.id,
          vpsName: vps.name,
          success: result.success,
          responseTime: result.responseTime,
          error: result.error
        };
      } catch (error) {
        console.error(`检查VPS ${vps.name} 状态失败:`, error);

        await updateVPSStatus(vps.id, {
          status: 'offline',
          responseTime: null,
          errorMessage: error.message
        });

        return {
          vpsId: vps.id,
          vpsName: vps.name,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(checkPromises);
    const onlineCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`VPS状态检查完成: ${onlineCount}/${totalCount} 在线`);

    // 广播总体状态
    if (global.broadcast) {
      global.broadcast({
        type: 'monitoring_summary',
        data: {
          totalVPS: totalCount,
          onlineVPS: onlineCount,
          offlineVPS: totalCount - onlineCount,
          timestamp: new Date().toISOString()
        }
      });
    }

    return results;
  } catch (error) {
    console.error('VPS状态检查失败:', error);
    throw error;
  }
}

async function updateVPSStatus(vpsId, statusData) {
  try {
    const db = getDatabase();
    const newStatus = await db.vpsStatus.add({
      vps_id: parseInt(vpsId),
      status: statusData.status,
      response_time: statusData.responseTime,
      error_message: statusData.errorMessage
    });
    return newStatus.id;
  } catch (error) {
    console.error('更新VPS状态失败:', error);
    throw error;
  }
}

// 获取VPS历史状态
function getVPSStatusHistory(vpsId, limit = 100) {
  try {
    const db = getDatabase();
    return db.vpsStatus.getHistoryByVpsId(vpsId, limit);
  } catch (error) {
    console.error('获取VPS历史状态失败:', error);
    throw error;
  }
}

// 获取所有VPS的最新状态
async function getAllVPSLatestStatus() {
  try {
    const db = getDatabase();
    const allVpsConfigs = await db.vpsConfigs.getAll();
    const vpsConfigs = allVpsConfigs.filter(vps => vps.enabled);
    const latestStatuses = await db.vpsStatus.getAll();

    // 合并VPS配置和状态信息
    const result = vpsConfigs.map(vps => {
      const status = latestStatuses.find(s => s.vps_id === vps.id);
      return {
        ...vps,
        status: status?.status || 'unknown',
        response_time: status?.response_time || null,
        error_message: status?.error_message || null,
        last_check: status?.last_check || null
      };
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('获取所有VPS最新状态失败:', error);
    throw error;
  }
}

module.exports = {
  startMonitoring,
  stopMonitoring,
  checkAllVPSStatus,
  updateVPSStatus,
  getVPSStatusHistory,
  getAllVPSLatestStatus
};
