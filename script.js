let currentPuzzleSrc = localStorage.getItem('museum_current_src') || 'baymax.png'; 
let completedImages = JSON.parse(localStorage.getItem('museum_completed')) || [];
let todoListItems = JSON.parse(localStorage.getItem('museum_todos')) || [];
let weeklyStats = JSON.parse(localStorage.getItem('museum_weekly_stats')) || {
    focusMinutes: [0, 0, 0, 0, 0, 0, 0],
    todoRates: [0, 0, 0, 0, 0, 0, 0]
};

let totalMinutes = parseInt(localStorage.getItem('museum_total_minutes')) || 0;
let focusMinutesPool = parseInt(localStorage.getItem('museum_free_pool')) || 0; 

const cheerMessages = [
    "最高のスタート！", "素晴らしい集中！", "よし、その調子！",
    "いいペース！", "折り返し地点！", "後半戦突入！",
    "ゾーンに入ってるね！", "残すはあとわずか！", "ラストスパート！",
    "完全達成！！おめでとう！"
];

let currentPanels = parseInt(localStorage.getItem('museum_panels')) || 0;
let currentMinutesMode = localStorage.getItem('museum_minutesMode') || "50"; 
const totalPanels = 9; 
let timeLeft = 3000; 
let countdownInterval = null;

let isRestMode = false; 
let elapsedSeconds = 0; 

const puzzle = document.getElementById('puzzle');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const messageBox = document.getElementById('messageBox');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const modeSelect = document.getElementById('modeSelect');
const imageLoader = document.getElementById('imageLoader');
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
            let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            currentPuzzleSrc = canvas.toDataURL('image/jpeg', 0.6); 
            localStorage.setItem('museum_current_src', currentPuzzleSrc);
            
            currentPanels = 0;
            localStorage.setItem('museum_panels', 0);
            focusMinutesPool = 0; 
            localStorage.setItem('museum_free_pool', 0);
            isRestMode = false;
            
            renderPuzzle(); updateUI(); resetTimerDisplay(); updateLevelSystem();
            alert("🎨 新しいパズルがセットされました！");
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function updateLevelSystem() {
    let rank = "🏛️ 見習い学芸員";
    if (totalMinutes >= 5000) rank = "👑 伝説の美術館館長";
    else if (totalMinutes >= 3000) rank = "🏛️ 筆頭キュレーター";
    else if (totalMinutes >= 1000) rank = "🎨 専属コレクター";
    else if (totalMinutes >= 300) rank = "🖋️ 新進気鋭の画家";
    
    const userRankEl = document.getElementById('userRank');
    const totalMinutesEl = document.getElementById('totalMinutesDisplay');
    
    if (userRankEl) userRankEl.innerText = rank;
    if (totalMinutesEl) {
        totalMinutesEl.innerText = `総集中: ${totalMinutes}分 (次のマスまであと: ${60 - focusMinutesPool}分)`;
    } else {
        // 💡 HTML側にまだ枠がない場合は、メッセージボックスの横に簡易表示
        statusText.innerText = `進捗: ${currentPanels} / ${totalPanels} マス (次のマスまであと: ${60 - focusMinutesPool}分)`;
    }
}

function initApp() {
    currentMinutesMode = localStorage.getItem('museum_minutesMode') || "50";
    if (currentMinutesMode === "60") currentMinutesMode = "50"; 
    if (modeSelect) modeSelect.value = currentMinutesMode;
    
    updateCurrentDate();
    
    if (puzzle) {
        puzzle.style.gridTemplateColumns = `repeat(3, 1fr)`;
        puzzle.style.gridTemplateRows = `repeat(3, 1fr)`;
        renderPuzzle();
    }
    
    renderGallery(); 
    renderTodos(); 
    updateUI();
    resetTimerDisplay();
    updateLevelSystem(); 
    checkSundayReview(); 
    setupButtonEvents();
}

function updateCurrentDate() {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const now = new Date();
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) dateDisplay.innerText = `🏛️ ${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()} (${dayNames[now.getDay()]})`;
}

function renderPuzzle() {
    if (!puzzle) return;
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
    if (progressBar) progressBar.style.width = `${percentage}%`;
    
    if (isRestMode) {
        if (messageBox) messageBox.innerText = "☕ 心地よい休憩をとりましょう（目を休めてリフレッシュ）";
    } else {
        const msgIdx = Math.min(Math.floor((currentPanels / totalPanels) * 10), 9);
        if (messageBox) messageBox.innerText = cheerMessages[msgIdx];
    }
}

