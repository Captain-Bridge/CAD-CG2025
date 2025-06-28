export class SpurGear {
  /**
   * 计算绘制参数
   * 齿顶高 ha = m * ha*
   * 齿根高 hf = m * (ha* + c*)
   * 齿高 h = ha + hf = m * (2 * ha* + c*)
   */
  constructor(z, m, alpha, b, rho, haC, cC, beta, x) {
    /**
     * 齿数 z
     */
    this.teethNumber = z;
    /**
     * 模数 m
     */
    this.module = m;
    /**
     * 压力角 α
     */
    this.alpha = alpha;
    /**
     * 齿宽 b
     */
    this.teethWidth = b;
    /**
     * 齿根圆角半径 ρfp = h / 2 * m
     * GB: 0.38m
     * options: [0.25, 0.3, 0.38, 0.39]
     */
    this.toothFilterR = rho * m;
    /**
     * 旋转角 β
     */
    this.beta = beta;
    /**
     * 齿顶高系数 ha*
     * ha* = ha / m
     * 正常齿：1
     * 短齿：0.8
     * ha: 齿顶高，分度圆到齿顶圆之间的径向距离
     */
    this.addendumCoefficient = haC;
    /**
     * 顶隙系数 c*
     * c* = c / m
     * 正常齿：0.25
     * 短齿：0.3
     * c: 顶隙，啮合时自身齿根与配合齿轮齿顶之间的径向距离
     */
    this.clearanceCoefficient = cC;
    /*
    变位系数 x
     */
    this.modification = x;
    /**
     * 分度圆直径 d = m * z
     */
    this.dividingD = this.module * this.teethNumber;
    this.rd = this.dividingD / 2;
    /**
     * 基圆直径 db = d * cos(α)
     */
    this.baseD = this.dividingD * Math.cos(this.alpha);
    this.rb = this.baseD / 2;
    /**
     * 齿顶圆直径 da = d + 2 * ha
     */
    this.addendumD = this.dividingD + 2 * this.module * this.addendumCoefficient + 2 * this.modification * this.module;
    this.ra = this.addendumD / 2;
    /**
     * 齿根圆直径 df = d - 2 * hf
     */
    this.dedendumD = this.dividingD - 2 * this.module * (this.addendumCoefficient + this.clearanceCoefficient) + 2 * this.modification * this.module;
    this.rf = this.dedendumD / 2;
  }
}
