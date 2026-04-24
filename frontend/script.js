const API_URL = "http://localhost:8000";

async function fetchExercises() {
    try {
        const response = await fetch(`${API_URL}/exercises`);
        const exercises = await response.json();
        
        const container = document.getElementById('exercises-list');
        container.innerHTML = '';
        exercises.forEach(ex => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${ex.title}</h3>
                <p>${ex.description}</p>
                <a href="${ex.video_url}" target="_blank" class="card-link"><span>▶</span> Ver Guía de Ejercicios</a>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching exercises:", error);
    }
}

function setPain(level) {
    const buttons = document.querySelectorAll('.pain-scale button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('pop');
    });
    
    const clickedBtn = buttons[level - 1];
    clickedBtn.classList.add('active');
    clickedBtn.classList.add('pop');
    
    // Update Sticker
    const sticker = document.getElementById('pain-sticker');
    const emojis = ["😊", "🙂", "😐", "🧐", "😕", "😟", "😣", "😫", "😭", "☠️"];
    sticker.textContent = emojis[level - 1];
    sticker.classList.remove('animate');
    void sticker.offsetWidth; // Trigger reflow
    sticker.classList.add('animate');
    
    const status = document.getElementById('pain-status');
    let msg = "";
    if (level <= 2) {
        msg = "¡Qué alegría! Estás en un gran momento. Aprovecha para fortalecer tu cuerpo con energía y optimismo.";
    } else if (level <= 4) {
        msg = "Un pequeño obstáculo, pero nada que te detenga. Mantén la calma y respira profundamente mientras realizas tus movimientos suaves.";
    } else if (level <= 6) {
        msg = "Te escucho y te entiendo. Tu cuerpo hoy pide un trato más dulce; hagamos los ejercicios con mucha paciencia y amor propio.";
    } else if (level <= 8) {
        msg = "Sé que es difícil y agotador, pero eres increíblemente fuerte. Hoy priorizaremos el descanso activo y el cuidado suave.";
    } else {
        msg = "Lo siento mucho, de corazón. Tu bienestar es nuestra única prioridad ahora. Por favor, descansa totalmente y permítenos cuidarte.";
    }
    
    status.textContent = msg;
    
    // Auto-open chat and send info
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget.classList.contains('collapsed')) {
        toggleChat();
    }
    appendMessage('bot', `Nivel de dolor registrado: ${level}. ${msg}`);
}

function toggleChat() {
    const widget = document.getElementById('chat-widget');
    widget.classList.toggle('collapsed');
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
    fetchExercises();
    
    // Initial sticker
    const sticker = document.getElementById('pain-sticker');
    sticker.textContent = "👋";
    
    setTimeout(() => {
        appendMessage('bot', "¡Hola! He reordenado la página según tus necesidades. Primero registremos tu nivel de dolor.");
    }, 1500);
});
