点击上方**码不了一点**+关注和**★ 星标**

![title.png](images/title.png)

## 引言

你是否曾在《瘟疫传说》中被如潮水般涌来的鼠海震撼？或者在《对马岛之魂》里停下脚步，仰望天空中盘旋的飞鸟？又或者在《流放者柯南》中面对成百上千的丧尸潮感到局促不安？

这些游戏中的庞大群体往往由成百上千个独立单位组成。如果开发者给每一只动物、每一只飞鸟都费心手写移动轨迹，恐怕写到地老天荒也写不完；要是让它们都用寻路算法（比如 A*）追踪同一个目标，它们又会笨拙地挤成一团甚至重叠在一起，毫无真实的生命感可言。

那么，怎样才能让大量的独立 NPC 表现出宛如真实生命体般的**集体智慧**，并且丝毫不觉得死板呢？

答案就是诞生于 1986 年、至今仍在广泛应用且被无数大作采用的**集群行为（Flocking）算法 —— Boids**。

今天，咱们就来揭秘这个“群体智慧之源”。带你在 **Cocos Creator** 里用极简的代码手撸一套飞鸟/鱼群系统，让你游戏里的怪物、动物瞬间“活”过来！

## 涉及知识
- TypeScript
- CocosCreator 3.x
- 向量数学运算
- Boids (集群) 算法

## 1. 什么是 Boids 算法？

1986 年，计算机图形学专家 Craig Reynolds 在仔细观察了真实的鸟群和鱼群后，发现了一个惊人的秘密：**在庞大的群体中其实并没有一个“发号施令的总指挥”，宏观上极为复杂的群体运动，仅仅是成百上千个个体在遵循几条极简的底层规则而“涌现”出来的。**

由此他提炼出了堪称集群动画里黄金法则的三条定律：

1. **分离 (Separation)**：**社恐发作**。如果发现有同伴离得太近了，赶紧闪开，以免撞车。
2. **对齐 (Alignment)**：**从众心理**。看看周围的同伴往哪个方向飞、飞得多快，自己也赶紧把速度和方向调整成跟大家一样。
3. **凝聚 (Cohesion)**：**抱团取暖**。落单容易被猎食者吃掉，所以要尽量朝着视野内伙伴们的中心区域靠拢。

![boids_rules.png](images/boids_rules.png)

只要给每个个体（我们称之为 Boid）施加这三个简单的作用力，不可思议的奇迹就会在屏幕上发生。

## 2. 三大法则的代码实现

在数学的视界中，“速度”、“位置”和“力”都可以用**向量（Vector）**来完美表示。让我们一步步用代码实现这三种神奇的力。

### 准备工作：单个 Boid 的基础结构

```typescript
import { Vec2, v2 } from 'cc';

export class Boid {
    position: Vec2 = v2(0, 0);       // 当前位置
    velocity: Vec2 = v2((Math.random() - 0.5) * 240, (Math.random() - 0.5) * 240);       // 当前速度
    acceleration: Vec2 = v2(0, 0);   // 加速度（也就是所受合力）

    maxSpeed: number = 240;          // 极限飞行速度
    maxForce: number = 9;            // 转身有多灵活（力越大，转向越快）
    
    // 限制向量的最大长度辅助函数
    private limitVector(vec: Vec2, max: number) {
        if (vec.lengthSqr() > max * max) {
            vec.normalize().multiplyScalar(max);
        }
    }

    update(dt: number) {
        const acc = this.acceleration.clone();
        acc.multiplyScalar(dt * 60);
        this.velocity.add(acc);
        this.limitVector(this.velocity, this.maxSpeed);
        
        const vel = this.velocity.clone().multiplyScalar(dt);
        this.position.add(vel);
        
        this.acceleration.set(0, 0);
    }
}
```

### 绝招一：分离 (Separation)

**逻辑**：检查所有在“排斥半径”内的同伴，计算一个远离它们的反向向量。同伴越靠近你，排斥力就越大。

```typescript
    separation(boids: Boid[], perception: number): Vec2 {
        const steering = v2(0, 0);
        let total = 0;
        
        for (const other of boids) {
            if (other === this) continue;
            
            const dist = Vec2.distance(this.position, other.position);
            // 规则1：如果距离小于 perception * 0.5，产生排斥力
            if (dist > 0 && dist < perception * 0.5) {
                const diff = this.position.clone().subtract(other.position);
                diff.multiplyScalar(1 / (dist * dist)); // 距离越近，排斥力越大
                steering.add(diff);
                total++;
            }
        }
        
        if (total > 0) {
            steering.multiplyScalar(1 / total);
            steering.normalize().multiplyScalar(this.maxSpeed);
            steering.subtract(this.velocity);
            this.limitVector(steering, this.maxForce);
        }
        return steering;
    }
```

### 绝招二：对齐 (Alignment)

**逻辑**：算出周围同伴的平均飞行速度，然后把自己的速度努力调整过去。

