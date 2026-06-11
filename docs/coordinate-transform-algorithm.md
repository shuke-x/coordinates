# 坐标转换算法说明

本文档整理当前项目中 RTK / WGS84 / CGCS2000 / 成都项目坐标的主要转换逻辑，并给出面向 Canvas 高频绘制场景的性能优化建议。

## 1. 坐标链路

当前业务里存在两条入口链路。

### 1.1 RTK 报文入口

代码位置：

- `src/utils/transferNE/transRTKline.ts`
- `src/utils/transferNE/transGngga.ts`
- `src/utils/transferNE/useRtkToChengduCoordinate.ts`

处理流程：

```text
RTK 原始报文
-> 解析 GNGGA / GPGGA
-> 得到纬度 latitude、经度 longitude、altitude
-> 经纬度投影为国家 2000 平面坐标 N/E
-> 国家 2000 N/E 转成都项目 X/Y
-> altitude + 高程改正数 得到项目 H
```

### 1.2 手工输入入口 transWGS84

代码位置：

- `src/views/Test/TransWGS84/index.tsx`
- `src/utils/transferWGS84/useCoordinateTransform.ts`
- `src/utils/transferNE/coordinate.ts`

处理流程：

```text
纬度 B / 经度 L / 椭球高 H
-> 可投影得到原始国家 2000 N/E 作为核对
-> 如果手动填写国家 2000 N/E，则优先使用手填 N/E
-> 如果未填写 N/E，则使用 B/L 投影结果 + 项目 N/E 校正量
-> 国家 2000 N/E 转成都项目 X/Y
-> 椭球高 H 直接作为结果 H 展示
```

当前 `transWGS84` 的核心原则是：**国家 2000 平面坐标 N/E 是成都 X/Y 计算的直接输入层**。如果用户填写了成果表里的 N/E，就以成果表 N/E 为准。

## 2. 输入过滤和角度解析

代码位置：`src/utils/transferWGS84/useCoordinateTransform.ts`

### 2.1 经纬度输入过滤

允许输入：

```text
数字、正负号、小数点、冒号、空格、度分秒符号、N/S/E/W
```

会统一规范化：

```text
：、∶ -> :
。、． -> .
数字内部空格会被移除
小数点后的空格会被移除
```

示例：

```text
30：30：54。 69607 -> 30:30:54.69607
103∶57∶54．20206 -> 103:57:54.20206
```

### 2.2 DMS 转十进制度

支持格式：

```text
30:30:54.69607
30：30：54.69607
30°30′54.69607″
30 30 54.69607
30:30:54.69607N
30.51519335
```

DMS 公式：

```text
decimal = degree + minute / 60 + second / 3600
```

如果方向为 `S` 或 `W`，结果取负数。

校验规则：

```text
minute 必须 >= 0 且 < 60
second 必须 >= 0 且 < 60
```

## 3. 经纬度到国家 2000 N/E

代码位置：

- `src/utils/transferNE/coordinate.ts`
- `src/utils/transferWGS84/useCoordinateTransform.ts`

当前投影参数：

```text
椭球：CGCS2000
a = 6378137.0
f = 1 / 298.257222101
中央经线 = 105E
假东偏 = 500000m
```

核心步骤：

1. 将纬度、经度转弧度。
2. 按 CGCS2000 椭球计算第一偏心率平方 `e2`。
3. 计算子午线弧长 `M`。
4. 计算卯酉圈曲率半径。
5. 使用高斯投影正算公式得到：

```text
N = northing
E = easting
```

在 `transWGS84` 页面中，B/L 投影得到的原始 N/E 会作为 `rawN/rawE` 展示，便于核对。

## 4. 国家 2000 N/E 到成都项目 X/Y

代码位置：`src/utils/transferNE/coordinate.ts`

当前成都项目参数在 `src/utils/transferNE/constant.ts`：

```text
N0 = 3377681.686
E0 = 400659.307
X0 = 202623.775
Y0 = 209808.803
a  = 0.997786536
b  = 0.007155397
d  = -0.008156120
e  = 1.000085690
```

转换公式：

```text
dN = N - N0
dE = E - E0

X = X0 + a * dN + b * dE
Y = Y0 + d * dN + e * dE
```

这是一组以项目控制点为局部原点的仿射转换。当前实现使用 `decimal.js` 计算，避免普通浮点在展示前产生明显尾差。

基准点校验：

```text
输入 N = 3377681.686, E = 400659.307
输出 X = 202623.775, Y = 209808.803
```

## 5. 高程 H 处理

### 5.1 RTK 报文入口

代码位置：`src/utils/transferNE/coordinate.ts`

当前 RTK 报文入口使用：

```text
项目 H = GGA altitude + CHENGDU_HEIGHT_OFFSET
CHENGDU_HEIGHT_OFFSET = 66.6652
```

该偏移来自样例反推：

```text
GGA altitude 440.3308m -> 项目 H 506.996m
```

### 5.2 transWGS84 手工入口

`transWGS84` 页面字段定义为：

```text
椭球高 H(m)
```

当前页面直接展示输入的 H，不再叠加 `CHENGDU_HEIGHT_OFFSET`。这是因为用户输入的第三个值已经被定义为椭球高 H。

## 6. 展示精度规则

代码位置：

- `src/utils/transferNE/constant.ts`
- `src/utils/transferNE/coordinate.ts`
- `src/views/Test/TransWGS84/index.tsx`

当前展示规则：

```text
保留 3 位小数
不四舍五入
使用 Decimal.ROUND_DOWN 截断
```

示例：

```text
202623.7759 -> 202623.775
202623.7751 -> 202623.775
```

注意：完整计算值仍保留在内部结果中，页面展示值才截断。

