const API_URL = "http://localhost:8000";
let painChart = null;
let allExercises = [];
let zenTimer = null;
let zenSecondsLeft = 0;
let zenTotalSeconds = 0;
let currentZenExercise = null;

async function fetchUser() {
    const res = await fetch(`${API_URL}/user/me`);
    const user = await res.json();
    document.getElementById('user-name').textContent = user.name;
}

async function fetchStats() {
    try {
        const res = await fetch(`${API_URL}/user/me/stats`);
        const stats = await res.json();
        document.getElementById('streak-val').textContent = stats.current_streak;
        document.getElementById('total-val').textContent = stats.total_completions;
        document.getElementById('last-pain-val').textContent = stats.last_pain_level || "--";
    } catch (e) {
        console.error("Error fetching stats:", e);
    }
}

async function fetchExercises() {
    try {
        const response = await fetch(`${API_URL}/exercises`);
        allExercises = await response.json();
        renderExercises(allExercises);
    } catch (error) {
        console.error("Error fetching exercises:", error);
    }
}

function renderExercises(exercises) {
    const container = document.getElementById('exercises-list');
    container.innerHTML = '';
    
    if (exercises.length === 0) {
        container.innerHTML = '<p class="no-results">No se encontraron ejercicios con estos filtros.</p>';
        return;
    }

    exercises.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'card';
        const difficulty = ex.difficulty || 'Media';
        const duration = ex.duration || 5;
        
        card.innerHTML = `
            <div class="card-info">
                <span class="tag tag-diff ${difficulty}">${difficulty}</span>
                <span class="tag tag-time">⏱ ${duration} min</span>
            </div>
            <h3>${ex.title}</h3>
            <p>${ex.description}</p>
            <div class="exercise-footer">
                <button class="btn-zen" onclick="openZenMode(${ex.id})">Modo Zen</button>
                <button class="btn-complete" id="btn-ex-${ex.id}" onclick="completeExercise(${ex.id})">✓</button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function completeExercise(id) {
    const btn = document.getElementById(`btn-ex-${id}`);
    if (btn && btn.classList.contains('done')) return;

    try {
        const res = await fetch(`${API_URL}/user/me/complete/${id}`, { method: 'POST' });
        if (res.ok) {
            if (btn) {
                btn.classList.add('done');
                btn.textContent = "✓";
            }
            fetchStats();
            appendMessage('bot', "¡Excelente trabajo completando ese ejercicio! Tu racha ha subido.");
        }
    } catch (e) {
        console.error("Error completing exercise:", e);
    }
}

async function setPain(level) {
    const buttons = document.querySelectorAll('.pain-scale button');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (level > 0) buttons[level - 1].classList.add('active');
    
    const status = document.getElementById('pain-status');
    let msg = "";
    if (level <= 3) msg = "Nivel bajo. ¡Buen momento para realizar tus estiramientos!";
    else if (level <= 7) msg = "Nivel moderado. Realiza los ejercicios con precaución.";
    else msg = "Nivel elevado. Por favor, descansa y consulta si el dolor persiste.";
    
    status.textContent = msg;

    try {
        await fetch(`${API_URL}/user/me/pain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intensity: level })
        });
        updateChart();
        fetchStats();
    } catch (e) {
        console.error("Error logging pain:", e);
    }
    
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget.classList.contains('collapsed')) {
        toggleChat();
    }
    appendMessage('bot', `Nivel de dolor registrado: ${level}. ${msg}`);
}

