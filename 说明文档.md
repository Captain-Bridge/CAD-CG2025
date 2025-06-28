# 青科智绘：CrownCAD NeurCADRecon+FlexiCubes 点云重建插件说明

## 插件功能概述

### 主要功能
本插件为CrownCAD提供了基于NeurCADRecon+FlexiCubes算法的专业点云重建功能，能够将点云数据转换为高质量的CAD表面模型。

**由于深度学习需要大显存GPU，而租赁带有公网IP的大显存GPU服务器相对昂贵，我们便没有实现部署，本次的演示视频也在本地进行演示。**

#### 1. 点云上传与处理
- **多格式支持**: PLY, XYZ, PTS, PCD, OBJ等主流点云格式
- **实时预览**: 基于Three.js的3D点云可视化

#### 2. NeurCAD+FlexiCubes智能重建
- **深度学习算法重建**: 基于NeurCADRecon算法通过点云计算有符号距离场(SDF)，而后使用FlexiCubes算法将SDF提取成Mesh网格，专针对CAD表面优化
- **SIREN网络架构**: 使用Sinusoidal Representation Networks确保高质量重建
- **参数可调**: 网络深度、维度、学习率等参数可灵活配置
- **实时进度**: 显示训练进度、损失变化、收敛状态

#### 3. 结果导出与集成
- **CAD集成**: 直接导入CrownCAD进行后续设计
- **质量评估**: 提供可视化对比

### 技术特色
- **智能重建**: 使用深度学习技术，实现无需法向量的自监督的点云重建
- **GPU加速**: 使用CUDA加速，大幅提升重建速度
- **算法稳定**: 基于成熟的NeurCADRecon算法，重建结果稳定可靠
- **用户友好**: 直观的Web界面，操作简单易用

## 数据集使用说明

### ABC数据集介绍

ABC (A Big CAD model dataset) 是一个大规模CAD模型数据集，专门用于CAD几何处理和机器学习研究。我们本次从中随机选择了一部分数据作为测试数据集。

#### 数据集特点
- **规模**: 包含数百万个CAD模型
- **格式**: 原始格式为STEP文件，已转换为PLY点云格式
- **质量**: 高质量的CAD表面，适合重建算法训练
- **多样性**: 涵盖各种几何形状和复杂度


## 前后端通信架构

### 技术栈概述
本插件采用前后端分离架构，通过RESTful API和Server-Sent Events实现实时通信：

#### 前端技术栈
- **Vue.js 2.6.10**: 响应式前端框架
- **Element UI**: 企业级UI组件库
- **Three.js**: WebGL 3D可视化引擎
- **Axios**: HTTP客户端库
- **EventSource**: 服务器发送事件(SSE)支持

#### 后端技术栈
- **Flask**: 轻量级Python Web框架
- **Flask-CORS**: 跨域资源共享支持
- **PyTorch**: 深度学习框架
- **Kaolin**: 3D深度学习库
- **NumPy/SciPy等**: 科学计算库

### 通信协议与接口

#### 1. RESTful API接口
```javascript
// 点云上传
POST /api/upload-pointcloud
Content-Type: multipart/form-data

// 获取上传文件列表
GET /api/list-uploaded-files

// 执行本地重建
POST /api/neurcad/execute-local
Content-Type: application/json
{
  "config": {...},
  "params": {...},
  "file_id": "..."
}

// 获取网格数据
GET /api/neurcad/get-mesh-data
```

#### 2. Server-Sent Events (SSE)
```javascript
// 建立SSE连接获取实时输出
const eventSource = new EventSource('/api/neurcad/stream-output?queue_id=xxx');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'output':    // 重建输出日志
    case 'progress':  // 进度更新
    case 'complete':  // 重建完成
    case 'error':     // 错误信息
  }
};
```

#### 3. 数据流架构
```
前端界面 → Vue.js组件 → Axios/EventSource → Flask API → NeurCAD算法 → 结果返回
```

## 环境要求与依赖

### Python环境配置

#### 1. CrownCAD虚拟环境
```bash
# 激活CrownCAD虚拟环境
conda activate CrownCAD

# 验证环境
python --version  # Python 3.7+
conda list | grep pytorch  # 确认PyTorch版本
```

#### 2. 核心依赖包

**深度学习框架**
```bash
# PyTorch (CUDA 11.8版本，兼容您的环境)
pip install torch==2.2.0+cu118 torchvision==0.17.0+cu118 torchaudio==2.2.0+cu118 --index-url https://download.pytorch.org/whl/cu118

# Kaolin (3D深度学习库)
pip install kaolin==0.17.0
```

**科学计算库**
```bash
# 数值计算
pip install numpy==1.21.6
pip install scipy==1.7.3

# 机器学习
pip install scikit-learn==1.0.2
```

**3D处理库**
```bash
# 网格处理
pip install trimesh==3.9.29
pip install open3d==0.13.0

# 点云处理
pip install plyfile==0.7.4
pip install pypcd4==0.1.0
```

