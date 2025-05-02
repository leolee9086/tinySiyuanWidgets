# 这个区段由开发者编写,未经允许禁止AI修改

# 修改记录

## 2025-05-02 (织)
*   **创建**: `push-widget.js`
    *   **功能**: 此脚本用于将 `tinySiyuanWidgets` 目录下指定名称的挂件文件，通过思源的 `/api/file/putFile` 接口，部署到本地运行的思源实例 (http://127.0.0.1:6806) 的 `data/widgets/` 目录下。
    *   **实现细节 (初始版本)**: 
        *   接收挂件名称和 API Token 作为命令行参数。
        *   递归读取挂件源目录下的所有文件。
        *   将文件内容进行 Base64 编码。
        *   构造 JSON 请求体。
        *   使用 Node.js 内置的 `http` 模块发送 POST 请求 (`Content-Type: application/json`)。
        *   提供详细的控制台日志输出。
    *   **用法**: `node scripts/push-widget.js <widget-name> <api-token>`
*   **创建**: 初始化 `AInote.md` 文件。

## 2025-05-02 (织)
*   **修改**: `push-widget.js`
    *   **背景**: 初始版本使用 JSON + Base64 发送请求，但实际运行遇到 `[400] form file is nil` 错误，经查阅源码和修正 API 文档 (`siyuan-kernelApi-docs/file/putFile.html`)，确认 `/api/file/putFile` 需要 `multipart/form-data` 格式。
    *   **修改内容**: 
        *   重写了请求发送逻辑，不再构造 JSON。
        *   添加了 `buildMultipartFormData` 函数，使用 Node.js 内置模块手动构建 `multipart/form-data` 格式的请求体 Buffer，包含 `path`, `isDir`, `modTime` 表单字段和 `file` 文件字段。
        *   读取文件内容为 Buffer，不再进行 Base64 编码。
        *   更新了 `http.request` 的 `Content-Type` header 为 `multipart/form-data; boundary=...` 并正确计算 `Content-Length`。
        *   `sendRequest` 函数现在可以接收 Buffer 作为请求体。
    *   **目的**: 使脚本能够成功调用 `/api/file/putFile` 接口。

## 2025-05-02 (织)
*   **修改**: `push-widget.js`
    *   **原因**: 提高脚本易用性，避免每次运行时手动输入 API Token。
    *   **修改内容**: 
        *   添加了 `getToken` 函数，用于读取工作空间根目录下 `tokens` 文件中的第一个非空行作为 API Token。
        *   修改主逻辑，不再从命令行参数 `process.argv[3]` 获取 Token，而是调用 `getToken` 函数。
        *   更新了脚本的用法说明和错误提示信息。
    *   **目的**: 实现 Token 的自动读取，简化部署流程。 

## 2025-05-02 (织)
*   **创建**: `index.html`
    *   **功能**: 创建了一个可视化的挂件目录页面，用于展示和部署所有挂件。
    *   **实现细节**:
        *   展示所有可用挂件的卡片式布局，包含预览、描述和操作按钮。
        *   允许用户填写思源笔记实例URL和API Token。
        *   提供每个挂件的预览和部署功能。
        *   支持查看每个挂件的文件清单。
        *   使用浏览器Fetch API实现部署功能，通过FormData构建multipart/form-data请求。
        *   提供详细的部署状态反馈。
    *   **目的**: 提供更友好的用户界面，简化挂件的预览和部署流程。

*   **创建**: 为每个挂件添加 `file-list.json` 文件
    *   **功能**: 为每个挂件提供文件清单，便于部署工具识别需要部署的文件。
    *   **内容**: 包含widget.json、index.html、style.css、script.js和AInote.md文件。
    *   **目的**: 确保部署工具能够准确地部署所有必要文件。 

## 2025-05-03 00:44 (织)

*   **创建**: `generate-index.js`
    *   **功能**: 自动生成 `index.html` 文件，扫描所有挂件并生成展示页面。
    *   **实现细节**:
        *   扫描项目目录下的所有挂件文件夹，忽略非挂件目录
        *   读取每个挂件的 `widget.json` 文件获取元数据
        *   为每个挂件生成展示卡片
        *   自动创建缺失的 `file-list.json` 文件
        *   可选参数 `--update-readme` 用于更新 README.md 的挂件列表
        *   使用模板文件系统，便于统一修改样式
    *   **优势**:
        *   无需手动编辑 index.html，减少错误
        *   统一所有挂件的展示风格
        *   简化新挂件的添加流程
        *   自动生成完整挂件列表
    *   **用法**: `node scripts/generate-index.js [--update-readme]`
    *   **提升**: 建议未来考虑增加 watch 模式，实时监控挂件变更并自动更新

*   **创建**: `templates/widget-card.template.html`
    *   **功能**: 为生成器提供挂件卡片的 HTML 模板
    *   **作用**: 将挂件的展示风格与生成逻辑分离，便于后续调整布局和样式
    *   **变量**: 使用 `${widgetFolder}`, `${displayName}`, `${description}`, `${fileListHtml}` 作为替换变量 