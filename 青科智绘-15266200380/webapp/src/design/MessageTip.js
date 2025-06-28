import { ccPlugin } from "../util/CcPluginManager";

class MessageTip {

  infoTip(description) {
    ccPlugin.event.messageTip({
      "type": "info",
      "description": description,
      "duration": 1.5,
      "closeBtn": true
    })
  }

  successTip(description) {
    ccPlugin.event.messageTip({
      "type": "success",
      "description": description,
      "duration": 1.5,
      "closeBtn": true
    })
  }

  warningTip(description) {
    ccPlugin.event.messageTip({
      "type": "error",
      "description": description,
      "duration": 1.5,
      "closeBtn": true
    })
  }

  errorTip(description) {
    ccPlugin.event.messageTip({
      "type": "error",
      "description": description,
      "duration": 1.5,
      "closeBtn": true
    });
  }

}

let messageTip = new MessageTip();
export default messageTip;