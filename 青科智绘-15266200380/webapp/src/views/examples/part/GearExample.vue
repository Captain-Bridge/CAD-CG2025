<template>
  <div>
    <div v-loading="loading" element-loading-text="模型生成中">
      <!-- 啮合类型-->
      <el-form :label-position="'left'" :inline="false" label-width="120px">
        <el-form-item label="啮合类型">
          <el-select size="small" v-model="meshType" class="meshType">
            <el-option v-for="item in meshTypeOption" :key="item.value" :label="item.label"
                       :value="item.value"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 齿数 z1、z2-->
      <el-form :label-position="'left'" :inline="false" label-width="120px" class="el-row">
        <el-form-item label="小齿数 z₁">
          <el-col>
            <el-input size="small" v-model="z1"></el-input>
          </el-col>
        </el-form-item>
      </el-form>

      <!-- 齿宽 b1 -->
      <el-form :label-position="'left'" :inline="false" label-width="120px" class="el-row">
        <el-form-item label="小齿宽 b₁">
          <el-input size="small" v-model="b1"></el-input>
        </el-form-item>
      </el-form>

      <!-- 齿顶高系数 ha* 与模数 m-->
      <el-form :label-position="'left'" :inline="false" label-width="120px" class="el-row">
        <el-form-item label="齿顶高系数 Ha*">
          <el-select size="small" v-model="haC">
            <el-option v-for="item in haCOptions" :label="item" :value="item" :key="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="模数 m">
          <el-select size="small" v-model="m">
            <el-option v-for="item in modules" :key="item" :label="item" :value="item"
                       :style="modulesPadding(item)"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 顶隙系数 c* 与压力角 α-->
      <el-form :label-position="'left'" :inline="false" label-width="120px" class="el-row">
        <el-form-item label="顶隙系数 c*">
          <el-select size="small" v-model="cC">
            <el-option v-for="item in cCOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="压力角 α">
          <el-select size="small" v-model="alpha">
            <el-option v-for="item in alphaOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 齿根圆角 ρ-->
      <el-form :label-position="'left'" :inline="false" label-width="120px" class="el-row">
        <el-form-item label="齿根圆角 ρ">
          <el-select size="small" v-model="rho">
            <el-option v-for="item in rhoOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div>
      <el-button type="primary" :disabled="loading" @click="createModel">生成齿轮</el-button>
    </div>
  </div>
</template>

<script>

import { gearGenerator } from "../../../design/GearGenerator";
import { SpurGear } from "../../../design/SpurGear";

export default {
  name: "SpurGear",
  data() {
    return {
      loading: false,

      // 齿数
      z1: 17,
      zOptions: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
        43, 44, 45, 46, 47, 48, 49, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 500],

      // 齿宽
      b1: 30,

      // 模数
      m: 2,
      modules: [1, 1.125, 1.25, 1.375, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 14,
        16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50,],

      // 压力角
      alpha: 20,
      alphaOptions: [14.5, 17.5, 20, 22.5, 25, 30],

      //齿顶高系数
      haC: 1,
      haCOptions: [0.8, 1, 1.2],

      // 顶隙系数
      cC: 0.25,
      cCOptions: [0.157, 0.2, 0.25, 0.3, 0.35, 0.4],

      // 顶隙系数
      rho: 0.38,
      rhoOptions: [0.25, 0.3, 0.38, 0.39],

      //啮合类型
      meshType: 0,
      meshTypeOption: [
        { label: '外啮合', value: 0 },
      ],

      // 变位系数 x
      x: 0,

      // 旋转角
      beta: 0,
      betaOptions: [0, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40],
    };
  },
  mounted() {
  },
  methods: {
    async createModel() {
      this.loading = true;
      const spurGear1 = new SpurGear(this.z1, this.m, (this.alpha / 180) * Math.PI, this.b1, this.rho, this.haC, this.cC, this.beta, this.x);
      await gearGenerator.createSpurGear(spurGear1);
      this.loading = false;
    },

    modulesPadding(value) {
      const leftPadding = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 32, 40, 50].includes(value) ? 1 : 15;
      return 'padding-top: 1px; padding-bottom: 1px; padding-left: ' + leftPadding + 'px';
    },

  },
};
</script>

<style scoped>

.el-row {
  display: flex;
}

>>> .el-input {
  width: 100px;
}

.meshType >>> .el-input {
  width: 320px;
}
</style>