function initChart() {
    const ctx = document.getElementById('painChart').getContext('2d');
    painChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Nivel de Dolor',
                data: [],
                borderColor: '#5c55d2',
                backgroundColor: 'rgba(92, 85, 210, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#5c55d2',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 10, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

async function updateChart() {
    try {
        const res = await fetch(`${API_URL}/user/me/history`);
        const history = await res.json();
        
        const labels = history.map(h => new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
        const values = history.map(h => h.intensity);
        
        painChart.data.labels = labels;
        painChart.data.datasets[0].data = values;
        painChart.update();
    } catch (e) {
        console.error("Error updating chart:", e);
    }
}

/* Physics & Filtering Logic */
function toggleAnatomy(view) {
    document.getElementById('anatomy-front').classList.toggle('hidden', view !== 'front');
    document.getElementById('anatomy-back').classList.toggle('hidden', view !== 'back');
    document.getElementById('btn-front').classList.toggle('active', view === 'front');
    document.getElementById('btn-back').classList.toggle('active', view === 'back');
}

function filterByBodyPart(part) {
    // Highlight active part in SVG
    document.querySelectorAll('.anatomy-part').forEach(p => p.classList.remove('active'));
    document.getElementById(`part-${part}`)?.classList.add('active');
    document.getElementById(`part-${part}-back`)?.classList.add('active');

    document.getElementById('filter-body-part').value = part;
    applyFilters();
    
    // Smooth scroll to exercises
    document.getElementById('ejercicios').scrollIntoView({ behavior: 'smooth' });
}

function applyFilters() {
    const search = document.getElementById('exercise-search').value.toLowerCase();
    const bodyPart = document.getElementById('filter-body-part').value;
    const difficulty = document.getElementById('filter-difficulty').value;

    const filtered = allExercises.filter(ex => {
        const matchesSearch = ex.title.toLowerCase().includes(search) || ex.description.toLowerCase().includes(search);
        const matchesPart = bodyPart === 'all' || ex.body_part === bodyPart;
        const matchesDiff = difficulty === 'all' || ex.difficulty === difficulty;
        return matchesSearch && matchesPart && matchesDiff;
    });

    renderExercises(filtered);
}

function resetFilters() {
    document.getElementById('exercise-search').value = '';
    document.getElementById('filter-body-part').value = 'all';
    document.getElementById('filter-difficulty').value = 'all';
    document.querySelectorAll('.anatomy-part').forEach(p => p.classList.remove('active'));
    renderExercises(allExercises);
}

/* Zen Player Logic */
function openZenMode(exId) {
    const ex = allExercises.find(e => e.id === exId);
    if (!ex) return;

    currentZenExercise = ex;
    document.getElementById('zen-title').textContent = ex.title;
    document.getElementById('zen-desc').textContent = ex.description;
    
    // Clean video placeholder and add iframe/video
    const videoCont = document.getElementById('zen-video-placeholder');
    videoCont.innerHTML = `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>`; // Placeholder video
    
    document.getElementById('zen-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Reset timer
    zenTotalSeconds = (ex.duration || 5) * 60;
    zenSecondsLeft = zenTotalSeconds;
    updateTimerUI();
}

function closeZenMode() {
    clearInterval(zenTimer);
    zenTimer = null;
    document.getElementById('zen-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('zen-play-btn').textContent = "Iniciar Proceso";
}

function toggleTimer() {
    if (zenTimer) {
        clearInterval(zenTimer);
        zenTimer = null;
        document.getElementById('zen-play-btn').textContent = "Reanudar";
    } else {
        document.getElementById('zen-play-btn').textContent = "Pausar";
        zenTimer = setInterval(() => {
            zenSecondsLeft--;
            updateTimerUI();
            if (zenSecondsLeft <= 0) {
                clearInterval(zenTimer);
                completeExercise(currentZenExercise.id);
                setTimeout(() => {
                    alert("¡Sesión completada con éxito!");
                    closeZenMode();
                }, 500);
            }
        }, 1000);
    }
}

function updateTimerUI() {
    const mins = Math.floor(zenSecondsLeft / 60);
    const secs = zenSecondsLeft % 60;
    document.getElementById('timer-val').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Ring animation
    const circle = document.getElementById('timer-progress');
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (zenSecondsLeft / zenTotalSeconds) * circumference;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
}

function appendMessage(sender, text) {
    const body = document.getElementById('chat-body');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = text;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chat-msg');
    const text = input.value.trim();
    if (text) {
        appendMessage('user', text);
        input.value = '';
        
        try {
            const response = await fetch(`${API_URL}/chat/send?message=${encodeURIComponent(text)}`, { 
                method: 'POST' 
            });
            const data = await response.json();
            
            setTimeout(() => {
                appendMessage('bot', data.reply);
            }, 600);
        } catch (error) {
            console.error("Error sending message:", error);
            setTimeout(() => {
                appendMessage('bot', "No pude procesar tu mensaje. ¿Lo intentamos de nuevo?");
            }, 600);
        }
    }
}

document.getElementById('chat-msg').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

document.addEventListener('DOMContentLoaded', () => {
    fetchUser();
    fetchExercises();
    fetchStats();
    initChart();
    updateChart();
    
    setTimeout(() => {
        appendMessage('bot', "¡Hola Juan! He preparado tu seguimiento mensual. ¿Cómo te sientes hoy respecto a tu nivel de dolor?");
    }, 1500);
});
