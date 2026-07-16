document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
        });
    });

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

            if (boxNumber === 29 || boxNumber === 30) {
                // Al llegar al 29, creamos la zona que ocupa el lugar del 29 y 30
                if (boxNumber === 29) {
                    const reserva = document.createElement('div');
                    reserva.className = 'reserva-online';
                    reserva.textContent = 'Zona Reserva Online';
                    reserva.style.gridRow = row;
                    reserva.style.gridColumn = '5 / span 2';
                    canvasGrid.appendChild(reserva);
                }
                continue; // Saltamos la creación del grid-box normal
            }

            const box = document.createElement('div');
            box.className = 'grid-box';
            box.dataset.boxNumber = boxNumber;
            
            // Reemplazo de números específicos para la Zona de Espera, Lavado y Secado
            const textReplacements = {
                // Terminado
                20: '1',
                19: '2',
                14: '3',
                13: '4',
                8: '5',
                7: '6',
                2: '7',
                1: '8',
                // Zona de Espera
                5: '1',
                6: '2',
                11: '3',
                12: '4',
                17: '5',
                18: '6',
                23: '7',
                24: '8',
                // Lavado
                4: '1',
                // Secado
                3: '1',
                9: '2'
            };
            box.textContent = textReplacements[boxNumber] || boxNumber;
            
            // Ubicación explícita: fila 2 en adelante para dejar la fila 1 para títulos
            box.style.gridRow = row;
            box.style.gridColumn = col;

            canvasGrid.appendChild(box);
        }
    }

    // -- LÓGICA DE SIMULACIÓN DE AUTOS --
    const ESPERA_ZONES = [5, 6, 11, 12, 17, 18, 23, 24]; // Índices reales del 1 al 8 de espera
    const LAVADO_ZONE = 4; // Índice real de lavado
    const SECADO_ZONES = [3, 9]; // Índices reales de Secado 1 y 2
    const TERMINADO_ZONES = [20, 19, 14, 13, 8, 7, 2, 1]; // Índices reales de Terminado 1 al 8
    
    // Estado (null si está vacío, o un objeto con id de auto y tipo si está ocupado)
    let estadoEspera = new Array(8).fill(null);
    let estadoLavado = null;
    let estadoSecado = new Array(2).fill(null);
    const estadoTerminado = [null, null, null, null, null, null, null, null];

    let autoIdCounter = 1;
    let isMoving = false; // Flag para evitar overlap de animaciones

    // --- Motor de Simulación Videojuego ---
    const simCars = new Map();

    function gameLoop() {
        simCars.forEach((state, id) => {
            // Interpolar posición (Easing suave)
            const dx = state.targetX - state.x;
            const dy = state.targetY - state.y;
            
            state.x += dx * 0.04; // Velocidad del tween
            state.y += dy * 0.04;

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
    
    let timers = {}; // guardamos timers para no superponerlos si hay clicks manuales

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
                icon.src = 'f1_car_top_down.png'; // Usamos la nueva imagen top-down
                let typeClass = '';
                if (autoObj.tipo === 'solo_lavado') typeClass = 'solo-lavado';
                else if (autoObj.tipo === 'solo_secado') typeClass = 'solo-secado';
                else typeClass = 'completo';
                icon.className = `auto-icon ${typeClass}`;
                
                timer = document.createElement('div');
                timer.className = 'car-timer';
                
                wrapper.appendChild(icon);
                wrapper.appendChild(timer);
                canvas.appendChild(wrapper);
            } else {
                icon = wrapper.querySelector('.auto-icon');
                timer = wrapper.querySelector('.car-timer');
            }
            
            // Calculamos posición destino exacta usando el DOM real
            const cellRect = cell.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const targetX = (cellRect.left - canvasRect.left) + (cellRect.width / 2);
            const targetY = (cellRect.top - canvasRect.top) + (cellRect.height / 2);
            
            // Actualizar simulador
            let simState = simCars.get(id);
            if (!simState) {
                // El auto "entra" manejando desde la parte inferior central de la pantalla
                simState = {
                    x: canvasRect.width / 2,
                    y: canvasRect.height + 100, 
                    targetX: targetX,
                    targetY: targetY,
                    angle: 0,
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

    // Funciones para ingresar autos
    function ingresarAuto(tipo) {
        const freeIndex = estadoEspera.findIndex(slot => slot === null);
        if (freeIndex !== -1) {
            estadoEspera[freeIndex] = { id: autoIdCounter++, tipo: tipo, startTime: Date.now() };
            updateVisuals();
            checkMovement();
        } else {
            alert('La zona de espera está llena (8 autos máximo).');
        }
    }

    const btnSoloLavado = document.getElementById('btn-ingresar-lavado');
    if (btnSoloLavado) btnSoloLavado.addEventListener('click', () => ingresarAuto('solo_lavado'));

    const btnSoloSecado = document.getElementById('btn-ingresar-secado');
    if (btnSoloSecado) btnSoloSecado.addEventListener('click', () => ingresarAuto('solo_secado'));

    const btnCompleto = document.getElementById('btn-ingresar-completo');
    if (btnCompleto) btnCompleto.addEventListener('click', () => ingresarAuto('lavado_secado'));

    // Lógica de avance automático desde Espera
    function checkMovement() {
        if (isMoving) return;

        const auto = estadoEspera[0];
        if (auto === null) return;

        // 1. Si es "solo_secado", va directo a Secado (saltea Lavado)
        if (auto.tipo === 'solo_secado') {
            const freeIdx = estadoSecado.findIndex(s => s === null);
            if (freeIdx !== -1) {
                isMoving = true;
                auto.endTime = Date.now() + 5000;
                estadoSecado[freeIdx] = auto;
                estadoEspera[0] = null;
                updateVisuals();

                clearTimeout(timers.espera);
                timers.espera = setTimeout(() => {
                    acomodarArreglo(estadoEspera);
                    updateVisuals();
                    isMoving = false;
                    checkMovement();
                }, 3000);
            }
        } 
        // 2. Si es para lavar, va a Lavado
        else {
            if (estadoLavado === null) {
                isMoving = true;
                auto.endTime = Date.now() + 5000;
                estadoLavado = auto;
                estadoEspera[0] = null;
                updateVisuals();

                clearTimeout(timers.espera);
                timers.espera = setTimeout(() => {
                    acomodarArreglo(estadoEspera);
                    updateVisuals();
                    isMoving = false;
                    checkMovement(); // Verificamos de nuevo por si se vació lavado rápido
                }, 3000);
            }
        }
    }

    function acomodarArreglo(arr) {
        let newArr = new Array(arr.length).fill(null);
        let insertIdx = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== null) {
                newArr[insertIdx++] = arr[i];
            }
        }
        for (let i = 0; i < arr.length; i++) {
            arr[i] = newArr[i];
        }
    }

    // -- BUCLE DE SIMULACIÓN AUTOMÁTICA --
    setInterval(() => {
        const now = Date.now();

        // Procesar Lavado
        if (estadoLavado && estadoLavado.endTime && now >= estadoLavado.endTime) {
            let moved = false;
            if (estadoLavado.tipo === 'solo_lavado') {
                const freeIdx = estadoTerminado.findIndex(s => s === null);
                if (freeIdx !== -1) {
                    estadoLavado.endTime = Date.now() + 5000; // Asignar nuevo tiempo para terminado
                    estadoTerminado[freeIdx] = estadoLavado;
                    estadoLavado = null;
                    moved = true;
                }
            } else if (estadoLavado.tipo === 'lavado_secado') {
                const freeIdx = estadoSecado.findIndex(s => s === null);
                if (freeIdx !== -1) {
                    estadoLavado.endTime = Date.now() + 5000; // Asignar nuevo tiempo para secado
                    estadoSecado[freeIdx] = estadoLavado;
                    estadoLavado = null;
                    moved = true;
                }
            }
            if (moved) {
                updateVisuals();
            }
        }

        // Procesar Interior/Secado (de adelante hacia atrás)
        for (let i = 0; i < estadoSecado.length; i++) {
            const auto = estadoSecado[i];
            if (auto && auto.endTime && now >= auto.endTime) {
                const freeIdx = estadoTerminado.findIndex(s => s === null);
                if (freeIdx !== -1) {
                    auto.endTime = Date.now() + 5000; // Nuevo tiempo para terminado
                    estadoTerminado[freeIdx] = auto;
                    estadoSecado[i] = null;
                    updateVisuals();
                    
                    clearTimeout(timers.secado);
                    timers.secado = setTimeout(() => {
                        acomodarArreglo(estadoSecado);
                        updateVisuals();
                    }, 3000);
                }
            }
        }

        // Procesar Terminado (simulando entrega al cliente de adelante hacia atrás)
        for (let i = 0; i < estadoTerminado.length; i++) {
            const auto = estadoTerminado[i];
            if (auto && auto.endTime && now >= auto.endTime) {
                estadoTerminado[i] = null;
                updateVisuals();
                
                clearTimeout(timers.terminado);
                timers.terminado = setTimeout(() => {
                    acomodarArreglo(estadoTerminado);
                    updateVisuals();
                }, 3000);
            }
        }

        // Siempre chequear si la zona de espera puede avanzar
        checkMovement();
        updateTimers();
    }, 1000);
    
    function updateTimers() {
        const now = Date.now();
        
        // 1. Calculamos los ETAs para los que están en espera
        let libreLavadoAt = now;
        if (estadoLavado && estadoLavado.endTime) {
            libreLavadoAt = estadoLavado.endTime + 2000; // +2s por transiciones
        } else if (isMoving) {
            libreLavadoAt = now + 2000;
        }
        
        let libreSecadoAt = [now, now];
        estadoSecado.forEach((s, i) => {
            if (s && s.endTime) libreSecadoAt[i] = s.endTime + 2000;
        });

        estadoEspera.forEach(auto => {
            if (!auto) return;
            if (auto.tipo === 'solo_secado') {
                libreSecadoAt.sort((a, b) => a - b);
                let start = Math.max(now, libreSecadoAt[0]);
                auto.etaSalidaEspera = start;
                libreSecadoAt[0] = start + 5000 + 2000; // 5s proceso + 2s transición
            } else {
                let start = Math.max(now, libreLavadoAt);
                auto.etaSalidaEspera = start;
                libreLavadoAt = start + 5000 + 2000;
            }
        });

        // 2. Agrupamos y preparamos para pintar
        const activeAutos = {};
        estadoEspera.forEach(a => { if (a) { a.state = 'espera'; activeAutos[a.id] = a; }});
        if (estadoLavado) { estadoLavado.state = 'lavado'; activeAutos[estadoLavado.id] = estadoLavado; }
        estadoSecado.forEach(a => { if (a) { a.state = 'secado'; activeAutos[a.id] = a; }});
        estadoTerminado.forEach(a => { if (a) { a.state = 'terminado'; activeAutos[a.id] = a; }});
        
        document.querySelectorAll('.car-wrapper').forEach(wrapper => {
            const id = wrapper.dataset.id;
            const timerEl = wrapper.querySelector('.car-timer');
            const autoObj = activeAutos[id];
            
            if (autoObj) {
                if (autoObj.state === 'espera') {
                    const remaining = Math.ceil((autoObj.etaSalidaEspera - now) / 1000);
                    if (remaining > 0) {
                        timerEl.textContent = `${remaining}s`;
                        timerEl.style.backgroundColor = '#f59e0b'; // Naranja/Dorado para espera (ETA)
                        timerEl.style.color = '#fff';
                        timerEl.style.display = 'block';
                    } else {
                        // Si ya debería entrar pero está animando otro, mostramos "Próximo" o 0s
                        timerEl.textContent = `0s`;
                        timerEl.style.backgroundColor = '#f59e0b';
                        timerEl.style.display = 'block';
                    }
                } else if (autoObj.endTime) {
                    const remaining = Math.ceil((autoObj.endTime - now) / 1000);
                    if (remaining > 0) {
                        timerEl.textContent = `${remaining}s`;
                        timerEl.style.backgroundColor = '#38bdf8'; // Celeste para proceso
                        timerEl.style.color = '#0f172a';
                        timerEl.style.display = 'block';
                    } else {
                        timerEl.style.display = 'none';
                    }
                } else {
                    timerEl.style.display = 'none';
                }
            } else {
                timerEl.style.display = 'none';
            }
        });
    }
});
