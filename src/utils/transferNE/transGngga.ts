import Decimal from "decimal.js";
import { GGA_FIX_QUALITY_STATUS_MAP, type RtkStatus } from "./constant";

/**
 * GNGGA / GPGGA 解析结果
 */
export interface GnggaData {
  /** 数据类型 */
  type: "GNGGA";

  /** UTC 时间，原始格式如 093652.00 */
  utcTime: string;

  /** 十进制度纬度，字符串保存，避免提前损失精度 */
  latitude: string;

  /** 十进制度经度，字符串保存，避免提前损失精度 */
  longitude: string;

  /** GGA 定位质量字段，4 通常代表 RTK Fixed */
  fixQuality: number;

  /** RTK 定位状态 */
  rtkStatus: RtkStatus;

  /** 参与定位的卫星数量 */
  satelliteCount: number;

  /** HDOP 水平精度因子，数值越小越好 */
  hdop: string;

  /** 海拔高，单位 m */
  altitude: string;

  /** 大地水准面差距，单位 m */
  geoidSeparation: string;

  /** 差分龄期，单位 s */
  differentialAge: string;

  /** 差分基站 ID */
  baseStationId: string;
}

/**
 * 根据 GGA 定位质量字段获取 RTK 状态
 */
export function getRtkStatus(fixQuality: number): RtkStatus {
  return GGA_FIX_QUALITY_STATUS_MAP[fixQuality] ?? "UNKNOWN";
}

/**
 * 解析 NMEA 经纬度
 *
 * NMEA 格式：
 * - 纬度：ddmm.mmmmmmmm
 * - 经度：dddmm.mmmmmmmm
 *
 * 示例：
 * - 3001.69590045,N => 30.028265007500
 * - 10346.53684317,E => 103.775614052833
 */
export function parseNmeaLatLon(value: string, direction: string): string {
  if (!value) return "";

  const raw = String(value);
  const dotIndex = raw.indexOf(".");

  if (dotIndex === -1) return "";

  const degreeLength = dotIndex > 4 ? 3 : 2;

  const degrees = Number(raw.slice(0, degreeLength));
  const minutes = Number(raw.slice(degreeLength));

  if (Number.isNaN(degrees) || Number.isNaN(minutes)) {
    return "";
  }

  let decimal = new Decimal(degrees).plus(new Decimal(minutes).div(60));

  if (direction === "S" || direction === "W") {
    decimal = decimal.negated();
  }

  return decimal.toDecimalPlaces(12).toString();
}

/**
 * 解析 GNGGA / GPGGA 报文
 */
export function parseGngga(line: string): GnggaData | null {
  if (!line || typeof line !== "string") return null;

  const cleanLine = line.split("*")[0];
  const fields = cleanLine.split(",");

  if (fields.length < 15) return null;

  const utcTime = fields[1] ?? "";
  const latRaw = fields[2] ?? "";
  const latDir = fields[3] ?? "";
  const lonRaw = fields[4] ?? "";
  const lonDir = fields[5] ?? "";

  const fixQuality = Number(fields[6]);
  const satelliteCount = Number(fields[7]);

  const hdop = fields[8] ?? "";
  const altitude = fields[9] ?? "";
  const geoidSeparation = fields[11] ?? "";
  const differentialAge = fields[13] ?? "";
  const baseStationId = fields[14] ?? "";

  const latitude = parseNmeaLatLon(latRaw, latDir);
  const longitude = parseNmeaLatLon(lonRaw, lonDir);

  return {
    type: "GNGGA",
    utcTime,
    latitude,
    longitude,
    fixQuality,
    rtkStatus: getRtkStatus(fixQuality),
    satelliteCount,
    hdop,
    altitude,
    geoidSeparation,
    differentialAge,
    baseStationId,
  };
}
