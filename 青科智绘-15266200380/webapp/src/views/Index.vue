<template>
  <div style="height: 100%; width: 100%;">

    <el-tabs v-model="activeDocumentType">
      <el-tab-pane label="点云重建" name="PointCloudDocument" :disabled="activeDocumentType !== 'PointCloudDocument'"></el-tab-pane>
      <!--<el-tab-pane label="工程图" name="DrawingDocument" :disabled="activeDocumentType !== 'DrawingDocument'"></el-tab-pane>-->
    </el-tabs>

    <template>
      <component :is="currentPane"></component>
    </template>

  </div>
</template>

<script>
import { ccPlugin } from "../util/CcPluginManager";
import messageTip from "../design/MessageTip";
import commandManager from "../util/CommandManager";
import PointCloudPlugins from "./examples/pointcloud/PointCloudPlugins.vue";
import DrawingPlugins from "./examples/DrawingPlugins.vue";

export default {
  components: {
    PointCloudPlugins,
    DrawingPlugins
  },
  data() {
    return {
      activeDocumentType: '',
      connected: false,
    }
  },
  mounted() {
    // 设置默认文档类型为点云重建
    this.activeDocumentType = 'PointCloudDocument';
    
    ccPlugin.connect((result) => {
      let docName = result.docInfo.name;
      let docType = result.docInfo.type;
      messageTip.successTip("插件初始化完成。当前文档名称: " + docName);
      commandManager.docType = docType;
      this.activeDocumentType = docType;
      this.connected = true;
    });
  },
  methods: {

  },
  computed: {
    currentPane() {
      switch (this.activeDocumentType) {
        case "PointCloudDocument":
          return PointCloudPlugins;
        // case "DrawingDocument":
        //   return DrawingPlugins;
        default:
          return PointCloudPlugins;
      }
    }
  }
}
</script>

<style scoped>

</style>