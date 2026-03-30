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
