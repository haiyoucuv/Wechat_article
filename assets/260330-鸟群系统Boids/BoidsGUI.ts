import { _decorator, Component } from 'cc';
import { FlockManager } from './FlockManager';

declare const lil: any;

const { ccclass, property } = _decorator;

@ccclass('BoidsGUI')
export class BoidsGUI extends Component {
    @property(FlockManager)
    flockManager: FlockManager | null = null;

    private gui: any = null;

    start() {
        // 获取核心组件
        if (!this.flockManager) {
            this.flockManager = this.getComponent(FlockManager);
            if (!this.flockManager) {
                console.warn("BoidsGUI undefined");
                return;
            }
        }

        // 初始化GUI
        this.gui = new lil.GUI();
        this.gui.title('Boids 调参面板');

        const folder = this.gui.addFolder('群体规则参数');
        
        // 绑定各项权重参数
        folder.add(this.flockManager, 'sepWeight', 0, 5).step(0.1).name('分离权重 (Separation)');
        folder.add(this.flockManager, 'aliWeight', 0, 5).step(0.1).name('对齐权重 (Alignment)');
        folder.add(this.flockManager, 'cohWeight', 0, 5).step(0.1).name('凝聚权重 (Cohesion)');
        folder.add(this.flockManager, 'perception', 10, 200).step(1).name('感知半径 (Perception)');
        
        folder.open();
    }

    onDestroy() {
        // 回收GUI
        if (this.gui) {
            this.gui.destroy();
            this.gui = null;
        }
    }
}
