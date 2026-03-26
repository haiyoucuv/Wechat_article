import {
    _decorator, Component, Graphics, Color, UITransform,
    EventTouch, input, Input, v3, v2, Button, Node, Label, Slider, EventHandler
} from 'cc';

const { ccclass, property } = _decorator;

// 格子状态
enum CellState {
    EMPTY = 0,    // 空地
    WALL = 1,     // 墙壁
    START = 2,    // 起点
    END = 3,      // 终点
    PATH = 4,     // 路径
    VISITED = 5,  // 已访问
    OPEN = 6,     // 待探索
}

// 颜色配置
const COLORS: Record<CellState, Color> = {
    [CellState.EMPTY]: new Color(240, 240, 240),        // 浅灰
    [CellState.WALL]: new Color(50, 50, 50),             // 深灰
    [CellState.START]: new Color(76, 175, 80),           // 绿色
    [CellState.END]: new Color(244, 67, 54),             // 红色
    [CellState.PATH]: new Color(255, 193, 7),            // 金色
    [CellState.VISITED]: new Color(144, 202, 249),       // 浅蓝
    [CellState.OPEN]: new Color(129, 212, 250),          // 天蓝
};

interface PathNode {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: PathNode | null;
}

@ccclass('AStarDemo')
export class AStarDemo extends Component {

    @property(Graphics)
    graphics: Graphics = null;

    @property(Node)
    startBtn: Node = null;

    @property(Node)
    resetBtn: Node = null;

    @property(Label)
    infoLabel: Label = null;

    // 网格配置
    private readonly COLS = 20;
    private readonly ROWS = 15;
    private readonly CELL_SIZE = 30;
    private readonly GAP = 2;

    private grid: CellState[][] = [];
    private startPos = { x: 1, y: 1 };
    private endPos = { x: 18, y: 13 };

    private isDrawingWall = false;

    // A*运行状态
    private isRunning = false;
    private searchSteps: Function[] = []; // 用于可视化单步执行

    onLoad() {
        if (!this.graphics) this.graphics = this.getComponent(Graphics);
    }

    start() {
        this.initGrid();
        this.drawGrid();

        // 注册输入事件
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        // 注册按钮事件
        if (this.startBtn) {
            this.startBtn.on(Button.EventType.CLICK, this.onStartClick, this);
        }
        if (this.resetBtn) {
            this.resetBtn.on(Button.EventType.CLICK, this.onResetClick, this);
        }
        
        this.updateInfo("拖动鼠标画墙壁，点击起/终点可以移动它们");
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * 初始化网格
     */
    initGrid() {
        this.grid = [];
        for (let x = 0; x < this.COLS; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.ROWS; y++) {
                this.grid[x][y] = CellState.EMPTY;
            }
        }
        this.grid[this.startPos.x][this.startPos.y] = CellState.START;
        this.grid[this.endPos.x][this.endPos.y] = CellState.END;
        
        this.isRunning = false;
        this.unscheduleAllCallbacks();
    }

    /**
     * 清除路径，保留墙壁
     */
    clearPath() {
        for (let x = 0; x < this.COLS; x++) {
            for (let y = 0; y < this.ROWS; y++) {
                const s = this.grid[x][y];
                if (s === CellState.PATH || s === CellState.VISITED || s === CellState.OPEN) {
                    this.grid[x][y] = CellState.EMPTY;
                }
            }
        }
        this.isRunning = false;
        this.unscheduleAllCallbacks();
    }

    // 交互编辑状态
    private editingStart = false;
    private editingEnd = false;

    /**
     * 触摸画墙壁或移动起终点
     */
    onTouchStart(e: EventTouch) {
        if (this.isRunning) return;

        const { cellX, cellY } = this.getCellByEvent(e);
        if (cellX < 0 || cellX >= this.COLS || cellY < 0 || cellY >= this.ROWS) return;

        const state = this.grid[cellX][cellY];

        // 决定当前编辑操作
        if (state === CellState.START) {
            this.editingStart = true;
            this.clearPath();
        } else if (state === CellState.END) {
            this.editingEnd = true;
            this.clearPath();
        } else {
            this.isDrawingWall = true;
            this.clearPath();
            this.toggleWall(cellX, cellY);
        }
    }

