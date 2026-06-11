import { type HeadingStatus, type RtkStatus } from "./constant";
import { parseRtkLine, type RtkParsedData } from "./transRTKline";

/**
 * RTK 实时状态
 */
export interface RtkRealtimeState {
  /** 当前纬度，十进制度 */
  latitude: string;

  /** 当前经度，十进制度 */
  longitude: string;

  /** RTK 定位状态 */
  rtkStatus: RtkStatus;

  /** 参与定位的卫星数量 */
  satelliteCount: number;

  /** HDOP 水平精度因子 */
  hdop: string;

  /** 航向角，单位 ° */
  heading: string;

  /** 俯仰角，单位 ° */
  pitch: string;

  /** 双天线基线长度，单位 m */
  baselineLength: string;

  /** 双天线定向状态 */
  headingStatus: HeadingStatus;

  /** 成都坐标 X */
  chengduX: string;

  /** 成都坐标 Y */
  chengduY: string;

  /** 最后更新时间戳 */
  lastUpdateTime: number;
}

/**
 * 创建默认 RTK 实时状态
 */
export function createDefaultRtkState(): RtkRealtimeState {
  return {
    latitude: "",
    longitude: "",
    rtkStatus: "UNKNOWN",
    satelliteCount: 0,
    hdop: "",

    heading: "",
    pitch: "",
    baselineLength: "",
    headingStatus: "UNKNOWN",

    chengduX: "",
    chengduY: "",

    lastUpdateTime: 0,
  };
}

/**
 * 把解析出来的 RTK 数据合并进实时状态
 */
export function mergeRtkDataToState(
  state: RtkRealtimeState,
  parsed: RtkParsedData | null
): RtkRealtimeState {
  if (!parsed) return state;

  const nextState: RtkRealtimeState = {
    ...state,
    lastUpdateTime: Date.now(),
  };

  if (parsed.type === "GNGGA") {
    nextState.latitude = parsed.latitude;
    nextState.longitude = parsed.longitude;
    nextState.rtkStatus = parsed.rtkStatus;
    nextState.satelliteCount = parsed.satelliteCount;
    nextState.hdop = parsed.hdop;
  }

  if (parsed.type === "UNIHEADINGA") {
    nextState.heading = parsed.heading;
    nextState.pitch = parsed.pitch;
    nextState.baselineLength = parsed.baselineLength;
    nextState.headingStatus = parsed.headingStatus;
  }

  return nextState;
}

/**
 * 处理单行 RTK 原始数据，并返回新的实时状态
 */
export function handleRtkLine(
  state: RtkRealtimeState,
  line: string
): RtkRealtimeState {
  const parsed = parseRtkLine(line);

  if (!parsed) return state;

  return mergeRtkDataToState(state, parsed);
}
