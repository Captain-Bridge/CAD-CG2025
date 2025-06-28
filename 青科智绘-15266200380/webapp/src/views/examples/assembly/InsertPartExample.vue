<template>
  <div>
    <el-form size="mini">

      <el-form-item label="选择的实例: ">
        <span v-if="!selectedElement">未选择实例</span>
        <instance-info v-else :selected-instance="selectedElement.instance"></instance-info>
      </el-form-item>

      <el-form-item label="插入位置: " style="display: flex;">
        <el-row>
          x: <el-input v-model="position.x" class="point-position-input"></el-input>
        </el-row>
        <el-row>
          y: <el-input v-model="position.y" class="point-position-input"></el-input>
        </el-row>
        <el-row>
          z: <el-input v-model="position.z" class="point-position-input"></el-input>
        </el-row>
      </el-form-item>

      <el-form-item label="按照模型中心确定">
        <el-checkbox v-model="boxCenter" disabled></el-checkbox>
      </el-form-item>

      <el-form-item label="零件所在项目id">
        <el-input size="small" disabled placeholder="默认在当前项目下" style="width: 240px;"></el-input>
      </el-form-item>

    </el-form>

    <el-button type="primary" size="mini" @click="confirm">插入零件</el-button>

  </div>
</template>

<script>
import ElementInfo from "../basic/ElementInfo.vue";
import { ccPlugin } from "../../../util/CcPluginManager";
import { Point } from "../../../../nodeApp/static/lib/crowncad-plugin-sdk-0.0.3";
import InstanceInfo from "../basic/InstanceInfo.vue";

export default {
  name: "InsertPartExample.vue",
  data() {
    return {
      elementPickEventId: null,
      selectedElement: null,
      boxCenter: true,
      position: new Point(100, 100 ,100)
    }
  },
  components: { InstanceInfo, ElementInfo },
  mounted() {
    this.elementPickEventId = ccPlugin.event.subscribeElementPickEvent(event => {
      this.selectedElement = event.element[0];
    });
  },
  beforeDestroy() {
    ccPlugin.event.unSubscribeElementPickEvent(this.elementPickEventId);
  },
  methods: {
    getDocNameFromInstanceName(instanceName) {
      instanceName.lastIndex
      let lastIndex = instanceName.lastIndexOf('<');
      return instanceName.substring(0, lastIndex);
    },
    // 确认插入
    confirm() {
      let docName = this.selectedElement.instance.name;
      docName = this.getDocNameFromInstanceName(docName);
      ccPlugin.command.assembly.insertComponentIncrement({
        docName: docName,
        position: this.position,
        boxCenter: 1, // 按照模型中心确定位置
        // projectId: ''
      }, '')
    }
  }
}
</script>

<style scoped>
.point-position-input {
  width: 60px;
}
</style>