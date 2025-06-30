const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, 'qbittorrent_manager.db');
  }

  // 初始化数据库连接
  async init() {
    return new Promise((resolve, reject) => {
      // 确保数据库目录存在
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('SQLite数据库连接失败:', err.message);
          reject(err);
        } else {
          console.log('SQLite数据库连接成功');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  // 创建数据表
  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // VPS配置表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS vps_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER DEFAULT 8080,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            enabled BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // VPS状态表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS vps_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vps_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            response_time INTEGER,
            error_message TEXT,
            last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vps_id) REFERENCES vps_configs (id) ON DELETE CASCADE
          )
        `);

        // 创建索引
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_vps_status_vps_id ON vps_status (vps_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_vps_status_last_check ON vps_status (last_check)`);

        // 创建更新时间触发器
        this.db.run(`
          CREATE TRIGGER IF NOT EXISTS update_vps_configs_updated_at 
          AFTER UPDATE ON vps_configs
          BEGIN
            UPDATE vps_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('SQLite数据表创建完成');
            resolve();
          }
        });
      });
    });
  }

  // 执行查询
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 执行单条查询
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 执行插入/更新/删除
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  // 开始事务
  async beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  // 提交事务
  async commit() {
    return this.run('COMMIT');
  }

  // 回滚事务
  async rollback() {
    return this.run('ROLLBACK');
  }

  // 关闭数据库连接
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('SQLite数据库连接已关闭');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// 创建单例实例
const database = new SQLiteDatabase();

module.exports = database;
