<template>
  <el-form size="mini">
    <el-form-item label="选中的元素" style="display: flex;">
      <el-row v-for="(item, index) in selectedElementList" :key="index" style="width: 320px">
        <el-col :span="8">
          {{ item.instance.name }}
        </el-col>
        <el-col :span="8">
          元素id: {{ item.element.id }}
        </el-col>
        <el-col :span="8">
          实例id: {{ item.instance.id }}
        </el-col>
      </el-row>
    </el-form-item>
  </el-form>
</template>

<script>
import { ccPlugin } from "../../../util/CcPluginManager";
import ElementInfo from "../basic/ElementInfo.vue";

export default {
  name: "InfoQueryExample",
  components: { ElementInfo },
  comments: {
    ElementInfo
  },
  data() {
    return {
      elementPickEventId: null,
      featurePickEventId: null,
      selectedElementList: [],
      selectedFeatureList: []
    }
  },
  mounted() {
    this.elementPickEventId = ccPlugin.event.subscribeElementPickEvent(event => {
      this.selectedElementList = event.element;
    });
    this.featurePickEventId = ccPlugin.event.subscribeFeaturePickEvent(event => {
      this.selectedFeatureList = event.feature;
    });
  },
  beforeDestroy() {
    ccPlugin.event.unSubscribeElementPickEvent(this.elementPickEventId);
    ccPlugin.event.unSubscribeFeaturePickEvent(this.featurePickEventId);
  }
}
</script>

<style scoped>

</style>
