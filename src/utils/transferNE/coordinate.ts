import Decimal from "decimal.js";
import {
  CHENGDU_HEIGHT_OFFSET,
  CHENGDU_COORDINATE_PARAMS,
  DISPLAY_PRECISION,
} from "./constant";

/**
 * 成都坐标转换参数
 */
export interface ChengduCoordinateParams {
  /** 国家 2000 北坐标基准点 */
  N0: string;

  /** 国家 2000 东坐标基准点 */
  E0: string;

  /** 成都坐标 X 基准点 */
  X0: string;

  /** 成都坐标 Y 基准点 */
  Y0: string;

  /** X 方向 N 分量仿射系数 */
  a: string;

  /** X 方向 E 分量仿射系数 */
  b: string;

  /** Y 方向 N 分量仿射系数 */
  d: string;

  /** Y 方向 E 分量仿射系数 */
  e: string;
}

/**
 * 成都坐标转换结果
 */
export interface ChengduXYResult {
  /** 成都坐标 X，完整计算值 */
  X: string;

  /** 成都坐标 Y，完整计算值 */
  Y: string;

  /** 成都坐标 X，页面显示值，默认保留厘米 */
  XText: string;

  /** 成都坐标 Y，页面显示值，默认保留厘米 */
  YText: string;
}

/**
 * 成都项目高程结果
 */
export interface ChengduHeightResult {
  /** 成都项目高程 H，完整计算值 */
  H: string;

  /** 成都项目高程 H，页面显示值 */
  HText: string;
}

/**
 * 国家 2000 平面坐标结果
 */
export interface ProjectedNEResult {
  /** 国家 2000 北坐标，完整计算值 */
  N: string;

  /** 国家 2000 东坐标，完整计算值 */
  E: string;

  /** 国家 2000 北坐标，页面显示值，默认保留厘米 */
  NText: string;

  /** 国家 2000 东坐标，页面显示值，默认保留厘米 */
  EText: string;

  /** 投影中央经线 */
  centralMeridian: string;
}

/**
 * 经纬度结果
 */
export interface LatLonResult {
  /** 十进制度纬度 */
  latitude: string;

  /** 十进制度经度 */
  longitude: string;

  /** 页面显示纬度 */
  latitudeText: string;

  /** 页面显示经度 */
  longitudeText: string;

  /** 投影中央经线 */
  centralMeridian: string;
}

Decimal.set({
  precision: 30,
  rounding: Decimal.ROUND_HALF_UP,
});

const CGCS2000_A = 6378137;
const CGCS2000_F = 1 / 298.257222101;
const CGCS2000_E2 = CGCS2000_F * (2 - CGCS2000_F);
const CGCS2000_EP2 = CGCS2000_E2 / (1 - CGCS2000_E2);
const DEFAULT_CENTRAL_MERIDIAN = 105;
const DEFAULT_FALSE_EASTING = 500000;

const toRadians = (degree: number) => (degree * Math.PI) / 180;
const toDegrees = (radian: number) => (radian * 180) / Math.PI;

