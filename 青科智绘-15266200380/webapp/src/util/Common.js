import * as THREE from 'three';

// 点到直线垂足
export function pointToLineDropFeet(point, startPoint, endPoint) {
  let dropFeet = null;
  //线的两个端点不重合，
  if (startPoint.equals(endPoint))
    return dropFeet;

  let a = endPoint.y - startPoint.y;
  let b = endPoint.x - startPoint.x;
  let A = -1 * a;
  let B = b;
  let C = -1 * b * startPoint.y + a * startPoint.x;
  let x0 = (B * B * point.x - A * B * point.y - A * C) / (A * A + B * B);
  let y0 = (A * A * point.y - A * B * point.x - B * C) / (A * A + B * B);
  dropFeet = new THREE.Vector3(x0, y0, 0);
  return dropFeet;
}

export function symmetryPoint(point, lineStartPoint, lineEndPoint) {
  let dropFeet = pointToLineDropFeet(point, lineStartPoint, lineEndPoint);
  let distanceTo = point.distanceTo(dropFeet);
  return getPointByLen(dropFeet, dropFeet.clone().sub(point).normalize(), distanceTo);
}

export function getPointByLen(startPnt, dirPnt, length) {
  dirPnt.setLength(length);
  return startPnt.clone().add(dirPnt);
}