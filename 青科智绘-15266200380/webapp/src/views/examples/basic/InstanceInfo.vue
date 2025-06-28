<template>
  <div style="width: 90%;">
    <el-row v-if="selectedInstance">
      <el-col :span="8">
        实例id: {{ selectedInstance.id }}
      </el-col>
      <el-col :span="8">
        实例名: {{ selectedInstance.name }}
      </el-col>
    </el-row>

    <el-row v-else>未选中实例信息</el-row>
  </div>
</template>

<script>
export default {
  name: "InstanceInfo",
  props: ["selectedInstance"]
}
</script>

<style scoped>

</style>