```typescript
    alignment(boids: Boid[], perception: number): Vec2 {
        const steering = v2(0, 0);
        let total = 0;
        
        for (const other of boids) {
            if (other === this) continue;

            const dist = Vec2.distance(this.position, other.position);
            // 列队
            if (dist > 0 && dist < perception) {
                steering.add(other.velocity);
                total++;
            }
        }
        
        if (total > 0) {
            steering.multiplyScalar(1 / total);
            steering.normalize().multiplyScalar(this.maxSpeed);
            steering.subtract(this.velocity);
            this.limitVector(steering, this.maxForce);
        }
        return steering;
    }
```

### 绝招三：凝聚 (Cohesion)

**逻辑**：算出周围所有同伴的中心点坐标，朝着那个组织的中心飞。

```typescript
    cohesion(boids: Boid[], perception: number): Vec2 {
        const steering = v2(0, 0);
        let total = 0;
        
        for (const other of boids) {
            if (other === this) continue;

            const dist = Vec2.distance(this.position, other.position);
            // 凝聚
            if (dist > 0 && dist < perception) {
                steering.add(other.position);
                total++;
            }
        }
        
        if (total > 0) {
            steering.multiplyScalar(1 / total);
            return this.seek(steering);
        }
        return v2(0, 0);
    }

    seek(target: Vec2): Vec2 {
        const desired = target.clone().subtract(this.position);
        desired.normalize().multiplyScalar(this.maxSpeed);
        const steering = desired.subtract(this.velocity);
        this.limitVector(steering, this.maxForce);
        return steering;
    }

    flee(target: Vec2, radius: number): Vec2 {
        const d = Vec2.distance(this.position, target);
        // 逃逸
        if (d < radius) {
            const desired = this.position.clone().subtract(target);
            desired.normalize().multiplyScalar(this.maxSpeed * 2);
            const steering = desired.subtract(this.velocity);
            this.limitVector(steering, this.maxForce * 3);
            return steering;
        }
        return v2(0, 0);
    }

    flock(boids: Boid[], params: any) {
        const sep = this.separation(boids, params.perception).multiplyScalar(params.sepWeight);
        const ali = this.alignment(boids, params.perception).multiplyScalar(params.aliWeight);
        const coh = this.cohesion(boids, params.perception).multiplyScalar(params.cohWeight);

        this.acceleration.add(sep);
        this.acceleration.add(ali);
        this.acceleration.add(coh);
    }
```
*(注：`limitVector` 函数是一个简单的数学辅助，用于将向量的长度限制在 `maxForce` 范围内，保证转向平滑。)*

## 3. 在 Cocos Creator 中将它们融合！

我们把这三种力按一定的权重比例混合，然后施加到我们的小鸟身上。在你的场景里挂载这个脚本，鸟群大军就能华丽起飞了！

