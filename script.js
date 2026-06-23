
let currentPuzzleSrc = localStorage.getItem('museum_current_src') || 'baymax.png'; 

let completedImages = JSON.parse(localStorage.getItem('museum_completed')) || [];

let todoListItems = JSON.parse(localStorage.getItem('museum_todos')) || [];
let weeklyStats = JSON.parse(localStorage.getItem('museum_weekly_stats')) || {
    focusMinutes: [0, 0, 0, 0, 0, 0, 0],
    todoRates: [0, 0, 0, 0, 0, 0, 0]
};

const cheerMessages = [
    "最高のスタート！", "素晴らしい集中！", "よし、その調子！",
    "いいペース！", "折り返し地点！", "後半戦突入！",
    "ゾーンに入ってるね！", "残すはあとわずか！", "ラストスパート！",
    "完全達成！！おめでとう！"
];

let currentPanels = parseInt(localStorage.getItem('museum_panels')) || 0;
let currentMinutesMode = localStorage.getItem('museum_minutesMode') || "60";
let totalPanels = 9;
let timeLeft = 3600; 
let countdownInterval = null;

const modeSettings = {
    "10": { total: 54, cols: 9, rows: 6 },
    "15": { total: 36, cols: 6, rows: 6 },
    "20": { total: 27, cols: 9, rows: 3 },
    "30": { total: 18, cols: 6, rows: 3 },
    "60": { total: 9,  cols: 3, rows: 3 }
};

const puzzle = document.getElementById('puzzle');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const messageBox = document.getElementById('messageBox');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const modeSelect = document.getElementById('modeSelect');
const imageLoader = document.getElementById('imageLoader');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const achievementRate = document.getElementById('achievementRate');
const todoProgressBar = document.getElementById('todoProgressBar');
const sundayReview = document.getElementById('sundayReview');

imageLoader.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400; 
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            currentPuzzleSrc = canvas.toDataURL('image/jpeg', 0.6); 
            
            localStorage.setItem('museum_current_src', currentPuzzleSrc);
            
            currentPanels = 0;
            localStorage.setItem('museum_panels', 0);
            
            renderPuzzle();
            updateUI();
            resetTimerDisplay();
            alert("🎨 画像を最適化してセットしました！集中を開始しましょう！");
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});


function initApp() {
    modeSelect.value = currentMinutesMode;
    updateCurrentDate();
    calculateDimensions();
    renderPuzzle();
    renderGallery(); 
    renderTodos(); 
    updateUI();
    resetTimerDisplay();
    checkSundayReview(); 
}

function updateCurrentDate() {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const now = new Date();
    document.getElementById('dateDisplay').innerText = `🏛️ ${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} (${dayNames[now.getDay()]})`;
}

function calculateDimensions() {
    const settings = modeSettings[currentMinutesMode];
    totalPanels = settings.total;
    puzzle.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;
    puzzle.style.gridTemplateRows = `repeat(${settings.rows}, 1fr)`;
}

function renderPuzzle() {
    puzzle.innerHTML = '';
    puzzle.style.backgroundImage = `url('${currentPuzzleSrc}')`;

    for (let i = 0; i < totalPanels; i++) {
        const panel = document.createElement('div');
        panel.classList.add('panel');
        if (i < currentPanels) panel.classList.add('revealed');
        puzzle.appendChild(panel);
    }
}

function updateUI() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach((p, i) => {
        if (i < currentPanels) p.classList.add('revealed');
        else p.classList.remove('revealed');
    });
    const percentage = totalPanels > 0 ? (currentPanels / totalPanels) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    statusText.innerText = `進捗: ${currentPanels} / ${totalPanels} マス`;
    const msgIdx = Math.min(Math.floor((currentPanels / totalPanels) * 10), 9);
    messageBox.innerText = cheerMessages[msgIdx];
}

