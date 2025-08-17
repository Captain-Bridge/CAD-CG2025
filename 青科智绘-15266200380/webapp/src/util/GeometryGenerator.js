/**
 * 几何体生成器 - 根据解析结果生成Three.js几何体
 */
import * as THREE from 'three';

class GeometryGenerator {
  constructor() {
    this.supportedShapes = ['长方体', '圆柱', '球', '圆锥'];
  }
  
  generate(parsedResult) {
    console.log('GeometryGenerator.generate called with:', parsedResult);
    const shape = parsedResult.shape;
    const dimensions = parsedResult.dimensions;
    const features = parsedResult.features;
    
    console.log('Shape:', shape);
    console.log('Dimensions:', dimensions);
    console.log('Features:', features);
    
    // 验证输入
    const validation = this.validateInput(parsedResult);
    if (!validation.valid) {
      console.error('Validation failed:', validation);
      throw new Error(validation.error);
    }
    
    console.log('Validation passed, generating geometry...');
    
    // 生成几何体
    let geometry;
    switch (shape) {
      case '长方体':
        console.log('Creating box geometry...');
        geometry = this.createBox(dimensions, features);
        break;
      case '圆柱':
        console.log('Creating cylinder geometry...');
        geometry = this.createCylinder(dimensions, features);
        break;
      case '球':
        console.log('Creating sphere geometry...');
        geometry = this.createSphere(dimensions, features);
        break;
      case '圆锥':
        console.log('Creating cone geometry...');
        geometry = this.createCone(dimensions, features);
        break;
      default:
        throw new Error(`不支持的形状: ${shape}`);
    }
    
    return {
      shape: shape,
      geometry: geometry,
      dimensions: dimensions,
      features: features,
      generationTime: Date.now()
    };
  }
  
  validateInput(parsedResult) {
    const shape = parsedResult.shape;
    const dimensions = parsedResult.dimensions;
    
    if (!shape) {
      return {
        valid: false,
        error: '无法识别几何形状',
        suggestion: '请明确描述要创建的形状，如"长方体"、"圆柱"等',
        suggestions: [
          '使用明确的形状名称：长方体、圆柱、球等',
          '添加尺寸信息：长、宽、高、半径等',
          '检查描述是否包含必要的几何信息'
        ]
      };
    }
    
    if (!this.supportedShapes.includes(shape)) {
      return {
        valid: false,
        error: `暂不支持"${shape}"形状`,
        suggestion: `目前支持的形状：${this.supportedShapes.join('、')}`,
        suggestions: [
          `请使用支持的形状：${this.supportedShapes.join('、')}`,
          '或尝试使用更基础的形状描述'
        ]
      };
    }
    
    const requiredDims = this.getRequiredDimensions(shape);
    const missingDims = requiredDims.filter(dim => !dimensions[dim]);
    
    if (missingDims.length > 0) {
      return {
        valid: false,
        error: `缺少必要的尺寸参数：${missingDims.join('、')}`,
        suggestion: `请为${shape}提供完整的尺寸信息`,
        suggestions: [
          `为${shape}添加${missingDims.join('、')}参数`,
          '使用标准单位：cm、mm、m',
          '参考示例格式'
        ]
      };
    }
    
    return { valid: true };
  }
  
  getRequiredDimensions(shape) {
    const requirements = {
      '长方体': ['长', '宽', '高'],
      '圆柱': ['半径', '高'],
      '球': ['半径'],
      '圆锥': ['半径', '高']
    };
    return requirements[shape] || [];
  }
  
  createBox(dimensions, features) {
    console.log('Creating box with dimensions:', dimensions);
    const length = dimensions['长'].normalizedValue;
    const width = dimensions['宽'].normalizedValue;
    const height = dimensions['高'].normalizedValue;
    
    console.log('Box dimensions - length:', length, 'width:', width, 'height:', height);
    
    let geometry;
    
    // 添加圆角特征
    if (features.includes('圆角') || features.includes('大圆角') || features.includes('小圆角')) {
      let radius;
      
      // 检查是否有指定的圆角半径
      if (dimensions['圆角半径']) {
        radius = dimensions['圆角半径'].normalizedValue;
        console.log('Using specified fillet radius:', radius);
      } else if (dimensions['圆角']) {
        radius = dimensions['圆角'].normalizedValue;
        console.log('Using fillet radius from dimensions:', radius);
      } else {
        // 根据特征类型计算默认半径
        if (features.includes('大圆角')) {
          radius = Math.min(length, width, height) * 0.2; // 大圆角：20%
        } else if (features.includes('小圆角')) {
          radius = Math.min(length, width, height) * 0.05; // 小圆角：5%
        } else {
          radius = Math.min(length, width, height) * 0.1; // 默认圆角：10%
        }
        console.log('Using default fillet radius:', radius);
      }
      
      // 创建带圆角的长方体
      geometry = this.createRoundedBox(length, height, width, radius);
    } else {
      // 创建普通长方体
      geometry = new THREE.BoxGeometry(length, height, width);
    }
    
    console.log('Box geometry created:', geometry);
    return geometry;
  }
  
