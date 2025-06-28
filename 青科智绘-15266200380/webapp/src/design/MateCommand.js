import { ccPlugin } from "../util/CcPluginManager";

class MateCommand {

  constructor() {
    this._featureName = '';
    this._moveIntsanceId = '';
    this._moveElementId = 0;
    this._refInstanceId = '';
    this._refElementId = 0;
    this._matingType = 0;
    this._alignType = 0;
    this._offsetValue = 0;
  }

  /**
   * 执行具体的命令
   */
  executeCommand() {
    ccPlugin.command.assembly.createMatingIncrement({
      "moveInstanceId": this._moveIntsanceId,
      "moveElementId": this._moveElementId,
      "refInstanceId": this._refInstanceId,
      "refElementId": this._refElementId,
      "matingType": this._matingType,
      "alignType": this._alignType,
      "offsetValue": this._offsetValue
    }, this.featureName);
  }

  get featureName() {
    return this._featureName;
  }

  set featureName(value) {
    this._featureName = value;
  }

  get moveIntsanceId() {
    return this._moveIntsanceId;
  }

  set moveIntsanceId(value) {
    this._moveIntsanceId = value;
  }

  get refElementId() {
    return this._refElementId;
  }

  set refElementId(value) {
    this._refElementId = value;
  }

  get moveElementId() {
    return this._moveElementId;
  }

  set moveElementId(value) {
    this._moveElementId = value;
  }

  get refInstanceId() {
    return this._refInstanceId;
  }

  set refInstanceId(value) {
    this._refInstanceId = value;
  }

  get matingType() {
    return this._matingType;
  }

  set matingType(value) {
    this._matingType = value;
  }

  get alignType() {
    return this._alignType;
  }

  set alignType(value) {
    this._alignType = value;
  }

  get offsetValue() {
    return this._offsetValue;
  }

  set offsetValue(value) {
    this._offsetValue = value;
  }

}

export default MateCommand;