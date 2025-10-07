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
        question: "Pamatuješ si, jak se jmenovala kavárna, kde jsme si dali první kávu na jednom z našich prvních rande tady v Olomouci?",
        options: ["Kafe a Láska", "Cafe La Fée", "Long Story Short"],
        answer: "Cafe La Fée",
        clue: "Správně, lásko! Další cíl je místo, kde jsme si užili náš první společný wellness. Leží kousek za hranicemi.",
        reward: {
            icon: '💐',
            text: "Jako malá pozornost za tvou skvělou paměť. Krásná květina pro krásnou ženu."
        }
    },
    { 
        id: 1, 
        title: "Úkol 2: Laa an der Thaya",
        coords: [48.7183, 16.3916],
        question: "V tichém bazénu jsme tehdy relaxovali celé hodiny. Jak se ten bazén jmenuje?",
        options: ["Relaxarium", "Aquadrom", "Silentium"],
        answer: "Silentium",
        clue: "Přesně tak! Bylo to magické. Nyní se vydejme do srdce Pálavy, do města, kterému se přezdívá perla jižní Moravy.",
        reward: {
            icon: '☕️',
            text: "Aby ti na cestě nechyběla energie. Tvoje oblíbená káva!"
        }
    },
    { 
        id: 2, 
        title: "Úkol 3: Mikulov, Náměstí",
        coords: [48.8055, 16.6378],
        question: "Když jsme tu stáli, obdivovali jsme krásnou kašnu. Jaká římská bohyně je na jejím vrcholu?",
        options: ["Venuše", "Pomona", "Diana"],
        answer: "Pomona",
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
        question: "Rozhlédni se kolem sebe. Tento výhled je stejně nekonečný jako moje láska k tobě. Co je to jedno slovo, které nejlépe vystihuje naši společnou budoucnost?",
        options: ["Štěstí", "Láska", "Navždy"],
        answer: "Navždy",
        clue: "Dokázala jsi to! Jsi u konce naší cesty." 
        // Zde záměrně není odměna, aby se zachovalo překvapení
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
 * Posune hru do dalšího stavu a uloží do DB
 */
function advanceGameState(task) {
    const newIndex = gameState.currentTaskIndex + 1;
    const newCompletedTasks = { ...gameState.completedTasks, [task.id]: true };

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
            // Po zavření okna s úkolem zobrazíme odměnu (pokud existuje)
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
        if (event.target === rewardModal) {
            // Zavření odměny kliknutím mimo neposouvá hru dál, je třeba kliknout na tlačítko
        }
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
