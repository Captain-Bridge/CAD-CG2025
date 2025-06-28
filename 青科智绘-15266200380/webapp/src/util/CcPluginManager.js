import { CrownCADPlugin } from "../../nodeApp/static/lib/crowncad-plugin-sdk-0.0.3";

/**
 * CrownCAD插件
 */
class CcPluginManager {

  /**
   * 建立链接，初始化插件
   */
  connect(callBack = () => {}) {
    const ccPlugin = new CrownCADPlugin();
    ccPlugin.setParentOrigin("https://cad.crowncad.com");
    ccPlugin.setMaxAttempt(5);
    ccPlugin.setLayout(500, 600, 500);
    ccPlugin.connect().then(result => {
      this.command = ccPlugin.command;
      this.request = ccPlugin.request;
      this.query = ccPlugin.query;
      this.event = ccPlugin.event;
      callBack(result);
    })
  }

}

const ccPlugin = new CcPluginManager();

export {
  ccPlugin
}