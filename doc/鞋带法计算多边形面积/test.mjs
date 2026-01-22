

/**
 * 鞋带公式
 * @param {x: number, y: number}[] points 多边形的顶点坐标数组
 * @returns {number} 多边形的面积
 */
function calculateArea(points) {

    if (points.length < 3) return 0;

    let sum = 0;
    let p1;
    let p2;

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

/**
 * 三角形
 *  0
 *  /\
 * 1--2
 */
const triangle = [
    {x: 0, y: 0},
    {x: 10, y: 0},
    {x: 10, y: 10},
];

console.log(calculateArea(triangle));   // 50


/**
 * 四边形
 * 0-----1
 *  |   |
 * 3-----2
 */
const quad   = [
    {x: 0, y: 0},
    {x: 10, y: 0},
    {x: 10, y: 10},
    {x: 0, y: 10},
];

console.log(calculateArea(quad));   // 100

const polygon   = [
    {x: 1, y: 2},
    {x: 3, y: 4},
    {x: 4, y: 3},
    {x: 5, y: 4},
    {x: 4, y: 1},
];

console.log(calculateArea(polygon));   // 6
