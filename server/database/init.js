// SQLite数据库实现
const database = require('./sqlite');
const DataMigration = require('./migrate');
const { VPSConfigDAO, VPSStatusDAO } = require('./dao');

let initialized = false;

async function initDatabase() {
  if (initialized) {
    return;
  }

  try {
    console.log('🚀 初始化SQLite数据库...');

    // 初始化SQLite数据库
    await database.init();

    // 检查是否需要从JSON迁移数据
    const migration = new DataMigration();
    if (migration.hasJSONData()) {
      console.log('📦 发现JSON数据文件，开始迁移...');
      await migration.migrate();
    }

    initialized = true;
    console.log('✅ 数据库初始化完成');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 兼容性函数（SQLite自动保存，这些函数保留为空）
async function saveVpsConfigs() {
  // SQLite自动保存，无需手动保存
}

async function saveVpsStatus() {
  // SQLite自动保存，无需手动保存
}

// VPS配置操作（SQLite实现）
const vpsConfigOps = {
  // 获取所有VPS配置
  async getAll() {
    return await VPSConfigDAO.getAll();
  },

  // 根据ID获取VPS配置
  async getById(id) {
    return await VPSConfigDAO.getById(id);
  },

  // 添加VPS配置
  async add(config) {
    const result = await VPSConfigDAO.create(config);
    await saveVpsConfigs(); // 兼容性调用
    return result;
  },

  // 更新VPS配置
  async update(id, updates) {
    const result = await VPSConfigDAO.update(id, updates);
    await saveVpsConfigs(); // 兼容性调用
    return result ? true : false;
  },

  // 删除VPS配置
  async delete(id) {
    const success = await VPSConfigDAO.delete(id);
    await saveVpsConfigs(); // 兼容性调用
    return success;
  }
};

// VPS状态操作（SQLite实现）
const vpsStatusOps = {
  // 添加状态记录
  async add(statusData) {
    const result = await VPSStatusDAO.create(statusData);
    await saveVpsStatus(); // 兼容性调用
    return { id: result, ...statusData };
  },

  // 获取所有状态记录
  async getAll() {
    return await VPSStatusDAO.getAll();
  },

  // 获取VPS的最新状态
  async getLatestByVpsId(vpsId) {
    return await VPSStatusDAO.getByVPSId(vpsId);
  },

  // 获取VPS的历史状态
  async getHistoryByVpsId(vpsId, limit = 100) {
    return await VPSStatusDAO.getHistory(vpsId, limit);
  },

  // 更新VPS状态
  async updateStatus(vpsId, status, responseTime, errorMessage) {
    return await VPSStatusDAO.updateStatus(vpsId, status, responseTime, errorMessage);
  },

  // 保存状态（兼容性方法）
  async save() {
    // SQLite自动保存，无需手动保存
    return Promise.resolve();
  }
};

function getDatabase() {
  return {
    vpsConfigs: vpsConfigOps,
    vpsStatus: vpsStatusOps
  };
}

async function closeDatabase() {
  if (initialized) {
    await database.close();
    initialized = false;
    console.log('SQLite数据库连接已关闭');
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
