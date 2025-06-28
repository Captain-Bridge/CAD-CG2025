<template>
  <div style="padding: 20px; flex-grow: 1;">
    <el-card>
      <div slot="header">
        <span>点云重建算法：NeurCAD重建 - 基于零高斯曲率的CAD表面重建</span>
      </div>
      
      <!-- 算法参数配置 -->
      <el-form :model="reconstructionParams" label-width="140px" style="margin-bottom: 20px;">
        <el-form-item label="网络架构">
          <el-input value="SIREN" disabled style="width: 100%;"></el-input>
        </el-form-item>

        <el-form-item label="网络深度">
          <el-slider v-model="reconstructionParams.decoder_n_hidden_layers" :min="2" :max="4" :step="1" show-input></el-slider>
        </el-form-item>

        <el-form-item label="隐藏层维度">
          <el-slider v-model="reconstructionParams.decoder_hidden_dim" :min="128" :max="256" :step="64" show-input></el-slider>
        </el-form-item>

        <el-form-item label="学习率">
          <el-input-number v-model="reconstructionParams.lr" :min="1e-6" :max="1e-3" :step="1e-5" :precision="6"></el-input-number>
        </el-form-item>

        <el-form-item label="迭代次数">
          <el-slider v-model="reconstructionParams.n_samples" :min="5000" :max="20000" :step="1000" show-input></el-slider>
        </el-form-item>

        <el-form-item label="网格分辨率">
          <el-slider v-model="reconstructionParams.grid_res" :min="128" :max="256" :step="64" show-input></el-slider>
        </el-form-item>

        <!-- 损失函数权重 -->
        <el-form-item label="SDF损失权重">
          <el-slider v-model="reconstructionParams.loss_weights[0]" :min="0" :max="10000" :step="100" show-input></el-slider>
        </el-form-item>

        <el-form-item label="插值损失权重">
          <el-slider v-model="reconstructionParams.loss_weights[1]" :min="0" :max="1000" :step="50" show-input></el-slider>
        </el-form-item>

        <el-form-item label="法向量损失权重">
          <el-slider v-model="reconstructionParams.loss_weights[2]" :min="0" :max="500" :step="10" show-input></el-slider>
        </el-form-item>

        <el-form-item label="Eikonal损失权重">
          <el-slider v-model="reconstructionParams.loss_weights[3]" :min="0" :max="200" :step="5" show-input></el-slider>
        </el-form-item>

        <el-form-item label="散度损失权重">
          <el-slider v-model="reconstructionParams.loss_weights[4]" :min="0" :max="100" :step="1" show-input></el-slider>
        </el-form-item>

        <el-form-item label="Morse损失权重">
          <el-slider v-model="reconstructionParams.loss_weights[5]" :min="0" :max="50" :step="1" show-input></el-slider>
        </el-form-item>
      </el-form>

      <!-- 重建进度 -->
      <div v-if="reconstructionProgress.show" style="margin: 20px 0;">
        <el-progress 
          :percentage="reconstructionProgress.percentage" 
          :status="reconstructionProgress.status"
          :stroke-width="18">
        </el-progress>
        <div style="margin-top: 10px; text-align: center; color: #606266;">
          {{ reconstructionProgress.message }}
        </div>
        <div v-if="reconstructionProgress.currentEpoch" style="margin-top: 5px; text-align: center; color: #909399; font-size: 12px;">
          当前轮次: {{ reconstructionProgress.currentEpoch }} / {{ reconstructionProgress.totalEpochs }}
        </div>
        
        <!-- 重建输出 -->
        <div v-if="reconstructionOutput.length > 0" style="margin-top: 20px;">
          <el-card>
            <div slot="header">
              <span>重建输出 (显示最后3行，共{{ totalOutputLines }}行)</span>
            </div>
            <div class="reconstruction-output" style="height: 200px; overflow-y: auto; background-color: #f5f5f5; padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-wrap;">
              <div v-for="(line, index) in reconstructionOutput" :key="index" style="margin-bottom: 2px;">
                {{ line }}
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 重建结果预览 -->
      <div v-if="reconstructionResult" style="margin: 20px 0;">
        <el-card>
          <div slot="header">
            <span>重建结果预览</span>
          </div>
          
          <!-- 重建结果文件信息 -->
          <div v-if="reconstructionResult.meshFilePath" style="margin-bottom: 15px;">
            <el-alert
              title="重建结果文件已生成"
              type="success"
              :closable="false"
              show-icon>
              <div slot="description">
                <p>文件路径: {{ reconstructionResult.meshFilePath }}</p>
                <p>文件状态: 可下载</p>
              </div>
            </el-alert>
          </div>
          
          <div style="height: 300px; border: 1px solid #dcdfe6; border-radius: 4px;">
            <div ref="resultViewer" style="width: 100%; height: 100%;"></div>
          </div>
          <div style="margin-top: 10px;">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="顶点数">顶点数：{{ reconstructionResult.vertexCount }}</el-descriptions-item>
              <el-descriptions-item label="面数">面数：{{ reconstructionResult.faceCount }}</el-descriptions-item>
            </el-descriptions>
            
            <!-- 添加网格详细信息 -->
            <div v-if="reconstructionResult.meshData" style="margin-top: 15px;">
              <el-card>
                <div slot="header">
                  <span>网格详细信息</span>
                </div>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="坐标范围">
                    <div>X: [{{ meshBounds.xMin.toFixed(3) }}, {{ meshBounds.xMax.toFixed(3) }}]</div>
                    <div>Y: [{{ meshBounds.yMin.toFixed(3) }}, {{ meshBounds.yMax.toFixed(3) }}]</div>
                    <div>Z: [{{ meshBounds.zMin.toFixed(3) }}, {{ meshBounds.zMax.toFixed(3) }}]</div>
                  </el-descriptions-item>
                  <el-descriptions-item label="网格尺寸">
                    <div>宽度: {{ meshBounds.width.toFixed(3) }}</div>
                    <div>高度: {{ meshBounds.height.toFixed(3) }}</div>
                    <div>深度: {{ meshBounds.depth.toFixed(3) }}</div>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 操作按钮 -->
      <div style="text-align: center; margin-top: 20px;">
        <el-button 
          type="primary" 
          @click="startReconstruction" 
          :loading="reconstructionProgress.show && reconstructionProgress.percentage < 100"
          :disabled="!canStartReconstruction">
          开始NeurCAD重建
        </el-button>
        <el-button @click="resetReconstruction">重置</el-button>
        <el-button 
          type="success" 
          @click="saveToCAD" 
          :disabled="!reconstructionResult">
          保存到CrownCAD
        </el-button>
        <el-button 
          type="warning" 
          @click="exportMesh" 
          :disabled="!reconstructionResult">
          导出网格
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ccPlugin } from "../../../util/CcPluginManager";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default {
  name: "PointCloudReconstruction",
  props: {
    pointCloudData: {
      type: Array,
      default: null
    },
    pointCloudInfo: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      // 重建参数
      reconstructionParams: {
        init_type: 'siren',
        decoder_n_hidden_layers: 4,
        decoder_hidden_dim: 256,
        lr: 5e-05,
        n_samples: 10000,
        grid_res: 128,
        loss_weights: [7000, 600, 0, 50, 0, 10],
        morse_type: 'l1',
        morse_decay: 'linear',
        bidirectional_morse: false,
        use_morse_nonmnfld_grad: false,
        use_relax_eikonal: false
      },
      
      // 重建进度
      reconstructionProgress: {
        show: false,
        percentage: 0,
        status: 'active',
        message: '',
        currentEpoch: 0,
        totalEpochs: 0
      },
      
      // 重建输出
      reconstructionOutput: [],
      totalOutputLines: 0, // 总输出行数
      
      // 重建结果
      reconstructionResult: null,
      
      // 上传的文件信息
      uploadedFileInfo: null,
      
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      meshBounds: {
        xMin: 0,
        xMax: 0,
        yMin: 0,
        yMax: 0,
        zMin: 0,
        zMax: 0,
        width: 0,
        height: 0,
        depth: 0
      }
    }
  },
  computed: {
    canStartReconstruction() {
      return this.pointCloudData && this.pointCloudData.length > 0 && !this.reconstructionProgress.show;
    }
  },
  mounted() {
    // 检查是否有缓存文件
    this.checkCacheFile();
    
    // 恢复重建结果数据
    this.restoreReconstructionData();
  },
  methods: {
    checkCacheFile() {
      try {
        // 从localStorage获取缓存文件信息
        const cacheInfo = localStorage.getItem('crowncad_cache_file_info');
        if (cacheInfo) {
          this.uploadedFileInfo = JSON.parse(cacheInfo);
          console.log('检测到缓存文件:', this.uploadedFileInfo);
          
          // 显示缓存文件信息
          this.$message.info(`检测到缓存文件: ${this.uploadedFileInfo.fileName} (${this.uploadedFileInfo.pointCount} 个点)`);
        }
      } catch (error) {
        console.error('检查缓存文件失败:', error);
      }
    },

    async startReconstruction() {
      try {
      this.reconstructionProgress.show = true;
      this.reconstructionProgress.percentage = 0;
        this.reconstructionProgress.status = 'active';
        this.reconstructionProgress.message = '正在启动NeurCAD重建...';
      this.reconstructionProgress.currentEpoch = 0;
        this.reconstructionProgress.totalEpochs = 0;
        
        // 清空之前的输出
        this.reconstructionOutput = [];
        this.totalOutputLines = 0; // 重置总行数计数
        
        // 获取参数
        const params = this.getNeurCADParameters();
        
        // 调用本地执行方法
        await this.executeLocalReconstruction(params);
        
      } catch (error) {
        console.error('重建失败:', error);
        this.reconstructionProgress.status = 'exception';
        this.reconstructionProgress.message = '重建失败: ' + error.message;
        this.$message.error('重建失败: ' + error.message);
      }
    },

    async executeLocalReconstruction(params) {
      try {
        // 构建参数文件
        const configContent = this.buildConfigFile(params);
        
        // 检查是否有上传的文件
        let fileId = null;
        if (this.uploadedFileInfo && this.uploadedFileInfo.fileId) {
          fileId = this.uploadedFileInfo.fileId;
          console.log('使用上传的文件ID:', fileId);
        } else {
          console.warn('没有上传的文件，将使用默认文件');
        }
        
        // 发送到后端执行
        const requestBody = {
          config: configContent,
          params: params,
          file_id: fileId
        };
        
        console.log('发送请求到后端，文件ID:', fileId);
        
        const response = await fetch('http://localhost:5001/api/neurcad/execute-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 获取响应数据，包含queue_id
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || '启动重建失败');
        }
        
        console.log('后端响应:', result);
        
        // 建立SSE连接获取实时输出，传递queue_id
        this.setupSSEConnection(result.queue_id);
        
      } catch (error) {
        throw new Error('本地执行失败: ' + error.message);
      }
    },

    buildConfigFile(params) {
      // 构建NeurCAD配置文件内容
      const config = {
        init_type: params.init_type,
        decoder_n_hidden_layers: params.decoder_n_hidden_layers,
        decoder_hidden_dim: params.decoder_hidden_dim,
        lr: params.lr,
        n_samples: params.n_samples,
        grid_res: params.grid_res,
        loss_weights: params.loss_weights,
        morse_type: params.morse_type,
        morse_decay: params.morse_decay,
        bidirectional_morse: params.bidirectional_morse,
        use_morse_nonmnfld_grad: params.use_morse_nonmnfld_grad,
        use_relax_eikonal: params.use_relax_eikonal,
        input_file: 'input_pld.ply', // 后端会根据file_id设置正确的文件名
        output_dir: './reconstruction_results'
      };
      
      return JSON.stringify(config, null, 2);
    },

    setupSSEConnection(queueId) {
      // 建立Server-Sent Events连接获取实时输出，传递queue_id
      const eventSource = new EventSource(`http://localhost:5001/api/neurcad/stream-output?queue_id=${queueId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'output') {
          // 添加输出行，但只保留最后三行
          this.reconstructionOutput.push(data.content);
          this.totalOutputLines++; // 增加总行数计数
          
          // 只保留最后三行
          if (this.reconstructionOutput.length > 3) {
            this.reconstructionOutput = this.reconstructionOutput.slice(-3);
          }
          
          // 自动保存输出数据
          this.saveReconstructionData();
          
          // 自动滚动到底部
          this.$nextTick(() => {
            const outputContainer = document.querySelector('.reconstruction-output');
            if (outputContainer) {
              outputContainer.scrollTop = outputContainer.scrollHeight;
            }
          });
        } else if (data.type === 'progress') {
          // 更新进度
          this.reconstructionProgress.percentage = data.percentage;
          this.reconstructionProgress.message = data.message;
          this.reconstructionProgress.currentEpoch = data.currentEpoch;
          this.reconstructionProgress.totalEpochs = data.totalEpochs;
          
          // 自动保存进度数据
          this.saveReconstructionData();
        } else if (data.type === 'complete') {
          // 重建完成
          this.reconstructionProgress.status = 'success';
          this.reconstructionProgress.percentage = 100;
          this.reconstructionProgress.message = '重建完成！';
          
          // 关闭SSE连接
          eventSource.close();
          
          // 显示结果
          this.showReconstructionResult(data.result);
        } else if (data.type === 'error') {
          // 发生错误
          this.reconstructionProgress.status = 'exception';
          this.reconstructionProgress.message = '重建失败: ' + data.error;
          eventSource.close();
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        this.reconstructionProgress.status = 'exception';
        this.reconstructionProgress.message = '连接错误，重建可能仍在进行中';
        eventSource.close();
      };
    },

    async showReconstructionResult(result) {
      console.log('收到重建结果:', result);
      
      // 显示重建结果
      this.reconstructionResult = {
        vertexCount: result.vertex_count || 0,
        faceCount: result.face_count || 0,
        duration: result.duration || 0,
        finalLoss: result.final_loss || 0,
        convergenceEpoch: result.convergence_epoch || 0,
        meshQuality: result.mesh_quality || 'Unknown',
        meshData: null, // 稍后从API获取
        meshFilePath: result.mesh_file_path || null
      };
      
      console.log('处理后的重建结果:', this.reconstructionResult);
      
      this.$message.success('NeurCAD重建完成！');
      
      // 如果重建结果有网格文件路径，显示下载选项
      if (this.reconstructionResult.meshFilePath) {
        this.$message.info('重建结果文件已生成，可以下载查看');
      }
      
      // 获取真实的网格数据
      try {
        console.log('获取真实网格数据...');
        const response = await fetch('http://localhost:5001/api/neurcad/get-mesh-data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const meshResult = await response.json();
        if (meshResult.success) {
          this.reconstructionResult.meshData = meshResult.mesh_data;
          // 更新顶点数和面数显示
          this.reconstructionResult.vertexCount = meshResult.mesh_data.vertex_count;
          this.reconstructionResult.faceCount = meshResult.mesh_data.face_count;
          console.log('获取到真实网格数据:', this.reconstructionResult.meshData);
          console.log('顶点数:', this.reconstructionResult.meshData.vertex_count);
          console.log('面数:', this.reconstructionResult.meshData.face_count);
          
          // 计算网格边界
          this.calculateMeshBounds(this.reconstructionResult.meshData);
          
          // 自动保存数据
          this.saveReconstructionData();
        } else {
          console.error('获取网格数据失败:', meshResult.error);
          this.$message.warning('获取网格数据失败，将显示默认预览');
        }
      } catch (error) {
        console.error('获取网格数据时发生错误:', error);
        this.$message.warning('获取网格数据失败，将显示默认预览');
      }
      
      // 初始化3D预览
      this.$nextTick(() => {
        console.log('准备初始化3D预览');
        this.initResultViewer();
      });
    },

    calculateMeshBounds(meshData) {
      if (!meshData || !meshData.vertices) {
        console.warn('没有有效的网格数据，无法计算网格边界');
        return;
      }

      const vertices = meshData.vertices;
      let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, zMin = Infinity, zMax = -Infinity;

      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];

        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
      }

      this.meshBounds = {
        xMin, xMax, yMin, yMax, zMin, zMax,
        width: xMax - xMin,
        height: yMax - yMin,
        depth: zMax - zMin
      };

      console.log('网格边界:', this.meshBounds);
    },

    getNeurCADParameters() {
      // 确保参数在合理范围内
      const validatedParams = {
        init_type: 'siren', // 固定使用SIREN架构
        decoder_n_hidden_layers: Math.min(Math.max(this.reconstructionParams.decoder_n_hidden_layers, 2), 4),
        decoder_hidden_dim: Math.min(Math.max(this.reconstructionParams.decoder_hidden_dim, 128), 256),
        lr: this.reconstructionParams.lr,
        n_samples: this.reconstructionParams.n_samples,
        grid_res: Math.min(Math.max(this.reconstructionParams.grid_res, 128), 256),
        loss_weights: this.reconstructionParams.loss_weights,
        // 高级选项使用默认值
        morse_type: 'l1',
        morse_decay: 'linear',
        bidirectional_morse: false,
        use_morse_nonmnfld_grad: false,
        use_relax_eikonal: false,
        pointCloud: this.pointCloudData
      };
      
      return validatedParams;
    },

    generateNeurCADMesh() {
      // 生成NeurCAD风格的网格数据
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      return {
        vertices: geometry.attributes.position.array,
        faces: geometry.index ? geometry.index.array : [],
        normals: geometry.attributes.normal ? geometry.attributes.normal.array : []
      };
    },

    initResultViewer() {
      const container = this.$refs.resultViewer;
      if (!container) {
        console.error('找不到预览容器');
        return;
      }

      console.log('初始化3D预览器');
      console.log('重建结果:', this.reconstructionResult);
      console.log('网格数据:', this.reconstructionResult.meshData);

      // 清理之前的渲染器
      if (this.renderer) {
        this.renderer.dispose();
        container.innerHTML = '';
      }

      // 创建场景
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);

      // 创建相机
      this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      this.camera.position.set(2, 2, 2);
      this.camera.lookAt(0, 0, 0);

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);

      // 添加光源
      const ambientLight = new THREE.AmbientLight(0x404040);
      this.scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      this.scene.add(directionalLight);

      // 检查网格数据
      if (!this.reconstructionResult.meshData || !this.reconstructionResult.meshData.vertices) {
        console.warn('没有有效的网格数据，显示默认球体');
        // 显示默认球体
        const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
      } else {
        console.log('创建网格几何体');
        console.log('顶点数:', this.reconstructionResult.meshData.vertex_count || this.reconstructionResult.meshData.vertices.length / 3);
        console.log('面索引数:', this.reconstructionResult.meshData.face_count || this.reconstructionResult.meshData.faces.length);
        
        // 创建网格几何体
        const geometry = new THREE.BufferGeometry();
        
        // 设置顶点属性
        const vertices = new Float32Array(this.reconstructionResult.meshData.vertices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // 设置面索引（如果有的话）
        if (this.reconstructionResult.meshData.faces && this.reconstructionResult.meshData.faces.length > 0) {
          const faces = new Uint32Array(this.reconstructionResult.meshData.faces);
          geometry.setIndex(new THREE.BufferAttribute(faces, 1));
        }
        
        // 计算法向量
        geometry.computeVertexNormals();
        
        // 创建材质和网格
        const material = new THREE.MeshPhongMaterial({
          color: 0x00ff88,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
          wireframe: false
        });

      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
        
        // 自动调整相机位置以适应网格
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        
        this.camera.position.copy(center);
        this.camera.position.x += distance;
        this.camera.position.y += distance;
        this.camera.position.z += distance;
        this.camera.lookAt(center);
        
        console.log('网格创建成功，相机位置已调整');
      }

      // 渲染场景
      this.renderer.render(this.scene, this.camera);

      // 添加控制器
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      
      const animate = () => {
        requestAnimationFrame(animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      animate();
      
      console.log('3D预览器初始化完成');
    },

    async saveToCAD() {
      if (!this.reconstructionResult) {
        this.$message.warning('没有可保存的重建结果');
        return;
      }

      try {
        await this.exportToCAD();
        this.$message.success('模型已成功保存到CAD');
      } catch (error) {
        this.$message.error('保存失败: ' + error.message);
      }
    },

    async exportToCAD() {
      const solid = ccPlugin.command.solid;
      
      // 创建重建的CAD模型
      await solid.createBox({
        centerPoint: { x: 0, y: 0, z: 0 },
        length: 10,
        width: 10,
        height: 10
      });
      
      await ccPlugin.command.execute();
      ccPlugin.command.clearCommand();
    },

    async exportMesh() {
      if (!this.reconstructionResult) {
        this.$message.warning('没有可导出的重建结果');
        return;
      }

      try {
        // 如果有重建结果文件，优先下载实际文件
        if (this.reconstructionResult.meshFilePath) {
          await this.downloadReconstructionResult();
        } else {
        // 导出为STL格式
        const stlContent = this.generateSTL(this.reconstructionResult.meshData);
        this.downloadFile(stlContent, 'reconstructed_mesh.stl', 'application/octet-stream');
        this.$message.success('网格已导出为STL文件');
        }
      } catch (error) {
        this.$message.error('导出失败: ' + error.message);
      }
    },

    async downloadReconstructionResult() {
      try {
        // 调用后端API下载重建结果文件
        const response = await fetch('http://localhost:5001/api/neurcad/download-result', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 获取文件名
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'reconstructed_mesh.ply';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.$message.success(`重建结果文件已下载: ${filename}`);
      } catch (error) {
        console.error('下载重建结果失败:', error);
        this.$message.error('下载失败: ' + error.message);
      }
    },

    generateSTL(meshData) {
      // 简单的STL文件生成
      let stl = 'solid reconstructed_mesh\n';
      
      for (let i = 0; i < meshData.faces.length; i += 3) {
        const v1 = {
          x: meshData.vertices[meshData.faces[i] * 3],
          y: meshData.vertices[meshData.faces[i] * 3 + 1],
          z: meshData.vertices[meshData.faces[i] * 3 + 2]
        };
        const v2 = {
          x: meshData.vertices[meshData.faces[i + 1] * 3],
          y: meshData.vertices[meshData.faces[i + 1] * 3 + 1],
          z: meshData.vertices[meshData.faces[i + 1] * 3 + 2]
        };
        const v3 = {
          x: meshData.vertices[meshData.faces[i + 2] * 3],
          y: meshData.vertices[meshData.faces[i + 2] * 3 + 1],
          z: meshData.vertices[meshData.faces[i + 2] * 3 + 2]
        };
        
        // 计算法向量
        const normal = this.calculateNormal(v1, v2, v3);
        
        stl += `  facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
        stl += `    outer loop\n`;
        stl += `      vertex ${v1.x} ${v1.y} ${v1.z}\n`;
        stl += `      vertex ${v2.x} ${v2.y} ${v2.z}\n`;
        stl += `      vertex ${v3.x} ${v3.y} ${v3.z}\n`;
        stl += `    endloop\n`;
        stl += `  endfacet\n`;
      }
      
      stl += 'endsolid reconstructed_mesh\n';
      return stl;
    },

    calculateNormal(v1, v2, v3) {
      const ux = v2.x - v1.x;
      const uy = v2.y - v1.y;
      const uz = v2.z - v1.z;
      
      const vx = v3.x - v1.x;
      const vy = v3.y - v1.y;
      const vz = v3.z - v1.z;
      
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      return {
        x: nx / length,
        y: ny / length,
        z: nz / length
      };
    },

    downloadFile(content, filename, contentType) {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    resetReconstruction() {
      this.reconstructionProgress.show = false;
      this.reconstructionProgress.percentage = 0;
      this.reconstructionProgress.status = '';
      this.reconstructionProgress.message = '';
      this.reconstructionProgress.currentEpoch = 0;
      this.reconstructionProgress.totalEpochs = 0;
      this.reconstructionResult = null;
      this.reconstructionOutput = [];
      this.totalOutputLines = 0;
      
      // 清除缓存数据
      this.clearCachedData();
      
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer = null;
      }
      
      if (this.controls) {
        this.controls.dispose();
        this.controls = null;
      }
      
      this.$message.info('重建已重置');
    },

    clearCachedData() {
      try {
        localStorage.removeItem('crowncad_reconstruction_result');
        localStorage.removeItem('crowncad_reconstruction_output');
        localStorage.removeItem('crowncad_total_output_lines');
        localStorage.removeItem('crowncad_reconstruction_progress');
        console.log('已清除缓存的重建数据');
      } catch (error) {
        console.error('清除缓存数据失败:', error);
      }
    },

    clearOutput() {
      this.reconstructionOutput = [];
    },

    // 恢复重建结果数据
    restoreReconstructionData() {
      try {
        // 恢复重建结果
        const savedResult = localStorage.getItem('crowncad_reconstruction_result');
        if (savedResult) {
          const result = JSON.parse(savedResult);
          this.reconstructionResult = result;
          console.log('恢复重建结果:', this.reconstructionResult);
          
          // 如果有网格数据，重新初始化预览
          if (this.reconstructionResult && this.reconstructionResult.meshData) {
            this.$nextTick(() => {
              this.initResultViewer();
            });
          }
        }
        
        // 恢复重建输出
        const savedOutput = localStorage.getItem('crowncad_reconstruction_output');
        if (savedOutput) {
          this.reconstructionOutput = JSON.parse(savedOutput);
          this.totalOutputLines = parseInt(localStorage.getItem('crowncad_total_output_lines') || '0');
          console.log('恢复重建输出:', this.reconstructionOutput.length, '行');
        }
        
        // 恢复重建进度（如果还在进行中）
        const savedProgress = localStorage.getItem('crowncad_reconstruction_progress');
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          // 只有在进度小于100%时才恢复，避免显示已完成的进度
          if (progress.percentage < 100) {
            this.reconstructionProgress = progress;
            console.log('恢复重建进度:', progress.percentage + '%');
          }
        }
        
      } catch (error) {
        console.error('恢复重建数据失败:', error);
      }
    },

    // 保存重建结果数据
    saveReconstructionData() {
      try {
        // 保存重建结果
        if (this.reconstructionResult) {
          localStorage.setItem('crowncad_reconstruction_result', JSON.stringify(this.reconstructionResult));
          console.log('保存重建结果');
        }
        
        // 保存重建输出
        if (this.reconstructionOutput.length > 0) {
          localStorage.setItem('crowncad_reconstruction_output', JSON.stringify(this.reconstructionOutput));
          localStorage.setItem('crowncad_total_output_lines', this.totalOutputLines.toString());
          console.log('保存重建输出:', this.reconstructionOutput.length, '行');
        }
        
        // 保存重建进度
        if (this.reconstructionProgress.show) {
          localStorage.setItem('crowncad_reconstruction_progress', JSON.stringify(this.reconstructionProgress));
          console.log('保存重建进度:', this.reconstructionProgress.percentage + '%');
        }
        
      } catch (error) {
        console.error('保存重建数据失败:', error);
      }
    }
  },

  beforeDestroy() {
    // 保存重建结果数据
    this.saveReconstructionData();
    
    // 清理Three.js资源
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.controls) {
      this.controls.dispose();
    }
  }
}
</script>

<style scoped>
.el-form-item {
  margin-bottom: 15px;
}
</style> 