function meridianArc(latitudeRadians: number): number {
  const e4 = CGCS2000_E2 * CGCS2000_E2;
  const e6 = e4 * CGCS2000_E2;

  return CGCS2000_A * (
    (1 - CGCS2000_E2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) *
      latitudeRadians -
    ((3 * CGCS2000_E2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) *
      Math.sin(2 * latitudeRadians) +
    ((15 * e4) / 256 + (45 * e6) / 1024) *
      Math.sin(4 * latitudeRadians) -
    ((35 * e6) / 3072) * Math.sin(6 * latitudeRadians)
  );
}

function formatCoordinate(value: number | Decimal): string {
  return new Decimal(value).toDecimalPlaces(DISPLAY_PRECISION.COORDINATE).toString();
}

function truncateDisplayCoordinate(value: Decimal): string {
  return value
    .toDecimalPlaces(DISPLAY_PRECISION.COORDINATE, Decimal.ROUND_DOWN)
    .toFixed(DISPLAY_PRECISION.COORDINATE);
}

/**
 * 国家 2000 平面坐标 N/E 转成都坐标 X/Y
 *
 * 使用局部原点仿射公式：
 * X = X0 + a × (N - N0) + b × (E - E0)
 * Y = Y0 + d × (N - N0) + e × (E - E0)
 */
export function convertNEToChengduXY(
  N: string | number,
  E: string | number,
  params: ChengduCoordinateParams = CHENGDU_COORDINATE_PARAMS
): ChengduXYResult {
  const n = new Decimal(String(N));
  const easting = new Decimal(String(E));

  const N0 = new Decimal(params.N0);
  const E0 = new Decimal(params.E0);
  const X0 = new Decimal(params.X0);
  const Y0 = new Decimal(params.Y0);

  const a = new Decimal(params.a);
  const b = new Decimal(params.b);
  const d = new Decimal(params.d);
  const e = new Decimal(params.e);

  const dN = n.minus(N0);
  const dE = easting.minus(E0);

  const X = X0.plus(a.times(dN)).plus(b.times(dE));
  const Y = Y0.plus(d.times(dN)).plus(e.times(dE));

  return {
    X: X.toString(),
    Y: Y.toString(),
    XText: truncateDisplayCoordinate(X),
    YText: truncateDisplayCoordinate(Y),
  };
}

/**
 * 成都坐标 X/Y 反算国家 2000 平面坐标 N/E
 */
export function convertChengduXYToNE(
  X: string | number,
  Y: string | number,
  params: ChengduCoordinateParams = CHENGDU_COORDINATE_PARAMS
): ProjectedNEResult {
  const x = new Decimal(String(X));
  const y = new Decimal(String(Y));

  const N0 = new Decimal(params.N0);
  const E0 = new Decimal(params.E0);
  const X0 = new Decimal(params.X0);
  const Y0 = new Decimal(params.Y0);

  const a = new Decimal(params.a);
  const b = new Decimal(params.b);
  const d = new Decimal(params.d);
  const e = new Decimal(params.e);

  const dx = x.minus(X0);
  const dy = y.minus(Y0);
  const determinant = a.times(e).minus(b.times(d));

  const dN = e.times(dx).minus(b.times(dy)).div(determinant);
  const dE = a.times(dy).minus(d.times(dx)).div(determinant);
  const N = N0.plus(dN);
  const E = E0.plus(dE);

  return {
    N: N.toString(),
    E: E.toString(),
    NText: N.toDecimalPlaces(DISPLAY_PRECISION.COORDINATE).toString(),
    EText: E.toDecimalPlaces(DISPLAY_PRECISION.COORDINATE).toString(),
    centralMeridian: String(DEFAULT_CENTRAL_MERIDIAN),
  };
}

/**
 * RTK GGA altitude 转成都项目高程 H。
 */
export function convertAltitudeToChengduH(
  altitude: string | number,
  heightOffset: string | number = CHENGDU_HEIGHT_OFFSET
): ChengduHeightResult {
  const H = new Decimal(String(altitude)).plus(new Decimal(String(heightOffset)));

  return {
    H: H.toString(),
    HText: truncateDisplayCoordinate(H),
  };
}

/**
 * CGCS2000 经纬度转国家 2000 高斯平面坐标 N/E。
 *
 * 默认按成都常用 3 度带中央经线 105E、东坐标假定 500000m 计算。
 */
export function convertLatLonToNE(
  latitude: string | number,
  longitude: string | number,
  centralMeridian = DEFAULT_CENTRAL_MERIDIAN,
  falseEasting = DEFAULT_FALSE_EASTING
): ProjectedNEResult {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("经纬度必须是有效数字");
  }

  const phi = toRadians(lat);
  const lambda = toRadians(lon);
  const lambda0 = toRadians(centralMeridian);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);
  const radiusN = CGCS2000_A / Math.sqrt(1 - CGCS2000_E2 * sinPhi * sinPhi);
  const t = tanPhi * tanPhi;
  const c = CGCS2000_EP2 * cosPhi * cosPhi;
  const a = (lambda - lambda0) * cosPhi;
  const m = meridianArc(phi);

  const northing =
    m +
    radiusN *
      tanPhi *
      (Math.pow(a, 2) / 2 +
        ((5 - t + 9 * c + 4 * c * c) * Math.pow(a, 4)) / 24 +
        ((61 - 58 * t + t * t + 600 * c - 330 * CGCS2000_EP2) *
          Math.pow(a, 6)) /
          720);

  const easting =
    falseEasting +
    radiusN *
      (a +
        ((1 - t + c) * Math.pow(a, 3)) / 6 +
        ((5 - 18 * t + t * t + 72 * c - 58 * CGCS2000_EP2) *
          Math.pow(a, 5)) /
          120);

  return {
    N: String(northing),
    E: String(easting),
    NText: formatCoordinate(northing),
    EText: formatCoordinate(easting),
    centralMeridian: String(centralMeridian),
  };
}

