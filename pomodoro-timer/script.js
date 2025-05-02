/**
 * 番茄计时器小部件
 * 实现25分钟工作，5分钟休息的循环
 */

// 常量定义
const WORK_TIME = 25 * 60; // 25分钟，单位：秒
const BREAK_TIME = 5 * 60; // 5分钟，单位：秒
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 90; // 圆的周长 (2πr)

// DOM 元素
let timeDisplay;
let statusDisplay;
let progressRing;
let startBtn;
let pauseBtn;
let resetBtn;
let cycleCount;

// 状态变量
let timer;
let timeLeft;
let isRunning = false;
let isPaused = false;
let isBreak = false;
let cycles = 0;

// 初始化应用
function initApp() {
    // 获取DOM元素
    timeDisplay = document.querySelector('.time-display');
    statusDisplay = document.querySelector('.status');
    progressRing = document.querySelector('.progress-ring-circle');
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    resetBtn = document.getElementById('resetBtn');
    cycleCount = document.getElementById('cycleCount');
    
    // 设置初始状态
    resetTimer();
    
    // 设置圆环初始状态
    progressRing.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
    progressRing.style.strokeDashoffset = 0;
    
    // 绑定事件
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
}

// 启动计时器
function startTimer() {
    if (isRunning && !isPaused) return;
    
    if (isPaused) {
        isPaused = false;
    } else {
        isRunning = true;
    }
    
    timer = setInterval(updateTimer, 1000);
}

// 暂停计时器
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isPaused = true;
}

// 重置计时器
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    isBreak = false;
    
    timeLeft = WORK_TIME;
    updateDisplay();
    
    // 重置圆环进度
    updateProgressRing();
    // 移除休息模式样式
    progressRing.classList.remove('break');
    statusDisplay.textContent = '专注';
}

// 更新计时器
function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
        updateProgressRing();
    } else {
        // 时间到，切换模式
        clearInterval(timer);
        
        if (isBreak) {
            // 休息结束，开始工作
            isBreak = false;
            timeLeft = WORK_TIME;
            statusDisplay.textContent = '专注';
            progressRing.classList.remove('break');
        } else {
            // 工作结束，开始休息
            isBreak = true;
            timeLeft = BREAK_TIME;
            statusDisplay.textContent = '休息';
            progressRing.classList.add('break');
            cycles++;
            cycleCount.textContent = cycles;
        }
        
        // 播放提醒音效
        playNotificationSound();
        
        // 更新显示
        updateDisplay();
        updateProgressRing();
        
        // 继续计时
        timer = setInterval(updateTimer, 1000);
    }
}

// 更新显示
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 更新进度环
function updateProgressRing() {
    const totalTime = isBreak ? BREAK_TIME : WORK_TIME;
    const progress = timeLeft / totalTime;
    const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress);
    
    progressRing.style.strokeDashoffset = dashOffset;
}

// 播放提醒音效
function playNotificationSound() {
    // 简单的音效 (可选实现)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + Array(300).join('A'));
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play error:', e));
    } catch (e) {
        console.log('No audio support');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initApp); 