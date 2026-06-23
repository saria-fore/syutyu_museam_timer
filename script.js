// ==========================================
// 🏛️ Focus Art Museum - シンプル自由設計版
// ==========================================

// 現在パズルにセットされている画像データ（Base64）
let currentPuzzleSrc = localStorage.getItem('museum_current_src') || 'baymax.png'; 

// これまでにクリアして獲得したコレクションのリスト（配列）
let completedImages = JSON.parse(localStorage.getItem('museum_completed')) || [];

// ToDoリストと週間統計のデータ
let todoListItems = JSON.parse(localStorage.getItem('museum_todos')) || [];
let weeklyStats = JSON.parse(localStorage.getItem('museum_weekly_stats')) || {
    focusMinutes: [0, 0, 0, 0, 0, 0, 0],
    todoRates: [0, 0, 0, 0, 0, 0, 0]
};

// 応援メッセージ
const cheerMessages = [
    "最高のスタート！", "素晴らしい集中！", "よし、その調子！",
    "いいペース！", "折り返し地点！", "後半戦突入！",
    "ゾーンに入ってるね！", "残すはあとわずか！", "ラストスパート！",
    "完全達成！！おめでとう！"
];

// 状態管理変数
let currentPanels = parseInt(localStorage.getItem('museum_panels')) || 0;
let currentMinutesMode = localStorage.getItem('museum_minutesMode') || "60";
let totalPanels = 9;
let timeLeft = 3600; 
let countdownInterval = null;

// モードごとのマス数設定
const modeSettings = {
    "10": { total: 54, cols: 9, rows: 6 },
    "15": { total: 36, cols: 6, rows: 6 },
    "20": { total: 27, cols: 9, rows: 3 },
    "30": { total: 18, cols: 6, rows: 3 },
    "60": { total: 9,  cols: 3, rows: 3 }
};

// HTML要素の取得
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

// ==========================================
// 📱 アルバムから画像を選択したときの処理（心臓部）
// ==========================================
imageLoader.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        currentPuzzleSrc = event.target.result; // 選んだ画像をセット
        localStorage.setItem('museum_current_src', currentPuzzleSrc);
        
        // パズルをリセットして新しい画像にする
        currentPanels = 0;
        localStorage.setItem('museum_panels', 0);
        
        renderPuzzle();
        updateUI();
        resetTimerDisplay();
        alert("🎨 新しい画像がセットされました！集中を開始しましょう！");
    };
    reader.readAsDataURL(file);
});

// ==========================================
// 🏛️ アプリの初期化と描画
// ==========================================
function initApp() {
    modeSelect.value = currentMinutesMode;
    updateCurrentDate();
    calculateDimensions();
    renderPuzzle();
    renderGallery(); // 獲得したコレクションを表示
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

// 🏛️ 獲得したコレクション（クリアした画像）を並べる関数
function renderGallery() {
    const galleryContainer = document.getElementById('gallery');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = ''; 

    if (completedImages.length === 0) {
        galleryContainer.innerHTML = '<p style="color:var(--text-muted); font-size:12px; width:100%;">まだコレクションはありません。パズルを完成させてアートを獲得しよう！</p>';
        return;
    }

    // クリアした画像が新しい順に並ぶように逆順で表示
    [...completedImages].reverse().forEach((img) => {
        const thumb = document.createElement('img');
        thumb.src = img.src;
        thumb.className = 'gallery-thumb';
        thumb.title = img.date;
        
        // コレクションをタップしたら、その画像をもう一度パズルにセットして遊べるおまけ機能
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

// ==========================================
// ⏳ タイマー処理
// ==========================================
function resetTimerDisplay() {
    clearInterval(countdownInterval); 
    countdownInterval = null;
    timeLeft = parseInt(currentMinutesMode) * 60;
    timerDisplay.innerText = `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`;
    timerDisplay.classList.remove('running'); 
    startTimerBtn.disabled = false;
    startTimerBtn.innerText = "⏳ 集中を開始する";
}

// パズルが1マス埋まった時の処理
function panelCompleted() {
    currentPanels++;
    localStorage.setItem('museum_panels', currentPanels);
    
    const day = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    weeklyStats.focusMinutes[day] += parseInt(currentMinutesMode);
    localStorage.setItem('museum_weekly_stats', JSON.stringify(weeklyStats));
    
    updateUI();
    
    // 🎉 パズルが完全に完成（全面オープン）した場合
    if (currentPanels >= totalPanels) {
        confetti(); // 紙吹雪
        
        // 現在使っていた画像を「獲得コレクション」の配列に保存！
        completedImages.push({ 
            src: currentPuzzleSrc, 
            date: new Date().toLocaleDateString() 
        });
        localStorage.setItem('museum_completed', JSON.stringify(completedImages));
        
        alert("🎉 おめでとうございます！パズルが完成し、コレクションに登録されました！");
        
        // 3秒後に次のパズルの準備（進捗をリセットして再描画）
        setTimeout(() => { 
            currentPanels = 0; 
            localStorage.setItem('museum_panels', 0); 
            initApp(); 
        }, 3000);
    } else {
        // まだ残りのマスがある場合はタイマーをリセットして次のマスへ
        setTimeout(resetTimerDisplay, 1000);
    }
}

// ==========================================
// 📋 ToDoリスト ＆ 週次レビュー（元の機能を維持）
// ==========================================
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

// ==========================================
// 🔧 🔧 【長押しテストモード】
// ==========================================
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

// アプリの起動
initApp();