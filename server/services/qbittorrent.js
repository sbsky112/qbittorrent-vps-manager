const axios = require('axios');

class QBittorrentAPI {
  constructor(config) {
    this.config = config;
    this.baseURL = `http://${config.host}:${config.port}`;
    this.cookie = null;
  }

  // 登录获取cookie
  async login() {
    try {
      const response = await axios.post(`${this.baseURL}/api/v2/auth/login`, 
        `username=${encodeURIComponent(this.config.username)}&password=${encodeURIComponent(this.config.password)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data === 'Ok.') {
        this.cookie = response.headers['set-cookie'];
        return { success: true };
      } else {
        return { success: false, error: '登录失败' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.code === 'ECONNREFUSED' ? '连接被拒绝' : error.message 
      };
    }
  }

  // 获取种子列表
  async getTorrents() {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/v2/torrents/info`, {
        headers: {
          'Cookie': this.cookie
        },
        timeout: 10000
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 获取全局统计信息
  async getGlobalStats() {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/v2/transfer/info`, {
        headers: {
          'Cookie': this.cookie
        },
        timeout: 10000
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 添加种子
  async addTorrent(torrentData) {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      // 构建表单数据
      let formData = 'urls=' + encodeURIComponent(torrentData.urls);

      if (torrentData.savepath) {
        formData += '&savepath=' + encodeURIComponent(torrentData.savepath);
      }

      const response = await axios.post(`${this.baseURL}/api/v2/torrents/add`, formData, {
        headers: {
          'Cookie': this.cookie,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 暂停种子
  async pauseTorrents(hashes) {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/v2/torrents/pause`, 
        `hashes=${hashes.join('|')}`,
        {
          headers: {
            'Cookie': this.cookie,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 恢复种子
  async resumeTorrents(hashes) {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/v2/torrents/resume`, 
        `hashes=${hashes.join('|')}`,
        {
          headers: {
            'Cookie': this.cookie,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 删除种子
  async deleteTorrents(hashes, deleteFiles = false) {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/v2/torrents/delete`,
        `hashes=${hashes.join('|')}&deleteFiles=${deleteFiles}`,
        {
          headers: {
            'Cookie': this.cookie,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 获取主数据（包含服务器状态）
  async getMainData() {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/v2/sync/maindata`, {
        headers: {
          'Cookie': this.cookie
        },
        timeout: 10000
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 获取应用偏好设置（包含下载路径等信息）
  async getPreferences() {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/v2/app/preferences`, {
        headers: {
          'Cookie': this.cookie
        },
        timeout: 10000
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 上传种子文件
  async addTorrentFile(filePath, options = {}) {
    if (!this.cookie) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return loginResult;
      }
    }

    try {
      const FormData = require('form-data');
      const fs = require('fs');

      const form = new FormData();
      form.append('torrents', fs.createReadStream(filePath));

      // 添加选项
      if (options.paused !== undefined) {
        form.append('paused', options.paused.toString());
      }
      if (options.savepath) {
        form.append('savepath', options.savepath);
      }
      if (options.category) {
        form.append('category', options.category);
      }
      if (options.tags) {
        form.append('tags', options.tags);
      }

      const response = await axios.post(`${this.baseURL}/api/v2/torrents/add`, form, {
        headers: {
          'Cookie': this.cookie,
          ...form.getHeaders()
        },
        timeout: 30000
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 测试VPS连接
async function testVPSConnection(config) {
  const api = new QBittorrentAPI(config);
  const startTime = Date.now();
  
  try {
    const result = await api.login();
    const responseTime = Date.now() - startTime;
    
    if (result.success) {
      return { 
        success: true, 
        responseTime,
        message: '连接成功' 
      };
    } else {
      return { 
        success: false, 
        responseTime,
        error: result.error 
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { 
      success: false, 
      responseTime,
      error: error.message 
    };
  }
}

module.exports = {
  QBittorrentAPI,
  testVPSConnection
};
