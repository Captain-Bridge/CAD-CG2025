/**
 * NeurCADRecon 服务
 * 用于集成NeurCADRecon点云重建算法
 */

class NeurCADReconService {
  constructor() {
    this.isInitialized = false;
    this.worker = null;
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      // 检查WebAssembly支持
      if (typeof WebAssembly === 'undefined') {
        throw new Error('浏览器不支持WebAssembly');
      }

      // 检查WebGL支持
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        throw new Error('浏览器不支持WebGL');
      }

      // 初始化Web Worker（如果使用）
      if (typeof Worker !== 'undefined') {
        this.worker = new Worker('/js/neurcad-worker.js');
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
      }

      this.isInitialized = true;
      console.log('NeurCADRecon服务初始化成功');
      return true;
    } catch (error) {
      console.error('NeurCADRecon服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行点云重建
   * @param {Object} params 重建参数
   * @param {Array} params.pointCloud 点云数据
   * @param {Object} params.algorithmParams 算法参数
   * @param {Function} params.progressCallback 进度回调
   */
  async reconstruct(params) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { pointCloud, algorithmParams, progressCallback } = params;

    try {
      // 预处理点云数据
      const preprocessedData = this.preprocessPointCloud(pointCloud);
      
      // 调用重建算法
      const result = await this.performReconstruction(preprocessedData, algorithmParams, progressCallback);
      
      return result;
    } catch (error) {
      console.error('重建失败:', error);
      throw error;
    }
  }

  /**
   * 预处理点云数据
   * @param {Array} pointCloud 原始点云数据
   */
  preprocessPointCloud(pointCloud) {
    // 计算边界框
    const minX = Math.min(...pointCloud.map(p => p.x));
    const maxX = Math.max(...pointCloud.map(p => p.x));
    const minY = Math.min(...pointCloud.map(p => p.y));
    const maxY = Math.max(...pointCloud.map(p => p.y));
    const minZ = Math.min(...pointCloud.map(p => p.z));
    const maxZ = Math.max(...pointCloud.map(p => p.z));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const scale = Math.max(maxX - minX, maxY - minY, maxZ - minZ);

    // 归一化到[-0.5, 0.5]范围
    const normalizedPoints = pointCloud.map(point => ({
      x: (point.x - centerX) / scale,
      y: (point.y - centerY) / scale,
      z: (point.z - centerZ) / scale
    }));

    return {
      points: normalizedPoints,
      originalCenter: { x: centerX, y: centerY, z: centerZ },
      originalScale: scale,
      bounds: { minX, maxX, minY, maxY, minZ, maxZ }
    };
  }

  /**
   * 执行重建算法
   * @param {Object} preprocessedData 预处理后的数据
   * @param {Object} algorithmParams 算法参数
   * @param {Function} progressCallback 进度回调
   */
  async performReconstruction(preprocessedData, algorithmParams, progressCallback) {
    // 这里集成您的NeurCADRecon算法
    // 方案1: 使用WebAssembly
    if (this.useWebAssembly) {
      return await this.reconstructWithWebAssembly(preprocessedData, algorithmParams, progressCallback);
    }
    
    // 方案2: 使用Web Worker
    if (this.worker) {
      return await this.reconstructWithWorker(preprocessedData, algorithmParams, progressCallback);
    }
    
    // 方案3: 使用后端API
    return await this.reconstructWithAPI(preprocessedData, algorithmParams, progressCallback);
  }

  /**
   * 使用WebAssembly进行重建
   */
  async reconstructWithWebAssembly(preprocessedData, algorithmParams, progressCallback) {
    try {
      // 加载NeurCADRecon WebAssembly模块
      const module = await this.loadNeurCADModule();
      
      // 准备输入数据
      const inputData = this.prepareInputData(preprocessedData, algorithmParams);
      
      // 调用重建函数
      const result = await module.reconstruct(inputData, progressCallback);
      
      return this.postprocessResult(result, preprocessedData);
    } catch (error) {
      throw new Error(`WebAssembly重建失败: ${error.message}`);
    }
  }

  /**
   * 使用Web Worker进行重建
   */
  async reconstructWithWorker(preprocessedData, algorithmParams, progressCallback) {
    return new Promise((resolve, reject) => {
      const messageId = Date.now();
      
      // 设置消息处理器
      const messageHandler = (event) => {
        if (event.data.id === messageId) {
          if (event.data.type === 'progress') {
            progressCallback(event.data.progress);
          } else if (event.data.type === 'result') {
            this.worker.removeEventListener('message', messageHandler);
            resolve(this.postprocessResult(event.data.result, preprocessedData));
          } else if (event.data.type === 'error') {
            this.worker.removeEventListener('message', messageHandler);
            reject(new Error(event.data.error));
          }
        }
      };
      
      this.worker.addEventListener('message', messageHandler);
      
      // 发送重建请求
      this.worker.postMessage({
        id: messageId,
        type: 'reconstruct',
        data: preprocessedData,
        params: algorithmParams
      });
    });
  }

  /**
   * 使用后端API进行重建
   */
  async reconstructWithAPI(preprocessedData, algorithmParams, progressCallback) {
    try {
      const response = await fetch('/api/neurcad-reconstruct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pointCloud: preprocessedData.points,
          algorithmParams: algorithmParams
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      return this.postprocessResult(result, preprocessedData);
    } catch (error) {
      throw new Error(`API重建失败: ${error.message}`);
    }
  }

  /**
   * 准备输入数据
   */
  prepareInputData(preprocessedData, algorithmParams) {
    return {
      points: preprocessedData.points,
      n_samples: algorithmParams.n_samples || 10000,
      grid_res: algorithmParams.grid_res || 256,
      init_type: algorithmParams.init_type || 'siren',
      decoder_hidden_dim: algorithmParams.decoder_hidden_dim || 256,
      decoder_n_hidden_layers: algorithmParams.decoder_n_hidden_layers || 4,
      lr: algorithmParams.lr || 5e-5,
      loss_weights: algorithmParams.loss_weights || [7e3, 6e2, 1e2, 5e1, 0, 10],
      morse_type: algorithmParams.morse_type || 'l1',
      morse_decay: algorithmParams.morse_decay || 'linear',
      bidirectional_morse: algorithmParams.bidirectional_morse || false,
      use_morse_nonmnfld_grad: algorithmParams.use_morse_nonmnfld_grad || false,
      use_relax_eikonal: algorithmParams.use_relax_eikonal || false
    };
  }

  /**
   * 后处理结果
   */
  postprocessResult(result, preprocessedData) {
    // 将结果转换回原始坐标系
    const { originalCenter, originalScale } = preprocessedData;
    
    if (result.vertices) {
      result.vertices = result.vertices.map(vertex => ({
        x: vertex.x * originalScale + originalCenter.x,
        y: vertex.y * originalScale + originalCenter.y,
        z: vertex.z * originalScale + originalCenter.z
      }));
    }

    return {
      ...result,
      metadata: {
        originalCenter,
        originalScale,
        algorithm: 'NeurCADRecon',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 处理Worker消息
   */
  handleWorkerMessage(event) {
    // Worker消息处理逻辑
    console.log('Worker消息:', event.data);
  }

  /**
   * 加载NeurCAD模块
   */
  async loadNeurCADModule() {
    // 这里加载编译好的NeurCADRecon WebAssembly模块
    // 实际实现时需要将NeurCADRecon编译为WebAssembly
    throw new Error('NeurCADRecon WebAssembly模块尚未实现');
  }

  /**
   * 检查GPU支持
   */
  checkGPUSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return { supported: false, reason: 'WebGL不支持' };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
    
    return {
      supported: true,
      renderer: renderer,
      webglVersion: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
    };
  }

  /**
   * 获取算法参数模板
   */
  getAlgorithmTemplates() {
    return {
      fast: {
        n_samples: 5000,
        grid_res: 128,
        decoder_hidden_dim: 128,
        decoder_n_hidden_layers: 3,
        lr: 1e-4
      },
      balanced: {
        n_samples: 10000,
        grid_res: 256,
        decoder_hidden_dim: 256,
        decoder_n_hidden_layers: 4,
        lr: 5e-5
      },
      high_quality: {
        n_samples: 20000,
        grid_res: 512,
        decoder_hidden_dim: 512,
        decoder_n_hidden_layers: 6,
        lr: 1e-5
      }
    };
  }

  /**
   * 销毁服务
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }
}

// 创建单例实例
const neurCADReconService = new NeurCADReconService();

export default neurCADReconService; 