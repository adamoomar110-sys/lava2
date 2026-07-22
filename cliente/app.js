// Estado de la aplicación
const appState = {
    plate: '',
    washType: '',
    phone: '',
    rating: 0,
    reservaId: null,
    whatsappNumber: ''
};

// Configuración de Supabase
const SUPABASE_URL = 'https://ojalzcfjrlkkyyqvihvc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lkMNUGG8ML6nv5yMwezq1Q_bC7_xabQ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Simulador del Video Splash Screen
document.addEventListener('DOMContentLoaded', () => {
    // Obtener configuración de WhatsApp desde Supabase
    supabaseClient.from('configuracion').select('whatsapp_number').eq('id', 1).single().then(({data, error}) => {
        if (data && data.whatsapp_number) {
            appState.whatsappNumber = data.whatsapp_number;
        }
    });

    // Simulamos un tiempo de carga del splash screen (video de inicio)
    setTimeout(() => {
        nextScreen('screen-welcome');
    }, 3000); // 3 segundos de splash screen

    // Configurar sistema de estrellas
    setupStars();
});

// Lógica de Instalación de PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btnInstall = document.getElementById('btn-install');
    if (btnInstall) {
        btnInstall.style.display = 'block';
        btnInstall.addEventListener('click', () => {
            btnInstall.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('El usuario aceptó la instalación');
                }
                deferredPrompt = null;
            });
        });
    }
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
async function validateAndNext(step, nextScreenId) {
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
        
        // --- LÓGICA DE PROMOCIONES ---
        const banner = document.getElementById('promo-banner');
        if (banner && supabaseClient) {
            banner.style.display = 'none';
            try {
                // 1. Contar visitas completadas
                const { count } = await supabaseClient
                    .from('reservas_pendientes')
                    .select('*', { count: 'exact', head: true })
                    .eq('patente', appState.plate)
                    .eq('estado', 'completado');
                    
                const visitas = count || 0;
                
                // 2. Obtener promos activas
                const { data: promos } = await supabaseClient
                    .from('promociones')
                    .select('*')
                    .eq('activa', true)
                    .order('meta_visitas', { ascending: true });
                
                if (promos && promos.length > 0) {
                    // +1 porque la reserva actual sería la visita N+1
                    const proximaVisita = visitas + 1; 
                    
                    let reachedPromo = promos.find(p => p.meta_visitas === proximaVisita);
                    let nextPromo = promos.find(p => p.meta_visitas > proximaVisita);
                    
                    if (reachedPromo) {
                        banner.innerHTML = `¡Felicidades! Ésta es tu visita #${proximaVisita}.<br>🎉 Tienes disponible: <strong>${reachedPromo.nombre}</strong>`;
                        banner.style.display = 'block';
                    } else if (nextPromo) {
                        const faltan = nextPromo.meta_visitas - proximaVisita;
                        banner.innerHTML = `Ésta es tu visita #${proximaVisita}.<br>¡Te falta${faltan > 1 ? 'n' : ''} ${faltan} visita${faltan > 1 ? 's' : ''} para: <strong>${nextPromo.nombre}</strong>!`;
                        banner.style.display = 'block';
                    }
                }
            } catch(e) { console.error("Error check promo", e); }
        }
        
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
            
            // Mostrar botón de WhatsApp si hay número configurado
            const btnWhatsapp = document.getElementById('btn-whatsapp');
            if (btnWhatsapp && appState.whatsappNumber) {
                btnWhatsapp.style.display = 'block';
            }
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

// Función para abrir WhatsApp
function contactWhatsApp() {
    if (appState.whatsappNumber) {
        let number = appState.whatsappNumber.replace(/\D/g, '');
        const message = encodeURIComponent(`Hola L1deres, mi vehículo patente ${appState.plate} acaba de ingresar al Lavado Automático.`);
        window.open(`https://wa.me/${number}?text=${message}`, '_blank');
    }
}

// ============================================================
// SIMULADOR DE CIRCUITO EN VIVO PARA CLIENTE (SIN PATENTES)
// ============================================================
function initClientTrack() {
    const grid = document.getElementById('client-canvas-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const totalBoxes = 48;

    const titles = [
        { name: 'TERMINADO', col: 1 },
        { name: 'INTERIOR', col: 3 },
        { name: 'LAVADO', col: 4 },
        { name: 'ESPERA', col: 5 }
    ];

    titles.forEach(t => {
        const div = document.createElement('div');
        div.className = 'zone-title';
        div.textContent = t.name;
        div.style.gridRow = '1';
        div.style.gridColumn = t.col;
        if (t.name === 'ESPERA') div.style.gridColumn = '5 / span 2';
        grid.appendChild(div);
    });

    const textReplacements = {
        25: '1', 19: '2', 13: '3', 7: '4',
        11: '1', 12: '2', 17: '3', 18: '4', 23: '5', 24: '6', 29: '7', 30: '8',
        4: '1', 3: '1', 9: '2'
    };

    for (let boxNumber = 1; boxNumber <= totalBoxes; boxNumber++) {
        let row = Math.ceil(boxNumber / 6) + 1;
        let col = ((boxNumber - 1) % 6) + 1;

        if (textReplacements.hasOwnProperty(boxNumber)) {
            const box = document.createElement('div');
            box.className = 'grid-box';
            box.dataset.boxNumber = boxNumber;
            box.textContent = textReplacements[boxNumber];
            box.style.gridRow = row;
            box.style.gridColumn = col;
            grid.appendChild(box);
        }
    }

    // Calcular paths de pistas Scalextric en el cliente
    setTimeout(() => {
        updateClientTracks();
    }, 400);

    initClientSponsors();
    initClientCarSync();
}

function updateClientTracks() {
    const canvas = document.getElementById('client-canvas-area');
    if (!canvas) return;

    function getBoxCenter(boxNum) {
        const box = document.querySelector(`#client-canvas-grid .grid-box[data-box-number="${boxNum}"]`);
        if (!box) return null;
        const boxRect = box.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        return {
            x: boxRect.left - canvasRect.left + boxRect.width / 2,
            y: boxRect.top - canvasRect.top + boxRect.height / 2
        };
    }

    const c11 = getBoxCenter(11), c12 = getBoxCenter(12);
    const c29 = getBoxCenter(29), c30 = getBoxCenter(30);
    const c3 = getBoxCenter(3), c9 = getBoxCenter(9);
    const c4 = getBoxCenter(4);
    const c25 = getBoxCenter(25), c7 = getBoxCenter(7);

    if (c11 && c12 && c29 && c30 && c3 && c9 && c4 && c25 && c7) {
        // Pista Interior
        const dInterior = `M ${c12.x} ${c12.y + 120} L ${c12.x} ${c12.y} L ${c3.x} ${c3.y} L ${c9.x} ${c9.y} L ${c25.x} ${c25.y} L ${c7.x} ${c7.y}`;
        ['client-base-interior', 'client-rails-interior', 'client-slot-interior', 'client-track-interior'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('d', dInterior);
        });

        // Pista Lavado
        const dLavado = `M ${c11.x} ${c11.y + 120} L ${c11.x} ${c11.y} L ${c4.x} ${c4.y} L ${c25.x} ${c25.y} L ${c7.x} ${c7.y}`;
        ['client-base-lavado', 'client-rails-lavado', 'client-slot-lavado', 'client-track-lavado'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('d', dLavado);
        });
    }
}

