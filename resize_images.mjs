import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * 核心配置：
 * MAX_WIDTH: 目标最大宽度 (微信公众号建议 1080px 或 800px)
 * INPUT_FOLDER: 输入文件夹路径
 */
const MAX_WIDTH = 800; 
const INPUT_FOLDER = process.argv[2] || './doc/260330-鸟群系统Boids/images';

// 允许的处理后缀
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

async function resizeImages() {
    try {
        const files = fs.readdirSync(INPUT_FOLDER);
        
        console.log(`🚀 开始检查并处理目录: ${INPUT_FOLDER}`);
        console.log(`🎯 目标宽度上限: ${MAX_WIDTH}px`);

        let processedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (ALLOWED_EXTENSIONS.includes(ext)) {
                const filePath = path.join(INPUT_FOLDER, file);

                // 读取文件到内存 Buffer
                const inputBuffer = fs.readFileSync(filePath);
                
                // 获取图片元数据 (含原始格式)
                const metadata = await sharp(inputBuffer).metadata();

                if (metadata.width > MAX_WIDTH) {
                    // 只有超过宽度才处理，并显式指定导出格式以防转换
                    await sharp(inputBuffer)
                        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
                        .toFormat(metadata.format) // 显式锁死原始格式 (例如 jpeg 依然是 jpeg)
                        .toFile(filePath);
                    
                    console.log(`✅ 已处理 (${metadata.format.toUpperCase()}, 缩小自 ${metadata.width}px): ${file}`);
                    processedCount++;
                } else {
                    console.log(`⏩ 已跳过 (当前宽度 ${metadata.width}px): ${file}`);
                    skippedCount++;
                }
            }
        }

        console.log(`\n✨ 全部检查完成！`);
        console.log(`✅ 已处理: ${processedCount} 个`);
        console.log(`⏩ 已跳过: ${skippedCount} 个`);
    } catch (err) {
        console.error('❌ 处理出错:', err);
    }
}

// 运行
resizeImages();
