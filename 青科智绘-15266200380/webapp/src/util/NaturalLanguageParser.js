/**
 * 自然语言解析器 - 解析几何描述并提取参数
 */
class NaturalLanguageParser {
  constructor() {
    this.shapePatterns = {
      '长方体': /长方体|矩形|立方体|盒子|方体/,
      '圆柱': /圆柱|圆筒|管子|柱体/,
      '球': /球|球形|圆球/,
      '圆锥': /圆锥|锥形/,
      '棱柱': /棱柱|多棱柱/
    };
    
    this.dimensionPatterns = {
      '长': /长\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/,
      '宽': /宽\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/,
      '高': /高\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/,
      '半径': /半径\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/,
      '直径': /直径\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/,
      '圆角半径': /圆角半径\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/,
      '圆角': /圆角\s*(\d+(?:\.\d+)?)\s*(cm|mm|m)?/
    };
    
    this.featurePatterns = {
      '圆角': /圆角|倒圆角/,
      '大圆角': /大圆角|大倒圆角/,
      '小圆角': /小圆角|小倒圆角/,
      '倒角': /倒角|斜角/,
      '孔': /孔|洞|穿孔/,
      '螺纹': /螺纹|螺孔/
    };
  }
  
  parse(description) {
    console.log('Parsing description:', description);
    const result = {
      shape: null,
      dimensions: {},
      features: [],
      confidence: 0
    };
    
    // 识别形状
    const shapeConfidence = this.identifyShape(description, result);
    console.log('Shape confidence:', shapeConfidence, 'Shape:', result.shape);
    
    // 提取尺寸
    const dimConfidence = this.extractDimensions(description, result);
    console.log('Dimension confidence:', dimConfidence, 'Dimensions:', result.dimensions);
    
    // 识别特征
    const featureConfidence = this.identifyFeatures(description, result);
    console.log('Feature confidence:', featureConfidence, 'Features:', result.features);
    
    // 计算总体置信度
    result.confidence = (shapeConfidence + dimConfidence + featureConfidence) / 3;
    console.log('Overall confidence:', result.confidence);
    
    return result;
  }
  
  identifyShape(description, result) {
    for (const [shape, pattern] of Object.entries(this.shapePatterns)) {
      if (pattern.test(description)) {
        result.shape = shape;
        return 0.9;
      }
    }
    return 0.1;
  }
  
  extractDimensions(description, result) {
    let confidence = 0;
    for (const [dimName, pattern] of Object.entries(this.dimensionPatterns)) {
      const match = description.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2] || 'cm';
        result.dimensions[dimName] = {
          value: value,
          unit: unit,
          normalizedValue: this.normalizeUnit(value, unit)
        };
        confidence += 0.3;
      }
    }
    return Math.min(confidence, 1.0);
  }
  
  identifyFeatures(description, result) {
    let confidence = 0;
    for (const [feature, pattern] of Object.entries(this.featurePatterns)) {
      if (pattern.test(description)) {
        result.features.push(feature);
        confidence += 0.2;
      }
    }
    return Math.min(confidence, 1.0);
  }
  
  normalizeUnit(value, unit) {
    // 转换为毫米
    switch (unit) {
      case 'cm': return value * 10;
      case 'm': return value * 1000;
      default: return value; // 假设是mm
    }
  }
}

export default NaturalLanguageParser; 