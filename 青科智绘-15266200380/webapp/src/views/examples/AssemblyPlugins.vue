<template>
  <div style="display: flex;">

    <el-tabs v-model="activePane" tab-position="left" style="min-width: 115px">
      <el-tab-pane label="装配配合" name="mate"></el-tab-pane>
      <el-tab-pane label="线性阵列" name="linearArray"></el-tab-pane>
      <el-tab-pane label="圆周阵列" name="circularPattern"></el-tab-pane>
      <el-tab-pane label="插入零件" name="insertPart"></el-tab-pane>
      <el-tab-pane label="信息查询" name="infoQuery"></el-tab-pane>
    </el-tabs>

    <component :is="currentPane" style="flex-grow: 1.0; overflow: hidden"></component>

  </div>
</template>

<script>
import MateExample from "./assembly/MateExample.vue";
import InfoQueryExample from "./assembly/InfoQueryExample.vue";
import InsertPartExample from "./assembly/InsertPartExample.vue";
import LinearArrayExample from "./assembly/LinearArrayExample.vue";
import CircularPatternExample from "./assembly/CircularPatternExample.vue";

export default {
  name: "AssemblyPlugins",
  data() {
    return {
      activePane: 'mate'
    }
  },
  mounted() {

  },
  computed: {
    currentPane() {
      switch (this.activePane) {
        case "mate":
          return MateExample;
        case "infoQuery":
          return InfoQueryExample;
        case "insertPart":
          return InsertPartExample;
        case "linearArray":
          return LinearArrayExample;
        case "circularPattern":
          return CircularPatternExample;
        default:
          return MateExample;
      }
    }
  }
}
</script>

<style scoped>

</style>