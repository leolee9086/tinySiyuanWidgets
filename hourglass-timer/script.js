/**
 * 沙漏计时器小部件
 * 可视化的沙漏倒计时效果
 */

// DOM 元素
let timeDisplay;
let hourglass;
let topSand;
let bottomSand;
let fallingSand;
let timeButtons;
let startBtn;
let pauseBtn;
let resetBtn;

// 状态变量
let timer;
let timeLeft = 600; // 默认10分钟
let totalTime = 600;
let isRunning = false;
let isPaused = false;

// 初始化应用
function initApp() {
    // 获取DOM元素
    timeDisplay = document.querySelector('.time-display');
    hourglass = document.querySelector('.hourglass-svg');
    topSand = document.querySelector('.top-sand');
    bottomSand = document.querySelector('.bottom-sand');
    fallingSand = document.querySelector('.falling-sand');
    timeButtons = document.querySelectorAll('.time-btn');
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    resetBtn = document.getElementById('resetBtn');
    
    // 设置默认时间（10分钟）
    setTime(600);
    
    // 绑定事件
    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 如果计时器在运行，不允许更改时间
            if (isRunning && !isPaused) return;
            
            // 移除所有活动状态
            timeButtons.forEach(b => b.classList.remove('active'));
            // 设置当前按钮为活动状态
            btn.classList.add('active');
            
            // 设置新的时间
            const newTime = parseInt(btn.getAttribute('data-time'));
            setTime(newTime);
        });
    });
    
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // 初始化默认选中的时间按钮（10分钟）
    timeButtons.forEach(btn => {
        if (parseInt(btn.getAttribute('data-time')) === 600) {
            btn.classList.add('active');
            setTime(600);
        }
    });
}

// 设置时间
function setTime(seconds) {
    timeLeft = seconds;
    totalTime = seconds;
    updateDisplay();
    
    // 重置沙漏样式
    resetSandAnimation();
}

// 启动计时器
function startTimer() {
    if (timeLeft <= 0) return;
    if (isRunning && !isPaused) return;
    
    if (isPaused) {
        isPaused = false;
        hourglass.classList.remove('paused');
    } else {
        isRunning = true;
        
        // 设置沙漏动画
        hourglass.classList.add('running');
        
        // 设置动画时长为剩余时间
        topSand.style.animationDuration = `${timeLeft}s`;
        bottomSand.style.animationDuration = `${timeLeft}s`;
    }
    
    timer = setInterval(updateTimer, 1000);
}

// 暂停计时器
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isPaused = true;
    
    // 暂停沙漏动画
    hourglass.classList.add('paused');
}

// 重置计时器
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    
    timeLeft = totalTime;
    updateDisplay();
    
    // 重置沙漏动画
    resetSandAnimation();
}

// 更新计时器
function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
    } else {
        // 时间到
        clearInterval(timer);
        isRunning = false;
        
        // 播放提醒音效
        playNotificationSound();
        
        // 沙漏动画完成，显示重置状态
        setTimeout(resetSandAnimation, 1000);
    }
}

// 更新显示
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 重置沙漏动画
function resetSandAnimation() {
    // 移除动画类
    hourglass.classList.remove('running', 'paused');
    
    // 清除任何现有的动画
    topSand.style.animation = 'none';
    bottomSand.style.animation = 'none';
    
    // 强制重排
    void hourglass.offsetWidth;
    
    // 重置沙子状态
    if (totalTime === 60) {
        topSand.setAttribute('height', '55');
    } else if (totalTime === 300) {
        topSand.setAttribute('height', '55');
    } else if (totalTime === 600) {
        topSand.setAttribute('height', '55');
    } else if (totalTime === 1800) {
        topSand.setAttribute('height', '55');
    } else {
        topSand.setAttribute('height', '55');
    }
    
    bottomSand.setAttribute('height', '0');
    
    // 清除动画样式
    topSand.style.animation = '';
    bottomSand.style.animation = '';
}

// 播放提醒音效
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
        console.log('Audio play error:', e);
        
        // 使用备用方案
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + Array(300).join('A'));
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play error:', e));
        } catch (e) {
            console.log('No audio support');
        }
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initApp); 