```typescript
import { _decorator, Component, Node, instantiate, Prefab, Vec3, view, Input, input, EventMouse, v2, UITransform, MotionStreak } from 'cc';
import { Boid } from './Boid';
const { ccclass, property } = _decorator;

@ccclass('FlockManager')
export class FlockManager extends Component {
    @property(Prefab) boidPrefab: Prefab | null = null;
    @property boidCount: number = 100;

    @property sepWeight: number = 1.5;
    @property aliWeight: number = 1.0;
    @property cohWeight: number = 1.0;
    @property perception: number = 50; 

    private boidsData: Boid[] = [];
    private boidNodes: Node[] = [];
    private screenWidth: number = 0;
    private screenHeight: number = 0;

    private mouseActive: boolean = false;
    private mouseAttract: boolean = false;
    private mousePosInput = v2(0, 0);
    private uiTransform: UITransform | null = null;

    start() {
        const visibleSize = view.getVisibleSize();
        this.screenWidth = visibleSize.width;
        this.screenHeight = visibleSize.height;

        this.uiTransform = this.node.getComponent(UITransform);
        if(!this.uiTransform) {
            this.uiTransform = this.node.addComponent(UITransform);
        }
        this.uiTransform.setContentSize(this.screenWidth, this.screenHeight);

        // 初始化节点池
        for (let i = 0; i < this.boidCount; i++) {
            if (!this.boidPrefab) break;

            const node = instantiate(this.boidPrefab);

            const boid = new Boid();
            boid.position.set(
                (Math.random() - 0.5) * this.screenWidth, 
                (Math.random() - 0.5) * this.screenHeight
            );
            this.boidsData.push(boid);
            
            // 同步初始坐标
            node.setPosition(boid.position.x, boid.position.y);
            const angle = Math.atan2(boid.velocity.y, boid.velocity.x);
            node.setRotationFromEuler(new Vec3(0, 0, angle * 180 / Math.PI - 90));

            this.node.addChild(node);
            this.boidNodes.push(node);
            
            // 清理首帧拖尾
            const streak = node.getComponent(MotionStreak) || node.getComponentInChildren(MotionStreak);
            if (streak) {
                streak.reset();
                this.scheduleOnce(() => {
                    if (streak && streak.isValid) streak.reset();
                }, 0);
            }
        }

        // 注册事件
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onMouseDown(e: EventMouse) {
        this.mouseActive = true;
        this.mouseAttract = e.getButton() === 2; 
        this.updateMousePos(e);
    }

    onMouseUp(e: EventMouse) {
        this.mouseActive = false;
    }

    onMouseMove(e: EventMouse) {
        this.updateMousePos(e);
    }

    updateMousePos(e: EventMouse) {
        const pos = e.getUILocation();
        const localPos = this.uiTransform!.convertToNodeSpaceAR(new Vec3(pos.x, pos.y, 0));
        this.mousePosInput.set(localPos.x, localPos.y);
    }

    update(dt: number) {
        const params = {
            sepWeight: this.sepWeight,
            aliWeight: this.aliWeight,
            cohWeight: this.cohWeight,
            perception: this.perception
        };

        // 计算物理受力
        for (const boid of this.boidsData) {
            boid.flock(this.boidsData, params);

            // 加入鼠标交互
            if (this.mouseActive) {
                if (this.mouseAttract) {
                    const attract = boid.seek(this.mousePosInput).multiplyScalar(2);
                    boid.acceleration.add(attract);
                } else {
                    const fleeForce = boid.flee(this.mousePosInput, 300);
                    boid.acceleration.add(fleeForce);
                }
            }
        }

        // 应用位移矩阵
        for (let i = 0; i < this.boidsData.length; i++) {
            const boid = this.boidsData[i];
            boid.update(dt);
            
            const didWrap = this.wrapAround(boid); 

            const node = this.boidNodes[i];
            node.setPosition(boid.position.x, boid.position.y);
            
            // 更新节点角度
            const angle = Math.atan2(boid.velocity.y, boid.velocity.x);
            node.setRotationFromEuler(new Vec3(0, 0, angle * 180 / Math.PI - 90));
            
            // 越界保护
            if (didWrap) {
                const streak = node.getComponent(MotionStreak) || node.getComponentInChildren(MotionStreak);
                if (streak) {
                    streak.reset();
                    // 用 scheduleOnce 延迟一帧，确保在引擎计算完矩阵后再重置
                    this.scheduleOnce(() => {
                        if (streak && streak.isValid) streak.reset();
                    }, 0);
                }
            }
        }
    }

    private wrapAround(boid: Boid): boolean {
        // 增加 50 像素的缓冲区，让鸟完全飞出屏幕视野后再传送
        const margin = 50; 
        const halfW = this.screenWidth / 2 + margin;
        const halfH = this.screenHeight / 2 + margin;
        let wrapped = false;
        
        if (boid.position.x > halfW) { boid.position.x = -halfW; wrapped = true; }
        else if (boid.position.x < -halfW) { boid.position.x = halfW; wrapped = true; }

        if (boid.position.y > halfH) { boid.position.y = -halfH; wrapped = true; }
        else if (boid.position.y < -halfH) { boid.position.y = halfH; wrapped = true; }
        
        return wrapped;
    }
}
```

加上这段代码，看看让人惊叹的运行效果：

![flocking_demo.png](images/flocking_demo.png)

不再需要任何高人一等的全局寻路调配干预，这 100 只小鸟就已经自动聚集成群，在天空中丝滑地变换着阵型。

## 4. 进阶玩法：加入天敌与鼠标跟随

如果光是自己飞太无聊了，我们完全可以往这套规则里再缝补两条崭新的受力法则：
- **逃避捕食者 (Flee)**：检测到天敌靠近时，产生一个巨大的反向逃离力。
- **目标吸引 (Arrive/Seek)**：让群体向玩家的鼠标或者某个设定的关键路标点移动。

![flee_predator.png](images/flee_predator.png)

只要你理解了万物皆是**“向量叠加”**的开发核心思路，你可以随意扩展上各种有趣的力，比如“风向推力”、“躲避墙壁障碍物的排斥力”等，从而亲手创造出《瘟疫传说》中那种海量老鼠遇到火把时疯狂四散退却的震撼名场面。

## 5. 性能优化预警
心细的朋友可能发现了一个问题，我们在每一帧计算每一只鸟时，都要遍历**所有其他的鸟**！如果只有 100 只需要计算 $100 \times 100 = 1$万次，手机还能轻松拿捏。但要像《僵尸世界大战》那样同时处理 10000 只感染者呢？计算量将是恐怖的 1 亿次！设备早就罢工了。

遇到海量单位同屏，我们就需要借助**空间分割技术**：比如 **四叉树 (QuadTree)** 或 **哈希网格 (Spatial Hash Grid)**，让每个个体只计算分配在自己网格内邻居的信息，从而将计算量呈指数级降低。这部分的硬核内容，我们留到下一期深入实战！

## 相关代码在哪里

> https://github.com/haiyoucuv/Wechat_article

## 结语

从 A* 的精准寻路导航，再到今天 Boids 算法展现出的集群行为涌现，游戏 AI 的迷人之处就在于用极简的数学与规则，去生动还原现实世界中最震撼复杂的生命力。这一行行看似枯燥死板的代码背后，正是我们开发者做为数字世界“造物主”的硬核浪漫。

现在你已经掌握了这把群体智慧的钥匙。赶紧打开你的引擎，去创造属于你的深海鱼群或丧尸狂潮吧！

点击上方**码不了一点**+关注和**★ 星标**
