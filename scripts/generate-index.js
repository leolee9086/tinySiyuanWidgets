/**
 * generate-index.js
 * 
 * 此脚本用于自动生成 tinySiyuanWidgets 的 index.html 文件：
 * 1. 扫描项目目录下的所有挂件文件夹
 * 2. 读取每个挂件的 widget.json 文件获取元数据
 * 3. 为每个挂件生成展示卡片
 * 4. 自动创建缺失的 file-list.json 文件
 * 5. 更新 README.md 的挂件列表（可选）
 * 
 * 用法: node scripts/generate-index.js [--update-readme]
 */

const fs = require('fs');
const path = require('path');

// --- 配置 ---
const BASE_DIR = path.resolve(__dirname, '..');
const README_PATH = path.join(BASE_DIR, 'README.md');
const INDEX_HTML_PATH = path.join(BASE_DIR, 'index.html');
const DEFAULT_FILES = ['widget.json', 'index.html', 'style.css', 'script.js', 'AInote.md'];
const WIDGET_TEMPLATE_PATH = path.join(__dirname, 'templates', 'widget-card.template.html');
const INDEX_TEMPLATE_PATH = path.join(__dirname, 'templates', 'index.template.html');
// --- 配置结束 ---

// 创建模板目录（如果不存在）
if (!fs.existsSync(path.join(__dirname, 'templates'))) {
    fs.mkdirSync(path.join(__dirname, 'templates'), { recursive: true });
}

/**
 * 获取挂件文件夹列表
 * @returns {string[]} 文件夹名称数组
 */
function getWidgetFolders() {
    const items = fs.readdirSync(BASE_DIR, { withFileTypes: true });
    const folders = [];
    
    for (const item of items) {
        // 忽略 . 开头的目录和非目录项
        if (item.isDirectory() && !item.name.startsWith('.') && 
            // 忽略特定目录
            !['scripts', 'node_modules', '.git'].includes(item.name)) {
            
            // 检查是否包含 widget.json 文件
            const widgetJsonPath = path.join(BASE_DIR, item.name, 'widget.json');
            if (fs.existsSync(widgetJsonPath)) {
                folders.push(item.name);
            }
        }
    }
    return folders;
}

/**
 * 获取挂件的元数据
 * @param {string} widgetFolder 挂件文件夹名
 * @returns {object} 元数据对象
 */
function getWidgetMetadata(widgetFolder) {
    const widgetJsonPath = path.join(BASE_DIR, widgetFolder, 'widget.json');
    const metadata = JSON.parse(fs.readFileSync(widgetJsonPath, 'utf-8'));
    
    // 获取中文名称，如果不存在则使用默认名称
    let displayName = metadata.displayName?.zh_CN || 
                       metadata.displayName?.default || 
                       metadata.name;
    
    // 获取中文描述，如果不存在则使用默认描述
    let description = metadata.description?.zh_CN || 
                      metadata.description?.default || 
                      '无描述';
    
    return {
        name: metadata.name,
        displayName, 
        description,
        author: metadata.author || 'Unknown'
    };
}

/**
 * 确保挂件有 file-list.json 文件
 * @param {string} widgetFolder 挂件文件夹名
 */
function ensureFileListJson(widgetFolder) {
    const fileListPath = path.join(BASE_DIR, widgetFolder, 'file-list.json');
    
    // 如果文件已存在，无需创建
    if (fs.existsSync(fileListPath)) {
        return;
    }
    
    // 检查文件夹中的实际文件
    const widgetDir = path.join(BASE_DIR, widgetFolder);
    const files = fs.readdirSync(widgetDir)
        .filter(file => fs.statSync(path.join(widgetDir, file)).isFile())
        .filter(file => !file.startsWith('.'));
    
    // 创建 file-list.json
    const fileList = {
        files: files.length > 0 ? files : DEFAULT_FILES
    };
    
    fs.writeFileSync(fileListPath, JSON.stringify(fileList, null, 2));
    console.log(`Created file-list.json for ${widgetFolder}`);
}

/**
 * 生成挂件卡片 HTML
 * @param {string} widgetFolder 挂件文件夹名
 * @param {object} metadata 挂件元数据
 * @returns {string} 卡片 HTML
 */
