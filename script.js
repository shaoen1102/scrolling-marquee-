// --- 1. 初始化與全域變數 ---
let drawnNumbers = [];
let timerInterval = null;
let firebaseInteractions = { likes: 0, stars: 0, rockets: 0 };

// --- 2. 跑馬燈 (Marquee) 邏輯 ---
function updateMarquee() {
    const text = document.getElementById('input-marquee').value || "歡迎來到全功能互動工具平台！🚀";
    document.getElementById('marquee-text').innerText = text;
    localStorage.setItem('marquee-text', text);
}

function updateMarqueeStyle() {
    const marqueeBg = document.getElementById('marquee-bg');
    const marqueeText = document.getElementById('marquee-text');
    const fontColor = document.getElementById('input-font-color').value;
    const bgColor = document.getElementById('input-bg-color').value;
    const speed = document.getElementById('input-speed').value;

    marqueeBg.style.backgroundColor = bgColor;
    marqueeText.style.color = fontColor;
    marqueeText.style.animationDuration = speed + 's';

    // 儲存設定
    localStorage.setItem('marquee-font-color', fontColor);
    localStorage.setItem('marquee-bg-color', bgColor);
    localStorage.setItem('marquee-speed', speed);
}

// --- 3. 活動標題 (Title) 邏輯 ---
function updateTitle() {
    const titleText = document.getElementById('input-title').value || "互動直播活動";
    const displayTitle = document.getElementById('display-title');
    displayTitle.innerText = titleText;
    localStorage.setItem('event-title', titleText);
}

// --- 4. 倒數計時器 (Timer) 邏輯 ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    let minutes = parseInt(document.getElementById('timer-min').value) || 0;
    let seconds = parseInt(document.getElementById('timer-sec').value) || 0;
    let totalSeconds = minutes * 60 + seconds;

    if (totalSeconds <= 0) {
        alert("請輸入有效的倒數時間！");
        return;
    }

    document.getElementById('timer-status').innerText = "倒數中...";
    
    timerInterval = setInterval(() => {
        totalSeconds--;
        
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        document.getElementById('timer-display').innerText = 
            `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer-status').innerText = "時間到！🔔";
            document.getElementById('alert-sound').play();
            alert("時間到！");
        }
    }, 1000);
}

function resetTimer() {
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('timer-display').innerText = "00:00";
    document.getElementById('timer-status').innerText = "等待啟動...";
}

// --- 5. YouTube 播放器邏輯 ---
function updateVideo() {
    const url = document.getElementById('input-yt-url').value;
    const videoWrapper = document.getElementById('video-wrapper');
    
    if (!url) {
        alert("請輸入 YouTube 網址！");
        return;
    }

    const videoId = extractVideoID(url);
    if (videoId) {
        videoWrapper.innerHTML = `
            <iframe width="100%" height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                title="YouTube video player" frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen></iframe>
        `;
    } else {
        alert("無效的 YouTube 網址，請確認！");
    }
}

function extractVideoID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : url; // 沒對上時嘗試直接當 ID
}

// --- 6. 隨機抽號碼機邏輯 ---
function drawNumbers() {
    const start = parseInt(document.getElementById('num-start').value);
    const end = parseInt(document.getElementById('num-end').value);
    const count = parseInt(document.getElementById('num-count').value);
    const excludeInput = document.getElementById('num-exclude').value;
    const noRepeat = document.getElementById('num-no-repeat').checked;

    const excludes = excludeInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    const resultDisplay = document.getElementById('numbers-result');
    const historyDisplay = document.getElementById('generator-history');

    if (isNaN(start) || isNaN(end) || start >= end) {
        alert("請輸入正確的號碼範圍！");
        return;
    }

    // 建立可用號碼池
    let pool = [];
    for (let i = start; i <= end; i++) {
        if (!excludes.includes(i)) {
            if (!noRepeat || !drawnNumbers.includes(i)) {
                pool.push(i);
            }
        }
    }

    if (pool.length < count) {
        alert("可用號碼不足！(可能已被排除或抽完)");
        return;
    }

    // 隨機抽選
    let lucky = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        lucky.push(pool.splice(idx, 1)[0]);
    }

    // 更新結果與顯示動畫
    resultDisplay.innerHTML = "";
    lucky.forEach((num, index) => {
        drawnNumbers.push(num);
        const ball = document.createElement('div');
        ball.className = 'number-ball';
        ball.innerText = num;
        ball.style.animationDelay = (index * 0.2) + 's';
        resultDisplay.appendChild(ball);
    });

    historyDisplay.innerText = "已抽取過的號碼: " + drawnNumbers.join(', ');
}

function clearNumbers() {
    drawnNumbers = [];
    document.getElementById('numbers-result').innerHTML = "";
    document.getElementById('generator-history').innerText = "尚未開始抽獎";
}

// --- 7. Firebase 即時互動邏輯 ---
// ⚠️ 請在此處填入您的 Firebase 設定 ⚠️
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 只有在填入設定後才初始化
let db = null;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    
    // 監聽即時數據
    const interactionRef = db.ref('interactions');
    interactionRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            firebaseInteractions = data;
            updateInteractionBadges();
        }
    });
}

function sendInteraction(type) {
    // 本地即時反應 (視覺)
    const btn = event.currentTarget;
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 500);

    if (db) {
        // 更新 Firebase
        const ref = db.ref('interactions/' + type);
        ref.transaction((currentValue) => (currentValue || 0) + 1);
    } else {
        // 如果沒設定 Firebase，則本地增加
        firebaseInteractions[type]++;
        updateInteractionBadges();
        console.warn("Firebase 未設定，僅本地更新。");
    }
}

function updateInteractionBadges() {
    document.getElementById('count-likes').innerText = firebaseInteractions.likes || 0;
    document.getElementById('count-stars').innerText = firebaseInteractions.stars || 0;
    document.getElementById('count-rockets').innerText = firebaseInteractions.rockets || 0;
}

// --- 8. 載入存儲設定 ---
window.onload = function() {
    // 載入跑馬燈
    const savedText = localStorage.getItem('marquee-text');
    if (savedText) {
        document.getElementById('input-marquee').value = savedText;
        updateMarquee();
    }
    
    const savedFontColor = localStorage.getItem('marquee-font-color');
    const savedBgColor = localStorage.getItem('marquee-bg-color');
    const savedSpeed = localStorage.getItem('marquee-speed');
    
    if (savedFontColor) document.getElementById('input-font-color').value = savedFontColor;
    if (savedBgColor) document.getElementById('input-bg-color').value = savedBgColor;
    if (savedSpeed) document.getElementById('input-speed').value = savedSpeed;
    
    updateMarqueeStyle();

    // 載入標題
    const savedTitle = localStorage.getItem('event-title');
    if (savedTitle) {
        document.getElementById('input-title').value = savedTitle;
        updateTitle();
    }
};
