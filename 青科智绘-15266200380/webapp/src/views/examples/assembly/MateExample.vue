<template>
  <el-form size="mini">
    <el-form-item label="选中的元素: " style="display: flex;">
      <picked-info-list :info-list="selectedElementList"></picked-info-list>
    </el-form-item>

    <el-form-item label="配合类型">
      <el-select placeholder="请选择配合类型" v-model="matingType" size="mini">
        <el-option
            v-for="item in matingTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
            :disabled="item.disabled"
        ></el-option>
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" size="mini" @click="confirmMate">配合</el-button>
    </el-form-item>

  </el-form>

</template>

<script>
import { ccPlugin } from "../../../util/CcPluginManager";
import MateCommand from "../../../design/MateCommand";
import messageTip from "../../../design/MessageTip";
import ElementInfo from "../basic/ElementInfo.vue";
import PickedInfoList from "../basic/PickedInfoList.vue";

export default {
  name: "MateExample",
  components: { PickedInfoList, ElementInfo },

  data() {
    return {
      elementPickEventId: null,
      selectedElementList: [],
      matingTypeList: [
        { value: 0, label: '重合' },
        { value: 1, label: '平行' },
        { value: 2, label: '相切', disabled: true },
        { value: 3, label: '同轴心', disabled: true },
        { value: 7, label: '垂直', disabled: true },
        { value: 11, label: '距离', disabled: true },
        { value: 12, label: '角度', disabled: true }
      ],
      matingType: 0
    }
  },

  mounted() {
    this.elementPickEventId = ccPlugin.event.subscribeElementPickEvent(event => {
      this.selectedElementList = event.element;
    });
  },

  methods: {
    confirmMate() {
      if (this.selectedElementList.length !== 2) {
        messageTip.errorTip('选择元素数量错误。');
      }
      for (let element of this.selectedElementList) {
        if (element.element.type !== 19) {
          messageTip.errorTip('存在非法元素');
          return;
        }
      }
      let refElement = this.selectedElementList[0];
      let moveElement = this.selectedElementList[1];

      // 发送实际命令
      let mateCommand = new MateCommand();
      mateCommand.refInstanceId = refElement.instance.id;
      mateCommand.refElementId = refElement.element.id;
      mateCommand.moveIntsanceId = moveElement.instance.id;
      mateCommand.moveElementId = moveElement.element.id;

      mateCommand.featureName = ''
      mateCommand.matingType = this.matingType;
      mateCommand.alignType = 0;
      mateCommand.offsetValue = 0;
      mateCommand.executeCommand();

      ccPlugin.event.clearSelection();
    }
  },

  beforeDestroy() {
    ccPlugin.event.unSubscribeElementPickEvent(this.elementPickEventId);
  }

}
</script>

<style scoped>

</style>