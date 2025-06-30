const fs = require('fs');
const path = require('path');
const database = require('./sqlite');
const { VPSConfigDAO, VPSStatusDAO } = require('./dao');

class DataMigration {
  constructor() {
    this.jsonDataDir = path.join(__dirname, 'data');
  }

  // 检查是否存在JSON数据文件
  hasJSONData() {
    const vpsConfigFile = path.join(this.jsonDataDir, 'vps_configs.json');
    const vpsStatusFile = path.join(this.jsonDataDir, 'vps_status.json');
    
    return fs.existsSync(vpsConfigFile) || fs.existsSync(vpsStatusFile);
  }

  // 读取JSON文件
  async readJSONFile(filename) {
    const filePath = path.join(this.jsonDataDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`JSON文件不存在: ${filename}`);
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.trim()) {
        return [];
      }
      return JSON.parse(content);
    } catch (error) {
      console.error(`读取JSON文件失败 ${filename}:`, error.message);
      return [];
    }
  }

  // 迁移VPS配置数据
  async migrateVPSConfigs() {
    console.log('开始迁移VPS配置数据...');
    
    const jsonData = await this.readJSONFile('vps_configs.json');
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      console.log('没有VPS配置数据需要迁移');
      return 0;
    }

    let migratedCount = 0;
    
    for (const config of jsonData) {
      try {
        // 检查是否已存在相同的配置
        const existing = await database.query(
          'SELECT id FROM vps_configs WHERE host = ? AND port = ?',
          [config.host, config.port || 8080]
        );

        if (existing.length === 0) {
          await VPSConfigDAO.create({
            name: config.name || `VPS-${config.host}`,
            host: config.host,
            port: config.port || 8080,
            username: config.username || 'admin',
            password: config.password || 'adminadmin',
            enabled: config.enabled !== false
          });
          migratedCount++;
          console.log(`✅ 迁移VPS配置: ${config.name || config.host}`);
        } else {
          console.log(`⏭️  跳过已存在的VPS配置: ${config.name || config.host}`);
        }
      } catch (error) {
        console.error(`❌ 迁移VPS配置失败 ${config.name || config.host}:`, error.message);
      }
    }

    console.log(`VPS配置迁移完成，共迁移 ${migratedCount} 条记录`);
    return migratedCount;
  }

  // 迁移VPS状态数据
  async migrateVPSStatus() {
    console.log('开始迁移VPS状态数据...');
    
    const jsonData = await this.readJSONFile('vps_status.json');
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      console.log('没有VPS状态数据需要迁移');
      return 0;
    }

    let migratedCount = 0;
    
    for (const status of jsonData) {
      try {
        // 查找对应的VPS配置
        const vpsConfig = await database.get(
          'SELECT id FROM vps_configs WHERE id = ?',
          [status.vps_id]
        );

        if (vpsConfig) {
          await VPSStatusDAO.create({
            vps_id: status.vps_id,
            status: status.status || 'unknown',
            response_time: status.response_time || null,
            error_message: status.error_message || null
          });
          migratedCount++;
        } else {
          console.log(`⏭️  跳过无效的VPS状态记录: VPS ID ${status.vps_id} 不存在`);
        }
      } catch (error) {
        console.error(`❌ 迁移VPS状态失败:`, error.message);
      }
    }

    console.log(`VPS状态迁移完成，共迁移 ${migratedCount} 条记录`);
    return migratedCount;
  }

  // 备份JSON数据
  async backupJSONData() {
    const backupDir = path.join(__dirname, 'backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const files = ['vps_configs.json', 'vps_status.json'];

    for (const file of files) {
      const sourcePath = path.join(this.jsonDataDir, file);
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(backupDir, `${timestamp}_${file}`);
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 备份文件: ${file} -> ${path.basename(backupPath)}`);
      }
    }
  }

  // 清理JSON数据文件
  async cleanupJSONData() {
    const files = ['vps_configs.json', 'vps_status.json'];
    
    for (const file of files) {
      const filePath = path.join(this.jsonDataDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  删除JSON文件: ${file}`);
      }
    }

    // 如果data目录为空，也删除它
    try {
      const files = fs.readdirSync(this.jsonDataDir);
      if (files.length === 0) {
        fs.rmdirSync(this.jsonDataDir);
        console.log(`🗑️  删除空目录: data`);
      }
    } catch (error) {
      // 目录不存在或不为空，忽略错误
    }
  }

  // 执行完整迁移
  async migrate() {
    console.log('🚀 开始数据库迁移...');
    console.log('=====================================');

    try {
      // 检查是否有JSON数据需要迁移
      if (!this.hasJSONData()) {
        console.log('✅ 没有发现JSON数据文件，跳过迁移');
        return;
      }

      // 备份JSON数据
      await this.backupJSONData();

      // 执行迁移
      const vpsConfigCount = await this.migrateVPSConfigs();
      const vpsStatusCount = await this.migrateVPSStatus();

      console.log('=====================================');
      console.log('✅ 数据迁移完成！');
      console.log(`📊 迁移统计:`);
      console.log(`   VPS配置: ${vpsConfigCount} 条`);
      console.log(`   VPS状态: ${vpsStatusCount} 条`);

      // 询问是否清理JSON文件
      console.log('💡 JSON数据已备份到 database/backup/ 目录');
      console.log('🗑️  原JSON文件将被自动清理');
      
      // 清理JSON文件
      await this.cleanupJSONData();

    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
      throw error;
    }
  }
}

module.exports = DataMigration;
