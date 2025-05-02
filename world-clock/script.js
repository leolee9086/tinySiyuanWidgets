/**
 * 世界时钟小部件
 * 显示多个时区的时间
 */

// 格式化时间为 HH:MM:SS 格式
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// 获取指定时区的时间
function getTimeInTimezone(timezone) {
    const date = new Date();
    const options = {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    try {
        return new Intl.DateTimeFormat('zh-CN', options).format(date);
    } catch (error) {
        console.error(`Error formatting time for timezone ${timezone}:`, error);
        return formatTime(date); // 回退到本地时间
    }
}

// 更新所有时钟显示
function updateAllClocks() {
    const clockContainers = document.querySelectorAll('.clock-container');
    
    clockContainers.forEach(container => {
        const timezone = container.getAttribute('data-timezone');
        const timeElement = container.querySelector('.time');
        
        if (timezone && timeElement) {
            timeElement.textContent = getTimeInTimezone(timezone);
        }
    });
}

// 页面加载时初始化时钟
document.addEventListener('DOMContentLoaded', () => {
    // 立即更新一次
    updateAllClocks();
    
    // 设置定时器，每秒更新一次
    setInterval(updateAllClocks, 1000);
}); 