import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * --------------------------------
 *    GIF 等比例尺寸缩小工具
 * --------------------------------
 * 微信公众号 GIF 尺寸建议宽 600px~800px 以下，能显著减小文件体积。
 * 建议原有的静态图用 resize_images.mjs，这个专门处理动图。
 */

// 1. 目标最大宽度 (若原图宽>此值，则缩小到此值)
const MAX_WIDTH = 720; 
// 2. 目标文件夹路径 (默认读取当前文档下的 images)
const INPUT_FOLDER = process.argv[2] || './doc/260330-鸟群系统Boids/images';


async function resizeGifs() {
    try {
        if (!fs.existsSync(INPUT_FOLDER)) {
            console.error(`❌ 找不到目标文件夹: ${INPUT_FOLDER}`);
            return;
        }

        const files = fs.readdirSync(INPUT_FOLDER);
        
        console.log(`🚀 开始检查并处理目录 (专门针对 GIF 原地覆盖): ${INPUT_FOLDER}`);
        console.log(`🎯 目标动图宽度上限: ${MAX_WIDTH}px`);

        let processedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.gif') {
                const filePath = path.join(INPUT_FOLDER, file);

                // 读取文件到内存 Buffer (防写入冲突)
                const inputBuffer = fs.readFileSync(filePath);
                
                // 获取动图特有元数据
                // 必须开启 animated: true 否则 sharp 只会读取 GIF 的第一帧
                const metadata = await sharp(inputBuffer, { animated: true }).metadata();

                if (metadata.width > MAX_WIDTH) {
                    console.log(`⏳ 正在压缩: ${file} (原宽 ${metadata.width}px, 页数: ${metadata.pages || 1}帧) ...`);
                    
                    // 进行处理
                    await sharp(inputBuffer, { animated: true })
                        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
                        // 设置更激进的 gif 优化参数，极限保底缩小体积
                        .gif({ 
                            effort: 9,            // 压缩力度 1(快且大) -> 10(慢且小)，调高到9
                            colors: 128,          // 最大色彩数强行砍半(从256到128)，对动图观感影响不大但体积锐减
                            dither: 0             // 彻底关闭色彩抖动，让纯色块更多，超级有利于格式本身压缩
                        })
                        .toFile(filePath); // 直接原地覆盖
                    
                    console.log(`✅ 已处理并覆盖: ${file}`);
                    processedCount++;
                } else {
                    console.log(`⏩ 已跳过 (当前宽度 ${metadata.width}px): ${file}`);
                    skippedCount++;
                }
            }
        }

        console.log(`\n✨ GIF 全部处理完成！`);
        console.log(`✅ 已缩小并覆盖: ${processedCount} 个`);
        console.log(`⏩ 已跳过处理: ${skippedCount} 个`);
    } catch (err) {
        console.error('❌ 处理出错:', err);
    }
}

// 运行
resizeGifs();
