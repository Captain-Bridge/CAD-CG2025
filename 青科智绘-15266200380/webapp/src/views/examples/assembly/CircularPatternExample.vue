<template>
  <el-form size="mini">
    <el-form-item label="选中的实例:">
      <instance-info :selected-instance="selectedInstance"></instance-info>
    </el-form-item>

    <el-form-item label="阵列中心轴: " style="display: flex;">

      <el-form-item label="起始点: " style="display: flex;">
        <el-row>
          x: <el-input v-model="startPoint.x" class="point-position-input"></el-input>
        </el-row>
        <el-row>
          y: <el-input v-model="startPoint.y" class="point-position-input"></el-input>
        </el-row>
        <el-row>
          z: <el-input v-model="startPoint.z" class="point-position-input"></el-input>
        </el-row>
      </el-form-item>

      <el-form-item label="终止点:" style="display: flex;">
        <el-row>
          x: <el-input v-model="endPoint.x" class="point-position-input"></el-input>
        </el-row>
        <el-row>
          y: <el-input v-model="endPoint.y" class="point-position-input"></el-input>
        </el-row>
        <el-row>
          z: <el-input v-model="endPoint.z" class="point-position-input"></el-input>
        </el-row>
      </el-form-item>

    </el-form-item>

    <el-form-item label="角度°: ">
        <el-input v-model="angle1" type="number" min="1" max="360" style="width:80px;height: 30px"></el-input>
    </el-form-item>

    <el-form-item label="阵列数量: ">
      <el-input v-model="instanceNum1" size="mini" style="width: 80px;"></el-input>
    </el-form-item>

    <el-form-item class="input-form-item">
      <el-button type="primary" size="mini" @click="confirm">确认</el-button>
    </el-form-item>

  </el-form>
</template>

<script>
import { ccPlugin } from "../../../util/CcPluginManager";
import { Axis, Direction, Point } from "../../../../nodeApp/static/lib/crowncad-plugin-sdk-0.0.3";
import ElementInfo from "../basic/ElementInfo.vue";
import InstanceInfo from "../basic/InstanceInfo.vue";

export default {
  name: "ArrayExample",
  components: { InstanceInfo, ElementInfo },
  data() {
    return {
      selectedInstance: null,
      elementPickEventId: null,
      instanceId: '',
      startPoint: new Point(0, 0, 0),
      endPoint: new Point(100, 0 ,0),
      instanceNum1: 2,
      angle1: 30.0,
      featureName: 0,
    }
  },
  mounted() {
    // 订阅事件
    this.elementPickEventId = ccPlugin.event.subscribeElementPickEvent(event => {
      // 只拾取第一个实例
      this.selectedInstance = event.element[0].instance;
    });
  },
  beforeDestroy() {
    // 销毁事件
    ccPlugin.event.unSubscribeElementPickEvent(this.elementPickEventId);
  },
  methods: {
    /**
     * 实际发送命令
     */
    confirm() {
      let component = this.selectedInstance.id;
      let axis = new Axis();
      axis.setPoint(this.startPoint, this.endPoint);

      ccPlugin.command.assembly.circularPatternIncrement({
        component: component, // 实例 instanceId
        axis: axis, // 方向1
        angle1: this.angle1, // 浮点型
        instanceNum1: this.instanceNum1
      }, '');
    }
  }
}
</script>

<style scoped>
.point-position-input {
  width: 60px;
}
.input-form-item {
  display: inline-block;
}
</style>