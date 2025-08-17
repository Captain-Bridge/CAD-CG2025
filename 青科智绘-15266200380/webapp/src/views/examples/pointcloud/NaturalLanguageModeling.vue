<template>
  <div class="nl-modeling">
    <!-- 自然语言输入 -->
    <el-card class="input-card">
      <div slot="header">
        <span>自然语言建模</span>
        <el-button style="float: right" type="text" @click="showExamples = !showExamples">
          {{ showExamples ? '隐藏' : '显示' }}示例
        </el-button>
      </div>
      
      <el-input
        v-model="modelDescription"
        type="textarea"
        :rows="4"
        placeholder="请描述您要创建的模型，例如：'一个长10cm、宽5cm、高3cm的长方体' 或 '一个长15cm、宽10cm、高5cm的大圆角长方体' 或 '一个长18cm、宽12cm、高6cm、圆角半径2cm的长方体'"
        @input="parseDescription"
      />
      
      <!-- 示例展示 -->
      <el-collapse-transition>
        <div v-show="showExamples" class="examples-section">
          <h4>示例描述：</h4>
          <el-tag 
            v-for="example in examples" 
            :key="example.id"
            @click="useExample(example)"
            style="margin: 5px; cursor: pointer;"
          >
            {{ example.description }}
          </el-tag>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 解析结果 -->
    <el-card v-if="parsedResult" class="parsed-card">
      <div slot="header">解析结果</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="识别形状">{{ parsedResult.shape || '未识别' }}</el-descriptions-item>
        <el-descriptions-item label="置信度">{{ Math.round(parsedResult.confidence * 100) }}%</el-descriptions-item>
        <el-descriptions-item label="尺寸参数">{{ formatDimensions(parsedResult.dimensions) }}</el-descriptions-item>
        <el-descriptions-item label="特征">{{ parsedResult.features.join(', ') || '无' }}</el-descriptions-item>
      </el-descriptions>
      
      <div class="action-buttons">
        <el-button type="primary" @click="generateModel" :loading="generating" :disabled="!canGenerate">
          生成模型
        </el-button>
      </div>
    </el-card>

    <!-- 3D预览 -->
    <el-card v-if="generatedModel" class="preview-card">
      <div slot="header">3D预览</div>
      
      <!-- 控制按钮 -->
      <div class="control-buttons">
        <el-button size="small" @click="resetCamera">重置视角</el-button>
        <el-button size="small" @click="toggleAutoRotate">
          {{ autoRotate ? '停止旋转' : '自动旋转' }}
        </el-button>
      </div>
      
      <!-- 操作说明 -->
      <div class="operation-tips">
        <strong>操作说明：</strong>鼠标左键拖拽旋转视角 | 鼠标滚轮缩放 | 鼠标右键拖拽平移
      </div>
      
      <div ref="threeContainer" class="three-container"></div>
      
      <div class="model-info">
        <h4>模型信息</h4>
        <p>形状：{{ generatedModel.shape }}</p>
        <p>参数：{{ formatModelParams(generatedModel.dimensions) }}</p>
        <p>生成时间：{{ generatedModel.generationTime }}ms</p>
      </div>
      
      <div class="model-actions">
        <el-dropdown @command="handleExport" trigger="click">
          <el-button type="primary">
            导出模型<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="stl">STL格式 (3D打印)</el-dropdown-item>
            <el-dropdown-item command="obj">OBJ格式 (通用)</el-dropdown-item>
            <el-dropdown-item disabled>PLY格式 (开发中)</el-dropdown-item>
            <el-dropdown-item disabled>GLTF格式 (开发中)</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button @click="editModel">编辑参数</el-button>
      </div>
    </el-card>

    <!-- 错误处理 -->
    <el-card v-if="errorInfo" class="error-card">
      <div slot="header">
        <span style="color: #f56c6c;">无法生成模型</span>
      </div>
      <div class="error-content">
        <p><strong>错误原因：</strong>{{ errorInfo.error }}</p>
        <p><strong>建议：</strong>{{ errorInfo.suggestion }}</p>
        <div class="error-suggestions">
          <h4>您可以尝试：</h4>
          <ul>
            <li v-for="suggestion in errorInfo.suggestions" :key="suggestion">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import NaturalLanguageParser from '../../../util/NaturalLanguageParser.js';
import GeometryGenerator from '../../../util/GeometryGenerator.js';

