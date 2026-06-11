
import type { HeadingStatus } from "./constant";

/**
 * UNIHEADINGA 双天线定向解析结果
 */
export interface UniheadingaData {
  /** 数据类型 */
  type: "UNIHEADINGA";

  /** 解算状态，例如 SOL_COMPUTED 表示解算成功 */
  solutionStatus: string;

  /** 定向解类型，例如 NARROW_INT 表示窄巷固定解 */
  positionType: string;

  /** 定向状态，FIXED 代表定向固定 */
  headingStatus: HeadingStatus;

  /** 双天线基线长度，单位 m */
  baselineLength: string;

  /** 航向角，单位 °，通常以真北为 0° 顺时针增加 */
  heading: string;

  /** 俯仰角，单位 ° */
  pitch: string;

  /** 航向角标准差 */
  headingStd: string;

  /** 俯仰角标准差 */
  pitchStd: string;
}

/**
 * 解析 UNIHEADINGA 双天线定向报文
 */
export function parseUniheadinga(line: string): UniheadingaData | null {
  if (!line || typeof line !== "string") return null;

  const cleanLine = line.split("*")[0];
  const parts = cleanLine.split(";");

  if (parts.length < 2) return null;

  const body = parts[1] ?? "";
  const fields = body.split(",");

  if (fields.length < 8) return null;

  const solutionStatus = fields[0] ?? "";
  const positionType = fields[1] ?? "";

  const baselineLength = fields[2] ?? "";
  const heading = fields[3] ?? "";
  const pitch = fields[4] ?? "";

  const headingStd = fields[6] ?? "";
  const pitchStd = fields[7] ?? "";

  const headingStatus: HeadingStatus =
    solutionStatus === "SOL_COMPUTED" && positionType === "NARROW_INT"
      ? "FIXED"
      : "UNFIXED";

  return {
    type: "UNIHEADINGA",
    solutionStatus,
    positionType,
    headingStatus,
    baselineLength,
    heading,
    pitch,
    headingStd,
    pitchStd,
  };
}
