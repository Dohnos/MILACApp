// @ts-nocheck
const { firebase, L } = window;

// --- DŮLEŽITÉ: Vložte sem konfiguraci vašeho Firebase projektu ---
const firebaseConfig = {
  apiKey: "AIzaSyCr0mWTp9rYWTfnPEN5ZSWEcWf2kz0g6KU",
  authDomain: "milacapp-4e209.firebaseapp.com",
  projectId: "milacapp-4e209",
  storageBucket: "milacapp-4e209.firebasestorage.app",
  messagingSenderId: "965183350247",
  appId: "1:965183350247:web:0078481af23ac2ba780942"
};
// --- Konec konfigurace ---

// Herní data
const TASKS = [
    { 
        id: 0, 
        title: "Úkol 1: Olomouc",
        coords: [49.5942, 17.2510],
        question: "Pamatuješ si, jak se jmenovala kavárna, kde jsme si dali první kávu na jednom z našich prvních rande tady v Olomouci?",
        answer: "cafe la fee",
        clue: "Správně, lásko! Další cíl je místo, kde jsme si užili náš první společný wellness. Leží kousek za hranicemi." 
    },
    { 
        id: 1, 
        title: "Úkol 2: Laa an der Thaya",
        coords: [48.7183, 16.3916],
        question: "V tichém bazénu jsme tehdy relaxovali celé hodiny. Jak se ten bazén jmenuje? (jedno slovo)",
        answer: "silentium",
        clue: "Přesně tak! Bylo to magické. Nyní se vydejme do srdce Pálavy, do města, kterému se přezdívá perla jižní Moravy." 
    },
    { 
        id: 2, 
        title: "Úkol 3: Mikulov, Náměstí",
        coords: [48.8055, 16.6378],
        question: "Když jsme tu stáli, obdivovali jsme krásnou kašnu. Jaká římská bohyně je na jejím vrcholu?",
        answer: "pomona",
        clue: "Jsi neuvěřitelná! Poslední úkol na tebe čeká na místě s nejkrásnějším výhledem na celé město. Místo, kde se nebe dotýká země." 
    },
    { 
        id: 3, 
        title: "Úkol 4: Svatý kopeček, Mikulov",
        coords: [48.8035, 16.6508],
        question: "Rozhlédni se kolem sebe. Tento výhled je stejně nekonečný jako moje láska k tobě. Co je to jedno slovo, které nejlépe vystihuje naši společnou budoucnost?",
        answer: "navzdy",
        clue: "Dokázala jsi to! Jsi u konce naší cesty." 
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
const modal = document.getElementById('task-modal');
const modalTitle = document.getElementById('task-title');
const modalQuestion = document.getElementById('task-question');
const taskForm = document.getElementById('task-form');
const answerInput = document.getElementById('task-answer');
const submitButton = document.getElementById('submit-button');
const feedbackMessage = document.getElementById('feedback-message');
const continueButton = document.getElementById('continue-button');
const closeButton = document.querySelector('.close-button');

/**
 * Inicializace Firebase
 */
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        gameStateRef = database.ref('gameState');
    } catch (e) {
        console.error("Firebase initialization error:", e);
        alert("Chyba připojení k databázi. Zkontrolujte prosím konfiguraci.");
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
    modalTitle.textContent = task.title;
    modalQuestion.textContent = task.question;
    answerInput.value = '';
    
    feedbackMessage.classList.add('hidden');
    continueButton.classList.add('hidden');
    submitButton.classList.remove('hidden');
    answerInput.disabled = false;
    
    modal.classList.remove('modal-hidden');
    answerInput.focus();

    taskForm.onsubmit = (e) => handleFormSubmit(e, task);
}

/**
 * Zavře modální okno
 */
function closeModal() {
    modal.classList.add('modal-hidden');
}

/**
 * Zpracuje odeslání odpovědi
 */
function handleFormSubmit(event, task) {
    event.preventDefault();
    const userAnswer = answerInput.value.trim().toLowerCase();
    
    if (userAnswer === task.answer.toLowerCase()) {
        feedbackMessage.className = 'success';
        feedbackMessage.innerHTML = `<strong>Správně!</strong><br>${task.clue}`;
        feedbackMessage.classList.remove('hidden');

        answerInput.disabled = true;
        submitButton.classList.add('hidden');
        continueButton.classList.remove('hidden');

        const newIndex = gameState.currentTaskIndex + 1;
        const newCompletedTasks = { ...gameState.completedTasks, [task.id]: true };

        // Nastavení akce pro tlačítko Pokračovat
        continueButton.onclick = () => {
            // Uložení do Firebase až při pokračování
            gameStateRef.set({
                currentTaskIndex: newIndex,
                completedTasks: newCompletedTasks
            });
            closeModal();
        };

    } else {
        feedbackMessage.className = 'error';
        feedbackMessage.textContent = 'To není správná odpověď. Zkus to znovu!';
        feedbackMessage.classList.remove('hidden');
    }
}

/**
 * Spustí hlavní logiku aplikace
 */
function startApp() {
    initMap();
    
    gameStateRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState = {
                currentTaskIndex: data.currentTaskIndex || 0,
                completedTasks: data.completedTasks || {}
            };
        }
        updateUI();
        if (map && gameState.currentTaskIndex < TASKS.length) {
            map.flyTo(TASKS[gameState.currentTaskIndex].coords, 13);
        }
    }, (error) => {
        console.error("Chyba při čtení z databáze:", error);
        alert("Nepodařilo se připojit k našemu příběhu. Zkus to prosím znovu.");
    });
    
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
}

/**
 * Inicializace celé aplikace
 */
function main() {
    initFirebase();
    startButton.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        startApp();
    });
}

main();
