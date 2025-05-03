/**
 * Markdown语法参考卡片 - 脚本
 * 实现功能：
 * 1. 点击代码块复制到剪贴板
 * 2. 切换显示模式（列表/网格）
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化
    initMarkdownReference();
});

/**
 * 初始化Markdown参考卡片功能
 */
function initMarkdownReference() {
    // 为所有代码块添加复制功能
    setupCopyFeature();
    
    // 设置显示模式切换
    setupDisplayToggle();
    
    // 尝试加载上次的显示模式
    loadDisplayMode();
}

/**
 * 设置代码块复制功能
 */
function setupCopyFeature() {
    // 获取所有代码块
    const codeBlocks = document.querySelectorAll('.md-code');
    
    codeBlocks.forEach(block => {
        block.addEventListener('click', async () => {
            try {
                // 获取代码文本
                const codeText = block.textContent;
                
                // 复制到剪贴板
                await navigator.clipboard.writeText(codeText);
                
                // 显示复制成功提示
                showCopyFeedback(block);
            } catch (err) {
                console.error('复制失败:', err);
                
                // 显示复制失败提示
                showCopyFeedback(block, false);
            }
        });
    });
}

/**
 * 显示复制反馈
 * @param {HTMLElement} element - 被点击的元素
 * @param {boolean} success - 是否复制成功
 */
function showCopyFeedback(element, success = true) {
    // 保存原文本
    const originalText = element.textContent;
    const originalBg = element.style.backgroundColor;
    
    // 更新文本和背景色
    element.textContent = success ? '✓ 已复制!' : '✗ 复制失败!';
    element.style.backgroundColor = success ? '#4caf5066' : '#f4433666';
    
    // 禁用点击
    element.style.pointerEvents = 'none';
    
    // 2秒后恢复
    setTimeout(() => {
        element.textContent = originalText;
        element.style.backgroundColor = originalBg;
        element.style.pointerEvents = 'auto';
    }, 1500);
}

/**
 * 设置显示模式切换
 */
function setupDisplayToggle() {
    const toggleBtn = document.getElementById('toggle-display');
    const container = document.querySelector('.md-reference-container');
    
    toggleBtn.addEventListener('click', () => {
        // 切换类名
        const isListView = container.classList.contains('list-view');
        
        if (isListView) {
            container.classList.remove('list-view');
            container.classList.add('grid-view');
            toggleBtn.textContent = '切换为列表显示';
        } else {
            container.classList.remove('grid-view');
            container.classList.add('list-view');
            toggleBtn.textContent = '切换为网格显示';
        }
        
        // 保存当前显示模式
        saveDisplayMode(!isListView);
    });
}

/**
 * 保存显示模式到本地存储
 * @param {boolean} isGridView - 是否为网格视图
 */
function saveDisplayMode(isGridView) {
    localStorage.setItem('md_reference_grid_view', isGridView ? 'true' : 'false');
}

/**
 * 从本地存储加载显示模式
 */
function loadDisplayMode() {
    const container = document.querySelector('.md-reference-container');
    const toggleBtn = document.getElementById('toggle-display');
    
    // 默认为列表视图
    container.classList.add('list-view');
    toggleBtn.textContent = '切换为网格显示';
    
    // 检查本地存储中的设置
    const isGridView = localStorage.getItem('md_reference_grid_view') === 'true';
    
    if (isGridView) {
        container.classList.remove('list-view');
        container.classList.add('grid-view');
        toggleBtn.textContent = '切换为列表显示';
    }
} 