## 7. transWGS84 输入优先级

页面逻辑：

1. 如果完全没有输入，展示空状态。
2. 如果只填了 N 或只填了 E，提示必须同时填写 N/E。
3. 如果填写了 N/E：

```text
优先使用手填 N/E -> 成都 X/Y
```

4. 如果未填写 N/E，但填写了 B/L：

```text
B/L -> 投影原始 N/E -> 加项目 N/E 校正量 -> 成都 X/Y
```

当前项目 N/E 校正量：

```text
N correction = 0.000524389
E correction = -0.0002154596
```

该校正量用于使样例：

```text
B = 30:30:54.69607
L = 103:57:54.20206
```

投影校正后回到成果表：

```text
N = 3377681.686
E = 400659.307
```

## 8. 已验证样例

### 8.1 基准点

```text
N = 3377681.686
E = 400659.307

X = 202623.775
Y = 209808.803
```

### 8.2 N 增加 1m

```text
N = 3377682.686
E = 400659.307

X = 202624.772
Y = 209808.794
```

### 8.3 E 增加 1m

```text
N = 3377681.686
E = 400660.307

X = 202623.782
Y = 209809.803
```

### 8.4 任意偏移点

```text
N = 3377700.123
E = 400700.456

X = 202642.465
Y = 209849.805
```

## 9. Canvas 高频更新性能优化建议

以下建议不改变现有业务逻辑，只调整执行方式。

### 9.1 高频路径避免 React state 驱动画布

Canvas 高频绘制不建议每帧 `setState`。建议：

```text
RTK 数据流 -> ref / 外部数据缓冲 -> requestAnimationFrame -> canvas draw
```

React state 只用于低频 UI 展示，例如每 200ms 或 500ms 更新一次文本面板。

### 9.2 预计算固定参数

当前 `convertNEToChengduXY` 每次都会创建这些 Decimal：

```text
N0, E0, X0, Y0, a, b, d, e
```

高频场景建议在初始化时预创建一次：

```text
const paramsDecimal = {
  N0: new Decimal(...),
  E0: new Decimal(...),
  ...
}
```

每个点只创建输入 `N/E` 和结果所需的 Decimal。

### 9.3 内部计算使用 number，展示再用 Decimal

如果 Canvas 每秒几十到上百次绘制，且只用于屏幕轨迹显示，可以考虑：

```text
实时绘制计算：number
最终文本展示 / 记录 / 导出：Decimal 截断
```

理由：

- Canvas 像素绘制本身无法表达毫米级 Decimal 精度。
- `decimal.js` 对象创建和运算成本明显高于 number。
- 保持最终展示仍用 Decimal，可以不改变页面精度规则。

建议保留两套函数：

```text
convertNEToChengduXYFastNumber(N, E)  // 高频绘制
convertNEToChengduXY(...)            // 精确展示、保存
```

### 9.4 不要在每帧解析 DMS 字符串

DMS 解析涉及正则、字符串替换、Decimal。高频场景中应避免每帧执行：

```text
30:30:54.69607 -> decimal degree
```

建议：

- 用户输入时解析一次。
- RTK 报文进入时解析一次。
- 后续绘制只传数值坐标。

### 9.5 批量处理坐标点

如果 Canvas 要画历史轨迹，不要每帧重新转换全部历史点。建议：

```text
新增点到来 -> 转换一次 -> 存入轨迹数组
每帧绘制 -> 只读取已转换的 X/Y
```

历史点结构可以是：

```ts
type TrackPoint = {
  x: number;
  y: number;
  h?: number;
  time: number;
};
```

### 9.6 使用局部画布坐标缓存

成都项目 X/Y 到 Canvas 像素还需要一次视图变换：

```text
screenX = (X - originX) * scale + offsetX
screenY = offsetY - (Y - originY) * scale
```

建议把 `originX/originY/scale/offset` 作为视图参数缓存，只有缩放或平移变化时再重新计算历史点屏幕坐标。

### 9.7 控制绘制频率

RTK 数据频率可能高于屏幕刷新需求。建议：

```text
数据接收：按原始频率处理最新点
Canvas 绘制：requestAnimationFrame，最多 60fps
文本 UI：节流到 2-5fps
```

### 9.8 避免频繁分配临时对象

在动画循环里避免：

```text
map/filter/reduce
大量对象字面量
new Decimal
新建 Path2D
```

可以复用数组、复用临时变量，并按需裁剪历史轨迹长度。

### 9.9 Web Worker 可作为后续方案

如果后续存在大量历史点回放或批量坐标转换，可以把转换放到 Web Worker：

```text
主线程：Canvas 绘制和交互
Worker：RTK 解析、坐标转换、轨迹降采样
```

但当前阶段优先做预计算和节流，通常已经足够。

## 10. 推荐的高频处理结构

建议结构：

```text
RTK/WebSocket/串口数据
-> parse once
-> coordinate transform once
-> push TrackPoint
-> requestAnimationFrame draw
-> throttled React state update
```

伪代码：

```ts
const latestPointRef = useRef<TrackPoint | null>(null);
const trackRef = useRef<TrackPoint[]>([]);

function onRtkData(data: RtkData) {
  const ne = getNE(data);
  const xy = convertNEToChengduXYFastNumber(ne.N, ne.E);

  const point = {
    x: xy.X,
    y: xy.Y,
    h: data.height,
    time: Date.now(),
  };

  latestPointRef.current = point;
  trackRef.current.push(point);
}

function drawLoop() {
  drawCanvas(trackRef.current, latestPointRef.current);
  requestAnimationFrame(drawLoop);
}
```

这样可以避免 React 重渲染成为 Canvas 高频绘制的瓶颈。

