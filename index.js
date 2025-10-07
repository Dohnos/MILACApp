// --- Kompletní a finální Firebase konfigurace ---
const firebaseConfig = {
  apiKey: "AIzaSyCr0mWTp9rYWTfnPEN5ZSWEcWf2kz0g6KU",
  authDomain: "milacapp-4e209.firebaseapp.com",
  databaseURL: "https://milacapp-4e209-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "milacapp-4e209",
  storageBucket: "milacapp-4e209.appspot.com",
  messagingSenderId: "965183350247",
  appId: "1:965183350247:web:0078481af23ac2ba780942"
};
// --- Konec konfigurace ---

// Herní data s výběrem možností a odměnami ve formě emojis
const TASKS = [
    { 
        id: 0, 
        title: "Úkol 1: Olomouc",
        coords: [49.5942, 17.2510],
        question: "Zítra nás čeká společných 8 let. Neuvěřitelné. Kolik dní to je, co jsme spolu?",
        options: ["2 920 dní", "3 920 dní", "3 500 dní"],
        answer: "2 920 dní",
        clue: "Správně, lásko! Další cíl je místo, kde jsme si užili náš společný wellness již několikrát. Leží kousek za hranicemi.",
        reward: {
            icon: '💐',
            text: "Jako malá pozornost za tvou skvělou paměť. Krásná květina pro krásnou ženu."
        }
    },
    { 
        id: 1, 
        title: "Úkol 2: Laa an der Thaya",
        coords: [48.7183, 16.3916],
        question: "Kde jsme byli na první naši společné dovolené?",
        options: ["Egypt - Hurghada", "Dánsko - Copenhagen", "Polsko - Opole"],
        answer: "Egypt - Hurghada",
        clue: "Přesně tak! Bylo to magické. Nyní se vydejme do srdce Pálavy, do města, kterému se přezdívá perla jižní Moravy.",
        reward: {
            icon: '☕️',
            text: "Tvoje milovaná káva na kterou nedáš dopustit!"
        }
    },
    { 
        id: 2, 
        title: "Úkol 3: Mikulov, Náměstí",
        coords: [48.8055, 16.6378],
        question: "Kdy jsme si jeli pro našeho mazlíčka, hafana Ebiska?",
        options: ["5. Srpna 2022", "10. Července 2022", "10. Srpna 2022"],
        answer: "10. Srpna 2022",
        clue: "Jsi neuvěřitelná! Poslední úkol na tebe čeká na místě s nejkrásnějším výhledem na celé město. Místo, kde se nebe dotýká země.",
        reward: {
            icon: '✨',
            text: "Malý balíček pro chvíle pohody, které si zasloužíš."
        }
    },
    { 
        id: 3, 
        title: "Úkol 4: Svatý kopeček, Mikulov",
        coords: [48.8035, 16.6508],
        question: "Rozhlédni se kolem sebe. Co jsou dvě slova, která nejlépe vystihuje naši společnou budoucnost?",
        options: ["Majetek a věci", "Cestování a zážitky", "Láska a navždy"],
        answer: "Láska a navždy",
        clue: "Dokázala jsi to! Jsi moje šikula. Mrkni na videjko a vrať se zpět.",
        // Zde záměrně není odměna, aby se zachovalo překvapení
        videoUrl: "https://www.icloud.com/photos/#/icloudlinks/08aaOxKp-D6ED8bAI5pboYOXw/0/" // <-- ZDE VLOŽTE ODKAZ NA VIDEO
    }
];

// Globální proměnné
let map;
let gameState = { currentTaskIndex: 0, completedTasks: {} };
let database, gameStateRef;

// Elementy DOM
const welcomeScreen = document.getElementById('welcome-screen');
const startButton = document.getElementById('start-button');
const appContainer = document.getElementById('app-container');
const completionScreen = document.getElementById('completion-screen');
const progressIndicator = document.getElementById('progress-indicator');
const taskModal = document.getElementById('task-modal');
const taskModalTitle = document.getElementById('task-title');
const taskModalQuestion = document.getElementById('task-question');
const answerOptionsContainer = document.getElementById('answer-options');
const feedbackMessage = document.getElementById('feedback-message');
const continueButton = document.getElementById('continue-button');
const closeButton = document.querySelector('.close-button');

// Elementy pro odměny
const rewardModal = document.getElementById('reward-modal');
const rewardIconContainer = document.getElementById('reward-icon-container');
const rewardText = document.getElementById('reward-text');
const rewardContinueButton = document.getElementById('reward-continue-button');

// Elementy pro video
const videoModal = document.getElementById('video-modal');
const finalVideoLink = document.getElementById('final-video-link');
const videoContinueButton = document.getElementById('video-continue-button');

/**
 * Inicializace Firebase
 */
function initFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        gameStateRef = database.ref('gameState');
    } catch (e) {
        console.error("Firebase initialization error:", e);
        alert("Chyba připojení k databázi. Zkontrolujte prosím konfiguraci a připojení k internetu.");
    }
}

/**
 * Inicializace Leaflet mapy
 */
