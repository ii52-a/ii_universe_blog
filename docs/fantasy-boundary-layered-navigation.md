# fantasy-boundary 分层寻路实现与接入规划

## 交付范围

技术栈为 TypeScript + Three.js。`src/experiments/rainy-konbini/layered-navigation/` 提供分层图、A*、运动状态机及碰撞后端，现已通过场景适配器切换到游戏默认运行链路，无需开启实验开关。

### 当前默认运行链路

- `CrowdSolver` 是混合求解入口：支持 60 只丧尸，共同目标共享反向距离场，最多四个独立目标同时获得增量 A*。A* 和共享场共用整轮时间/节点预算，困难查询继续使用共享场兜底。单个邻接生成仍为不可抢占操作，时间预算为软限制。
- `SceneAStar` 按需生成带高度/表面/法线的图，真实角色位置和目标作为临时端点接入；停止在预算上限不会被误报为不可达。结果保留四种 EdgeType 和弹道。
- `NavigationWorld` 的 Worker 快照与 `WalkingController.zombieWorld` 的实时世界共同使用 `SceneNavigationWorld` 适配器。实体盒做连续身体扫掠；现有解析地形沿线以 2cm 采样检查，尚不是任意三角网格的严格连续碰撞。
- `ZombieMode` 默认使用 `LocomotionFollower` 执行弹道，起跳、空中每帧及着陆重验证。动态阻挡发生时回到最后安全位置，取消路径并交回重力控制，不瞬移到落点。地面运动经 follower 的地面 motor 接口复用 WalkingPhysics，保留局部避让与台阶行为。
- 世界 `navigationRevision` 改变后重建 Worker/主线程求解器、清空旧请求和地面路径；拒收旧 revision 的结果。动态门直接参与实时扫掠，无需每帧重建整图。
- 监测字段 `combat.metrics.engine === 'layered-hybrid'`，`astar` 表示当前独立搜索数；`backend` 继续区分 worker/main-budgeted。
- 坡道中间站、攀墙、感知、战斗、动画及落点排队保留。攻击高度容差由 .34 收紧至 .15，避免追逐者停在楼梯上提前攻击楼上目标。

以下“现有实现分析”记录切换前的依据；“迁移步骤”保留设计背景，其中动作统一、独立 A*、实时弹道碰撞和版本失效已完成，后续仍可完善分块预烘焙和无硬编码坡道连接。

模块：

| 文件 | 功能 |
| --- | --- |
| `types.ts` | 三维节点、表面 ID/法线、有向边、四类动作、参数和世界查询接口 |
| `GraphBuilder.ts` | 多层采样、空间桶邻接、贴地连接、跳跃求解、连续扫掠验证 |
| `AStar.ts` | 二叉堆、松弛与过期队列项过滤、路径回溯、预算退出 |
| `LocomotionFollower.ts` | idle/walk/airborne/arrived/blocked 状态机 |
| `BoxWorld.ts` | 实体 AABB、架空楼板和线性斜坡/地形后端 |
| `index.ts` | 公共入口 |

## 现有实现分析

1. `CrowdNavigation.ts` 不是传统 2D A*。节点键为 `round(x/.2),round(z/.2),round(y*10)`，已经区分大部分重叠楼层；但 Y 量化不能替代稳定的表面 ID，距离小于量化精度的表面可能合并。
2. 当前求解器是共享反向 Dijkstra 距离场。最多选择四个活跃目标，保留八个近期距离场；普通节点用 .4 米网格，复杂位置细化至 .2 米。Worker 每轮预算 4ms/180 节点，主线程回退 2ms/48 节点。48 只上限下，这比每只独立重复全图搜索更合适。预算以展开轮次检查，单个邻接生成仍可能超过时间预算。
3. `NavigationWorld.ts` 已实现支持面查询、步行连接、重力跳跃、障碍检测和反向邻接。`incomingJumps` 只检查四个轴向与六档距离，可能漏掉斜向平台；同高度跳跃仅在检测到矮障碍时生成，因此开放断口可能漏边。
4. 现有 `NavWaypoint` 只有 `jump?: true`，不能表达坡面、上跳与下落的差别。反向搜索必须保存“前驱到当前节点”的动作方向，不能按搜索展开方向判断上跳/下落。
5. `ZombieMode.ts` 已有空中输入隔离、起跳重验证、着陆位置占用协调、局部避让、目标版本检查；`WalkingPhysics.ts` 有重力和 1/120 秒子步。无需重复替换感知、战斗、动画和避让。
6. 飞行阶段使用 `jumpPosition` 直接设置位置，没有逐帧动态扫掠；现有起跳规划对门包围盒额外扩张 .8 米缓解了部分风险，但不等于动态障碍碰撞处理。
7. `hillsideGateway` 为已知坡道提供硬编码中间站；`tryClimb` 可以触发约 4.3 米的攀墙，能力超出这次 WALK/SLOPE/JUMP_UP/DROP_DOWN 模型。删除它会改变玩法，迁移时应保留为独立动作，或在严格能力模式禁用。
8. `NavigationSnapshot` 带 revision；目前初始化构造求解器，未看到 Worker 接收增量 revision 更新的协议。新加载几何/可变场景需要明确失效策略，不能只清目标版本。

