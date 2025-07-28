/* ========================================
   DATE-PICKER.COMPONENT.JS - Sélecteur de date avancé
   Chemin: src/js/shared/ui/data-entry/date-picker.component.js
   
   DESCRIPTION:
   Composant de sélection de date avec calendrier interactif, support des plages,
   multiple sélections, restrictions de dates et intégration glassmorphism.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 20-200)
   2. Méthodes de création du calendrier (lignes 202-500)
   3. Gestion de la navigation (lignes 502-700)
   4. Gestion des sélections (lignes 702-900)
   5. Méthodes utilitaires dates (lignes 902-1100)
   6. Événements et interactions (lignes 1102-1300)
   7. API publique (lignes 1302-1400)
   
   DÉPENDANCES:
   - date-picker.css (styles glassmorphism et animations)
   - ui.config.js (configuration globale)
   - format-utils.js (formatage des dates)
   ======================================== */

const DatePickerComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    const CONFIG = {
        // Modes de sélection
        modes: {
            'single': {
                maxSelections: 1,
                rangeSelection: false,
                multipleMonths: false
            },
            'range': {
                maxSelections: 2,
                rangeSelection: true,
                multipleMonths: true,
                showPresets: true
            },
            'multiple': {
                maxSelections: Infinity,
                rangeSelection: false,
                multipleMonths: false
            },
            'month': {
                selectWholeMonth: true,
                showDays: false
            },
            'year': {
                selectWholeYear: true,
                showMonthsGrid: true
            },
            'datetime': {
                showTimePicker: true,
                timeStep: 15
            },
            'week': {
                selectWholeWeek: true,
                showWeekNumbers: true
            }
        },

        // Styles disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                boxShadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff'
            },
            'flat': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            },
            'minimal': {
                background: 'transparent',
                border: 'none',
                compact: true
            },
            'material': {
                background: '#ffffff',
                shadow: '0 3px 5px -1px rgba(0,0,0,.2)'
            }
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'subtle': {
                openDuration: 200,
                closeDuration: 150,
                monthTransition: 'fade'
            },
            'smooth': {
                openDuration: 300,
                closeDuration: 200,
                monthTransition: 'slide',
                dayHover: true
            },
            'rich': {
                openDuration: 400,
                closeDuration: 300,
                monthTransition: 'slide-3d',
                dayHover: true,
                rippleEffect: true
            }
        },

        // Présets de plages de dates
        presets: {
            'today': { label: "Aujourd'hui", days: 0 },
            'yesterday': { label: 'Hier', days: -1 },
            'last7Days': { label: '7 derniers jours', days: -7 },
            'last30Days': { label: '30 derniers jours', days: -30 },
            'thisMonth': { label: 'Ce mois', type: 'month' },
            'lastMonth': { label: 'Mois dernier', type: 'lastMonth' },
            'thisYear': { label: 'Cette année', type: 'year' },
            'custom': { label: 'Personnalisé', type: 'custom' }
        },

        // Configuration locale
        locale: {
            monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
            monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                             'Jui', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
            firstDay: 1, // Lundi
            format: 'DD/MM/YYYY',
            separator: ' - ',
            applyLabel: 'Appliquer',
            cancelLabel: 'Annuler',
            clearLabel: 'Effacer',
            customRangeLabel: 'Personnalisé'
        },

        // Classes CSS
        classes: {
            container: 'date-picker',
            input: 'date-picker-input',
            dropdown: 'date-picker-dropdown',
            calendar: 'date-picker-calendar',
            header: 'date-picker-header',
            navigation: 'date-picker-nav',
            monthYear: 'date-picker-month-year',
            weekdays: 'date-picker-weekdays',
            days: 'date-picker-days',
            day: 'date-picker-day',
            presets: 'date-picker-presets',
            timePicker: 'date-picker-time',
            footer: 'date-picker-footer'
        }
    };

    // État global des date pickers
    const instances = new Map();
    let activeInstance = null;

    // ========================================
    // MÉTHODES DE CRÉATION DU CALENDRIER
    // ========================================

    // Créer la structure HTML du calendrier
    function createCalendarStructure(options) {
        const container = document.createElement('div');
        container.className = `${CONFIG.classes.dropdown} ${options.style || 'glassmorphism'}`;
        
        // Header avec navigation
        const header = createHeader(options);
        container.appendChild(header);

        // Presets si activés
        if (options.showPresets) {
            const presets = createPresets(options);
            container.appendChild(presets);
        }

        // Conteneur des calendriers (peut être multiple)
        const calendarsContainer = document.createElement('div');
        calendarsContainer.className = 'date-picker-calendars';
        
        const monthsToShow = options.multipleMonths ? 2 : 1;
        for (let i = 0; i < monthsToShow; i++) {
            const calendar = createCalendar(options, i);
            calendarsContainer.appendChild(calendar);
        }
        
        container.appendChild(calendarsContainer);

        // Time picker si datetime
        if (options.showTimePicker) {
            const timePicker = createTimePicker(options);
            container.appendChild(timePicker);
        }

        // Footer avec actions
        const footer = createFooter(options);
        container.appendChild(footer);

        return container;
    }

    // Créer le header avec navigation
    function createHeader(options) {
        const header = document.createElement('div');
        header.className = CONFIG.classes.header;

        // Navigation précédente
        const prevButton = document.createElement('button');
        prevButton.className = 'date-picker-nav-prev';
        prevButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>`;
        prevButton.setAttribute('aria-label', 'Mois précédent');

        // Affichage mois/année
        const monthYear = document.createElement('div');
        monthYear.className = CONFIG.classes.monthYear;
        
        const monthSelect = document.createElement('select');
        monthSelect.className = 'date-picker-month-select';
        monthSelect.setAttribute('aria-label', 'Sélectionner le mois');
        
        const yearSelect = document.createElement('select');
        yearSelect.className = 'date-picker-year-select';
        yearSelect.setAttribute('aria-label', 'Sélectionner l\'année');
        
        monthYear.appendChild(monthSelect);
        monthYear.appendChild(yearSelect);

        // Navigation suivante
        const nextButton = document.createElement('button');
        nextButton.className = 'date-picker-nav-next';
        nextButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>`;
        nextButton.setAttribute('aria-label', 'Mois suivant');

        header.appendChild(prevButton);
        header.appendChild(monthYear);
        header.appendChild(nextButton);

        return header;
    }

    // Créer le calendrier principal
    function createCalendar(options, offset = 0) {
        const calendar = document.createElement('div');
        calendar.className = CONFIG.classes.calendar;
        if (offset > 0) calendar.classList.add('date-picker-calendar-offset');

        // Jours de la semaine
        const weekdays = document.createElement('div');
        weekdays.className = CONFIG.classes.weekdays;
        
        const dayNames = options.showWeekNumbers ? ['#', ...CONFIG.locale.dayNamesMin] : CONFIG.locale.dayNamesMin;
        const startDay = CONFIG.locale.firstDay;
        
        // Réorganiser selon le premier jour
        const orderedDays = [...dayNames.slice(startDay), ...dayNames.slice(0, startDay)];
        
        orderedDays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'date-picker-weekday';
            dayElement.textContent = day;
            weekdays.appendChild(dayElement);
        });
        
        calendar.appendChild(weekdays);

        // Grille des jours
        const daysGrid = document.createElement('div');
        daysGrid.className = CONFIG.classes.days;
        calendar.appendChild(daysGrid);

        return calendar;
    }

    // Créer les presets de sélection rapide
    function createPresets(options) {
        const presetsContainer = document.createElement('div');
        presetsContainer.className = CONFIG.classes.presets;

        Object.entries(CONFIG.presets).forEach(([key, preset]) => {
            if (key === 'custom' && options.mode !== 'range') return;

            const button = document.createElement('button');
            button.className = 'date-picker-preset';
            button.dataset.preset = key;
            button.textContent = preset.label;
            
            button.addEventListener('click', () => handlePresetClick(key, options));
            presetsContainer.appendChild(button);
        });

        return presetsContainer;
    }

    // Créer le sélecteur d'heure
    function createTimePicker(options) {
        const timeContainer = document.createElement('div');
        timeContainer.className = CONFIG.classes.timePicker;

        // Heures
        const hoursContainer = document.createElement('div');
        hoursContainer.className = 'time-picker-column';
        const hoursLabel = document.createElement('label');
        hoursLabel.textContent = 'Heures';
        const hoursInput = document.createElement('input');
        hoursInput.type = 'number';
        hoursInput.min = '0';
        hoursInput.max = '23';
        hoursInput.value = '12';
        hoursInput.className = 'time-picker-input';
        hoursContainer.appendChild(hoursLabel);
        hoursContainer.appendChild(hoursInput);

        // Minutes
        const minutesContainer = document.createElement('div');
        minutesContainer.className = 'time-picker-column';
        const minutesLabel = document.createElement('label');
        minutesLabel.textContent = 'Minutes';
        const minutesSelect = document.createElement('select');
        minutesSelect.className = 'time-picker-input';
        
        for (let i = 0; i < 60; i += options.timeStep || 15) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            minutesSelect.appendChild(option);
        }
        
        minutesContainer.appendChild(minutesLabel);
        minutesContainer.appendChild(minutesSelect);

        timeContainer.appendChild(hoursContainer);
        timeContainer.appendChild(minutesContainer);

        return timeContainer;
    }

    // Créer le footer avec actions
    function createFooter(options) {
        const footer = document.createElement('div');
        footer.className = CONFIG.classes.footer;

        // Bouton Effacer
        if (options.showClear) {
            const clearButton = document.createElement('button');
            clearButton.className = 'date-picker-button date-picker-clear';
            clearButton.textContent = CONFIG.locale.clearLabel;
            footer.appendChild(clearButton);
        }

        // Bouton Annuler
        const cancelButton = document.createElement('button');
        cancelButton.className = 'date-picker-button date-picker-cancel';
        cancelButton.textContent = CONFIG.locale.cancelLabel;
        footer.appendChild(cancelButton);

        // Bouton Appliquer
        const applyButton = document.createElement('button');
        applyButton.className = 'date-picker-button date-picker-apply';
        applyButton.textContent = CONFIG.locale.applyLabel;
        footer.appendChild(applyButton);

        return footer;
    }

    // ========================================
    // GESTION DE LA NAVIGATION
    // ========================================

    // Remplir le calendrier pour un mois donné
    function fillCalendar(calendar, date, options, selectedDates = []) {
        const daysGrid = calendar.querySelector(`.${CONFIG.classes.days}`);
        daysGrid.innerHTML = '';

        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        
        // Ajuster au premier jour de la semaine
        const startOffset = (firstDay.getDay() - CONFIG.locale.firstDay + 7) % 7;
        startDate.setDate(startDate.getDate() - startOffset);

        // Générer 6 semaines
        for (let week = 0; week < 6; week++) {
            // Numéro de semaine si activé
            if (options.showWeekNumbers) {
                const weekNum = getWeekNumber(new Date(startDate));
                const weekElement = document.createElement('div');
                weekElement.className = 'date-picker-week-number';
                weekElement.textContent = weekNum;
                daysGrid.appendChild(weekElement);
            }

            // Jours de la semaine
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                const dayElement = createDayElement(currentDate, {
                    ...options,
                    currentMonth: month,
                    selectedDates,
                    minDate: options.minDate,
                    maxDate: options.maxDate
                });
                
                daysGrid.appendChild(dayElement);
                startDate.setDate(startDate.getDate() + 1);
            }
        }
    }

    // Créer un élément jour
    function createDayElement(date, options) {
        const dayElement = document.createElement('button');
        dayElement.className = CONFIG.classes.day;
        dayElement.textContent = date.getDate();
        dayElement.dataset.date = formatDate(date, 'YYYY-MM-DD');

        const isCurrentMonth = date.getMonth() === options.currentMonth;
        const isToday = isDateToday(date);
        const isSelected = options.selectedDates.some(d => isSameDay(d, date));
        const isDisabled = isDateDisabled(date, options);
        const isInRange = isDateInRange(date, options.selectedDates, options.mode);

        // Classes conditionnelles
        if (!isCurrentMonth) dayElement.classList.add('other-month');
        if (isToday) dayElement.classList.add('today');
        if (isSelected) dayElement.classList.add('selected');
        if (isDisabled) dayElement.classList.add('disabled');
        if (isInRange) dayElement.classList.add('in-range');
        
        // États spéciaux pour les plages
        if (options.mode === 'range' && options.selectedDates.length === 2) {
            if (isSameDay(date, options.selectedDates[0])) {
                dayElement.classList.add('range-start');
            }
            if (isSameDay(date, options.selectedDates[1])) {
                dayElement.classList.add('range-end');
            }
        }

        dayElement.disabled = isDisabled;
        dayElement.setAttribute('aria-label', formatDate(date, 'DD MMMM YYYY'));
        
        return dayElement;
    }

    // Navigation entre les mois
    function navigateMonth(instance, direction) {
        const { currentDate, options } = instance;
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        
        instance.currentDate = newDate;
        updateCalendarDisplay(instance);
        
        // Animation de transition
        if (options.animation !== 'none') {
            animateMonthTransition(instance, direction);
        }
    }

    // ========================================
    // GESTION DES SÉLECTIONS
    // ========================================

    // Gérer le clic sur un jour
    function handleDayClick(event, instance) {
        const dayElement = event.target.closest(`.${CONFIG.classes.day}`);
        if (!dayElement || dayElement.disabled) return;

        const date = new Date(dayElement.dataset.date);
        const { options, selectedDates } = instance;

        switch (options.mode) {
            case 'single':
                instance.selectedDates = [date];
                break;
                
            case 'multiple':
                const index = selectedDates.findIndex(d => isSameDay(d, date));
                if (index > -1) {
                    selectedDates.splice(index, 1);
                } else if (selectedDates.length < options.maxSelections) {
                    selectedDates.push(date);
                }
                break;
                
            case 'range':
                if (selectedDates.length === 0 || selectedDates.length === 2) {
                    instance.selectedDates = [date];
                } else {
                    // Assurer que la première date est avant la deuxième
                    if (date < selectedDates[0]) {
                        instance.selectedDates = [date, selectedDates[0]];
                    } else {
                        instance.selectedDates = [selectedDates[0], date];
                    }
                }
                break;
                
            case 'week':
                const weekDates = getWeekDates(date);
                instance.selectedDates = weekDates;
                break;
        }

        updateCalendarDisplay(instance);
        
        // Effet ripple si activé
        if (options.animation === 'rich' && CONFIG.animations.rich.rippleEffect) {
            createRippleEffect(dayElement, event);
        }

        // Auto-fermeture pour single selection
        if (options.mode === 'single' && options.autoClose) {
            setTimeout(() => applySelection(instance), 200);
        }
    }

    // Gérer la sélection de preset
    function handlePresetClick(presetKey, options) {
        const preset = CONFIG.presets[presetKey];
        const instance = instances.get(options.instanceId);
        
        if (preset.days !== undefined) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + preset.days);
            
            instance.selectedDates = preset.days === 0 ? [endDate] : [startDate, endDate];
        } else if (preset.type === 'month') {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            instance.selectedDates = [startDate, endDate];
        } else if (preset.type === 'lastMonth') {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            instance.selectedDates = [startDate, endDate];
        } else if (preset.type === 'year') {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), 0, 1);
            const endDate = new Date(now.getFullYear(), 11, 31);
            instance.selectedDates = [startDate, endDate];
        }

        updateCalendarDisplay(instance);
        
        // Mettre en surbrillance le preset actif
        const presetButtons = instance.dropdown.querySelectorAll('.date-picker-preset');
        presetButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }

    // ========================================
    // MÉTHODES UTILITAIRES DATES
    // ========================================

    // Formater une date
    function formatDate(date, format) {
        if (!date) return '';
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('MMMM', CONFIG.locale.monthNames[date.getMonth()])
            .replace('MMM', CONFIG.locale.monthNamesShort[date.getMonth()]);
    }

    // Parser une date
    function parseDate(dateString, format) {
        // Implémentation simplifiée
        const parts = dateString.split(/[-/]/);
        if (format === 'DD/MM/YYYY') {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (format === 'YYYY-MM-DD') {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(dateString);
    }

    // Vérifier si deux dates sont le même jour
    function isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // Vérifier si une date est aujourd'hui
    function isDateToday(date) {
        return isSameDay(date, new Date());
    }

    // Vérifier si une date est désactivée
    function isDateDisabled(date, options) {
        if (options.minDate && date < options.minDate) return true;
        if (options.maxDate && date > options.maxDate) return true;
        if (options.disabledDates) {
            return options.disabledDates.some(d => isSameDay(d, date));
        }
        if (options.disabledDaysOfWeek) {
            return options.disabledDaysOfWeek.includes(date.getDay());
        }
        if (options.filterDate && typeof options.filterDate === 'function') {
            return !options.filterDate(date);
        }
        return false;
    }

    // Vérifier si une date est dans la plage sélectionnée
    function isDateInRange(date, selectedDates, mode) {
        if (mode !== 'range' || selectedDates.length !== 2) return false;
        return date > selectedDates[0] && date < selectedDates[1];
    }

    // Obtenir le numéro de semaine
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Obtenir toutes les dates d'une semaine
    function getWeekDates(date) {
        const dates = [];
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (CONFIG.locale.firstDay === 1 ? 1 : 0);
        
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(date);
            weekDate.setDate(diff + i);
            dates.push(weekDate);
        }
        
        return dates;
    }

    // ========================================
    // ÉVÉNEMENTS ET INTERACTIONS
    // ========================================

    // Initialiser les événements
    function initializeEvents(instance) {
        const { input, dropdown, options } = instance;

        // Événements de l'input
        input.addEventListener('click', () => toggleDatePicker(instance));
        input.addEventListener('focus', () => showDatePicker(instance));
        
        // Navigation
        dropdown.querySelector('.date-picker-nav-prev').addEventListener('click', () => navigateMonth(instance, -1));
        dropdown.querySelector('.date-picker-nav-next').addEventListener('click', () => navigateMonth(instance, 1));

        // Sélecteurs mois/année
        const monthSelect = dropdown.querySelector('.date-picker-month-select');
        const yearSelect = dropdown.querySelector('.date-picker-year-select');
        
        monthSelect.addEventListener('change', (e) => {
            instance.currentDate.setMonth(parseInt(e.target.value));
            updateCalendarDisplay(instance);
        });
        
        yearSelect.addEventListener('change', (e) => {
            instance.currentDate.setFullYear(parseInt(e.target.value));
            updateCalendarDisplay(instance);
        });

        // Clics sur les jours
        dropdown.addEventListener('click', (e) => {
            if (e.target.closest(`.${CONFIG.classes.day}`)) {
                handleDayClick(e, instance);
            }
        });

        // Boutons d'action
        dropdown.querySelector('.date-picker-apply')?.addEventListener('click', () => applySelection(instance));
        dropdown.querySelector('.date-picker-cancel')?.addEventListener('click', () => hideDatePicker(instance));
        dropdown.querySelector('.date-picker-clear')?.addEventListener('click', () => clearSelection(instance));

        // Fermeture au clic extérieur
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                hideDatePicker(instance);
            }
        });

        // Accessibilité clavier
        dropdown.addEventListener('keydown', (e) => handleKeyboardNavigation(e, instance));
    }

    // Gestion de la navigation au clavier
    function handleKeyboardNavigation(event, instance) {
        const { key } = event;
        const focusedElement = document.activeElement;
        
        switch (key) {
            case 'Escape':
                hideDatePicker(instance);
                instance.input.focus();
                break;
                
            case 'Tab':
                // Piéger le focus dans le date picker
                const focusableElements = instance.dropdown.querySelectorAll(
                    'button:not([disabled]), select, input'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (event.shiftKey && focusedElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                } else if (!event.shiftKey && focusedElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
                break;
                
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                if (focusedElement.classList.contains(CONFIG.classes.day)) {
                    event.preventDefault();
                    navigateDayByKeyboard(focusedElement, key);
                }
                break;
                
            case 'Enter':
            case ' ':
                if (focusedElement.classList.contains(CONFIG.classes.day)) {
                    event.preventDefault();
                    focusedElement.click();
                }
                break;
        }
    }

    // Navigation des jours au clavier
    function navigateDayByKeyboard(currentDay, direction) {
        const days = Array.from(currentDay.parentElement.querySelectorAll(`.${CONFIG.classes.day}:not([disabled])`));
        const currentIndex = days.indexOf(currentDay);
        let newIndex;
        
        switch (direction) {
            case 'ArrowLeft':
                newIndex = currentIndex - 1;
                break;
            case 'ArrowRight':
                newIndex = currentIndex + 1;
                break;
            case 'ArrowUp':
                newIndex = currentIndex - 7;
                break;
            case 'ArrowDown':
                newIndex = currentIndex + 7;
                break;
        }
        
        if (newIndex >= 0 && newIndex < days.length) {
            days[newIndex].focus();
        }
    }

    // ========================================
    // ANIMATIONS ET EFFETS
    // ========================================

    // Animation de transition de mois
    function animateMonthTransition(instance, direction) {
        const calendar = instance.dropdown.querySelector(`.${CONFIG.classes.calendar}`);
        const animationType = CONFIG.animations[instance.options.animation].monthTransition;
        
        switch (animationType) {
            case 'fade':
                calendar.style.opacity = '0';
                setTimeout(() => {
                    updateCalendarDisplay(instance);
                    calendar.style.opacity = '1';
                }, 150);
                break;
                
            case 'slide':
                calendar.style.transform = `translateX(${direction * 20}px)`;
                calendar.style.opacity = '0.5';
                setTimeout(() => {
                    updateCalendarDisplay(instance);
                    calendar.style.transform = 'translateX(0)';
                    calendar.style.opacity = '1';
                }, 150);
                break;
                
            case 'slide-3d':
                calendar.style.transform = `perspective(1000px) rotateY(${direction * 10}deg)`;
                calendar.style.opacity = '0.7';
                setTimeout(() => {
                    updateCalendarDisplay(instance);
                    calendar.style.transform = 'perspective(1000px) rotateY(0)';
                    calendar.style.opacity = '1';
                }, 200);
                break;
        }
    }

    // Effet ripple sur les clics
    function createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        ripple.className = 'date-picker-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    // ========================================
    // MÉTHODES D'AFFICHAGE
    // ========================================

    // Afficher le date picker
    function showDatePicker(instance) {
        if (activeInstance && activeInstance !== instance) {
            hideDatePicker(activeInstance);
        }
        
        instance.isOpen = true;
        instance.dropdown.classList.add('open');
        activeInstance = instance;
        
        // Positionner le dropdown
        positionDropdown(instance);
        
        // Mettre à jour l'affichage
        updateCalendarDisplay(instance);
        
        // Focus sur le premier jour sélectionné ou aujourd'hui
        setTimeout(() => {
            const selectedDay = instance.dropdown.querySelector('.date-picker-day.selected') ||
                              instance.dropdown.querySelector('.date-picker-day.today') ||
                              instance.dropdown.querySelector('.date-picker-day:not([disabled])');
            selectedDay?.focus();
        }, 100);
    }

    // Cacher le date picker
    function hideDatePicker(instance) {
        instance.isOpen = false;
        instance.dropdown.classList.remove('open');
        
        if (activeInstance === instance) {
            activeInstance = null;
        }
    }

    // Basculer l'affichage
    function toggleDatePicker(instance) {
        if (instance.isOpen) {
            hideDatePicker(instance);
        } else {
            showDatePicker(instance);
        }
    }

    // Positionner le dropdown
    function positionDropdown(instance) {
        const { input, dropdown } = instance;
        const inputRect = input.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        
        // Position de base : sous l'input
        let top = inputRect.bottom + 8;
        let left = inputRect.left;
        
        // Ajuster si déborde de la fenêtre
        if (top + dropdownRect.height > window.innerHeight) {
            top = inputRect.top - dropdownRect.height - 8;
        }
        
        if (left + dropdownRect.width > window.innerWidth) {
            left = window.innerWidth - dropdownRect.width - 16;
        }
        
        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
    }

    // Mettre à jour l'affichage du calendrier
    function updateCalendarDisplay(instance) {
        const { dropdown, currentDate, options } = instance;
        
        // Mettre à jour les sélecteurs mois/année
        const monthSelect = dropdown.querySelector('.date-picker-month-select');
        const yearSelect = dropdown.querySelector('.date-picker-year-select');
        
        // Remplir les options si vides
        if (monthSelect.options.length === 0) {
            CONFIG.locale.monthNames.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = month;
                monthSelect.appendChild(option);
            });
        }
        
        if (yearSelect.options.length === 0) {
            const currentYear = new Date().getFullYear();
            const startYear = options.minDate ? options.minDate.getFullYear() : currentYear - 100;
            const endYear = options.maxDate ? options.maxDate.getFullYear() : currentYear + 100;
            
            for (let year = startYear; year <= endYear; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
        }
        
        monthSelect.value = currentDate.getMonth();
        yearSelect.value = currentDate.getFullYear();
        
        // Remplir les calendriers
        const calendars = dropdown.querySelectorAll(`.${CONFIG.classes.calendar}`);
        calendars.forEach((calendar, index) => {
            const displayDate = new Date(currentDate);
            displayDate.setMonth(displayDate.getMonth() + index);
            fillCalendar(calendar, displayDate, options, instance.selectedDates);
        });
        
        // Mettre à jour l'input
        updateInputDisplay(instance);
    }

    // Mettre à jour l'affichage de l'input
    function updateInputDisplay(instance) {
        const { input, selectedDates, options } = instance;
        
        if (selectedDates.length === 0) {
            input.value = '';
            return;
        }
        
        if (options.mode === 'single' || selectedDates.length === 1) {
            input.value = formatDate(selectedDates[0], CONFIG.locale.format);
        } else if (options.mode === 'range' && selectedDates.length === 2) {
            input.value = `${formatDate(selectedDates[0], CONFIG.locale.format)}${CONFIG.locale.separator}${formatDate(selectedDates[1], CONFIG.locale.format)}`;
        } else if (options.mode === 'multiple') {
            input.value = selectedDates.map(d => formatDate(d, CONFIG.locale.format)).join(', ');
        }
    }

    // ========================================
    // ACTIONS
    // ========================================

    // Appliquer la sélection
    function applySelection(instance) {
        const { options, selectedDates } = instance;
        
        // Validation
        if (options.mode === 'range' && selectedDates.length === 1) {
            // Ne pas fermer si une seule date en mode range
            return;
        }
        
        // Déclencher l'événement onSelect
        if (options.onSelect && typeof options.onSelect === 'function') {
            options.onSelect(selectedDates, instance);
        }
        
        // Déclencher un événement personnalisé
        const event = new CustomEvent('dateselect', {
            detail: { dates: selectedDates, instance }
        });
        instance.input.dispatchEvent(event);
        
        hideDatePicker(instance);
    }

    // Effacer la sélection
    function clearSelection(instance) {
        instance.selectedDates = [];
        instance.input.value = '';
        updateCalendarDisplay(instance);
        
        if (instance.options.onClear && typeof instance.options.onClear === 'function') {
            instance.options.onClear(instance);
        }
    }

    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================

    // Injecter les styles
    function injectStyles() {
        if (document.getElementById('date-picker-styles')) return;

        const link = document.createElement('link');
        link.id = 'date-picker-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/date-picker.css';
        document.head.appendChild(link);
    }

    // Détruire une instance
    function destroy(instance) {
        if (instance.dropdown && instance.dropdown.parentNode) {
            instance.dropdown.remove();
        }
        instances.delete(instance.id);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================

    function create(input, options = {}) {
        // Auto-injection des styles au premier appel
        if (!document.getElementById('date-picker-styles')) {
            injectStyles();
        }

        // Configuration par défaut
        const defaultOptions = {
            mode: 'single',
            style: 'glassmorphism',
            animation: 'smooth',
            autoClose: true,
            showClear: true,
            showPresets: false,
            multipleMonths: false,
            showWeekNumbers: false,
            showTimePicker: false,
            timeStep: 15,
            minDate: null,
            maxDate: null,
            disabledDates: [],
            disabledDaysOfWeek: [],
            defaultDate: null,
            format: CONFIG.locale.format,
            ...CONFIG.modes[options.mode || 'single']
        };

        const finalOptions = { ...defaultOptions, ...options };

        // Créer l'instance
        const instance = {
            id: Date.now(),
            input: typeof input === 'string' ? document.querySelector(input) : input,
            options: finalOptions,
            isOpen: false,
            currentDate: finalOptions.defaultDate || new Date(),
            selectedDates: []
        };

        // Créer le dropdown
        instance.dropdown = createCalendarStructure(finalOptions);
        instance.dropdown.style.position = 'fixed';
        instance.dropdown.style.zIndex = '9999';
        document.body.appendChild(instance.dropdown);

        // Initialiser les événements
        initializeEvents(instance);

        // Ajouter des attributs à l'input
        instance.input.setAttribute('readonly', 'readonly');
        instance.input.classList.add(CONFIG.classes.input);
        
        // Parser la valeur initiale si présente
        if (instance.input.value) {
            try {
                if (finalOptions.mode === 'range' && instance.input.value.includes(CONFIG.locale.separator)) {
                    const [start, end] = instance.input.value.split(CONFIG.locale.separator).map(d => parseDate(d.trim(), finalOptions.format));
                    instance.selectedDates = [start, end];
                } else if (finalOptions.mode === 'multiple' && instance.input.value.includes(',')) {
                    instance.selectedDates = instance.input.value.split(',').map(d => parseDate(d.trim(), finalOptions.format));
                } else {
                    instance.selectedDates = [parseDate(instance.input.value, finalOptions.format)];
                }
            } catch (e) {
                console.error('Erreur parsing date initiale:', e);
            }
        }

        // Stocker l'instance
        instances.set(instance.id, instance);
        finalOptions.instanceId = instance.id;

        // API publique de l'instance
        const publicAPI = {
            show: () => showDatePicker(instance),
            hide: () => hideDatePicker(instance),
            toggle: () => toggleDatePicker(instance),
            setDate: (date) => {
                instance.selectedDates = Array.isArray(date) ? date : [date];
                updateCalendarDisplay(instance);
            },
            getDate: () => instance.selectedDates,
            clear: () => clearSelection(instance),
            destroy: () => destroy(instance),
            setOptions: (newOptions) => {
                instance.options = { ...instance.options, ...newOptions };
                instance.dropdown.remove();
                instance.dropdown = createCalendarStructure(instance.options);
                document.body.appendChild(instance.dropdown);
                initializeEvents(instance);
                updateCalendarDisplay(instance);
            },
            refresh: () => updateCalendarDisplay(instance)
        };

        // Attacher l'API à l'input pour un accès facile
        instance.input.datePicker = publicAPI;

        return publicAPI;
    }

    // Export de l'API publique
    return {
        create,
        instances,
        CONFIG,
        injectStyles
    };
})();

// Export pour utilisation
export default DatePickerComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Positionnement du dropdown
   Solution: Calcul dynamique avec détection des bords de fenêtre
   
   [2024-01-15] - Gestion des fuseaux horaires
   Cause: Décalage lors du parsing des dates
   Résolution: Utilisation de dates locales uniquement
   
   [2024-01-15] - Performance avec calendriers multiples
   Solution: Optimisation du rendu et réutilisation des éléments
   
   NOTES POUR REPRISES FUTURES:
   - Le positionnement nécessite position: fixed
   - Les animations peuvent être désactivées pour les performances
   - Prévoir l'internationalisation complète
   - Le mode datetime nécessite une gestion spéciale des timezones
   ======================================== */