function initMap() {
    map = L.map('map').setView([49.1951, 16.6068], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

/**
 * Zobrazí finální obrazovku
 */
function showCompletionScreen() {
    appContainer.classList.add('hidden');
    completionScreen.classList.remove('hidden');
}

/**
 * Aktualizuje UI na základě herního stavu
 */
function updateUI() {
    if (gameState.currentTaskIndex >= TASKS.length) {
        showCompletionScreen();
        return;
    }
    progressIndicator.textContent = `Úkol ${gameState.currentTaskIndex + 1} z ${TASKS.length}`;
    renderTaskMarkers();
}

/**
 * Vykreslí značky úkolů na mapě
 */
function renderTaskMarkers() {
    map.eachLayer(layer => {
        if (layer.options.isTaskMarker) map.removeLayer(layer);
    });

    TASKS.forEach(task => {
        let iconClass = 'marker-locked';
        let isClickable = false;

        if (gameState.completedTasks[task.id]) {
            iconClass = 'marker-completed';
        } else if (task.id === gameState.currentTaskIndex) {
            iconClass = 'marker-current';
            isClickable = true;
        }

        const customIcon = L.divIcon({ className: `leaflet-marker-icon ${iconClass}`, iconSize: [32, 32] });
        const marker = L.marker(task.coords, { icon: customIcon, isTaskMarker: true }).addTo(map);

        if (isClickable) {
            marker.on('click', () => openTaskModal(task));
        }
    });
}

/**
 * Otevře modální okno pro daný úkol
 */
function openTaskModal(task) {
    taskModalTitle.textContent = task.title;
    taskModalQuestion.textContent = task.question;
    
    answerOptionsContainer.innerHTML = '';
    feedbackMessage.classList.add('hidden');
    continueButton.classList.add('hidden');
    
    task.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.onclick = () => handleAnswerSelection(option, task, button);
        answerOptionsContainer.appendChild(button);
    });

    taskModal.classList.remove('modal-hidden');
}

/**
 * Zavře modální okno úkolu
 */
function closeTaskModal() {
    taskModal.classList.add('modal-hidden');
}

/**
 * Otevře modální okno s odměnou
 */
function openRewardModal(task) {
    if (!task.reward) {
        advanceGameState(task); // Pokud není odměna, rovnou postup
        return;
    }
    rewardIconContainer.innerHTML = task.reward.icon;
    rewardText.textContent = task.reward.text;
    rewardModal.classList.remove('modal-hidden');

    rewardContinueButton.onclick = () => {
        closeRewardModal();
        advanceGameState(task);
    };
}

/**
 * Zavře modální okno odměny
 */
function closeRewardModal() {
    rewardModal.classList.add('modal-hidden');
}

/**
 * Otevře modální okno s odkazem na finální video
 */
function openVideoLinkModal(url) {
    finalVideoLink.href = url;
    videoModal.classList.remove('modal-hidden');

    videoContinueButton.onclick = () => {
        videoModal.classList.add('modal-hidden');
        showCompletionScreen();
    };
}

/**
 * Posune hru do dalšího stavu a uloží do DB
 */
function advanceGameState(task) {
    const isFinalTask = task.id === TASKS.length - 1;

    // Pokud je to poslední úkol a má video, zobraz modální okno s odkazem
    if (isFinalTask && task.videoUrl && task.videoUrl !== "SEM_VLOZ_URL_ADRESU_VIDEA") {
        openVideoLinkModal(task.videoUrl);
        return;
    }
    
    const newIndex = gameState.currentTaskIndex + 1;
    const newCompletedTasks = { ...gameState.completedTasks, [task.id]: true };

    if (newIndex >= TASKS.length) {
        showCompletionScreen();
    }

    if (gameStateRef) {
        gameStateRef.set({
            currentTaskIndex: newIndex,
            completedTasks: newCompletedTasks
        });
    }
}


/**
 * Zpracuje výběr odpovědi
 */
function handleAnswerSelection(selectedOption, task, buttonElement) {
    const allOptionButtons = answerOptionsContainer.querySelectorAll('.option-button');
    allOptionButtons.forEach(btn => btn.disabled = true);

    if (selectedOption.toLowerCase() === task.answer.toLowerCase()) {
        buttonElement.classList.add('correct');
        feedbackMessage.className = 'success';
        feedbackMessage.innerHTML = `<strong>Správně!</strong><br>${task.clue}`;
        feedbackMessage.classList.remove('hidden');
        continueButton.classList.remove('hidden');

        continueButton.onclick = () => {
            closeTaskModal();
            openRewardModal(task);
        };

    } else {
        buttonElement.classList.add('incorrect');
        feedbackMessage.className = 'error';
        feedbackMessage.textContent = 'To není správná odpověď. Zkus to znovu!';
        feedbackMessage.classList.remove('hidden');
        
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
            allOptionButtons.forEach(btn => btn.disabled = false);
            feedbackMessage.classList.add('hidden');
        }, 1500);
    }
}

/**
 * Spustí hlavní logiku aplikace
 */
function startApp() {
    initMap();
    
    if (!gameStateRef) return;

    gameStateRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState = {
                currentTaskIndex: data.currentTaskIndex || 0,
                completedTasks: data.completedTasks || {}
            };
        } else {
            gameState = { currentTaskIndex: 0, completedTasks: {} };
        }
        updateUI();
        if (map && gameState.currentTaskIndex < TASKS.length) {
            map.flyTo(TASKS[gameState.currentTaskIndex].coords, 13);
        }
    }, (error) => {
        console.error("Chyba při čtení z databáze:", error);
        alert("Nepodařilo se připojit k našemu příběhu. Zkus to prosím znovu.");
    });
    
    closeButton.addEventListener('click', closeTaskModal);
    window.addEventListener('click', (event) => {
        if (event.target === taskModal) closeTaskModal();
    });
}

/**
 * Inicializace celé aplikace
 */
function main() {
    startButton.addEventListener('click', () => {
        initFirebase(); 
        welcomeScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        startApp();
    });
}

main();
