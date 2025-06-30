const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database/init');
const { QBittorrentAPI } = require('../services/qbittorrent');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 保持原文件名，添加时间戳避免冲突
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只允许.torrent文件
    if (path.extname(file.originalname).toLowerCase() === '.torrent') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传.torrent文件'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
});

// 获取指定VPS的种子列表
router.get('/:vpsId', async (req, res) => {
  const { vpsId } = req.params;

  try {
    const db = getDatabase();
    const vps = await db.vpsConfigs.getById(vpsId);

    if (!vps || !vps.enabled) {
      res.status(404).json({ error: 'VPS配置不存在或已禁用' });
      return;
    }

    const api = new QBittorrentAPI(vps);
    const result = await api.getTorrents();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        vps: {
          id: vps.id,
          name: vps.name,
          host: vps.host
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有VPS的种子列表
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const allVps = await db.vpsConfigs.getAll();
    const vpsList = allVps.filter(vps => vps.enabled);

    const results = await Promise.all(
      vpsList.map(async (vps) => {
        try {
          const api = new QBittorrentAPI(vps);
          const result = await api.getTorrents();

          return {
            vps: {
              id: vps.id,
              name: vps.name,
              host: vps.host
            },
            success: result.success,
            torrents: result.success ? result.data : [],
            error: result.error
          };
        } catch (error) {
          return {
            vps: {
              id: vps.id,
              name: vps.name,
              host: vps.host
            },
            success: false,
            torrents: [],
            error: error.message
          };
        }
      })
    );

    res.json(results);
  } catch (error) {
    console.error('获取VPS配置失败:', error);
    res.status(500).json({ error: '获取VPS配置失败' });
  }
});

// 添加种子到指定VPS
router.post('/:vpsId/add', async (req, res) => {
  const { vpsId } = req.params;
  const { urls, savepath } = req.body;

  if (!urls) {
    res.status(400).json({ error: '缺少种子URL' });
    return;
  }

  try {
    const db = getDatabase();
    const vps = db.vpsConfigs.getById(vpsId);

    if (!vps || !vps.enabled) {
      res.status(404).json({ error: 'VPS配置不存在或已禁用' });
      return;
    }

    const api = new QBittorrentAPI(vps);
    const result = await api.addTorrent({ urls, savepath });

    if (result.success) {
      res.json({
        success: true,
        message: '种子添加成功',
        vps: {
          id: vps.id,
          name: vps.name
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('添加种子失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 批量添加种子到多个VPS
router.post('/batch/add', async (req, res) => {
  const { vpsIds, urls, savepath } = req.body;

  if (!vpsIds || !Array.isArray(vpsIds) || vpsIds.length === 0) {
    res.status(400).json({ error: '缺少VPS ID列表' });
    return;
  }

  if (!urls) {
    res.status(400).json({ error: '缺少种子URL' });
    return;
  }

  try {
    const db = getDatabase();
    const allVps = db.vpsConfigs.getAll();
    const vpsList = allVps.filter(vps =>
      vpsIds.includes(vps.id.toString()) && vps.enabled
    );

    const results = await Promise.all(
      vpsList.map(async (vps) => {
        try {
          const api = new QBittorrentAPI(vps);
          const result = await api.addTorrent({ urls, savepath });

          return {
            vps: {
              id: vps.id,
              name: vps.name
            },
            success: result.success,
            error: result.error
          };
        } catch (error) {
          return {
            vps: {
              id: vps.id,
              name: vps.name
            },
            success: false,
            error: error.message
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: successCount > 0,
      message: `成功添加到 ${successCount}/${results.length} 台VPS`,
      results
    });
  } catch (error) {
    console.error('批量添加种子失败:', error);
    res.status(500).json({ error: '批量添加种子失败' });
  }
});

// 暂停种子
router.post('/:vpsId/pause', async (req, res) => {
  const { vpsId } = req.params;
  const { hashes } = req.body;

  if (!hashes || !Array.isArray(hashes)) {
    res.status(400).json({ error: '缺少种子哈希列表' });
    return;
  }

  try {
    const db = getDatabase();
    const vps = db.vpsConfigs.getById(vpsId);

    if (!vps || !vps.enabled) {
      res.status(404).json({ error: 'VPS配置不存在或已禁用' });
      return;
    }

    const api = new QBittorrentAPI(vps);
    const result = await api.pauseTorrents(hashes);

    res.json(result);
  } catch (error) {
    console.error('暂停种子失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 恢复种子
router.post('/:vpsId/resume', async (req, res) => {
  const { vpsId } = req.params;
  const { hashes } = req.body;

  if (!hashes || !Array.isArray(hashes)) {
    res.status(400).json({ error: '缺少种子哈希列表' });
    return;
  }

  try {
    const db = getDatabase();
    const vps = db.vpsConfigs.getById(vpsId);

    if (!vps || !vps.enabled) {
      res.status(404).json({ error: 'VPS配置不存在或已禁用' });
      return;
    }

    const api = new QBittorrentAPI(vps);
    const result = await api.resumeTorrents(hashes);

    res.json(result);
  } catch (error) {
    console.error('恢复种子失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除种子
router.delete('/:vpsId', async (req, res) => {
  const { vpsId } = req.params;
  const { hashes, deleteFiles } = req.body;

  if (!hashes || !Array.isArray(hashes)) {
    res.status(400).json({ error: '缺少种子哈希列表' });
    return;
  }

  try {
    const db = getDatabase();
    const vps = db.vpsConfigs.getById(vpsId);

    if (!vps || !vps.enabled) {
      res.status(404).json({ error: 'VPS配置不存在或已禁用' });
      return;
    }

    const api = new QBittorrentAPI(vps);
    const result = await api.deleteTorrents(hashes, deleteFiles);

    res.json(result);
  } catch (error) {
    console.error('删除种子失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取VPS详细信息（包含硬盘空间）
router.get('/:vpsId/info', async (req, res) => {
  const { vpsId } = req.params;

  try {
    const db = getDatabase();
    const vps = await db.vpsConfigs.getById(vpsId);

    if (!vps || !vps.enabled) {
      res.status(404).json({ error: 'VPS配置不存在或已禁用' });
      return;
    }

    const api = new QBittorrentAPI(vps);

    // 获取主数据和偏好设置
    const [mainDataResult, preferencesResult, globalStatsResult] = await Promise.all([
      api.getMainData(),
      api.getPreferences(),
      api.getGlobalStats()
    ]);

    const result = {
      vps: {
        id: vps.id,
        name: vps.name,
        host: vps.host
      },
      success: true,
      mainData: mainDataResult.success ? mainDataResult.data : null,
      preferences: preferencesResult.success ? preferencesResult.data : null,
      globalStats: globalStatsResult.success ? globalStatsResult.data : null,
      errors: {
        mainData: mainDataResult.error,
        preferences: preferencesResult.error,
        globalStats: globalStatsResult.error
      }
    };

    res.json(result);
  } catch (error) {
    console.error('获取VPS详细信息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 上传种子文件
router.post('/:vpsId/upload', upload.single('torrent'), async (req, res) => {
  const { vpsId } = req.params;
  const { autoStart = 'true' } = req.body;

  try {
    if (!req.file) {
      res.status(400).json({ error: '没有上传文件' });
      return;
    }

    const db = getDatabase();
    const vps = db.vpsConfigs.getById(vpsId);

    if (!vps || !vps.enabled) {
      // 清理上传的文件
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'VPS配置不存在或已禁用' });
      return;
    }

    const api = new QBittorrentAPI(vps);

    // 上传种子文件到qBittorrent
    const uploadResult = await api.addTorrentFile(req.file.path, {
      paused: autoStart === 'false' // 如果autoStart为false，则暂停
    });

    // 清理临时文件
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('清理临时文件失败:', cleanupError.message);
    }

    if (uploadResult.success) {
      res.json({
        success: true,
        message: `种子文件上传成功${autoStart === 'true' ? '并已开始下载' : '，已添加到队列'}`,
        filename: req.file.originalname
      });
    } else {
      res.status(500).json({
        success: false,
        error: uploadResult.error || '上传种子文件失败'
      });
    }

  } catch (error) {
    // 清理临时文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError.message);
      }
    }

    console.error('上传种子文件失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