function renderGallery() {
    const galleryContainer = document.getElementById('gallery');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = ''; 

    if (completedImages.length === 0) {
        galleryContainer.innerHTML = '<p style="color:var(--text-muted); font-size:12px; width:100%;">まだコレクションはありません。パズルを完成させてアートを獲得しよう！</p>';
        return;
    }

    [...completedImages].reverse().forEach((img) => {
        const thumb = document.createElement('img');
        thumb.src = img.src;
        thumb.className = 'gallery-thumb';
        thumb.title = img.date;
        
       
        thumb.addEventListener('click', () => {
            if(confirm("🎨 この画像でもう一度パズルに挑戦しますか？")) {
                currentPuzzleSrc = img.src;
                localStorage.setItem('museum_current_src', currentPuzzleSrc);
                currentPanels = 0;
                localStorage.setItem('museum_panels', 0);
                renderPuzzle();
                updateUI();
                resetTimerDisplay();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        galleryContainer.appendChild(thumb);
    });
}

function resetTimerDisplay() {
    clearInterval(countdownInterval); 
    countdownInterval = null;
    timeLeft = parseInt(currentMinutesMode) * 60;
    timerDisplay.innerText = `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`;
    timerDisplay.classList.remove('running'); 
    startTimerBtn.disabled = false;
    startTimerBtn.innerText = "⏳ 集中を開始する";
}

// ==========================================================================
// 🎉 パズルが1マス埋まった時、および完全完成時の処理（超頑丈版）
// ==========================================================================
function panelCompleted() {
    currentPanels++;
    localStorage.setItem('museum_panels', currentPanels);
    
    const day = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    weeklyStats.focusMinutes[day] += parseInt(currentMinutesMode);
    localStorage.setItem('museum_weekly_stats', JSON.stringify(weeklyStats));
    
    updateUI();
    

    if (currentPanels >= totalPanels) {
        confetti(); 
        
       
        let freshCompleted = JSON.parse(localStorage.getItem('museum_completed')) || [];
        
        freshCompleted.push({ 
            src: currentPuzzleSrc, 
            date: new Date().toLocaleDateString() 
        });
        
        localStorage.setItem('museum_completed', JSON.stringify(freshCompleted));
        
        completedImages = freshCompleted;
        
        
        renderGallery();
        
        alert("🎉 おめでとうございます！パズルが完成し、コレクションに登録されました！");
        
        setTimeout(() => { 
            currentPanels = 0; 
            localStorage.setItem('museum_panels', 0); 
            
            calculateDimensions();
            renderPuzzle();
            updateUI();
            resetTimerDisplay();
        }, 3000);
    } else {
        setTimeout(resetTimerDisplay, 1000);
    }
}

function renderTodos() {
    todoList.innerHTML = '';
    todoListItems.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = `todo-item ${t.completed ? 'completed' : ''}`;
        div.innerHTML = `<div><input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTodo(${i})"><span>${t.text}</span></div><button onclick="deleteTodo(${i})">×</button>`;
        todoList.appendChild(div);
    });
    calculateAchievement();
}

function calculateAchievement() {
    if (todoListItems.length === 0) {
        achievementRate.innerText = "達成率: 0%";
        todoProgressBar.style.width = "0%";
        return;
    }
    const rate = Math.round((todoListItems.filter(t => t.completed).length / todoListItems.length) * 100);
    achievementRate.innerText = `達成率: ${rate}%`;
    todoProgressBar.style.width = `${rate}%`;
    weeklyStats.todoRates[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] = rate;
    localStorage.setItem('museum_weekly_stats', JSON.stringify(weeklyStats));
}

window.toggleTodo = (i) => { todoListItems[i].completed = !todoListItems[i].completed; saveTodos(); };
window.deleteTodo = (i) => { todoListItems.splice(i, 1); saveTodos(); };
function saveTodos() { localStorage.setItem('museum_todos', JSON.stringify(todoListItems)); renderTodos(); }

addTodoBtn.onclick = () => {
    if (!todoInput.value.trim()) return;
    todoListItems.push({ text: todoInput.value, completed: false });
    todoInput.value = '';
    saveTodos();
};

modeSelect.onchange = (e) => {
    currentMinutesMode = e.target.value;
    localStorage.setItem('museum_minutesMode', currentMinutesMode);
    currentPanels = 0; 
    localStorage.setItem('museum_panels', 0);
    calculateDimensions(); 
    renderPuzzle(); 
    updateUI(); 
    resetTimerDisplay();
};

function checkSundayReview() {
    if (new Date().getDay() === 0 || window.forceSunday) {
        sundayReview.style.display = "block";
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        if(window.Chart) {
            new Chart(ctx, { type: 'bar', data: { labels: ['月','火','水','木','金','土','日'], datasets: [{ label: '分', data: weeklyStats.focusMinutes, backgroundColor: '#e2b29f' }] } });
        }
    }
}

let touchTimer = null;
let isTestModeActive = false; 

function startPress() {
    touchTimer = setTimeout(() => {
        isTestModeActive = true;
        timerDisplay.style.color = '#e07a7a';
        alert("🔧 【テストモード】3秒タイマーがセットされました！\n「集中を開始する」ボタンを押してください。");
    }, 1000);
}

function cancelPress() {
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    }
}

timerDisplay.style.cursor = 'pointer';
timerDisplay.addEventListener('mousedown', startPress);
timerDisplay.addEventListener('touchstart', startPress, { passive: true });
timerDisplay.addEventListener('mouseup', cancelPress);
timerDisplay.addEventListener('touchend', cancelPress);
timerDisplay.addEventListener('touchcancel', cancelPress);
timerDisplay.addEventListener('mouseleave', cancelPress);

startTimerBtn.onclick = () => {
    if (countdownInterval) return; 

    if (isTestModeActive) {
        timeLeft = 3; 
        isTestModeActive = false; 
    } else {
        timeLeft = parseInt(currentMinutesMode) * 60; 
    }

    timerDisplay.classList.add('running');
    startTimerBtn.disabled = true;
    startTimerBtn.innerText = "🔒 集中ロック中...";
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            panelCompleted(); 
        }
    }, 1000);
};

initApp();