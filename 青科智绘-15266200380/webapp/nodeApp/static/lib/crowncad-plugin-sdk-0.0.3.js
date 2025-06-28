(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["CrownCAD-PluginSDK"] = {}));
})(this, (function (exports) { 'use strict';

  const PluginMessageType = {
    INIT: 'init',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unSubscribe',
    CALLBACK: 'callback',
    DESTROYED: 'destroyed',
    CALL_FUNCTION: 'callFunction',
    EXECUTE_COMMAND: 'executeCommand',
    EXECUTE_INCREMENT_COMMAND: 'executeIncrementCommand',
    EXECUTE_IN_SPECIFIED_DOC: 'EXECUTE_IN_SPECIFIED_DOC',
  };

  const PluginGetElement = {
    BY_IDS: "getElementsByIds",
    BY_FEATURE_ID: "getElementsByFeatureId",
    BY_ENTITY_ID: "getElementsByEntityId",
    IN_ASSEMBLY: "getElementInAssembly",
    BY_INSTANCE_ID: "getElementsByInstanceId",
    BY_FEATURE_NAME_INSTANCE_ID: "getElementsByFeatureNameAndInstanceId",
    BY_FEATURE_NAMES: "getElementsByFeatureNames",
    BY_FEATURE_NAMES_AND_INSTANCE_ID: "getElementsByFeatureNamesAndInsId",
    NORMAL_ON_FACE: "getPointNormalOnFace",
  };

  const PluginGetEntity = {
    BY_IDS: "getEntitiesByIds",
    ALL: "getAllEntities",
    BY_FEATURE_IDS: "getEntitiesByFeatureIds",
    IN_ASSEMBLY: "getEntityInAssembly",
    BY_FEATURE_NAMES: "getEntitiesByFeatureNames",
    BY_INSTANCE_ID: "getEntitiesByInstanceId",
  };

  const PluginGetFeature = {
    BY_IDS: "getFeaturesByIds",
    BY_NAMES: "getFeaturesByNames",
    BY_INSTANCE_ID: "getFeaturesByInstanceId",
  };

  const PluginGetInstance = {
    BY_IDS: "getInstancesByIds",
    TOP_INSTANCE: "getTopInstance",
    INSTANCE_TREE: "getInstanceTree",
  };

  const PluginFunctionType = {
    MESSAGE_TIP: "messageTip",
    ADD_HIGHLIGHT_ELEMENT: "addHighlightElement",
    REMOVE_HIGHLIGHT_ELEMENT: "removeHighlightElement",
    CLEAR_PREVIEW: "clearPreview",
    CLEAR_SELECTION: "clearSelection",
    CREATE_DOCUMENT: 'CREATE_DOCUMENT',
    SET_SELECT_TYPE: "setSelectType",
    RESET_SELECT_TYPE: "resetSelectType",
    GET_SUPPORT_SELECT_TYPE: "getSupportSelectType",
  };

  const PluginEventType = {
    ELEMENT_PICK: "elementPick",
    FEATURE_PICK: "featurePick"
  };

  const PluginCommandType = {
    CREATE_SKETCH: "createSketch",
    EXIT_SKETCH: "exitSketch",
    EDIT_SKETCH: "editSketch",
    SKETCH_COMMAND: "sketchCommand",
    FULL_SKETCH_COMMAND: "fullSketchCommand",
    GENERAL_COMMAND: "generalCommand"
  };

  class Axis {
    constructor() {
      this.lineId = null;
      this.instanceId = null;
      this.point1 = null;
      this.point2 = null;
      return this;
    }

    setLineId(id) {
      this.lineId = id;
      return this;
    }

    setInstanceId(id) {
      this.instanceId = id;
      return this;
    }

    setPoint(point1, point2) {
      this.point1 = point1;
      this.point2 = point2;
      return this;
    }

    toScript() {
      if (this.point1 !== null && this.point2 !== null) {
        return "new Axis(" + this.point1.toScript() + "," + this.point2.toScript() + ")";
      } else if (this.lineId !== null && this.instanceId === null) {
        return "new Axis(" + this.lineId + ")";
      } else if (this.lineId && this.instanceId) {
        return "new Axis(" + this.lineId + ",'" + this.instanceId + "')";
      } else {
        return "new Axis()";
      }
    }

  }

  class Point {

    constructor(x, y, z) {
      this.x = x ?? 0;
      this.y = y ?? 0;
      this.z = z ?? 0;
    }

    toScript() {
      return "new Point(" + this.x + "," + this.y + "," + this.z + ")"
    }

  }

  class Direction {
    constructor() {
      this.lineId = null;
      this.instanceId = null;
      this.point1 = null;
      this.point2 = null;
      return this;
    }

    setLineId(id) {
      this.lineId = id;
      return this;
    }

    setInstanceId(id) {
      this.instanceId = id;
      return this;
    }

    setPoint(point1, point2) {
      this.point1 = point1;
      this.point2 = point2;
      return this;
    }

    toScript() {
      if (this.point1 !== null && this.point2 !== null) {
        return "new Direction(" + this.point1.toScript() + "," + this.point2.toScript() + ")";
      } else if (this.lineId !== null && this.instanceId === null) {
        return "new Direction(" + this.lineId + ")";
      } else if (this.lineId && this.instanceId) {
        return "new Direction(" + this.lineId + ",'" + this.instanceId + "')";
      } else {
        return "new Direction()";
      }
    }
  }

  class Matrix4 {
    constructor(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
      this.elements = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ];
      if (n11 !== undefined) {
        this.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
      }
      return this;
    }

    set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
      const tempElement = this.elements;
      tempElement[0] = n11; tempElement[4] = n12; tempElement[8] = n13; tempElement[12] = n14;
      tempElement[1] = n21; tempElement[5] = n22; tempElement[9] = n23; tempElement[13] = n24;
      tempElement[2] = n31; tempElement[6] = n32; tempElement[10] = n33; tempElement[14] = n34;
      tempElement[3] = n41; tempElement[7] = n42; tempElement[11] = n43; tempElement[15] = n44;
      return this;
    }

    setElements(elements) {
      this.elements = elements;
      return this;
    }

    toScript() {
      return "new Matrix4(" + this.elements + ")"
    }
  }

  function programArrayToString(array) {
    if (!array) {
      return "[]"
    }

    let script = "[";
    let item;
    for (let i = 0; i < array.length; i++) {
      item = array[i];
      if (typeof item === "string") {
        script = script + "'" + item + "'";
      } else if (typeof item === 'number') {
        script += item;
      } else if (item instanceof Point) {
        script += item.toScript();
      }

      if (i !== array.length - 1) {
        script += ",";
      }
    }
    script += "]";
    return script;
  }

  function mapToScript(data) {
    if (!data) {
      return "{}";
    }

    let script = "{";
    for (let key of Object.keys(data)) {
      let value = data[key];
      if (typeof value === 'number') {
        script += "'" + key + "': " + value + ",";
      } else if (typeof value === "string") {
        script += "'" + key + "': '" + value + "',";
      } else if(value instanceof Point || value instanceof Matrix4) {
        script += value.toScript();
      }
    }
    script += "}";
    return script;
  }

  const ConstraintType = {
    pointCoincidence: "ConstraintType.PointCoincidence",
    pointXCoordinatesCoincidence: "ConstraintType.PointXCoordinatesCoincidence",
    pointYCoordinatesCoincidence: "ConstraintType.PointYCoordinatesCoincidence",
    pointOnCurve: "ConstraintType.PointOnCurve",
    pointOnCurveNonePar: "ConstraintType.PointOnCurveNonePar",

    fixedDirection: "ConstraintType.FixedDirection",
    fixedHorizontalDirection: "ConstraintType.FixedHorizontalDirection",
    fixedVerticalDirection: "ConstraintType.FixedVerticalDirection",
    fixedPoint: "ConstraintType.FixedPoint",
    fixedPointXCoordinates: "ConstraintType.FixedPointXCoordinates",
    fixedPointYCoordinates: "ConstraintType.FixedPointYCoordinates",

    parallelism: "ConstraintType.Parallelism",
    perpendicularity: "ConstraintType.Perpendicularity",
    tangency: "ConstraintType.Tangency",
    collineation: "ConstraintType.Collineation",

    equalCurves: "ConstraintType.EqualCurves",
    equalLength: "ConstraintType.EqualLength",
    equalRadius: "ConstraintType.EqualRadius",
    equalCurvature: "ConstraintType.EqualCurvature",

    offset: "ConstraintType.Offset",
    mirror: "ConstraintType.Mirror",
  };

  class SketchScript {

    static createSketch(params) {
      if (params) {
        return "Sketch.createSketch('" + (params.sketchName ?? "") + "', " + (params.datumId ?? 8) + ");\n"
      }
    }

    static exitSketch() {
      return "Sketch.exitSketch();\n";
    }

    static createSketchLine(params) {
      if (params) {
        return "Sketch.createLine(" + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ");\n"
      }
    }

    static createRectangle(params) {
      if (params) {
        return "Sketch.createRectangle(" + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ");\n"
      }
    }

    static editSketch(params) {
      if (params) {
        return "Sketch.editSketch('" + (params.sketchName ?? "") + "');\n";
      }
    }

    static exitEditSketch(params) {
      if (params) {
        return "Sketch.exitEditSketch('" + (params.sketchName ?? "") + "');\n"
      }
    }

    static createReferenceLine(params) {
      if (params) {
        return "Sketch.createReferenceLine(" + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createRectangleByCenter(params) {
      if (params) {
        return "Sketch.createRectangleByCenter(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createThreePointRectangle(params) {
      if (params) {
        return "Sketch.createThreePointRectangle(" + (params.firstPoint?.toScript() ?? "new Point()") + ", " + (params.secondPoint?.toScript() ?? "new Point()") + ", " + (params.thirdPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createParallelogram(params) {
      if (params) {
        return "Sketch.createParallelogram(" + (params.firstPoint?.toScript() ?? "new Point()") + ", " + (params.secondPoint?.toScript() ?? "new Point()") + ", " + (params.thirdPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createCircle(params) {
      if (params) {
        return "Sketch.createCircle(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.circlePoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createCircleByThreePoint(params) {
      if (params) {
        return "Sketch.createCircleByThreePoint(" + (params.circlePoint1?.toScript() ?? "new Point()") + ", " + (params.circlePoint2?.toScript() ?? "new Point()") + ", " + (params.circlePoint3?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createArcByCenter(params) {
      if (params) {
        return "Sketch.createArcByCenter(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createArcByThreePoint(params) {
      if (params) {
        return "Sketch.createArcByThreePoint(" + (params.firstPoint?.toScript() ?? "new Point()") + ", " + (params.secondPoint?.toScript() ?? "new Point()") + ", " + (params.thirdPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createCenterArcSlot(params) {
      if (params) {
        return "Sketch.createCenterArcSlot(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ", " + (params.radiusPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createThreeArcSlot(params) {
      if (params) {
        return "Sketch.createThreeArcSlot(" + (params.firstPoint?.toScript() ?? "new Point()") + ", " + (params.secondPoint?.toScript() ?? "new Point()") + ", " + (params.thirdPoint?.toScript() ?? "new Point()") + ", " + (params.radiusPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createStraightSlot(params) {
      if (params) {
        return "Sketch.createStraightSlot(" + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ", " + (params.radiusPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createCenterStraightSlot(params) {
      if (params) {
        return "Sketch.createCenterStraightSlot(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ", " + (params.radiusPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createEllipse(params) {
      if (params) {
        return "Sketch.createEllipse(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.minorPoint?.toScript() ?? "new Point()") + ", " + (params.majorPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createEllipseArc(params) {
      if (params) {
        return "Sketch.createEllipseArc(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.minorPoint?.toScript() ?? "new Point()") + ", " + (params.majorPoint?.toScript() ?? "new Point()") + ", " + (params.startAngle ?? 0) + ", " + (params.endAngle ?? 45) + ");\n";
      }
    }

    static createRegularPolygon(params) {
      if (params) {
        return "Sketch.createRegularPolygon(" + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.edgeNum ?? 6) + ", " + (params.mode ?? 0) + ");\n";
      }
    }

    static createIntpCurve(params) {
      if (params) {
        return "Sketch.createIntpCurve(" + (programArrayToString(params.pickPoints) ?? "[]") + ");\n";
      }
    }

    static createPoint(params) {
      if (params) {
        return "Sketch.createPoint(" + (params.x ?? 0) + ", " + (params.y ?? 0) + ");\n";
      }
    }

    static setReference(params) {
      if (params) {
        return "Sketch.setReference(" + (programArrayToString(params.curveIds) ?? "[]") + ", " + (params.reference ?? 1) + ");\n";
      }
    }

    static createFilletCurve(params) {
      if (params) {
        return "Sketch.createFilletCurve(" + (params.curveId1 ?? 0) + ", " + (params.curveId2 ?? 0) + ", " + (params.radius ?? 10) +", " + (params.type1 ?? 4) +", " + (params.type2 ?? 4) + ");\n";
      }
    }

    static createChamferCurve(params) {
      if (params) {
        return "Sketch.createChamferCurve(" + (params.curveId1 ?? 0) + ", " + (params.curveId2 ?? 0) + ", " + (params.distance1 ?? 10) + ", " + (params.distance2 ?? 10) + ");\n";
      }
    }

    static createChamferCurveByAngle(params) {
      if (params) {
        return "Sketch.createChamferCurveByAngle(" + (params.curveId1 ?? 0) + ", " + (params.curveId2 ?? 0) + ", " + (params.distance1 ?? 10) + ", " + (params.angle ?? 45) + ");\n";
      }
    }

    static createAutoTrimCurve(params) {
      if (params) {
        return "Sketch.createAutoTrimCurve(" + (params.trimCurveId ?? 0) + ", " + (params.trimCurvePoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createExtendCurve(params) {
      if (params) {
        return "Sketch.createExtendCurve(" + (params.firstCurveId ?? 0) + ", " + (params.secondCurveId ?? 0) + ");\n";
      }
    }

    static createOffsetCurve(params) {
      if (params) {
        return "Sketch.createOffsetCurve(" + (params.offsetOnPlane ?? 1) + ", " + (programArrayToString(params.offsetCurveIds) ?? "[]") + ", " + (params.offsetType ?? 0) + ", " + (params.offsetDistance ?? 10)+ ", " + (params.bothWay ?? 0) + ");\n";
      }
    }

    static createMirror(params) {
      if (params) {
        return "Sketch.createMirror(" + (programArrayToString(params.elementIds) ?? "[]") + ", " + (params.axisId ?? 0) + ", " + (params.copy ?? 1)+ ", " + (params.instanceId ?? "'0'")+ ", " + (params.mirrorAxisType ?? 0) + ");\n";
      }
    }

    static copyElements(params) {
      if (params) {
        return "Sketch.copyElements(" + (programArrayToString(params.elementIds) ?? "[]") + ", " + (params.startPoint?.toScript() ?? "new Point()") + ", " + (params.endPoint?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static deleteElements(params) {
      if (params) {
        return "Sketch.deleteElements(" + (programArrayToString(params.elementIds) ?? "[]") + ");\n";
      }
    }

    static createDimension(params) {
      if (params) {
        return "Sketch.createDimension({\n" +
          "  firstSnapId: " + (params.firstSnapId ?? 0) + ",\n" +
          "  firstPickPnt: " + (params.firstPickPnt?.toScript() ?? "new Point()") + ",\n" +
          "  firstSnapType: " + (params.firstSnapType ?? 7) + ",\n" +
          "  secondSnapId: " + (params.secondSnapId ?? 0) + ",\n" +
          "  secondPickPnt: " + (params.secondPickPnt?.toScript() ?? "new Point()") + ",\n" +
          "  secondSnapType: " + (params.secondSnapType ?? 0) + ",\n" +
          "  direction: " + (params.direction ?? 3) + ",\n" +
          "  dimPosition: " + (params.dimPosition?.toScript() ?? "new Point()") + ",\n" +
          "  dimVal: new Variable(" + (params.dimVal ?? 10) + "),\n" +
          "  changeDimVal: " + (params.changeDimVal ?? 0) + ",\n" +
          "  radiusOrDiameter: " + (params.radiusOrDiameter ?? 0) + ",\n" +
          "});\n";
      }
    }

    static editDimensionValue(params) {
      if (params) {
        return "Sketch.editDimensionValue(" + (params.dimensionId ?? 0) + ", new Variable(" + (params.value ?? "10") + ");\n";
      }
    }

    static modifyDimensionPosition(params) {
      if (params) {
        return "Sketch.modifyDimensionPosition(" + (params.dimensionId ?? 0) + ", " + (params.newPosition?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static createDivision(params) {
      if (params) {
        return "Sketch.createDivision(" + (params.curveId ?? 0) + ", " + (params.newPosition?.toScript() ?? "new Point()") + ");\n";
      }
    }

    static moveElements(params) {
      if (params) {
        return "Sketch.moveElements({\n" +
          "  elementIds: " + (programArrayToString(params.elementIds) ?? "[]") + ",\n" +
          "  startPnt: " + (params.startPnt?.toScript() ?? "new Point()") + ",\n" +
          "  endPnt: " + (params.endPnt?.toScript() ?? "new Point()") + ",\n" +
          "});\n";
      }
    }

    static scaleElements(params) {
      if (params) {
        return "Sketch.createScaleElements({\n" +
          "  elementIds: " + (programArrayToString(params.elementIds) ?? "[]") + ",\n" +
          "  scalePnt: " + (params.scalePnt?.toScript() ?? "new Point()") + ",\n" +
          "  scaleRef: " + (params.scaleRef ?? 1) + ",\n" +
          "  copyFlag: " + (params.copyFlag ?? 0) + ",\n" +
          "  copyNum: " + (params.copyNum ?? 1) + ",\n" +
          "});\n";
      }
    }

    static rotateElements(params) {
      if (params) {
        return "Sketch.createRotateElements(" + (programArrayToString(params.elementIds) ?? "[]") + ", " + (params.centerPoint?.toScript() ?? "new Point()") + ", " + (params.angle ?? 1) + ");\n";
      }
    }

    static createSketchLinearPattern(params) {
      if (params) {
        return "Sketch.createSketchLinearPattern({\n" +
          "  elementIds: " + (programArrayToString(params.elementIds) ?? "[]") + ",\n" +
          "  direction1: " + (params.direction1?.toScript() ?? "new Direction()") + ",\n" +
          "  spacing1: " + (params.spacing1 ?? 10) + ",\n" +
          "  reverse1: " + (params.reverse1 ?? 0) + ",\n" +
          "  copyNum1: " + (params.copyNum1 ?? 2) + ",\n" +
          "  XAngle1: " + (params.XAngle1 ?? 0) + ",\n" +
          "  disFlag1: " + (params.disFlag1 ?? 0) + ",\n" +
          "  copyNumFlag1: " + (params.copyNumFlag1 ?? 0) + ",\n" +
          "  direction2: " + (params.direction2?.toScript() ?? "new Direction()") + ",\n" +
          "  spacing2: " + (params.spacing2 ?? 10) + ",\n" +
          "  reverse2: " + (params.reverse2 ?? 0) + ",\n" +
          "  copyNum2: " + (params.copyNum2 ?? 2) + ",\n" +
          "  XAngle2: " + (params.XAngle2 ?? 90) + ",\n" +
          "  disFlag2: " + (params.disFlag2 ?? 0) + ",\n" +
          "  copyNumFlag2: " + (params.copyNumFlag2 ?? 0) + ",\n" +
          "  angleFlag: " + (params.angleFlag ?? 0) + ",\n" +
          "  patternSeedFlag: " + (params.patternSeedFlag ?? 0) + ",\n" +
          "  skipInstance: " + (programArrayToString(params.skipInstance) ?? "[]") + ",\n" +
          "});\n";
      }
    }

    static createSketchCircularPattern(params) {
      if (params) {
        return "Sketch.createSketchCircularPattern({\n" +
          "  elementIds: " + (programArrayToString(params.elementIds) ?? "[]") + ",\n" +
          "  angle: " + (params.angle ?? 360) + ",\n" +
          "  instanceNum: " + (params.instanceNum ?? 4) + ",\n" +
          "  reverse: " + (params.reverse ?? 0) + ",\n" +
          "  equalDisFlag: " + (params.equalDisFlag ?? 1) + ",\n" +
          "  labelDisFlag: " + (params.labelDisFlag ?? 0) + ",\n" +
          "  labelRadiusFlag: " + (params.labelRadiusFlag ?? 0) + ",\n" +
          "  labelSolidNumFlag: " + (params.labelSolidNumFlag ?? 0) + ",\n" +
          "  pointX: " + (params.pointX ?? 0) + ",\n" +
          "  pointY: " + (params.pointY ?? 0) + ",\n" +
          "  pointId: " + (params.pointId ?? 0) + ",\n" +
          "  skipInstance: " + (programArrayToString(params.skipInstance) ?? "[]") + ",\n" +
          "});\n";
      }
    }

    static createIntersectCurve(params) {
      if (params) {
        return "Sketch.createIntersectCurve(" + (programArrayToString(params.faceIds) ?? "[]") + ");\n";
      }
    }

    static createEquationCurve(params) {
      if (params) {
        return "Sketch.createEquationCurve({\n" +
          "  equationType: " + (params.equationType ?? 1) + ",\n" +
          "  coordinateType: " + (params.coordinateType ?? 1) + ",\n" +
          "  equation1: '" + (params.equation1 ?? "''") + "',\n" +
          "  equation2: '" + (params.equation2 ?? "''") + "',\n" +
          "  startValue: " + (params.startValue ?? 0) + ",\n" +
          "  endValue: " + (params.endValue ?? 0) + ",\n" +
          "});\n";
      }
    }

    static convertEdge(params) {
      if (params) {
        return "Sketch.convertEdge(" + (programArrayToString(params.edgeIds) ?? "[]") + ");\n";
      }
    }

    static addConstraintList(params) {
      if (params) {
        return "Sketch.addConstraint({\n" +
          "  constraintType: " + (params.constraintType ?? ConstraintType.pointCoincidence) + ",\n" +
          "  firstSnapId: " + (params.firstSnapId ?? 0) + ",\n" +
          "  firstSnapType: " + (params.firstSnapType ?? 0) + ",\n" +
          "  firstInstanceId: " + (params.firstInstanceId ?? 0) + ",\n" +
          "  firstPickPnt: \[" + (params.firstPickPnt ?? [0.0, 0.0, 0.0]) + "],\n" +
          "  secondSnapId: " + (params.secondSnapId ?? 0) + ",\n" +
          "  secondSnapType: " + (params.secondSnapType ?? 0) + ",\n" +
          "  secondInstanceId: " + (params.secondInstanceId ?? 0) + ",\n" +
          "  secondPickPnt: \[" + (params.secondPickPnt ?? [0.0, 0.0, 0.0]) + "],\n" +
          "});\n";
      }
    }

    static createVirtualInterPoint (params) {
      if (params) {
        return "Sketch.virtualInterPoint({\n" +
          "  curveId1: " + (params.curveId1 ?? 0) + ",\n" +
          "  instanceId1: " + (params.instanceId1 ?? 0) + ",\n" +
          "  curveId2: " + (params.curveId2 ?? 0) + ",\n" +
          "  instanceId2: " + (params.instanceId2 ?? 0) + ",\n" +
          "  pickPoint: " + (params.pickPoint?.toScript() ?? "new Point()") + ",\n" +
          "});\n";
      }
    }

    static createCenterLine(params) {
      if (params) {
        return "Sketch.createCenterLine("
          + (params.centerPoint?.toScript() ?? "new Point()") + ","
          + (params.endPnt?.toScript() ?? "new Point()") + ","
          + (params.dimensionType ?? 0) +
          ");\n";
      }
    }

    static createThreePointCenterRectangle(params) {
      if (params) {
        return "Sketch.createThreePointCenterRectangle("
          + (params.centerPoint?.toScript() ?? "new Point()") + ","
          + (params.middlePoint?.toScript() ?? "new Point()") + ","
          + (params.endPoint?.toScript() ?? "new Point()") + ","
          + (params.dimConstraint ?? 0) +
          ");\n";
      }
    }

  }

  class PluginSketchCommand {

    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    async executeFullSketchCommand(commandScript) {
      return this.parent.executeIncrementCommand(commandScript, PluginCommandType.FULL_SKETCH_COMMAND)
    }


    createSketch(params) {
      let script = SketchScript.createSketch(params);
      this.#generateScript(script);
    }

    async createSketchIncrement(params) {
      let script = SketchScript.createSketch(params);
      return this.#executeIncrementScript(script, PluginCommandType.CREATE_SKETCH);
    }

    exitSketch() {
      let script = SketchScript.exitSketch();
      this.#generateScript(script);
    }

    async exitSketchIncrement() {
      let script = SketchScript.exitSketch();
      return this.#executeIncrementScript(script, PluginCommandType.EXIT_SKETCH);
    }

    editSketch(params) {
      let script = SketchScript.editSketch(params);
      this.#generateScript(script);
    }

    async editSketchIncrement(params) {
      let script = SketchScript.editSketch(params);
      return this.#executeIncrementScript(script, PluginCommandType.EDIT_SKETCH);
    }

    exitEditSketch(params) {
      let script = SketchScript.exitEditSketch(params);
      this.#generateScript(script);
    }

    async exitEditSketchIncrement(params) {
      let script = SketchScript.exitEditSketch(params);
      return this.#executeIncrementScript(script, PluginCommandType.EXIT_SKETCH);
    }

    createSketchLine(params) {
      let script = SketchScript.createSketchLine(params);
      this.#generateScript(script);
    }

    async createSketchLineIncrement(params) {
      let script = SketchScript.createSketchLine(params);
      return this.#executeIncrementScript(script);
    }

    createRectangle(params) {
      let script = SketchScript.createRectangle(params);
      this.#generateScript(script);
    }

    async createRectangleIncrement(params) {
      let script = SketchScript.createRectangle(params);
      return this.#executeIncrementScript(script);
    }

    createReferenceLine(params) {
      let script = SketchScript.createReferenceLine(params);
      this.#generateScript(script);
    }

    async createReferenceLineIncrement(params) {
      let script = SketchScript.createReferenceLine(params);
      return this.#executeIncrementScript(script)
    }

    createRectangleByCenter(params) {
      let script = SketchScript.createRectangleByCenter(params);
      this.#generateScript(script);
    }

    async createRectangleByCenterIncrement(params) {
      let script = SketchScript.createRectangleByCenter(params);
      return this.#executeIncrementScript(script);
    }

    createThreePointRectangle(params) {
      let script = SketchScript.createThreePointRectangle(params);
      this.#generateScript(script);
    }

    async createThreePointRectangleIncrement(params) {
      let script = SketchScript.createThreePointRectangle(params);
      return this.#executeIncrementScript(script);
    }

    createParallelogram(params) {
      let script = SketchScript.createParallelogram(params);
      this.#generateScript(script);
    }

    async createParallelogramIncrement(params) {
      let script = SketchScript.createParallelogram(params);
      return this.#executeIncrementScript(script);
    }

    createCircle(params) {
      let script = SketchScript.createCircle(params);
      this.#generateScript(script);
    }

    async createCircleIncrement(params) {
      let script = SketchScript.createCircle(params);
      return this.#executeIncrementScript(script);
    }

    createCircleByThreePoint(params) {
      let script = SketchScript.createCircleByThreePoint(params);
      this.#generateScript(script);
    }

    async createCircleByThreePointIncrement(params) {
      let script = SketchScript.createCircleByThreePoint(params);
      return this.#executeIncrementScript(script);
    }

    createArcByCenter(params) {
      let script = SketchScript.createArcByCenter(params);
      this.#generateScript(script);
    }

    async createArcByCenterIncrement(params) {
      let script = SketchScript.createArcByCenter(params);
      return this.#executeIncrementScript(script);
    }

    createArcByThreePoint(params) {
      let script = SketchScript.createArcByThreePoint(params);
      this.#generateScript(script);
    }

    async createArcByThreePointIncrement(params) {
      let script = SketchScript.createArcByThreePoint(params);
      return this.#executeIncrementScript(script);
    }

    createCenterArcSlot(params) {
      let script = SketchScript.createCenterArcSlot(params);
      this.#generateScript(script);
    }

    async createCenterArcSlotIncrement(params) {
      let script = SketchScript.createCenterArcSlot(params);
      return this.#executeIncrementScript(script);
    }

    createThreeArcSlot(params) {
      let script = SketchScript.createThreeArcSlot(params);
      this.#generateScript(script);
    }

    async createThreeArcSlotIncrement(params) {
      let script = SketchScript.createThreeArcSlot(params);
      return this.#executeIncrementScript(script);
    }

    createStraightSlot(params) {
      let script = SketchScript.createStraightSlot(params);
      this.#generateScript(script);
    }

    async createStraightSlotIncrement(params) {
      let script = SketchScript.createStraightSlot(params);
      return this.#executeIncrementScript(script);
    }

    createCenterStraightSlot(params) {
      let script = SketchScript.createCenterStraightSlot(params);
      this.#generateScript(script);
    }

    async createCenterStraightSlotIncrement(params) {
      let script = SketchScript.createCenterStraightSlot(params);
      return this.#executeIncrementScript(script);
    }

    createEllipse(params) {
      let script = SketchScript.createEllipse(params);
      this.#generateScript(script);
    }

    async createEllipseIncrement(params) {
      let script = SketchScript.createEllipse(params);
      return this.#executeIncrementScript(script);
    }

    createEllipseArc(params) {
      let script = SketchScript.createEllipseArc(params);
      this.#generateScript(script);
    }

    async createEllipseArcIncrement(params) {
      let script = SketchScript.createEllipseArc(params);
      return this.#executeIncrementScript(script);
    }

    createRegularPolygon(params) {
      let script = SketchScript.createRegularPolygon(params);
      this.#generateScript(script);
    }

    async createRegularPolygonIncrement(params) {
      let script = SketchScript.createRegularPolygon(params);
      return this.#executeIncrementScript(script);
    }

    createIntpCurve(params) {
      let script = SketchScript.createIntpCurve(params);
      this.#generateScript(script);
    }

    async createIntpCurveIncrement(params) {
      let script = SketchScript.createIntpCurve(params);
      return this.#executeIncrementScript(script);
    }

    createPoint(params) {
      let script = SketchScript.createPoint(params);
      this.#generateScript(script);
    }

    async createPointIncrement(params) {
      let script = SketchScript.createPoint(params);
      return this.#executeIncrementScript(script);
    }

    setReference(params) {
      let script = SketchScript.setReference(params);
      this.#generateScript(script);
    }

    async setReferenceIncrement(params) {
      let script = SketchScript.setReference(params);
      return this.#executeIncrementScript(script);
    }

    createFilletCurve(params) {
      let script = SketchScript.createFilletCurve(params);
      this.#generateScript(script);
    }

    async createFilletCurveIncrement(params) {
      let script = SketchScript.createFilletCurve(params);
      return this.#executeIncrementScript(script);
    }

    createChamferCurve(params) {
      let script = SketchScript.createChamferCurve(params);
      this.#generateScript(script);
    }

    async createChamferCurveIncrement(params) {
      let script = SketchScript.createChamferCurve(params);
      return this.#executeIncrementScript(script);
    }

    createChamferCurveByAngle(params) {
      let script = SketchScript.createChamferCurveByAngle(params);
      this.#generateScript(script);
    }

    async createChamferCurveByAngleIncrement(params) {
      let script = SketchScript.createChamferCurveByAngle(params);
      return this.#executeIncrementScript(script);
    }

    createAutoTrimCurve(params) {
      let script = SketchScript.createAutoTrimCurve(params);
      this.#generateScript(script);
    }

    async createAutoTrimCurveIncrement(params) {
      let script = SketchScript.createAutoTrimCurve(params);
      return this.#executeIncrementScript(script);
    }

    createExtendCurve(params) {
      let script = SketchScript.createExtendCurve(params);
      this.#generateScript(script);
    }

    async createExtendCurveIncrement(params) {
      let script = SketchScript.createExtendCurve(params);
      return this.#executeIncrementScript(script);
    }

    createOffsetCurve(params) {
      let script = SketchScript.createOffsetCurve(params);
      this.#generateScript(script);
    }

    async createOffsetCurveIncrement(params) {
      let script = SketchScript.createOffsetCurve(params);
      return this.#executeIncrementScript(script);
    }

    createMirror(params) {
      let script = SketchScript.createMirror(params);
      this.#generateScript(script);
    }

    async createMirrorIncrement(params) {
      let script = SketchScript.createMirror(params);
      return this.#executeIncrementScript(script);
    }

    copyElements(params) {
      let script = SketchScript.copyElements(params);
      this.#generateScript(script);
    }

    async copyElementsIncrement(params) {
      let script = SketchScript.copyElements(params);
      return this.#executeIncrementScript(script);
    }

    deleteElements(params) {
      let script = SketchScript.deleteElements(params);
      this.#generateScript(script);
    }

    async deleteElementsIncrement(params) {
      let script = SketchScript.deleteElements(params);
      return this.#executeIncrementScript(script);
    }

    createDimension(params) {
      let script = SketchScript.createDimension(params);
      this.#generateScript(script);
    }

    async createDimensionIncrement(params) {
      let script = SketchScript.createDimension(params);
      return this.#executeIncrementScript(script);
    }

    editDimensionValue(params) {
      let script = SketchScript.editDimensionValue(params);
      this.#generateScript(script);
    }

    async editDimensionValueIncrement(params) {
      let script = SketchScript.editDimensionValue(params);
      return this.#executeIncrementScript(script);
    }

    modifyDimensionPosition(params) {
      let script = SketchScript.modifyDimensionPosition(params);
      this.#generateScript(script);
    }

    async modifyDimensionPositionIncrement(params) {
      let script = SketchScript.modifyDimensionPosition(params);
      return this.#executeIncrementScript(script);
    }

    createDivision(params) {
      let script = SketchScript.createDivision(params);
      this.#generateScript(script);
    }

    async createDivisionIncrement(params) {
      let script = SketchScript.createDivision(params);
      return this.#executeIncrementScript(script);
    }

    moveElements(params) {
      let script = SketchScript.moveElements(params);
      this.#generateScript(script);
    }

    async moveElementsIncrement(params) {
      let script = SketchScript.moveElements(params);
      return this.#executeIncrementScript(script);
    }

    scaleElements(params) {
      let script = SketchScript.scaleElements(params);
      this.#generateScript(script);
    }

    async scaleElementsIncrement(params) {
      let script = SketchScript.scaleElements(params);
      return this.#executeIncrementScript(script);
    }

    rotateElements(params) {
      let script = SketchScript.rotateElements(params);
      this.#generateScript(script);
    }

    async rotateElementsIncrement(params) {
      let script = SketchScript.rotateElements(params);
      return this.#executeIncrementScript(script);
    }

    createSketchLinearPattern(params) {
      let script = SketchScript.createSketchLinearPattern(params);
      this.#generateScript(script);
    }

    async createSketchLinearPatternIncrement(params) {
      let script = SketchScript.createSketchLinearPattern(params);
      return this.#executeIncrementScript(script);
    }

    createSketchCircularPattern(params) {
      let script = SketchScript.createSketchCircularPattern(params);
      this.#generateScript(script);
    }

    async createSketchCircularPatternIncrement(params) {
      let script = SketchScript.createSketchCircularPattern(params);
      return this.#executeIncrementScript(script);
    }

    createIntersectCurve(params) {
      let script = SketchScript.createIntersectCurve(params);
      this.#generateScript(script);
    }

    async createIntersectCurveIncrement(params) {
      let script = SketchScript.createIntersectCurve(params);
      return this.#executeIncrementScript(script);
    }

    createEquationCurve(params) {
      let script = SketchScript.createEquationCurve(params);
      this.#generateScript(script);
    }

    async createEquationCurveIncrement(params) {
      let script = SketchScript.createEquationCurve(params);
      return this.#executeIncrementScript(script);
    }

    convertEdge(params) {
      let script = SketchScript.convertEdge(params);
      this.#generateScript(script);
    }

    async convertEdgeIncrement(params) {
      let script = SketchScript.convertEdge(params);
      return this.#executeIncrementScript(script);
    }

    addConstraintList(params) {
      let script = SketchScript.addConstraintList(params);
      this.#generateScript(script);
    }

    async addConstraintListIncrement(params) {
      let script = SketchScript.addConstraintList(params);
      return this.#executeIncrementScript(script);
    }

    createCenterLine(params) {
      let script = SketchScript.createCenterLine(params);
      this.#generateScript(script);
    }

    async createCenterLineIncrement(params) {
      let script = SketchScript.createCenterLine(params);
      return this.#executeIncrementScript(script);
    }

    createThreePointCenterRectangle(params) {
      let script = SketchScript.createThreePointCenterRectangle(params);
      this.#generateScript(script);
    }

    async createThreePointCenterRectangleIncrement(params) {
      let script = SketchScript.createThreePointCenterRectangle(params);
      return this.#executeIncrementScript(script);
    }
  }

  class SolidScript {

    static extrude(params, featureName = "") {
      if (params) {
        return "Solid.extrude('" + featureName + "',{\n" +
          "  sketch:" + (params.sketch ?? 0) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  directionType:" + (params.directionType ?? 0) + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  extrudeType1:" + (params.extrudeType1 ?? 0) + ",\n" +
          "  height1:" + (params.height1 ?? 10.0) + ",\n" +
          "  toSurface1:" + (params.toSurface1 ?? 0) + ",\n" +
          "  toSurface1InsId:" + (params.toSurface1InsId ?? "'0'") + ",\n" +
          "  toVertex1:" + (params.toVertex1?.toScript() ?? "new Point()") + ",\n" +
          "  reverseSurDis1:" + (params.reverseSurDis1 ?? 0) + ",\n" +
          "  transSurface1:" + (params.transSurface1 ?? 0) + ",\n" +
          "  draftType1:" + (params.draftType1 ?? -1) + ",\n" +
          "  angle1:" + (params.angle1 ?? 0.0) + ",\n" +
          "  extrudeType2:" + (params.extrudeType2 ?? -1) + ",\n" +
          "  height2:" + (params.height2 ?? 0.0) + ",\n" +
          "  toSurface2:" + (params.toSurface2 ?? 0) + ",\n" +
          "  toSurface2InsId:" + (params.toSurface2InsId ?? "'0'") + ",\n" +
          "  toVertex2:" + (params.toVertex2?.toScript() ?? "new Point()") + ",\n" +
          "  reverseSurDis2:" + (params.reverseSurDis2 ?? 0) + ",\n" +
          "  transSurface2:" + (params.transSurface2 ?? 0) + ",\n" +
          "  draftType2:" + (params.draftType2 ?? -1) + ",\n" +
          "  angle2:" + (params.angle2 ?? 0.0) + ",\n" +
          "  offsetType:" + (params.offsetType ?? -1) + ",\n" +
          "  distance:" + (params.distance ?? 0.0) + ",\n" +
          "  reverseOffset:" + (params.reverseOffset ?? 0) + ",\n" +
          "  thicknessType:" + (params.thicknessType ?? -2) + ",\n" +
          "  thickness1:" + (params.thickness1 ?? 0) + ",\n" +
          "  thickness2:" + (params.thickness2 ?? 0) + ",\n" +
          "  mergeType:" + (params.mergeType ?? 0) + ",\n" +
          "  mergeSolids:" + (programArrayToString(params.mergeSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static extrudeCut(params, featureName) {
      if (params) {
        return "Solid.extrudeCut('" + featureName + "',{\n" +
          "  sketch:" + (params.sketch ?? 0) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  directionType:" + (params.directionType ?? 0) + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  extrudeType1:" + (params.extrudeType1 ?? 0) + ",\n" +
          "  height1:" + (params.height1 ?? 10.0) + ",\n" +
          "  toSurface1:" + (params.toSurface1 ?? 0) + ",\n" +
          "  toSurface1InsId:" + (params.toSurface1InsId ?? "'0'") + ",\n" +
          "  toVertex1:" + (params.toVertex1?.toScript() ?? "new Point()") + ",\n" +
          "  reverseSurDis1:" + (params.reverseSurDis1 ?? 0) + ",\n" +
          "  transSurface1:" + (params.transSurface1 ?? 0) + ",\n" +
          "  draftType1:" + (params.draftType1 ?? -1) + ",\n" +
          "  angle1:" + (params.angle1 ?? 0.0) + ",\n" +
          "  extrudeType2:" + (params.extrudeType2 ?? -1) + ",\n" +
          "  height2:" + (params.height2 ?? 0.0) + ",\n" +
          "  toSurface2:" + (params.toSurface2 ?? 0) + ",\n" +
          "  toSurface2InsId:" + (params.toSurface2InsId ?? "'0'") + ",\n" +
          "  toVertex2:" + (params.toVertex2?.toScript() ?? "new Point()") + ",\n" +
          "  reverseSurDis2:" + (params.reverseSurDis2 ?? 0) + ",\n" +
          "  transSurface2:" + (params.transSurface2 ?? 0) + ",\n" +
          "  draftType2:" + (params.draftType2 ?? -1) + ",\n" +
          "  angle2:" + (params.angle2 ?? 0.0) + ",\n" +
          "  offsetType:" + (params.offsetType ?? -1) + ",\n" +
          "  distance:" + (params.distance ?? 0.0) + ",\n" +
          "  reverseOffset:" + (params.reverseOffset ?? 0) + ",\n" +
          "  thicknessType:" + (params.thicknessType ?? -2) + ",\n" +
          "  thickness1:" + (params.thickness1 ?? 0) + ",\n" +
          "  thickness2:" + (params.thickness2 ?? 0) + ",\n" +
          "  reverseToCut:" + (params.reverseToCut ?? 0) + ",\n" +
          "  cutSolids:" + (programArrayToString(params.cutSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static revolve(params, featureName) {
      if (params) {
        return "Solid.revolve('" + featureName + "',{\n" +
          "  sketch:" + (params.sketch ?? 0) + ",\n" +
          "  axis:" + (params.axis?.toScript() ?? "new Axis()") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  revolveType1:" + (params.revolveType1 ?? 0) + ",\n" +
          "  angle1:" + (params.angle1 ?? 30.0) + ",\n" +
          "  toSurface1:" + (params.toSurface1 ?? 10) + ",\n" +
          "  revolveType2:" + (params.revolveType2 ?? 0) + ",\n" +
          "  angle2:" + (params.angle2 ?? 0.0) + ",\n" +
          "  toSurface2:" + (params.toSurface2 ?? 0) + ",\n" +
          "  mergeType:" + (params.mergeType ?? 0) + ",\n" +
          "  mergeSolids:" + (programArrayToString(params.mergeSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static revolveCut(params, featureName) {
      if (params) {
        return "Solid.revolveCut('" + featureName + "',{\n" +
          "  sketch:" + (params.sketch ?? 0) + ",\n" +
          "  axis:" + (params.axis?.toScript() ?? "new Axis()") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  revolveType1:" + (params.revolveType1 ?? 0) + ",\n" +
          "  angle1:" + (params.angle1 ?? 30.0) + ",\n" +
          "  toSurface1:" + (params.toSurface1 ?? 0) + ",\n" +
          "  revolveType2:" + (params.revolveType2 ?? -1) + ",\n" +
          "  angle2:" + (params.angle2 ?? 0.0) + ",\n" +
          "  toSurface2:" + (params.toSurface2 ?? 0) + ",\n" +
          "  cutSolids:" + (programArrayToString(params.cutSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static sweep(params, featureName) {
      if (params) {
        return "Solid.sweep('" + featureName + "',{\n" +
          "  sweepType:" + (params.sweepType ?? 0) + ",\n" +
          "  sweepProfile:" + (params.sweepProfile ?? 0) + ",\n" +
          "  loopCurveIds:" + (programArrayToString(params.loopCurveIds) ?? "[]") + ",\n" +
          "  sweepPath:" + (programArrayToString(params.sweepPath) ?? "[]") + ",\n" +
          "  selectChain:" + (params.selectChain ?? 0) + ",\n" +
          "  profileDirection:" + (params.profileDirection ?? 2) + ",\n" +
          "  sweepDirection:" + (params.sweepDirection ?? 0) + ",\n" +
          "  radius:" + (params.radius ?? 10.0) + ",\n" +
          "  mergeType:" + (params.mergeType ?? 0) + ",\n" +
          "  mergeSolids:" + (programArrayToString(params.mergeSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static sweepCut(params, featureName) {
      if (params) {
        return "Solid.sweepCut('" + featureName + "',{\n" +
          "  sweepType:" + (params.sweepType ?? 0) + ",\n" +
          "  sweepProfile:" + (params.sweepProfile ?? 0) + ",\n" +
          "  loopCurveIds:" + (programArrayToString(params.loopCurveIds) ?? "[]") + ",\n" +
          "  sweepPath:" + (programArrayToString(params.sweepPath) ?? "[]") + ",\n" +
          "  profileDirection:" + (params.profileDirection ?? 2) + ",\n" +
          "  sweepDirection:" + (params.sweepDirection ?? 0) + ",\n" +
          "  selectChain:" + (params.selectChain ?? 0) + ",\n" +
          "  radius:" + (params.radius ?? 10) + ",\n" +
          "  cutSolids:" + (programArrayToString(params.cutSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static loft(params, featureName) {
      if (params) {
        return "Solid.loft('" + featureName + "',{\n" +
          "  sketchs:" + (programArrayToString(params.sketchs) ?? "[]") + ",\n" +
          "  startConstraint:" + (params.startConstraint ?? 0) + ",\n" +
          "  endConstraint:" + (params.endConstraint ?? 0) + ",\n" +
          "  startTangent:" + (params.startTangent ?? 'new Direction()') + ",\n" +
          "  endTangent:" + (params.endTangent ?? 'new Direction()') + ",\n" +
          "  startMagnitude:" + (params.startMagnitude ?? 0.0) + ",\n" +
          "  endMagnitude:" + (params.endMagnitude ?? 0.0) + ",\n" +
          "  hasGuideCurve:" + (params.hasGuideCurve ?? 0) + ",\n" +
          "  guideCurves:" + (programArrayToString(params.guideCurves) ?? "[]") + ",\n" +
          "  matchPoints:" + (programArrayToString(params.matchPoints) ?? "[]") + ",\n" +
          "  mergeType:" + (params.mergeType ?? 0) + ",\n" +
          "  mergeSolids:" + (programArrayToString(params.mergeSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static loftCut(params, featureName) {
      if (params) {
        return "Solid.loftCut('" + featureName + "',{\n" +
          "  sketchs:" + (programArrayToString(params.sketchs) ?? "[]") + ",\n" +
          "  startConstraint:" + (params.startConstraint ?? 0) + ",\n" +
          "  endConstraint:" + (params.endConstraint ?? 0) + ",\n" +
          "  startTangent:" + (params.startTangent ?? 'new Direction()') + ",\n" +
          "  endTangent:" + (params.endTangent ?? 'new Direction()') + ",\n" +
          "  startMagnitude:" + (params.startMagnitude ?? 0.0) + ",\n" +
          "  endMagnitude:" + (params.endMagnitude ?? 0.0) + ",\n" +
          "  hasGuideCurve:" + (params.hasGuideCurve ?? 0) + ",\n" +
          "  guideCurves:" + (programArrayToString(params.guideCurves) ?? "[]") + ",\n" +
          "  matchPoints:" + (programArrayToString(params.matchPoints) ?? "[]") + ",\n" +
          "  cutType:" + (params.cutType ?? 1) + ",\n" +
          "  cutSolids:" + (programArrayToString(params.cutSolids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static createShell(params, featureName) {
      if (params) {
        return "Solid.createShell('" + featureName + "',{\n" +
          "  removeFaces:" + (programArrayToString(params.removeFaces) ?? "[]") + ",\n" +
          "  thickenSolid:" + (params.thickenSolid ?? 0) + ",\n" +
          "  thickness:" + (params.thickness ?? 10.0) + ",\n" +
          "  outward:" + (params.outward ?? 0) + ",\n" +
          "  multiFaces:" + (programArrayToString(params.multiFaces) ?? "[]") + ",\n" +
          "  multiThickness:" + (programArrayToString(params.multiThickness) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static thicken(params, featureName) {
      if (params) {
        return "Solid.thicken('" + featureName + "',{\n" +
          "  thickenSurfaceId:" + (params.thickenSurfaceId ?? 0) + ",\n" +
          "  thickness:" + (params.thickness ?? 10.0) + ",\n" +
          "  outward:" + (params.outward ?? 0) + ",\n" +
          "});\n"
      }
    }

    static draftAngle(params, featureName) {
      if (params) {
        return "Solid.draftAngle('" + featureName + "',{\n" +
          "  draftType:" + (params.draftType ?? 0) + ",\n" +
          "  neutralPlane:" + (params.neutralPlane ?? 0) + ",\n" +
          "  draftAngle:" + (params.draftAngle ?? 30.0) + ",\n" +
          "  draftFaces:" + (programArrayToString(params.draftFaces) ?? "[]") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  pullDirection:" + (params.pullDirection?.toScript() ?? "new Direction()") + ",\n" +
          "  partingLines:" + (programArrayToString(params.partingLines) ?? "[]") + ",\n" +
          "  otherFace:" + (params.otherFace ?? 0) + ",\n" +
          "});\n"
      }
    }

    static cutSplit(params, featureName) {
      if (params) {
        return "Solid.cutSplit('" + featureName + "',{\n" +
          "  solidId:" + (params.solidId ?? 0) + ",\n" +
          "  cutSurfaceId:" + (params.cutSurfaceId ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createHole(params, featureName) {
      if (params) {
        return "Solid.createHole('" + featureName + "',{\n" +
          "  holeFace:" + (params.holeFace ?? 0) + ",\n" +
          "  holePoint:" + (params.holePoint?.toScript() ?? "new Point()") + ",\n" +
          "  holeType:" + (params.holeType ?? 0) + ",\n" +
          "  endCondition:" + (params.endCondition ?? 0) + ",\n" +
          "  hasEndAngle:" + (params.hasEndAngle ?? 0) + ",\n" +
          "  endAngle:" + (params.endAngle ?? 10.0) + ",\n" +
          "  depth:" + (params.depth ?? 100.0) + ",\n" +
          "  diameter:" + (params.diameter ?? 10.0) + ",\n" +
          "  angle1:" + (params.angle1 ?? 10) + ",\n" +
          "  depth1:" + (params.depth1 ?? 10) + ",\n" +
          "  diameter1:" + (params.diameter1 ?? 15) + ",\n" +
          "});\n"
      }
    }

    static createHoles(params, featureName) {
      if (params) {
        return "Solid.createHoles('" + featureName + "',{\n" +
          "  holeFace:" + (params.holeFace ?? 0) + ",\n" +
          "  holePoint:" + ((programArrayToString(params.holePoint) ?? "[]")) + ",\n" +
          "  holePrfId:" + (params.holePrfId ?? 0) + ",\n" +
          "  holeType:" + (params.holeType ?? 0) + ",\n" +
          "  diameter:" + (params.diameter ?? 10.0) + ",\n" +
          "  hasEndAngle:" + (params.hasEndAngle ?? 0) + ",\n" +
          "  endAngle:" + (params.endAngle ?? 10.0) + ",\n" +
          "  endCondition:" + (params.endCondition ?? 0) + ",\n" +
          "  depth:" + (params.depth ?? 100.0) + ",\n" +
          "  depthToType:" + (params.depthToType ?? 0) + ",\n" +
          "  toFace:" + (params.toFace ?? 0) + ",\n" +
          "  offsetDis:" + (params.offsetDis ?? 15) + ",\n" +
          "  toFaceType:" + (params.toFaceType ?? 0) + ",\n" +
          "  diameter1:" + (params.diameter1 ?? 15) + ",\n" +
          "  depth1:" + (params.depth1 ?? 10) + ",\n" +
          "  angle1:" + (params.angle1 ?? 10) + ",\n" +
          "  slotDirection:" + (params.slotDirection ?? 0) + ",\n" +
          "  slotDir:" + (params.slotDir?.toScript() ?? "new Point()") + ",\n" +
          "  slotLength:" + (params.slotLength ?? 0) + ",\n" +
          "  arcCenterToArcCenter:" + (params.arcCenterToArcCenter ?? 0) + ",\n" +
          "  slotAngle:" + (params.slotAngle ?? 15) + ",\n" +
          "  slotAngleReverse:" + (params.slotAngleReverse ?? 0) + ",\n" +
          "  holeForm:" + (params.holeForm ?? 1) + ",\n" +
          "  threadEndType:" + (params.threadEndType ?? 0) + ",\n" +
          "  displayType:" + (params.displayType ?? 3) + ",\n" +
          "  showCutThread:" + (params.showCutThread ?? 1) + ",\n" +
          "});\n"
      }
    }

    static createRib(params, featureName) {
      if (params) {
        return "Solid.createRib('" + featureName + "',{\n" +
          "  sketch:" + (params.sketch ?? 0) + ",\n" +
          "  body:" + (params.body ?? 0) + ",\n" +
          "  ribDirection:" + (params.ribDirection ?? 0) + ",\n" +
          "  direction:" + (params.slotDir?.direction() ?? "new Direction()") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  thicknessType:" + (params.thicknessType ?? 0) + ",\n" +
          "  thickness:" + (params.thickness ?? 10.0) + ",\n" +
          "  draftType:" + (params.draftType ?? -1) + ",\n" +
          "  angle:" + (params.angle ?? 0.0) + ",\n" +
          "  extendType:" + (params.extendType ?? 0) + ",\n" +
          "});\n"
      }
    }

    static booleanUnion(params, featureName) {
      if (params) {
        return "Solid.booleanUnion('" + featureName + "',{\n" +
          "  entitys:" + (programArrayToString(params.entitys) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static booleanSubtract(params, featureName) {
      if (params) {
        return "Solid.booleanSubtract('" + featureName + "',{\n" +
          "  entityBs:" + (programArrayToString(params.entityBs) ?? "[]") + ",\n" +
          "  entityA:" + (params.entityA ?? 0) + ",\n" +
          "  keep:" + (params.keep ?? 0) + ",\n" +
          "});\n"
      }
    }

    static booleanIntersect(params, featureName) {
      if (params) {
        return "Solid.booleanIntersect('" + featureName + "',{\n" +
          "  entitys:" + (programArrayToString(params.entitys) ?? "[]") + ",\n" +
          "  keep:" + (params.keep ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createChamfer(params, featureName) {
      if (params) {
        return "Solid.createChamfer('" + featureName + "',{\n" +
          "  type:" + (params.type ?? 0) + ",\n" +
          "  tangentPropagation:" + (params.tangentPropagation ?? 1) + ",\n" +
          "  distance:" + (params.distance ?? 0) + ",\n" +
          "  distance2:" + (params.distance2 ?? 0) + ",\n" +
          "  elements:" + (programArrayToString(params.elements) ?? "[]") + ",\n" +
          "  elementTypes:" + (programArrayToString(params.elementTypes) ?? "[]") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createChamferByAngle(params, featureName) {
      if (params) {
        return "Solid.createChamferByAngle('" + featureName + "',{\n" +
          "  tangentPropagation:" + (params.tangentPropagation ?? 1) + ",\n" +
          "  angle:" + (params.angle ?? 0.0) + ",\n" +
          "  distance:" + (params.distance ?? 0) + ",\n" +
          "  elements:" + (programArrayToString(params.elements) ?? "[]") + ",\n" +
          "  elementTypes:" + (programArrayToString(params.elementTypes) ?? "[]") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createFillet(params, featureName) {
      if (params) {
        return "Solid.createFillet('" + featureName + "',{\n" +
          "  type:" + (params.type ?? 0) + ",\n" +
          "  tangentPropagation:" + (params.tangentPropagation ?? 1) + ",\n" +
          "  elements:" + (programArrayToString(params.elements) ?? "[]") + ",\n" +
          "  radius:" + (programArrayToString(params.radius) ?? "[]") + ",\n" +
          "  multiRadiusFillet:" + (params.multiRadiusFillet ?? 1) + ",\n" +
          "  instanceNumber:" + (params.instanceNumber ?? 0) + ",\n" +
          "  internalPoints:" + (programArrayToString(params.internalPoints) ?? "[]") + ",\n" +
          "  internalRadius:" + (programArrayToString(params.internalRadius) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static mirrorSolid(params, featureName) {
      if (params) {
        return "Solid.mirrorSolid('" + featureName + "',{\n" +
          "  baseType:" + (params.baseType ?? 0) + ",\n" +
          "  body:" + (params.body ?? 0) + ",\n" +
          "  features:" + (programArrayToString(params.features) ?? "[]") + ",\n" +
          "  mirrorPlane:" + (params.mirrorPlane ?? 0) + ",\n" +
          "  mergeSolids:" + (params.mergeSolids ?? 0) + ",\n" +
          "  geometryPattern:" + (params.geometryPattern ?? 0) + ",\n" +
          "});\n"
      }
    }

    static linearPattern(params, featureName) {
      if (params) {
        return "Solid.linearPattern('" + featureName + "',{\n" +
          "  baseType:" + (params.baseType ?? 0) + ",\n" +
          "  body:" + (params.body ?? 0) + ",\n" +
          "  features:" + (programArrayToString(params.features) ?? "[]") + ",\n" +
          "  direction1:" + (params.direction1?.toScript() ?? "new Direction()") + ",\n" +
          "  spacing1:" + (params.spacing1 ?? 10.0) + ",\n" +
          "  instanceNum1:" + (params.instanceNum1 ?? 2) + ",\n" +
          "  reverse1:" + (params.reverse1 ?? 0) + ",\n" +
          "  direction2:" + (params.direction2?.toScript() ?? "new Direction()") + ",\n" +
          "  hasDirection2:" + (params.hasDirection2 ?? 0) + ",\n" +
          "  spacing2:" + (params.spacing2 ?? 10) + ",\n" +
          "  instanceNum2:" + (params.instanceNum2 ?? 2) + ",\n" +
          "  reverse2:" + (params.reverse2 ?? 0) + ",\n" +
          "  patternSeed:" + (params.patternSeed ?? 0) + ",\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instancesToSkip:" + (programArrayToString(params.instancesToSkip) ?? "[]") + ",\n" +
          "  geometryPattern:" + (params.geometryPattern ?? 1) + ",\n" +
          "});\n"
      }
    }

    static circularPattern(params, featureName) {
      if (params) {
        return "Solid.circularPattern('" + featureName + "',{\n" +
          "  baseType:" + (params.baseType ?? 0) + ",\n" +
          "  body:" + (params.body ?? 0) + ",\n" +
          "  features:" + (programArrayToString(params.features) ?? "[]") + ",\n" +
          "  axis:" + (params.axis?.toScript() ?? "new Axis()") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  angle1:" + (params.angle1 ?? 0) + ",\n" +
          "  instanceNum1:" + (params.instanceNum1 ?? 2) + ",\n" +
          "  equalSpacing1:" + (params.equalSpacing1 ?? 1) + ",\n" +
          "  symmetric:" + (params.symmetric ?? 0) + ",\n" +
          "  hasDirection2:" + (params.hasDirection2 ?? 0) + ",\n" +
          "  angle2:" + (params.angle2 ?? 120) + ",\n" +
          "  instanceNum2:" + (params.instanceNum2 ?? 0) + ",\n" +
          "  equalSpacing2:" + (params.equalSpacing2 ?? 0) + ",\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instancesToSkip:" + (programArrayToString(params.instancesToSkip) ?? "[]") + ",\n" +
          "  geometryPattern:" + (params.geometryPattern ?? 0) + ",\n" +
          "});\n"
      }
    }

    static curvePattern(params, featureName) {
      if (params) {
        return "Solid.curvePattern('" + featureName + "',{\n" +
          "  baseType:" + (params.baseType ?? 0) + ",\n" +
          "  body:" + (params.body ?? 0) + ",\n" +
          "  features:" + (programArrayToString(params.features) ?? "[]") + ",\n" +
          "  curves:" + (programArrayToString(params.curves) ?? "[]") + ",\n" +
          "  spacing:" + (params.spacing ?? 10.0) + ",\n" +
          "  instanceNum:" + (params.instanceNum ?? 2) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  equalSpacing:" + (params.equalSpacing ?? 1) + ",\n" +
          "  curveMethod:" + (params.curveMethod ?? 0) + ",\n" +
          "  alignmentMethod:" + (params.alignmentMethod ?? 0) + ",\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instancesToSkip:" + (programArrayToString(params.instancesToSkip) ?? "[]") + ",\n" +
          "  curvesInsId:" + (programArrayToString(params.curvesInsId) ?? "[]") + ",\n" +
          "  geometryPattern:" + (params.geometryPattern ?? 0) + ",\n" +
          "});\n"
      }
    }

    static sketchPattern(params, featureName) {
      if (params) {
        return "Solid.sketchPattern('" + featureName + "',{\n" +
          "  baseType:" + (params.baseType ?? 0) + ",\n" +
          "  body:" + (params.body ?? 0) + ",\n" +
          "  features:" + (programArrayToString(params.features) ?? "[]") + ",\n" +
          "  sketchId:" + (params.sketchId ?? 0) + ",\n" +
          "  referenceType:" + (params.referenceType ?? 0) + ",\n" +
          "  referencePoint:" + (params.referencePoint?.toScript() ?? "new Point()") + ",\n" +
          "  geometryPattern:" + (params.geometryPattern ?? 1) + ",\n" +
          "  sketchInsId:" + (params.sketchInsId ?? 1) + ",\n" +
          "});\n"
      }
    }

    static createBox(params, featureName) {
      if (params) {
        return "Solid.createBox('" + featureName + "',{\n" +
          "  positionType:" + (params.positionType ?? 0) + ",\n" +
          "  positionPoint:" + (params.positionPoint?.toScript() ?? "new Point()") + ",\n" +
          "  length:" + (params.length ?? 40) + ",\n" +
          "  width:" + (params.width ?? 50) + ",\n" +
          "  height:" + (params.height ?? 60) + ",\n" +
          "});\n"
      }
    }

    static createCylinder(params, featureName) {
      if (params) {
        return "Solid.createCylinder('" + featureName + "',{\n" +
          "  positionType:" + (params.positionType ?? 0) + ",\n" +
          "  positionPoint:" + (params.positionPoint?.toScript() ?? "new Point()") + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  radius:" + (params.radius ?? 30) + ",\n" +
          "  height:" + (params.height ?? 40) + ",\n" +
          "});\n"
      }
    }

    static createSphere(params, featureName) {
      if (params) {
        return "Solid.createSphere('" + featureName + "',{\n" +
          "  center:" + (params.center?.toScript() ?? "new Point()") + ",\n" +
          "  radius:" + (params.radius ?? 10) + ",\n" +
          "});\n"
      }
    }

    static createWedge(params, featureName) {
      if (params) {
        return "Solid.createWedge('" + featureName + "',{\n" +
          "  baseVertex:" + (params.baseVertex?.toScript() ?? "new Point()") + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  length:" + (params.length ?? 20) + ",\n" +
          "  width:" + (params.width ?? 20) + ",\n" +
          "  height:" + (params.height ?? 20) + ",\n" +
          "});\n"
      }
    }

    static createCone(params, featureName) {
      if (params) {
        return "Solid.createCone('" + featureName + "',{\n" +
          "  center:" + (params.center?.toScript() ?? "new Point()") + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  radius:" + (params.radius ?? 40) + ",\n" +
          "  height:" + (params.height ?? 40) + ",\n" +
          "  minorRadius:" + (params.minorRadius ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPyramid(params, featureName) {
      if (params) {
        return "Solid.createPyramid('" + featureName + "',{\n" +
          "  center:" + (params.center?.toScript() ?? "new Point()") + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  edgeNum:" + (params.edgeNum ?? 8) + ",\n" +
          "  radius:" + (params.radius ?? 20) + ",\n" +
          "  height:" + (params.height ?? 100) + ",\n" +
          "});\n"
      }
    }

    static createTorus(params, featureName) {
      if (params) {
        return "Solid.createTorus('" + featureName + "',{\n" +
          "  center:" + (params.center?.toScript() ?? "new Point()") + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  innerRadius:" + (params.radius ?? 1.0) + ",\n" +
          "  radius:" + (params.height ?? 10.0) + ",\n" +
          "});\n"
      }
    }

    static moveFaces(params, featureName) {
      if (params) {
        return "Solid.moveFaces('" + featureName + "',{\n" +
          "  moveFaceIds:" + (programArrayToString(params.moveFaceIds) ?? "[]") + ",\n" +
          "  X:" + (params.X ?? 10) + ",\n" +
          "  Y:" + (params.Y ?? 10) + ",\n" +
          "  Z:" + (params.Z ?? 10) + ",\n" +
          "});\n"
      }
    }

    static offsetFaces(params, featureName) {
      if (params) {
        return "Solid.offsetFaces('" + featureName + "',{\n" +
          "  offsetFaceIds:" + (programArrayToString(params.offsetFaceIds) ?? "[]") + ",\n" +
          "  distance:" + (params.distance ?? 10) + ",\n" +
          "});\n"
      }
    }

    static deleteFaces(params, featureName) {
      if (params) {
        return "Solid.deleteFaces('" + featureName + "',{\n" +
          "  deleteFaceIds:" + (programArrayToString(params.deleteFaceIds) ?? "[]") + ",\n" +
          "  isFix:" + (params.isFix ?? 0) + ",\n" +
          "});\n"
      }
    }

    static replaceFaces(params, featureName) {
      if (params) {
        return "Solid.replaceFaces('" + featureName + "',{\n" +
          "  replaceFaceIds:" + (programArrayToString(params.replaceFaceIds) ?? "[]") + ",\n" +
          "  targetFaceId:" + (params.targetFaceId ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createCutSplit(params, featureName) {
      if (params) {
        return "Solid.createCutSplit('" + featureName + "',{\n" +
          "  solidId:" + (params.solidId ?? 0) + ",\n" +
          "  cutSurfaceId:" + (params.cutSurfaceId ?? 0) + ",\n" +
          "  isInvert:" + (params.isInvert ?? 0) + ",\n" +
          "});\n"
      }
    }

    static fillPattern(params, featureName) {
      if (params) {
        return "Solid.fillPattern('" + featureName + "',{\n" +
          "  baseType:" + (params.baseType ?? 1) + ",\n" +
          "  body:" + (programArrayToString(params.body) ?? "[]") + ",\n" +
          "  features:" + (programArrayToString(params.features) ?? "[]") + ",\n" +
          "  fillBound:" + (programArrayToString(params.fillBound) ?? "[]") + ",\n" +
          "  fillType:" + (params.fillType ?? 0) + ",\n" +
          "  instDist:" + (params.instDist ?? 10) + ",\n" +
          "  angle:" + (params.angle ?? 60) + ",\n" +
          "  edgeDist:" + (params.edgeDist ?? 0) + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instSkip:" + (programArrayToString(params.instSkip) ?? "[]") + ",\n" +
          "  ringInstNum:" + (params.ringInstNum ?? 0) + ",\n" +
          "  polySidesNum:" + (params.polySidesNum ?? 6) + ",\n" +
          "  averType:" + (params.averType ?? 0) + ",\n" +
          "  geometryPattern:" + (params.geometryPattern ?? 0) + ",\n" +
          "  fillBoundInsId:" + (programArrayToString(params.fillBoundInsId) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static createTransformByDistance(params, featureName = "") {
      if (params) {
        return "Solid.createTransformByDistance('" + featureName + "',{\n" +
          "  entityIds: " + (programArrayToString(params.entityIds) ?? "[]") + ",\n" +
          "  copy: " + (params.copy ?? 1) + ",\n" +
          "  startPoint: " + (params.startPoint?.toScript() ?? "new Point()") + ",\n" +
          "  distance: " + (params.distance ?? 10) + ",\n" +
          "  direction: " + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  reverse: " + (params.reverse ?? 0) + ",\n" +
          "});"
      }
    }

    static createTransformByXYZ(params, featureName = "") {
      if (params) {
        return "Solid.createTransformByXYZ('" + featureName + "',{\n" +
          "  entityIds: " + (programArrayToString(params.entityIds) ?? "[]") + ",\n" +
          "  copy: " + (params.copy ?? 1) + ",\n" +
          "  startPoint: " + (params.startPoint?.toScript() ?? "new Point()") + ",\n" +
          "  endPoint: " + (params.endPoint?.toScript() ?? "new Point()") + ",\n" +
          "  reverse: " + (params.reverse ?? 0) + ",\n" +
          "});"
      }
    }

    static createTransformByRotate(params, featureName = "") {
      if (params) {
        return "Solid.createTransformByRotate('" + featureName + "',{\n" +
          "  entityIds: " + (programArrayToString(params.entityIds) ?? "[]") + ",\n" +
          "  copy: " + (params.copy ?? 1) + ",\n" +
          "  startPoint: " + (params.startPoint?.toScript() ?? "new Point()") + ",\n" +
          "  angle: " + (params.angle ?? "10") + ",\n" +
          "  axis: " + (params.axis?.toScript() ?? "new Direction()") + ",\n" +
          "  reverse: " + (params.reverse ?? 0) + ",\n" +
          "});"
      }
    }

    static createTransformByCoordinateSystem(params, featureName = "") {
      if (params) {
        return "Solid.createTransformByCoordinateSystem('" + featureName + "',{\n" +
          "  entityIds: " + (programArrayToString(params.entityIds) ?? "[]") + ",\n" +
          "  copy: " + (params.copy ?? 1) + ",\n" +
          "  refCoordSysId: " + (params.refCoordSysId ?? 0) + ",\n" +
          "  refCoordSysInsId: '" + (params.refCoordSysInsId ?? "") + "',\n" +
          "  tarCoordSysId: " + (params.tarCoordSysId ?? 0) + ",\n" +
          "  tarCoordSysInsId: '" + (params.tarCoordSysInsId ?? "") + "',\n" +
          "});"
      }
    }

  }

  class PluginSolidCommand {
    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    extrude(params, featureName = "") {
      let script = SolidScript.extrude(params, featureName);
      this.#generateScript(script);
    }

    async extrudeIncrement(params, featureName = "") {
      let script = SolidScript.extrude(params, featureName);
      return this.#executeIncrementScript(script);
    }

    extrudeCut(params, featureName) {
      let script = SolidScript.extrudeCut(params, featureName);
      this.#generateScript(script);
    }

    async extrudeCutIncrement(params, featureName) {
      let script = SolidScript.extrudeCut(params, featureName);
      return this.#executeIncrementScript(script);
    }

    revolve(params, featureName) {
      let script = SolidScript.revolve(params, featureName);
      this.#generateScript(script);
    }

    async revolveIncrement(params, featureName) {
      let script = SolidScript.revolve(params, featureName);
      return this.#executeIncrementScript(script);
    }

    revolveCut(params, featureName) {
      let script = SolidScript.revolveCut(params, featureName);
      this.#generateScript(script);
    }

    async revolveCutIncrement(params, featureName) {
      let script = SolidScript.revolveCut(params, featureName);
      return this.#executeIncrementScript(script);
    }

    sweep(params, featureName) {
      let script = SolidScript.sweep(params, featureName);
      this.#generateScript(script);
    }

    async sweepIncrement(params, featureName) {
      let script = SolidScript.sweep(params, featureName);
      return this.#executeIncrementScript(script);
    }

    sweepCut(params, featureName) {
      let script = SolidScript.sweepCut(params, featureName);
      this.#generateScript(script);
    }

    async sweepCutIncrement(params, featureName) {
      let script = SolidScript.sweepCut(params, featureName);
      return this.#executeIncrementScript(script);
    }

    loft(params, featureName) {
      let script = SolidScript.loft(params, featureName);
      this.#generateScript(script);
    }

    async loftIncrement(params, featureName) {
      let script = SolidScript.loft(params, featureName);
      return this.#executeIncrementScript(script);
    }

    loftCut(params, featureName) {
      let script = SolidScript.loftCut(params, featureName);
      this.#generateScript(script);
    }

    async loftCutIncrement(params, featureName) {
      let script = SolidScript.loftCut(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createShell(params, featureName) {
      let script = SolidScript.createShell(params, featureName);
      this.#generateScript(script);
    }

    async createShellIncrement(params, featureName) {
      let script = SolidScript.createShell(params, featureName);
      return this.#executeIncrementScript(script);
    }

    thicken(params, featureName) {
      let script = SolidScript.thicken(params, featureName);
      this.#generateScript(script);
    }

    async thickenIncrement(params, featureName) {
      let script = SolidScript.thicken(params, featureName);
      return this.#executeIncrementScript(script);
    }

    draftAngle(params, featureName) {
      let script = SolidScript.draftAngle(params, featureName);
      this.#generateScript(script);
    }

    async draftAngleIncrement(params, featureName) {
      let script = SolidScript.draftAngle(params, featureName);
      return this.#executeIncrementScript(script);
    }

    cutSplit(params, featureName) {
      let script = SolidScript.cutSplit(params, featureName);
      this.#generateScript(script);
    }

    async cutSplitIncrement(params, featureName) {
      let script = SolidScript.cutSplit(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createHole(params, featureName) {
      let script = SolidScript.createHole(params, featureName);
      this.#generateScript(script);
    }

    async createHoleIncrement(params, featureName) {
      let script = SolidScript.createHole(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createRib(params, featureName) {
      let script = SolidScript.createRib(params, featureName);
      this.#generateScript(script);
    }

    async createRibIncrement(params, featureName) {
      let script = SolidScript.createRib(params, featureName);
      return this.#executeIncrementScript(script);
    }

    booleanUnion(params, featureName) {
      let script = SolidScript.booleanUnion(params, featureName);
      this.#generateScript(script);
    }

    async booleanUnionIncrement(params, featureName) {
      let script = SolidScript.booleanUnion(params, featureName);
      return this.#executeIncrementScript(script);
    }

    booleanSubtract(params, featureName) {
      let script = SolidScript.booleanSubtract(params, featureName);
      this.#generateScript(script);
    }

    async booleanSubtractIncrement(params, featureName) {
      let script = SolidScript.booleanSubtract(params, featureName);
      return this.#executeIncrementScript(script);
    }

    booleanIntersect(params, featureName) {
      let script = SolidScript.booleanIntersect(params, featureName);
      this.#generateScript(script);
    }

    async booleanIntersectIncrement(params, featureName) {
      let script = SolidScript.booleanIntersect(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createChamfer(params, featureName) {
      let script = SolidScript.createChamfer(params, featureName);
      this.#generateScript(script);
    }

    async createChamferIncrement(params, featureName) {
      let script = SolidScript.createChamfer(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createChamferByAngle(params, featureName) {
      let script = SolidScript.createChamferByAngle(params, featureName);
      this.#generateScript(script);
    }

    async createChamferByAngleIncrement(params, featureName) {
      let script = SolidScript.createChamferByAngle(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createFillet(params, featureName) {
      let script = SolidScript.createFillet(params, featureName);
      this.#generateScript(script);
    }

    async createFilletIncrement(params, featureName) {
      let script = SolidScript.createFillet(params, featureName);
      return this.#executeIncrementScript(script);
    }

    mirrorSolid(params, featureName) {
      let script = SolidScript.mirrorSolid(params, featureName);
      this.#generateScript(script);
    }

    async mirrorSolidIncrement(params, featureName) {
      let script = SolidScript.mirrorSolid(params, featureName);
      return this.#executeIncrementScript(script);
    }

    linearPattern(params, featureName) {
      let script = SolidScript.linearPattern(params, featureName);
      this.#generateScript(script);
    }

    async linearPatternIncrement(params, featureName) {
      let script = SolidScript.linearPattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    circularPattern(params, featureName) {
      let script = SolidScript.circularPattern(params, featureName);
      this.#generateScript(script);
    }

    async circularPatternIncrement(params, featureName) {
      let script = SolidScript.circularPattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    curvePattern(params, featureName) {
      let script = SolidScript.curvePattern(params, featureName);
      this.#generateScript(script);
    }

    async curvePatternIncrement(params, featureName) {
      let script = SolidScript.curvePattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    sketchPattern(params, featureName) {
      let script = SolidScript.sketchPattern(params, featureName);
      this.#generateScript(script);
    }

    async sketchPatternIncrement(params, featureName) {
      let script = SolidScript.sketchPattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createBox(params, featureName) {
      let script = SolidScript.createBox(params, featureName);
      this.#generateScript(script);
    }

    async createBoxIncrement(params, featureName) {
      let script = SolidScript.createBox(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCylinder(params, featureName) {
      let script = SolidScript.createCylinder(params, featureName);
      this.#generateScript(script);
    }

    async createCylinderIncrement(params, featureName) {
      let script = SolidScript.createCylinder(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createSphere(params, featureName) {
      let script = SolidScript.createSphere(params, featureName);
      this.#generateScript(script);
    }

    async createSphereIncrement(params, featureName) {
      let script = SolidScript.createSphere(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createWedge(params, featureName) {
      let script = SolidScript.createWedge(params, featureName);
      this.#generateScript(script);
    }

    async createWedgeIncrement(params, featureName) {
      let script = SolidScript.createWedge(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCone(params, featureName) {
      let script = SolidScript.createCone(params, featureName);
      this.#generateScript(script);
    }

    async createConeIncrement(params, featureName) {
      let script = SolidScript.createCone(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPyramid(params, featureName) {
      let script = SolidScript.createPyramid(params, featureName);
      this.#generateScript(script);
    }

    async createPyramidIncrement(params, featureName) {
      let script = SolidScript.createPyramid(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createTorus(params, featureName) {
      let script = SolidScript.createTorus(params, featureName);
      this.#generateScript(script);
    }

    async createTorusIncrement(params, featureName) {
      let script = SolidScript.createTorus(params, featureName);
      return this.#executeIncrementScript(script);
    }

    moveFaces(params, featureName) {
      let script = SolidScript.moveFaces(params, featureName);
      this.#generateScript(script);
    }

    async moveFacesIncrement(params, featureName) {
      let script = SolidScript.moveFaces(params, featureName);
      return this.#executeIncrementScript(script);
    }

    offsetFaces(params, featureName) {
      let script = SolidScript.offsetFaces(params, featureName);
      this.#generateScript(script);
    }

    async offsetFacesIncrement(params, featureName) {
      let script = SolidScript.offsetFaces(params, featureName);
      return this.#executeIncrementScript(script);
    }

    deleteFaces(params, featureName) {
      let script = SolidScript.deleteFaces(params, featureName);
      this.#generateScript(script);
    }

    async deleteFacesIncrement(params, featureName) {
      let script = SolidScript.deleteFaces(params, featureName);
      return this.#executeIncrementScript(script);
    }

    replaceFaces(params, featureName) {
      let script = SolidScript.replaceFaces(params, featureName);
      this.#generateScript(script);
    }

    async replaceFacesIncrement(params, featureName) {
      let script = SolidScript.replaceFaces(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCutSplit(params, featureName) {
      let script = SolidScript.createCutSplit(params, featureName);
      this.#generateScript(script);
    }

    async createCutSplitIncrement(params, featureName) {
      let script = SolidScript.createCutSplit(params, featureName);
      return this.#executeIncrementScript(script);
    }

    fillPattern(params, featureName) {
      let script = SolidScript.fillPattern(params, featureName);
      this.#generateScript(script);
    }

    async fillPatternIncrement(params, featureName) {
      let script = SolidScript.fillPattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createTransformByDistance(params, featureName) {
      let script = SolidScript.createTransformByDistance(params, featureName);
      this.#generateScript(script);
    }

    async createTransformByDistanceIncrement(params, featureName) {
      let script = SolidScript.createTransformByDistance(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createTransformByXYZ(params, featureName) {
      let script = SolidScript.createTransformByXYZ(params, featureName);
      this.#generateScript(script);
    }

    async createTransformByXYZIncrement(params, featureName) {
      let script = SolidScript.createTransformByXYZ(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createTransformByRotate(params, featureName) {
      let script = SolidScript.createTransformByRotate(params, featureName);
      this.#generateScript(script);
    }

    async createTransformByRotateIncrement(params, featureName) {
      let script = SolidScript.createTransformByRotate(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createTransformByCoordinateSystem(params, featureName) {
      let script = SolidScript.createTransformByCoordinateSystem(params, featureName);
      this.#generateScript(script);
    }

    async createTransformByCoordinateSystemIncrement(params, featureName) {
      let script = SolidScript.createTransformByCoordinateSystem(params, featureName);
      return this.#executeIncrementScript(script);
    }

  }

  class CurveScript {
    static createHelixCurve(params, featureName = "") {
      if (params) {
        return "Curve.createHelixCurve('" + featureName + "',{\n" +
          "  helixPlane:" + (params.helixPlane ?? 0) + ",\n" +
          "  inputModel:" + (params.inputModel ?? 0) + ",\n" +
          "  step:" + (params.step ?? 10) + ",\n" +
          "  height:" + (params.height ?? 50) + ",\n" +
          "  revolution:" + (params.revolution ?? 5) + ",\n" +
          "  rotation:" + (params.rotation ?? 0) + ",\n" +
          "  isTaperAngle:" + (params.isTaperAngle ?? 0) + ",\n" +
          "  taperAngle:" + (params.taperAngle ?? 0) + ",\n" +
          "  isEndsAngles:" + (params.isEndsAngles ?? 0) + ",\n" +
          "  startAngle:" + (params.startAngle ?? 0) + ",\n" +
          "  endAngle:" + (params.endAngle ?? 0) + ",\n" +
          "  isInvert:" + (params.isInvert ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createCompositeCurve(params, featureName = "") {
      if (params) {
        return "Curve.createCompositeCurve('" + featureName + "'," + (programArrayToString(params.JoinEntities) ?? "[]") + ");\n"
      }
    }

    static createProjectCurve(params, featureName = "") {
      if (params) {
        return "Curve.createProjectCurve('" + featureName + "',{\n" +
          "  projectionType:" + (params.projectionType ?? 1) + ",\n" +
          "  sketches:" + (programArrayToString(params.sketches) ?? "[]") + ",\n" +
          "  faces:" + (programArrayToString(params.faces) ?? "[]") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  directionType:" + (params.directionType ?? 0) + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  doubleDirection:" + (params.doubleDirection ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createCurveByInterpolationPoints(params, featureName = "") {
      if (params) {
        return "Curve.createCurveByInterpolationPoints('" + featureName + "',{\n" +
          "  pickPnts:" + (programArrayToString(params.pickPnts) ?? "[]") + ",\n" +
          "  isClosed:" + (params.isClosed ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createSplitLine(params, featureName = "") {
      if (params) {
        return "Curve.createSplitLine('" + featureName + "',{\n" +
          "  limitIds:" + (programArrayToString(params.limitIds) ?? "[]") + ",\n" +
          "  surfaceIds:" + (programArrayToString(params.surfaceIds) ?? "[]") + ",\n" +
          "  splitDirectionType:" + (params.splitDirectionType ?? 0) + ",\n" +
          "  splitDirectionReverse:" + (params.splitDirectionReverse ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createConnectCurve(params, featureName = "") {
      if (params) {
        return "Curve.createConnectCurve('" + featureName + "',{\n" +
          "  lPnt:" + (params.lPnt ?? 0) + ",\n" +
          "  rPnt:" + (params.rPnt ?? 0) + ",\n" +
          "  lCont:" + (params.lCont ?? 0) + ",\n" +
          "  rCont:" + (params.rCont ?? 0) + ",\n" +
          "  lWeight:" + (params.lWeight ?? 1) + ",\n" +
          "  rWeight:" + (params.rWeight ?? 1) + ",\n" +
          "});\n"
      }
    }

    static createCurveByXYZPoints(params, featureName = "") {
      if (params) {
        return "Curve.createCurveByXYZPoints('" + featureName + "',{\n" +
          "  pickPnts:" + (programArrayToString(params.points) ?? "[]") + ",\n" +
          "});\n"
      }
    }
   }

  class PluginCurveCommand {
    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    createHelixCurve(params, featureName = "") {
      let script = CurveScript.createHelixCurve(params, featureName);
      this.#generateScript(script);
    }

    async createHelixCurveIncrement(params, featureName = "") {
      let script = CurveScript.createHelixCurve(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCompositeCurve(params, featureName = "") {
      let script = CurveScript.createCompositeCurve(params, featureName);
      this.#generateScript(script);
    }

    async createCompositeCurveIncrement(params, featureName = "") {
      let script = CurveScript.createCompositeCurve(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createProjectCurve(params, featureName = "") {
      let script = CurveScript.createProjectCurve(params, featureName);
      this.#generateScript(script);
    }

    async createProjectCurveIncrement(params, featureName = "") {
      let script = CurveScript.createProjectCurve(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCurveByInterpolationPoints(params, featureName = "") {
      let script = CurveScript.createCurveByInterpolationPoints(params, featureName);
      this.#generateScript(script);
    }

    async createCurveByInterpolationPointsIncrement(params, featureName = "") {
      let script = CurveScript.createCurveByInterpolationPoints(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createSplitLine(params, featureName = "") {
      let script = CurveScript.createSplitLine(params, featureName);
      this.#generateScript(script);
    }

    async createSplitLineIncrement(params, featureName = "") {
      let script = CurveScript.createSplitLine(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createConnectCurve(params, featureName = "") {
      let script = CurveScript.createConnectCurve(params, featureName);
      this.#generateScript(script);
    }

    async createConnectCurveIncrement(params, featureName = "") {
      let script = CurveScript.createConnectCurve(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCurveByXYZPoints(params, featureName = "") {
      let script = CurveScript.createCurveByXYZPoints(params, featureName);
      this.#generateScript(script);
    }

    async createCurveByXYZPointsIncrement(params, featureName = "") {
      let script = CurveScript.createCurveByXYZPoints(params, featureName);
      return this.#executeIncrementScript(script);
    }

  }

  class DatumScript {
    static createLine(params, featureName = "") {
      if (params) {
        return "Datum.createLine('" + featureName + "',{\n" +
          "  referenceType:" + (params.referenceType ?? 1) + ",\n" +
          "  referenceEntities:" + (programArrayToString(params.referenceEntities) ?? "[]") + ",\n" +
          "  refInstanceIdList:" + (programArrayToString(params.refInstanceIdList) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static createDatumLineByPointAndSurface (params, featureName = "") {
      if (params) {
        return "Datum.createDatumLineByPointAndSurface('" + featureName + "',{\n" +
          "  point:" + (params.point?.toScript() ?? "new Point()") + ",\n" +
          "  pointRefInstanceId:" + (params.pointRefInstanceId ?? 0) + ",\n" +
          "  surfaceId:" + (params.surfaceId ?? 0) + ",\n" +
          "  surfaceIdRefInstanceId:" + (params.surfaceIdRefInstanceId ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPlaneByDistance(params, featureName = "") {
      if (params) {
        let referenceFaceId;
        if (params.faceId) {
          referenceFaceId = "  faceId:" + params.faceId + ",\n" ;
        } else {
          referenceFaceId = "  planeId:" + (params.planeId ?? 8) + ",\n";
        }
        return "Datum.createPlaneByDistance('" + featureName + "',{\n" +
          referenceFaceId +
          "  invertNormal:" + (params.invertNormal ?? "0") + ",\n" +
          "  paralDis:" + (params.paralDis ?? "10") + ",\n" +
          "  reverse:" + (params.reverse ?? "0") + ",\n" +
          "});\n"
      }
    }

    static createPlaneByPlanePoint(params, featureName = "") {
      if (params) {
        let referenceFaceId;
        if (params.faceId) {
          referenceFaceId = "  faceId:" + params.faceId + ",\n" ;
        } else {
          referenceFaceId = "  planeId:" + (params.planeId ?? 8) + ",\n";
        }
        return "Datum.createPlaneByPlanePoint('" + featureName + "',{\n" +
          referenceFaceId +
          "  invertNormal:" + (params.invertNormal ?? 0) + ",\n" +
          "  paralPnt:" + (params.paralPnt?.toScript() ?? "new Point()") + ",\n" +
          "});\n"
      }
    }

    static createPlaneByPlaneAngle(params, featureName = "") {
      if (params) {
        let referenceFaceId;
        if (params.faceId) {
          referenceFaceId = "  faceId:" + params.faceId + ",\n" ;
        } else {
          referenceFaceId = "  planeId:" + (params.planeId ?? 8) + ",\n";
        }
        return "Datum.createPlaneByPlaneAngle('" + featureName + "',{\n" +
          referenceFaceId +
          "  invertNormal:" + (params.invertNormal ?? 0) + ",\n" +
          "  additionalAxis:" + (params.additionalAxis?.toScript() ?? "new Axis()") + ",\n" +
          "  axisAngle:" + (params.axisAngle ?? 0) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPlaneByThreePoints(params, featureName = "") {
      if (params) {
        return "Datum.createPlaneByThreePoints('" + featureName + "',{\n" +
          "  threePnts:" + (programArrayToString(params.threePnts) ?? "[]") + ",\n" +
          "  invertNormal:" + (params.invertNormal ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPlaneByPointNormal(params, featureName = "") {
      if (params) {
        return "Datum.createPlaneByPointNormal('" + featureName + "',{\n" +
          "  planeAxis:" + (params.planeAxis?.toScript() ?? "new Axis()") + ",\n" +
          "  planePnt:" + (params.planePnt?.toScript() ?? "new Point()") + ",\n" +
          "  invertNormal:" + (params.invertNormal ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPlaneByLineAngle(params, featureName = "") {
      if (params) {
        return "Datum.createPlaneByLineAngle('" + featureName + "',{\n" +
          "  planeAxis:" + (params.planeAxis?.toScript() ?? "new Axis()") + ",\n" +
          "  planePnt:" + (params.planePnt?.toScript() ?? "new Point()") + ",\n" +
          "  invertNormal:" + (params.invertNormal ?? 0) + ",\n" +
          "  axisAngle:" + (params.axisAngle ?? 0) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPointByArcPoint(params, featureName = "") {
      if (params) {
        return "Datum.createPointByArcPoint('" + featureName + "',{\n" +
          "  referenceArcId:" + (params.referenceArcId ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPointByFacePoint(params, featureName = "") {
      if (params) {
        return "Datum.createPointByFacePoint('" + featureName + "',{\n" +
          "  referenceFaceId:" + (params.referenceFaceId ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPointByCrossPoint(params, featureName = "") {
      if (params) {
        return "Datum.createPointByCrossPoint('" + featureName + "',{\n" +
          "  referenceElementIds:" + (programArrayToString(params.referenceElementIds) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static createPointByProjectionPoint(params, featureName = "") {
      if (params) {
        return "Datum.createPointByProjectionPoint('" + featureName + "',{\n" +
          "  referenceFaceId:" + (params.referenceFaceId ?? 0) + ",\n" +
          "  referencePoint:" + (params.referencePoint?.toScript() ?? "new Point()") + ",\n" +
          "});\n"
      }
    }

    static createPointByPoint(params, featureName = "") {
      if (params) {
        return "Datum.createPointByPoint('" + featureName + "',{\n" +
          "  referencePointId:" + (params.referencePointId ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createPointByCurve(params, featureName = "") {
      if (params) {
        return "Datum.createPointByCurve('" + featureName + "',{\n" +
          "  referenceEntities:" + (params.referenceEntities ?? 0) + ",\n" +
          "  multiplePntsType:" + (params.multiplePntsType ?? 0) + ",\n" +
          "  referenceValue:" + (params.referenceValue ?? 10) + ",\n" +
          "});\n"
      }
    }

    static createCoordinateSystemByThreePoint(params, featureName = "") {
      if (params) {
        return "Datum.createCoordinateSystemByThreePoint('" + featureName + "', {\n" +
          "  originPoint: " + (params.originPoint?.toScript() ?? "new Point()") + ",\n" +
          "  xPoint: " + (params.xPoint?.toScript() ?? "new Point()") + ",\n" +
          "  yPoint: " + (params.yPoint?.toScript() ?? "new Point()") +",\n" +
          "  xReverse: " + (params.xReverse ?? 0) + ",\n" +
          "  yReverse: " + (params.yReverse ?? 0) + ",\n" +
          "  zReverse: " + (params.zReverse ?? 0) + ",\n" +
          "});"
      }
    }

    static createCoordinateSystemByOnePointAndTwoLines(params, featureName = "") {
      if (params) {
        return "Datum.createCoordinateSystemByOnePointAndTwoLines('" + featureName + "', {\n" +
          "  originPoint: " + (params.originPoint?.toScript() ?? "new Point()") + ",\n" +
          "  directionType: " + (params.directionType ?? 4) + ",\n" +
          "  direction1: " + (params.direction1?.toScript() ?? "new Point()") + ",\n" +
          "  direction2: " + (params.direction2?.toScript() ?? "new Point()") +",\n" +
          "  xReverse: " + (params.xReverse ?? 0) + ",\n" +
          "  yReverse: " + (params.yReverse ?? 0) + ",\n" +
          "  zReverse: " + (params.zReverse ?? 0) + ",\n" +
          "});"
      }
    }

    static createCoordinateSystemByThreePlanes(params, featureName = "") {
      if (params) {
        return "Datum.createCoordinateSystemByThreePlanes('" + featureName + "', {\n" +
          "  xPlaneId: " + (params.xPlaneId ?? 0) + ",\n" +
          "  xPlaneInsId: '" + (params.xPlaneInsId ?? 0) + "',\n" +
          "  yPlaneId: " + (params.yPlaneId ?? 0) + ",\n" +
          "  yPlaneInsId: '" + (params.yPlaneInsId ?? 0) + "',\n" +
          "  zPlaneId: " + (params.zPlaneId ?? 0) + ",\n" +
          "  zPlaneInsId: '" + (params.zPlaneInsId ?? 0) + "',\n" +
          "  xReverse: " + (params.xReverse ?? 0) + ",\n" +
          "  yReverse: " + (params.yReverse ?? 0) + ",\n" +
          "  zReverse: " + (params.zReverse ?? 0) + ",\n" +
          "});"
      }
    }

    static createCoordinateSystemByTrendsMatrix(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "Datum.createCoordinateSystemByTrendsMatrix('" + featureName + "', {\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "  xReverse: " + (params.xReverse ?? 0) + ",\n" +
          "  yReverse: " + (params.yReverse ?? 0) + ",\n" +
          "  zReverse: " + (params.zReverse ?? 0) + ",\n" +
          "});"
      }
    }

    static createCoordinateSystemByOffset(params, featureName = "") {
      if (params) {
        return "Datum.createCoordinateSystemByOffset('" + featureName + "', {\n" +
          "  arsId: " + (params.arsId ?? 0) + ",\n" +
          "  type: " + (params.type ?? 8) + ",\n" +
          "  xRotateAngle: " + (params.xRotateAngle ?? 0) + ",\n" +
          "  yRotateAngle: " + (params.yRotateAngle ?? 0) + ",\n" +
          "  zRotateAngle: " + (params.zRotateAngle ?? 0) + ",\n" +
          "  xOffsetDistance: " + (params.xOffsetDistance ?? 0) + ",\n" +
          "  yOffsetDistance: " + (params.yOffsetDistance ?? 0) + ",\n" +
          "  zOffsetDistance: " + (params.zOffsetDistance ?? 0) + ",\n" +
          "});"
      }
    }

    static createCoordinateSystemByPointAndView(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "Datum.createCoordinateSystemByPointAndView('" + featureName + "', {\n" +
          "  originPoint: " + (params.originPoint?.toScript() ?? "new Point()") + ",\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "  xReverse: " + (params.xReverse ?? 0) + ",\n" +
          "  yReverse: " + (params.yReverse ?? 0) + ",\n" +
          "  zReverse: " + (params.zReverse ?? 0) + ",\n" +
          "});"
      }
    }
   }

  class PluginDatumCommand {

    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    createLine(params, featureName = "") {
      let script = DatumScript.createLine(params, featureName);
      this.#generateScript(script);
    }

    async createLineIncrement(params, featureName = "") {
      let script = DatumScript.createLine(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPlaneByDistance(params, featureName = "") {
      let script = DatumScript.createPlaneByDistance(params, featureName);
      this.#generateScript(script);
    }

    async createPlaneByDistanceIncrement(params, featureName = "") {
      let script = DatumScript.createPlaneByDistance(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPlaneByPlanePoint(params, featureName = "") {
      let script = DatumScript.createPlaneByPlanePoint(params, featureName);
      this.#generateScript(script);
    }

    async createPlaneByPlanePointIncrement(params, featureName = "") {
      let script = DatumScript.createPlaneByPlanePoint(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPlaneByPlaneAngle(params, featureName = "") {
      let script = DatumScript.createPlaneByPlaneAngle(params, featureName);
      this.#generateScript(script);
    }

    async createPlaneByPlaneAngleIncrement(params, featureName = "") {
      let script = DatumScript.createPlaneByPlaneAngle(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPlaneByThreePoints(params, featureName = "") {
      let script = DatumScript.createPlaneByThreePoints(params, featureName);
      this.#generateScript(script);
    }

    async createPlaneByThreePointsIncrement(params, featureName = "") {
      let script = DatumScript.createPlaneByThreePoints(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPlaneByPointNormal(params, featureName = "") {
      let script = DatumScript.createPlaneByPointNormal(params, featureName);
      this.#generateScript(script);
    }

    async createPlaneByPointNormalIncrement(params, featureName = "") {
      let script = DatumScript.createPlaneByPointNormal(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPlaneByLineAngle(params, featureName = "") {
      let script = DatumScript.createPlaneByLineAngle(params, featureName);
      this.#generateScript(script);
    }

    async createPlaneByLineAngleIncrement(params, featureName = "") {
      let script = DatumScript.createPlaneByLineAngle(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPointByArcPoint(params, featureName = "") {
      let script = DatumScript.createPointByArcPoint(params, featureName);
      this.#generateScript(script);
    }

    async createPointByArcPointIncrement(params, featureName = "") {
      let script = DatumScript.createPointByArcPoint(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPointByFacePoint(params, featureName = "") {
      let script = DatumScript.createPointByFacePoint(params, featureName);
      this.#generateScript(script);
    }

    async createPointByFacePointIncrement(params, featureName = "") {
      let script = DatumScript.createPointByFacePoint(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPointByCrossPoint(params, featureName = "") {
      let script = DatumScript.createPointByCrossPoint(params, featureName);
      this.#generateScript(script);
    }

    async createPointByCrossPointIncrement(params, featureName = "") {
      let script = DatumScript.createPointByCrossPoint(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPointByProjectionPoint(params, featureName = "") {
      let script = DatumScript.createPointByProjectionPoint(params, featureName);
      this.#generateScript(script);
    }

    async createPointByProjectionPointIncrement(params, featureName = "") {
      let script = DatumScript.createPointByProjectionPoint(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPointByPoint(params, featureName = "") {
      let script = DatumScript.createPointByPoint(params, featureName);
      this.#generateScript(script);
    }

    async createPointByPointIncrement(params, featureName = "") {
      let script = DatumScript.createPointByPoint(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPointByCurve(params, featureName = "") {
      let script = DatumScript.createPointByCurve(params, featureName);
      this.#generateScript(script);
    }

    async createPointByCurveIncrement(params, featureName = "") {
      let script = DatumScript.createPointByCurve(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCoordinateSystemByThreePoint(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByThreePoint(params, featureName);
      this.#generateScript(script);
    }

    async createCoordinateSystemByThreePointIncrement(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByThreePoint(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCoordinateSystemByOnePointAndTwoLines(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByOnePointAndTwoLines(params, featureName);
      this.#generateScript(script);
    }

    async createCoordinateSystemByOnePointAndTwoLinesIncrement(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByOnePointAndTwoLines(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCoordinateSystemByThreePlanes(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByThreePlanes(params, featureName);
      this.#generateScript(script);
    }

    async createCoordinateSystemByThreePlanesIncrement(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByThreePlanes(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCoordinateSystemByTrendsMatrix(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByTrendsMatrix(params, featureName);
      this.#generateScript(script);
    }

    async createCoordinateSystemByTrendsMatrixIncrement(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByTrendsMatrix(params, featureName);
      return this.#executeIncrementScript(script);
    }


    createCoordinateSystemByOffset(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByOffset(params, featureName);
      this.#generateScript(script);
    }

    async createCoordinateSystemByOffsetIncrement(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByOffset(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createCoordinateSystemByPointAndView(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByPointAndView(params, featureName);
      this.#generateScript(script);
    }

    async createCoordinateSystemByPointAndViewIncrement(params, featureName = "") {
      let script = DatumScript.createCoordinateSystemByPointAndView(params, featureName);
      return this.#executeIncrementScript(script);
    }

  }

  class EvaluateScript {
    static getEntityVolume(params) {
      if (params) {
        return "Evaluate.getEntityVolume(" + (params.entityId ?? 0) + ");\n";
      }
    }

    static getEntityArea(params) {
      if (params) {
        return "Evaluate.getEntityArea(" + (params.entityId ?? 0) + ");\n";
      }
    }

    static getEntityCentroid(params) {
      if (params) {
        return "Evaluate.getEntityCentroid(" + (params.entityId ?? 0) + ");\n";
      }
    }

    static getEntityMassProperties(params) {
      if (params) {
        return "Evaluate.getEntityMassProperties(" + (params.entityId ?? 0) + ");\n";
      }
    }

    static getInstanceMassProperties(params) {
      if (params) {
        return "Evaluate.getInstanceMassProperties('" + (params.instanceId ?? "") + "');\n";
      }
    }

    static checkCollision(params) {
      if (params) {
        return "Evaluate.checkCollision(" + ((programArrayToString(params.instanceId) ?? "[]") + "," + (params.distance ?? 0.0)) + ");\n";
      }
    }

    static getMeasureInfo(params) {
      if (params) {
        return "Evaluate.getMeasureInfo(" + ((programArrayToString(params.geomId) ?? "[]") + "," + (programArrayToString(params.instanceId) ?? "[]")) + ");\n";
      }
    }

    static getBoundingBox(params) {
      if (params) {
        return "Evaluate.getBoundingBox({\n" +
          "  boundType: " + (params.boundType ?? 0) + ",\n" +
          "  entityIds: " + (programArrayToString(params.entityIds) ?? "[]") + ",\n" +
          "  instanceIds: " + (programArrayToString(params.instanceIds) ?? "[]") + ",\n" +
          "  defPlaneId: " + (params.defPlaneId ?? 0) + ",\n" +
          "  defPlaneInstanceId: '" + (params.defPlaneInstanceId ?? "") + "',\n" +
          "  includeHide: " + (params.includeHide ?? 0) + ",\n" +
          "  includeSurface: " + (params.includeSurface ?? 0) + ",\n" +
          "  includeComp: " + (params.includeComp ?? 0) + ",\n" +
          "});";
      }
    }
  }

  class PluginEvaluateCommand {
    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    async getEntityVolumeIncrement(params) {
      let script = EvaluateScript.getEntityVolume(params);
      return this.#executeIncrementScript(script);
    }

    async getEntityAreaIncrement(params) {
      let script = EvaluateScript.getEntityArea(params);
      return this.#executeIncrementScript(script);
    }

    async getEntityCentroidIncrement(params) {
      let script = EvaluateScript.getEntityCentroid(params);
      return this.#executeIncrementScript(script);
    }

    async getEntityMassPropertiesIncrement(params) {
      let script = EvaluateScript.getEntityMassProperties(params);
      return this.#executeIncrementScript(script);
    }

    async getInstanceMassPropertiesIncrement(params) {
      let script = EvaluateScript.getInstanceMassProperties(params);
      return this.#executeIncrementScript(script);
    }

    async checkCollisionIncrement(params) {
      let script = EvaluateScript.checkCollision(params);
      return this.#executeIncrementScript(script);
    }

    async getMeasureInfoIncrement(params) {
      let script = EvaluateScript.getMeasureInfo(params);
      return this.#executeIncrementScript(script);
    }

    async getBoundingBoxIncrement(params) {
      let script = EvaluateScript.getBoundingBox(params);
      return this.#executeIncrementScript(script);
    }

  }

  class SurfaceScript {
    static extrudeSurface(params, featureName = "") {
      if (params) {
        return "Surface.extrudeSurface('" + featureName + "',{\n" +
          "  curveIds:" + (programArrayToString(params.curveIds) ?? "[]") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  directionType:" + (params.directionType ?? 0) + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  extrudeType1:" + (params.extrudeType1 ?? 0) + ",\n" +
          "  height1:" + (params.height1 ?? 10) + ",\n" +
          "  toSurface1:" + (params.toSurface1 ?? 0) + ",\n" +
          "  draftType1:" + (params.draftType1 ?? -1) + ",\n" +
          "  angle1:" + (params.angle1 ?? 0.0) + ",\n" +
          "  extrudeType2:" + (params.extrudeType2 ?? -1) + ",\n" +
          "  height2:" + (params.height2 ?? 0) + ",\n" +
          "  toSurface2:" + (params.toSurface2 ?? 0) + ",\n" +
          "  draftType2:" + (params.draftType2 ?? -1) + ",\n" +
          "  angle2:" + (params.angle2 ?? 0.0) + ",\n" +
          "  offsetType:" + (params.offsetType ?? -1) + ",\n" +
          "  distance:" + (params.distance ?? 0) + ",\n" +
          "  reverseOffset:" + (params.reverseOffset ?? 0) + ",\n" +
          "});\n"
      }
    }

    static revolveSurface(params, featureName = "") {
      if (params) {
        return "Surface.revolveSurface('" + featureName + "',{\n" +
          "  contours:" + (programArrayToString(params.contours) ?? "[]") + ",\n" +
          "  axis:" + (params.axis?.toScript() ?? "new Axis()") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  revolveType1:" + (params.revolveType1 ?? 0) + ",\n" +
          "  angle1:" + (params.angle1 ?? 120) + ",\n" +
          "  ToSurface1:" + (params.ToSurface1 ?? 0) + ",\n" +
          "  revolveType2:" + (params.revolveType2 ?? -1) + ",\n" +
          "  angle2:" + (params.angle2 ?? 120) + ",\n" +
          "  ToSurface2:" + (params.ToSurface2 ?? 0) + ",\n" +
          "});\n"
      }
    }

    static offsetSurface(params, featureName = "") {
      if (params) {
        return "Surface.offsetSurface('" + featureName + "',{\n" +
          "  surfaceIds:" + (programArrayToString(params.surfaceIds) ?? "[]") + ",\n" +
          "  distance:" + (params.distance ?? 10) + ",\n" +
          "  modeType:" + (params.modeType ?? 0) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "});\n"
      }
    }

    static sweepSurface(params, featureName = "") {
      if (params) {
        return "Surface.sweepSurface('" + featureName + "',{\n" +
          "  sweepType:" + (params.sweepType ?? 0) + ",\n" +
          "  sweepProfile:" + (params.sweepProfile ?? 0) + ",\n" +
          "  sweepPath:" + (programArrayToString(params.sweepPath) ?? "[]") + ",\n" +
          "  profileDirection:" + (params.profileDirection ?? 2) + ",\n" +
          "  sweepDirection:" + (params.sweepDirection ?? 0) + ",\n" +
          "  diameter:" + (params.diameter ?? 0) + ",\n" +
          "});\n"
      }
    }

    static deleteSurface(params, featureName = "") {
      if (params) {
        return "Surface.deleteSurface('" + featureName + "', "
          + (programArrayToString(params.surfaceIds) ?? "[]") + ");\n"
      }
    }

    static planeSurface(params, featureName = "") {
      if (params) {
        return "Surface.planeSurface('" + featureName + "', "
          + (programArrayToString(params.boundingEntities) ?? "[]") + ");\n"
      }
    }

    static trimSurface(params, featureName = "") {
      if (params) {
        return "Surface.trimSurface('" + featureName + "',{\n" +
          "  limitIds:" + (programArrayToString(params.limitIds) ?? "[]") + ",\n" +
          "  surfaceIds:" + (programArrayToString(params.surfaceIds) ?? "[]") + ",\n" +
          "  keepMode:" + (params.keepMode ?? 0) + ",\n" +
          "  keepTags:" + (programArrayToString(params.keepTags) ?? "[]") + ",\n" +
          "  oldSurfaceIds:" + (programArrayToString(params.oldSurfaceIds) ?? "[]") + ",\n" +
          "  newSurfaceIds:" + (programArrayToString(params.newSurfaceIds) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static extendSurface(params, featureName = "") {
      if (params) {
        return "Surface.extendSurface('" + featureName + "',{\n" +
          "  extendType:" + (params.extendType ?? 0) + ",\n" +
          "  extendSrfIds:" + (programArrayToString(params.extendSrfIds) ?? "[]") + ",\n" +
          "  U0:" + (params.U0 ?? 0) + ",\n" +
          "  U1:" + (params.U1 ?? 1) + ",\n" +
          "  V0:" + (params.V0 ?? 0) + ",\n" +
          "  V1:" + (params.V1 ?? 1) + ",\n" +
          "  extendBoundIds:" + (programArrayToString(params.extendBoundIds) ?? "[]") + ",\n" +
          "  length:" + (params.length ?? 10) + ",\n" +
          "});\n"
      }
    }

    static fillSurface(params, featureName = "") {
      if (params) {
        return "Surface.fillSurface('" + featureName + "',{\n" +
          "  boundaryCurveIds:" + (programArrayToString(params.boundaryCurveIds) ?? "[]") + ",\n" +
          "  alternateFace:" + (params.alternateFace ?? 0) + ",\n" +
          "  reverseSurface:" + (params.reverseSurface ?? 0) + ",\n" +
          "});\n"
      }
    }

    static boundarySurface(params, featureName = "") {
      if (params) {
        return "Surface.boundarySurface('" + featureName + "',{\n" +
          "  selectMode:" + (params.selectMode ?? 0) + ",\n" +
          "  primaryCurveIds:" + (programArrayToString(params.primaryCurveIds) ?? "[]") + ",\n" +
          "  secondaryCurveIds:" + (programArrayToString(params.secondaryCurveIds) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static loftSurface(params, featureName = "") {
      if (params) {
        return "Surface.loftSurface('" + featureName + "',{\n" +
          "  profiles:" + (programArrayToString(params.profiles) ?? "[]") + ",\n" +
          "  hasGuideCurve:" + (params.hasGuideCurve ?? 0) + ",\n" +
          "  guideCurves:" + (programArrayToString(params.guideCurves) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static knitSurface(params, featureName = "") {
      if (params) {
        return "Surface.knitSurface('" + featureName + "',{\n" +
          "  surfaces:" + (programArrayToString(params.surfaces) ?? "[]") + ",\n" +
          "  controlGap:" + (params.controlGap ?? 0) + ",\n" +
          "  tolerance:" + (params.tolerance ?? 0.001) + ",\n" +
          "});\n"
      }
    }

    static ruledSurface(params, featureName = "") {
      if (params) {
        return "Surface.ruledSurface('" + featureName + "',{\n" +
          "  edgeCurveIds:" + (programArrayToString(params.edgeCurveIds) ?? "[]") + ",\n" +
          "  alternateFaces:" + (programArrayToString(params.alternateFaces) ?? "[]") + ",\n" +
          "  ruledSurfaceType:" + (params.ruledSurfaceType ?? 0) + ",\n" +
          "  distance:" + (params.distance ?? 50) + ",\n" +
          "  trimAndKnit:" + (params.trimAndKnit ?? 1) + ",\n" +
          "  connectingSurface:" + (params.connectingSurface ?? 1) + ",\n" +
          "  direction:" + (params.direction?.toScript() ?? "new Direction()") + ",\n" +
          "  angle:" + (params.angle ?? 1) + ",\n" +
          "  coordinateInput:" + (params.coordinateInput?.toScript() ?? "new Point()") + ",\n" +
          "  scanType:" + (params.scanType ?? 0) + ",\n" +
          "});\n"
      }
    }

    static radiateSurface(params, featureName = "") {
      if (params) {
        return "Surface.radiateSurface('" + featureName + "',{\n" +
          "  directionFaceId:" + (params.directionFaceId ?? 0) + ",\n" +
          "  radiateLines:" + (programArrayToString(params.radiateLines) ?? "[]") + ",\n" +
          "  length:" + (params.length ?? 10) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  extend:" + (params.extend ?? 0) + ",\n" +
          "});\n"
      }
    }
  }

  class PluginSurfaceCommand {
    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    extrudeSurface(params, featureName = "") {
      let script = SurfaceScript.extrudeSurface(params, featureName);
      this.#generateScript(script);
    }

    async extrudeSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.extrudeSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    revolveSurface(params, featureName = "") {
      let script = SurfaceScript.revolveSurface(params, featureName);
      this.#generateScript(script);
    }

    async revolveSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.revolveSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    offsetSurface(params, featureName = "") {
      let script = SurfaceScript.offsetSurface(params, featureName);
      this.#generateScript(script);
    }

    async offsetSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.offsetSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    sweepSurface(params, featureName = "") {
      let script = SurfaceScript.sweepSurface(params, featureName);
      this.#generateScript(script);
    }

    async sweepSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.sweepSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    deleteSurface(params, featureName = "") {
      let script = SurfaceScript.deleteSurface(params, featureName);
      this.#generateScript(script);
    }

    async deleteSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.deleteSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    planeSurface(params, featureName = "") {
      let script = SurfaceScript.planeSurface(params, featureName);
      this.#generateScript(script);
    }

    async planeSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.planeSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    trimSurface(params, featureName = "") {
      let script = SurfaceScript.trimSurface(params, featureName);
      this.#generateScript(script);
    }

    async trimSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.trimSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    extendSurface(params, featureName = "") {
      let script = SurfaceScript.extendSurface(params, featureName);
      this.#generateScript(script);
    }

    async extendSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.extendSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    fillSurface(params, featureName = "") {
      let script = SurfaceScript.fillSurface(params, featureName);
      this.#generateScript(script);
    }

    async fillSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.fillSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    boundarySurface(params, featureName = "") {
      let script = SurfaceScript.boundarySurface(params, featureName);
      this.#generateScript(script);
    }

    async boundarySurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.boundarySurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    loftSurface(params, featureName = "") {
      let script = SurfaceScript.loftSurface(params, featureName);
      this.#generateScript(script);
    }

    async loftSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.loftSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    knitSurface(params, featureName = "") {
      let script = SurfaceScript.knitSurface(params, featureName);
      this.#generateScript(script);
    }

    async knitSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.knitSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    ruledSurface(params, featureName = "") {
      let script = SurfaceScript.ruledSurface(params, featureName);
      this.#generateScript(script);
    }

    async ruledSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.ruledSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

    radiateSurface(params, featureName = "") {
      let script = SurfaceScript.radiateSurface(params, featureName);
      this.#generateScript(script);
    }

    async radiateSurfaceIncrement(params, featureName = "") {
      let script = SurfaceScript.radiateSurface(params, featureName);
      return this.#executeIncrementScript(script);
    }

  }

  class AssemblyScript {
    static insertComponent(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }
        return tempScript + "Assembly.insertComponent('" + featureName + "',{\n" +
          "  docName:'" + (params.docName ?? "'Part 1'") + "',\n" +
          (matValid ? ("  matrix4:" + (matValid ? "mat" : "new Matrix4()") + ",\n") : ("  position:" + (params.position?.toScript() ?? "new Point()") + ",\n")) +
          "  boxCenter:" + (params.boxCenter ?? 0) + ",\n" +
          "  projectId:" + (params.projectId ?? "''") + ",\n" +
          "});\n";
      }
    }

    static insertParametricPart(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "Assembly.insertParametricPart('" + featureName + "',{\n" +
          "  templateName:'" + (params.templateName ?? "'template 1'") + "',\n" +
          "  parameters:" + (mapToScript(params.parameters) ?? '{}') + ",\n" +
          (matValid ? ("  matrix4:" + (matValid ? "mat" : "new Matrix4()") + ",\n" + "  position:" + (params.position?.toScript() ?? "new Point()") + ",\n") : ("  position:" + (params.position?.toScript() ?? "new Point()") + ",\n")) +
          "  boxCenter:" + (params.boxCenter ?? 0) + ",\n" +
          "});\n";
      }
    }

    /**
     * 创建插入标准件二次开发脚本
     * @param params
     * @param featureName
     * @returns {string}
     */
    static insertStandardComponent(params, featureName = "") {
      if (!params) {
        return '';
      }
      return "Assembly.insertStandardComponent('" + featureName + "',{\n"
        + "  position: " + (params.position?.toScript() ?? "new Point()") + ",\n"
        + "  boxCenter: " + (params.boxCenter ?? 1) + ",\n"
        + "  standardName: '" + (params.standardName ?? 'standardName 1') + "',\n"
        + "  categoryName: '" + (params.categoryName ?? 'categoryName 1') + "',\n"
        + "  className: '" + (params.className ?? 'className 1') + "',\n"
        + "  componentName: '" + (params.componentName ?? 'componentName 1') + "',\n"
        + "  optionParams: " + (mapToScript(params.optionParams) ?? '{}') + "\n"
        + "});";
    }

    static insertComponentFromExecProgram(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "Assembly.insertComponentFromExecProgram('" + featureName + "',{\n" +
          "  programName:'" + (params.programName ?? "'program name'") + "',\n" +
          "  arguments:" + (mapToScript(params.arguments) ?? '{}') + ",\n" +
          (matValid ? ("  matrix4:" + (matValid ? "mat" : "new Matrix4()") + ",\n" + "  position:" + (params.position?.toScript() ?? "new Point()") + ",\n") : ("  position:" + (params.position?.toScript() ?? "new Point()") + ",\n")) +
          "  boxCenter:" + (params.boxCenter ?? 0) + ",\n" +
          "});\n"
      }
    }

    static replaceComponent(params) {
      if (params) {
        return "Assembly.replaceComponent('"
          + (params.instanceId ?? "") + "','"
          + (params.docName ?? "Part 1") + "',"
          + (params.projectId ?? "''") +
          ");\n"
      }
    }

    static replaceComponentFromExecProgram(params) {
      if (params) {
        return "Assembly.replaceComponentFromExecProgram('"
          + (params.instanceId ?? "") + "','"
          + (params.programName ?? "programName") + "',"
          + (mapToScript(params.arguments) ?? '{}') +
          ");\n"
      }
    }

    static createMating(params, featureName = "") {
      if (params) {
        return "Assembly.createMating('" + featureName + "',{\n" +
          "  moveInstanceId:'" + (params.moveInstanceId ?? "0") + "',\n" +
          "  moveElementId:" + (params.moveElementId ?? 0) + ",\n" +
          "  refInstanceId:'" + (params.refInstanceId ?? "0") + "',\n" +
          "  refElementId:" + (params.refElementId ?? 0) + ",\n" +
          "  matingType:" + (params.matingType ?? 0) + ",\n" +
          "  alignType:" + (params.alignType ?? 0) + ",\n" +
          "  offsetValue:" + (params.offsetValue ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createGearMating (params, featureName = "") {
      if (params) {
        return "Assembly.createGearMating('" + featureName + "',{\n" +
          "  moveInstanceId:'" + (params.moveInstanceId ?? "0") + "',\n" +
          "  moveElementId:" + (params.moveElementId ?? 0) + ",\n" +
          "  refInstanceId:'" + (params.refInstanceId ?? "0") + "',\n" +
          "  refElementId:" + (params.refElementId ?? 0) + ",\n" +
          "  gearValue1:" + (params.gearValue1 ?? 0) + ",\n" +
          "  gearValue2:" + (params.gearValue2 ?? 0) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "});\n"
      }
    }

    static createSlotMating  (params, featureName = "") {
      if (params) {
        return "Assembly.createSlotMating ('" + featureName + "',{\n" +
          "  moveInstanceId:'" + (params.moveInstanceId ?? "0") + "',\n" +
          "  moveElementId:" + (params.moveElementId ?? 0) + ",\n" +
          "  refInstanceId:'" + (params.refInstanceId ?? "0") + "',\n" +
          "  refElementId:" + (params.refElementId ?? 0) + ",\n" +
          "  constraintType:" + (params.constraintType ?? 0) + ",\n" +
          "  offsetValue:" + (params.offsetValue ?? 0) + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  alignType:" + (params.alignType ?? 0) + ",\n" +
          "});\n"
      }
    }

    static linearPattern(params, featureName = "") {
      if (params) {
        let tempScript = "  component:'" + (params.component ?? "") + "',\n";
        if (params.component instanceof Array) {
          tempScript = "  component:" + (programArrayToString(params.component) ?? "[]") + ",\n";
        }
        return "Assembly.linearPattern('" + featureName + "',{\n" +
          tempScript +
          "  direction1:" + (params.direction1?.toScript() ?? "new Direction()") + ",\n" +
          "  reverse1:" + (params.reverse1 ?? 0) + ",\n" +
          "  spacing1:" + (params.spacing1 ?? 10.0) + ",\n" +
          "  instanceNum1:" + (params.instanceNum1 ?? 2) + ",\n" +
          "  hasDirection2:" + (params.hasDirection2 ?? 0) + ",\n" +
          "  direction2:" + (params.direction2?.toScript() ?? "new Direction()") + ",\n" +
          "  reverse2:" + (params.reverse2 ?? 0) + ",\n" +
          "  spacing2:" + (params.spacing2 ?? 10) + ",\n" +
          "  instanceNum2:" + (params.instanceNum2 ?? 0) + ",\n" +
          "  patternSeed:" + (params.patternSeed ?? 0) + ",\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instancesToSkip:" + (programArrayToString(params.instancesToSkip) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static circularPattern(params, featureName = "") {
      if (params) {
        let tempScript = "  component:'" + (params.component ?? "") + "',\n";
        if (params.component instanceof Array) {
          tempScript = "  component:" + (programArrayToString(params.component) ?? "[]") + ",\n";
        }
        return "Assembly.circularPattern('" + featureName + "',{\n" +
          tempScript +
          "  axis:" + (params.axis?.toScript() ?? "new Axis()") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  angle1:" + (params.angle1 ?? 0) + ",\n" +
          "  instanceNum1:" + (params.instanceNum1 ?? 2) + ",\n" +
          "  equalSpacing1:" + (params.equalSpacing1 ?? 1) + ",\n" +
          "  symmetric:" + (params.symmetric ?? 0) + ",\n" +
          "  hasDirection2:" + (params.hasDirection2 ?? 0) + ",\n" +
          "  angle2:" + (params.angle2 ?? 120) + ",\n" +
          "  instanceNum2:" + (params.instanceNum2 ?? 0) + ",\n" +
          "  equalSpacing2:" + (params.equalSpacing2 ?? 0) + ",\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instancesToSkip:" + (programArrayToString(params.instancesToSkip) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static curvePattern(params, featureName = "") {
      if (params) {
        let tempScript = "  component:'" + (params.component ?? "") + "',\n";
        if (params.component instanceof Array) {
          tempScript = "  component:" + (programArrayToString(params.component) ?? "[]") + ",\n";
        }
        return "Assembly.curvePattern('" + featureName + "',{\n" +
          tempScript +
          "  curves:" + (programArrayToString(params.curves) ?? "[]") + ",\n" +
          "  curveInstances:" + (programArrayToString(params.curveInstances) ?? "[]") + ",\n" +
          "  reverse:" + (params.reverse ?? 0) + ",\n" +
          "  spacing:" + (params.spacing ?? 0) + ",\n" +
          "  instanceNum:" + (params.instanceNum ?? 2) + ",\n" +
          "  equalSpacing:" + (params.equalSpacing ?? 1) + ",\n" +
          "  curveMethod:" + (params.curveMethod ?? 0) + ",\n" +
          "  alignmentMethod:" + (params.alignmentMethod ?? 0) + ",\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instancesToSkip:" + (programArrayToString(params.instancesToSkip) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static sketchPattern(params, featureName = "") {
      if (params) {
        let tempScript = "  component:'" + (params.component ?? "") + "',\n";
        if (params.component instanceof Array) {
          tempScript = "  component:" + (programArrayToString(params.component) ?? "[]") + ",\n";
        }
        return "Assembly.sketchPattern('" + featureName + "',{\n" +
          tempScript +
          "  sketchId:" + (params.sketchId ?? 0) + ",\n" +
          "  referenceType:" + (params.referenceType ?? 0) + ",\n" +
          "  referencePoint:" + (params.referencePoint?.toScript() ?? "new Point()") + ",\n" +
          "});\n"
      }
    }

    static fixInstance(params) {
      if (params) {
        return "Assembly.fixInstance('"
          + (params.instanceId ?? "0") + "'," +
          + (params.status ?? 0) +
          ");\n"
      }
    }

    static moveInstance(params) {
      if (params) {
        return "Assembly.moveInstance({\n" +
          "  instanceId:" + (programArrayToString(params.instanceId) ?? "[]") + ",\n" +
          "  startPos:" + (params.startPos?.toScript() ?? "new Point()") + ",\n" +
          "  endPos:" + (params.endPos?.toScript() ?? "new Point()") + ",\n" +
          "  moveType:" + (params.moveType ?? 0) + ",\n" +
          "  checkType:" + (params.checkType ?? 0) + ",\n" +
          "  moveDir:" + (params.moveDir?.toScript() ?? "new Direction()") + ",\n" +
          "  varX:" + (params.varX ?? 0) + ",\n" +
          "  varY:" + (params.varY ?? 0) + ",\n" +
          "  varZ:" + (params.varZ ?? 0) + ",\n" +
          "  checkRange:" + (programArrayToString(params.checkRange) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static rotateInstance(params) {
      if (params) {
        return "Assembly.rotateInstance({\n" +
          "  instanceId:" + (programArrayToString(params.instanceId) ?? "[]") + ",\n" +
          "  rotateType:" + (params.rotateType ?? 0) + ",\n" +
          "  checkType:" + (params.checkType ?? 0) + ",\n" +
          "  axialDir:" + (params.axialDir?.toScript() ?? "new Point()") + ",\n" +
          "  rotateAxis:" + (params.rotateAxis?.toScript() ?? "new Axis()") + ",\n" +
          "  angleVal:" + (params.angleVal ?? 0) + ",\n" +
          "  angleValX:" + (params.angleValX ?? 0) + ",\n" +
          "  angleValY:" + (params.angleValY ?? 0) + ",\n" +
          "  angleValZ:" + (params.angleValZ ?? 0) + ",\n" +
          "  checkRange:" + (programArrayToString(params.checkRange) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static mirrorInstances(params, featureName = "") {
      if (params) {
        return "Assembly.mirrorInstances('" + featureName + "',{\n" +
          "  instanceId:" + (programArrayToString(params.instanceId) ?? "[]") + ",\n" +
          "  mirrorPlaneId:" + (params.mirrorPlaneId ?? 8) + ",\n" +
          "  mirrorPlaneInstanceId:'" + (params.mirrorPlaneInstanceId ?? "") + "',\n" +
          "});\n"
      }
    }

    static patternDrivePattern(params, featureName = "") {
      if (params) {
        return "Assembly.patternDrivePattern('" + featureName + "',{\n" +
          "  instanceId:" + (programArrayToString(params.instanceId) ?? "[]") + ",\n" +
          "  driveFeatureId:" + (params.driveFeatureId ?? 0) + ",\n" +
          "  driveInstance:'" + (params.driveInstance ?? "") + "',\n" +
          "  skipInstance:" + (params.skipInstance ?? 0) + ",\n" +
          "  instanceToSkip:" + (programArrayToString(params.instanceToSkip) ?? "[]") + ",\n" +
          "  modOriPosition:" + (params.modOriPosition ?? 0) + ",\n" +
          "  orgPositionInsId:'" + (params.orgPositionInsId ?? "") + "',\n" +
          "});\n"
      }
    }
  }

  class PluginAssemblyCommand {
    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    insertComponent(params, featureName = "") {
      let script = AssemblyScript.insertComponent(params, featureName);
      this.#generateScript(script);
    }

    async insertComponentIncrement(params, featureName = "") {
      let script = AssemblyScript.insertComponent(params, featureName);
      return this.#executeIncrementScript(script);
    }

    insertParametricPart(params, featureName = "") {
      let script = AssemblyScript.insertParametricPart(params, featureName);
      this.#generateScript(script);
    }

    async insertParametricPartIncrement(params, featureName = "") {
      let script = AssemblyScript.insertParametricPart(params, featureName);
      return this.#executeIncrementScript(script);
    }

    /**
     * 插入标准件（增量型）
     * @param params 参数对象
     * @param featureName 特征名
     * @returns {Promise<void>}
     */
    async insertStandardComponentIncrement(params, featureName = ""){
      let script = AssemblyScript.insertStandardComponent(params, featureName);
      return this.#executeIncrementScript(script);
    }
    
    insertComponentFromExecProgram(params, featureName = "") {
      let script = AssemblyScript.insertComponentFromExecProgram(params, featureName);
      this.#generateScript(script);
    }

    async insertComponentFromExecProgramIncrement(params, featureName = "") {
      let script = AssemblyScript.insertComponentFromExecProgram(params, featureName);
      return this.#executeIncrementScript(script);
    }

    replaceComponent(params) {
      let script = AssemblyScript.replaceComponent(params);
      this.#generateScript(script);
    }

    async replaceComponentIncrement(params) {
      let script = AssemblyScript.replaceComponent(params);
      return this.#executeIncrementScript(script);
    }

    replaceComponentFromExecProgram(params) {
      let script = AssemblyScript.replaceComponentFromExecProgram(params);
      this.#generateScript(script);
    }

    async replaceComponentFromExecProgramIncrement(params) {
      let script = AssemblyScript.replaceComponentFromExecProgram(params);
      return this.#executeIncrementScript(script);
    }

    createMating(params, featureName = "") {
      let script = AssemblyScript.createMating(params, featureName);
      this.#generateScript(script);
    }

    async createMatingIncrement(params, featureName = "") {
      let script = AssemblyScript.createMating(params, featureName);
      return this.#executeIncrementScript(script);
    }

    linearPattern(params, featureName = "") {
      let script = AssemblyScript.linearPattern(params, featureName);
      this.#generateScript(script);
    }

    async linearPatternIncrement(params, featureName = "") {
      let script = AssemblyScript.linearPattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    circularPattern(params, featureName = "") {
      let script = AssemblyScript.circularPattern(params, featureName);
      this.#generateScript(script);
    }

    async circularPatternIncrement(params, featureName = "") {
      let script = AssemblyScript.circularPattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    curvePattern(params, featureName = "") {
      let script = AssemblyScript.curvePattern(params, featureName);
      this.#generateScript(script);
    }

    async curvePatternIncrement(params, featureName = "") {
      let script = AssemblyScript.curvePattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    sketchPattern(params, featureName = "") {
      let script = AssemblyScript.sketchPattern(params, featureName);
      this.#generateScript(script);
    }

    async sketchPatternIncrement(params, featureName = "") {
      let script = AssemblyScript.sketchPattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

    fixInstance(params) {
      let script = AssemblyScript.fixInstance(params);
      this.#generateScript(script);
    }

    async fixInstanceIncrement(params) {
      let script = AssemblyScript.fixInstance(params);
      return this.#executeIncrementScript(script);
    }

    moveInstance(params) {
      let script = AssemblyScript.moveInstance(params);
      this.#generateScript(script);
    }

    async moveInstanceIncrement(params) {
      let script = AssemblyScript.moveInstance(params);
      return this.#executeIncrementScript(script);
    }

    rotateInstance(params) {
      let script = AssemblyScript.rotateInstance(params);
      this.#generateScript(script);
    }

    async rotateInstanceIncrement(params) {
      let script = AssemblyScript.rotateInstance(params);
      return this.#executeIncrementScript(script);
    }

    mirrorInstances(params, featureName = "") {
      let script = AssemblyScript.mirrorInstances(params, featureName);
      this.#generateScript(script);
    }

    async mirrorInstancesIncrement(params, featureName = "") {
      let script = AssemblyScript.mirrorInstances(params, featureName);
      return this.#executeIncrementScript(script);
    }

    patternDrivePattern(params, featureName = "") {
      let script = AssemblyScript.patternDrivePattern(params, featureName);
      this.#generateScript(script);
    }

    async patternDrivePatternIncrement(params, featureName = "") {
      let script = AssemblyScript.patternDrivePattern(params, featureName);
      return this.#executeIncrementScript(script);
    }

  }

  const ScriptFontNameType = {
    Default: "FontName.Default",
    KaiTi: "FontName.KaiTi",
    SimHei: "FontName.SimHei",
    SimSun: "FontName.SimSun",
    FangSong: "FontName.FangSong",
    MicrosoftYaHei: "FontName.MicrosoftYaHei",
  };

  const ScriptElementType = {
    Vertex: "ElementType.Vertex",
    Edge: "ElementType.Edge",
    Face: "ElementType.Face",
    Point: "ElementType.Point",
    Curve: "ElementType.Curve",
    Surface: "ElementType.SURFACE",
    Dimension: "ElementType.Dimension",
  };

  const ScriptVariableType = {
    Angle: "VariableType.Angle",
    Length: "VariableType.Length",
    Number: "VariableType.Number",
  };

  const ScriptVariableUnit = {
    cm: "VariableUnit.cm",
    mm: "VariableUnit.mm",
    m: "VariableUnit.m",
    Degree: "VariableUnit.degree",
    Radian: "VariableUnit.radian",
    Number: "VariableUnit.number",
  };

  class CommonScript {
    static setEntityColor(params) {
      if (params) {
        return "Common.setEntityColor(" + (params.entityId ?? 0) + ",{color:'" + (params.color ?? '') + "',opacity:'" + (params.opacity ?? "1") + "',});\n";
      }
    }

    static setEntityVisible(params) {
      if (params) {
        return "Common.setEntitiesVisible(" + (programArrayToString(params.entityIds) ?? "[]") + "," + (params.status ?? 0) + ");\n";
      }
    }

    static setEntityName(params) {
      if (params) {
        return "Common.setEntityName(" + (params.entityId ?? 0) + ",'" + (params.entityName ?? "") + "');\n";
      }
    }

    static createVariable(params) {
      if (params) {
        return "Common.createVariable('" + params.variableName + "',{" +
          "  variableValue: " + (params.variableValue) + "," +
          "  variableType: " + (params.variableType ?? ScriptVariableType.Length) + "," +
          "  variableUnit: " + (params.variableUnit ?? ScriptVariableUnit.mm) + "," +
          "  description: '" + (params.description ?? "") + "'," +
          "});\n";
      }
    }

    static assignVariable(params) {
      if (params) {
        return "Common.assignVariable('" + params.variableName + "',{" +
          "  variableValue: " + (params.variableValue) + "," +
          "  variableType: " + (params.variableType ?? ScriptVariableType.Length) + "," +
          "  variableUnit: " + (params.variableUnit ?? ScriptVariableUnit.mm) + "," +
          "  description: '" + (params.description ?? "") + "'," +
          "});\n";
      }
    }

    static deleteVariable(params) {
      if (params) {
        return "Common.deleteVariable('" + params.variableName + "');\n";
      }
    }

    static setDocAppearance(params) {
      if (params) {
        return "Common.setDocAppearance({\n" +
          "  color: '" + (params.color ?? "#BBBBBB") + "',\n" +
          "  opacity: " + (params.opacity ?? 1) + ",\n" +
          "});\n";
      }
    }

    static clearDocAppearance() {
      return "Common.clearDocAppearance();\n";
    }

    static setAppearance(params) {
      if (params) {
        return "Common.setAppearance({\n" +
          "  ids: " + (programArrayToString(params.ids) ?? "[]") + ",\n" +
          "  instanceIds: " + (programArrayToString(params.instanceIds) ?? "[]") + ",\n" +
          "  color: '" + (params.color ?? "#BBBBBB") + "',\n" +
          "  opacity: " + (params.opacity ?? 1) + ",\n" +
          "});";
      }
    }

    static clearAppearance(params) {
      if (params) {
        return "Common.clearAppearance({\n" +
          "  ids: " + (programArrayToString(params.ids) ?? "[]") + ",\n" +
          "  instanceIds: " + (programArrayToString(params.instanceIds) ?? "[]") + ",\n" +
          "});\n";
      }
    }

    static deleteEntity(params) {
      if (params) {
        return "Common.deleteEntity({\n" +
          "  ids: " + (programArrayToString(params.ids) ?? "[]") + ",\n" +
          "});\n"
      }
    }

    static deleteFeature(params) {
      if (params) {
        return "Common.deleteFeature({\n" +
          "  featureIds: " + (programArrayToString(params.featureIds) ?? "[]") + ",\n" +
          "});\n"
      }
    }
  }

  class PluginCommonCommand {
    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    setEntityColor(params) {
      let script = CommonScript.setEntityColor(params);
      this.#generateScript(script);
    }

    async setEntityColorIncrement(params) {
      let script = CommonScript.setEntityColor(params);
      return this.#executeIncrementScript(script);
    }

    setEntityVisible(params) {
      let script = CommonScript.setEntityVisible(params);
      this.#generateScript(script);
    }

    async setEntityVisibleIncrement(params) {
      let script = CommonScript.setEntityVisible(params);
      return this.#executeIncrementScript(script);
    }

    setEntityName(params) {
      let script = CommonScript.setEntityName(params);
      this.#generateScript(script);
    }

    async setEntityNameIncrement(params) {
      let script = CommonScript.setEntityName(params);
      return this.#executeIncrementScript(script);
    }

    createVariable(params) {
      let script = CommonScript.createVariable(params);
      this.#generateScript(script);
    }

    async createVariableIncrement(params) {
      let script = CommonScript.createVariable(params);
      return this.#executeIncrementScript(script);
    }

    assignVariable(params) {
      let script = CommonScript.assignVariable(params);
      this.#generateScript(script);
    }

    async assignVariableIncrement(params) {
      let script = CommonScript.assignVariable(params);
      return this.#executeIncrementScript(script);
    }

    deleteVariable(params) {
      let script = CommonScript.deleteVariable(params);
      this.#generateScript(script);
    }

    async deleteVariableIncrement(params) {
      let script = CommonScript.deleteVariable(params);
      return this.#executeIncrementScript(script);
    }

    setDocAppearance(params) {
      let script = CommonScript.setDocAppearance(params);
      this.#generateScript(script);
    }

    async setDocAppearanceIncrement(params) {
      let script = CommonScript.setDocAppearance(params);
      return this.#executeIncrementScript(script);
    }

    clearDocAppearance() {
      let script = CommonScript.clearDocAppearance();
      this.#generateScript(script);
    }

    async clearDocAppearanceIncrement() {
      let script = CommonScript.clearDocAppearance();
      return this.#executeIncrementScript(script);
    }

    setAppearance(params) {
      let script = CommonScript.setAppearance(params);
      this.#generateScript(script);
    }

    async setAppearanceIncrement(params) {
      let script = CommonScript.setAppearance(params);
      return this.#executeIncrementScript(script);
    }

    clearAppearance(params) {
      let script = CommonScript.clearAppearance(params);
      this.#generateScript(script);
    }

    async clearAppearanceIncrement(params) {
      let script = CommonScript.clearAppearance(params);
      return this.#executeIncrementScript(script);
    }

    async deleteEntityIncrement(params) {
      let script = CommonScript.deleteEntity(params);
      return this.#executeIncrementScript(script);
    }

    async deleteFeatureIncrement(params) {
      let script = CommonScript.deleteFeature(params);
      return this.#executeIncrementScript(script);
    }
  }

  class MBDScript {

    static createLabel(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "MBD.createLabel('" + featureName + "',{\n" +
          "  elementId: " + (params.elementId ?? 0) + ",\n" +
          "  startPoint: " + (params.startPoint?.toScript() ?? "new Point()") + ",\n" +
          "  leaderPoint: " + (programArrayToString(params.leaderPoint) ?? "[]") + ",\n" +
          "  text: '" + (params.text ?? "") + "',\n" +
          "  frameType: " + (params.frameType ?? 1) + ",\n" +
          "  fontName: " + (params.fontName ?? ScriptFontNameType.Default) + ",\n" +
          "  fontSize: " + (params.fontSize ?? 3.5) + ",\n" +
          "  leaderLineType: " + (params.leaderLineType ?? 1) + ",\n" +
          "  leaderLineWidth: " + (params.leaderLineWidth ?? 0) + ",\n" +
          "  fontItalic: " + (params.fontItalic ?? 0) + ",\n" +
          "  fontBold: " + (params.fontBold ?? 0) + ",\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "});\n";
      }
    }

    static createDatum(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "MBD.createDatum('" + featureName + "',{\n" +
          "  elementId: " + (params.elementId ?? 0) + ",\n" +
          "  startPoint: " + (params.startPoint?.toScript() ?? "new Point()") + ",\n" +
          "  leaderPoint: " + (programArrayToString(params.leaderPoint) ?? "[]") + ",\n" +
          "  datumLab: '" + (params.datumLab ?? "") + "',\n" +
          "  frameType: " + (params.frameType ?? 1) + ",\n" +
          "  fontName: " + (params.fontName ?? ScriptFontNameType.Default) + ",\n" +
          "  fontSize: " + (params.fontSize ?? 3.5) + ",\n" +
          "  leaderLineType: " + (params.leaderLineType ?? 1) + ",\n" +
          "  leaderLineWidth: " + (params.leaderLineWidth ?? 0) + ",\n" +
          "  fontItalic: " + (params.fontItalic ?? 0) + ",\n" +
          "  fontBold: " + (params.fontBold ?? 0) + ",\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "});\n";
      }
    }

    static createDatumTarget(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "MBD.createDatumTarget('" + featureName + "',{\n" +
          "  elementId: " + (params.elementId ?? 0) + ",\n" +
          "  startPoint: " + (params.startPoint?.toScript() ?? "new Point()") + ",\n" +
          "  leaderPoint: " + (programArrayToString(params.leaderPoint) ?? "[]") + ",\n" +
          "  datumReference: '" + (params.datumReference ?? "") + "',\n" +
          "  areaType: " + (params.areaType ?? 0) + ",\n" +
          "  areaTxt: '" + (params.areaTxt ?? "") + "',\n" +
          "  fontName: " + (params.fontName ?? ScriptFontNameType.Default) + ",\n" +
          "  fontSize: " + (params.fontSize ?? 3.5) + ",\n" +
          "  leaderLineType: " + (params.leaderLineType ?? 1) + ",\n" +
          "  leaderLineWidth: " + (params.leaderLineWidth ?? 0) + ",\n" +
          "  fontItalic: " + (params.fontItalic ?? 0) + ",\n" +
          "  fontBold: " + (params.fontBold ?? 0) + ",\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "});\n";
      }
    }

    static createWeldSymbol(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "MBD.createWeldSymbol('" + featureName + "',{\n" +
          "  elementId: " + (params.elementId ?? 0) + ",\n" +
          "  pickPoint: " + (params.pickPoint?.toScript() ?? "new Point()") + ",\n" +
          "  leaderPoints: " + (programArrayToString(params.leaderPoints) ?? "[]") + ",\n" +
          "  topField: " + (params.topField ?? false) + ",\n" +
          "  peripheral: " + (params.peripheral ?? false) + ",\n" +
          "  bottomField: " + (params.bottomField ?? false) + ",\n" +
          "  symmetric: " + (params.symmetric ?? false) + ",\n" +
          "  stagger: " + (params.stagger ?? false) + ",\n" +
          "  identificationLineOnTop: " + (params.identificationLineOnTop ?? false) + ",\n" +
          "  reference: " + (params.reference ?? false) + ",\n" +
          "  topSecondFillet: " + (params.topSecondFillet ?? false) + ",\n" +
          "  topSecondFilletText1: '" + (params.topSecondFilletText1 ?? "") + "',\n" +
          "  topSecondFilletText2: '" + (params.topSecondFilletText2 ?? "") + "',\n" +
          "  bottomSecondFillet: " + (params.bottomSecondFillet ?? false) + ",\n" +
          "  bottomSecondFilletText1: '" + (params.bottomSecondFilletText1 ?? "") + "',\n" +
          "  bottomSecondFilletText2: '" + (params.bottomSecondFilletText2 ?? "") + "',\n" +
          "  topWeld: " + (params.topWeld ?? 0) + ",\n" +
          "  topWeldText1: '" + (params.topWeldText1 ?? "") + "',\n" +
          "  topWeldText2: '" + (params.topWeldText2 ?? "") + "',\n" +
          "  topEdgeProfile: " + (params.topEdgeProfile ?? 0) + ",\n" +
          "  bottomWeld: " + (params.bottomWeld ?? 0) + ",\n" +
          "  bottomWeldText1: '" + (params.bottomWeldText1 ?? "") + "',\n" +
          "  bottomWeldText2: '" + (params.bottomWeldText2 ?? "") + "',\n" +
          "  bottomEdgeProfile: " + (params.bottomEdgeProfile ?? 0) + ",\n" +
          "  topInterlacedDiscontinuitiesText: '" + (params.topInterlacedDiscontinuitiesText ?? "") + "',\n" +
          "  bottomInterlacedDiscontinuitiesText: '" + (params.bottomInterlacedDiscontinuitiesText ?? "") + "',\n" +
          "  tailRemarks: '" + (params.tailRemarks ?? "") + "',\n" +
          "  fontName: " + (params.fontName ?? ScriptFontNameType.Default) + ",\n" +
          "  fontSize: " + (params.fontSize ?? 3.5) + ",\n" +
          "  leaderLineType: " + (params.leaderLineType ?? 1) + ",\n" +
          "  leaderLineWidth: " + (params.leaderLineWidth ?? 0) + ",\n" +
          "  fontItalic: " + (params.fontItalic ?? 0) + ",\n" +
          "  fontBold: " + (params.fontBold ?? 0) + ",\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "});\n";
      }
    }

    static createSizeDimension(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "MBD.createSizeDimension('" + featureName + "',{\n" +
          "  elementId: " + (params.elementId ?? 0) + ",\n" +
          "  pickPoint: " + (params.pickPoint?.toScript() ?? "new Point()") + ",\n" +
          "  dimPosition: " + (params.dimPosition?.toScript() ?? "new Point()") + ",\n" +
          "  tolPrecisionType: " + (params.tolPrecisionType ?? 0) + ",\n" +
          "  tolPrecision1: " + (params.tolPrecision1 ?? 2) + ",\n" +
          "  maxVariable: " + (params.maxVariable ?? 0) + ",\n" +
          "  minVariable: " + (params.minVariable ?? 0) + ",\n" +
          "  isReference: " + (params.isReference ?? 0) + ",\n" +
          "  referenceValue: '" + (params.referenceValue ?? 0) + "',\n" +
          "  tolPrecision2: " + (params.tolPrecision2 ?? 0) + ",\n" +
          "  fontName: " + (params.fontName ?? ScriptFontNameType.Default) + ",\n" +
          "  fontSize: " + (params.fontSize ?? 3.5) + ",\n" +
          "  leaderLineType: " + (params.leaderLineType ?? 1) + ",\n" +
          "  leaderLineWidth: " + (params.leaderLineWidth ?? 0) + ",\n" +
          "  fontItalic: " + (params.fontItalic ?? 0) + ",\n" +
          "  fontBold: " + (params.fontBold ?? 0) + ",\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "});"
      }
    }

    static createPositionDimension(params, featureName = "") {
      if (params) {
        let matValid = params.matrix4?.elements?.length === 16;
        let tempScript = "";
        if (matValid) {
          tempScript = "var mat = new Matrix4();\n" +
            "mat.set(" + params.matrix4.elements + ");\n";
        }

        return tempScript + "MBD.createPositionDimension('" + featureName + "',{\n" +
          "  firstElementId: " + (params.firstElementId ?? 0) + ",\n" +
          "  firstPickPoint: " + (params.firstPickPoint?.toScript() ?? "new Point()") + ",\n" +
          "  secondElementId: " + (params.secondElementId ?? 0) + ",\n" +
          "  secondPickPoint: " + (params.secondPickPoint?.toScript() ?? "new Point()") + ",\n" +
          "  dimPosition: " + (params.dimPosition?.toScript() ?? "new Point()") + ",\n" +
          "  tolPrecisionType: " + (params.tolPrecisionType ?? 0) + ",\n" +
          "  tolPrecision1: " + (params.tolPrecision1 ?? 2) + ",\n" +
          "  maxVariable: " + (params.maxVariable ?? 0) + ",\n" +
          "  minVariable: " + (params.minVariable ?? 0) + ",\n" +
          "  isReference: " + (params.isReference ?? 0) + ",\n" +
          "  referenceValue: '" + (params.referenceValue ?? 0) + "',\n" +
          "  tolPrecision2: " + (params.tolPrecision2 ?? 0) + ",\n" +
          "  fontName: " + (params.fontName ?? ScriptFontNameType.Default) + ",\n" +
          "  fontSize: " + (params.fontSize ?? 3.5) + ",\n" +
          "  leaderLineType: " + (params.leaderLineType ?? 1) + ",\n" +
          "  leaderLineWidth: " + (params.leaderLineWidth ?? 0) + ",\n" +
          "  fontItalic: " + (params.fontItalic ?? 0) + ",\n" +
          "  fontBold: " + (params.fontBold ?? 0) + ",\n" +
          "  matrix: " + (matValid ? "mat" : "new Matrix4()") + ",\n" +
          "});"
      }
    }


  }

  class PluginMBDCommand {
    constructor(info) {
      this.parent = info;
    }

    #generateScript(script) {
      if (script) {
        this.parent.commandScript += script;
      }
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }

    createLabel(params, featureName = "") {
      let script = MBDScript.createLabel(params, featureName);
      this.#generateScript(script);
    }

    async createLabelIncrement(params, featureName = "") {
      let script = MBDScript.createLabel(params, featureName);
      return this.#executeIncrementScript(script)
    }

    createDatum(params, featureName = "") {
      let script = MBDScript.createDatum(params, featureName);
      this.#generateScript(script);
    }

    async createDatumIncrement(params, featureName = "") {
      let script = MBDScript.createDatum(params, featureName);
      return this.#executeIncrementScript(script)
    }

    createDatumTarget(params, featureName = "") {
      let script = MBDScript.createDatumTarget(params, featureName);
      this.#generateScript(script);
    }

    async createDatumTargetIncrement(params, featureName = "") {
      let script = MBDScript.createDatumTarget(params, featureName);
      return this.#executeIncrementScript(script)
    }

    createWeldSymbol(params, featureName = "") {
      let script = MBDScript.createWeldSymbol(params, featureName);
      this.#generateScript(script);
    }

    async createWeldSymbolIncrement(params, featureName = "") {
      let script = MBDScript.createWeldSymbol(params, featureName);
      return this.#executeIncrementScript(script)
    }

    createSizeDimension(params, featureName = "") {
      let script = MBDScript.createSizeDimension(params, featureName);
      this.#generateScript(script);
    }

    async createSizeDimensionIncrement(params, featureName = "") {
      let script = MBDScript.createSizeDimension(params, featureName);
      return this.#executeIncrementScript(script);
    }

    createPositionDimension(params, featureName = "") {
      let script = MBDScript.createPositionDimension(params, featureName);
      this.#generateScript(script);
    }

    async createPositionDimensionIncrement(params, featureName = "") {
      let script = MBDScript.createPositionDimension(params, featureName);
      return this.#executeIncrementScript(script);
    }
  }

  class QueryScript {
    static getElementIdsByElementType(params) {
      if (params) {
        return "Query.getElementIdsByElementType(" +
          (params.entityId ?? 0) + "," +
          (params.elementType ?? ScriptElementType.Edge) + "," +
          "'" + (params.instanceId ?? "") + "'" +
          ");\n"
      }
    }

    static getElementIdsByVertexId(params) {
      if (params) {
        return "Query.getElementIdsByVertexId(" +
          (params.entityId ?? 0) + "," +
          (params.vertexId ?? 0) + "," +
          (params.elementType ?? ScriptElementType.Face) + "," +
          "'" + (params.instanceId ?? "") + "'" +
          ");\n"
      }
    }

    static getBoundedFaceIdsByFaceOrEdge(params) {
      if (params) {
        return "Query.getBoundedFaceIdsByFaceOrEdge(" +
          (params.elementId ?? 0) + "," +
          "'" + (params.instanceId ?? "") + "'" +
          ");\n"
      }
    }

    static getPointNormalOnFace(params) {
      if (params) {
        return "Query.getPointNormalOnFace(" +
          (params.point?.toScript() ?? "new Point()") + "," +
          (params.elementId ?? 0) + "," +
          "'" + (params.instanceId ?? "") + "'" +
          ");\n"
      }
    }
  }

  class PluginQueryCommand {
    constructor(info) {
      this.parent = info;
    }

    async #executeIncrementScript(script, commandType = PluginCommandType.GENERAL_COMMAND, params = {}) {
      return this.parent.executeIncrementCommand(script, commandType, params);
    }


    async getElementIdsByElementTypeIncrement(params) {
      let script = QueryScript.getElementIdsByElementType(params);
      return this.#executeIncrementScript(script);
    }

    async getElementIdsByVertexIdIncrement(params) {
      let script = QueryScript.getElementIdsByVertexId(params);
      return this.#executeIncrementScript(script);
    }

    async getBoundedFaceIdsByFaceOrEdgeIncrement(params) {
      let script = QueryScript.getBoundedFaceIdsByFaceOrEdge(params);
      return this.#executeIncrementScript(script);
    }

    async getPointNormalOnFaceIncrement(params) {
      let script = QueryScript.getPointNormalOnFace(params);
      return this.#executeIncrementScript(script);
    }

  }

  const DocumentType = {
    PART: 'PartDocument',
    ASSEMBLY: 'AssemblyDocument',
    DRAWING3D: 'Drawing3dDocument',
    FOLDER: 'FolderDocument',
  };

  const DefaultTemplate = {
    GB_PART: 'GB_PART',
    GB_ASSEMBLY: 'GB_ASSEMBLY',
    GB_A0: 'GB_A0',
    GB_A1: 'GB_A1',
    GB_A2: 'GB_A2',
    GB_A3: 'GB_A3',
    GB_A4: 'GB_A4',
    GB_A4_PORTRAIT: 'GB_A4_Portrait',
  };

  class PluginCommandManager {
    constructor(info) {
      this.parent = info;
      this.commandScript = "";
      this.sketch = new PluginSketchCommand(this);
      this.solid = new PluginSolidCommand(this);
      this.curve = new PluginCurveCommand(this);
      this.datum = new PluginDatumCommand(this);
      this.evaluate = new PluginEvaluateCommand(this);
      this.surface = new PluginSurfaceCommand(this);
      this.assembly = new PluginAssemblyCommand(this);
      this.common = new PluginCommonCommand(this);
      this.mbd = new PluginMBDCommand(this);
      this.query = new PluginQueryCommand(this);
    }

    clearCommand() {
      this.commandScript = "";
    }

    getCommandScript() {
      return this.commandScript;
    }

    async execute(overwrite = false, script = "") {
      return new Promise((resolve, reject) => {
        let name = PluginMessageType.EXECUTE_COMMAND;
        let key = Math.floor(Math.random() * 0x1000000);
        this.parent.messageList.push({
          key,
          name,
          resolve,
          reject
        });
        window.parent.postMessage({
          type: PluginMessageType.EXECUTE_COMMAND,
          value: {
            key: key,
            script: script === "" ? this.commandScript : script,
            overwrite: overwrite
          }
        }, this.parent.parentOrigin);
      })
    }

    async executeIncrementCommand(script = "", commandType, params = {}) {
      return new Promise((resolve, reject) => {
        let name = PluginMessageType.EXECUTE_INCREMENT_COMMAND;
        let key = Math.floor(Math.random() * 0x1000000);
        this.parent.messageList.push({
          key,
          name,
          resolve,
          reject
        });
        window.parent.postMessage({
          type: PluginMessageType.EXECUTE_INCREMENT_COMMAND,
          value: {
            key: key,
            script: script,
            commandType: commandType,
            params: params
          }
        }, this.parent.parentOrigin);
      })
    }

    /**
     * 在指定文档中执行
     *
     * @param projectId 指定文档的项目 Id
     * @param documentId 指定文档的 Id
     * @param versionId 指定文档的版本 Id
     * @param overwrite 是否覆盖执行
     * @param script 二次开发脚本
     */
    async executeInSpecifiedDoc(projectId, documentId, versionId, overwrite = false, script = "") {
      return new Promise((resolve, reject) => {
        let name = PluginMessageType.EXECUTE_IN_SPECIFIED_DOC;
        let key = Math.floor(Math.random() * 0x1000000);
        this.parent.messageList.push({
          key,
          name,
          resolve,
          reject
        });
        window.parent.postMessage({
          type: PluginMessageType.EXECUTE_IN_SPECIFIED_DOC,
          value: {
            key: key,
            script: script === "" ? this.commandScript : script,
            overwrite: overwrite,
            projectId: projectId,
            documentId: documentId,
            versionId: versionId,
          }
        }, this.parent.parentOrigin);
      });
    }

    /**
     * 新建文档
     *
     * @param {string} projectId 项目 Id
     * @param {string} folderCode 文件夹 Id，无则为 0
     * @param {string} docName 文件名
     * @param {DocumentType} documentType 文档类型
     * @param {DefaultTemplate} template 默认模板
     */
    async createDocument(projectId, folderCode, docName, documentType, template) {
      return await this.parent.request.execFunction(PluginFunctionType.CREATE_DOCUMENT, {
        projectId: projectId,
        folderCode: folderCode,
        docName: docName,
        documentType: documentType,
        template: template,
      });
    }

  }

  class PluginApi {
    constructor(info) {
      this.parent = info;
    }

    subscribeEvent(name, callback) {
      let key = Math.floor(Math.random() * 0x1000000);
      this.parent.messageList.push({
        key,
        name,
        callback,
      });

      window.parent.postMessage({
        type: PluginMessageType.SUBSCRIBE,
        value: {
          key: key,
          eventName: name,
        }
      }, this.parent.parentOrigin);
      return key;
    }

    unSubscribeEvent(name, subscribeId) {
      this.parent.messageList.filter(item => (item.name === name && item.key === subscribeId)).forEach(item => {
        this.parent.messageList.splice(this.parent.messageList.indexOf(item), 1);
      });

      window.parent.postMessage({
        type: PluginMessageType.UNSUBSCRIBE,
        value: {
          subscribeId: subscribeId,
          eventName: name,
        }
      }, this.parent.parentOrigin);
    }

    async execFunction(name, params) {
      return new Promise((resolve, reject) => {
        let key = Math.floor(Math.random() * 0x1000000);
        this.parent.messageList.push({
          key,
          name,
          params,
          resolve,
          reject
        });

        window.parent.postMessage({
          type: PluginMessageType.CALL_FUNCTION,
          value: {
            key: key,
            functionName: name,
            params: params
          }
        }, this.parent.parentOrigin);
      });
    }
  }

  class PluginQueryManager {
    constructor(param) {
      this.parent = param;
    }

    /**
     * 根据elementIds查询元素信息
     * @param elementIds {[]} 元素id数组
     * @return {Promise<void|any>}
     */
    async getElementsByIds(elementIds) {
      return this.parent.request.execFunction(PluginGetElement.BY_IDS, {elementIds: elementIds});
    }

    /**
     * 通过featureId获取元素信息
     * @param featureId {number} 特征id
     * @return {Promise<void|any>}
     */
    async getElementsByFeatureId(featureId) {
      return this.parent.request.execFunction(PluginGetElement.BY_FEATURE_ID, {featureId: featureId});
    }

    /**
     * 通过实体id获取元素信息
     * @param entityId {[]} 实体id数组
     * @return {Promise<void|any>}
     */
    async getElementsByEntityId(entityId) {
      return this.parent.request.execFunction(PluginGetElement.BY_ENTITY_ID, {entityId: entityId});
    }

    /**
     * 通过实体id查询实体信息
     * @param entityIds {[]} 实体id数组
     * @return {Promise<void|any>}
     */
    async getEntitiesByIds(entityIds) {
      return this.parent.request.execFunction(PluginGetEntity.BY_IDS, {entityIds: entityIds});
    }

    /**
     * 获取当前文档所有实体信息
     * @return {Promise<void|any>}
     */
    async getEntities() {
      return this.parent.request.execFunction(PluginGetEntity.ALL, {});
    }

    /**
     * 通过特征id湖区实体信息
     * @param featureIds {[]} 特征id数组
     * @return {Promise<void|any>}
     */
    async getEntitiesByFeatureIds(featureIds) {
      return this.parent.request.execFunction(PluginGetEntity.BY_FEATURE_IDS, {featureIds: featureIds});
    }

    /**
     * 通过特征id获取特征信息
     * @param featureIds {[]} 特征id数组
     * @return {Promise<void|any>}
     */
    async getFeatures(featureIds) {
      return this.parent.request.execFunction(PluginGetFeature.BY_IDS, {featureIds: featureIds});
    }

    /**
     * 通过特征名获取特征信息
     * @param featureNames {[]} 特征名数组
     * @return {Promise<void|any>}
     */
    async getFeaturesByNames(featureNames) {
      return this.parent.request.execFunction(PluginGetFeature.BY_NAMES, {featureNames: featureNames});
    }

    /**
     * 通过实例id获取示例信息
     * @param instanceIds {[]} 实例id数组
     * @return {Promise<void|any>}
     */
    async getInstancesByIds(instanceIds) {
      return this.parent.request.execFunction(PluginGetInstance.BY_IDS, {instanceIds: instanceIds});
    }

    /**
     * 获取实例的顶层实例
     * @param instanceId {string} 实例id
     * @return {Promise<void|any>}
     */
    async getTopInstance(instanceId) {
      return this.parent.request.execFunction(PluginGetInstance.TOP_INSTANCE, {instanceId: instanceId});
    }

    /**
     * 通过实例id、元素id获取装配下元素信息
     * @param instanceId {string} 实例id
     * @param elementId {number} 元素id
     * @return {Promise<void|any>}
     */
    async getElementInAssembly(instanceId, elementId) {
      return this.parent.request.execFunction(PluginGetElement.IN_ASSEMBLY, {instanceId: instanceId,elementId: elementId});
    }

    /**
     * 通过实例id、实体id获取装配下实体信息
     * @param instanceId {string} 实例id
     * @param entityId {number} 实体id
     * @return {Promise<void|any>}
     */
    async getEntityInAssembly(instanceId, entityId) {
      return this.parent.request.execFunction(PluginGetEntity.IN_ASSEMBLY, {instanceId: instanceId,entityId: entityId});
    }

    /**
     * 通过实例id获取实体信息
     * @param instanceId {string} 实例id
     * @return {Promise<void|any>}
     */
    async getEntitiesByInstanceId(instanceId) {
      return this.parent.request.execFunction(PluginGetEntity.BY_INSTANCE_ID, {instanceId: instanceId});
    }

    /**
     * 通过实例id获取元素信息
     * @param instanceId {string} 实例id
     * @return {Promise<void|any>}
     */
    async getElementsByInstanceId(instanceId) {
      return this.parent.request.execFunction(PluginGetElement.BY_INSTANCE_ID, {instanceId: instanceId});
    }

    /**
     * 通过特征名获取实体信息
     * @param featureNames {[]} 特征名数组
     * @return {Promise<void|any>}
     */
    async getEntitiesByFeatureNames(featureNames) {
      return this.parent.request.execFunction(PluginGetEntity.BY_FEATURE_NAMES, {featureNames: featureNames});
    }

    /**
     * 通过特征名获取元素信息
     * @param featureNames {[]} 特征名数组
     * @return {Promise<void|any>}
     */
    async getElementsByFeatureNames(featureNames) {
      return this.parent.request.execFunction(PluginGetElement.BY_FEATURE_NAMES, {featureNames: featureNames});
    }

    /**
     * 获取实例树
     * @return {Promise<void|any>}
     */
    async getInstanceTree() {
      return this.parent.request.execFunction(PluginGetInstance.INSTANCE_TREE, {});
    }

  }

  class PluginEventManager {
    constructor(param) {
      this.parent = param;
    }

    /**
     * 订阅元素拾取事件
     * @param callback {function} 事件触发后执行的回调方法
     * @return {*} 订阅事件的id
     */
    subscribeElementPickEvent(callback) {
      return this.parent.request.subscribeEvent(PluginEventType.ELEMENT_PICK, callback)
    }

    /**
     * 取消订阅元素拾取事件
     * @param subscribeId {number} 待取消的事件id
     */
    unSubscribeElementPickEvent(subscribeId) {
      this.parent.request.unSubscribeEvent(PluginEventType.ELEMENT_PICK, subscribeId);
    }

    /**
     * 订阅特征列表拾取事件
     * @param callback {function} 事件触发后执行的回调方法
     * @return {*} 订阅事件的id
     */
    subscribeFeaturePickEvent(callback) {
      return this.parent.request.subscribeEvent(PluginEventType.FEATURE_PICK, callback)
    }

    /**
     * 取消订阅特征列表拾取事件
     * @param subscribeId {number} 待取消事件的id
     */
    unSubscribeFeaturePickEvent(subscribeId) {
      this.parent.request.unSubscribeEvent(PluginEventType.FEATURE_PICK, subscribeId);
    }

    /**
     * 消息提示
     * @param params {{type: "",description:"",duration:3,closeBtn:false}}
     * type:'info'、'success'、'warning'、'error',duration:自动关闭时间,默认值3s,为0时不会自动关闭,closeBtn:是否显示关闭按钮
     */
    messageTip(params) {
      this.parent.request.execFunction(PluginFunctionType.MESSAGE_TIP, params);
    }

    /**
     * 高亮元素
     * @param idObjs {[]} 元素id数组
     * @return {Promise<void|any>}
     */
    async addHeightElement(idObjs) {
      return this.parent.request.execFunction(PluginFunctionType.ADD_HIGHLIGHT_ELEMENT, {ids: idObjs});
    }

    /**
     * 移除高亮元素
     * @param idObjs {[]} 元素id数组
     * @return {Promise<void|any>}
     */
    async removeHeightElement(idObjs) {
      return this.parent.request.execFunction(PluginFunctionType.REMOVE_HIGHLIGHT_ELEMENT, {ids: idObjs});
    }

    /**
     * 清除预览数据
     * @return {Promise<void|any>}
     */
    async clearPreview() {
      return this.parent.request.execFunction(PluginFunctionType.CLEAR_PREVIEW, {});
    }

    /**
     * 清除拾取数据
     * @return {Promise<void|any>}
     */
    async clearSelection() {
      return this.parent.request.execFunction(PluginFunctionType.CLEAR_SELECTION, {});
    }

    async setSelectType(elementTypes) {
      return this.parent.request.execFunction(PluginFunctionType.SET_SELECT_TYPE, {elementTypes: elementTypes});
    }

    async resetSelectType() {
      return this.parent.request.execFunction(PluginFunctionType.RESET_SELECT_TYPE, {});
    }

    async getSupportSelectType() {
      return this.parent.request.execFunction(PluginFunctionType.GET_SUPPORT_SELECT_TYPE, {});
    }


  }

  class CrownCADPlugin {
    constructor() {
      this.maxAttemptNumber = 5;
      this.parentOrigin = "https://cad.crowncad.com/";
      this.command = null;
      this.query = null;
      this.event = null;
      this.messageList = [];
    }

    setParentOrigin(parentOrigin) {
      this.parentOrigin = parentOrigin;
    }

    setMaxAttempt(number) {
      this.maxAttemptNumber = number;
    }

    setLayout(maxWidth, minWidth, maxHeight) {
      this.layout = {
        maxWidth: maxWidth,
        minWidth: minWidth,
        maxHeight: maxHeight
      };
    }

    async connect() {
      let attempt = 0;
      let responseInterval;
      return new Promise((resolve, reject) => {
        const handshake = (e) => {
          if (e.origin !== this.parentOrigin) {
            return;
          }
          if (e.data.type === PluginMessageType.INIT) {
            clearInterval(responseInterval);
            window.removeEventListener('message', handshake, false);
            this.parentOrigin = e.origin;
            this.request = new PluginApi(this);
            this.command = new PluginCommandManager(this);
            this.query = new PluginQueryManager(this);
            this.event = new PluginEventManager(this);
            this.listener = (e) => {
              if (e.data.type === PluginMessageType.CALLBACK) {
                const key = e.data.key;
                e.data.name;
                const code = e.data.response.code;
                const data = e.data.response.data;
                this.messageList.filter(item => item.key === key).forEach(item => {
                  if (item?.resolve) {
                    item.resolve({code, data});
                    this.messageList.splice(this.messageList.indexOf(item), 1);
                  } else if (item?.callback) {
                    item.callback(data);
                  }
                });
              } else if (e.data.type === PluginMessageType.DESTROYED) {
                this.destroyed();
              }
            };
            window.addEventListener('message', this.listener, false);
            let info = e.data.initInfo;
            return resolve(info)
          }

          return reject('Failed handshake')
        };

        window.addEventListener('message', handshake, false);

        const doSend = () => {
          attempt++;
          window.parent.postMessage({
            type: PluginMessageType.INIT,
            value: {
              layout: this.layout,
            }
          }, this.parentOrigin);

          if (attempt === this.maxAttemptNumber) {
            clearInterval(responseInterval);
            return reject('Failed handshake');
          }
        };

        const loaded = () => {
          doSend();
          responseInterval = setInterval(doSend, 500);
        };

        loaded();
      })
    }

    destroyed() {
      window.removeEventListener('message', this.listener, false);
      this.listener = null;
      this.parentOrigin = "https://cad.crowncad.com/";
      this.command = null;
      this.request = null;
      this.query = null;
      this.event = null;
      this.messageList = [];
    }
  }

  exports.Axis = Axis;
  exports.ConstraintType = ConstraintType;
  exports.CrownCADPlugin = CrownCADPlugin;
  exports.DefaultTemplate = DefaultTemplate;
  exports.Direction = Direction;
  exports.DocumentType = DocumentType;
  exports.Matrix4 = Matrix4;
  exports.Point = Point;
  exports.ScriptElementType = ScriptElementType;
  exports.ScriptFontNameType = ScriptFontNameType;
  exports.ScriptVariableType = ScriptVariableType;
  exports.ScriptVariableUnit = ScriptVariableUnit;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