  createRoundedBox(length, height, width, radius) {
    // 简化实现：使用高分段数的长方体来模拟圆角效果
    const segments = 16; // 增加分段数来获得更平滑的效果
    
    // 创建高分段数的长方体
    const geometry = new THREE.BoxGeometry(length, height, width, segments, segments, segments);
    
    // 获取顶点位置
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array;
    
    // 对顶点进行圆角处理
    const halfLength = length / 2;
    const halfHeight = height / 2;
    const halfWidth = width / 2;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // 计算到各个面的距离
      const distToLength = Math.abs(x) - (halfLength - radius);
      const distToHeight = Math.abs(y) - (halfHeight - radius);
      const distToWidth = Math.abs(z) - (halfWidth - radius);
      
      // 如果顶点在圆角区域内
      if (distToLength > 0 && distToHeight > 0 && distToWidth > 0) {
        // 计算圆角位置
        const cornerX = Math.sign(x) * (halfLength - radius);
        const cornerY = Math.sign(y) * (halfHeight - radius);
        const cornerZ = Math.sign(z) * (halfWidth - radius);
        
        // 计算到圆角中心的向量
        const dx = x - cornerX;
        const dy = y - cornerY;
        const dz = z - cornerZ;
        
        // 归一化并应用半径
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance > 0) {
          positions[i] = cornerX + (dx / distance) * radius;
          positions[i + 1] = cornerY + (dy / distance) * radius;
          positions[i + 2] = cornerZ + (dz / distance) * radius;
        }
      }
      // 处理边的情况（两个维度在圆角区域）
      else if (distToLength > 0 && distToHeight > 0) {
        const cornerX = Math.sign(x) * (halfLength - radius);
        const cornerY = Math.sign(y) * (halfHeight - radius);
        const dx = x - cornerX;
        const dy = y - cornerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          positions[i] = cornerX + (dx / distance) * radius;
          positions[i + 1] = cornerY + (dy / distance) * radius;
        }
      }
      else if (distToLength > 0 && distToWidth > 0) {
        const cornerX = Math.sign(x) * (halfLength - radius);
        const cornerZ = Math.sign(z) * (halfWidth - radius);
        const dx = x - cornerX;
        const dz = z - cornerZ;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > 0) {
          positions[i] = cornerX + (dx / distance) * radius;
          positions[i + 2] = cornerZ + (dz / distance) * radius;
        }
      }
      else if (distToHeight > 0 && distToWidth > 0) {
        const cornerY = Math.sign(y) * (halfHeight - radius);
        const cornerZ = Math.sign(z) * (halfWidth - radius);
        const dy = y - cornerY;
        const dz = z - cornerZ;
        const distance = Math.sqrt(dy * dy + dz * dz);
        if (distance > 0) {
          positions[i + 1] = cornerY + (dy / distance) * radius;
          positions[i + 2] = cornerZ + (dz / distance) * radius;
        }
      }
    }
    
    // 更新几何体
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  createCylinder(dimensions, features) {
    const radius = dimensions['半径'].normalizedValue;
    const height = dimensions['高'].normalizedValue;
    
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    
    return geometry;
  }
  
  createSphere(dimensions, features) {
    const radius = dimensions['半径'].normalizedValue;
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    
    return geometry;
  }
  
  createCone(dimensions, features) {
    const radius = dimensions['半径'].normalizedValue;
    const height = dimensions['高'].normalizedValue;
    
    const geometry = new THREE.ConeGeometry(radius, height, 32);
    
    return geometry;
  }
}

export default GeometryGenerator; 