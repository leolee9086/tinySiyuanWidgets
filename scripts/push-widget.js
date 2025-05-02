const fs = require('fs');
const path = require('path');
const http = require('http');

// --- 配置 ---
const SIYUAN_API_URL = 'http://127.0.0.1:6806';
const SIYUAN_API_PATH = '/api/file/putFile';
const WIDGETS_BASE_DIR = path.resolve(__dirname, '..'); // tinySiyuanWidgets 目录
const TOKEN_FILE_PATH = path.resolve(__dirname, '..', '..', 'tokens'); // 根目录下的 tokens 文件
// --- 配置结束 ---

/**
 * 使用 Promise 包装 http.request 以支持 async/await
 * @param {object} options - http.request 的选项
 * @param {Buffer | string} requestBody - 要发送的请求体数据 (可以是 Buffer)
 * @returns {Promise<object>} 返回包含 statusCode 和 body 的 Promise
 */
function sendRequest(options, requestBody) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseBody = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: responseBody });
            });
        });

        req.on('error', (e) => {
            reject(e); // 直接拒绝 Promise
        });

        // 写入请求体数据 (可以是 Buffer)
        req.write(requestBody);
        req.end();
    });
}

/**
 * 递归获取指定目录下的所有文件路径（相对于目录本身）
 * @param {string} dirPath - 要遍历的目录的绝对路径
 * @param {string} relativePath - 当前递归到的相对路径 (内部使用)
 * @returns {string[]} 文件相对路径列表
 */
function getAllFiles(dirPath, relativePath = '') {
    let files = [];
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        const currentRelativePath = path.join(relativePath, item.name).replace(/\\/g, '/'); // 统一使用 /

        if (item.isDirectory()) {
            files = files.concat(getAllFiles(fullPath, currentRelativePath));
        } else {
            files.push(currentRelativePath);
        }
    }
    return files;
}

/**
 * 手动构建 multipart/form-data 请求体
 * @param {object} fields - 包含表单字段的对象 { name: value }
 * @param {object} fileInfo - 包含文件信息 { name: 'file', filename: 'a.txt', buffer: Buffer }
 * @param {string} boundary - 分界字符串
 * @returns {Buffer}
 */
function buildMultipartFormData(fields, fileInfo, boundary) {
    const boundaryMarker = `--${boundary}\r\n`;
    const boundaryEnd = `--${boundary}--\r\n`;
    const buffers = [];

    // 添加普通表单字段
    for (const name in fields) {
        buffers.push(Buffer.from(boundaryMarker));
        buffers.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
        buffers.push(Buffer.from(`${fields[name]}\r\n`));
    }

    // 添加文件字段
    if (fileInfo && fileInfo.buffer) {
        buffers.push(Buffer.from(boundaryMarker));
        buffers.push(Buffer.from(`Content-Disposition: form-data; name="${fileInfo.name}"; filename="${fileInfo.filename}"\r\n`));
        buffers.push(Buffer.from(`Content-Type: application/octet-stream\r\n\r\n`)); // 使用通用二进制流类型
        buffers.push(fileInfo.buffer);
        buffers.push(Buffer.from('\r\n'));
    }

    // 添加结束标记
    buffers.push(Buffer.from(boundaryEnd));

    return Buffer.concat(buffers);
}

/**
 * 读取 API Token
 * @returns {string | null} 返回 Token 字符串或 null
 */
function getToken() {
    try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
            const tokenContent = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8').trim();
            // 使用第一行非空内容作为 Token
            const lines = tokenContent.split(/\r?\n/);
            for (const line of lines) {
                if (line.trim()) {
                    return line.trim();
                }
            }
        }
    } catch (error) {
        console.warn(`   ⚠️ Warning: Failed to read token file at ${TOKEN_FILE_PATH}: ${error.message}`);
    }
    return null;
}

/**
 * 将单个文件推送到思源
 * @param {string} widgetName - 挂件名称 (文件夹名)
 * @param {string} relativeFilePath - 文件相对于挂件目录的路径
 * @param {string} apiToken - 思源 API Token
 * @returns {Promise<void>}
 */
