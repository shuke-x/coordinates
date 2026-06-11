
/**
 * 定向状态类型
 */
export type HeadingStatus = "FIXED" | "UNFIXED" | "UNKNOWN";

/**
 * RTK 状态中文文案
 */
export const RTK_STATUS_TEXT: Record<RtkStatus, string> = {
  /** 无效定位 */
  INVALID: "无效定位",

  /** GPS 单点定位 */
  GPS: "单点定位",

  /** 差分定位 */
  DGPS: "差分定位",

  /** RTK 固定解 */
  FIXED: "RTK固定解",

  /** RTK 浮点解 */
  FLOAT: "RTK浮点解",

  /** 未知状态 */
  UNKNOWN: "未知状态",
};

/**
 * 航向状态中文文案
 */
export const HEADING_STATUS_TEXT: Record<HeadingStatus, string> = {
  /** 定向固定解 */
  FIXED: "定向固定解",

  /** 定向未固定 */
  UNFIXED: "定向未固定",

  /** 未知状态 */
  UNKNOWN: "未知",
};

/**
 * 页面显示精度配置
 */
export const DISPLAY_PRECISION = {
  /** 坐标显示精度，3 位小数代表毫米级 */
  COORDINATE: 3,

  /** 角度显示精度 */
  ANGLE: 2,

  /** 偏差距离显示精度，2 位小数代表厘米级 */
  DISTANCE: 2,
} as const;

/**
 * 成都坐标转换参数
 *
 * 注意：
 * N0/E0 是项目成果表中的国家 2000 平面坐标基准点。
 * 正式施工时应替换为测绘单位提供的正式参数，或通过完整控制点最小二乘拟合得到。
 */
export const CHENGDU_COORDINATE_PARAMS = {
  /** 国家 2000 北坐标基准点 */
  N0: "3377681.686",

  /** 国家 2000 东坐标基准点 */
  E0: "400659.307",

  /** 成都市坐标 X 基准点 */
  X0: "202623.775",

  /** 成都市坐标 Y 基准点 */
  Y0: "209808.803",

  /** X 方向 N 分量仿射系数 */
  a: "1.0000333011679273411530836659668172581093842518294975009821831947767951248585375",

  /** X 方向 E 分量仿射系数 */
  b: "0.008250171853022014984118471483739328539613308852919336402708006781746540294276821",

  /** Y 方向 N 分量仿射系数 */
  d: "-0.0082568884631036045232510228241139819869986606418152189357937329787141581911526263",

  /** Y 方向 E 分量仿射系数 */
  e: "1.0000365872964286839203570900930588968024320637117233169337339352257101532408461",
} as const;

/**
 * 成都项目高程改正数。
 *
 * 当前值由基准点样例反推：
 * GGA altitude 440.3308m -> 项目 H 506.996m。
 */
export const CHENGDU_HEIGHT_OFFSET = "66.6652";

/**
 * transWGS84 页面中椭球高 H 到成都项目 H 的改正数。
 *
 * 当前由三组控制点反推：
 * 464.553 -> 506.996，偏移 42.443m
 * 464.834 -> 507.279，偏移 42.445m
 * 465.405 -> 507.848，偏移 42.443m
 * 取中值 42.444m 后三组误差均约 0.001m。
 */
export const CHENGDU_ELLIPSOID_HEIGHT_OFFSET = "42.444";

/**
 * RTK 报文前缀
 */
export const RTK_PACKET_PREFIX = {
  /** 多星座 GGA 定位数据 */
  GNGGA: "$GNGGA",

  /** GPS GGA 定位数据 */
  GPGGA: "$GPGGA",

  /** 双天线定向数据 */
  UNIHEADINGA: "#UNIHEADINGA",
} as const;


/**
 * RTK 定位状态类型
 */
export type RtkStatus =
  | "INVALID"
  | "GPS"
  | "DGPS"
  | "FIXED"
  | "FLOAT"
  | "UNKNOWN";

/**
 * GGA 定位质量枚举
 */
export const GGA_FIX_QUALITY = {
  /** 无效定位 */
  INVALID: 0,

  /** GPS 单点定位 */
  GPS: 1,

  /** 差分定位 */
  DGPS: 2,

  /** RTK 固定解，通常可认为厘米级定位状态 */
  FIXED: 4,

  /** RTK 浮点解，精度低于固定解 */
  FLOAT: 5,
} as const;

/**
 * GGA 定位质量码到 RTK 状态的映射
 */
export const GGA_FIX_QUALITY_STATUS_MAP: Record<number, RtkStatus> = {
  /** 0：无效定位 */
  [GGA_FIX_QUALITY.INVALID]: "INVALID",

  /** 1：GPS 单点定位 */
  [GGA_FIX_QUALITY.GPS]: "GPS",

  /** 2：差分定位 */
  [GGA_FIX_QUALITY.DGPS]: "DGPS",

  /** 4：RTK 固定解 */
  [GGA_FIX_QUALITY.FIXED]: "FIXED",

  /** 5：RTK 浮点解 */
  [GGA_FIX_QUALITY.FLOAT]: "FLOAT",
};