## 数学与行为约定

所有位置代表脚底，单位为米、秒。一个 XZ 单元可以生成任意多个 Node，每个节点保留 layer 与 normal。八邻域 WALK/SLOPE 边要求端点高度差不超过 maxStepHeight，并逐段检查支持和实体碰撞；仅比较端点高度不充分。

上跳限制是 `dy <= maxJumpHeight`；下落限制是 `-dy <= maxDropHeight`，两者都限制水平跨度。非相邻断口允许 `dy=0` 的跳跃，动作归入 JUMP_UP。连续可走的区域不添加冗余长跳边。DROP_DOWN 是带短促起跳的下落，方便越过平台边缘；并非要求初始垂直速度恒为零。

固定起跳速度及下降阶段到达目标的根为：

```
vy = sqrt(2*g*maxJumpHeight)
D = vy*vy - 2*g*(y1-y0)
T = (vy + sqrt(D)) / g
vx = (x1-x0)/T, vz = (z1-z0)/T
y(t) = y0 + vy*t - g*t*t/2
```

检查判别式、正时长、`hypot(vx,vz) <= maxAirSpeed`、起终点支持及整条弧线。默认参数接近旧玩法：g=13，maxJumpHeight=.79，跨度 1.65，跌落 3.8，身高 1.84；旧实现对超过 1.2 米的下落允许 2.8 米跨度，而新实现按统一 maxJumpDistance，因此直接采用默认值会缩短部分下落连接。

每小段抛物线位于弦线之上，最大偏差为 `g*dt²/8`。对身体做连续 AABB 扫掠，将此偏差加到头顶，而不向脚底膨胀，从而避免落点支撑面被误判。BoxWorld 使用 Minkowski 扩张及 slab 相交，薄墙不会因恰好处在采样点之间被漏检。它以方形截面近似身体，比圆柱保守。

代价和启发函数采用同一度量：

```
d(a,b) = sqrt(dx² + dy² + dz²) + verticalWeight*abs(dy)
cost(edge) = d(a,b) + nonnegativeActionPenalty
h(n) = d(n,goal)
```

欧氏距离与绝对高度差都满足三角不等式，因此 h 一致且可采纳。不能仅抬高 h 的垂直项而保持边代价不变，否则可能高估。最短路径保证仅针对生成的离散图；不代表连续世界中的全局最优。

路径是 `{node,type,arc?}[]`，即附带已验证弹道的 `[Node,EdgeType]` 序列。type 表示到达当前节点所用的入边，首项为 null。平地沿 XZ 线性推进并查询支持面；空中沿同一条物理弹道运动，拒绝途中换路。起跳、飞行和着陆都会验证碰撞/支持。图版本变化时，地面路径进入 blocked；飞行继续逐段扫掠安全着陆，随后要求重规划。

## 最小集成示例

下面可放在同级目录的实验入口；世界不依赖 Three.js，模型只读取 position。

```ts
import {
  BoxWorld, buildGraph, findPath, LocomotionFollower,
} from './layered-navigation';

const world = new BoxWorld([
  {min:{x:-2,y:-.2,z:-1}, max:{x:0,y:0,z:1}, layer:'lower'},
  {min:{x:.8,y:-.2,z:-1}, max:{x:3,y:.7,z:1}, layer:'platform'},
]);
const graph = buildGraph(world, {minX:-1,maxX:2,minZ:0,maxZ:0}, {
  cellSize:.2, maxJumpHeight:1, maxJumpDistance:2,
});
const start = graph.nodes[0];
const goal = graph.nodes[graph.nodes.length-1];
const result = findPath(graph, start.id, goal.id, 10000);
const follower = new LocomotionFollower(start, world, graph.config);
if (result.status === 'found') follower.setPath(result.path, graph.revision);
// 每帧：
// const p = follower.update(deltaSeconds);
// zombie.model.root.position.set(p.x,p.y,p.z);
// follower.inputLocked 为 true 时停止 steering 对位置的写入。
// blocked 时将当前位置交给既有 WalkingPhysics，保留空中速度并重规划。
```

