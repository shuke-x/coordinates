import Decimal from "decimal.js";
import { DISPLAY_PRECISION } from "./constant";

/**
 * 桩位偏差计算结果
 */
export interface OffsetResult {
  /** X 方向偏差，完整计算值，单位 m */
  offsetX: string;

  /** Y 方向偏差，完整计算值，单位 m */
  offsetY: string;

  /** 平面距离偏差，完整计算值，单位 m */
  distance: string;

  /** X 方向偏差页面显示值，默认保留厘米 */
  offsetXText: string;

  /** Y 方向偏差页面显示值，默认保留厘米 */
  offsetYText: string;

  /** 平面距离偏差页面显示值，默认保留厘米 */
  distanceText: string;
}

/**
 * 计算当前位置和设计桩位之间的平面偏差
 */
export function calcOffset(
  currentX: string | number,
  currentY: string | number,
  designX: string | number,
  designY: string | number
): OffsetResult {
  const cx = new Decimal(String(currentX));
  const cy = new Decimal(String(currentY));
  const dx = new Decimal(String(designX));
  const dy = new Decimal(String(designY));

  const offsetX = cx.minus(dx);
  const offsetY = cy.minus(dy);
  const distance = offsetX.pow(2).plus(offsetY.pow(2)).sqrt();

  return {
    offsetX: offsetX.toString(),
    offsetY: offsetY.toString(),
    distance: distance.toString(),

    offsetXText: offsetX
      .toDecimalPlaces(DISPLAY_PRECISION.DISTANCE)
      .toString(),

    offsetYText: offsetY
      .toDecimalPlaces(DISPLAY_PRECISION.DISTANCE)
      .toString(),

    distanceText: distance
      .toDecimalPlaces(DISPLAY_PRECISION.DISTANCE)
      .toString(),
  };
}
