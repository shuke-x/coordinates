import { RTK_PACKET_PREFIX } from "./constant";
import { parseGngga, type GnggaData } from "./transGngga";
import {
  parseUniheadinga,
  type UniheadingaData,
} from "./transUniheadinga";

/**
 * RTK 单行报文解析结果
 */
export type RtkParsedData = GnggaData | UniheadingaData;

/**
 * 解析单行 RTK 原始报文
 */
export function parseRtkLine(line: string): RtkParsedData | null {
  if (!line || typeof line !== "string") return null;

  const value = line.trim();

  if (
    value.startsWith(RTK_PACKET_PREFIX.GNGGA) ||
    value.startsWith(RTK_PACKET_PREFIX.GPGGA)
  ) {
    return parseGngga(value);
  }

  if (value.startsWith(RTK_PACKET_PREFIX.UNIHEADINGA)) {
    return parseUniheadinga(value);
  }

  return null;
}

/**
 * 解析多行 RTK 原始报文
 */
export function parseRtkText(rawText: string): RtkParsedData[] {
  if (!rawText || typeof rawText !== "string") return [];

  return rawText
    .split(/\r?\n/)
    .map((line) => parseRtkLine(line))
    .filter((item): item is RtkParsedData => Boolean(item));
}
