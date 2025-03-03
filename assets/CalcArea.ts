import {
    _decorator,
    Button,
    Component,
    EventTouch,
    Graphics,
    input,
    Input,
    Label,
    Node,
    UITransform,
    v2,
    v3,
    Vec2
} from 'cc';

const {ccclass, property} = _decorator;

@ccclass('CalcArea')
export class CalcArea extends Component {
    @property(Graphics) graphics: Graphics = null;

    @property(Node) clearBtn: Node = null;
    @property(Label) txt: Label = null;

    // 前绘制点
    private points: Vec2[] = [];

    start() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        this.clearBtn.on(Button.EventType.CLICK, this.clickClear, this);
    }

    clickClear() {
        this.graphics.clear();
        this.points = [];
    }

    onTouchStart(event: EventTouch) {
        const pos = event.getUILocation();

        const localPos = this.getComponent(UITransform)
            .convertToNodeSpaceAR(v3(pos.x, pos.y, 0));

        this.graphics.clear();
        this.points.push(v2(localPos.x, localPos.y));
    }

    onTouchEnd(event: EventTouch) {
        const pos = event.getUILocation();

        const localPos = this.getComponent(UITransform)
            .convertToNodeSpaceAR(v3(pos.x, pos.y, 0));

        // 添加新顶点并重绘和计算
        this.points.push(v2(localPos.x, localPos.y));
        this.drawFinalPolygon();
        const area = this.calculateArea(this.points);
        this.txt.string = `面积：${area.toFixed(2)}`;
    }

    // 绘制多边形
    private drawFinalPolygon() {
        this.graphics.clear();
        this.graphics.moveTo(this.points[0].x, this.points[0].y);

        for (const p of this.points) {
            this.graphics.lineTo(p.x, p.y);
        }

        this.graphics.close();
        this.graphics.fill();
        this.graphics.stroke();
    }

    // 计算多边形面积，鞋带公式
    private calculateArea(points: Vec2[]): number {

        if (points.length < 3) return 0;

        let sum = 0;
        let p1: Vec2;
        let p2: Vec2;

        const loopTimes = points.length - 1;
        for (let i = 0; i < loopTimes; i++) {
            p1 = points[i];
            p2 = points[i + 1];

            sum += (p2.x - p1.x) * (p1.y + p2.y);
        }

        p1 = points[0];
        p2 = points[loopTimes];

        sum += (p1.x - p2.x) * (p2.y + p1.y);

        return Math.abs(-sum * 0.5);
    }

}