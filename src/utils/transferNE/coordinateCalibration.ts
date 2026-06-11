import {
  CHENGDU_COORDINATE_PARAMS,
  CHENGDU_ELLIPSOID_HEIGHT_OFFSET,
} from "./constant";
import type { ChengduCoordinateParams } from "./coordinate";

export type CoordinateCalibrationConfig = {
  params: ChengduCoordinateParams;
  heightOffset: string;
  northingCorrection: string;
  eastingCorrection: string;
  source: "default" | "control-points";
  updatedAt: number;
};

export const COORDINATE_CALIBRATION_STORAGE_KEY =
  "coordinates.currentCalibration";

export const DEFAULT_COORDINATE_CALIBRATION: CoordinateCalibrationConfig = {
  params: CHENGDU_COORDINATE_PARAMS,
  heightOffset: CHENGDU_ELLIPSOID_HEIGHT_OFFSET,
  northingCorrection: "0.000524389",
  eastingCorrection: "-0.0002154596",
  source: "default",
  updatedAt: 0,
};

function isCalibrationConfig(value: unknown): value is CoordinateCalibrationConfig {
  if (!value || typeof value !== "object") return false;

  const config = value as CoordinateCalibrationConfig;
  const params = config.params;

  return Boolean(
    params &&
      typeof params.N0 === "string" &&
      typeof params.E0 === "string" &&
      typeof params.X0 === "string" &&
      typeof params.Y0 === "string" &&
      typeof params.a === "string" &&
      typeof params.b === "string" &&
      typeof params.d === "string" &&
      typeof params.e === "string" &&
      typeof config.heightOffset === "string" &&
      typeof config.northingCorrection === "string" &&
      typeof config.eastingCorrection === "string"
  );
}

export function loadCoordinateCalibration(): CoordinateCalibrationConfig {
  if (typeof window === "undefined") {
    return DEFAULT_COORDINATE_CALIBRATION;
  }

  try {
    const raw = window.localStorage.getItem(COORDINATE_CALIBRATION_STORAGE_KEY);
    if (!raw) return DEFAULT_COORDINATE_CALIBRATION;

    const parsed = JSON.parse(raw) as unknown;
    return isCalibrationConfig(parsed)
      ? parsed
      : DEFAULT_COORDINATE_CALIBRATION;
  } catch {
    return DEFAULT_COORDINATE_CALIBRATION;
  }
}

export function saveCoordinateCalibration(
  config: Omit<CoordinateCalibrationConfig, "updatedAt">
): CoordinateCalibrationConfig {
  const nextConfig: CoordinateCalibrationConfig = {
    ...config,
    updatedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      COORDINATE_CALIBRATION_STORAGE_KEY,
      JSON.stringify(nextConfig)
    );
  }

  return nextConfig;
}