function renderGallery() {
    const galleryContainer = document.getElementById('gallery');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = ''; 
    if (completedImages.length === 0) {
        galleryContainer.innerHTML = '<p style="color:var(--text-muted); font-size:12px; width:100%;">まだコレクションはありません。</p>';
        return;
    }
    [...completedImages].reverse().forEach((img) => {
        const thumb = document.createElement('img');
        thumb.src = img.src; thumb.className = 'gallery-thumb'; thumb.title = img.date;
        thumb.addEventListener('click', () => {
            if(confirm("🎨 この画像でもう一度パズルに挑戦しますか？")) {
                currentPuzzleSrc = img.src;
                localStorage.setItem('museum_current_src', currentPuzzleSrc);
                currentPanels = 0; localStorage.setItem('museum_panels', 0);
                focusMinutesPool = 0; localStorage.setItem('museum_free_pool', 0);
                isRestMode = false;
                renderPuzzle(); updateUI(); resetTimerDisplay(); updateLevelSystem();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        galleryContainer.appendChild(thumb);
    });
}

function resetTimerDisplay() {
    clearInterval(countdownInterval); 
    countdownInterval = null;
    elapsedSeconds = 0;
    
    if (!timerDisplay || !startTimerBtn) return;
    
    timerDisplay.style.color = ''; 
    
    if (isRestMode) {
        timeLeft = 10 * 60; 
        timerDisplay.innerText = "10:00";
        timerDisplay.classList.add('rest-mode');
        startTimerBtn.innerText = "☕ 休憩カウントダウン中";
        startTimerBtn.disabled = true;
    } else if (currentMinutesMode === "free") {
        timerDisplay.innerText = "00:00"; 
        timerDisplay.classList.remove('rest-mode');
        timerDisplay.classList.remove('running');
        startTimerBtn.disabled = false;
        startTimerBtn.innerText = "⏱️ 計測を開始する";
    } else {
        timeLeft = parseInt(currentMinutesMode) * 60;
        timerDisplay.innerText = `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`;
        timerDisplay.classList.remove('rest-mode');
        timerDisplay.classList.remove('running');
        startTimerBtn.disabled = false;
        startTimerBtn.innerText = "⏳ 集中を開始する";
    }
    setupButtonEvents(); 
}

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) { console.log(e); }
}

function checkCollectionUnlock() {
    if (currentPanels >= totalPanels) {
        if (typeof confetti === 'function') confetti();
        let freshCompleted = JSON.parse(localStorage.getItem('museum_completed')) || [];
        freshCompleted.push({ src: currentPuzzleSrc, date: new Date().toLocaleDateString() });
        localStorage.setItem('museum_completed', JSON.stringify(freshCompleted));
        completedImages = freshCompleted;
        renderGallery();
        alert("🎉 おめでとうございます！パズルが完成し、コレクションに登録されました！");
        
        setTimeout(() => {
            currentPanels = 0;
            localStorage.setItem('museum_panels', 0);
            focusMinutesPool = 0;
            localStorage.setItem('museum_free_pool', 0);
            renderPuzzle();
            updateUI();
            updateLevelSystem();
        }, 3000);
    }
}

function addMinutesToPool(minutes) {
    const day = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    weeklyStats.focusMinutes[day] += minutes;
    localStorage.setItem('museum_weekly_stats', JSON.stringify(weeklyStats));
    
    totalMinutes += minutes;
    localStorage.setItem('museum_total_minutes', totalMinutes);
    
    focusMinutesPool += minutes;
    
    let openedCount = 0;
    while (focusMinutesPool >= 60) {
        focusMinutesPool -= 60;
        currentPanels++;
        openedCount++;
    }
    
    localStorage.setItem('museum_free_pool', focusMinutesPool);
    localStorage.setItem('museum_panels', currentPanels);
    
    updateUI();
    updateLevelSystem();
    
    if (openedCount > 0) {
        alert(`🔔 累計集中時間が60分を超えたため、パズルが ${openedCount} マス開きました！`);
    }
    checkCollectionUnlock();
}

function panelCompleted() {
    playNotificationSound();

    if (!isRestMode) {
        const activeMinutes = parseInt(currentMinutesMode);
        addMinutesToPool(activeMinutes);

        isRestMode = true;
        setTimeout(() => {
            resetTimerDisplay();
            startCountdown(); 
        }, 2000);

    } else {
        isRestMode = false;
        alert("🔔 10分間の休憩が終了しました！\n次の準備ができたら、もう一度開始ボタンを押してください。");
        resetTimerDisplay();
        updateUI();
    }
}

function stopAndRecordFreeMode() {
    clearInterval(countdownInterval);
    countdownInterval = null;
    
    const earnedMinutes = Math.max(1, Math.floor(elapsedSeconds / 60)); 
    playNotificationSound();
    
    addMinutesToPool(earnedMinutes);
    resetTimerDisplay();
}

function startCountdown() {
    timerDisplay.classList.add('running');
    startTimerBtn.disabled = true;
    if (!isRestMode) startTimerBtn.innerText = "🔒 集中ロック中...";

    countdownInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            panelCompleted(); 
        }
    }, 1000);
}

