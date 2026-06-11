import { useMemo } from "react";
import {
  convertAltitudeToChengduH,
  convertLatLonToNE,
  convertNEToChengduXY,
  type ChengduXYResult,
  type ChengduHeightResult,
  type ProjectedNEResult,
} from "./coordinate";
import { parseRtkText, type RtkParsedData } from "./transRTKline";

type GnggaParsedData = Extract<RtkParsedData, { type: "GNGGA" }>;
type UniheadingaParsedData = Extract<RtkParsedData, { type: "UNIHEADINGA" }>;

/**
 * RTK 原始报文转换成都项目坐标结果。
 *
 * 转换链路固定为：
 * RTK GGA 经纬度 -> 国家 2000 平面坐标 N/E -> 成都项目坐标 X/Y。
 */
export interface RtkToChengduCoordinateResult {
  /** 解析出的有效 RTK 报文数量 */
  parsedCount: number;

  /** 解析出的全部有效 RTK 数据 */
  parsed: RtkParsedData[];

  /** 最新一条 GNGGA / GPGGA 定位数据 */
  gga: GnggaParsedData | null;

  /** 最新一条 UNIHEADINGA 双天线定向数据 */
  heading: UniheadingaParsedData | null;

  /** 国家 2000 平面坐标中间结果 */
  ne: ProjectedNEResult | null;

  /** 成都项目坐标结果 */
  chengdu: ChengduXYResult | null;

  /** 成都项目高程结果 */
  chengduH: ChengduHeightResult | null;

  /** 转换失败或缺少定位报文时的错误信息 */
  error: string;
}

const emptyResult: RtkToChengduCoordinateResult = {
  parsedCount: 0,
  parsed: [],
  gga: null,
  heading: null,
  ne: null,
  chengdu: null,
  chengduH: null,
  error: "没有解析到有效的 GNGGA / GPGGA 报文",
};

function findLastParsed<T extends RtkParsedData>(
  parsed: RtkParsedData[],
  predicate: (item: RtkParsedData) => item is T
): T | null {
  for (let index = parsed.length - 1; index >= 0; index -= 1) {
    const item = parsed[index];

    if (predicate(item)) {
      return item;
    }
  }

  return null;
}

/**
 * 从 RTK 原始文本中解析定位信息，并换算成成都项目坐标。
 */
export function useRtkToChengduCoordinate(
  rawText: string
): RtkToChengduCoordinateResult {
  return useMemo(() => {
    try {
      const parsed = parseRtkText(rawText);
      const gga = findLastParsed(
        parsed,
        (item): item is GnggaParsedData => item.type === "GNGGA"
      );
      const heading = findLastParsed(
        parsed,
        (item): item is UniheadingaParsedData => item.type === "UNIHEADINGA"
      );

      if (!gga) {
        return {
          ...emptyResult,
          parsed,
          parsedCount: parsed.length,
          heading,
        };
      }

      const ne = convertLatLonToNE(gga.latitude, gga.longitude);
      const chengdu = convertNEToChengduXY(ne.N, ne.E);
      const chengduH = convertAltitudeToChengduH(gga.altitude);

      return {
        parsedCount: parsed.length,
        parsed,
        gga,
        heading,
        ne,
        chengdu,
        chengduH,
        error: "",
      };
    } catch (error) {
      return {
        ...emptyResult,
        error: error instanceof Error ? error.message : "转换失败",
      };
    }
  }, [rawText]);
}
