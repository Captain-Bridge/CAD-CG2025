<template>
  <div style="width: 90%">
    <el-row :gutter="20">
      <el-col :span="8">
        元素id: {{ elementId }}
      </el-col>
      <el-col :span="8">
        实例名: {{ instanceName }}
      </el-col>
      <el-col :span="8">
        实例id: {{ instanceId }}
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "ElementInfo",
  props: ["elementId", "instanceName", "instanceId"]
}
</script>

<style scoped>

</style>