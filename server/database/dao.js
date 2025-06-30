const database = require('./sqlite');

class VPSConfigDAO {
  // 获取所有VPS配置
  async getAll() {
    const sql = `
      SELECT id, name, host, port, username, password, enabled, created_at, updated_at
      FROM vps_configs 
      ORDER BY created_at DESC
    `;
    return await database.query(sql);
  }

  // 根据ID获取VPS配置
  async getById(id) {
    const sql = `
      SELECT id, name, host, port, username, password, enabled, created_at, updated_at
      FROM vps_configs 
      WHERE id = ?
    `;
    return await database.get(sql, [id]);
  }

  // 创建VPS配置
  async create(config) {
    const sql = `
      INSERT INTO vps_configs (name, host, port, username, password, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await database.run(sql, [
      config.name,
      config.host,
      config.port || 8080,
      config.username,
      config.password,
      config.enabled !== false ? 1 : 0
    ]);
    
    return await this.getById(result.lastID);
  }

  // 更新VPS配置
  async update(id, config) {
    const sql = `
      UPDATE vps_configs 
      SET name = ?, host = ?, port = ?, username = ?, password = ?, enabled = ?
      WHERE id = ?
    `;
    await database.run(sql, [
      config.name,
      config.host,
      config.port || 8080,
      config.username,
      config.password,
      config.enabled !== false ? 1 : 0,
      id
    ]);
    
    return await this.getById(id);
  }

  // 删除VPS配置
  async delete(id) {
    const sql = `DELETE FROM vps_configs WHERE id = ?`;
    const result = await database.run(sql, [id]);
    return result.changes > 0;
  }

  // 获取启用的VPS配置
  async getEnabled() {
    const sql = `
      SELECT id, name, host, port, username, password, enabled, created_at, updated_at
      FROM vps_configs 
      WHERE enabled = 1
      ORDER BY created_at DESC
    `;
    return await database.query(sql);
  }
}

class VPSStatusDAO {
  // 获取所有VPS状态
  async getAll() {
    const sql = `
      SELECT vs.*, vc.name as vps_name
      FROM vps_status vs
      LEFT JOIN vps_configs vc ON vs.vps_id = vc.id
      ORDER BY vs.last_check DESC
    `;
    return await database.query(sql);
  }

  // 根据VPS ID获取最新状态
  async getByVPSId(vpsId) {
    const sql = `
      SELECT vs.*, vc.name as vps_name
      FROM vps_status vs
      LEFT JOIN vps_configs vc ON vs.vps_id = vc.id
      WHERE vs.vps_id = ?
      ORDER BY vs.last_check DESC
      LIMIT 1
    `;
    return await database.get(sql, [vpsId]);
  }

  // 创建状态记录
  async create(status) {
    const sql = `
      INSERT INTO vps_status (vps_id, status, response_time, error_message)
      VALUES (?, ?, ?, ?)
    `;
    const result = await database.run(sql, [
      status.vps_id,
      status.status,
      status.response_time || null,
      status.error_message || null
    ]);
    
    return result.lastID;
  }

  // 更新VPS状态
  async updateStatus(vpsId, status, responseTime = null, errorMessage = null) {
    // 先删除旧的状态记录（保留最近10条）
    await this.cleanOldStatus(vpsId, 10);
    
    // 插入新的状态记录
    return await this.create({
      vps_id: vpsId,
      status: status,
      response_time: responseTime,
      error_message: errorMessage
    });
  }

  // 清理旧的状态记录
  async cleanOldStatus(vpsId, keepCount = 10) {
    const sql = `
      DELETE FROM vps_status 
      WHERE vps_id = ? AND id NOT IN (
        SELECT id FROM vps_status 
        WHERE vps_id = ? 
        ORDER BY last_check DESC 
        LIMIT ?
      )
    `;
    return await database.run(sql, [vpsId, vpsId, keepCount]);
  }

  // 获取VPS状态历史
  async getHistory(vpsId, limit = 50) {
    const sql = `
      SELECT * FROM vps_status
      WHERE vps_id = ?
      ORDER BY last_check DESC
      LIMIT ?
    `;
    return await database.query(sql, [vpsId, limit]);
  }

  // 删除VPS的所有状态记录
  async deleteByVPSId(vpsId) {
    const sql = `DELETE FROM vps_status WHERE vps_id = ?`;
    const result = await database.run(sql, [vpsId]);
    return result.changes;
  }
}

module.exports = {
  VPSConfigDAO: new VPSConfigDAO(),
  VPSStatusDAO: new VPSStatusDAO()
};