// Sincronizar vehículos en vivo con Supabase
let clientCarSprites = new Map();

async function fetchClientLiveState() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('reservas_pendientes')
            .select('*')
            .in('estado', ['ingresado', 'lavando', 'secando']);

        if (error || !data) return;

        const canvas = document.getElementById('client-canvas-area');
        if (!canvas) return;

        const activeIds = new Set();
        let totalEta = 0;

        data.forEach(res => {
            activeIds.add(res.id.toString());

            // Determinar caja destino
            let boxNum = 11;
            if (res.estado === 'ingresado') boxNum = 11;
            else if (res.estado === 'lavando') boxNum = 4;
            else if (res.estado === 'secando') boxNum = 3;

            const box = document.querySelector(`#client-canvas-grid .grid-box[data-box-number="${boxNum}"]`);
            if (box) {
                const boxRect = box.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const targetX = boxRect.left - canvasRect.left + boxRect.width / 2 - 16;
                const targetY = boxRect.top - canvasRect.top + boxRect.height / 2 - 16;

                let car = clientCarSprites.get(res.id.toString());
                if (!car) {
                    car = document.createElement('div');
                    car.className = 'car-wrapper';
                    car.dataset.id = res.id;
                    car.style.left = `${targetX}px`;
                    car.style.top = `${targetY + 80}px`;

                    const img = document.createElement('img');
                    img.src = '../f1_car_top_down.png';
                    img.className = 'auto-icon';

                    car.appendChild(img);
                    canvas.appendChild(car);
                    clientCarSprites.set(res.id.toString(), car);
                }

                // Animación suave hacia el box (sin cartel de patente)
                setTimeout(() => {
                    car.style.left = `${targetX}px`;
                    car.style.top = `${targetY}px`;
                }, 50);
            }
        });

        // Limpiar autos que salieron
        clientCarSprites.forEach((car, id) => {
            if (!activeIds.has(id)) {
                car.style.left = '110%';
                car.style.opacity = '0';
                setTimeout(() => {
                    if (car.parentNode) car.remove();
                    clientCarSprites.delete(id);
                }, 800);
            }
        });

        // Actualizar demora en el badge
        const count = data.length;
        const timeEl = document.getElementById('client-status-time');
        const badgeEl = document.getElementById('client-status-badge');
        if (timeEl && badgeEl) {
            if (count === 0) {
                timeEl.textContent = '00:00';
                badgeEl.className = 'status-badge badge-libre';
                badgeEl.textContent = 'SIN DEMORA';
            } else {
                const mins = count * 5;
                timeEl.textContent = `${mins.toString().padStart(2, '0')}:00`;
                badgeEl.className = count > 3 ? 'status-badge badge-alta' : 'status-badge badge-normal';
                badgeEl.textContent = `${count} EN ESPERA`;
            }
        }

    } catch (e) {
        console.error('Error sync cliente track:', e);
    }
}

function initClientCarSync() {
    fetchClientLiveState();
    setInterval(fetchClientLiveState, 4000);
}

const DEFAULT_CLIENT_SPONSORS = [
    { title: 'Shell Helix Ultra', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' },
    { title: 'Pirelli P Zero', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80' },
    { title: 'Red Bull Racing', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' }
];
let clientSponsorIdx = 0;

function initClientSponsors() {
    const wrapper = document.getElementById('client-screen-media-wrapper');
    const titleEl = document.getElementById('client-sponsor-title');
    if (!wrapper) return;

    function renderSlide() {
        const cur = DEFAULT_CLIENT_SPONSORS[clientSponsorIdx];
        if (titleEl) titleEl.textContent = cur.title;
        wrapper.innerHTML = `<img src="${cur.url}" class="screen-media-item" alt="${cur.title}">`;
        clientSponsorIdx = (clientSponsorIdx + 1) % DEFAULT_CLIENT_SPONSORS.length;
    }

    renderSlide();
    setInterval(renderSlide, 6000);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initClientTrack, 300);
    window.addEventListener('resize', () => {
        setTimeout(updateClientTracks, 200);
    });
});
