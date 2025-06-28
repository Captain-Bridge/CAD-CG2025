<template>
  <div style="padding: 20px; flex-grow: 1;">
    <el-card>
      <div slot="header">
        <span>点云文件上传</span>
      </div>
      
      <!-- 文件上传区域 -->
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
        :file-list="fileList"
        :before-upload="beforeUpload"
        accept=".ply,.xyz,.pts,.pcd,.obj"
        :limit="1">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">
          支持 PLY, XYZ, PTS, PCD, OBJ 格式的点云文件，单个文件不超过100MB
        </div>
      </el-upload>

      <!-- 点云信息显示 -->
      <div v-if="pointCloudInfo" style="margin-top: 20px;">
        <el-descriptions title="点云信息" :column="2" border>
          <el-descriptions-item label="文件名">{{ pointCloudInfo.fileName }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(pointCloudInfo.fileSize) }}</el-descriptions-item>
          <el-descriptions-item label="点数量">{{ pointCloudInfo.pointCount }}</el-descriptions-item>
          <el-descriptions-item label="文件格式">{{ pointCloudInfo.format }}</el-descriptions-item>
          <el-descriptions-item label="包含法向量" v-if="pointCloudInfo.hasNormals !== undefined">
            <el-tag type="success" v-if="pointCloudInfo.hasNormals">是</el-tag>
            <el-tag type="info" v-else>否</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 点云预览 -->
      <div v-if="showPreview" style="margin-top: 20px;">
        <el-card>
          <div slot="header">
            <span>点云预览</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="togglePreview">
              {{ previewExpanded ? '收起' : '展开' }}
            </el-button>
          </div>
          <div v-show="previewExpanded">
            <!-- 控制按钮 -->
            <div style="margin-bottom: 10px; text-align: center;">
              <el-button size="small" @click="resetCamera">重置视角</el-button>
              <el-button size="small" @click="toggleAutoRotate">
                {{ autoRotate ? '停止旋转' : '自动旋转' }}
              </el-button>
            </div>
            <!-- 点数控制 -->
            <div style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
              <div style="margin-bottom: 5px; font-size: 12px; color: #606266;">
                显示点数: {{ displayPointCount }} / {{ pointCloudData ? pointCloudData.length : 0 }}
              </div>
              <el-slider 
                v-model="displayPointCount" 
                :min="100" 
                :max="pointCloudData ? Math.min(pointCloudData.length, 20000) : 5000" 
                :step="100"
                show-input
                @change="updatePointDisplay"
                style="margin: 0;">
              </el-slider>
              <div style="margin-top: 5px; font-size: 11px; color: #909399; text-align: center;">
                为防止性能问题出现，最多展示20000点
              </div>
            </div>
            <!-- 点数信息 -->
            <div style="margin-bottom: 10px; text-align: center; color: #409EFF; font-weight: bold;">
              当前显示: {{ Math.min(pointCloudData ? pointCloudData.length : 0, displayPointCount) }} 个点
              <span v-if="pointCloudData && pointCloudData.length > displayPointCount" style="color: #E6A23C; font-size: 12px;">
                (总点数: {{ pointCloudData.length }})
              </span>
            </div>
            <!-- 操作说明 -->
            <div style="margin-bottom: 10px; padding: 8px; background-color: #f5f7fa; border-radius: 4px; font-size: 12px; color: #606266;">
              <strong>操作说明：</strong>
              鼠标左键拖拽旋转视角 | 鼠标滚轮缩放 | 鼠标右键拖拽平移
            </div>
            <div style="height: 400px; border: 1px solid #dcdfe6; border-radius: 4px;">
              <div ref="pointCloudViewer" style="width: 100%; height: 100%;"></div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 操作按钮 -->
      <div style="margin-top: 20px; text-align: center;">
        <el-button type="primary" @click="processPointCloud" :disabled="!pointCloudInfo">
          准备重建
        </el-button>
        <el-button @click="clearFiles">清空文件</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default {
  name: "PointCloudUpload",
  data() {
    return {
      fileList: [],
      pointCloudInfo: null,
      showPreview: false,
      previewExpanded: true,
      pointCloudData: null,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      animationId: null,
      isViewerInitialized: false,
      autoRotate: false,
      displayPointCount: 5000, // 默认显示5000个点
      // pointSize: 0.1 // 移除点大小变量
      cacheFileUrl: null,
      cacheFileName: null,
      uploadedFileId: null
    }
  },
  methods: {
    beforeUpload(file) {
      const isValidFormat = ['.ply', '.xyz', '.pts', '.pcd', '.obj'].some(format => 
        file.name.toLowerCase().endsWith(format)
      );
      const isLt100M = file.size / 1024 / 1024 < 100;
      
      if (!isValidFormat) {
        this.$message.error('只支持 PLY, XYZ, PTS, PCD, OBJ 格式的文件!');
        return false;
      }
      if (!isLt100M) {
        this.$message.error('文件大小不能超过 100MB!');
        return false;
      }
      
      return false; // 阻止自动上传
    },

    handleExceed(files, fileList) {
      // 当文件数量超过限制时，自动替换旧文件
      this.$message.info('检测到新文件，将自动替换当前文件');
      
      // 清理旧的点云数据
      this.clearCurrentPointCloudData();
      
      // 处理新文件（取最后一个文件）
      const newFile = files[files.length - 1];
      if (newFile) {
        this.fileList = [newFile];
        this.readPointCloudFile(newFile);
      }
    },

    clearCurrentPointCloudData() {
      // 清理当前点云数据和预览，但保留文件列表
      this.pointCloudInfo = null;
      this.pointCloudData = null;
      this.showPreview = false;
      this.uploadedFileId = null;
      
      // 清理预览器
      this.cleanupViewer();
      
      // 清理localStorage中的文件信息
      localStorage.removeItem('crowncad_cache_file_info');
      
      // 清理点云相关的缓存数据
      this.clearPointCloudCache();
      
      console.log('已清理当前点云数据');
    },

    handleFileChange(file, fileList) {
      // 如果文件列表长度大于1，说明有多个文件，需要处理
      if (fileList.length > 1) {
        // 保留最新的文件
        this.fileList = [fileList[fileList.length - 1]];
        
        // 清理旧的点云数据
        this.clearCurrentPointCloudData();
        
        // 处理新文件
        if (file.raw) {
          this.readPointCloudFile(file.raw);
        }
      } else {
        // 第一次上传文件或只有一个文件
        this.fileList = fileList;
        if (file.raw) {
          this.readPointCloudFile(file.raw);
        }
      }
    },

    async readPointCloudFile(file) {
      try {
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        if (fileExtension === 'ply') {
          // PLY文件需要特殊处理
          this.readPLYFile(file);
        } else {
          // 其他格式按文本处理
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          this.parsePointCloud(content, file.name);
        };
        reader.readAsText(file);
        }
      } catch (error) {
        this.$message.error('文件读取失败: ' + error.message);
      }
    },

    async readPLYFile(file) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = e.target.result;
          this.parsePLYFile(buffer, file.name);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        this.$message.error('PLY文件读取失败: ' + error.message);
      }
    },

    parsePLYFile(buffer, fileName) {
      console.log('开始解析PLY文件:', fileName);
      
      try {
        const textDecoder = new TextDecoder();
        const headerText = textDecoder.decode(buffer.slice(0, 1024)); // 读取前1KB作为头部
        
        console.log('PLY头部信息:', headerText);
        
        // 检查是否为ASCII格式的PLY
        if (headerText.includes('format ascii')) {
          console.log('检测到ASCII格式PLY文件');
          const fullText = textDecoder.decode(buffer);
          this.parseASCIIPLY(fullText, fileName);
        } else if (headerText.includes('format binary')) {
          console.log('检测到二进制格式PLY文件');
          this.parseBinaryPLY(buffer, fileName);
        } else {
          console.log('未知PLY格式，尝试作为ASCII解析');
          const fullText = textDecoder.decode(buffer);
          this.parseASCIIPLY(fullText, fileName);
        }
      } catch (error) {
        console.error('PLY解析失败:', error);
        this.$message.error('PLY文件解析失败: ' + error.message);
      }
    },

    parseBinaryPLY(buffer, fileName) {
      console.log('解析二进制PLY文件');
      
      try {
        const textDecoder = new TextDecoder();
        const headerText = textDecoder.decode(buffer.slice(0, 2048)); // 读取更多头部信息
        
        // 解析头部信息
        const headerLines = headerText.split('\n');
        let headerEndIndex = -1;
        let vertexCount = 0;
        let formatType = 'binary_little_endian';
        let properties = [];
        let dataOffset = 0;
        
        // 解析头部
        for (let i = 0; i < headerLines.length; i++) {
          const line = headerLines[i].trim();
          
          if (line.startsWith('format')) {
            const parts = line.split(' ');
            formatType = parts[1]; // binary_little_endian 或 binary_big_endian
            console.log('PLY格式:', formatType);
          } else if (line.startsWith('element vertex')) {
            vertexCount = parseInt(line.split(' ')[2]);
            console.log('顶点数量:', vertexCount);
          } else if (line.startsWith('property')) {
            const parts = line.split(' ');
            const propType = parts[1]; // double, float, int等
            const propName = parts[2]; // x, y, z, nx, ny, nz等
            properties.push({ type: propType, name: propName });
            console.log('属性:', propType, propName);
          } else if (line === 'end_header') {
            headerEndIndex = i;
            // 计算数据开始位置
            dataOffset = headerText.indexOf('end_header') + 'end_header'.length + 1;
            break;
          }
        }
        
        if (headerEndIndex === -1) {
          this.$message.error('PLY文件头部格式错误');
          return;
        }
        
        console.log('头部结束位置:', headerEndIndex);
        console.log('数据偏移量:', dataOffset);
        console.log('属性列表:', properties);
        
        // 解析二进制数据
        const points = [];
        const dataView = new DataView(buffer, dataOffset);
        let offset = 0;
        
        // 计算每个顶点的字节数
        let bytesPerVertex = 0;
        for (const prop of properties) {
          if (prop.type === 'double') bytesPerVertex += 8;
          else if (prop.type === 'float') bytesPerVertex += 4;
          else if (prop.type === 'int') bytesPerVertex += 4;
          else if (prop.type === 'uchar') bytesPerVertex += 1;
        }
        
        console.log('每个顶点字节数:', bytesPerVertex);
        
        const isLittleEndian = formatType === 'binary_little_endian';
        
        for (let i = 0; i < vertexCount; i++) {
          try {
            const point = {};
            let currentOffset = offset;
            
            // 按属性顺序解析数据
            for (const prop of properties) {
              let value;
              
              if (prop.type === 'double') {
                value = dataView.getFloat64(currentOffset, isLittleEndian);
                currentOffset += 8;
              } else if (prop.type === 'float') {
                value = dataView.getFloat32(currentOffset, isLittleEndian);
                currentOffset += 4;
              } else if (prop.type === 'int') {
                value = dataView.getInt32(currentOffset, isLittleEndian);
                currentOffset += 4;
              } else if (prop.type === 'uchar') {
                value = dataView.getUint8(currentOffset);
                currentOffset += 1;
              }
              
              if (!isNaN(value)) {
                point[prop.name] = value;
              }
            }
            
            // 检查是否有有效的坐标
            if (point.x !== undefined && point.y !== undefined && point.z !== undefined) {
              // 处理颜色值（如果是uchar类型，需要归一化）
              if (point.red !== undefined && point.green !== undefined && point.blue !== undefined) {
                point.r = point.red / 255;
                point.g = point.green / 255;
                point.b = point.blue / 255;
                delete point.red;
                delete point.green;
                delete point.blue;
              }
              
              points.push(point);
              
              if (i < 3) {
                console.log(`第${i + 1}个点:`, point);
              }
            }
            
            offset += bytesPerVertex;
          } catch (error) {
            console.warn(`解析第${i + 1}个点时出错:`, error);
            break;
          }
        }
        
        console.log('二进制PLY解析完成，有效点数:', points.length);
        
        if (points.length === 0) {
          this.$message.error('未能解析到有效的点云数据，请检查PLY文件格式');
          return;
        }
        
        this.pointCloudData = points;
        this.pointCloudInfo = {
          fileName: fileName,
          fileSize: buffer.byteLength,
          pointCount: points.length,
          format: 'PLY (Binary)',
          hasNormals: points[0].nx !== undefined,
          hasColors: points[0].r !== undefined
        };
        
        // 初始化显示点数
        this.displayPointCount = Math.min(points.length, 5000);
        
        console.log('点云信息:', this.pointCloudInfo);
        console.log('显示点数设置:', this.displayPointCount, '/', points.length);
        
        this.showPreview = true;
        this.previewExpanded = true;
        
        // 自动保存点云数据
        this.savePointCloudData();
        
        this.$nextTick(() => {
          console.log('开始初始化点云预览');
          setTimeout(() => {
            this.initViewer();
          }, 100);
        });
        
      } catch (error) {
        console.error('二进制PLY解析失败:', error);
        this.$message.error('二进制PLY文件解析失败: ' + error.message);
      }
    },

    parseASCIIPLY(content, fileName) {
      console.log('解析ASCII PLY文件');
      
      const lines = content.split('\n');
      let headerEndIndex = -1;
      let vertexCount = 0;
      let properties = [];
      
      // 解析头部
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('element vertex')) {
          vertexCount = parseInt(line.split(' ')[2]);
          console.log('顶点数量:', vertexCount);
        } else if (line.startsWith('property')) {
          const parts = line.split(' ');
          const propType = parts[1]; // double, float, int等
          const propName = parts[2]; // x, y, z, nx, ny, nz等
          properties.push({ type: propType, name: propName });
          console.log('属性:', propType, propName);
        } else if (line === 'end_header') {
          headerEndIndex = i;
          break;
        }
      }
      
      if (headerEndIndex === -1) {
        this.$message.error('PLY文件头部格式错误');
        return;
      }
      
      console.log('头部结束位置:', headerEndIndex);
      console.log('文件总行数:', lines.length);
      console.log('属性列表:', properties);
      
      // 解析点云数据
      const points = [];
      let validPoints = 0;
      let invalidLines = 0;
      
      for (let i = headerEndIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(/\s+/);
        
        if (values.length >= properties.length) {
          const point = {};
          let isValid = true;
          
          // 按属性顺序解析数据
          for (let j = 0; j < properties.length; j++) {
            const value = parseFloat(values[j]);
            if (isNaN(value)) {
              isValid = false;
              break;
            }
            point[properties[j].name] = value;
          }
          
          if (isValid && point.x !== undefined && point.y !== undefined && point.z !== undefined) {
            // 处理颜色值（如果是uchar类型，需要归一化）
            if (point.red !== undefined && point.green !== undefined && point.blue !== undefined) {
              point.r = point.red / 255;
              point.g = point.green / 255;
              point.b = point.blue / 255;
              delete point.red;
              delete point.green;
              delete point.blue;
            }
            
            points.push(point);
            validPoints++;
            
            if (validPoints <= 3) {
              console.log(`第${validPoints}个点:`, point);
            }
          } else {
            invalidLines++;
          }
        } else {
          invalidLines++;
        }
      }
      
      console.log('PLY解析完成，有效点数:', validPoints, '无效行数:', invalidLines);
      
      if (points.length === 0) {
        this.$message.error('未能解析到有效的点云数据，请检查PLY文件格式');
        return;
      }
      
      this.pointCloudData = points;
      this.pointCloudInfo = {
        fileName: fileName,
        fileSize: content.length,
        pointCount: points.length,
        format: 'PLY (ASCII)',
        hasNormals: points[0].nx !== undefined,
        hasColors: points[0].r !== undefined
      };
      
      // 初始化显示点数
      this.displayPointCount = Math.min(points.length, 5000);
      
      console.log('点云信息:', this.pointCloudInfo);
      console.log('显示点数设置:', this.displayPointCount, '/', points.length);
      
      this.showPreview = true;
      this.previewExpanded = true;
      
      // 自动保存点云数据
      this.savePointCloudData();
      
      this.$nextTick(() => {
        console.log('开始初始化点云预览');
        setTimeout(() => {
          this.initViewer();
        }, 100);
      });
    },

    parsePointCloud(content, fileName) {
      console.log('开始解析点云文件:', fileName);
      console.log('文件内容长度:', content.length);
      
      const lines = content.split('\n').filter(line => line.trim());
      console.log('有效行数:', lines.length);
      
      const points = [];
      let validPoints = 0;
      let invalidLines = 0;
      
      lines.forEach((line, index) => {
        const coords = line.trim().split(/\s+/);
        
        // 检查是否有足够的坐标值
        if (coords.length >= 3) {
          const x = parseFloat(coords[0]);
          const y = parseFloat(coords[1]);
          const z = parseFloat(coords[2]);
          
          // 检查坐标是否为有效数字
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          const point = {
              x: x,
              y: y,
              z: z
          };
          
          // 如果包含法向量信息（6个值：x, y, z, nx, ny, nz）
          if (coords.length >= 6) {
              const nx = parseFloat(coords[3]);
              const ny = parseFloat(coords[4]);
              const nz = parseFloat(coords[5]);
              
              // 检查法向量是否为有效数字
              if (!isNaN(nx) && !isNaN(ny) && !isNaN(nz)) {
                point.nx = nx;
                point.ny = ny;
                point.nz = nz;
              }
          }
          
          points.push(point);
            validPoints++;
          
          // 打印前几行的解析结果
          if (index < 3) {
            console.log(`第${index + 1}行解析结果:`, point);
            }
          } else {
            invalidLines++;
            console.warn(`第${index + 1}行包含无效坐标:`, coords.slice(0, 3));
          }
        } else {
          invalidLines++;
          if (index < 5) {
            console.warn(`第${index + 1}行格式不正确:`, line);
          }
        }
      });

      console.log('解析完成，有效点数:', validPoints, '无效行数:', invalidLines);
      console.log('前3个点:', points.slice(0, 3));

      if (points.length === 0) {
        this.$message.error('未能解析到有效的点云数据，请检查文件格式');
        return;
      }

      this.pointCloudData = points;
      this.pointCloudInfo = {
        fileName: fileName,
        fileSize: content.length,
        pointCount: points.length,
        format: fileName.split('.').pop().toUpperCase(),
        hasNormals: points.length > 0 && points[0].hasOwnProperty('nx')
      };
      
      // 初始化显示点数，根据总点数调整
      const maxDisplayPoints = Math.min(points.length, 20000);
      this.displayPointCount = Math.min(points.length, 5000);
      
      console.log('点云信息:', this.pointCloudInfo);
      console.log('显示点数设置:', this.displayPointCount, '/', points.length);
      
      this.showPreview = true;
      this.previewExpanded = true; // 确保预览是展开的
      
      // 自动保存点云数据
      this.savePointCloudData();
      
      this.$nextTick(() => {
        console.log('开始初始化点云预览');
        // 添加一个小延迟确保DOM完全更新
        setTimeout(() => {
          this.initViewer();
        }, 100);
      });
    },

    initViewer(keepCurrentView = false) {
      console.log('initViewer被调用，保持当前视角:', keepCurrentView);
      
      // 防止重复初始化
      if (this.isViewerInitialized && !keepCurrentView) {
        console.log('预览器已经初始化，跳过重复初始化');
        return;
      }
      
      if (!this.pointCloudData || !this.pointCloudData.length) {
        console.error('没有点云数据，无法初始化预览');
        return;
      }

      const container = this.$refs.pointCloudViewer;
      if (!container) {
        console.error('找不到预览容器元素');
        return;
      }

      console.log('容器尺寸:', container.clientWidth, 'x', container.clientHeight);

      // 保存当前的相机位置和控制器状态（如果需要保持视角）
      let savedCameraPosition = null;
      let savedControlsTarget = null;
      let savedAutoRotate = false;
      
      if (keepCurrentView && this.camera && this.controls) {
        savedCameraPosition = this.camera.position.clone();
        savedControlsTarget = this.controls.target.clone();
        savedAutoRotate = this.controls.autoRotate;
        console.log('保存当前视角状态用于保持');
      }

      // 清理之前的渲染器
      this.cleanupViewer();

      try {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 10000);
        
        // 计算点云边界框
        const points = this.pointCloudData.slice(0, this.displayPointCount); // 使用动态点数
        console.log('用于计算边界框的点数:', points.length);
        
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));
        const minZ = Math.min(...points.map(p => p.z));
        const maxZ = Math.max(...points.map(p => p.z));
        
        console.log('边界框:', {minX, maxX, minY, maxY, minZ, maxZ});
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
        
        console.log('中心点:', {centerX, centerY, centerZ}, '尺寸:', size);
        
        // 设置相机位置（如果不保持当前视角）
        if (!keepCurrentView || !savedCameraPosition) {
          this.camera.position.set(centerX + size, centerY + size, centerZ + size);
          this.camera.lookAt(centerX, centerY, centerZ);
        }

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio); // 启用高DPI支持
        container.appendChild(this.renderer.domElement);

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // 增加环境光强度
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // 增加方向光强度
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // 创建点云几何体
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(points.length * 3);
        const colors = new Float32Array(points.length * 3);
        
        console.log('开始创建几何体，点数:', points.length);
        
        points.forEach((point, index) => {
          positions[index * 3] = point.x;
          positions[index * 3 + 1] = point.y;
          positions[index * 3 + 2] = point.z;
          
          // 颜色处理优先级：PLY颜色 > 法向量颜色 > 渐变色
          if (point.hasOwnProperty('r') && !isNaN(point.r)) {
            // 使用PLY文件中的颜色
            colors[index * 3] = point.r;
            colors[index * 3 + 1] = point.g;
            colors[index * 3 + 2] = point.b;
          } else if (point.hasOwnProperty('nx') && !isNaN(point.nx)) {
            // 使用法向量作为颜色
            colors[index * 3] = (point.nx + 1) / 2;     // 将法向量映射到0-1范围
            colors[index * 3 + 1] = (point.ny + 1) / 2;
            colors[index * 3 + 2] = (point.nz + 1) / 2;
          } else {
            // 使用渐变色
            const t = index / points.length;
            colors[index * 3] = 0.2 + t * 0.6;     // 红色分量
            colors[index * 3 + 1] = 0.8 - t * 0.4; // 绿色分量
            colors[index * 3 + 2] = 0.2 + t * 0.4; // 蓝色分量
          }
        });
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // 使用pointSize变量
        const material = new THREE.PointsMaterial({
          size: 0.01,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });
        
        const pointCloud = new THREE.Points(geometry, material);
        this.scene.add(pointCloud);

        // 添加控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 2.0;
        
        // 设置控制器限制
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 1000;
        
        // 如果保持当前视角，恢复相机位置和控制器状态
        if (keepCurrentView && savedCameraPosition && savedControlsTarget) {
          this.camera.position.copy(savedCameraPosition);
          this.controls.target.copy(savedControlsTarget);
          this.controls.autoRotate = savedAutoRotate;
          this.controls.update();
          console.log('已恢复之前的视角状态');
        }
        
        // 启动动画循环以支持交互
        this.startAnimation();
        
        this.isViewerInitialized = true;
        console.log('点云预览初始化成功，渲染了', points.length, '个点');
        
      } catch (error) {
        console.error('初始化点云预览时发生错误:', error);
        this.$message.error('点云预览初始化失败: ' + error.message);
        this.cleanupViewer();
      }
    },

    startAnimation() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      
      const animate = () => {
        if (this.controls && this.renderer && this.scene && this.camera) {
          this.controls.update();
          this.renderer.render(this.scene, this.camera);
          this.animationId = requestAnimationFrame(animate);
        }
      };
      animate();
    },

    cleanupViewer() {
      // 停止动画循环
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      // 清理渲染器
      if (this.renderer) {
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
        this.renderer = null;
      }
      
      // 清理控制器
      if (this.controls) {
        this.controls.dispose();
        this.controls = null;
      }
      
      this.isViewerInitialized = false;
    },

    togglePreview() {
      this.previewExpanded = !this.previewExpanded;
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async processPointCloud() {
      if (!this.pointCloudInfo || !this.pointCloudData) {
        this.$message.warning('请先上传点云文件');
        return;
      }

      const loading = this.$loading({
        lock: true,
        text: '正在处理点云数据...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      try {
        // 将点云数据转换为PLY格式并上传到后端
        await this.savePointCloudAsCache();
      
      // 将点云数据传递给父组件
      this.$emit('point-cloud-ready', {
        data: this.pointCloudData,
        info: this.pointCloudInfo
      });
      
        loading.close();
      this.$message.success('点云数据已准备就绪，可以进行NeurCAD重建');
      } catch (error) {
        loading.close();
        console.error('处理点云数据失败:', error);
        this.$message.error('处理点云数据失败: ' + error.message);
      }
    },

    async savePointCloudAsCache() {
      try {
        // 创建PLY文件内容
        let plyContent = 'ply\n';
        plyContent += 'format ascii 1.0\n';
        plyContent += 'comment Generated by CrownCAD Plugin\n';
        plyContent += `element vertex ${this.pointCloudData.length}\n`;
        plyContent += 'property double x\n';
        plyContent += 'property double y\n';
        plyContent += 'property double z\n';
        
        // 如果有法向量，添加法向量属性
        if (this.pointCloudInfo.hasNormals) {
          plyContent += 'property double nx\n';
          plyContent += 'property double ny\n';
          plyContent += 'property double nz\n';
        }
        
        plyContent += 'end_header\n';
        
        // 添加点云数据
        this.pointCloudData.forEach(point => {
          let line = `${point.x} ${point.y} ${point.z}`;
          if (this.pointCloudInfo.hasNormals && point.nx !== undefined) {
            line += ` ${point.nx} ${point.ny} ${point.nz}`;
          }
          plyContent += line + '\n';
        });
        
        // 创建Blob并上传到后端
        const blob = new Blob([plyContent], { type: 'text/plain' });
        const file = new File([blob], 'input_pld.ply', { type: 'text/plain' });
        
        console.log('准备上传点云文件到后端，大小:', blob.size, '字节');
        
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // 上传到后端
        const response = await fetch('http://localhost:5001/api/upload-pointcloud', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || '文件上传失败');
        }
        
        console.log('点云文件上传成功:', result);
        
        // 保存文件信息到localStorage
        const fileInfo = {
          fileId: result.file_id,
          fileName: result.filename,
          fileSize: result.file_size,
          pointCount: this.pointCloudData.length,
          format: 'PLY',
          hasNormals: this.pointCloudInfo.hasNormals,
          timestamp: Date.now()
        };
        localStorage.setItem('crowncad_cache_file_info', JSON.stringify(fileInfo));
        
        // 保存文件ID到组件中
        this.uploadedFileId = result.file_id;
        
        console.log('点云文件信息已保存:', fileInfo);
        
      } catch (error) {
        console.error('上传点云文件失败:', error);
        throw new Error('上传点云文件失败: ' + error.message);
      }
    },

    clearFiles() {
      this.fileList = [];
      this.pointCloudInfo = null;
      this.pointCloudData = null;
      this.showPreview = false;
      this.uploadedFileId = null;
      
      this.cleanupViewer();
      
      // 清理localStorage中的文件信息
      localStorage.removeItem('crowncad_cache_file_info');
      
      // 清理点云相关的缓存数据
      this.clearPointCloudCache();
      
      this.$message.info('文件已清空');
    },

    clearPointCloudCache() {
      try {
        localStorage.removeItem('crowncad_pointcloud_info');
        localStorage.removeItem('crowncad_pointcloud_data');
        localStorage.removeItem('crowncad_preview_expanded');
        localStorage.removeItem('crowncad_display_point_count');
        localStorage.removeItem('crowncad_auto_rotate');
        localStorage.removeItem('crowncad_file_list');
        localStorage.removeItem('crowncad_uploaded_file_id');
        console.log('已清除点云缓存数据');
      } catch (error) {
        console.error('清除点云缓存数据失败:', error);
      }
    },

    onWindowResize() {
      // 暂时禁用窗口大小变化处理，避免递归问题
      return;
    },

    resetCamera() {
      if (this.controls && this.pointCloudData && this.pointCloudData.length > 0) {
        // 计算点云边界框
        const points = this.pointCloudData.slice(0, this.displayPointCount);
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));
        const minZ = Math.min(...points.map(p => p.z));
        const maxZ = Math.max(...points.map(p => p.z));
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
        
        // 重置相机位置
        this.camera.position.set(centerX + size, centerY + size, centerZ + size);
        this.camera.lookAt(centerX, centerY, centerZ);
        
        // 重置控制器
        this.controls.target.set(centerX, centerY, centerZ);
        this.controls.update();
        
        this.$message.success('视角已重置');
      }
    },

    toggleAutoRotate() {
      this.autoRotate = !this.autoRotate;
      if (this.controls) {
        this.controls.autoRotate = this.autoRotate;
      }
      this.$message.success(this.autoRotate ? '已开启自动旋转' : '已停止自动旋转');
    },

    updatePointDisplay() {
      if (this.pointCloudData && this.pointCloudData.length > 0) {
        console.log('更新点显示，目标点数:', this.displayPointCount);
        
        // 重新初始化点云显示，保持当前视角
        this.isViewerInitialized = false;
        this.$nextTick(() => {
          this.initViewer(true); // 传递true表示保持当前视角
        });
      }
    },

    updatePointSize() {
      // 重新渲染点云，点大小变化
      this.isViewerInitialized = false;
      this.$nextTick(() => {
        this.initViewer();
      });
    },

    // 恢复点云数据
    restorePointCloudData() {
      try {
        // 恢复点云信息
        const savedInfo = localStorage.getItem('crowncad_pointcloud_info');
        if (savedInfo) {
          this.pointCloudInfo = JSON.parse(savedInfo);
          console.log('恢复点云信息:', this.pointCloudInfo);
        }
        
        // 恢复点云数据（只恢复前1000个点以节省内存）
        const savedData = localStorage.getItem('crowncad_pointcloud_data');
        if (savedData) {
          const fullData = JSON.parse(savedData);
          // 只恢复前1000个点用于预览
          this.pointCloudData = fullData.slice(0, 1000);
          console.log('恢复点云数据:', this.pointCloudData.length, '个点（预览用）');
          
          // 恢复显示设置
          this.showPreview = true;
          this.previewExpanded = JSON.parse(localStorage.getItem('crowncad_preview_expanded') || 'true');
          this.displayPointCount = parseInt(localStorage.getItem('crowncad_display_point_count') || '5000');
          this.autoRotate = JSON.parse(localStorage.getItem('crowncad_auto_rotate') || 'false');
          
          // 恢复文件列表信息
          const savedFileList = localStorage.getItem('crowncad_file_list');
          if (savedFileList) {
            this.fileList = JSON.parse(savedFileList);
          }
          
          // 恢复上传的文件ID
          const savedFileId = localStorage.getItem('crowncad_uploaded_file_id');
          if (savedFileId) {
            this.uploadedFileId = savedFileId;
          }
          
          // 重新初始化预览
          this.$nextTick(() => {
            this.initViewer();
          });
          
          console.log('点云数据恢复完成');
        }
        
      } catch (error) {
        console.error('恢复点云数据失败:', error);
      }
    },

    // 保存点云数据
    savePointCloudData() {
      try {
        // 保存点云信息
        if (this.pointCloudInfo) {
          localStorage.setItem('crowncad_pointcloud_info', JSON.stringify(this.pointCloudInfo));
          console.log('保存点云信息');
        }
        
        // 保存点云数据（只保存前1000个点以节省存储空间）
        if (this.pointCloudData && this.pointCloudData.length > 0) {
          const dataToSave = this.pointCloudData.slice(0, 1000);
          localStorage.setItem('crowncad_pointcloud_data', JSON.stringify(dataToSave));
          console.log('保存点云数据:', dataToSave.length, '个点');
        }
        
        // 保存显示设置
        localStorage.setItem('crowncad_preview_expanded', JSON.stringify(this.previewExpanded));
        localStorage.setItem('crowncad_display_point_count', this.displayPointCount.toString());
        localStorage.setItem('crowncad_auto_rotate', JSON.stringify(this.autoRotate));
        
        // 保存文件列表信息
        if (this.fileList.length > 0) {
          localStorage.setItem('crowncad_file_list', JSON.stringify(this.fileList));
        }
        
        // 保存上传的文件ID
        if (this.uploadedFileId) {
          localStorage.setItem('crowncad_uploaded_file_id', this.uploadedFileId);
        }
        
        console.log('点云数据保存完成');
        
      } catch (error) {
        console.error('保存点云数据失败:', error);
      }
    }
  },

  mounted() {
    // 暂时禁用窗口大小变化监听，避免递归问题
    // window.addEventListener('resize', this.onWindowResize);
    
    // 恢复点云数据
    this.restorePointCloudData();
  },

  beforeDestroy() {
    // 移除窗口大小变化监听
    // window.removeEventListener('resize', this.onWindowResize);
    
    // 保存点云数据
    this.savePointCloudData();
    
    // 清理所有资源
    this.cleanupViewer();
  }
}
</script>

<style scoped>
.upload-demo {
  width: 100%;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 7px;
}
</style> 