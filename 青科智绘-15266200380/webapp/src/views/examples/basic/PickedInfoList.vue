<template>
  <div>
    <div class="pick-info-list" v-for="(item, index) in showItemList" :key="index">
      <el-row>{{ item.displayName }}</el-row>
    </div>
  </div>

</template>

<script>
export default {
  name: "PickedInfoList",
  props: ['infoList'],
  data() {
    return {
      testList: [
        {
          key: "1"
        }
      ]
    }
  },
  computed: {
    showItemList() {
      let showItemList = [];
      for (let pickedInfoListElement of this.infoList) {
        let showItem = {};
        showItem.rowKey = "3";
        showItem.displayName = this.makeDisplayName(pickedInfoListElement);
        showItemList.push(showItem);
      }
      return showItemList;
    }
  },
  methods: {
    makeDisplayName(item) {
      let displayName = '';
      let instance = item.instance;
      let element = item.element;
      if (instance) {
        displayName += instance.name;
        displayName += '(id: ' + instance.id + ')'
      }
      if (element) {

      }
      return displayName;
    }
  }
}
</script>


<style scoped>
.pick-info-list {

}
</style>