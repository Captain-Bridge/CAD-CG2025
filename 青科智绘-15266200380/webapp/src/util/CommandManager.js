/**
 * 可以用来存储从cc获取的一些信息
 */
class CommandManager {

  constructor() {
    this._docType = null;
  }

  set docType(docType) {
    this._docType = docType;
  }

  get docType() {
    return this._docType;
  }

}

let commandManager = new CommandManager();
export default commandManager;