**Web服务框架**
```bash
# Flask API服务器
pip install flask==2.0.3
pip install flask-cors==3.0.10

# 异步处理
pip install asyncio==3.4.3
```

**可视化与工具**
```bash
# 可视化
pip install matplotlib==3.5.3
pip install plotly==5.3.1

# 工具库
pip install tqdm==4.62.3
pip install requests==2.27.1
pip install pillow==8.4.0
```

#### 3. 完整requirements.txt
```txt
# 深度学习核心
torch==2.2.0+cu118
torchvision==0.17.0+cu118
torchaudio==2.2.0+cu118
kaolin==0.17.0

# 科学计算
numpy==1.21.6
scipy==1.7.3
scikit-learn==1.0.2

# 3D处理
trimesh==3.9.29
open3d==0.13.0
plyfile==0.7.4
pypcd4==0.1.0

# Web服务
flask==2.0.3
flask-cors==3.0.10
asyncio==3.4.3

# 可视化
matplotlib==3.5.3
plotly==5.3.1

# 工具库
tqdm==4.62.3
requests==2.27.1
pillow==8.4.0
```

### 前端环境配置

#### 1. Node.js环境
```bash
# 安装Node.js (推荐v16.x)
node --version  # 确认版本
npm --version   # 确认npm版本
```

#### 2. 前端依赖
```bash
# 安装项目依赖
npm install

# 核心依赖包括：
# - Vue.js 2.6.10 (前端框架)
# - Element UI (UI组件库)
# - Three.js (3D可视化)
# - Webpack (构建工具)
```

### 系统要求

#### 硬件要求
- **GPU**: NVIDIA GPU with CUDA support (推荐RTX 3060或更高)
- **显存**: 至少4GB显存 (推荐8GB+)
- **内存**: 至少8GB RAM (推荐16GB+)
- **存储**: 至少2GB可用空间

#### 软件要求
- **操作系统**: Linux (Ubuntu 18.04+), Windows 10+, macOS 10.15+
- **CUDA**: 11.8 (与PyTorch版本匹配)
- **浏览器**: Chrome 80+, Firefox 75+, Safari 13+

## 安装与配置

### 1. 环境准备
```bash
# 进入项目
cd plugin-sdk-demo

# 激活CrownCAD环境
conda activate CrownCAD

# 安装Python依赖
pip install -r requirements.txt
```

### 2. 前端构建
```bash
# 安装Node.js依赖
npm install

# 开发模式启动
npm run dev

```


## 使用指南

### 1. 插件加载
1. 启动CrownCAD
2. 加载插件文件
3. 选择"点云重建"功能模块

### 2. 点云上传
1. 点击"点云上传"标签
2. 选择点云文件 (支持PLY, XYZ, PTS等格式)
3. 预览点云数据
4. 确认上传

### 3. 参数配置
1. 切换到"NeurCAD重建"标签
2. 调整网络参数：
   - 网络深度: 2-4层
   - 隐藏层维度: 128-256
   - 学习率: 1e-6到1e-3
   - 网格分辨率: 128-256
3. 配置损失函数权重
4. 设置采样点数量

### 4. 开始重建
1. 点击"开始NeurCAD重建"
2. 监控重建进度
3. 查看实时损失变化
4. 等待重建完成

### 5. 结果处理
1. 预览重建结果
2. 评估重建质量
3. 选择导出格式
4. 保存到CAD或导出文件

## 性能优化建议

### 显存优化
- **网格分辨率**: 根据显存大小调整 (4GB显存建议128，8GB+可尝试256)
- **批处理大小**: 减少batch_size以降低显存占用
- **网络规模**: 降低隐藏层维度和深度

### 速度优化
- **GPU加速**: 确保CUDA环境正确配置
- **并行处理**: 支持多GPU并行计算
- **算法优化**: 使用多级重建策略

### 质量优化
- **参数调优**: 根据点云特征调整损失权重
- **预处理**: 确保点云质量和法向量准确性
- **后处理**: 应用网格平滑和优化算法

## 故障排除

### 常见问题

1. **CUDA内存不足**
   ```bash
   # 降低网格分辨率
   --grid_res 128
   
   # 减少网络规模
   --decoder_hidden_dim 128
   --decoder_n_hidden_layers 3
   ```

2. **依赖包冲突**
   ```bash
   # 重新安装PyTorch
   pip uninstall torch torchvision torchaudio
   pip install torch==2.2.0+cu118 torchvision==0.17.0+cu118 torchaudio==2.2.0+cu118 --index-url https://download.pytorch.org/whl/cu118
   ```

3. **API服务启动失败**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep 5000
   
   # 检查Python环境
   which python
   python --version
   ```

### 调试工具
- **浏览器控制台**: 查看前端错误
- **Python日志**: 查看后端错误
- **GPU监控**: 使用nvidia-smi监控显存使用



## 许可证与支持

- **NeurCADRecon算法**: MIT License
- **插件代码**: 遵循项目原有许可证
- **技术支持**: 请联系开发团队获取支持
