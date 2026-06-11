import {
  createDefaultRtkState,
  handleRtkLine,
} from "./rtk/rtkState";
import { convertNEToChengduXY } from "./rtk/coordinate";
import { calcOffset } from "./rtk/offset";

let rtkState = createDefaultRtkState();

const gga =
  "$GNGGA,093652.00,3001.69590045,N,10346.53684317,E,4,44,0.4,440.3308,M,-42.9791,M,2.0,1416*7A";

const heading =
  '#UNIHEADINGA,85,GPS,FINE,2416,553030000,0,0,18,16;SOL_COMPUTED,NARROW_INT,3.3288,213.7679,0.5613,0.0000,0.0821,0.1351,"999",47,43,43,37,3,01,3,f3*8982273b';

rtkState = handleRtkLine(rtkState, gga);
rtkState = handleRtkLine(rtkState, heading);

console.log(rtkState);

// 如果设备后续能直接输出国家 2000 N/E，则直接转成都坐标
const chengduPoint = convertNEToChengduXY(
  "3377681.686",
  "400659.307"
);

rtkState.chengduX = chengduPoint.X;
rtkState.chengduY = chengduPoint.Y;

// 计算和设计桩位的偏差
const offset = calcOffset(
  chengduPoint.X,
  chengduPoint.Y,
  "202624.000",
  "209809.000"
);

console.log({
  currentX: chengduPoint.XText,
  currentY: chengduPoint.YText,
  offsetX: offset.offsetXText,
  offsetY: offset.offsetYText,
  distance: offset.distanceText,
});
