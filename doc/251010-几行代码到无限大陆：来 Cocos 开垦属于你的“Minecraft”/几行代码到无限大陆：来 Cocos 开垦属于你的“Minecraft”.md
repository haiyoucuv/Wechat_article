# 几行代码到无限大陆：来 Cocos 开垦属于你的“Minecraft”

> 朋友们好啊，我是99年码农还有醋v。刚才有个朋友问我，醋老师发生肾莫事了，我说怎么回事，给我发了几张截图。我一看，哦，源赖氏佐田，有两个建模师，30多岁，一个高级建模师，一个建模专家。他们说，诶，有一个说是我在雕地形，劲椎雕坏了，醋老师能不能给我写哥代码自动生成地形，诶，帮助治疗一下我的颈椎病。我说可以。我说你在雕地形练死劲，不好用，他不服气。诶，我说小朋友，你看看我这个噪声生成。他说你这也没用。我说我这个有用，这是化劲，噪声生成是讲化劲的，四两拨千斤...


大家好，以上只是**码农被裁之前的幻想**罢了，但是今天我会为大家揭秘地形生成的底层技术，那就是今天主题：**如何用噪声函数在 Cocos Creator 里生成无限可玩的地形**。同时在片尾会附上一个懒人demo，需要的小伙伴可以自行购买研究。这玩意儿不只是**码农的自嗨**，它是《Minecraft》、《Terraria》、《No Man’s Sky》这种大作背后的核心技术之一！

