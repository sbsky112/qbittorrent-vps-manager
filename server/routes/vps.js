const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { testVPSConnection } = require('../services/qbittorrent');

// 获取所有VPS配置
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const configs = await db.vpsConfigs.getAll();
    res.json(configs.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    console.error('获取VPS配置失败:', error);
    res.status(500).json({ error: '获取VPS配置失败' });
  }
});

// 添加新的VPS配置
router.post('/', async (req, res) => {
  const { name, host, port, username, password } = req.body;

  if (!name || !host || !username || !password) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  // 测试连接
  try {
    const connectionTest = await testVPSConnection({ host, port: port || 8080, username, password });
    if (!connectionTest.success) {
      res.status(400).json({ error: '连接测试失败: ' + connectionTest.error });
      return;
    }
  } catch (error) {
    res.status(400).json({ error: '连接测试失败: ' + error.message });
    return;
  }

  try {
    const db = getDatabase();
    const newConfig = await db.vpsConfigs.add({
      name,
      host,
      port: port || 8080,
      username,
      password
    });

    res.json({
      id: newConfig.id,
      message: 'VPS配置添加成功',
      name,
      host,
      port: port || 8080
    });
  } catch (error) {
    if (error.message === 'VPS名称已存在') {
      res.status(400).json({ error: 'VPS名称已存在' });
    } else {
      console.error('添加VPS配置失败:', error);
      res.status(500).json({ error: '添加VPS配置失败' });
    }
  }
});

// 更新VPS配置
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, host, port, username, password, enabled } = req.body;

  if (!name || !host || !username || !password) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  // 测试连接
  try {
    const connectionTest = await testVPSConnection({ host, port: port || 8080, username, password });
    if (!connectionTest.success) {
      res.status(400).json({ error: '连接测试失败: ' + connectionTest.error });
      return;
    }
  } catch (error) {
    res.status(400).json({ error: '连接测试失败: ' + error.message });
    return;
  }

  try {
    const db = getDatabase();
    const updated = await db.vpsConfigs.update(id, {
      name,
      host,
      port: port || 8080,
      username,
      password,
      enabled: enabled !== undefined ? enabled : true
    });

    if (!updated) {
      res.status(404).json({ error: 'VPS配置不存在' });
      return;
    }

    res.json({ message: 'VPS配置更新成功' });
  } catch (error) {
    console.error('更新VPS配置失败:', error);
    res.status(500).json({ error: '更新VPS配置失败' });
  }
});

// 删除VPS配置
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const deleted = await db.vpsConfigs.delete(id);

    if (!deleted) {
      res.status(404).json({ error: 'VPS配置不存在' });
      return;
    }

    res.json({ message: 'VPS配置删除成功' });
  } catch (error) {
    console.error('删除VPS配置失败:', error);
    res.status(500).json({ error: '删除VPS配置失败' });
  }
});

// 测试连接（不需要保存的VPS配置）
router.post('/test', async (req, res) => {
  const { host, port, username, password } = req.body;

  if (!host || !username || !password) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  try {
    const result = await testVPSConnection({ host, port: port || 8080, username, password });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 测试VPS连接
router.post('/:id/test', async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const vpsConfig = await db.vpsConfigs.getById(id);

    if (!vpsConfig) {
      res.status(404).json({ error: 'VPS配置不存在' });
      return;
    }

    const result = await testVPSConnection(vpsConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有VPS的状态信息
router.get('/status', async (req, res) => {
  try {
    const { getAllVPSLatestStatus } = require('../services/monitoring');
    const statusData = await getAllVPSLatestStatus();
    res.json(statusData);
  } catch (error) {
    console.error('获取VPS状态失败:', error);
    res.status(500).json({ error: '获取VPS状态失败' });
  }
});

module.exports = router;
