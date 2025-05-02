/**
 * 检查是否为闰年
 * @param {number} year - 年份
 * @returns {boolean} 如果是闰年返回 true，否则返回 false
 */
const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * 计算当天是今年的第几天
 * @param {Date} date - 当前日期对象
 * @returns {number} 当天在年份中的天数 (1-366)
 */
const getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0); // 当年的第一天前一天
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

/**
 * 获取指定月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {number} 该月份的天数
 */
const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate(); // 月份参数month若为1，则表示2月，所以需要用实际月份
};

/**
 * 更新数字时钟显示
 */
const updateClock = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const clockElement = document.getElementById('digitalClock');
    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
};

/**
 * 更新进度条显示
 */
const updateProgressBars = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 月份从 0 开始，加 1
    const day = now.getDate();
    // getDay() 返回的是星期几 (0 for Sunday, 1 for Monday, etc.)
    // 我们希望周一是一周的开始，所以做些调整
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 将周日(0)调整为7

    // 年进度
    const dayOfYear = getDayOfYear(now);
    const daysInYear = isLeapYear(year) ? 366 : 365;
    const yearProgress = (dayOfYear / daysInYear) * 100;
    const yearProgressBar = document.getElementById('yearProgressBar');
    const yearProgressText = document.getElementById('yearProgressText');
    if (yearProgressBar) yearProgressBar.style.width = `${yearProgress}%`;
    if (yearProgressText) yearProgressText.textContent = `${dayOfYear}/${daysInYear}`;

    // 月进度
    const daysInMonth = getDaysInMonth(year, month);
    const monthProgress = (day / daysInMonth) * 100;
    const monthProgressBar = document.getElementById('monthProgressBar');
    const monthProgressText = document.getElementById('monthProgressText');
    if (monthProgressBar) monthProgressBar.style.width = `${monthProgress}%`;
    if (monthProgressText) monthProgressText.textContent = `${day}/${daysInMonth}`;

    // 周进度 (周一为第一天)
    const weekProgress = (dayOfWeek / 7) * 100;
    const weekProgressBar = document.getElementById('weekProgressBar');
    const weekProgressText = document.getElementById('weekProgressText');
    if (weekProgressBar) weekProgressBar.style.width = `${weekProgress}%`;
    if (weekProgressText) weekProgressText.textContent = `${dayOfWeek}/7`;

};

/**
 * 初始化时钟和进度条
 */
const initializeClockAndProgress = () => {
    updateClock();
    updateProgressBars();
    setInterval(updateClock, 1000); // 时钟每秒更新
    // 进度条不需要每秒更新，可以设置更长的间隔，例如每分钟或每小时
    // 这里设置为每分钟更新一次 (60 * 1000 ms)
    setInterval(updateProgressBars, 60 * 1000);
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeClockAndProgress); 