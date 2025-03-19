/**
 * 海伦公式
 * @returns {number} 三角形的面积
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @param {{x: number, y: number}} p3
 */
function calcTriangleByHelen(p1, p2, p3) {
    // 计算三条边长度
    const a = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const b = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
    const c = Math.sqrt(Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2));

    // 计算半周长
    const s = (a + b + c) / 2;

    // 计算面积
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
}

/**
 * 向量叉乘
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @returns {number}
 */
function cross(p1, p2) {
    return p1.x * p2.y - p1.y * p2.x;
}

/**
 * 计算三角形面积，通过向量叉乘计算
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @param {{x: number, y: number}} p3
 * @returns {number}
 */
function calcTriangleByVector(p1, p2, p3) {
    const v1 = {x: p2.x - p1.x, y: p2.y - p1.y};
    const v2 = {x: p3.x - p1.x, y: p3.y - p1.y};
    return Math.abs(cross(v1, v2)) / 2;
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

console.log("Helen:", calcTriangleByHelen(...triangle));   // 50
console.log("Vector:", calcTriangleByVector(...triangle));   // 50


const triangle2 = [
    {x: 0, y: 0},
    {x: 1, y: 0},
    {x: 1, y: 1},
];

console.log("Helen:", calcTriangleByHelen(...triangle2));   // 0.5
console.log("Vector:", calcTriangleByVector(...triangle2));   // 0.5