/**
 * 国家 2000 高斯平面坐标 N/E 反算 CGCS2000 经纬度。
 */
export function convertNEToLatLon(
  N: string | number,
  E: string | number,
  centralMeridian = DEFAULT_CENTRAL_MERIDIAN,
  falseEasting = DEFAULT_FALSE_EASTING
): LatLonResult {
  const northing = Number(N);
  const easting = Number(E);

  if (!Number.isFinite(northing) || !Number.isFinite(easting)) {
    throw new Error("N/E 坐标必须是有效数字");
  }

  const e4 = CGCS2000_E2 * CGCS2000_E2;
  const e6 = e4 * CGCS2000_E2;
  const m = northing;
  const mu =
    m /
    (CGCS2000_A *
      (1 - CGCS2000_E2 / 4 - (3 * e4) / 64 - (5 * e6) / 256));
  const e1 =
    (1 - Math.sqrt(1 - CGCS2000_E2)) /
    (1 + Math.sqrt(1 - CGCS2000_E2));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32) *
      Math.sin(4 * mu) +
    ((151 * Math.pow(e1, 3)) / 96) * Math.sin(6 * mu) +
    ((1097 * Math.pow(e1, 4)) / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);
  const n1 = CGCS2000_A / Math.sqrt(1 - CGCS2000_E2 * sinPhi1 * sinPhi1);
  const r1 =
    (CGCS2000_A * (1 - CGCS2000_E2)) /
    Math.pow(1 - CGCS2000_E2 * sinPhi1 * sinPhi1, 1.5);
  const t1 = tanPhi1 * tanPhi1;
  const c1 = CGCS2000_EP2 * cosPhi1 * cosPhi1;
  const d = (easting - falseEasting) / n1;

  const latitude =
    phi1 -
    ((n1 * tanPhi1) / r1) *
      (Math.pow(d, 2) / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * CGCS2000_EP2) *
          Math.pow(d, 4)) /
          24 +
        ((61 +
          90 * t1 +
          298 * c1 +
          45 * t1 * t1 -
          252 * CGCS2000_EP2 -
          3 * c1 * c1) *
          Math.pow(d, 6)) /
          720);

  const longitude =
    toRadians(centralMeridian) +
    (d -
      ((1 + 2 * t1 + c1) * Math.pow(d, 3)) / 6 +
      ((5 -
        2 * c1 +
        28 * t1 -
        3 * c1 * c1 +
        8 * CGCS2000_EP2 +
        24 * t1 * t1) *
        Math.pow(d, 5)) /
        120) /
      cosPhi1;

  const latDegree = toDegrees(latitude);
  const lonDegree = toDegrees(longitude);

  return {
    latitude: String(latDegree),
    longitude: String(lonDegree),
    latitudeText: new Decimal(latDegree).toDecimalPlaces(12).toString(),
    longitudeText: new Decimal(lonDegree).toDecimalPlaces(12).toString(),
    centralMeridian: String(centralMeridian),
  };
}

/**
 * 格式化航向角
 */
export function formatHeading(heading: string | number): string {
  if (heading === "" || heading === undefined || heading === null) return "";

  return new Decimal(String(heading))
    .toDecimalPlaces(DISPLAY_PRECISION.ANGLE)
    .toString();
}
