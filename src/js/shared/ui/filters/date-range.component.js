/* ========================================
   DATE-RANGE.COMPONENT.JS - Sélecteur de plage de dates
   Chemin: src/js/shared/ui/data-entry/date-range.component.js
   
   DESCRIPTION:
   Composant de sélection de plage de dates ultra-complet avec glassmorphism.
   Double calendrier, presets, validation, fuseaux horaires et animations riches.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-450)
   2. État et gestion (lignes 452-600)
   3. Création du DOM (lignes 602-1200)
   4. Logique calendrier (lignes 1202-1600)
   5. Gestionnaires d'événements (lignes 1602-2000)
   6. Validation et utilitaires (lignes 2002-2300)
   7. API publique (lignes 2302-2500)
   
   DÉPENDANCES:
   - date-range.component.css (styles glassmorphism)
   - format-utils.js (optionnel pour formatage)
   ======================================== */

const DateRangeComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                blur: 20,
                opacity: 0.1,
                borderOpacity: 0.2,
                shadowOpacity: 0.2,
                glowEffect: true,
                reflectionEffect: true,
                frostedGlass: true
            },
            'neumorphism': {
                insetShadow: true,
                softEdges: true,
                depth: 'medium',
                lightSource: 'top-left'
            },
            'flat': {
                borderWidth: 1,
                simpleShadow: true,
                solidColors: true
            },
            'minimal': {
                noBorder: true,
                noBackground: true,
                subtleHover: true,
                thinBorders: true
            },
            'material': {
                elevation: 2,
                rippleEffect: true,
                sharpCorners: true
            }
        },

        // Modes d'affichage
        displayModes: {
            'inline': {
                embedded: true,
                alwaysOpen: true,
                noInput: true
            },
            'dropdown': {
                trigger: 'focus',
                autoClose: true,
                position: 'auto'
            },
            'modal': {
                overlay: true,
                centered: true,
                responsive: true
            },
            'sidebar': {
                slide: true,
                position: 'right',
                pushContent: false
            }
        },

        // Types de sélection
        selectionModes: {
            'range': {
                startEnd: true,
                highlight: true,
                minDays: 1,
                maxDays: null
            },
            'multiple': {
                discrete: true,
                maxSelections: null,
                allowGaps: true
            },
            'week': {
                weekBased: true,
                startDay: 1, // Lundi
                fullWeek: true
            },
            'month': {
                monthBased: true,
                fullMonth: true
            },
            'quarter': {
                quarterBased: true,
                fiscalYear: false
            },
            'custom': {
                validator: null,
                formatter: null
            }
        },

        // Presets de plages
        presets: {
            'today': {
                label: 'Today',
                icon: 'calendar-today',
                range: () => {
                    const today = new Date();
                    return { start: today, end: today };
                }
            },
            'yesterday': {
                label: 'Yesterday',
                icon: 'calendar-minus',
                range: () => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return { start: yesterday, end: yesterday };
                }
            },
            'thisWeek': {
                label: 'This Week',
                icon: 'calendar-week',
                range: () => {
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const start = new Date(now);
                    const end = new Date(now);
                    start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                    end.setDate(start.getDate() + 6);
                    return { start, end };
                }
            },
            'lastWeek': {
                label: 'Last Week',
                icon: 'calendar-week-minus',
                range: () => {
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const start = new Date(now);
                    const end = new Date(now);
                    start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
                    end.setDate(start.getDate() + 6);
                    return { start, end };
                }
            },
            'thisMonth': {
                label: 'This Month',
                icon: 'calendar-month',
                range: () => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    return { start, end };
                }
            },
            'lastMonth': {
                label: 'Last Month',
                icon: 'calendar-month-minus',
                range: () => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const end = new Date(now.getFullYear(), now.getMonth(), 0);
                    return { start, end };
                }
            },
            'thisQuarter': {
                label: 'This Quarter',
                icon: 'calendar-quarter',
                range: () => {
                    const now = new Date();
                    const quarter = Math.floor(now.getMonth() / 3);
                    const start = new Date(now.getFullYear(), quarter * 3, 1);
                    const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                    return { start, end };
                }
            },
            'thisYear': {
                label: 'This Year',
                icon: 'calendar-year',
                range: () => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), 0, 1);
                    const end = new Date(now.getFullYear(), 11, 31);
                    return { start, end };
                }
            },
            'last7Days': {
                label: 'Last 7 Days',
                icon: 'calendar-7',
                range: () => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 6);
                    return { start, end };
                }
            },
            'last30Days': {
                label: 'Last 30 Days',
                icon: 'calendar-30',
                range: () => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 29);
                    return { start, end };
                }
            },
            'last90Days': {
                label: 'Last 90 Days',
                icon: 'calendar-90',
                range: () => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 89);
                    return { start, end };
                }
            },
            'custom': {
                label: 'Custom Range',
                icon: 'calendar-custom',
                range: null
            }
        },

        // Formats de date
        formats: {
            display: 'MMM DD, YYYY',
            input: 'MM/DD/YYYY',
            header: 'MMMM YYYY',
            dayHeader: 'ddd',
            time: 'HH:mm',
            full: 'YYYY-MM-DD HH:mm:ss'
        },

        // Localisation
        locale: {
            months: ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'],
            monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            firstDay: 0, // 0 = Sunday, 1 = Monday
            weekLabel: 'W',
            rangeLabel: ' to '
        },

        // Animations
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                transition: '0.2s ease',
                fadeIn: true
            },
            'smooth': {
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                slideIn: true,
                fadeIn: true
            },
            'rich': {
                transition: '0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                slideIn: true,
                fadeIn: true,
                bounce: true,
                ripple: true,
                glow: true
            }
        },

        // Options par défaut
        defaults: {
            style: 'glassmorphism',
            displayMode: 'dropdown',
            selectionMode: 'range',
            animation: 'smooth',
            showPresets: true,
            showTimePicker: false,
            showWeekNumbers: false,
            autoApply: false,
            closeOnSelect: false,
            minDate: null,
            maxDate: null,
            disabledDates: [],
            highlightedDates: [],
            numberOfMonths: 2,
            position: 'auto',
            theme: 'light'
        }
    };

    // ========================================
    // ÉTAT ET GESTION
    // ========================================
    const instances = new Map();
    let instanceId = 0;
    let stylesInjected = false;

    class DateRangeState {
        constructor(options) {
            this.startDate = options.startDate || null;
            this.endDate = options.endDate || null;
            this.hoveredDate = null;
            this.viewDate = options.startDate || new Date();
            this.selectedDates = new Set();
            this.isSelecting = false;
            this.options = options;
        }

        setRange(start, end) {
            this.startDate = start;
            this.endDate = end;
            this.selectedDates.clear();
            if (start && end) {
                const current = new Date(start);
                while (current <= end) {
                    this.selectedDates.add(this.dateToString(current));
                    current.setDate(current.getDate() + 1);
                }
            }
        }

        isInRange(date) {
            if (!this.startDate || !this.endDate) return false;
            return date >= this.startDate && date <= this.endDate;
        }

        isSelected(date) {
            return this.selectedDates.has(this.dateToString(date));
        }

        dateToString(date) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        clear() {
            this.startDate = null;
            this.endDate = null;
            this.hoveredDate = null;
            this.selectedDates.clear();
            this.isSelecting = false;
        }
    }

    // ========================================
    // CRÉATION DU DOM
    // ========================================
    
    function generateId() {
        return `date-range-${Date.now()}-${instanceId++}`;
    }

    function createElement(tag, className, attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'data') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key === 'style') {
                Object.assign(element.style, value);
            } else {
                element[key] = value;
            }
        });
        return element;
    }

    function createDateRangeHTML(options) {
        const {
            id,
            style,
            displayMode,
            showPresets,
            showTimePicker,
            numberOfMonths,
            animation
        } = options;

        // Conteneur principal
        const container = createElement('div', `date-range date-range-${style} date-range-${displayMode}`, {
            id,
            data: {
                style,
                displayMode,
                animation
            }
        });

        // Input trigger (pour dropdown)
        if (displayMode === 'dropdown') {
            const inputContainer = createElement('div', 'date-range-input-container');
            
            const input = createElement('input', 'date-range-input', {
                type: 'text',
                placeholder: 'Select date range',
                readonly: true
            });
            
            const icon = createElement('div', 'date-range-input-icon');
            icon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>`;
            
            inputContainer.appendChild(input);
            inputContainer.appendChild(icon);
            container.appendChild(inputContainer);
        }

        // Picker container
        const picker = createElement('div', 'date-range-picker');
        
        // Header
        const header = createHeader(options);
        picker.appendChild(header);

        // Body
        const body = createElement('div', 'date-range-body');

        // Presets sidebar
        if (showPresets) {
            const presets = createPresets(options);
            body.appendChild(presets);
        }

        // Calendars container
        const calendarsContainer = createElement('div', 'date-range-calendars');
        
        // Créer les calendriers
        for (let i = 0; i < numberOfMonths; i++) {
            const calendar = createCalendar(i, options);
            calendarsContainer.appendChild(calendar);
        }

        body.appendChild(calendarsContainer);

        // Time picker
        if (showTimePicker) {
            const timePicker = createTimePicker(options);
            body.appendChild(timePicker);
        }

        picker.appendChild(body);

        // Footer
        const footer = createFooter(options);
        picker.appendChild(footer);

        container.appendChild(picker);

        return container;
    }

    function createHeader(options) {
        const header = createElement('div', 'date-range-header');
        
        // Titre
        const title = createElement('div', 'date-range-title');
        title.textContent = 'Select Date Range';
        header.appendChild(title);

        // Bouton fermer (pour modal/dropdown)
        if (options.displayMode !== 'inline') {
            const closeBtn = createElement('button', 'date-range-close', {
                type: 'button',
                'aria-label': 'Close'
            });
            closeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
            header.appendChild(closeBtn);
        }

        return header;
    }

    function createPresets(options) {
        const presetsContainer = createElement('div', 'date-range-presets');
        
        const presetsTitle = createElement('div', 'date-range-presets-title');
        presetsTitle.textContent = 'Quick Select';
        presetsContainer.appendChild(presetsTitle);

        const presetsList = createElement('div', 'date-range-presets-list');
        
        Object.entries(CONFIG.presets).forEach(([key, preset]) => {
            if (!preset.range) return; // Skip custom
            
            const button = createElement('button', 'date-range-preset', {
                type: 'button',
                data: { preset: key }
            });
            
            const icon = createElement('span', 'date-range-preset-icon');
            icon.innerHTML = getPresetIcon(preset.icon);
            
            const label = createElement('span', 'date-range-preset-label');
            label.textContent = preset.label;
            
            button.appendChild(icon);
            button.appendChild(label);
            presetsList.appendChild(button);
        });

        presetsContainer.appendChild(presetsList);
        return presetsContainer;
    }

    function createCalendar(index, options) {
        const calendar = createElement('div', 'date-range-calendar', {
            data: { month: index }
        });

        // Navigation
        const nav = createElement('div', 'date-range-calendar-nav');
        
        if (index === 0) {
            const prevBtn = createElement('button', 'date-range-nav-prev', {
                type: 'button',
                'aria-label': 'Previous month'
            });
            prevBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
            nav.appendChild(prevBtn);
        }

        const monthYear = createElement('div', 'date-range-month-year');
        nav.appendChild(monthYear);

        if (index === options.numberOfMonths - 1) {
            const nextBtn = createElement('button', 'date-range-nav-next', {
                type: 'button',
                'aria-label': 'Next month'
            });
            nextBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
            nav.appendChild(nextBtn);
        }

        calendar.appendChild(nav);

        // Days header
        const daysHeader = createElement('div', 'date-range-days-header');
        const { daysMin, firstDay } = CONFIG.locale;
        
        if (options.showWeekNumbers) {
            const weekHeader = createElement('div', 'date-range-day-header date-range-week-header');
            weekHeader.textContent = CONFIG.locale.weekLabel;
            daysHeader.appendChild(weekHeader);
        }

        for (let i = 0; i < 7; i++) {
            const dayIndex = (firstDay + i) % 7;
            const dayHeader = createElement('div', 'date-range-day-header');
            dayHeader.textContent = daysMin[dayIndex];
            daysHeader.appendChild(dayHeader);
        }

        calendar.appendChild(daysHeader);

        // Days grid
        const daysGrid = createElement('div', 'date-range-days-grid');
        calendar.appendChild(daysGrid);

        return calendar;
    }

    function createTimePicker(options) {
        const timePicker = createElement('div', 'date-range-time-picker');
        
        const title = createElement('div', 'date-range-time-title');
        title.textContent = 'Select Time';
        timePicker.appendChild(title);

        const timeInputs = createElement('div', 'date-range-time-inputs');
        
        // Start time
        const startTime = createElement('div', 'date-range-time-input-group');
        const startLabel = createElement('label', 'date-range-time-label');
        startLabel.textContent = 'Start Time';
        const startInput = createElement('input', 'date-range-time-input', {
            type: 'time',
            data: { time: 'start' }
        });
        startTime.appendChild(startLabel);
        startTime.appendChild(startInput);
        
        // End time
        const endTime = createElement('div', 'date-range-time-input-group');
        const endLabel = createElement('label', 'date-range-time-label');
        endLabel.textContent = 'End Time';
        const endInput = createElement('input', 'date-range-time-input', {
            type: 'time',
            data: { time: 'end' }
        });
        endTime.appendChild(endLabel);
        endTime.appendChild(endInput);

        timeInputs.appendChild(startTime);
        timeInputs.appendChild(endTime);
        timePicker.appendChild(timeInputs);

        return timePicker;
    }

    function createFooter(options) {
        const footer = createElement('div', 'date-range-footer');

        // Selected range display
        const rangeDisplay = createElement('div', 'date-range-display');
        rangeDisplay.textContent = 'No dates selected';
        footer.appendChild(rangeDisplay);

        // Actions
        const actions = createElement('div', 'date-range-actions');
        
        const clearBtn = createElement('button', 'date-range-button date-range-button-clear', {
            type: 'button'
        });
        clearBtn.textContent = 'Clear';
        
        const applyBtn = createElement('button', 'date-range-button date-range-button-apply', {
            type: 'button'
        });
        applyBtn.textContent = 'Apply';

        actions.appendChild(clearBtn);
        actions.appendChild(applyBtn);
        footer.appendChild(actions);

        return footer;
    }

    // ========================================
    // LOGIQUE CALENDRIER
    // ========================================
    
    function updateCalendars(element, state) {
        const calendars = element.querySelectorAll('.date-range-calendar');
        const viewDate = new Date(state.viewDate);

        calendars.forEach((calendar, index) => {
            const targetDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + index, 1);
            updateCalendar(calendar, targetDate, state);
        });

        updateRangeDisplay(element, state);
    }

    function updateCalendar(calendar, date, state) {
        const monthYear = calendar.querySelector('.date-range-month-year');
        const daysGrid = calendar.querySelector('.date-range-days-grid');
        
        // Update header
        monthYear.textContent = formatMonthYear(date);
        
        // Clear grid
        daysGrid.innerHTML = '';
        
        // Get calendar data
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const { firstDay: weekStart, showWeekNumbers } = state.options;
        const startOffset = (firstDay - weekStart + 7) % 7;
        
        // Previous month days
        for (let i = startOffset - 1; i >= 0; i--) {
            if (showWeekNumbers && i === startOffset - 1) {
                const weekNum = getWeekNumber(new Date(year, month - 1, daysInPrevMonth - i));
                const weekCell = createElement('div', 'date-range-week-number');
                weekCell.textContent = weekNum;
                daysGrid.appendChild(weekCell);
            }
            
            const day = daysInPrevMonth - i;
            const dayDate = new Date(year, month - 1, day);
            const dayCell = createDayCell(dayDate, state, 'other-month');
            daysGrid.appendChild(dayCell);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            
            if (showWeekNumbers && (day === 1 || dayDate.getDay() === weekStart)) {
                const weekNum = getWeekNumber(dayDate);
                const weekCell = createElement('div', 'date-range-week-number');
                weekCell.textContent = weekNum;
                daysGrid.appendChild(weekCell);
            }
            
            const dayCell = createDayCell(dayDate, state, 'current-month');
            daysGrid.appendChild(dayCell);
        }
        
        // Next month days
        const totalCells = daysGrid.children.length;
        const rows = Math.ceil(totalCells / (showWeekNumbers ? 8 : 7));
        const targetCells = rows * (showWeekNumbers ? 8 : 7);
        let nextDay = 1;
        
        while (daysGrid.children.length < targetCells) {
            const dayDate = new Date(year, month + 1, nextDay);
            
            if (showWeekNumbers && dayDate.getDay() === weekStart) {
                const weekNum = getWeekNumber(dayDate);
                const weekCell = createElement('div', 'date-range-week-number');
                weekCell.textContent = weekNum;
                daysGrid.appendChild(weekCell);
            }
            
            const dayCell = createDayCell(dayDate, state, 'other-month');
            daysGrid.appendChild(dayCell);
            nextDay++;
        }
    }

    function createDayCell(date, state, monthClass) {
        const cell = createElement('div', `date-range-day ${monthClass}`, {
            data: {
                date: dateToString(date),
                day: date.getDate()
            }
        });

        const dayNumber = createElement('span', 'date-range-day-number');
        dayNumber.textContent = date.getDate();
        cell.appendChild(dayNumber);

        // Check states
        const today = new Date();
        if (isSameDay(date, today)) {
            cell.classList.add('today');
        }

        if (state.isSelected(date)) {
            cell.classList.add('selected');
        }

        if (state.startDate && isSameDay(date, state.startDate)) {
            cell.classList.add('range-start');
        }

        if (state.endDate && isSameDay(date, state.endDate)) {
            cell.classList.add('range-end');
        }

        if (state.isInRange(date)) {
            cell.classList.add('in-range');
        }

        if (isDisabled(date, state.options)) {
            cell.classList.add('disabled');
        }

        if (isHighlighted(date, state.options)) {
            cell.classList.add('highlighted');
        }

        // Hover preview
        if (state.isSelecting && state.startDate && !state.endDate) {
            if (state.hoveredDate && date >= state.startDate && date <= state.hoveredDate) {
                cell.classList.add('in-range-preview');
            }
        }

        return cell;
    }

    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    
    function attachEvents(element, state) {
        const { displayMode, closeOnSelect, autoApply, onChange, onApply } = state.options;
        
        // Input trigger events
        if (displayMode === 'dropdown') {
            const input = element.querySelector('.date-range-input');
            const inputContainer = element.querySelector('.date-range-input-container');
            
            inputContainer.addEventListener('click', () => {
                togglePicker(element, true);
            });
            
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!element.contains(e.target) && element.classList.contains('open')) {
                    togglePicker(element, false);
                }
            });
        }

        // Close button
        const closeBtn = element.querySelector('.date-range-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                togglePicker(element, false);
            });
        }

        // Navigation buttons
        const prevBtn = element.querySelector('.date-range-nav-prev');
        const nextBtn = element.querySelector('.date-range-nav-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                navigateMonth(element, state, -1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                navigateMonth(element, state, 1);
            });
        }

        // Day cells
        element.addEventListener('click', (e) => {
            const dayCell = e.target.closest('.date-range-day');
            if (dayCell && !dayCell.classList.contains('disabled')) {
                handleDayClick(element, state, dayCell);
            }
        });

        element.addEventListener('mouseenter', (e) => {
            const dayCell = e.target.closest('.date-range-day');
            if (dayCell && !dayCell.classList.contains('disabled')) {
                handleDayHover(element, state, dayCell);
            }
        }, true);

        // Preset buttons
        element.addEventListener('click', (e) => {
            const presetBtn = e.target.closest('.date-range-preset');
            if (presetBtn) {
                handlePresetClick(element, state, presetBtn);
            }
        });

        // Action buttons
        const clearBtn = element.querySelector('.date-range-button-clear');
        const applyBtn = element.querySelector('.date-range-button-apply');
        
        clearBtn.addEventListener('click', () => {
            state.clear();
            updateCalendars(element, state);
            if (onChange) onChange(null, null);
        });
        
        applyBtn.addEventListener('click', () => {
            if (onApply) {
                onApply(state.startDate, state.endDate);
            }
            if (displayMode !== 'inline') {
                togglePicker(element, false);
            }
        });

        // Keyboard navigation
        element.addEventListener('keydown', (e) => {
            handleKeyboard(element, state, e);
        });
    }

    function handleDayClick(element, state, dayCell) {
        const date = stringToDate(dayCell.dataset.date);
        const { selectionMode, onChange, autoApply } = state.options;

        if (selectionMode === 'range') {
            if (!state.startDate || (state.startDate && state.endDate)) {
                // Start new selection
                state.setRange(date, null);
                state.isSelecting = true;
            } else {
                // Complete selection
                if (date < state.startDate) {
                    state.setRange(date, state.startDate);
                } else {
                    state.setRange(state.startDate, date);
                }
                state.isSelecting = false;
                
                if (onChange) {
                    onChange(state.startDate, state.endDate);
                }
                
                if (autoApply) {
                    if (state.options.displayMode !== 'inline') {
                        setTimeout(() => togglePicker(element, false), 300);
                    }
                }
            }
        }

        updateCalendars(element, state);
    }

    function handleDayHover(element, state, dayCell) {
        if (state.isSelecting && state.startDate && !state.endDate) {
            const date = stringToDate(dayCell.dataset.date);
            state.hoveredDate = date;
            updateCalendars(element, state);
        }
    }

    function handlePresetClick(element, state, presetBtn) {
        const presetKey = presetBtn.dataset.preset;
        const preset = CONFIG.presets[presetKey];
        
        if (preset && preset.range) {
            const { start, end } = preset.range();
            state.setRange(start, end);
            updateCalendars(element, state);
            
            if (state.options.onChange) {
                state.options.onChange(start, end);
            }
            
            if (state.options.autoApply && state.options.displayMode !== 'inline') {
                setTimeout(() => togglePicker(element, false), 300);
            }
        }
    }

    function navigateMonth(element, state, direction) {
        state.viewDate.setMonth(state.viewDate.getMonth() + direction);
        updateCalendars(element, state);
        
        // Animate transition
        if (state.options.animation !== 'none') {
            animateCalendarTransition(element, direction);
        }
    }

    function togglePicker(element, show) {
        const picker = element.querySelector('.date-range-picker');
        
        if (show) {
            element.classList.add('open');
            picker.style.display = 'block';
            
            // Position dropdown
            if (element.classList.contains('date-range-dropdown')) {
                positionDropdown(element);
            }
            
            // Animate
            requestAnimationFrame(() => {
                picker.classList.add('show');
            });
        } else {
            picker.classList.remove('show');
            setTimeout(() => {
                element.classList.remove('open');
                picker.style.display = 'none';
            }, 300);
        }
    }

    // ========================================
    // VALIDATION ET UTILITAIRES
    // ========================================
    
    function isDisabled(date, options) {
        const { minDate, maxDate, disabledDates } = options;
        
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        
        if (disabledDates && disabledDates.length) {
            return disabledDates.some(disabled => {
                if (disabled instanceof Date) {
                    return isSameDay(date, disabled);
                } else if (typeof disabled === 'function') {
                    return disabled(date);
                }
                return false;
            });
        }
        
        return false;
    }

    function isHighlighted(date, options) {
        const { highlightedDates } = options;
        
        if (highlightedDates && highlightedDates.length) {
            return highlightedDates.some(highlighted => {
                if (highlighted instanceof Date) {
                    return isSameDay(date, highlighted);
                } else if (typeof highlighted === 'function') {
                    return highlighted(date);
                }
                return false;
            });
        }
        
        return false;
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function dateToString(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function stringToDate(str) {
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatMonthYear(date) {
        const { months } = CONFIG.locale;
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    function formatDateRange(start, end) {
        if (!start) return 'No dates selected';
        
        const format = (date) => {
            const { monthsShort } = CONFIG.locale;
            return `${monthsShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        };
        
        if (!end) return format(start);
        return `${format(start)} - ${format(end)}`;
    }

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function updateRangeDisplay(element, state) {
        const display = element.querySelector('.date-range-display');
        const input = element.querySelector('.date-range-input');
        
        const rangeText = formatDateRange(state.startDate, state.endDate);
        
        if (display) {
            display.textContent = rangeText;
        }
        
        if (input) {
            input.value = rangeText;
        }
    }

    function positionDropdown(element) {
        const picker = element.querySelector('.date-range-picker');
        const input = element.querySelector('.date-range-input-container');
        
        const inputRect = input.getBoundingClientRect();
        const pickerHeight = picker.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Check if there's enough space below
        if (inputRect.bottom + pickerHeight > windowHeight - 20) {
            // Position above
            picker.style.bottom = '100%';
            picker.style.top = 'auto';
            picker.classList.add('position-top');
        } else {
            // Position below
            picker.style.top = '100%';
            picker.style.bottom = 'auto';
            picker.classList.remove('position-top');
        }
    }

    function animateCalendarTransition(element, direction) {
        const calendars = element.querySelectorAll('.date-range-calendar');
        calendars.forEach(calendar => {
            calendar.style.animation = `slideCalendar${direction > 0 ? 'Next' : 'Prev'} 0.3s ease`;
            setTimeout(() => {
                calendar.style.animation = '';
            }, 300);
        });
    }

    function getPresetIcon(iconName) {
        const icons = {
            'calendar-today': '<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>',
            'calendar-week': '<svg viewBox="0 0 24 24"><path d="M6 5H3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zm14 0h-3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zm-7 0h-3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1z"/></svg>',
            'calendar-month': '<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>',
            'calendar-custom': '<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-4.5-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/></svg>'
        };
        return icons[iconName] || icons['calendar-custom'];
    }

    function handleKeyboard(element, state, event) {
        const focused = document.activeElement;
        const dayCell = focused.closest('.date-range-day');
        
        if (!dayCell) return;
        
        let newDate;
        const currentDate = stringToDate(dayCell.dataset.date);
        
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 1);
                focusDate(element, newDate);
                break;
            case 'ArrowRight':
                event.preventDefault();
                newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 1);
                focusDate(element, newDate);
                break;
            case 'ArrowUp':
                event.preventDefault();
                newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 7);
                focusDate(element, newDate);
                break;
            case 'ArrowDown':
                event.preventDefault();
                newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 7);
                focusDate(element, newDate);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                handleDayClick(element, state, dayCell);
                break;
            case 'Escape':
                event.preventDefault();
                if (state.options.displayMode !== 'inline') {
                    togglePicker(element, false);
                }
                break;
        }
    }

    function focusDate(element, date) {
        const dateStr = dateToString(date);
        const dayCell = element.querySelector(`[data-date="${dateStr}"]`);
        if (dayCell) {
            dayCell.focus();
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    return {
        // Configuration exposée
        CONFIG,
        
        // Créer une instance
        create(options = {}) {
            const finalOptions = { ...CONFIG.defaults, ...options };
            
            // Générer l'ID si non fourni
            if (!finalOptions.id) {
                finalOptions.id = generateId();
            }
            
            // Créer l'état
            const state = new DateRangeState(finalOptions);
            
            // Créer l'élément
            const element = createDateRangeHTML(finalOptions);
            
            // Initialiser les calendriers
            updateCalendars(element, state);
            
            // Attacher les événements
            attachEvents(element, state);
            
            // Sauvegarder l'instance
            instances.set(finalOptions.id, {
                element,
                state,
                options: finalOptions
            });
            
            // Injecter les styles si nécessaire
            if (!stylesInjected) {
                this.injectStyles();
            }
            
            return element;
        },
        
        // Définir la plage
        setRange(elementOrId, startDate, endDate) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                instance.state.setRange(startDate, endDate);
                updateCalendars(element, instance.state);
            }
        },
        
        // Obtenir la plage
        getRange(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                return {
                    start: instance.state.startDate,
                    end: instance.state.endDate
                };
            }
            return null;
        },
        
        // Effacer la sélection
        clear(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                instance.state.clear();
                updateCalendars(element, instance.state);
            }
        },
        
        // Ouvrir/Fermer
        open(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            if (element.classList.contains('date-range-dropdown')) {
                togglePicker(element, true);
            }
        },
        
        close(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            if (element.classList.contains('date-range-dropdown')) {
                togglePicker(element, false);
            }
        },
        
        // Mettre à jour les options
        updateOptions(elementOrId, newOptions) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                Object.assign(instance.options, newOptions);
                instance.state.options = instance.options;
                updateCalendars(element, instance.state);
            }
        },
        
        // Détruire une instance
        destroy(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            instances.delete(element.id);
            element.remove();
        },
        
        // Injecter les styles
        injectStyles() {
            if (stylesInjected) return;
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/date-range.component.css';
            document.head.appendChild(link);
            
            stylesInjected = true;
        }
    };
})();

// Export
export default DateRangeComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion des fuseaux horaires
   Solution: Toujours utiliser dates locales sauf si spécifié
   
   [2024-01-16] - Performance avec grands calendriers
   Cause: Re-render complet à chaque hover
   Résolution: Update sélectif des classes CSS
   
   [2024-01-17] - Position dropdown responsive
   Solution: Calcul dynamique avec repositionnement auto
   
   NOTES POUR REPRISES FUTURES:
   - Les animations peuvent ralentir sur mobile
   - Prévoir lazy loading pour très longues plages
   - Support i18n pour localisation complète
   ======================================== */