Three.Box3 可通过复制 `min/max` 转成 BoxWorld 的 Box。架空楼板必须保留实际厚度，不能作为向下无限实心的 TerrainPatch；坡面用 `y=baseY+slopeX*x+slopeZ*z` 的有界 TerrainPatch。surface 查询和 sweep 查询必须描述同一几何。

目前 setPath 要求演员位于首节点（误差 1e-5），防止错误楼层吸附和起跳瞬移。任意位置接入需先验证到附近图节点的地面连接，或创建临时起点/终点边；不能直接选欧氏最近节点并瞬移。示例从图节点出生，完整满足该约束。

## 迁移设计与后续验收

1. **统一动作数据，低风险。** 为旧 NavWaypoint/Edge 增加四种动作及弹道数据，暂保留 jump 兼容字段。反向距离场、路径平滑、Worker 序列化和 ZombieMode 同步消费动作；禁止平滑越过起跳点。沿用现有共享场。
2. **接入真实碰撞世界，中等工作量。** 用已有静态盒、楼板盒和解析地形实现 World。`terrainSupport(x,z,ceiling)` 可由高到低枚举楼层，但需要返回稳定 surface ID 和法线；不能只用 groundHeight。对非平面地形需实现相应连续体扫掠或保守误差界，不能把点射线当作身体检测。门和新加载区域以 revision 更新图缓存。
3. **执行器桥接，中等风险。** 用新增 follower 控制移动动作，把感知、战斗、动画、避让和落点预约保留在 ZombieMode。暴露失败原因及空中速度给 WalkingPhysics：撞顶/撞墙后先交还重力控制，着陆后再规划；不能将 blocked 直接设置 grounded。增加离网起终点连接与局部绕行后的重新接入。
4. **补充 A*，按目标类型选路。** 共用目标继续反向距离场，独立调查目标/局部跨层请求用新增 A*。预算状态 budget 不是 unreachable；调用者增加预算重试或改造为持久增量搜索。大场景先分块/在 Worker 构图，不在渲染循环同步全量执行。
5. **移除特例，最后处理。** 真实全层图确认能走坡道后再替换 hillsideGateway。攀墙单独保留或由玩法开关禁用，不伪装为超过跳高限制的 JUMP_UP。

验收覆盖上下层同 XZ 不串层、坡道上下行、斜向平台、同高度跨沟、超高/超远/超深拒绝、头顶楼板、薄墙、门中途关闭、落点被占、低帧率、目标在空中移动、楼层加载失效和多人追逐。现有 `zombie-traversal-check.mjs`、`zombie-mode-check.mjs`、`navigation-refinement-check.mjs` 应在真正切换场景后端后继续运行。

## 性能及适用边界

- 构图在半径 maxJumpDistance 的 XZ 桶中找邻居，避免全图两两比较；仍有约 `N*(R/cellSize)^2*平均层数` 的候选成本，每候选还可能扫掠。当前实现适合小范围图及验证，未宣称完成全街区性能优化。
- BoxWorld 为完整但简单的后端，线性遍历碰撞盒。场景集成时复用 SpatialGrid 广相位、分块生成和边缓存。
- 规则采样可能漏掉比 cellSize 小的平台/窄门；需要补充平台边缘、门洞和坡道入口的显式节点。半径、采样间距和地形尺寸需统一标定。
- BoxWorld 的支持采用脚中心，斜坡按角色控制器常见的脚中心平面接触处理；没有完整足底支撑多边形检测。窄杆/窄栏杆若不可站，应在 surfaces 中过滤或增加足底支撑验证。
- 固定最大起跳速度会拒绝一些低顶下可用低弧线通过的路径；可按多个 apex 高度尝试，仍须使用相同扫掠验证。
- follower 单帧最多推进 .25 秒以限制工作量，较长挂起会减慢模拟；未实现根运动、群体避让或自动重规划，这些仍由现有 ZombieMode 负责。

验证命令：`node scripts/layered-navigation-check.mjs`、`npm run check`。单元测试直接编译执行 TypeScript 模块。开发服务器启动在 4173 后，可运行 `node scripts/layered-scene-check.mjs` 检查混合入口、离网 A* 端点、动作序列、实时薄门碰撞和版本拒收；再运行 `node scripts/zombie-traversal-check.mjs` 与 `node scripts/zombie-mode-check.mjs` 验证实际玩法。`navigation-refinement-check.mjs` 实际覆盖百科加载和星图导航，不属于丧尸寻路验收。
