document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener referencias a los elementos del DOM
    const createMallaBtn = document.getElementById('createMallaBtn');
    const initialScreen = document.getElementById('initial-screen');
    const contenedor = document.getElementById('contenedor');
    
    const continueBtn = document.getElementById('continueBtn');
    const mallaEditor = document.getElementById('malla-editor');
    const semestersGrid = document.getElementById('semesters-grid');
    const careerNameInput = document.getElementById('career-name');
    const displayCareerName = document.getElementById('display-career-name');

    // Referencias a los elementos del modal
    const editModal = document.getElementById('edit-modal');
    const editRamoNameInput = document.getElementById('edit-ramo-name');
    const prerequisiteSelect = document.getElementById('prerequisite-select');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const deleteRamoBtn = document.getElementById('delete-ramo-btn');

    let currentRamoCard = null;

    // --- LÓGICA PRINCIPAL: Carga y Guardado ---

    // 1.1 Intentar cargar la malla al iniciar la página
    loadMallaFromLocalStorage();

    function loadMallaFromLocalStorage() {
        const savedMallaData = localStorage.getItem('mallaData');
        if (savedMallaData) {
            const mallaData = JSON.parse(savedMallaData);
            
            // Ocultar la pantalla inicial y mostrar el editor
            initialScreen.style.display = 'none';
            mallaEditor.style.display = 'flex';
            
            // Reconstruir la malla
            displayCareerName.textContent = mallaData.careerName;
            generateSemesterCards(mallaData.semesters.length, mallaData);
            updateAllRamosVisuals();
            updateSemesterVisuals();
            
        } else {
            // Si no hay datos, mostrar la pantalla inicial
            initialScreen.style.display = 'flex';
        }
    }

    function saveMallaToLocalStorage() {
        const mallaData = {
            careerName: displayCareerName.textContent,
            semesters: []
        };
    
        const semesterColumns = semestersGrid.querySelectorAll('.semester-column');
        semesterColumns.forEach((column, index) => {
            const semesterNumber = index + 1;
            const ramosList = column.querySelector('.ramos-list');
            const ramos = [];
    
            ramosList.querySelectorAll('.ramo-card').forEach(ramoCard => {
                const ramoName = ramoCard.querySelector('span').textContent;
                const prerequisite = ramoCard.dataset.ramoPrerequisitos;
                const isCompleted = ramoCard.classList.contains('completed');
    
                ramos.push({
                    name: ramoName,
                    prerequisite: prerequisite,
                    isCompleted: isCompleted
                });
            });
    
            mallaData.semesters.push({
                number: semesterNumber,
                ramos: ramos
            });
        });
    
        localStorage.setItem('mallaData', JSON.stringify(mallaData));
    }


    // --- MANEJO DE EVENTOS INICIALES ---

    createMallaBtn.addEventListener('click', () => {
        initialScreen.style.display = 'none';
        contenedor.style.display = 'flex';
    });

    continueBtn.addEventListener('click', () => {
        const semesterCount = parseInt(document.getElementById('semester-count').value);
        const careerName = careerNameInput.value;
        
        if (isNaN(semesterCount) || semesterCount < 1) {
            alert('Por favor, ingresa un número de semestres válido.');
            return;
        }

        contenedor.style.display = 'none';
        mallaEditor.style.display = 'flex';

        displayCareerName.textContent = careerName || 'Carrera sin nombre';

        generateSemesterCards(semesterCount);
        saveMallaToLocalStorage(); // Guardar la malla inicial
    });

    // --- FUNCIONES DE GENERACIÓN Y MANIPULACIÓN DEL DOM ---
    
    function generateSemesterCards(count, mallaData = null) {
        semestersGrid.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const semesterCardHTML = `
                <div class="semester-column">
                    <div class="top">
                        <h2>Semestre ${i}</h2>
                        <div class="mas">
                            <button class="add-ramo-btn primary" data-semester="${i}">
                                <i class='bx bx-plus' style='color:#c9d1d9'></i>
                            </button>
                        </div>
                    </div>
                    <div class="ramos-list" id="ramos-list-${i}">
                    </div>
                </div>
            `;
            semestersGrid.insertAdjacentHTML('beforeend', semesterCardHTML);

            // Si hay datos guardados, añadimos los ramos
            if (mallaData) {
                const ramosDelSemestre = mallaData.semesters.find(s => s.number === i).ramos;
                ramosDelSemestre.forEach(ramo => {
                    addRamoToSemester(i, ramo.name, ramo.prerequisite, ramo.isCompleted);
                });
            }
        }
    }
    // --- FUNCIONES DE GENERACIÓN Y MANIPULACIÓN DEL DOM ---
    function addRamoToSemester(semesterId, ramoName, prerequisite = '', isCompleted = false) {
        const ramosList = document.getElementById(`ramos-list-${semesterId}`);
        const completedClass = isCompleted ? 'completed' : '';
        
        // Al añadir un nuevo ramo, también necesitamos un nuevo atributo para el prerrequisito pendiente
        const prerequisitePendingClass = prerequisite && !isCompleted ? 'prerequisite-pending' : '';

        const ramoCardHTML = `
            <div class="ramo-card ${completedClass} ${prerequisitePendingClass}" data-ramo-prerequisitos="${prerequisite}">
                <span>${ramoName}</span>
                <div class="ramo-actions">
                    <button class="edit-ramo-btn" data-ramo-name="${ramoName}" data-semester="${semesterId}">
                        <i class='bx bx-edit' ></i>
                    </button>
                    <button class="mark-btn">✓</button>
                </div>
            </div>
        `;
        ramosList.insertAdjacentHTML('beforeend', ramoCardHTML);
        updateAllRamosVisuals(); // Llamar para actualizar los estilos de toda la malla
    }

    // Un solo listener para manejar todos los clics en el grid
    semestersGrid.addEventListener('click', (event) => {
        const addRamoBtn = event.target.closest('.add-ramo-btn');
        if (addRamoBtn) {
            event.stopPropagation();
            event.preventDefault();
            const semesterId = addRamoBtn.dataset.semester;
            const ramoName = prompt('Escribe el nombre del ramo:');
            
            if (ramoName && ramoName.trim() !== '') {
                addRamoToSemester(semesterId, ramoName.trim());
                saveMallaToLocalStorage();
                updateAllRamosVisuals();
                updateSemesterVisuals(); // <-- LLAMADA IMPORTANTE
            } else if (ramoName !== null) {
                alert('El nombre del ramo no puede estar vacío.');
            }
        }
        
        const markBtn = event.target.closest('.mark-btn');
        if (markBtn) {
            const ramoCard = markBtn.closest('.ramo-card');
            if (ramoCard) {
                if (!ramoCard.classList.contains('completed')) {
                    const canBeMarked = checkPrerequisites(ramoCard);
                    if (canBeMarked) {
                        ramoCard.classList.add('completed');
                        saveMallaToLocalStorage();
                        updateAllRamosVisuals();
                        updateSemesterVisuals(); // <-- LLAMADA IMPORTANTE
                    } else {
                        alert('No puedes marcar este ramo como completado. ¡Primero debes completar su prerrequisito!');
                    }
                } else {
                    const hasDependents = checkDependents(ramoCard);
                    if (!hasDependents) {
                        ramoCard.classList.remove('completed');
                        saveMallaToLocalStorage();
                        updateAllRamosVisuals();
                        updateSemesterVisuals(); // <-- LLAMADA IMPORTANTE
                    } else {
                        alert('No puedes desmarcar este ramo. Debes desmarcar los ramos que dependen de él primero.');
                    }
                }
            }
        }

        const editRamoBtn = event.target.closest('.edit-ramo-btn');
        if (editRamoBtn) {
            currentRamoCard = editRamoBtn.closest('.ramo-card');
            const currentRamoName = currentRamoCard.querySelector('span').textContent;
            const currentSemester = parseInt(editRamoBtn.dataset.semester);

            editRamoNameInput.value = currentRamoName;
            prerequisiteSelect.value = currentRamoCard.dataset.ramoPrerequisitos || '';
            populatePrerequisiteSelect(currentSemester);
            
            editModal.style.display = 'flex';
        }
    });

    function updateSemesterVisuals() {
        const semesterColumns = document.querySelectorAll('.semester-column');
        
        semesterColumns.forEach(semesterColumn => {
            const ramoCards = semesterColumn.querySelectorAll('.ramo-card');
            
            if (ramoCards.length === 0) {
                // Si el semestre no tiene ramos, no puede estar completado
                semesterColumn.classList.remove('semester-completed');
                return;
            }

            // `every()` retorna true si todos los elementos cumplen la condición
            const allRamosCompleted = Array.from(ramoCards).every(card => {
                return card.classList.contains('completed');
            });

            if (allRamosCompleted) {
                semesterColumn.classList.add('semester-completed');
            } else {
                semesterColumn.classList.remove('semester-completed');
            }
        });
    }


    // NUEVA FUNCIÓN: Actualiza el estado visual de todos los ramos
    function updateAllRamosVisuals() {
        const allRamoCards = document.querySelectorAll('.ramo-card');
        
        allRamoCards.forEach(ramoCard => {
            const hasPrerequisite = !!ramoCard.dataset.ramoPrerequisitos;
            const isCompleted = ramoCard.classList.contains('completed');
            
            if (hasPrerequisite && !isCompleted) {
                const prerequisiteIsReady = checkPrerequisites(ramoCard);
                if (!prerequisiteIsReady) {
                    ramoCard.classList.add('prerequisite-pending');
                } else {
                    ramoCard.classList.remove('prerequisite-pending');
                }
            } else {
                ramoCard.classList.remove('prerequisite-pending');
            }
        });
    }

    closeModalBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    saveEditBtn.addEventListener('click', () => {
        const newName = editRamoNameInput.value;
        const newPrerequisite = prerequisiteSelect.value;

        if (newName.trim() !== '') {
            currentRamoCard.querySelector('span').textContent = newName;
            currentRamoCard.querySelector('.edit-ramo-btn').dataset.ramoName = newName;
        }

        currentRamoCard.dataset.ramoPrerequisitos = newPrerequisite;
        editModal.style.display = 'none';
        saveMallaToLocalStorage(); // Guardar después de editar
        updateAllRamosVisuals();
        updateSemesterVisuals();
    });
    
    deleteRamoBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres eliminar este ramo? Esta acción es irreversible.')) {
            if (currentRamoCard) {
                currentRamoCard.remove();
            }
            editModal.style.display = 'none';
            saveMallaToLocalStorage(); // Guardar después de eliminar
            updateAllRamosVisuals();
            updateSemesterVisuals();
        }
    });
    
    // --- FUNCIONES DE LÓGICA DE PRERREQUISITOS ---

    function checkPrerequisites(ramoCard) {
        const prerequisiteName = ramoCard.dataset.ramoPrerequisitos;
        
        if (!prerequisiteName || prerequisiteName === '') {
            return true;
        }
        
        const allRamoCards = document.querySelectorAll('.ramo-card');
        let prerequisiteCompleted = false;
        
        allRamoCards.forEach(card => {
            const cardName = card.querySelector('span').textContent;
            if (cardName === prerequisiteName && card.classList.contains('completed')) {
                prerequisiteCompleted = true;
            }
        });

        return prerequisiteCompleted;
    }

    function checkDependents(ramoCard) {
        const currentRamoName = ramoCard.querySelector('span').textContent;
        const allRamoCards = document.querySelectorAll('.ramo-card');
        let hasCompletedDependent = false;

        allRamoCards.forEach(card => {
            const prerequisiteOfCard = card.dataset.ramoPrerequisitos;
            if (prerequisiteOfCard === currentRamoName && card.classList.contains('completed')) {
                hasCompletedDependent = true;
            }
        });

        return hasCompletedDependent;
    }

    function populatePrerequisiteSelect(currentSemester) {
        prerequisiteSelect.innerHTML = '<option value="">Ninguno</option>';
        for (let i = 1; i < currentSemester; i++) {
            const ramosList = document.getElementById(`ramos-list-${i}`);
            if (ramosList) {
                const ramos = ramosList.querySelectorAll('.ramo-card');
                ramos.forEach(ramoCard => {
                    const ramoName = ramoCard.querySelector('span').textContent;
                    const option = document.createElement('option');
                    option.value = ramoName;
                    option.textContent = ramoName;
                    prerequisiteSelect.appendChild(option);
                });
            }
        }
    }
});
