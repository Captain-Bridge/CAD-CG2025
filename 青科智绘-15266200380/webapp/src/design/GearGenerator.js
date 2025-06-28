import { Axis, Point } from "../../nodeApp/static/lib/crowncad-plugin-sdk-0.0.3";
import { symmetryPoint } from "../util/Common";
import * as THREE from 'three';
import { ccPlugin } from "../util/CcPluginManager";

/**
 * 齿轮创建
 */
class GearGenerator {

  constructor() {
  }

  /**
   * 创建正齿轮
   */
  async createSpurGear(spurGear) {
    const sketch = ccPlugin.command.sketch;
    const solid = ccPlugin.command.solid;
    this.createAddendumSketch(sketch, spurGear.ra);  // 创建草图 1
    const distance = this.createCutSketch(sketch, spurGear);  // 创建草图 2
    await ccPlugin.command.execute(true);
    ccPlugin.command.clearCommand();
    await this.createFillet(sketch, spurGear.toothFilterR, distance);
    await ccPlugin.command.execute();
    ccPlugin.command.clearCommand();
    await this.extrudeAddendum(solid, spurGear.teethWidth);
    await ccPlugin.command.execute();
    ccPlugin.command.clearCommand();
    await this.extrudeCut(solid, spurGear.teethWidth);
    await ccPlugin.command.execute();
    ccPlugin.command.clearCommand();
    await this.circularPattern(solid, spurGear.teethNumber);
    await ccPlugin.command.execute();
    ccPlugin.command.clearCommand();
  }

  /**
   * 创建齿顶圆草图
   */
  createAddendumSketch(sketch, ra) {
    sketch.createSketch({ sketchName: '草图1', datumId: 8 });
    sketch.createCircle({ centerPoint: new Point(0, 0), circlePoint: new Point(ra, 0) });
    sketch.exitSketch();
  }

  /**
   * 创建拉伸切除草图
   */
  createCutSketch(sketch, spurGear) {
    sketch.createSketch({ sketchName: '草图2', datumId: 8 });
    const angle = Math.PI / 3;

    /*
    绘制两侧渐开线：
    获取右侧渐开线与分度圆交点 Q
    通过齿距弦长计算 OQ 与对称轴之间的角度 θ，得到 Q 在对称轴上的投影点 M
    以 OM 为对称轴，得到左侧渐开线
    */
    const QPoint = this.getIntersectionPointInInvolute(0, angle, spurGear.rb, (spurGear.rd + (spurGear.modification * spurGear.module)));
    const theta = Math.PI / (2 * spurGear.teethNumber);
    const mX = QPoint.x * Math.cos(theta) - QPoint.y * Math.sin(theta);
    const mY = QPoint.x * Math.sin(theta) + QPoint.y * Math.cos(theta);
    const MPoint = new THREE.Vector3(mX, mY);
    const OPoint = new THREE.Vector3(0, 0);

    // 齿根圆关键点与其对称点
    let pointF = this.getPoint({ x: 0, y: spurGear.rf });
    let pointFS = this.getPoint(symmetryPoint(new THREE.Vector3(0, spurGear.rf), OPoint, MPoint));

    // 绘制渐开线
    const involuteRightPoints = [];
    const involuteLeftPoints = [];
    const increment = 0.05;
    if (spurGear.rb > spurGear.rf) {
      for (let i = 0; i < angle; i += increment) {
        const x = spurGear.rb * (Math.sin(i) - i * Math.cos(i));
        const y = spurGear.rb * (Math.cos(i) + i * Math.sin(i));
        involuteRightPoints.push(this.getPoint({ x, y }));
        const symPoint = symmetryPoint(new THREE.Vector3(x, y), OPoint, MPoint);  // 对称点
        involuteLeftPoints.push(this.getPoint(symPoint));
      }
    } else {  // 齿根圆半径大于基圆半径，以齿根圆与渐开线交点为起点，绘制渐开线
      const interPoint = this.getIntersectionPointInInvolute(0, angle, spurGear.rb, spurGear.rf);
      pointF = this.getPoint(interPoint);
      pointFS = this.getPoint(symmetryPoint(new THREE.Vector3(interPoint.x, interPoint.y), OPoint, MPoint));
      involuteRightPoints.push(pointF);
      involuteLeftPoints.push(pointFS);
      for (let i = 0; i < angle; i += increment) {
        const x = spurGear.rb * (Math.sin(i) - i * Math.cos(i));
        const y = spurGear.rb * (Math.cos(i) + i * Math.sin(i));
        if (Math.sqrt(x * x + y * y) > spurGear.rf) {
          involuteRightPoints.push(this.getPoint({ x, y }));
          const symPoint = symmetryPoint(new THREE.Vector3(x, y), OPoint, MPoint);
          involuteLeftPoints.push(this.getPoint(symPoint));
        }
      }
    }

    sketch.createIntpCurve({ pickPoints: involuteRightPoints });
    sketch.createIntpCurve({ pickPoints: involuteLeftPoints });

    // 两侧渐开线上顶点连线
    sketch.createSketchLine({
      startPoint: new Point(involuteLeftPoints[involuteLeftPoints.length - 1].x, involuteLeftPoints[involuteLeftPoints.length - 1].y),
      endPoint: new Point(involuteRightPoints[involuteRightPoints.length - 1].x, involuteRightPoints[involuteRightPoints.length - 1].y)
    });
    // 齿根圆
    sketch.createArcByCenter({
      centerPoint: new Point(0, 0),
      startPoint: pointF,
      endPoint: pointFS
    });

    const delta = Math.sqrt((involuteRightPoints[0].x - pointF.x) * (involuteRightPoints[0].x - pointF.x) +
      (involuteRightPoints[0].y - pointF.y) * (involuteRightPoints[0].y - pointF.y));
    if (delta > spurGear.toothFilterR) {
      // 渐开线与圆角连线
      sketch.createSketchLine({
        startPoint: new Point(involuteRightPoints[0].x, involuteRightPoints[0].y),
        endPoint: pointF
      });
      sketch.createSketchLine({
        startPoint: new Point(involuteLeftPoints[0].x, involuteLeftPoints[0].y),
        endPoint: pointFS
      });
    }
    sketch.exitSketch();

    return delta;
  }