    onTouchMove(e: EventTouch) {
        if (this.isRunning) return;
        
        const { cellX, cellY } = this.getCellByEvent(e);
        if (cellX < 0 || cellX >= this.COLS || cellY < 0 || cellY >= this.ROWS) return;

        if (this.editingStart) {
            if (this.grid[cellX][cellY] !== CellState.END && this.grid[cellX][cellY] !== CellState.WALL) {
                this.grid[this.startPos.x][this.startPos.y] = CellState.EMPTY;
                this.startPos = { x: cellX, y: cellY };
                this.grid[this.startPos.x][this.startPos.y] = CellState.START;
                this.drawGrid();
            }
        } else if (this.editingEnd) {
            if (this.grid[cellX][cellY] !== CellState.START && this.grid[cellX][cellY] !== CellState.WALL) {
                this.grid[this.endPos.x][this.endPos.y] = CellState.EMPTY;
                this.endPos = { x: cellX, y: cellY };
                this.grid[this.endPos.x][this.endPos.y] = CellState.END;
                this.drawGrid();
            }
        } else if (this.isDrawingWall) {
            this.toggleWall(cellX, cellY, true); // 拖动时只改变一次状态，且如果是空地才变墙，避免闪烁
        }
    }

    onTouchEnd() {
        this.isDrawingWall = false;
        this.editingStart = false;
        this.editingEnd = false;
    }

    /**
     * 将事件坐标转换为网格坐标
     */
    getCellByEvent(e: EventTouch): { cellX: number; cellY: number } {
        const pos = e.getUILocation();
        const localPos = this.getComponent(UITransform).convertToNodeSpaceAR(v3(pos.x, pos.y, 0));

        const cellX = Math.floor(
            (localPos.x + (this.COLS * (this.CELL_SIZE + this.GAP)) / 2)
            / (this.CELL_SIZE + this.GAP)
        );
        const cellY = Math.floor(
            (localPos.y + (this.ROWS * (this.CELL_SIZE + this.GAP)) / 2)
            / (this.CELL_SIZE + this.GAP)
        );

        return { cellX, cellY };
    }

    /**
     * 切换墙壁状态
     */
    toggleWall(cellX: number, cellY: number, setWallOnly: boolean = false) {
        const state = this.grid[cellX][cellY];
        if (state === CellState.START || state === CellState.END) return;

        if (setWallOnly) {
            if (state === CellState.EMPTY) {
                this.grid[cellX][cellY] = CellState.WALL;
                this.drawGrid();
            }
        } else {
            this.grid[cellX][cellY] = state === CellState.WALL ? CellState.EMPTY : CellState.WALL;
            this.drawGrid();
        }
    }

    /**
     * 绘制整个网格
     */
    drawGrid(currentNode?: PathNode) {
        if (!this.graphics) return;

        this.graphics.clear();
        const offsetX = -(this.COLS * (this.CELL_SIZE + this.GAP)) / 2;
        const offsetY = -(this.ROWS * (this.CELL_SIZE + this.GAP)) / 2;

        for (let x = 0; x < this.COLS; x++) {
            for (let y = 0; y < this.ROWS; y++) {
                const px = offsetX + x * (this.CELL_SIZE + this.GAP);
                const py = offsetY + y * (this.CELL_SIZE + this.GAP);

                const color = COLORS[this.grid[x][y]];
                this.graphics.fillColor = color;
                
                // 给起点终点画圆角
                if(this.grid[x][y] === CellState.START || this.grid[x][y] === CellState.END) {
                    this.graphics.roundRect(px, py, this.CELL_SIZE, this.CELL_SIZE, 5);
                } else {
                    this.graphics.rect(px, py, this.CELL_SIZE, this.CELL_SIZE);
                }
                
                this.graphics.fill();
            }
        }

        // 绘制当前正在探索的最优路径（实时的搜索轨迹）
        if (currentNode) {
            this.graphics.lineWidth = 3;
            // 使用半透明的金色画线
            this.graphics.strokeColor = new Color(255, 193, 7, 180);
            
            let p: PathNode | null = currentNode;
            let isFirst = true;
            
            while (p) {
                const px = offsetX + p.x * (this.CELL_SIZE + this.GAP) + this.CELL_SIZE / 2;
                const py = offsetY + p.y * (this.CELL_SIZE + this.GAP) + this.CELL_SIZE / 2;
                
                if (isFirst) {
                    this.graphics.moveTo(px, py);
                    isFirst = false;
                } else {
                    this.graphics.lineTo(px, py);
                }
                p = p.parent;
            }
            this.graphics.stroke();
        }
    }

