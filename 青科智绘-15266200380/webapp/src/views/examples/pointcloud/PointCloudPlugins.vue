<template>
  <div style="display: flex">
    <el-tabs v-model="activePane" tab-position="left">
      <el-tab-pane label="点云上传" name="upload"></el-tab-pane>
      <el-tab-pane label="点云重建" name="reconstruction"></el-tab-pane>
    </el-tabs>
    <component 
      :is="currentPane" 
      @point-cloud-ready="handlePointCloudReady"
      :pointCloudData="pointCloudData"
      :pointCloudInfo="pointCloudInfo"
    />
  </div>
</template>

<script>
import PointCloudUpload from "./PointCloudUpload.vue";
import PointCloudReconstruction from "./PointCloudReconstruction.vue";

export default {
  name: "PointCloudPlugins",
  data() {
    return {
      activePane: 'upload',
      pointCloudData: null,
      pointCloudInfo: null
    }
  },
  methods: {
    handlePointCloudReady(data) {
      this.pointCloudData = data.data;
      this.pointCloudInfo = data.info;
      this.activePane = 'reconstruction';
    }
  },
  computed: {
    currentPane() {
      switch (this.activePane) {
        case "upload":
          return PointCloudUpload;
        case "reconstruction":
          return PointCloudReconstruction;
        default:
          return PointCloudUpload;
      }
    }
  }
}
</script>

<style scoped>

</style> 