![](https://mmbiz.qpic.cn/mmbiz_gif/YibUo5RLQh4GmorBAzJFE6HTpiafvShVPsJWBV4Oe5KE49Vibc03D1vvjJNmiaB2CiaF01w8yL3VK1fXeiaJCuzhSUWg/640?wx_fmt=gif&amp;from=appmsg)

---

## 1. 关键技术 —— 噪声

先说清楚，咱们这里说的“噪声”，不是电流里的那种杂音，而是指 **一种连续的伪随机函数**。

以下是常见的噪声生成函数：

- **Perlin Noise**（柏林噪声）：经典，很多老游戏用。
- **Simplex Noise**：改进版，性能更好。
- **OpenSimplex Noise**：社区维护的版本，专门解决专利和维度问题。

它们的特点就是：

1. 看起来像随机，但其实是连续的。
2. 相邻的输入点，输出不会差太多，像自然界里的山脉、河流一样。
3. 输入坐标可以无限扩展，所以理论上能生成无限地图。

以下是使用柏林噪声和白噪声（纯随机）的对比图，可以看到柏林噪声生成的数值是连续的

![](https://img.md2card.com/img/2025-10-10/1760098824044-clipboard-image.png)

关于噪声的原理这里就不再过多解释了，大家可以自行百度一下，我们这里主要还是关注应用

---

## 2. 游戏里怎么用？

很多你耳熟能详的游戏，都在背后默默用着这项技术：

| 游戏名称           | 类型        | 噪声应用场景                       | 特点与效果                    |
| ------------------ | ----------- | ---------------------------------- | ----------------------------- |
| **Minecraft**      | 沙盒建造    | 地形（平原、山脉、洞穴）、矿脉分布 | 经典案例，无限方块世界        |
| **Terraria**       | 2D 沙盒冒险 | 地下洞穴系统、地形起伏             | 横版随机地图，每局不同        |
| **No Man’s Sky**   | 太空探索    | 星球地貌、动植物生态、气候         | 分形+噪声生成，几乎无限的宇宙 |

![](https://img.md2card.com/img/2025-10-10/1760098846980-clipboard-image.jpg)

---

## 3. 在 Cocos Creator 里实践：用噪声生成地形

光说原理可能有点抽象，咱们直接来点实战。  
在 Cocos Creator 里，配合 **OpenSimplexNoise** 和 **Terrain** 组件，我们可以很快就搞出一个“无限地图的雏形”。

我们这里将会使用开源的`open-simplex-noise`库，可以直接使用`npm`安装然后在Cocos工程中使用

---

### 3.1 最简单的噪声生成

我们先写一个最简单的函数：直接用噪声生成高度，不加任何花里胡哨的参数。

```ts
import { _decorator, Component, Terrain, CCInteger, HeightField } from 'cc';
import OpenSimplexNoise from "open-simplex-noise";
import { type Noise2D } from "open-simplex-noise/lib/2d";

const { makeNoise2D } = OpenSimplexNoise;
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('TerrainDemo')
@executeInEditMode(true) // 关键！让脚本在编辑器模式下运行
export class TerrainDemo extends Component {

  @property(Terrain)
  public terrain: Terrain = null!;

  @property({ type: CCInteger, range: [0, 999999, 1] })
  public seed: number = 12345;

  // 编辑器按钮：生成地形
  @property({
    displayName: "🎲 生成地形",
    tooltip: "点击生成基础噪声地形"
  })
  get generateButton() { return false; }
  set generateButton(value: boolean) {
    if (value) this.generateTerrain();
  }

  private noise2D: Noise2D;

  onLoad() {
    this.noise2D = makeNoise2D(this.seed);
  }

  // 最简单的噪声高度生成
  private generateHeight(x: number, z: number): number {
    // 直接返回噪声值，范围 [-1, 1]
    return this.noise2D(x, z);
  }

  // 生成地形的核心方法
  public generateTerrain() {
    console.log('开始生成基础噪声地形...');

    const info = this.terrain.info;
    const tileCount = info.tileCount;
    const tileSize = info.tileSize;

    // 创建高度场
    const heightField = new HeightField(tileCount[0], tileCount[1]);

    // 计算地形的世界尺寸
    const terrainWorldWidth = tileCount[0] * tileSize;
    const terrainWorldHeight = tileCount[1] * tileSize;
    const startWorldX = -terrainWorldWidth / 2;
    const startWorldZ = -terrainWorldHeight / 2;

    // 为每个瓦片生成高度
    for (let z = 0; z < tileCount[1]; z++) {
      for (let x = 0; x < tileCount[0]; x++) {
        const worldX = startWorldX + x * tileSize;
        const worldZ = startWorldZ + z * tileSize;

        // 使用最简单的噪声生成
        const noiseValue = this.generateHeight(worldX, worldZ);

        // 转换为 Cocos Creator 地形高度格式
        const finalHeight = 32768 + noiseValue * 1000; // 简单缩放

        heightField.set(x, z, finalHeight);
      }
    }

    // 应用到地形
    this.terrain.importHeightField(heightField, 1);
    this.terrain.rebuild(this.terrain.info);

    console.log('基础地形生成完成！');
  }
}
```

在编辑器中新建地形节点并绑定好脚本

然后点击编辑器中的**🎲 生成地形**我们就可以直接在编辑器中看到效果了

这样得到的地形，我们可以看到地形是连续的而不是跳变的

但是目前这个状态可以说是完全不可用，但是别着急我们还有操作

![](https://img.md2card.com/img/2025-10-10/1760098867299-clipboard-image.png)

### 3.2 添加高度缩放控制

原始噪声值的范围通常在 [-1, 1] 之间，这个范围对于地形高度来说太小了。我们需要一个参数来控制地形的整体高度范围，这就是 `heightScale`。

**在组件中添加属性**：

**改进 generateHeight 方法**：

```ts
@ccclass('TerrainDemo')
@executeInEditMode(true)
export class TerrainDemo extends Component {
  /** ... */

  @property
  public heightScale: number = 20; // 高度缩放

  private generateHeight(x: number, z: number): number {
    const n = this.noise2D(x, z); // 原始噪声值 [-1,1]
    return n * this.heightScale;  // 缩放到给定的高度范围
  }

  /** ... */
}
```

![](https://img.md2card.com/img/2025-10-10/1760098894476-clipboard-image.png)

`heightScale` 的作用很直观，就是单纯的放大原始的噪声值：
- `heightScale = 10` → 地形高度范围 [-10, 10]，比较平缓
- `heightScale = 50` → 地形高度范围 [-50, 50]，起伏较大
- `heightScale = 100` → 地形高度范围 [-100, 100]，高山深谷

**实际应用中的经验值**：
- **平原地形**：`heightScale = 5-15`
- **丘陵地带**：`heightScale = 20-40`
- **山地地形**：`heightScale = 50-100`
- **极地地形**：`heightScale = 100+`

这个参数是最容易理解和调节的，也是你在调试地形时最先要确定的参数。

### 3.3 加入 noiseScale —— 控制采样粒度

有时候噪声“起伏得太快”，导致地图像一堆抖动的沙子。
这时候就需要 noiseScale，它能拉伸噪声的坐标空间，在更小尺度的空间里采样让地形更平滑或更紧凑。
```ts

@ccclass('TerrainDemo')
@executeInEditMode(true)
export class TerrainDemo extends Component {
  /** ... */

  @property
  public noiseScale: number = 0.05; // 噪声缩放

  private generateHeight(x: number, z: number): number {
    const n = this.noise2D(x * this.noiseScale, z * this.noiseScale);
    return n * this.heightScale;
  }

  /** ... */
}
```

noiseScale 小 → 波动慢，大片平原/缓坡。

noiseScale 大 → 波动快，碎石滩/陡峭小山。

下面两张图中，第二张是0.1倍的缩放，可以看到绿色的框就是0.05倍的那个结构

因为噪声的尺度被放大了两倍，所以这1/4个的区域就是采样的之前的那部分噪声


![](https://img.md2card.com/img/2025-10-10/1760098911908-clipboard-image.png)

![](https://img.md2card.com/img/2025-10-10/1760098921158-clipboard-image.png)


### 3.4 加入 octaves、persistence 和 lacunarity 增加细节层次

自然界的地形往往不是单一频率的，而是有 大山的起伏 + 小丘陵的细节 + 石块的凹凸。
为此，我们常用 分形噪声（Fractal Noise） 的方法：叠加多层噪声。

```ts
@ccclass('TerrainDemo')
@executeInEditMode(true)
export class TerrainDemo extends Component {
  /** ... */
  @property
  public octaves: number = 4; // 噪声层数

  @property
  public persistence: number = 0.5; // 持续性

  @property
  public lacunarity: number = 2.0; // 间隙度

  // 使用多层噪声生成高度
  private generateHeight(x: number, z: number): number {
    let height = 0;
    let amplitude = this.heightScale;     // 初始强度
    let frequency = this.noiseScale;      // 初始频率

    for (let i = 0; i < this.octaves; i++) {
      height += this.noise2D(x * frequency, z * frequency) * amplitude;
      amplitude *= this.persistence;    // 每层衰减
      frequency *= this.lacunarity;     // 每层频率增加
    }
    return height;
  }

  /** ... */
}
```

#### 这几个参数的含义

- `heightScale`：地形起伏的整体高度。
- `noiseScale`：噪声的采样间距，越小越平滑，越大越碎裂。
- `octaves`：叠加噪声层数，越多越细节丰富。
- `persistence`：每层噪声的强度衰减，越小，细节越柔和。。
- `lacunarity`：每层噪声的频率增加倍数，越大，细节越密集。

![](https://img.md2card.com/img/2025-10-10/1760098936439-clipboard-image.png)

![](https://img.md2card.com/img/2025-10-10/1760098945565-clipboard-image.png)

#### 调参 = 魔法 ✨

你可以这样理解：

想要**大平原** → `noiseScale` 小一点，octaves 少一点。
想要**高山密布** → `heightScale` 拉大，octaves 增加。
想要**碎石滩** → `noiseScale` 大一点，地形就会更破碎。

这就是噪声的魅力，一切尽在参数掌控之中。


### 3.5 利用曲线调控地形

光靠噪声函数算出来的高度，虽然已经比纯随机好看很多，但有时候地形还是“太数学”，不够自然。
比如你可能会：高原过于稀少，山峰太尖锐，平原面积不够大

这时候就可以用**曲线**来调节。

这时候我们可以利用曲线，它能让我们把“原始噪声值”映射成“更符合需求的高度值”

为了方便调试，我们这里将随机种子也放到参数中去

```ts
import { RealCurve } from 'cc';

@ccclass('TerrainDemo')
@executeInEditMode(true)
export class TerrainDemo extends Component {
  /** ... */

  @property(RealCurve)
  curve: RealCurve = new RealCurve();

  private _seed: number = 0;
  @property({ type: CCInteger, range: [-999999, 999999, 1] })
  get seed() {
    return this._seed;
  };

  set seed(seed: number) {
    this._seed = seed;
    // 修改种子后重新创建噪声生成器
    this.noise2D = makeNoise2D(this.seed);
  }

  // 在地形生成中使用曲线调整
  private applyHeightCurve(noiseHeight: number): number {
    // 将噪声值标准化到 [0, 1] 范围
    const normalizedNoise = (noiseHeight + this.heightScale) / (2 * this.heightScale);

    // 应用曲线来调整高度分布
    const curveValue = this.curve.evaluate(normalizedNoise);

    // 转换为最终高度
    return curveValue * this.heightScale;
  }
  /** ... */
}
```

这样我们就能通过拖动曲线点，直观地控制地形比例：

平原想大一点？就在曲线前段拉平。

山脉想更陡峭？就在后段加陡。

想要大面积海洋？把 0 附近压低。

由于小尺度的地形很难看出效果，所以这里我将地形瓦片调整到了5*5

然后我调了一个曲线，可以生成很好看的山地和平原地形

![](https://img.md2card.com/img/2025-10-10/1760098966694-clipboard-image.png)

![](https://img.md2card.com/img/2025-10-10/1760098976042-clipboard-image.png)

![](https://img.md2card.com/img/2025-10-10/1760098985214-clipboard-image.png)

## 4. 无限地图是怎么做到的？

到目前为止其实已经非常简单：
噪声函数的输入是**坐标 (x, z)**，输出是一个确定的值。
所以当玩家走到地图边界时，只要继续往外算新的坐标点，地形就会自然延展，理论上是无限的。

再配合 **分块加载**，玩家周围生成若干块地形。玩家移动时，卸载远处的块，加载新的块。这样就能模拟出**无限世界**，是不是很酷。

![](https://mmbiz.qpic.cn/mmbiz_gif/YibUo5RLQh4GmorBAzJFE6HTpiafvShVPsJWBV4Oe5KE49Vibc03D1vvjJNmiaB2CiaF01w8yL3VK1fXeiaJCuzhSUWg/640?wx_fmt=gif&amp;from=appmsg)

## 5. 总结

噪声函数是一个看似简单却威力巨大的工具，它能生成自然、连续、可控的数据。
配合参数和曲线，可以让地形更符合游戏设计需求。

再加上分块加载，就能实现 无限可玩的地图。

所以，下次你在 Minecraft 里挖矿时，别忘了背后支撑这一切的，可能就是几行 噪声函数的代码。

## 6. 启发：从地形到生态

到这里我们只是生成了**高度地图**，但游戏世界远不止“凹凸的地面”。  
噪声的妙用在于，它可以被重复利用，生成更多“有机”的内容：

- **环境划分**  
  用一组噪声来决定气候区，比如高纬度是雪原，低纬度是沙漠，中间是森林。

- **生物群落**  
  可以用噪声来分布怪物或动物，例如：某些区域狼群密集，某些地方只有羊驼。

- **植被分布**  
  再加一层噪声，就能控制森林的浓密度：某些块长满树，某些块只有零星几棵。

- **矿物/资源**  
  类似的思路还能用来生成地下矿脉分布，像《Minecraft》就是这么干的。

换句话说：  
地形噪声只是“基底”，你可以继续在它上面叠加**生态噪声**、**资源噪声**、**气候噪声**……  
这样一步步，就能拼出一个真正**无限而且生机勃勃的世界**。

[懒人demo地址：https://store.cocos.com/app/detail/8191](https://store.cocos.com/app/detail/8191)

![](https://img.md2card.com/img/2025-10-10/1760099002667-clipboard-image.png)
