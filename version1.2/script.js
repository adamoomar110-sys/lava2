document.addEventListener('DOMContentLoaded', () => {
    // === SUPABASE INIT ===
    const SUPABASE_URL = 'https://ojalzcfjrlkkyyqvihvc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_lkMNUGG8ML6nv5yMwezq1Q_bC7_xabQ';
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // === CONFIGURACIÓN GLOBAL ===
    window.APP_CONFIG = {
        tiempoLavado: 5000,
        tiempoSecado: 5000,
        precioLavado: 0,
        precioSecado: 0,
        precioCompleto: 0
    };

    // Cargar desde Supabase
    async function loadConfig() {
        try {
            const { data, error } = await supabaseClient.from('config').select('*').eq('id', 1).single();
            if (data && !error) {
                window.APP_CONFIG.tiempoLavado = parseInt(data.tiempoLavado) || 5000;
                window.APP_CONFIG.tiempoSecado = parseInt(data.tiempoSecado) || 5000;
                window.APP_CONFIG.precioLavado = parseInt(data.precioLavado) || 0;
                window.APP_CONFIG.precioSecado = parseInt(data.precioSecado) || 0;
                window.APP_CONFIG.precioCompleto = parseInt(data.precioCompleto) || 0;
            }
        } catch(e) { console.error("Error al cargar config", e); }
    }
    loadConfig();

    const navButtons = document.querySelectorAll('.nav-btn');
    
    // Tab System
    const dashboardView = document.getElementById('dashboard-view');
    const metricsView = document.getElementById('metrics-view');
    
    navButtons.forEach(btn => {
        if (btn.id === 'btn-config') return; // Config is handled separately
        
        btn.addEventListener('click', () => {
            // Remove active from all
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Switch views
            const spanText = btn.querySelector('span').textContent;
            if (spanText === 'Métricas') {
                if (dashboardView) dashboardView.style.display = 'none';
                if (metricsView) {
                    metricsView.style.display = 'block';
                    updateMetricsUI(); // Render data when tab is opened
                }
            } else if (spanText === 'Panel Principal') {
                if (metricsView) metricsView.style.display = 'none';
                if (dashboardView) dashboardView.style.display = 'flex';
            } else {
                // Other tabs not implemented yet
                if (metricsView) metricsView.style.display = 'none';
                if (dashboardView) dashboardView.style.display = 'flex';
            }
        });
    });

    // Lógica del Modal de Configuración
    const btnConfig = document.getElementById('btn-config');
    const modalConfig = document.getElementById('config-modal');
    const btnCloseConfig = document.getElementById('close-config');
    const btnSaveConfig = document.getElementById('save-config');
    
    const lavadoMin = document.getElementById('lavado-min');
    const lavadoSec = document.getElementById('lavado-sec');
    const secadoMin = document.getElementById('secado-min');
    const secadoSec = document.getElementById('secado-sec');
    
    const precioLavadoInput = document.getElementById('precio-lavado');
    const precioSecadoInput = document.getElementById('precio-secado');
    const precioCompletoInput = document.getElementById('precio-completo');

    if (btnConfig && modalConfig) {
        btnConfig.addEventListener('click', () => {
            const lSegs = Math.floor(window.APP_CONFIG.tiempoLavado / 1000);
            lavadoMin.value = Math.floor(lSegs / 60);
            lavadoSec.value = lSegs % 60;
            
            const sSegs = Math.floor(window.APP_CONFIG.tiempoSecado / 1000);
            secadoMin.value = Math.floor(sSegs / 60);
            secadoSec.value = sSegs % 60;
            
            precioLavadoInput.value = window.APP_CONFIG.precioLavado;
            precioSecadoInput.value = window.APP_CONFIG.precioSecado;
            precioCompletoInput.value = window.APP_CONFIG.precioCompleto;

            modalConfig.classList.add('show');
        });

        btnCloseConfig.addEventListener('click', () => modalConfig.classList.remove('show'));
        
        btnSaveConfig.addEventListener('click', () => {
            const lMins = parseInt(lavadoMin.value) || 0;
            const lSecs = parseInt(lavadoSec.value) || 0;
            window.APP_CONFIG.tiempoLavado = ((lMins * 60) + lSecs) * 1000;

            const sMins = parseInt(secadoMin.value) || 0;
            const sSecs = parseInt(secadoSec.value) || 0;
            window.APP_CONFIG.tiempoSecado = ((sMins * 60) + sSecs) * 1000;

            window.APP_CONFIG.precioLavado = parseInt(precioLavadoInput.value) || 0;
            window.APP_CONFIG.precioSecado = parseInt(precioSecadoInput.value) || 0;
            window.APP_CONFIG.precioCompleto = parseInt(precioCompletoInput.value) || 0;

            localStorage.setItem('tiempoLavado', window.APP_CONFIG.tiempoLavado);
            localStorage.setItem('tiempoSecado', window.APP_CONFIG.tiempoSecado);
            localStorage.setItem('precioLavado', window.APP_CONFIG.precioLavado);
            localStorage.setItem('precioSecado', window.APP_CONFIG.precioSecado);
            localStorage.setItem('precioCompleto', window.APP_CONFIG.precioCompleto);
            modalConfig.classList.remove('show');
        });
    }

    // Generar layout del plano
    const canvasGrid = document.getElementById('canvas-grid');
    if (canvasGrid) {
        // Título de Terminado (columnas 1 y 2)
        const titleTerminado = document.createElement('div');
        titleTerminado.className = 'zone-title';
        titleTerminado.textContent = 'Terminado';
        titleTerminado.style.gridColumn = '1 / span 2';
        titleTerminado.style.gridRow = '1';
        canvasGrid.appendChild(titleTerminado);
        // Título de Zona de Espera (columnas 5 y 6)
        const titleEspera = document.createElement('div');
        titleEspera.className = 'zone-title';
        titleEspera.textContent = 'Zona de Espera';
        titleEspera.style.gridColumn = '5 / span 2';
        titleEspera.style.gridRow = '1';
        canvasGrid.appendChild(titleEspera);

        // Título de Lavado (columna 4)
        const titleLavado = document.createElement('div');
        titleLavado.className = 'zone-title';
        titleLavado.textContent = 'Lavado';
        titleLavado.style.gridColumn = '4';
        titleLavado.style.gridRow = '1';
        canvasGrid.appendChild(titleLavado);

        // Título de Secado (columna 3)
        const titleSecado = document.createElement('div');
        titleSecado.className = 'zone-title';
        titleSecado.textContent = 'Interior';
        titleSecado.style.gridColumn = '3';
        titleSecado.style.gridRow = '1';
        canvasGrid.appendChild(titleSecado);

        const totalBoxes = 8 * 6; // 48
        for (let i = 0; i < totalBoxes; i++) {
            const boxNumber = i + 1;
            const row = Math.floor(i / 6) + 2; 
            const col = (i % 6) + 1;



            const box = document.createElement('div');
            box.className = 'grid-box';
            box.dataset.boxNumber = boxNumber;
            
            // Reemplazo de números específicos para la Zona de Espera, Lavado y Secado
            const textReplacements = {
                // Terminado (solo columna izquierda, invertido)
                25: '1', 19: '2', 13: '3', 7: '4',
                // Zona de Espera (Desplazada una fila hacia abajo)
                11: '1', 12: '2', 17: '3', 18: '4',
                23: '5', 24: '6', 29: '7', 30: '8',
                // Lavado
                4: '1',
                // Secado
                3: '1', 9: '2'
            };
            
            // Si la caja no pertenece a las zonas funcionales, directamente no la creamos (limpia la pista)
            if (textReplacements.hasOwnProperty(boxNumber)) {
                box.textContent = textReplacements[boxNumber];
                
                // Ubicación explícita: fila 2 en adelante para dejar la fila 1 para títulos
                box.style.gridRow = row;
                
                // Centrar autos de "Terminado" en la pista ensanchada
                if ([25, 19, 13, 7].includes(boxNumber)) {
                    box.style.gridColumn = '1 / span 2';
                    box.style.justifySelf = 'center';
                } else {
                    box.style.gridColumn = col;
                }

                canvasGrid.appendChild(box);
            }
        }
    }

    // -- LÓGICA DE SIMULACIÓN DE AUTOS --
    const ESPERA_ZONES = [11, 12, 17, 18, 23, 24, 29, 30]; 
    const LAVADO_ZONE = 4; // Índice real de lavado
    const SECADO_ZONES = [3, 9]; // Índices reales de Secado 1 y 2
    const TERMINADO_ZONES = [25, 19, 13, 7]; // Índices reales de Terminado 1 al 4
    
    // Estado (null si está vacío, o un objeto con id de auto y tipo si está ocupado)
    let estadoEspera = new Array(8).fill(null);
    let estadoLavado = null; 
    let estadoSecado = [null, null]; // Dos lugares de secado
    let estadoTerminado = [null, null, null, null]; // 4 lugares 
    
    let activeAutos = {};
    // Func para generar UUID
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    const myClientId = uuidv4();
    let isMaster = false;
    let lastStateString = "";

    let isMoving = false; // Flag para evitar overlap de animaciones
    let timers = {}; // guardamos timers para no superponerlos si hay clicks manuales

    // Master Ping & State initialization
    async function initRealtime() {
        // Initial fetch
        const { data, error } = await supabaseClient.from('live_state').select('state_data').eq('id', 1).single();
        if (data && data.state_data) {
            const state = data.state_data;
            estadoEspera = state.estadoEspera || new Array(8).fill(null);
            estadoLavado = state.estadoLavado || null;
            estadoSecado = state.estadoSecado || [null, null];
            estadoTerminado = state.estadoTerminado || [null, null, null, null];
            activeAutos = state.activeAutos || {};
            updateVisuals();
        } else if (error && error.code === 'PGRST116') {
            // No existe la fila, creémosla.
            const initialState = {
                master_id: myClientId,
                last_ping: Date.now(),
                estadoEspera: new Array(8).fill(null),
                estadoLavado: null,
                estadoSecado: [null, null],
                estadoTerminado: [null, null, null, null],
                activeAutos: {}
            };
            isMaster = true;
            await supabaseClient.from('live_state').insert({ id: 1, state_data: initialState, last_updated: Date.now() });
        }

        // Ping loop
        setInterval(async () => {
            try {
                const { data, error } = await supabaseClient.from('live_state').select('state_data').eq('id', 1).single();
                const now = Date.now();
                if (data && data.state_data) {
                    const state = data.state_data;
                    if (!state.master_id || now - state.last_ping > 15000) {
                        isMaster = true;
                        state.master_id = myClientId;
                        state.last_ping = now;
                        await supabaseClient.from('live_state').upsert({ id: 1, state_data: state, last_updated: now });
                    } else if (state.master_id === myClientId) {
                        isMaster = true;
                        state.last_ping = now;
                        await supabaseClient.from('live_state').upsert({ id: 1, state_data: state, last_updated: now });
                    } else {
                        isMaster = false;
                    }
                } else if (error && error.code === 'PGRST116') {
                    // Si desaparece por algún motivo, la recreamos
                    const initialState = {
                        master_id: myClientId,
                        last_ping: now,
                        estadoEspera, estadoLavado, estadoSecado, estadoTerminado, activeAutos
                    };
                    isMaster = true;
                    await supabaseClient.from('live_state').insert({ id: 1, state_data: initialState, last_updated: now });
                }
            } catch(e) {}
        }, 5000);

        // Subscribe to changes
        supabaseClient.channel('live_state_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_state', filter: 'id=eq.1' }, payload => {
                const state = payload.new.state_data;
                if (state && state.master_id !== myClientId) { // If I am master, I already have the latest state
                    estadoEspera = state.estadoEspera || new Array(8).fill(null);
                    estadoLavado = state.estadoLavado || null;
                    estadoSecado = state.estadoSecado || [null, null];
                    estadoTerminado = state.estadoTerminado || [null, null, null, null];
                    activeAutos = state.activeAutos || {};
                    updateVisuals();
                }
            })
            .subscribe();
    }
    initRealtime();

    // Función para crear una versión con fondo transparente del auto
    let carImageSrc = 'f1_car_top_down.png';
    const img = new Image();
    img.src = carImageSrc;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Si el pixel es muy blanco, lo hacemos transparente
            if (data[i] > 220 && data[i+1] > 220 && data[i+2] > 220) {
                data[i+3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        carImageSrc = canvas.toDataURL('image/png');
        
        // Actualizar autos ya renderizados
        document.querySelectorAll('.auto-icon').forEach(icon => {
            icon.src = carImageSrc;
        });
    };

    // Event listener para retirar autos terminados con un clic
    document.addEventListener('click', (e) => {
        const car = e.target.closest('.car-wrapper');
        if (car) {
            const clickedId = parseInt(car.dataset.id);
            for (let i = 0; i < estadoTerminado.length; i++) {
                const auto = estadoTerminado[i];
                if (auto && auto.id === clickedId) {
                    estadoTerminado[i] = null;
                    advanceQueueTerminado();
                    updateVisuals();
                    checkMovement();
                    return;
                }
            }
        }
    });

    // --- Motor de Simulación Videojuego ---
    let simCars = new Map();
    let nextLaneToCall = 'impar'; 

    function gameLoop() {
        simCars.forEach((state, id) => {
            // Logica ortogonal (Scalextric-like)
            let currentTargetX = state.targetX;
            let currentTargetY = state.targetY;

            if (Math.abs(state.targetX - state.x) > 10 && Math.abs(state.targetY - state.y) > 10) {
                // Si va hacia "arriba" (de espera a lavado/secado), primero mueve Y y luego X
                if (state.y > state.targetY) {
                    currentTargetX = state.x; // Mantiene la X actual
                } 
                // Si va hacia "abajo" (de lavado/secado a terminado), primero mueve X y luego Y
                else if (state.y < state.targetY) {
                    currentTargetY = state.y; // Mantiene la Y actual
                }
            }

            const dx = currentTargetX - state.x;
            const dy = currentTargetY - state.y;
            
            state.x += dx * 0.08; // Incremento un poco la velocidad para compensar las distancias más largas
            state.y += dy * 0.08;

            // Si se mueve más de 1 pixel, calcular y aplicar rotación
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                let targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                // Asumimos que la imagen de top-down F1 mira hacia arriba (Norte),
                // y que 0 grados en matemática es el Este. Entonces el sprite debe rotarse 90 grados.
                let targetSpriteAngle = targetAngle + 90;
                
                let diff = targetSpriteAngle - state.angle;
                // Normalizar giro (ruta más corta)
                while(diff > 180) diff -= 360;
                while(diff < -180) diff += 360;
                
                state.angle += diff * 0.08; // Suavizado de giro
            }

            // Aplicamos X e Y a la caja completa (incluyendo timer)
            state.wrapper.style.left = `${state.x}px`;
            state.wrapper.style.top = `${state.y}px`;
            
            // Aplicamos el giro SÓLO a la imagen del auto (para que los textos sigan rectos)
            state.icon.style.transform = `translate(-15%, -15%) rotate(${state.angle}deg)`;
        });
        
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
    // ----------------------------------------
    
    function getCell(boxNum) {
        return document.querySelector(`.grid-box[data-box-number="${boxNum}"]`);
    }

    function renderAuto(boxNum, autoObj) {
        const cell = getCell(boxNum);
        const canvas = document.getElementById('canvas-area');
        if (cell && autoObj && canvas) {
            let id = autoObj.id;
            let wrapper = document.querySelector(`.car-wrapper[data-id="${id}"]`);
            let icon, timer;
            
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'car-wrapper';
                wrapper.dataset.id = id;
                
                icon = document.createElement('img');
                icon.src = carImageSrc; // Usa la imagen procesada transparente
                let typeClass = '';
                if (autoObj.tipo === 'solo_lavado') typeClass = 'solo-lavado';
                else if (autoObj.tipo === 'solo_secado') typeClass = 'solo-secado';
                else typeClass = 'completo';
                wrapper.classList.add(typeClass);
                icon.className = `auto-icon`;
                
                timer = document.createElement('div');
                timer.className = 'car-timer';
                
                let plate = document.createElement('div');
                plate.className = 'car-plate';
                plate.textContent = autoObj.patente;
                
                wrapper.appendChild(icon);
                wrapper.appendChild(plate);
                wrapper.appendChild(timer);
                canvas.appendChild(wrapper);
            } else {
                icon = wrapper.querySelector('.auto-icon');
                timer = wrapper.querySelector('.car-timer');
                let plate = wrapper.querySelector('.car-plate');
                if (plate) plate.textContent = autoObj.patente;
            }
            
            // Calculamos posición destino exacta usando el DOM real
            const cellRect = cell.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const targetX = (cellRect.left - canvasRect.left) + (cellRect.width / 2);
            const targetY = (cellRect.top - canvasRect.top) + (cellRect.height / 2);
            
            // Actualizar simulador
            let simState = simCars.get(id);
            if (!simState) {
                // Determinar en qué carril está para nacer justo abajo de ese carril
                let isOddLane = [0, 2, 4, 6].includes(estadoEspera.findIndex(e => e && e.id === id));
                let entryBoxNum = isOddLane ? ESPERA_ZONES[6] : ESPERA_ZONES[7]; // Caja 7 o Caja 8
                
                let entryCell = getCell(entryBoxNum);
                let startX = targetX;
                let startY = targetY + 100; 

                if (entryCell) {
                    let entryRect = entryCell.getBoundingClientRect();
                    startX = (entryRect.left - canvasRect.left) + (entryRect.width / 2);
                    startY = (entryRect.top - canvasRect.top) + (entryRect.height / 2) + 300; // Nace BIEN por debajo de su carril (fuera de pantalla)
                }

                simState = {
                    x: startX,
                    y: startY, 
                    targetX: targetX,
                    targetY: targetY,
                    angle: 0, // Comienza apuntando hacia arriba (0 grados para el sprite), evita que entre girando
                    wrapper: wrapper,
                    icon: icon
                };
                simCars.set(id, simState);
                wrapper.style.left = `${simState.x}px`;
                wrapper.style.top = `${simState.y}px`;
            } else {
                simState.targetX = targetX;
                simState.targetY = targetY;
            }
            
            let classOcupado = '';
            if (autoObj.tipo === 'solo_lavado') classOcupado = 'box-occupied-lavado';
            else if (autoObj.tipo === 'solo_secado') classOcupado = 'box-occupied-secado';
            else classOcupado = 'box-occupied-completo';
            
            cell.classList.add(classOcupado);
        }
    }

    function removeAuto(boxNum) {
        const cell = getCell(boxNum);
        if (cell) {
            cell.classList.remove('box-occupied-lavado', 'box-occupied-secado', 'box-occupied-completo');
        }
    }

    function cleanUpOrphanCars() {
        // Obtenemos todos los autos válidos de los estados
        const validIds = new Set();
        estadoEspera.forEach(a => { if (a) validIds.add(a.id.toString()); });
        if (estadoLavado) validIds.add(estadoLavado.id.toString());
        estadoSecado.forEach(a => { if (a) validIds.add(a.id.toString()); });
        estadoTerminado.forEach(a => { if (a) validIds.add(a.id.toString()); });
        
        // Buscamos autos en el DOM que no estén en validIds
        const domCars = document.querySelectorAll('.car-wrapper');
        domCars.forEach(car => {
            if (!validIds.has(car.dataset.id)) {
                // Hacemos que "se vaya" de la pantalla hacia la derecha
                car.style.left = '120%';
                car.style.opacity = '0';
                // Lo borramos después de la transición
                setTimeout(() => {
                    if (car.parentNode) car.remove();
                }, 1000);
            }
        });
    }

    function updateVisuals() {
        ESPERA_ZONES.forEach(zoneNum => removeAuto(zoneNum));
        removeAuto(LAVADO_ZONE);
        SECADO_ZONES.forEach(zoneNum => removeAuto(zoneNum));
        TERMINADO_ZONES.forEach(zoneNum => removeAuto(zoneNum));

        estadoEspera.forEach((auto, i) => { if (auto) renderAuto(ESPERA_ZONES[i], auto); });
        if (estadoLavado) renderAuto(LAVADO_ZONE, estadoLavado);
        estadoSecado.forEach((auto, i) => { if (auto) renderAuto(SECADO_ZONES[i], auto); });
        estadoTerminado.forEach((auto, i) => { if (auto) renderAuto(TERMINADO_ZONES[i], auto); });
        
        cleanUpOrphanCars();
    }

    function advanceQueue() {
        let moved = false;
        let lanes = [
            [0, 2, 4, 6], // Carril Impar: suben por cajas 1, 3, 5, 7 en línea recta
            [1, 3, 5, 7]  // Carril Par: suben por cajas 2, 4, 6, 8 en línea recta
        ];
        for (let lane of lanes) {
            for (let j = 0; j < lane.length; j++) {
                for (let i = 0; i < lane.length - 1; i++) {
                    let currentIdx = lane[i];
                    let nextIdx = lane[i+1];
                    if (estadoEspera[currentIdx] === null && estadoEspera[nextIdx] !== null) {
                        estadoEspera[currentIdx] = estadoEspera[nextIdx];
                        estadoEspera[nextIdx] = null;
                        moved = true;
                    }
                }
            }
        }
        return moved;
    }

    function advanceQueueTerminado() {
        let moved = false;
        let lanes = [
            [0, 1, 2, 3] // Único carril Terminado (Izquierda)
        ];
        for (let lane of lanes) {
            for (let j = 0; j < lane.length; j++) {
                for (let i = 0; i < lane.length - 1; i++) {
                    let currentIdx = lane[i];
                    let nextIdx = lane[i+1];
                    if (estadoTerminado[currentIdx] === null && estadoTerminado[nextIdx] !== null) {
                        estadoTerminado[currentIdx] = estadoTerminado[nextIdx];
                        estadoTerminado[nextIdx] = null;
                        moved = true;
                    }
                }
            }
        }
        return moved;
    }

    // Funciones para ingresar autos
    async function syncStateToSupabase() {
        const stateStr = JSON.stringify({ estadoEspera, estadoLavado, estadoSecado, estadoTerminado, activeAutos });
        if (stateStr !== lastStateString) {
            lastStateString = stateStr;
            try {
                const { data, error } = await supabaseClient.from('live_state').select('state_data').eq('id', 1).single();
                let newState = {};
                if (data && data.state_data) {
                    newState = data.state_data;
                } else if (error && error.code === 'PGRST116') {
                    // Si no existe, inicializamos metadata vacía
                    newState = { master_id: myClientId, last_ping: Date.now() };
                }
                
                newState.estadoEspera = estadoEspera;
                newState.estadoLavado = estadoLavado;
                newState.estadoSecado = estadoSecado;
                newState.estadoTerminado = estadoTerminado;
                newState.activeAutos = activeAutos;
                
                if (data || (error && error.code === 'PGRST116')) {
                    await supabaseClient.from('live_state').upsert({ id: 1, state_data: newState, last_updated: Date.now() });
                }
            } catch(e) {}
        }
    }

    function ingresarAuto(tipo) {
        let targetIndices = [];
        let errorMsg = '';
        if (tipo === 'solo_secado') {
            targetIndices = [0, 2, 4, 6]; // Carril Izquierdo
            errorMsg = 'Límite de 4 autos de Secado alcanzado.';
        } else {
            targetIndices = [1, 3, 5, 7]; // Carril Derecho (Lavado)
            errorMsg = 'Límite de 4 autos de Lavado alcanzado.';
        }
        
        let freeIdx = targetIndices.find(idx => estadoEspera[idx] === null);
        
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const getL = () => letters[Math.floor(Math.random() * 26)];
        const num = Math.floor(100 + Math.random() * 900).toString().padStart(3, '0');
        let randomPatente = '';
        if (Math.random() > 0.5) {
            randomPatente = `${getL()}${getL()} ${num} ${getL()}${getL()}`; // Nuevo formato Mercosur
        } else {
            randomPatente = `${getL()}${getL()}${getL()} ${num}`; // Viejo formato
        }

        if (freeIdx !== undefined) {
            const newId = uuidv4();
            const autoObj = { id: newId, patente: randomPatente, tipo: tipo, startTime: Date.now() };
            activeAutos[newId] = autoObj;
            estadoEspera[freeIdx] = autoObj;
            if (advanceQueue()) {} // Las físicas los empujan hacia adelante dentro de su carril
            updateVisuals();
            checkMovement();
            syncStateToSupabase();
        } else {
            alert(errorMsg);
        }
    }

    const btnSoloLavado = document.getElementById('btn-ingresar-lavado');
    if (btnSoloLavado) btnSoloLavado.addEventListener('click', () => ingresarAuto('solo_lavado'));

    const btnSoloSecado = document.getElementById('btn-ingresar-secado');
    if (btnSoloSecado) btnSoloSecado.addEventListener('click', () => ingresarAuto('solo_secado'));

    const btnCompleto = document.getElementById('btn-ingresar-completo');
    if (btnCompleto) btnCompleto.addEventListener('click', () => ingresarAuto('lavado_secado'));

    function checkMovement() {
        if (!isMoving) {
            let frontLeft = estadoEspera[0];
            let frontRight = estadoEspera[1];
            
            let candidates = [];
            if (frontLeft) candidates.push({ auto: frontLeft, idx: 0 });
            if (frontRight) candidates.push({ auto: frontRight, idx: 1 });
            
            // Priorizar por orden de llegada (startTime)
            candidates.sort((a, b) => a.auto.startTime - b.auto.startTime);

            for (let candidate of candidates) {
                let auto = candidate.auto;
                let idx = candidate.idx;

                if (auto.tipo === 'solo_secado') {
                    if (estadoSecado[1] === null) {
                        isMoving = true;
                        auto.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
                        estadoSecado[1] = auto;
                        estadoEspera[idx] = null;
                        advanceQueue();
                        updateVisuals();
                        clearTimeout(timers.espera);
                        timers.espera = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2000);
                        return; // Movemos uno a la vez
                    }
                } else { // Lavado o Completo
                    if (estadoLavado === null) {
                        isMoving = true;
                        auto.endTime = Date.now() + window.APP_CONFIG.tiempoLavado;
                        estadoLavado = auto;
                        estadoEspera[idx] = null;
                        advanceQueue();
                        updateVisuals();
                        clearTimeout(timers.espera);
                        timers.espera = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2000);
                        return; // Movemos uno a la vez
                    }
                }
            }
            if (advanceQueue()) updateVisuals();
        }
    }

    // -- BUCLE DE SIMULACIÓN AUTOMÁTICA --
    setInterval(() => {
        const now = Date.now();

        if (isMaster) {
            if (!isMoving) {
                let carReleased = false;

                // Procesar Lavado
            if (estadoLavado && estadoLavado.endTime <= now) {
                if (estadoLavado.tipo === 'solo_lavado') {
                    let targetIndices = [0, 1, 2, 3]; 
                    const freeIdx = targetIndices.find(idx => estadoTerminado[idx] === null);
                    
                    if (freeIdx !== undefined) {
                        isMoving = true;
                        estadoTerminado[freeIdx] = estadoLavado;
                        estadoLavado = null;
                        estadoTerminado[freeIdx].endTime = Date.now() + 5000;
                        if (advanceQueue()) {}
                        if (advanceQueueTerminado()) {}
                        updateVisuals();

                        clearTimeout(timers.lavadoToTerminado);
                        timers.lavadoToTerminado = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2500); // 2.5s para asegurar que llegue y no se toquen
                        carReleased = true;
                    }
                } else if (estadoLavado.tipo === 'lavado_secado') {
                    if (estadoSecado[0] === null) {
                        isMoving = true;
                        estadoLavado.endTime = Date.now() + window.APP_CONFIG.tiempoSecado;
                        estadoSecado[0] = estadoLavado;
                        estadoLavado = null;
                        updateVisuals();
                        
                        clearTimeout(timers.lavadoToSecado);
                        timers.lavadoToSecado = setTimeout(() => {
                            isMoving = false;
                            checkMovement();
                        }, 2500);
                        carReleased = true;
                    }
                }
            }

            // Procesar Interior/Secado si no se liberó nada antes
            if (!carReleased) {
                for (let i = 0; i < estadoSecado.length; i++) {
                    const auto = estadoSecado[i];
                    if (auto && auto.endTime && now >= auto.endTime) {
                        let targetIndices = [0, 1, 2, 3];
                        const freeIdx = targetIndices.find(idx => estadoTerminado[idx] === null);
                        
                        if (freeIdx !== undefined) {
                            isMoving = true;
                            estadoTerminado[freeIdx] = auto;
                            estadoSecado[i] = null;
                            estadoTerminado[freeIdx].endTime = Date.now() + 5000;
                            if (advanceQueueTerminado()) {}
                            updateVisuals();
                            
                            clearTimeout(timers.secadoToTerminado);
                            timers.secadoToTerminado = setTimeout(() => {
                                isMoving = false;
                                checkMovement();
                            }, 2500);
                            carReleased = true;
                            break; // Solo mover uno a la vez
                        }
                    }
                }
            }
        }

        // Procesar Terminado (simulando retiro automático)
        for (let i = 0; i < estadoTerminado.length; i++) {
            const auto = estadoTerminado[i];
            if (auto && auto.endTime && now >= auto.endTime) {
                recordMetric(auto); // Registrar métrica antes de borrarlo
                estadoTerminado[i] = null;
                setTimeout(() => {
                    advanceQueueTerminado();
                    updateVisuals();
                    checkMovement();
                }, 100);
            }
        }

        // Siempre chequear si la zona de espera puede avanzar
        checkMovement();
        syncStateToSupabase();
        
        } // Fin if (isMaster)
        
        updateTimers();
        updateStatusBoard();
    }, 1000);
    
    function updateStatusBoard() {
        const timeEl = document.getElementById('status-time');
        const badgeEl = document.getElementById('status-badge');
        if (!timeEl || !badgeEl) return;

        let autos = estadoEspera.filter(a => a !== null).length;
        const now = Date.now();
        let maxEta = now;
        
        estadoEspera.forEach(a => {
            if (a && a.etaSalidaEspera > maxEta) {
                maxEta = a.etaSalidaEspera;
            }
        });
        
        let remainingSegundos = Math.ceil((maxEta - now) / 1000);
        if (remainingSegundos < 0 || autos === 0) remainingSegundos = 0;
        
        // Formato MM:SS
        let mins = Math.floor(remainingSegundos / 60);
        let secs = remainingSegundos % 60;
        timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Actualizar Etiqueta y Colores
        badgeEl.className = 'status-badge';
        if (autos === 0) {
            badgeEl.classList.add('badge-libre');
            badgeEl.textContent = 'Sin Demora';
        } else if (autos <= 4) {
            badgeEl.classList.add('badge-normal');
            badgeEl.textContent = 'Demora Normal';
        } else if (autos <= 6) {
            badgeEl.classList.add('badge-alta');
            badgeEl.textContent = 'Demora Alta';
        } else {
            badgeEl.classList.add('badge-critica');
            badgeEl.textContent = 'Cap. Máxima';
        }
    }

    function updateTimers() {
        const now = Date.now();
        
        // 1. Initial Resource availability
        let T_LavadoFree = now;
        if (estadoLavado && estadoLavado.endTime) {
            T_LavadoFree = estadoLavado.endTime + 2000;
        } else if (isMoving) {
            T_LavadoFree = now + 2000;
        }
        
        let T_Secado1Free = now;
        if (estadoSecado[1] && estadoSecado[1].endTime) {
            T_Secado1Free = estadoSecado[1].endTime + 2000;
        }

        let T_LaneFree = {
            impar: now, // 0, 2, 4, 6
            par: now    // 1, 3, 5, 7
        };

        // 2. Ordenar autos en espera por startTime
        let waitingCars = [];
        estadoEspera.forEach((auto, idx) => {
            if (auto) waitingCars.push({ auto: auto, idx: idx });
        });
        waitingCars.sort((a, b) => a.auto.startTime - b.auto.startTime);

        // 3. Simular ETAs
        waitingCars.forEach(item => {
            let auto = item.auto;
            let idx = item.idx;
            let lane = (idx % 2 === 0) ? 'impar' : 'par';

            let myDestFree = (auto.tipo === 'solo_secado') ? T_Secado1Free : T_LavadoFree;

            // El auto sale cuando el carril de adelante está libre Y su destino está libre
            let T_leave_queue = Math.max(T_LaneFree[lane], myDestFree);
            
            auto.etaSalidaEspera = T_leave_queue;

            // Actualizar disponibilidad de recursos para los autos de atrás
            if (auto.tipo === 'solo_secado') {
                T_Secado1Free = T_leave_queue + window.APP_CONFIG.tiempoSecado + 2000;
            } else {
                let processTime = window.APP_CONFIG.tiempoLavado;
                if (auto.tipo === 'lavado_secado') processTime += window.APP_CONFIG.tiempoSecado;
                T_LavadoFree = T_leave_queue + processTime + 2000;
            }

            // El siguiente auto en este mismo carril no puede salir hasta que yo salga (+2s)
            T_LaneFree[lane] = T_leave_queue + 2000;
        });

        // 4. Agrupamos y preparamos para pintar
        const activeAutos = {};
        estadoEspera.forEach(a => { if (a) { a.state = 'espera'; activeAutos[a.id] = a; }});
        if (estadoLavado) { estadoLavado.state = 'lavado'; activeAutos[estadoLavado.id] = estadoLavado; }
        estadoSecado.forEach(a => { if (a) { a.state = 'secado'; activeAutos[a.id] = a; }});
        estadoTerminado.forEach(a => { if (a) { a.state = 'terminado'; activeAutos[a.id] = a; }});
        
        // Helper para formato MM:SS
        const formatTime = (segundos) => {
            if (segundos <= 0) return "00:00";
            const mins = Math.floor(segundos / 60);
            const secs = segundos % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        document.querySelectorAll('.car-wrapper').forEach(wrapper => {
            const id = wrapper.dataset.id;
            const timer = wrapper.querySelector('.car-timer');
            const autoObj = activeAutos[id];
            
            if (autoObj) {
                if (autoObj.state === 'espera') {
                    timer.style.display = 'block';
                    let remaining = Math.max(0, Math.ceil((autoObj.etaSalidaEspera - now) / 1000));
                    timer.textContent = formatTime(remaining);
                } else if (autoObj.state === 'terminado') {
                    if (autoObj.endTime) {
                        const remaining = Math.ceil((autoObj.endTime - now) / 1000);
                        if (remaining > 0) {
                            timer.textContent = formatTime(remaining);
                            timer.style.display = 'block';
                        } else {
                            timer.style.display = 'none';
                        }
                    } else {
                        timer.textContent = `¡Listo!`;
                        timer.style.display = 'block';
                    }
                } else if (autoObj.endTime) {
                    const remaining = Math.ceil((autoObj.endTime - now) / 1000);
                    if (remaining > 0) {
                        timer.textContent = formatTime(remaining);
                        timer.style.display = 'block';
                    } else {
                        timer.style.display = 'none';
                    }
                } else {
                    timer.style.display = 'none';
                }
            } else {
                timer.style.display = 'none';
            }
        });
    }

    // Dibujar la pista real (Asfalto + Neón) dinámicamente
    function drawScalextricPaths() {
        const trackInterior = document.getElementById('track-interior');
        const trackLavado = document.getElementById('track-lavado');
        const baseInterior = document.getElementById('base-interior');
        const baseLavado = document.getElementById('base-lavado');
        const railsInterior = document.getElementById('rails-interior');
        const slotInterior = document.getElementById('slot-interior');
        const railsLavado = document.getElementById('rails-lavado');
        const slotLavado = document.getElementById('slot-lavado');
        const canvasArea = document.getElementById('canvas-area');
        
        if (!trackInterior || !trackLavado || !canvasArea) return;

        // Función auxiliar para obtener el centro de un box por su boxNumber (1-48)
        function getBoxCenter(boxNumber) {
            const box = document.querySelector(`.grid-box[data-box-number="${boxNumber}"]`);
            if (!box) return { x: 0, y: 0 };
            const boxRect = box.getBoundingClientRect();
            const canvasRect = canvasArea.getBoundingClientRect();
            return {
                x: boxRect.left - canvasRect.left + (boxRect.width / 2),
                y: boxRect.top - canvasRect.top + (boxRect.height / 2)
            };
        }

        // Pista Solo Interior (Circuito Interno)
        // Espera Izq: 29 (bot) -> 11 (top). Secado 2: 9. Terminado Único: 7 (top) -> 25 (bot).
        const eIzqBot = getBoxCenter(29);
        const eIzqTop = getBoxCenter(11);
        const secado2 = getBoxCenter(9);
        
        // Pista Lavado (Circuito Externo)
        // Espera Der: 30 (bot) -> 12 (top). Lavado: 4. Secado 1: 3. Terminado Único: 7 (top) -> 25 (bot).
        const eDerBot = getBoxCenter(30);
        const eDerTop = getBoxCenter(12);
        const lavado = getBoxCenter(4);
        const secado1 = getBoxCenter(3);
        
        // Terminado (único carril)
        const tTop = getBoxCenter(7);
        const tBot = getBoxCenter(25);

        if (eIzqBot.x === 0 || eDerBot.x === 0 || tTop.x === 0) return; // Si aún no se renderizaron

        let R = 45; // Radio de curva para las esquinas

        // Path Interno (Interior) - Dobla en la Fila 3
        let pathIzq = `
            M ${eIzqBot.x} ${eIzqBot.y + 300} 
            L ${eIzqTop.x} ${eIzqTop.y + R} 
            Q ${eIzqTop.x} ${eIzqTop.y} ${eIzqTop.x - R} ${eIzqTop.y}
            L ${tTop.x + R} ${tTop.y}
            Q ${tTop.x} ${tTop.y} ${tTop.x} ${tTop.y + R}
            L ${tBot.x} ${tBot.y + 300}
        `;

        // Path Externo (Lavado) - Sube hasta la Fila 2 y luego dobla
        let pathDer = `
            M ${eDerBot.x} ${eDerBot.y + 300} 
            L ${eDerTop.x} ${lavado.y + R} 
            Q ${eDerTop.x} ${lavado.y} ${eDerTop.x - R} ${lavado.y}
            L ${tTop.x + R} ${lavado.y}
            Q ${tTop.x} ${lavado.y} ${tTop.x} ${lavado.y + R}
            L ${tBot.x} ${tBot.y + 300}
        `;

        trackInterior.setAttribute('d', pathIzq);
        trackLavado.setAttribute('d', pathDer);
        
        if (baseInterior) baseInterior.setAttribute('d', pathIzq);
        if (baseLavado) baseLavado.setAttribute('d', pathDer);
        if (railsInterior) railsInterior.setAttribute('d', pathIzq);
        if (slotInterior) slotInterior.setAttribute('d', pathIzq);
        if (railsLavado) railsLavado.setAttribute('d', pathDer);
        if (slotLavado) slotLavado.setAttribute('d', pathDer);
    }

    // Dibujar pistas constantemente para asegurar que se adapten a cualquier cambio (y que el DOM est cargado)
    setInterval(drawScalextricPaths, 500);
    window.addEventListener('resize', drawScalextricPaths);
    // Llamada inicial para intentar renderizar rápido
    drawScalextricPaths();

    // === MÓDULO DE MÉTRICAS ===
    let metricsHistory = [];

    // Cargar métricas desde Supabase
    async function loadMetrics() {
        try {
            const { data, error } = await supabaseClient.from('metrics').select('*').order('timestamp', { ascending: true });
            if (data && !error) {
                metricsHistory = data;
                window.updateMetricsUI();
            }
        } catch(e) { console.error("Error al cargar métricas", e); }
    }
    loadMetrics();

    // Recibir nuevas métricas en tiempo real
    supabaseClient.channel('metrics_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'metrics' }, payload => {
            const exists = metricsHistory.find(m => m.id === payload.new.id);
            if (!exists) {
                metricsHistory.push(payload.new);
                window.updateMetricsUI();
            }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'metrics' }, payload => {
            metricsHistory = [];
            window.updateMetricsUI();
        })
        .subscribe();

    window.recordMetric = async function(auto) {
        if (!isMaster) return; // Solo el maestro guarda la métrica final en Supabase para evitar duplicados

        let rev = 0;
        if (auto.tipo === 'solo_lavado') { rev = window.APP_CONFIG.precioLavado; }
        else if (auto.tipo === 'solo_secado') { rev = window.APP_CONFIG.precioSecado; }
        else { rev = window.APP_CONFIG.precioCompleto; }
        
        const metricData = {
            id: auto.id || uuidv4(),
            patente: auto.patente || 'S/D',
            timestamp: Date.now(),
            tipo: auto.tipo,
            revenue: rev,
            profit: rev // La ganancia ahora es el 100% de la recaudación
        };

        try {
            const { error } = await supabaseClient.from('metrics').insert([metricData]);
            if (error) {
                console.error("Error al guardar métrica en Supabase:", error);
            }
        } catch(e) { console.error(e); }
    };

    window.updateMetricsUI = function() {
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;
        const service = document.getElementById('filter-service').value;
        
        let filtered = metricsHistory.filter(record => {
            let pass = true;
            if (service !== 'all' && record.tipo !== service) pass = false;
            
            // Normalize dates for comparison
            const recDate = new Date(record.timestamp);
            recDate.setHours(0,0,0,0);
            
            if (dateFrom) {
                const df = new Date(dateFrom);
                df.setHours(0,0,0,0);
                df.setMinutes(df.getMinutes() + df.getTimezoneOffset());
                if (recDate < df) pass = false;
            }
            if (dateTo) {
                const dt = new Date(dateTo);
                dt.setHours(0,0,0,0);
                dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
                if (recDate > dt) pass = false;
            }
            return pass;
        });
        
        // Calcular Totales
        let tLavados = filtered.length;
        let tRev = filtered.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
        let tProfit = filtered.reduce((acc, curr) => acc + (Number(curr.profit) || 0), 0);
        
        document.getElementById('metric-total-lavados').textContent = tLavados;
        document.getElementById('metric-total-revenue').textContent = '$' + tRev.toFixed(2);
        document.getElementById('metric-net-profit').textContent = '$' + tProfit.toFixed(2);
        
        // Poblar Tabla
        filtered.sort((a,b) => b.timestamp - a.timestamp);
        const tbody = document.getElementById('metrics-table-body');
        tbody.innerHTML = '';
        filtered.forEach(rec => {
            const dateStr = new Date(rec.timestamp).toLocaleString();
            let srvName = '';
            if(rec.tipo === 'solo_lavado') srvName = 'Solo Lavado';
            else if (rec.tipo === 'solo_secado') srvName = 'Solo Interior';
            else srvName = 'Lavado + Interior';
            
            const revNum = Number(rec.revenue) || 0;
            const profNum = Number(rec.profit) || 0;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: bold; color: var(--primary-color);">${rec.patente || 'S/D'}</td>
                <td>${dateStr}</td>
                <td>${srvName}</td>
                <td style="color: #60a5fa;">$${revNum.toFixed(2)}</td>
                <td style="color: #4ade80; font-weight: bold;">$${profNum.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    };
    
    // Filtros Listeners
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            window.updateMetricsUI();
        });
    }
    
    // Borrar Historial
    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', async () => {
            if(confirm("¿Estás seguro de que quieres borrar TODAS las métricas? Esta acción no se puede deshacer.")) {
                const { error } = await supabaseClient.from('metrics').delete().neq('id', '0'); // Borra todo
                if (!error) {
                    metricsHistory = [];
                    window.updateMetricsUI();
                } else {
                    console.error("Error al borrar métricas:", error);
                }
            }
        });
    }
    // Dibujar la pista Neón dinámicamente
    function drawScalextricPaths() {
        const trackInterior = document.getElementById('track-interior');
        const trackLavado = document.getElementById('track-lavado');
        const canvasArea = document.getElementById('canvas-grid'); // El SVG ahora está dentro de canvas-grid
        
        if (!trackInterior || !trackLavado || !canvasArea) return;

        // Función auxiliar para obtener el centro de un box por su boxNumber (1-48)
        function getBoxCenter(boxNumber) {
            const box = document.querySelector(`.grid-box[data-box-number="${boxNumber}"]`);
            if (!box) return { x: 0, y: 0 };
            // Al estar el SVG dentro de canvasGrid, las coordenadas relativas son:
            return {
                x: box.offsetLeft + (box.offsetWidth / 2),
                y: box.offsetTop + (box.offsetHeight / 2)
            };
        }

        // Pista Solo Interior (Circuito Interno)
        // Espera Izq: 29 (bot) -> 11 (top). Secado 2: 9. Terminado: 7 (top) -> 25 (bot).
        const eIzqBot = getBoxCenter(29);
        const eIzqTop = getBoxCenter(11);
        const secado2 = getBoxCenter(9);
        
        // Pista Lavado (Circuito Externo)
        // Espera Der: 30 (bot) -> 12 (top). Lavado: 4. Secado 1: 3. Terminado: 7 (top) -> 25 (bot).
        const eDerBot = getBoxCenter(30);
        const eDerTop = getBoxCenter(12);
        const lavado = getBoxCenter(4);
        const secado1 = getBoxCenter(3);
        
        // Terminado (carril compartido)
        const tTop = getBoxCenter(7);
        const tBot = getBoxCenter(25);

        if (eIzqBot.x === 0 || eDerBot.x === 0 || tTop.x === 0) return; // Si aún no se renderizaron

        let R = 45; // Radio de curva para las esquinas

        // Path Interno (Interior) - Dobla en la Fila 3
        let pathIzq = `
            M ${eIzqBot.x} ${eIzqBot.y + 100} 
            L ${eIzqTop.x} ${eIzqTop.y + R} 
            Q ${eIzqTop.x} ${eIzqTop.y} ${eIzqTop.x - R} ${eIzqTop.y}
            L ${tTop.x + R} ${tTop.y}
            Q ${tTop.x} ${tTop.y} ${tTop.x} ${tTop.y + R}
            L ${tBot.x} ${tBot.y + 100}
        `;

        // Path Externo (Lavado) - Sube hasta la Fila 2 y luego dobla
        let pathDer = `
            M ${eDerBot.x} ${eDerBot.y + 100} 
            L ${eDerTop.x} ${lavado.y + R} 
            Q ${eDerTop.x} ${lavado.y} ${eDerTop.x - R} ${lavado.y}
            L ${tTop.x + R} ${lavado.y}
            Q ${tTop.x} ${lavado.y} ${tTop.x} ${lavado.y + R}
            L ${tBot.x} ${tBot.y + 100}
        `;

        trackInterior.setAttribute('d', pathIzq);
        trackLavado.setAttribute('d', pathDer);
    }

    // Dibujar pistas constantemente para asegurar que se adapten a cualquier cambio (y que el DOM esté cargado)
    setInterval(drawScalextricPaths, 500);
    window.addEventListener('resize', drawScalextricPaths);
    // Llamada inicial para intentar renderizar rápido
    setTimeout(drawScalextricPaths, 100);

});