async function pushFileToSiyuan(widgetName, relativeFilePath, apiToken) {
    const sourceFilePath = path.join(WIDGETS_BASE_DIR, widgetName, relativeFilePath);
    const targetPath = `data/widgets/${widgetName}/${relativeFilePath}`.replace(/\\/g, '/');
    const filename = path.basename(relativeFilePath);

    try {
        const fileContentBuffer = fs.readFileSync(sourceFilePath);
        const stats = fs.statSync(sourceFilePath);
        const modTime = String(stats.mtime.getTime()); // API 需要字符串形式的时间戳

        // 生成唯一的 boundary
        const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;

        // 准备表单字段
        const fields = {
            path: targetPath,
            isDir: 'false',
            modTime: modTime
        };

        // 准备文件信息
        const fileInfo = {
            name: 'file', // API 期望的文件字段名
            filename: filename,
            buffer: fileContentBuffer
        };

        // 构建 multipart/form-data 请求体
        const requestBody = buildMultipartFormData(fields, fileInfo, boundary);

        const options = {
            hostname: '127.0.0.1',
            port: 6806,
            path: SIYUAN_API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': requestBody.length,
                'Authorization': `Token ${apiToken}`,
            }
        };

        console.log(`    Pushing: ${relativeFilePath} -> ${targetPath}`);
        const { statusCode, body } = await sendRequest(options, requestBody);

        if (statusCode === 200) {
            try {
                const parsedResponse = JSON.parse(body);
                if (parsedResponse.code === 0) {
                    // console.log(`    ✅ Success: ${relativeFilePath}`);
                } else {
                    console.error(`    ❌ API Error for ${relativeFilePath}: [${parsedResponse.code}] ${parsedResponse.msg}`);
                }
            } catch (parseError) {
                console.error(`    ❌ Failed to parse response for ${relativeFilePath}: ${parseError.message}`);
                console.error(`       Raw response: ${body}`);
            }
        } else {
            console.error(`    ❌ HTTP Error for ${relativeFilePath}: Status Code ${statusCode}`);
            console.error(`       Response body: ${body}`);
        }

    } catch (error) {
        console.error(`❌ Error processing file ${relativeFilePath}: ${error.message}`);
    }
}

// --- 主逻辑 ---
(async () => {
    const widgetName = process.argv[2];
    const apiToken = getToken();

    if (!widgetName) {
        console.error('❌ Usage: node scripts/push-widget.js <widget-name>');
        console.error('   Ensure API token is available in the \'tokens\' file in the workspace root.');
        process.exit(1);
    }

    if (!apiToken) {
        console.error(`❌ Error: API Token not found. Please create a \'tokens\' file in the workspace root (${path.dirname(TOKEN_FILE_PATH)}) and add your token.`);
        process.exit(1);
    }

    const widgetSourceDir = path.join(WIDGETS_BASE_DIR, widgetName);

    if (!fs.existsSync(widgetSourceDir) || !fs.statSync(widgetSourceDir).isDirectory()) {
        console.error(`❌ Error: Widget directory not found: ${widgetSourceDir}`);
        process.exit(1);
    }

    console.log(`🚀 Starting push for widget: ${widgetName}`);
    console.log(`   Source directory: ${widgetSourceDir}`);

    try {
        const filesToPush = getAllFiles(widgetSourceDir);
        if (filesToPush.length === 0) {
            console.warn('   ⚠️ No files found in the widget directory.');
            return;
        }

        console.log(`   Found ${filesToPush.length} files to push.`);

        // 使用 for...of 循环顺序推送
        for (const relativeFilePath of filesToPush) {
            await pushFileToSiyuan(widgetName, relativeFilePath, apiToken);
        }

        console.log(`
✅ Push completed for widget: ${widgetName}`);
        console.log(`   Please reload Siyuan or the specific document containing the widget if needed.`);

    } catch (error) {
        console.error(`❌ An unexpected error occurred: ${error.message}`);
        process.exit(1);
    }
})();
