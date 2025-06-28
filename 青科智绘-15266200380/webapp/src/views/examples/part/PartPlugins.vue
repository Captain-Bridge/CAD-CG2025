<template>
  <div style="display: flex">
    <el-tabs v-model="activePane" tab-position="left">
      <el-tab-pane label="齿轮" name="gear"></el-tab-pane>
    </el-tabs>
    <component :is="currentPane"></component>
  </div>
</template>

<script>
import GearExample from "./GearExample.vue";

export default {
  name: "PartPlugins",
  data() {
    return {
      activePane: 'gear'
    }
  },
  computed: {
    currentPane() {
      switch (this.activePane) {
        case "gear":
          return GearExample;
        default:
          return GearExample;
      }
    }
  }
}
</script>

<style scoped>

</style>