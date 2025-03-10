import { _decorator, Component, Graphics, input, Vec2, Input, EventTouch, UITransform, Vec3, v2 } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 重力
 */
const GRAVITY = new Vec2(0, -98);

class RopeNode {

    /**
     * 当前帧位置
     */
    pos: Vec2 = null;

    /**
     * 上一帧的位置
     */
    prePos: Vec2 = null;

    constructor(x: number, y: number) {
        this.pos = v2(x, y);
        this.prePos = v2(x, y);
    }

    onUpdate(dt: number) {

        // 计算速度（这个步长已经是两帧之间的步长了）
        const v = Vec2.subtract(new Vec2(), this.pos, this.prePos);

        // 保存上一帧的位置
        this.prePos.set(this.pos);

        // 叠加重力加速度
        v.add(Vec2.multiplyScalar(new Vec2(), GRAVITY, dt));

        // 计算下一帧位置
        this.pos.add(v);
    }

}

@ccclass('Rope')
export class Rope extends Component {

    /**
     * 节点数组
     */
    nodeArr: RopeNode[] = [];

    /**
     * 头节点
     */
    head: RopeNode = null;

    /**
     * 基础长度
     */
    baseLen = 20;

    /**
     * 节点数量
     */
    count = 30;


    private graphics: Graphics = null;

    onLoad() {

        this.graphics = this.node.getComponent(Graphics);

        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);

    }

    start() {
        // 初始化一些节点
        for (let i = 0; i < this.count; i++) {
            this.nodeArr.push(new RopeNode(0, 0));
        }
        this.head = this.nodeArr[0];
    }

    onTouchMove = (() => {
        const tempPos = new Vec3();

        return (e: EventTouch) => {
            const uiPos = e.getUILocation();
            tempPos.set(uiPos.x, uiPos.y, 0);

            this.getComponent(UITransform).convertToNodeSpaceAR(tempPos, tempPos);

            //  把头部移动到指定位置
            this.head.pos.set(tempPos.x, tempPos.y);
        }
    })()

    /**
     * 更新节点
     * @param dt
     */
    updatePoints(dt: number) {
        const { nodeArr } = this;
        const len = nodeArr.length;
        for (let i = 1; i < len; i++) {
            const p = nodeArr[i];
            p.onUpdate(dt);
        }
    }

    /**
     * 简单的约束
     */
    constraint() {
        const { nodeArr } = this;

        const time = 20;
        for (let step = 0; step < time; step++) {

            const len = this.nodeArr.length - 1;
            for (let i = 0; i < len; i++) {

                const p = nodeArr[i];

                const next = nodeArr[i + 1];

                const dp = Vec2.subtract(new Vec2(), p.pos, next.pos);

                const dis = dp.length();

                if (dis > this.baseLen) {
                    const delta = dis - this.baseLen;
                    const dir = dp.normalize().multiplyScalar(delta);
                    if (i !== 0) {
                        dir.multiplyScalar(0.5);
                        p.pos.subtract(dir);
                        next.pos.add(dir);
                    } else {
                        next.pos.add(dir);
                    }
                }
            }
        }
    }

    /**
     * 绘制
     */
    draw() {
        this.graphics.clear();

        //  画出绳子
        this.graphics.moveTo(this.head.pos.x, this.head.pos.y);
        for (let i = 1; i < this.nodeArr.length; i++) {
            const node = this.nodeArr[i];
            this.graphics.lineTo(node.pos.x, node.pos.y);
        }
        this.graphics.stroke();

        // 画出节点
        for (let i = 0; i < this.nodeArr.length; i++) {
            const node = this.nodeArr[i];
            this.graphics.moveTo(node.pos.x, node.pos.y);
            this.graphics.circle(node.pos.x, node.pos.y, 5);
            this.graphics.fill();
        }
    }

    /**
     * 更新
     * @param dt
     */
    update(dt: number) {
        this.updatePoints(dt);
        this.constraint();
        this.draw();
    }
}