export default {
  name: 'NaturalLanguageModeling',
  data() {
    return {
      modelDescription: '',
      parsedResult: null,
      generatedModel: null,
      errorInfo: null,
      generating: false,
      showExamples: false,
      examples: [
        { id: 1, description: '一个长10cm、宽5cm、高3cm的长方体' },
        { id: 2, description: '一个半径2cm、高8cm的圆柱' },
        { id: 3, description: '一个半径5cm的球' },
        { id: 4, description: '一个长20cm、宽15cm、高10cm的带圆角长方体' },
        { id: 5, description: '一个长15cm、宽10cm、高5cm的大圆角长方体' },
        { id: 6, description: '一个长12cm、宽8cm、高4cm的小圆角长方体' },
        { id: 7, description: '一个长18cm、宽12cm、高6cm、圆角半径2cm的长方体' }
      ],
      // Three.js相关
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      currentMesh: null,
      autoRotate: false,
      autoRotateSpeed: 0.5
    };
  },
  
  computed: {
    canGenerate() {
      return this.parsedResult && this.parsedResult.confidence > 0.3;
    },
    
    canPreview() {
      return this.parsedResult && this.parsedResult.confidence > 0.5;
    }
  },
  
  mounted() {
    // 从localStorage恢复自动旋转状态
    this.autoRotate = JSON.parse(localStorage.getItem('crowncad_nl_auto_rotate') || 'false');
    
    this.$nextTick(() => {
      this.initThreeJS();
    });
    
    // 添加全局参数更新函数
    window.updateParamValue = (key, value) => {
      const valueElement = document.getElementById(`value-${key}`);
      if (valueElement) {
        valueElement.textContent = `${value}mm`;
      }
    };
  },
  
  beforeDestroy() {
    this.cleanupThreeJS();
  },
  
  methods: {
    parseDescription() {
      if (!this.modelDescription.trim()) {
        this.parsedResult = null;
        this.errorInfo = null;
        return;
      }
      
      try {
        const parser = new NaturalLanguageParser();
        this.parsedResult = parser.parse(this.modelDescription);
        this.errorInfo = null;
      } catch (error) {
        this.errorInfo = {
          error: '解析失败',
          suggestion: '请检查输入格式',
          suggestions: ['使用明确的几何形状名称', '添加具体的尺寸参数']
        };
      }
    },
    
    generateModel() {
      console.log('generateModel called');
      if (!this.parsedResult) {
        console.warn('No parsed result to generate model from');
        return;
      }
      
      this.generating = true;
      this.errorInfo = null;
      
      try {
        console.log('Creating GeometryGenerator...');
        const generator = new GeometryGenerator();
        console.log('Validating input...');
        const validation = generator.validateInput(this.parsedResult);
        
        if (!validation.valid) {
          console.log('Validation failed:', validation);
          this.errorInfo = validation;
          return;
        }
        
        console.log('Generating model...');
        this.generatedModel = generator.generate(this.parsedResult);
        console.log('Model generated:', this.generatedModel);
        this.$message.success('模型生成成功！');
        
        // 自动预览
        this.$nextTick(() => {
          setTimeout(() => {
            this.previewModel();
          }, 100);
        });
        
      } catch (error) {
        console.error('Error generating model:', error);
        this.errorInfo = {
          error: error.message,
          suggestion: '请重试或检查输入',
          suggestions: ['简化描述', '使用支持的形状', '检查尺寸参数']
        };
      } finally {
        this.generating = false;
      }
    },
    
    previewModel() {
      console.log('previewModel called');
      if (!this.generatedModel) {
        console.warn('No generated model to preview');
        return;
      }
      
      console.log('Generated model:', this.generatedModel);
      
      // 确保Three.js已初始化
      if (!this.scene || !this.camera || !this.renderer) {
        console.log('Three.js not initialized, initializing...');
        this.$nextTick(() => {
          this.initThreeJS();
          this.$nextTick(() => {
            this.previewModel();
          });
        });
        return;
      }
      
      // 清除之前的模型
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
      }
      
      // 创建新模型
      const geometry = this.generatedModel.geometry;
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.9,
        shininess: 100,
        specular: 0x444444
      });
      
      this.currentMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.currentMesh);
      
      // 调整相机位置
      this.adjustCamera();
      
      // 更新光源位置
      this.updateLights();
      
      // 渲染
      this.renderer.render(this.scene, this.camera);
      
      // 如果启用了自动旋转，则启动
      if (this.autoRotate) {
        this.startAutoRotate();
      }
    },
    
    initThreeJS() {
      const container = this.$refs.threeContainer;
      if (!container) {
        console.warn('Three.js container not found');
        return;
      }
      
      try {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        this.camera.position.set(100, 100, 100);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        
        // 添加控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        
        // 添加环境光
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(this.ambientLight);
        
        // 添加跟随相机的主光源
        this.mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.mainLight.position.copy(this.camera.position);
        this.mainLight.lookAt(0, 0, 0);
        this.mainLight.castShadow = true;
        this.scene.add(this.mainLight);
        
        // 添加填充光（从相反方向）
        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        this.fillLight.position.copy(this.camera.position);
        this.fillLight.position.multiplyScalar(-1);
        this.fillLight.lookAt(0, 0, 0);
        this.scene.add(this.fillLight);
        
        // 添加顶部光源
        this.topLight = new THREE.DirectionalLight(0xffffff, 0.2);
        this.topLight.position.set(0, 100, 0);
        this.topLight.lookAt(0, 0, 0);
        this.scene.add(this.topLight);
        
        // 渲染循环
        const animate = () => {
          requestAnimationFrame(animate);
          if (this.controls) {
            this.controls.update();
            // 更新光源位置跟随相机
            this.updateLights();
          }
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        };
        animate();
        
        console.log('Three.js initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Three.js:', error);
      }
    },
    
    updateLights() {
      if (!this.mainLight || !this.fillLight || !this.topLight || !this.camera) return;
      
      // 更新主光源位置跟随相机
      this.mainLight.position.copy(this.camera.position);
      this.mainLight.lookAt(this.controls.target);
      
      // 更新填充光位置（从相反方向）
      this.fillLight.position.copy(this.camera.position);
      this.fillLight.position.sub(this.controls.target);
      this.fillLight.position.multiplyScalar(-1);
      this.fillLight.position.add(this.controls.target);
      this.fillLight.lookAt(this.controls.target);
      
      // 更新顶部光源位置（始终在模型上方）
      const targetCenter = this.controls.target.clone();
      this.topLight.position.set(targetCenter.x, targetCenter.y + 100, targetCenter.z);
      this.topLight.lookAt(this.controls.target);
    },
    
    adjustCamera() {
      if (!this.currentMesh) return;
      
      const box = new THREE.Box3().setFromObject(this.currentMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;
      
      this.camera.position.copy(center);
      this.camera.position.x += distance;
      this.camera.position.y += distance;
      this.camera.position.z += distance;
      this.camera.lookAt(center);
      
      this.controls.target.copy(center);
      
      // 调整相机后立即更新光源
      this.updateLights();
    },
    
    resetCamera() {
      if (!this.currentMesh) return;
      
      // 重置控制器
      this.controls.reset();
      
      // 重新调整相机位置
      this.adjustCamera();
      
      // 更新光源
      this.updateLights();
      
      // 渲染场景
      this.renderer.render(this.scene, this.camera);
    },
    
    cleanupThreeJS() {
      if (this.renderer) {
        this.renderer.dispose();
      }
      if (this.controls) {
        this.controls.dispose();
      }
    },
    
    useExample(example) {
      this.modelDescription = example.description;
      this.parseDescription();
    },
    
    formatDimensions(dimensions) {
      return Object.entries(dimensions)
        .map(([key, value]) => `${key}: ${value.value}${value.unit}`)
        .join(', ');
    },
    
    formatModelParams(params) {
      return Object.entries(params)
        .map(([key, value]) => `${key}: ${value.normalizedValue}mm`)
        .join(', ');
    },
    
    formatNumber(num) {
      // 处理数值精度，避免科学计数法和过多小数位
      if (num === 0) return '0';
      if (Math.abs(num) < 0.000001) return '0';
      if (Math.abs(num) > 999999) {
        return num.toExponential(6);
      }
      // 保留6位小数，去除尾随零
      return parseFloat(num.toFixed(6)).toString();
    },
    
    resetInput() {
      this.modelDescription = '';
      this.parsedResult = null;
      this.generatedModel = null;
      this.errorInfo = null;
      
      // 清除3D模型
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
        this.currentMesh = null;
        this.renderer.render(this.scene, this.camera);
      }
    },
    

    
    handleExport(command) {
      if (!this.currentMesh) {
        this.$message.warning('没有可导出的模型');
        return;
      }
      
      switch (command) {
        case 'stl':
          this.exportAsSTL();
          break;
        case 'obj':
          this.exportAsOBJ();
          break;
        default:
          this.$message.warning('不支持的导出格式');
      }
    },
    
    exportAsSTL() {
      try {
        // 动态导入STL导出器
        import('three/examples/jsm/exporters/STLExporter.js').then(({ STLExporter }) => {
          const exporter = new STLExporter();
          const result = exporter.parse(this.currentMesh, { binary: true });
          
          // 创建Blob并下载
          const blob = new Blob([result], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `model_${Date.now()}.stl`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          this.$message.success('STL文件导出成功');
        }).catch(error => {
          console.error('STL导出器加载失败:', error);
          this.$message.error('STL导出器加载失败，使用备用方法');
          this.exportAsSimpleSTL();
        });
      } catch (error) {
        console.error('STL导出失败:', error);
        this.$message.error('STL导出失败: ' + error.message);
      }
    },
    
    exportAsSimpleSTL() {
      try {
        // 简单的STL导出实现
        const geometry = this.currentMesh.geometry;
        const vertices = geometry.attributes.position.array;
        const indices = geometry.index ? geometry.index.array : null;
        
        let stlContent = 'solid model\n';
        
        if (indices) {
          // 有索引的情况
          for (let i = 0; i < indices.length; i += 3) {
            const v1 = new THREE.Vector3(
              vertices[indices[i] * 3],
              vertices[indices[i] * 3 + 1],
              vertices[indices[i] * 3 + 2]
            );
            const v2 = new THREE.Vector3(
              vertices[indices[i + 1] * 3],
              vertices[indices[i + 1] * 3 + 1],
              vertices[indices[i + 1] * 3 + 2]
            );
            const v3 = new THREE.Vector3(
              vertices[indices[i + 2] * 3],
              vertices[indices[i + 2] * 3 + 1],
              vertices[indices[i + 2] * 3 + 2]
            );
            
            // 计算法向量
            const normal = new THREE.Vector3();
            normal.crossVectors(v2.clone().sub(v1), v3.clone().sub(v1)).normalize();
            
            stlContent += `  facet normal ${this.formatNumber(normal.x)} ${this.formatNumber(normal.y)} ${this.formatNumber(normal.z)}\n`;
            stlContent += `    outer loop\n`;
            stlContent += `      vertex ${this.formatNumber(v1.x)} ${this.formatNumber(v1.y)} ${this.formatNumber(v1.z)}\n`;
            stlContent += `      vertex ${this.formatNumber(v2.x)} ${this.formatNumber(v2.y)} ${this.formatNumber(v2.z)}\n`;
            stlContent += `      vertex ${this.formatNumber(v3.x)} ${this.formatNumber(v3.y)} ${this.formatNumber(v3.z)}\n`;
            stlContent += `    endloop\n`;
            stlContent += `  endfacet\n`;
          }
        } else {
          // 没有索引的情况
          for (let i = 0; i < vertices.length; i += 9) {
            const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
            const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
            const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
            
            // 计算法向量
            const normal = new THREE.Vector3();
            normal.crossVectors(v2.clone().sub(v1), v3.clone().sub(v1)).normalize();
            
            stlContent += `  facet normal ${this.formatNumber(normal.x)} ${this.formatNumber(normal.y)} ${this.formatNumber(normal.z)}\n`;
            stlContent += `    outer loop\n`;
            stlContent += `      vertex ${this.formatNumber(v1.x)} ${this.formatNumber(v1.y)} ${this.formatNumber(v1.z)}\n`;
            stlContent += `      vertex ${this.formatNumber(v2.x)} ${this.formatNumber(v2.y)} ${this.formatNumber(v2.z)}\n`;
            stlContent += `      vertex ${this.formatNumber(v3.x)} ${this.formatNumber(v3.y)} ${this.formatNumber(v3.z)}\n`;
            stlContent += `    endloop\n`;
            stlContent += `  endfacet\n`;
          }
        }
        
        stlContent += 'endsolid model\n';
        
        // 创建Blob并下载
        const blob = new Blob([stlContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `model_${Date.now()}.stl`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.$message.success('STL文件导出成功（备用方法）');
      } catch (error) {
        console.error('备用STL导出失败:', error);
        this.$message.error('STL导出失败: ' + error.message);
      }
    },
    
    exportAsOBJ() {
      try {
        // 动态导入OBJ导出器
        import('three/examples/jsm/exporters/OBJExporter.js').then(({ OBJExporter }) => {
          const exporter = new OBJExporter();
          const result = exporter.parse(this.currentMesh);
          
          // 创建Blob并下载
          const blob = new Blob([result], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `model_${Date.now()}.obj`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          this.$message.success('OBJ文件导出成功');
        }).catch(error => {
          console.error('OBJ导出器加载失败:', error);
          this.$message.error('OBJ导出器加载失败，使用备用方法');
          this.exportAsSimpleOBJ();
        });
      } catch (error) {
        console.error('OBJ导出失败:', error);
        this.$message.error('OBJ导出失败: ' + error.message);
      }
    },
    
    exportAsSimpleOBJ() {
      try {
        // 验证几何体
        const geometry = this.currentMesh.geometry;
        if (!geometry || !geometry.attributes.position) {
          throw new Error('无效的几何体数据');
        }
        
        const vertices = geometry.attributes.position.array;
        const indices = geometry.index ? geometry.index.array : null;
        const normals = geometry.attributes.normal ? geometry.attributes.normal.array : null;
        
        // 验证顶点数据
        if (!vertices || vertices.length === 0) {
          throw new Error('没有顶点数据');
        }
        
        if (vertices.length % 3 !== 0) {
          throw new Error('顶点数据格式错误');
        }
        
        const vertexCount = vertices.length / 3;
        console.log(`导出OBJ: ${vertexCount}个顶点, ${indices ? indices.length / 3 : vertices.length / 9}个面`);
        
        let objContent = '# Generated by Natural Language Modeling\n';
        objContent += `# Model: ${this.generatedModel ? this.generatedModel.shape : 'Unknown'}\n`;
        objContent += `# Vertices: ${vertexCount}\n`;
        objContent += `# Faces: ${indices ? indices.length / 3 : vertices.length / 9}\n\n`;
        
        // 输出顶点 - 处理数值精度问题
        for (let i = 0; i < vertices.length; i += 3) {
          const x = this.formatNumber(vertices[i]);
          const y = this.formatNumber(vertices[i + 1]);
          const z = this.formatNumber(vertices[i + 2]);
          
          // 检查NaN和Infinity
          if (isNaN(x) || isNaN(y) || isNaN(z) || 
              !isFinite(x) || !isFinite(y) || !isFinite(z)) {
            console.warn(`跳过无效顶点 ${i/3}: ${x}, ${y}, ${z}`);
            continue;
          }
          
          objContent += `v ${x} ${y} ${z}\n`;
        }
        
        // 输出法向量（如果有）
        if (normals && normals.length > 0) {
          objContent += '\n';
          for (let i = 0; i < normals.length; i += 3) {
            const nx = this.formatNumber(normals[i]);
            const ny = this.formatNumber(normals[i + 1]);
            const nz = this.formatNumber(normals[i + 2]);
            
            if (isNaN(nx) || isNaN(ny) || isNaN(nz) || 
                !isFinite(nx) || !isFinite(ny) || !isFinite(nz)) {
              continue;
            }
            
            objContent += `vn ${nx} ${ny} ${nz}\n`;
          }
        }
        
        objContent += '\n';
        
        // 输出面 - 修复索引问题
        if (indices) {
          // 有索引的情况
          for (let i = 0; i < indices.length; i += 3) {
            const v1 = indices[i] + 1;
            const v2 = indices[i + 1] + 1;
            const v3 = indices[i + 2] + 1;
            
            // 验证索引范围
            if (v1 > vertexCount || v2 > vertexCount || v3 > vertexCount) {
              console.warn(`跳过无效面索引: ${v1}, ${v2}, ${v3} (最大顶点数: ${vertexCount})`);
              continue;
            }
            
            if (normals) {
              objContent += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
            } else {
              objContent += `f ${v1} ${v2} ${v3}\n`;
            }
          }
        } else {
          // 没有索引的情况 - 修复计算错误
          const faceCount = Math.floor(vertices.length / 9);
          for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
            const baseIndex = faceIndex * 9;
            const v1 = Math.floor(baseIndex / 3) + 1;
            const v2 = Math.floor((baseIndex + 3) / 3) + 1;
            const v3 = Math.floor((baseIndex + 6) / 3) + 1;
            
            // 验证索引范围
            if (v1 > vertexCount || v2 > vertexCount || v3 > vertexCount) {
              console.warn(`跳过无效面索引: ${v1}, ${v2}, ${v3} (最大顶点数: ${vertexCount})`);
              continue;
            }
            
            if (normals) {
              objContent += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
            } else {
              objContent += `f ${v1} ${v2} ${v3}\n`;
            }
          }
        }
        
        // 创建Blob并下载
        const blob = new Blob([objContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `model_${Date.now()}.obj`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.$message.success('OBJ文件导出成功（备用方法）');
      } catch (error) {
        console.error('备用OBJ导出失败:', error);
        this.$message.error('OBJ导出失败: ' + error.message);
      }
    },
    
    exportAsPLY() {
      try {
        // 动态导入PLY导出器
        import('three/examples/jsm/exporters/PLYExporter.js').then(({ PLYExporter }) => {
          const exporter = new PLYExporter();
          const result = exporter.parse(this.currentMesh, { binary: false });
          
          // 创建Blob并下载
          const blob = new Blob([result], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `model_${Date.now()}.ply`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          this.$message.success('PLY文件导出成功');
        }).catch(error => {
          console.error('PLY导出器加载失败:', error);
          this.$message.error('PLY导出功能暂不可用，请使用STL或OBJ格式');
        });
      } catch (error) {
        console.error('PLY导出失败:', error);
        this.$message.error('PLY导出失败: ' + error.message);
      }
    },
    
    exportAsGLTF() {
      try {
        // 动态导入GLTF导出器
        import('three/examples/jsm/exporters/GLTFExporter.js').then(({ GLTFExporter }) => {
          const exporter = new GLTFExporter();
          
          exporter.parse(this.currentMesh, (result) => {
            if (result instanceof ArrayBuffer) {
              // 二进制GLTF
              const blob = new Blob([result], { type: 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              
              const link = document.createElement('a');
              link.href = url;
              link.download = `model_${Date.now()}.glb`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              this.$message.success('GLB文件导出成功');
            } else {
              // JSON格式GLTF
              const jsonString = JSON.stringify(result, null, 2);
              const blob = new Blob([jsonString], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              
              const link = document.createElement('a');
              link.href = url;
              link.download = `model_${Date.now()}.gltf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              this.$message.success('GLTF文件导出成功');
            }
          }, { binary: true });
        }).catch(error => {
          console.error('GLTF导出器加载失败:', error);
          this.$message.error('GLTF导出功能暂不可用，请使用STL或OBJ格式');
        });
      } catch (error) {
        console.error('GLTF导出失败:', error);
        this.$message.error('GLTF导出失败: ' + error.message);
      }
    },
    
    editModel() {
      if (!this.generatedModel) {
        this.$message.warning('请先生成模型');
        return;
      }
      
      // 创建参数编辑对话框
      this.$confirm('', '编辑模型参数', {
        confirmButtonText: '应用',
        cancelButtonText: '取消',
        customClass: 'edit-params-dialog',
        dangerouslyUseHTMLString: true,
        message: this.createEditParamsDialog()
      }).then(() => {
        this.applyEditedParams();
      }).catch(() => {
        // 用户取消
      });
    },
    
    createEditParamsDialog() {
      if (!this.generatedModel || !this.generatedModel.dimensions) {
        return '<p>没有可编辑的参数</p>';
      }
      
      let dialogContent = '<div class="edit-params-content">';
      dialogContent += '<h3>调整模型参数</h3>';
      dialogContent += '<div class="params-list">';
      
      Object.entries(this.generatedModel.dimensions).forEach(([key, value]) => {
        const min = Math.max(1, Math.floor(value.normalizedValue * 0.5));
        const max = Math.floor(value.normalizedValue * 2);
        const current = Math.floor(value.normalizedValue);
        
        dialogContent += `
          <div class="param-item">
            <label>${this.getParamDisplayName(key)}:</label>
            <div class="param-controls">
              <input type="range" 
                     id="param-${key}" 
                     min="${min}" 
                     max="${max}" 
                     value="${current}"
                     class="param-slider"
                     onchange="window.updateParamValue('${key}', this.value)">
              <span class="param-value" id="value-${key}">${current}mm</span>
            </div>
          </div>
        `;
      });
      
      dialogContent += '</div>';
      dialogContent += '<div class="param-tips">';
      dialogContent += '<p><strong>提示:</strong></p>';
      dialogContent += '<ul>';
      dialogContent += '<li>拖动滑块调整参数值</li>';
      dialogContent += '<li>参数范围已根据当前值自动设置</li>';
      dialogContent += '<li>点击"应用"重新生成模型</li>';
      dialogContent += '</ul>';
      dialogContent += '</div>';
      dialogContent += '</div>';
      
      return dialogContent;
    },
    
    getParamDisplayName(key) {
      const nameMap = {
        'width': '宽度',
        'height': '高度', 
        'depth': '深度',
        'length': '长度',
        'radius': '半径',
        'diameter': '直径',
        'thickness': '厚度',
        'roundRadius': '圆角半径',
        'smallRadius': '小圆角半径',
        'largeRadius': '大圆角半径'
      };
      return nameMap[key] || key;
    },
    
    applyEditedParams() {
      // 获取编辑后的参数值
      const editedParams = {};
      Object.keys(this.generatedModel.dimensions).forEach(key => {
        const slider = document.getElementById(`param-${key}`);
        if (slider) {
          editedParams[key] = parseInt(slider.value);
        }
      });
      
      console.log('编辑后的参数:', editedParams);
      
      // 更新模型参数
      Object.entries(editedParams).forEach(([key, value]) => {
        if (this.generatedModel.dimensions[key]) {
          this.generatedModel.dimensions[key].normalizedValue = value;
          console.log(`更新参数 ${key}: ${value}`);
        }
      });
      
      console.log('更新后的模型参数:', this.generatedModel.dimensions);
      
      // 重新生成模型
      this.regenerateModel();
    },
    
    regenerateModel() {
      if (!this.generatedModel) return;
      
      try {
        console.log('重新生成模型，当前参数:', this.generatedModel.dimensions);
        
        // 使用与原始生成相同的逻辑重新生成几何体
        const generator = new GeometryGenerator();
        
        // 创建新的parsedResult对象，使用更新后的参数
        const updatedParsedResult = {
          shape: this.generatedModel.shape, // 使用原始的中文形状名称
          dimensions: this.generatedModel.dimensions, // 使用更新后的参数
          features: this.generatedModel.features || [] // 保持原始特征
        };
        
        console.log('更新的parsedResult:', updatedParsedResult);
        
        // 重新生成模型
        const newGeneratedModel = generator.generate(updatedParsedResult);
        console.log('新生成的模型:', newGeneratedModel);
        
        // 更新generatedModel
        this.generatedModel.geometry = newGeneratedModel.geometry;
        
        // 清除当前模型
        if (this.currentMesh) {
          this.scene.remove(this.currentMesh);
          this.currentMesh = null;
        }
        
        // 使用与previewModel相同的材质
        const material = new THREE.MeshPhongMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.9,
          shininess: 100,
          specular: 0x444444
        });
        
        this.currentMesh = new THREE.Mesh(newGeneratedModel.geometry, material);
        this.scene.add(this.currentMesh);
        
        // 调整相机位置
        this.adjustCamera();
        
        // 更新光源位置
        this.updateLights();
        
        // 渲染
        this.renderer.render(this.scene, this.camera);
        
        console.log('模型重新生成成功');
        this.$message.success('模型参数已更新');
      } catch (error) {
        console.error('重新生成模型失败:', error);
        this.$message.error('重新生成模型失败: ' + error.message);
      }
    },
    
    createGeometryFromParams() {
      if (!this.generatedModel) return null;
      
      const { shape, dimensions } = this.generatedModel;
      console.log('创建几何体，形状:', shape, '参数:', dimensions);
      
      // 直接使用Three.js创建几何体，避免复杂的参数映射
      try {
        switch (shape) {
          case 'box':
            const width = dimensions.width?.normalizedValue || 50;
            const height = dimensions.height?.normalizedValue || 50;
            const depth = dimensions.depth?.normalizedValue || 50;
            console.log('创建长方体:', { width, height, depth });
            return new THREE.BoxGeometry(width, height, depth);
            
          case 'roundedBox':
            const rWidth = dimensions.width?.normalizedValue || 50;
            const rHeight = dimensions.height?.normalizedValue || 50;
            const rDepth = dimensions.depth?.normalizedValue || 50;
            const roundRadius = dimensions.roundRadius?.normalizedValue || 5;
            console.log('创建圆角长方体:', { rWidth, rHeight, rDepth, roundRadius });
            
            // 使用GeometryGenerator的圆角功能
            const generator = new GeometryGenerator();
            const convertedDimensions = {
              '长': { normalizedValue: rDepth, value: rDepth, unit: 'mm' },
              '宽': { normalizedValue: rWidth, value: rWidth, unit: 'mm' },
              '高': { normalizedValue: rHeight, value: rHeight, unit: 'mm' },
              '圆角半径': { normalizedValue: roundRadius, value: roundRadius, unit: 'mm' }
            };
            return generator.createBox(convertedDimensions, ['圆角']);
            
          case 'cylinder':
            const radius = dimensions.radius?.normalizedValue || 25;
            const length = dimensions.length?.normalizedValue || 50;
            console.log('创建圆柱:', { radius, length });
            return new THREE.CylinderGeometry(radius, radius, length, 32);
            
          case 'sphere':
            const sphereRadius = dimensions.radius?.normalizedValue || 25;
            console.log('创建球:', { sphereRadius });
            return new THREE.SphereGeometry(sphereRadius, 32, 32);
            
          case 'cone':
            const coneRadius = dimensions.radius?.normalizedValue || 25;
            const coneHeight = dimensions.height?.normalizedValue || 50;
            console.log('创建圆锥:', { coneRadius, coneHeight });
            return new THREE.ConeGeometry(coneRadius, coneHeight, 32);
            
          default:
            console.log('使用默认长方体');
            const defaultWidth = dimensions.width?.normalizedValue || 50;
            const defaultHeight = dimensions.height?.normalizedValue || 50;
            const defaultDepth = dimensions.depth?.normalizedValue || 50;
            return new THREE.BoxGeometry(defaultWidth, defaultHeight, defaultDepth);
        }
      } catch (error) {
        console.error('创建几何体失败:', error);
        // 回退到简单的立方体
        const fallbackSize = 50;
        console.log('使用回退立方体:', fallbackSize);
        return new THREE.BoxGeometry(fallbackSize, fallbackSize, fallbackSize);
      }
    },
    

    
    testThreeJS() {
      console.log('Testing Three.js...');
      console.log('Scene:', this.scene);
      console.log('Camera:', this.camera);
      console.log('Renderer:', this.renderer);
      console.log('Container:', this.$refs.threeContainer);
      
      if (!this.scene || !this.camera || !this.renderer) {
        console.log('Three.js not initialized, initializing...');
        this.initThreeJS();
        this.$nextTick(() => {
          this.testThreeJS();
        });
        return;
      }
      
      // 创建一个简单的测试立方体
      const geometry = new THREE.BoxGeometry(50, 50, 50);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        shininess: 100,
        specular: 0x444444
      });
      const cube = new THREE.Mesh(geometry, material);
      
      // 清除之前的模型
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
      }
      
      this.currentMesh = cube;
      this.scene.add(cube);
      
      // 调整相机
      this.camera.position.set(100, 100, 100);
      this.camera.lookAt(0, 0, 0);
      this.controls.target.set(0, 0, 0);
      
      // 更新光源位置
      this.updateLights();
      
      // 渲染
      this.renderer.render(this.scene, this.camera);
      
      console.log('Test cube added successfully');
      this.$message.success('3D测试成功！');
    },

    toggleAutoRotate() {
      this.autoRotate = !this.autoRotate;
      
      // 保存状态到localStorage
      localStorage.setItem('crowncad_nl_auto_rotate', JSON.stringify(this.autoRotate));
      
      if (this.autoRotate) {
        this.startAutoRotate();
        this.$message.success('已开启自动旋转');
      } else {
        this.stopAutoRotate();
        this.$message.success('已停止自动旋转');
      }
    },

    startAutoRotate() {
      if (!this.controls) return;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = this.autoRotateSpeed;
    },

    stopAutoRotate() {
      if (!this.controls) return;
      this.controls.autoRotate = false;
    }
  }
};
</script>

<style scoped>
.nl-modeling {
  padding: 20px;
}

.input-card, .parsed-card, .preview-card, .error-card {
  margin-bottom: 20px;
}

.examples-section {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.examples-section h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.action-buttons {
  margin-top: 15px;
  text-align: center;
}

.three-container {
  width: 100%;
  height: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.model-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.model-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.model-actions {
  margin-top: 15px;
  text-align: center;
}

.error-content {
  color: #606266;
}

.error-suggestions {
  margin-top: 15px;
}

.error-suggestions h4 {
  color: #f56c6c;
  margin-bottom: 10px;
}

.error-suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.error-suggestions li {
  margin-bottom: 5px;
}

.model-actions .el-dropdown {
  margin: 0 10px;
}

.export-dialog .el-message-box__content {
  text-align: center;
}

.export-dialog .el-message-box__btns {
  text-align: center;
}
</style>

<style>
/* 参数编辑对话框样式 */
.edit-params-dialog .el-message-box__content {
  padding: 0;
}

.edit-params-content {
  padding: 20px;
}

.edit-params-content h3 {
  margin: 0 0 20px 0;
  color: #333;
  text-align: center;
}

.params-list {
  margin-bottom: 20px;
}

.param-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.param-item label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #333;
}

.param-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.param-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.param-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.param-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.param-value {
  min-width: 60px;
  padding: 5px 10px;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
}

.param-tips {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.param-tips p {
  margin: 0 0 10px 0;
  color: #1976d2;
  font-weight: bold;
}

.param-tips ul {
  margin: 0;
  padding-left: 20px;
}

.param-tips li {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

/* 控制按钮样式 */
.control-buttons {
  margin-bottom: 10px;
  text-align: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.control-buttons .el-button {
  margin: 0 5px;
}

/* 操作说明样式 */
.operation-tips {
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}
</style> 