function startCountUp() {
    timerDisplay.classList.add('running');
    startTimerBtn.innerText = "🛑 集中を終了して記録する";
    startTimerBtn.disabled = false; 
    
    startTimerBtn.onclick = (e) => {
        e.preventDefault();
        stopAndRecordFreeMode();
    };

    countdownInterval = setInterval(() => {
        elapsedSeconds++;
        const m = Math.floor(elapsedSeconds / 60);
        const s = elapsedSeconds % 60;
        timerDisplay.innerText = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
}

function setupButtonEvents() {
    if (!startTimerBtn) return;
    startTimerBtn.onclick = (e) => {
        e.preventDefault();
        if (countdownInterval) return; 
        
        if (currentMinutesMode === "free") {
            startCountUp();
        } else {
            timeLeft = isRestMode ? 10 * 60 : parseInt(currentMinutesMode) * 60;
            startCountdown();
        }
    };
}

function renderTodos() {
    if (!todoList) return;
    todoList.innerHTML = '';
    todoListItems.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = `todo-item ${t.completed ? 'completed' : ''}`;
        div.innerHTML = `<div><input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTodo(${i})"><span class="todo-text">${t.text}</span></div><button onclick="deleteTodo(${i})">×</button>`;
        todoList.appendChild(div);
    });
    calculateAchievement();
}

function calculateAchievement() {
    if (!achievementRate || !todoProgressBar) return;
    if (todoListItems.length === 0) { achievementRate.innerText = "達成率: 0%"; todoProgressBar.style.width = "0%"; return; }
    const rate = Math.round((todoListItems.filter(t => t.completed).length / todoListItems.length) * 100);
    achievementRate.innerText = `達成率: ${rate}%`; todoProgressBar.style.width = `${rate}%`;
    weeklyStats.todoRates[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] = rate;
    localStorage.setItem('museum_weekly_stats', JSON.stringify(weeklyStats));
}

window.toggleTodo = (i) => { todoListItems[i].completed = !todoListItems[i].completed; saveTodos(); };
window.deleteTodo = (i) => { todoListItems.splice(i, 1); saveTodos(); };
function saveTodos() { localStorage.setItem('museum_todos', JSON.stringify(todoListItems)); renderTodos(); }

if (document.getElementById('addTodoBtn')) {
    document.getElementById('addTodoBtn').onclick = () => {
        const todoInput = document.getElementById('todoInput');
        if (!todoInput || !todoInput.value.trim()) return;
        todoListItems.push({ text: todoInput.value, completed: false });
        todoInput.value = ''; saveTodos();
    };
}

if (modeSelect) {
    modeSelect.onchange = (e) => {
        currentMinutesMode = e.target.value;
        localStorage.setItem('museum_minutesMode', currentMinutesMode);
        isRestMode = false;
        resetTimerDisplay(); updateLevelSystem(); updateUI();
    };
}

function checkSundayReview() {
    if (!sundayReview) return;
    if (new Date().getDay() === 0 || window.forceSunday) {
        sundayReview.style.display = "block";
        const ctx = document.getElementById('weeklyChart');
        if(ctx && window.Chart) {
            new Chart(ctx.getContext('2d'), { type: 'bar', data: { labels: ['月','火','水','木','金','土','日'], datasets: [{ label: '分', data: weeklyStats.focusMinutes, backgroundColor: '#e2b29f' }] } });
        }
    }
}

let touchTimer = null;
let isTestModeActive = false; 
if (timerDisplay) {
    timerDisplay.style.cursor = 'pointer';
    timerDisplay.addEventListener('mousedown', () => {
        if (currentMinutesMode === "free" || isRestMode) return;
        touchTimer = setTimeout(() => { isTestModeActive = true; timerDisplay.style.color = '#e07a7a'; alert("🔧 3秒テストモードにしました"); }, 1000);
    });
    timerDisplay.addEventListener('mouseup', () => { if (touchTimer) clearTimeout(touchTimer); });
    
    if (startTimerBtn) {
        startTimerBtn.addEventListener('click', () => {
            if (isTestModeActive && !isRestMode) { timeLeft = 3; isTestModeActive = false; clearInterval(countdownInterval); startCountdown(); }
        });
    }
}

initApp();