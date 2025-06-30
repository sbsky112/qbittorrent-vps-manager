# 贡献指南

感谢您对qBittorrent VPS Manager项目的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题
如果您发现了bug或有功能建议，请：

1. 检查[现有Issues](https://github.com/your-username/qbittorrent-vps-manager/issues)确保问题未被报告
2. 使用适当的Issue模板创建新Issue
3. 提供详细的描述和重现步骤
4. 包含相关的系统信息和日志

### 提交代码
1. **Fork项目**到您的GitHub账户
2. **创建分支**：`git checkout -b feature/amazing-feature`
3. **提交更改**：`git commit -m 'Add some amazing feature'`
4. **推送分支**：`git push origin feature/amazing-feature`
5. **创建Pull Request**

## 📋 开发环境设置

### 前置要求
- Node.js 16.0.0+
- npm 或 yarn
- Git

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/qbittorrent-vps-manager.git
cd qbittorrent-vps-manager

# 安装依赖
npm run install:deps

# 启动开发服务器
npm run dev
```

### 项目结构
```
qbittorrent-vps-manager/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   └── utils/         # 工具函数
├── server/                # 后端Node.js应用
│   ├── routes/            # API路由
│   ├── services/          # 业务逻辑
│   └── database/          # 数据库相关
└── docs/                  # 文档
```

## 🎯 代码规范

### JavaScript/React
- 使用ES6+语法
- 遵循ESLint配置
- 使用函数式组件和Hooks
- 组件名使用PascalCase
- 文件名使用kebab-case

### 代码示例
```javascript
// ✅ 好的示例
const VPSCard = ({ vps, onEdit, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleEdit = useCallback(() => {
    onEdit(vps.id);
  }, [vps.id, onEdit]);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* 组件内容 */}
    </div>
  );
};

// ❌ 避免的示例
function vpscard(props) {
  return <div style={{backgroundColor: 'white'}}>{props.children}</div>;
}
```

### CSS/Tailwind
- 优先使用Tailwind CSS类
- 避免内联样式
- 使用响应式设计
- 保持一致的间距和颜色

### API设计
- 使用RESTful API设计
- 统一的错误处理
- 适当的HTTP状态码
- 清晰的请求/响应格式

```javascript
// ✅ 好的API响应
{
  "success": true,
  "data": {
    "vps": [...],
    "total": 10
  },
  "message": "VPS列表获取成功"
}

// ❌ 避免的响应
{
  "vps": [...],
  "count": 10
}
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 运行前端测试
npm run test:client

# 运行后端测试
npm run test:server

# 代码覆盖率
npm run test:coverage
```

### 测试要求
- 新功能必须包含测试
- 保持测试覆盖率 > 80%
- 使用描述性的测试名称
- 测试应该独立且可重复

## 📝 提交规范

### 提交消息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例
```
feat(vps): 添加VPS批量操作功能

- 支持批量启用/禁用VPS
- 添加批量删除确认对话框
- 优化批量操作的用户体验

Closes #123
```

## 🔍 代码审查

### Pull Request要求
- 清晰的标题和描述
- 关联相关的Issue
- 包含必要的测试
- 通过所有CI检查
- 至少一个审查者批准

### 审查清单
- [ ] 代码符合项目规范
- [ ] 功能正常工作
- [ ] 包含适当的测试
- [ ] 文档已更新
- [ ] 无安全问题
- [ ] 性能影响可接受

## 🚀 发布流程

### 版本管理
- 遵循[语义化版本](https://semver.org/)
- 主版本：不兼容的API更改
- 次版本：向后兼容的新功能
- 修订版：向后兼容的bug修复

### 发布步骤
1. 更新版本号
2. 更新CHANGELOG.md
3. 创建发布标签
4. 发布到npm（如适用）
5. 创建GitHub Release

## 📞 获取帮助

### 联系方式
- 创建Issue讨论功能或报告bug
- 参与GitHub Discussions
- 查看项目Wiki

### 资源链接
- [项目文档](README.md)
- [API文档](docs/API.md)
- [部署指南](DEPLOYMENT.md)
- [常见问题](docs/FAQ.md)

## 🎉 贡献者

感谢所有为项目做出贡献的开发者！

### 如何成为贡献者
1. 提交有意义的Pull Request
2. 帮助回答Issues中的问题
3. 改进文档和示例
4. 报告和修复bug
5. 提出有价值的功能建议

### 贡献者权益
- 在README中列出贡献者
- 获得项目徽章
- 参与项目决策讨论
- 优先获得新功能预览

---

再次感谢您的贡献！每一个贡献都让这个项目变得更好。 🙏
