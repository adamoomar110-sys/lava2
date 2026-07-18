// Estado de la aplicación
const appState = {
    plate: '',
    washType: '',
    phone: '',
    rating: 0,
    reservaId: null
};

// Configuración de Supabase
const SUPABASE_URL = 'https://ojalzcfjrlkkyyqvihvc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lkMNUGG8ML6nv5yMwezq1Q_bC7_xabQ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Simulador del Video Splash Screen
document.addEventListener('DOMContentLoaded', () => {
    // Simulamos un tiempo de carga del splash screen (video de inicio)
    setTimeout(() => {
        nextScreen('screen-welcome');
    }, 3000); // 3 segundos de splash screen

    // Configurar sistema de estrellas
    setupStars();
});

// Navegación entre pantallas
function nextScreen(screenId) {
    // Ocultar todas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Mostrar la indicada
    document.getElementById(screenId).classList.add('active');
}

function prevScreen(screenId) {
    nextScreen(screenId);
}

// Validar campos antes de avanzar
function validateAndNext(step, nextScreenId) {
    if (step === 'plate') {
        const plateInput = document.getElementById('input-plate').value.trim();
        const errorMsg = document.getElementById('error-plate');
        if (plateInput.length < 6) {
            errorMsg.style.display = 'block';
            return;
        }
        errorMsg.style.display = 'none';
        appState.plate = plateInput.toUpperCase();
        
        // Actualizar resumen
        document.getElementById('summary-plate').innerText = appState.plate;
        nextScreen(nextScreenId);
    } 
    else if (step === 'phone') {
        const phoneInput = document.getElementById('input-phone').value.trim();
        const errorMsg = document.getElementById('error-phone');
        if (phoneInput.length < 8) {
            errorMsg.style.display = 'block';
            return;
        }
        errorMsg.style.display = 'none';
        appState.phone = '+54 ' + phoneInput;
        nextScreen(nextScreenId);
    }
}

// Selección de tipo de lavado
function selectWash(type) {
    appState.washType = type;
    document.getElementById('summary-type').innerText = type;
    nextScreen('screen-phone');
}

// Mock de Pago de Mercado Pago y guardado en Supabase
async function processPayment() {
    const btn = document.querySelector('.btn-mp');
    const originalText = btn.innerHTML;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Procesando pago...";
    btn.disabled = true;

    try {
        // Simulamos el tiempo de MP
        await new Promise(r => setTimeout(r, 2000));
        
        // Transformar el tipo de lavado al formato que espera el backend
        let tipoParaDB = 'solo_lavado';
        if (appState.washType === 'Solo Interior') tipoParaDB = 'solo_secado';
        else if (appState.washType === 'Lavado + Interior') tipoParaDB = 'lavado_secado';

        // Guardar la reserva en Supabase
        const { data, error } = await supabaseClient
            .from('reservas_pendientes')
            .insert([
                { 
                    patente: appState.plate, 
                    tipo_lavado: tipoParaDB, 
                    telefono: appState.phone,
                    estado: 'pendiente'
                }
            ])
            .select();
            
        if (error) {
            console.error("Error al guardar en Supabase:", error);
            // Ignoramos el error en el frontend para no bloquear al usuario por ahora, 
            // pero normalmente se mostraría un error.
        } else if (data && data.length > 0) {
            appState.reservaId = data[0].id;
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
        nextScreen('screen-review');
    } catch (e) {
        console.error(e);
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert("Hubo un error procesando el pago.");
    }
}

// Sistema de Reseñas (Estrellas)
function setupStars() {
    const stars = document.querySelectorAll('.star');
    const emojiContainer = document.getElementById('review-emoji');
    const commentInput = document.getElementById('review-comment');
    const btnSubmit = document.getElementById('btn-submit-review');

    const emojis = {
        '1': '😡',
        '2': '😞',
        '3': '😐',
        '4': '🙂',
        '5': '😍'
    };

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            appState.rating = value;
            
            // Pintar estrellas
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });

            // Mostrar y actualizar emoji
            if (emojiContainer) {
                emojiContainer.textContent = emojis[value] || '🙂';
                emojiContainer.style.display = 'block';
                // Animación de rebote (pop)
                emojiContainer.style.transform = 'scale(1.2)';
                setTimeout(() => emojiContainer.style.transform = 'scale(1)', 200);
            }

            // Mostrar campo de comentario y botón enviar
            if (commentInput) commentInput.style.display = 'block';
            if (btnSubmit) btnSubmit.style.display = 'block';
        });
    });
}

async function finishFlow() {
    // Si queremos actualizar la reseña en la DB:
    if (appState.reservaId) {
        const commentInput = document.getElementById('review-comment');
        const comentarioText = commentInput ? commentInput.value.substring(0, 12).trim() : null;

        await supabaseClient
            .from('reservas_pendientes')
            .update({ 
                rating: appState.rating,
                comentario: comentarioText
            })
            .eq('id', appState.reservaId);
    }
    
    // Simular que terminó
    alert("¡Gracias por tu reserva y tu reseña!");
    // Reiniciar
    window.location.reload();
}