  /**
   * 齿根圆圆角
   */
  async createFillet(sketch, rho, dis) {
    let elements = await ccPlugin.query.getElementsByFeatureNames(['草图2']);
    elements = elements.data;
    if (dis > rho) {
      let arcF, rLine, lLing;
      elements.elements.forEach(element => {
        if (element.params.type === 12) {
          arcF = element.id;
        }
        if (element.params.type === 10) {
          if (element.params.startPoint[0] === 0) {
            rLine = element.id;
          } else if (element.params.startPoint[0] < 0 && element.params.endPoint[0] < 0) {
            lLing = element.id;
          }
        }
      });
      sketch.editSketch({ sketchName: '草图2' });
      sketch.createFilletCurve({ curveId1: arcF, curveId2: rLine, radius: rho, type1: 2, type2: 2 });
      sketch.createFilletCurve({ curveId1: arcF, curveId2: lLing, radius: rho, type1: 2, type2: 2 });
      sketch.exitEditSketch({ sketchName: '草图2' });
    } else {
      let arcF, rInv, lInv;
      let tempElement;
      elements.elements.forEach(element => {
        if (element.params.type === 12) {
          arcF = element.id;
        }
        if (element.params.type === 15) {
          if (tempElement) {
            if (element.params.startPoint[0] > tempElement.params.startPoint[0]) {
              rInv = element.id;
              lInv = tempElement.id;
            } else {
              rInv = tempElement.id;
              lInv = element.id;
            }
          }
          tempElement = element;
        }
      });
      sketch.editSketch({ sketchName: '草图2' });
      sketch.createFilletCurve({ curveId1: arcF, curveId2: rInv, radius: rho, type1: 2, type2: 2 });
      sketch.createFilletCurve({ curveId1: arcF, curveId2: lInv, radius: rho, type1: 2, type2: 2 });
      sketch.exitEditSketch({ sketchName: '草图2' });
    }
  }

  /**
   * 获取基圆在 [startAngle, endAngle] 之间渐开线与目标圆的交点
   */
  getIntersectionPointInInvolute(startAngle, endAngle, baseR, targetR) {
    const midAngle = (startAngle + endAngle) / 2;
    const x = baseR * (Math.sin(midAngle) - midAngle * Math.cos(midAngle));
    const y = baseR * (Math.cos(midAngle) + midAngle * Math.sin(midAngle));
    const delta = Math.sqrt(x * x + y * y) - targetR;
    if (Math.abs(delta) < 0.001) {
      return { x, y };
    }
    if (delta > 0) {  // 二分中点在目标圆外部
      return this.getIntersectionPointInInvolute(startAngle, midAngle, baseR, targetR);
    } else if (delta < 0) {  // 二分中点在目标圆内部
      return this.getIntersectionPointInInvolute(midAngle, endAngle, baseR, targetR);
    }
  }

  /**
   * 创建齿顶圆拉伸体
   */
  async extrudeAddendum(solid, teethWidth) {
    let res = await ccPlugin.query.getEntitiesByFeatureNames(['草图1']);
    res = res.data;
    if (res?.entities) {
      solid.extrude({
        sketch: res.entities[0].id,
        height1: teethWidth + ''
      }, '拉伸凸台');
    }
  }

  /**
   * 创建切除体
   */
  async extrudeCut(solid, teethWidth) {
    let res = await ccPlugin.query.getEntitiesByFeatureNames(['草图2']);
    res = res.data;
    if (res?.entities) {
      let extrudeRes = await ccPlugin.query.getEntitiesByFeatureNames(['拉伸凸台']);
      extrudeRes = extrudeRes.data;
      if (extrudeRes?.entities) {
        solid.extrudeCut({
          sketch: res.entities[0].id, height1: teethWidth + '', cutSolids: [extrudeRes.entities[0]?.id]
        }, '拉伸切除');
      }
    }
  }

  /**
   * 创建圆周阵列
   */
  async circularPattern(solid, teethNumber) {
    const axis = new Axis();
    axis.setPoint(new Point(0, 0, 0), new Point(0, 0, 10));
    let res = await ccPlugin.query.getFeaturesByNames(['拉伸切除']);
    res = res.data;
    if (res?.features) {
      solid.circularPattern({
        baseType: 1, features: [res.features[0]?.id], axis: axis, angle1: 360, instanceNum1: teethNumber,
      }, '圆周阵列');
    }
  }

  /**
   * 处理点坐标的误差
   */
  getPoint(point) {
    const x = Math.abs(point.x) < 1e-10 ? 0 : point.x;
    const y = Math.abs(point.y) < 1e-10 ? 0 : point.y;
    return new Point(x, y);
  }

}

const gearGenerator = new GearGenerator();
export { gearGenerator };