    updateInfo(text: string) {
        if (this.infoLabel) {
            this.infoLabel.string = text;
        }
    }

    /**
     * 点击"开始寻路"
     */
    onStartClick() {
        if (this.isRunning) return;
        this.clearPath();
        this.runAStar();
    }

    /**
     * 点击"重置"
     */
    onResetClick() {
        this.initGrid();
        this.drawGrid();
        this.updateInfo("地图已重置");
    }

    /**
     * 执行A*寻路，带有动态可视化效果
     */
    runAStar() {
        this.isRunning = true;
        this.updateInfo("A* 寻路中...");

        const nodes: PathNode[][] = [];
        for (let x = 0; x < this.COLS; x++) {
            nodes[x] = [];
            for (let y = 0; y < this.ROWS; y++) {
                nodes[x][y] = { x, y, g: 0, h: 0, f: 0, parent: null };
            }
        }

        const start = nodes[this.startPos.x][this.startPos.y];
        const end = nodes[this.endPos.x][this.endPos.y];

        const openList: PathNode[] = [start];
        const closedSet = new Set<PathNode>();

        // 曼哈顿距离
        start.h = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
        start.f = start.h;

        this.searchSteps = []; // 队列：保存每一步的操作

        let found = false;
        const searchNext = () => {
            if (openList.length === 0) {
                // 找不到路径
                this.isRunning = false;
                this.updateInfo("寻路失败：无法到达目标点");
                return;
            }

            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift()!;

            // 找到了，显示路径
            if (current === end) {
                found = true;
                this.showPath(current);
                return;
            }

            closedSet.add(current);

            // 标记已访问（排除起终点）
            if (this.grid[current.x][current.y] !== CellState.START && this.grid[current.x][current.y] !== CellState.END) {
                this.grid[current.x][current.y] = CellState.VISITED;
            }

            // 四方向寻找
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;

                if (nx < 0 || nx >= this.COLS || ny < 0 || ny >= this.ROWS) continue;
                if (this.grid[nx][ny] === CellState.WALL) continue;

                const neighbor = nodes[nx][ny];
                if (closedSet.has(neighbor)) continue;

                const newG = current.g + 1;

                if (openList.indexOf(neighbor) === -1) {
                    openList.push(neighbor);
                    // 标记待探索（排除起终点）
                    if (this.grid[nx][ny] !== CellState.START && this.grid[nx][ny] !== CellState.END) {
                        this.grid[nx][ny] = CellState.OPEN;
                    }
                } else if (newG >= neighbor.g) {
                    continue;
                }

                neighbor.parent = current;
                neighbor.g = newG;
                neighbor.h = Math.abs(nx - end.x) + Math.abs(ny - end.y);
                neighbor.f = neighbor.g + neighbor.h;
            }

            this.drawGrid(current);
            
            // 使用定时器不断执行下一步，实现可视化动画
            setTimeout(() => {
                if (this.isRunning) searchNext();
            }, 20);
        };

        // 开始搜索
        setTimeout(() => {
            if (this.isRunning) searchNext();
        }, 0);
    }

    /**
     * 显示寻路结果
     */
    showPath(endNode: PathNode) {
        let pathNode: PathNode | null = endNode.parent; // 从倒数第二个格子开始画
        let pathLength = 0;

        while (pathNode && pathNode.parent) {
            this.grid[pathNode.x][pathNode.y] = CellState.PATH;
            pathNode = pathNode.parent;
            pathLength++;
        }

        this.drawGrid();
        this.isRunning = false;
        
        let checkedCount = 0;
        for (let x = 0; x < this.COLS; x++) {
            for (let y = 0; y < this.ROWS; y++) {
                if (this.grid[x][y] === CellState.VISITED) checkedCount++;
            }
        }
        
        this.updateInfo(`寻路成功！路径长度: ${pathLength + 1}，检查格数: ${checkedCount}`);
    }
}