function generateWidgetCardHtml(widgetFolder, metadata) {
    // 获取文件列表
    const fileListPath = path.join(BASE_DIR, widgetFolder, 'file-list.json');
    let files = DEFAULT_FILES;
    
    if (fs.existsSync(fileListPath)) {
        try {
            const fileList = JSON.parse(fs.readFileSync(fileListPath, 'utf-8'));
            files = fileList.files || DEFAULT_FILES;
        } catch (error) {
            console.warn(`警告: ${widgetFolder} 的 file-list.json 解析失败，使用默认文件列表`);
        }
    }
    
    // 生成文件列表 HTML
    const fileListHtml = files.map(file => `<li>${file}</li>`).join('\n                            ');
    
    // 生成卡片 HTML
    // 如果有模板文件，使用模板，否则硬编码
    let cardHtml = '';
    if (fs.existsSync(WIDGET_TEMPLATE_PATH)) {
        const template = fs.readFileSync(WIDGET_TEMPLATE_PATH, 'utf-8');
        cardHtml = template
            .replace(/\$\{widgetFolder\}/g, widgetFolder)
            .replace(/\$\{displayName\}/g, metadata.displayName)
            .replace(/\$\{description\}/g, metadata.description)
            .replace(/\$\{fileListHtml\}/g, fileListHtml);
    } else {
        cardHtml = `
            <!-- ${metadata.displayName}挂件 -->
            <div class="widget-card">
                <div class="widget-preview">
                    <iframe src="${widgetFolder}/index.html" class="preview-iframe"></iframe>
                </div>
                <div class="widget-info">
                    <h3 class="widget-title">${metadata.displayName}</h3>
                    <p class="widget-description">${metadata.description}</p>
                    <span class="file-list-toggle" onclick="toggleFileList(this)">查看文件清单</span>
                    <div class="file-list">
                        <ul>
                            ${fileListHtml}
                        </ul>
                    </div>
                </div>
                <div class="widget-actions">
                    <button class="btn btn-primary" onclick="previewWidget('${widgetFolder}')">预览</button>
                    <button class="btn btn-success" onclick="deployWidget('${widgetFolder}')">部署到思源</button>
                </div>
            </div>`;
    }
    
    return cardHtml;
}

/**
 * 生成整个 index.html 文件
 * @param {string[]} widgetFolders 挂件文件夹名数组
 */
function generateIndexHtml(widgetFolders) {
    const widgetCards = [];
    
    // 按字母顺序排序挂件文件夹
    widgetFolders.sort();
    
    // 为每个挂件生成卡片
    for (const folder of widgetFolders) {
        const metadata = getWidgetMetadata(folder);
        const cardHtml = generateWidgetCardHtml(folder, metadata);
        widgetCards.push(cardHtml);
    }
    
    // 读取模板文件或现有 index.html
    let indexHtml = '';
    if (fs.existsSync(INDEX_TEMPLATE_PATH)) {
        // 使用模板文件
        indexHtml = fs.readFileSync(INDEX_TEMPLATE_PATH, 'utf-8');
        indexHtml = indexHtml.replace('${widgetCards}', widgetCards.join('\n'));
    } else if (fs.existsSync(INDEX_HTML_PATH)) {
        // 修改现有 index.html
        indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
        
        // 查找 widget-grid 内容并替换
        const widgetGridRegex = /(<div\s+class="widget-grid"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<script>)/;
        if (widgetGridRegex.test(indexHtml)) {
            indexHtml = indexHtml.replace(widgetGridRegex, `$1\n${widgetCards.join('\n')}\n        $3`);
        } else {
            console.error('无法找到 widget-grid 区域以替换内容');
            return;
        }
    } else {
        console.error('模板文件和 index.html 都不存在，无法生成内容');
        return;
    }
    
    // 写入 index.html 文件
    fs.writeFileSync(INDEX_HTML_PATH, indexHtml);
    console.log(`成功生成 index.html，包含 ${widgetFolders.length} 个挂件卡片`);
}

/**
 * 更新 README.md 的挂件列表
 * @param {string[]} widgetFolders 挂件文件夹名数组
 */
function updateReadme(widgetFolders) {
    if (!fs.existsSync(README_PATH)) {
        console.warn('README.md 文件不存在，跳过更新');
        return;
    }
    
    let readme = fs.readFileSync(README_PATH, 'utf-8');
    
    // 按字母顺序排序挂件文件夹
    widgetFolders.sort();
    
    // 准备挂件列表 Markdown
    const widgetListMd = widgetFolders.map(folder => {
        const metadata = getWidgetMetadata(folder);
        return `*   [${metadata.displayName} (${folder})](./${folder}/)`;
    }).join('\n');
    
    // 查找挂件列表区域并替换
    const widgetListRegex = /(## 挂件列表\s*\n\s*目前包含以下挂件：\s*\n)([\s\S]*?)(\n\s*##|\n\s*$)/;
    if (widgetListRegex.test(readme)) {
        readme = readme.replace(widgetListRegex, `$1\n${widgetListMd}$3`);
        fs.writeFileSync(README_PATH, readme);
        console.log('成功更新 README.md 的挂件列表');
    } else {
        console.warn('无法在 README.md 中找到挂件列表区域，跳过更新');
    }
}

// --- 主逻辑 ---
(async () => {
    try {
        // 获取挂件文件夹
        const widgetFolders = getWidgetFolders();
        console.log(`找到 ${widgetFolders.length} 个挂件: ${widgetFolders.join(', ')}`);
        
        if (widgetFolders.length === 0) {
            console.error('未找到任何挂件，无法生成 index.html');
            process.exit(1);
        }
        
        // 确保每个挂件都有 file-list.json
        for (const folder of widgetFolders) {
            ensureFileListJson(folder);
        }
        
        // 生成 index.html
        generateIndexHtml(widgetFolders);
        
        // 如果有 --update-readme 参数，更新 README.md
        if (process.argv.includes('--update-readme')) {
            updateReadme(widgetFolders);
        }
        
        console.log('\n✅ 操作完成！');
        
    } catch (error) {
        console.error(`❌ 发生错误: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
})(); 