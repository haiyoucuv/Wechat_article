import { _decorator, Component, EventTouch, Vec2, Toggle, Graphics, Node, UITransform, v2, v3, Label } from 'cc';
import { IVec2Like } from "@cocos/creator-types/editor/packages/scene/@types/cce/utils/math/type-define";

const { ccclass, property } = _decorator;

@ccclass('CalcTriangleArea')
export class CalcTriangleArea extends Component {

    @property(Graphics) graphics: Graphics;
    @property(Node) A: Node;
    @property(Node) B: Node;
    @property(Node) C: Node;

    @property(Label) label: Label;
    @property(Label) label1: Label;

    @property(Toggle) toggle: Toggle;

    onLoad() {
        this.A.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.B.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.C.on(Node.EventType.TOUCH_START, this.onTouchStart, this);

        this.toggle.node.on(Toggle.EventType.TOGGLE, this.onToggle, this);

        this.drawAndCalc();
    }

    onToggle() {
        const isChecked = this.toggle.isChecked;
        if (isChecked) {
            const temp = v3();
            this.A.getPosition(temp);
            temp.set(~~temp.x, ~~temp.y);
            this.A.setPosition(temp);

            this.B.getPosition(temp);
            temp.set(~~temp.x, ~~temp.y);
            this.B.setPosition(temp);

            this.C.getPosition(temp);
            temp.set(~~temp.x, ~~temp.y);
            this.C.setPosition(temp);

            this.drawAndCalc();
        }
    }

    onTouchStart(event: EventTouch) {
        const temp = v2();
        const node = event.currentTarget as Node;

        const onTouchMove = (event: EventTouch) => {
            event.getUIDelta(temp);

            if (this.toggle.isChecked) {
                temp.set(~~temp.x, ~~temp.y);
            }

            node.position.add3f(temp.x, temp.y, 0);
            node.setPosition(node.position);

            this.drawAndCalc();
        }

        const onTouchEnd = (event: EventTouch) => {
            node.off(Node.EventType.TOUCH_MOVE, onTouchMove, this);
            node.off(Node.EventType.TOUCH_END, onTouchEnd, this);
        }

        node.on(Node.EventType.TOUCH_MOVE, onTouchMove, this);
        node.on(Node.EventType.TOUCH_END, onTouchEnd, this);
    }

    draw() {
        this.graphics.clear();
        this.graphics.moveTo(this.A.position.x, this.A.position.y);
        this.graphics.lineTo(this.B.position.x, this.B.position.y);
        this.graphics.lineTo(this.C.position.x, this.C.position.y);
        this.graphics.close();
        this.graphics.fill();
        this.graphics.stroke();
    }

    drawAndCalc() {
        this.draw();

        const area1 = this.calcTriangleByHelen(this.A.position, this.B.position, this.C.position);
        const area2 = this.calcTriangleByVector(this.A.position, this.B.position, this.C.position);

        this.label.string = `海伦公式计算面积: ${area1} \n向量叉乘计算面积: ${area2}`;

        this.label1.string = `A: ${this.A.position.x.toFixed(2)}, ${this.A.position.y.toFixed(2)} \nB: ${this.B.position.x.toFixed(2)}, ${this.B.position.y.toFixed(2)} \nC: ${this.C.position.x.toFixed(2)}, ${this.C.position.y.toFixed(2)}`;
    }

    /**
     * 海伦公式
     * @returns {number} 三角形的面积
     * @param {IVec2Like} p1
     * @param {IVec2Like} p2
     * @param {IVec2Like} p3
     */
    calcTriangleByHelen(p1: IVec2Like, p2: IVec2Like, p3: IVec2Like) {
        // 计算三条边长度
        const a = Vec2.distance(p1, p2);
        const b = Vec2.distance(p2, p3);
        const c = Vec2.distance(p3, p1);

        // 计算半周长
        const s = (a + b + c) / 2;

        // 计算面积
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    calcTriangleByVector(p1: IVec2Like, p2: IVec2Like, p3: IVec2Like) {
        const vec1 = Vec2.subtract(v2(), p2, p1);
        const vec2 = Vec2.subtract(v2(), p3, p1);
        return Math.abs(Vec2.cross(vec1, vec2)) / 2;
    }

}


