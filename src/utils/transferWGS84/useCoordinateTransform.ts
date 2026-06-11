import { useCallback } from "react";
import Decimal from "decimal.js";

export type LatLonInput = {
  lat: number | string;
  lon: number | string;
};

export type PlaneTransformParams = {
  /**
   * 中央子午线，成都这个成果表说明里写的是 105°
   */
  centralMeridian?: number;

  /**
   * 高斯投影假东偏，一般是 500000
   */
  falseEasting?: number;

  /**
   * 平面四参数
   * X = tx + a * N - b * E
   * Y = ty + b * N + a * E
   */
  tx: number;
  ty: number;
  a: number;
  b: number;
};

export type CoordResult = {
  lat: number;
  lon: number;

  /**
   * 国家 2000 平面坐标
   */
  N: number;
  E: number;

  /**
   * 成都市坐标系坐标
   */
  X: number;
  Y: number;
};

const CGCS2000_A = 6378137.0;
const CGCS2000_F = 1 / 298.257222101;
const CGCS2000_E2 = 2 * CGCS2000_F - CGCS2000_F * CGCS2000_F;

const DEFAULT_CENTRAL_MERIDIAN = 105;
const DEFAULT_FALSE_EASTING = 500000;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 过滤经纬度输入框字符，保留十进制度和 DMS 常用字符。
 */
export function filterCoordinateInput(input: string): string {
  return input
    .replace(/[^\d+\-.:：∶。．°′’'″”"\sNSEWnsew]/g, "")
    .replace(/[：∶]/g, ":")
    .replace(/[。．]/g, ".")
    .replace(/(?<=\d)\s+(?=\d)/g, "")
    .replace(/(?<=\.)\s+(?=\d)/g, "");
}

/**
 * 支持：
 * 30:30:54.69607
 * 30：30：54.69607
 * 30°30′54.69607″
 * 30 30 54.69607
 * 30:30:54.69607N
 * 30.51519335
 */
export function dmsToDecimal(input: string | number): number {
  if (typeof input === "number") return input;

  const filtered = filterCoordinateInput(input).trim();
  const direction = filtered.match(/[NSEWnsew]/)?.[0]?.toUpperCase() ?? "";
  const text = filtered
    .replace(/[NSEWnsew]/g, "")
    .replace(/[−－]/g, "-")
    .trim();

  if (!text) {
    throw new Error(`无法解析角度格式：${input}`);
  }

  if (/^[+-]?\d+(\.\d+)?$/.test(text)) {
    const decimal = new Decimal(text);
    return direction === "S" || direction === "W"
      ? decimal.abs().negated().toNumber()
      : decimal.toNumber();
  }

  const parts = text
    .replace(/[°′’']/g, ":")
    .replace(/[″”"]/g, "")
    .replace(/\s+/g, ":")
    .split(":")
    .filter(Boolean)
    .map(Number);

  if (parts.length < 3 || parts.some((v) => !Number.isFinite(v))) {
    throw new Error(`无法解析角度格式：${input}`);
  }

  const [d, m, s] = parts;
  if (m < 0 || m >= 60 || s < 0 || s >= 60) {
    throw new Error(`度分秒格式错误，分和秒必须小于 60：${input}`);
  }

  const sign = d < 0 || direction === "S" || direction === "W" ? -1 : 1;
  const decimal = new Decimal(Math.abs(d))
    .plus(new Decimal(m).div(60))
    .plus(new Decimal(s).div(3600));

  return sign < 0 ? decimal.negated().toNumber() : decimal.toNumber();
}

/**
 * CGCS2000 经纬度正算为国家 2000 高斯平面坐标
 */
export function convertLatLonToNE(
  latInput: number | string,
  lonInput: number | string,
  centralMeridian = DEFAULT_CENTRAL_MERIDIAN,
  falseEasting = DEFAULT_FALSE_EASTING
): { N: number; E: number } {
  const lat = dmsToDecimal(latInput);
  const lon = dmsToDecimal(lonInput);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("经纬度必须是有效数字");
  }

  const B = degToRad(lat);
  const L = degToRad(lon);
  const L0 = degToRad(centralMeridian);

  const e2 = CGCS2000_E2;
  const e4 = e2 * e2;
  const e6 = e4 * e2;

  const ep2 = e2 / (1 - e2);

  const sinB = Math.sin(B);
  const cosB = Math.cos(B);
  const tanB = Math.tan(B);

  const N0 = CGCS2000_A / Math.sqrt(1 - e2 * sinB * sinB);

  const t = tanB;
  const eta2 = ep2 * cosB * cosB;
  const l = L - L0;

  const m0 =
    CGCS2000_A *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * B -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) *
        Math.sin(2 * B) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * B) -
      ((35 * e6) / 3072) * Math.sin(6 * B));

  const N =
    m0 +
    (N0 * t * cosB * cosB * l * l) / 2 +
    (N0 *
      t *
      Math.pow(cosB, 4) *
      Math.pow(l, 4) *
      (5 - t * t + 9 * eta2 + 4 * eta2 * eta2)) /
      24 +
    (N0 *
      t *
      Math.pow(cosB, 6) *
      Math.pow(l, 6) *
      (61 - 58 * t * t + Math.pow(t, 4))) /
      720;

  const E =
    falseEasting +
    N0 * cosB * l +
    (N0 * Math.pow(cosB, 3) * Math.pow(l, 3) * (1 - t * t + eta2)) /
      6 +
    (N0 *
      Math.pow(cosB, 5) *
      Math.pow(l, 5) *
      (5 - 18 * t * t + Math.pow(t, 4) + 14 * eta2 - 58 * eta2 * t * t)) /
      120;

  return { N, E };
}

/**
 * 国家 2000 平面 N/E 转成成都市坐标 X/Y
 */
export function convertNEToChengduXY(
  N: number,
  E: number,
  params: PlaneTransformParams
): { X: number; Y: number } {
  const { tx, ty, a, b } = params;

  const X = tx + a * N - b * E;
  const Y = ty + b * N + a * E;

  return { X, Y };
}

/**
 * React hook
 */
export function useCoordinateTransform() {
  const convertLatLonToChengduXY = useCallback(
    (
      input: LatLonInput,
      params: PlaneTransformParams
    ): CoordResult => {
      const lat = dmsToDecimal(input.lat);
      const lon = dmsToDecimal(input.lon);

      const { N, E } = convertLatLonToNE(
        lat,
        lon,
        params.centralMeridian ?? DEFAULT_CENTRAL_MERIDIAN,
        params.falseEasting ?? DEFAULT_FALSE_EASTING
      );

      const { X, Y } = convertNEToChengduXY(N, E, params);

      return {
        lat,
        lon,
        N,
        E,
        X,
        Y,
      };
    },
    []
  );

  return {
    convertLatLonToChengduXY,
    convertLatLonToNE,
    convertNEToChengduXY,
  };
}
