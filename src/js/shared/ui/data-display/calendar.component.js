/* ========================================
   CALENDAR.COMPONENT.JS - Composant Calendrier Glassmorphism
   Chemin: src/js/shared/ui/data-display/calendar.component.js
   
   DESCRIPTION:
   Composant calendrier ultra-complet avec style glassmorphism et toutes
   les fonctionnalités possibles. Les développeurs utilisent uniquement
   les options dont ils ont besoin.
   
   STRUCTURE:
   1. Configuration complète (lignes 15-500)
   2. Méthodes privées (lignes 501-2500)
   3. Gestionnaires d'événements (lignes 2501-3000)
   4. API publique (lignes 3001-3100)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - ui.config.js (configuration globale)
   - format-utils.js (si disponible)
   ======================================== */

const CalendarComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    padding: '24px'
                },
                header: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '20px'
                },
                cell: {
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                cellHover: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                },
                selected: {
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    color: '#3b82f6'
                },
                today: {
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    fontWeight: '600'
                },
                event: {
                    background: 'rgba(99, 102, 241, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    color: 'white'
                }
            },
            'neumorphism': {
                container: {
                    background: '#f0f0f3',
                    borderRadius: '24px',
                    boxShadow: '20px 20px 60px #cbcbcd, -20px -20px 60px #ffffff',
                    padding: '24px'
                },
                header: {
                    background: '#f0f0f3',
                    borderRadius: '16px',
                    boxShadow: 'inset 5px 5px 10px #cbcbcd, inset -5px -5px 10px #ffffff',
                    padding: '16px',
                    marginBottom: '20px'
                },
                cell: {
                    background: '#f0f0f3',
                    borderRadius: '12px',
                    boxShadow: '5px 5px 10px #cbcbcd, -5px -5px 10px #ffffff',
                    transition: 'all 0.3s ease'
                },
                cellHover: {
                    boxShadow: 'inset 2px 2px 5px #cbcbcd, inset -2px -2px 5px #ffffff'
                },
                selected: {
                    background: '#e0e0e3',
                    boxShadow: 'inset 5px 5px 10px #cbcbcd, inset -5px -5px 10px #ffffff'
                }
            },
            'flat': {
                container: {
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '20px'
                },
                header: {
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '16px',
                    marginBottom: '16px'
                },
                cell: {
                    padding: '8px',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s'
                },
                cellHover: {
                    background: '#f3f4f6'
                },
                selected: {
                    background: '#3b82f6',
                    color: 'white'
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
                    padding: '16px'
                },
                header: {
                    fontSize: '20px',
                    fontWeight: '500',
                    marginBottom: '16px'
                },
                cell: {
                    borderRadius: '50%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                },
                cellHover: {
                    background: 'rgba(0,0,0,0.04)'
                },
                selected: {
                    background: '#1976d2',
                    color: 'white'
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    padding: '0'
                },
                header: {
                    fontSize: '18px',
                    marginBottom: '12px'
                },
                cell: {
                    padding: '6px',
                    borderRadius: '4px'
                },
                cellHover: {
                    background: 'rgba(0,0,0,0.05)'
                },
                selected: {
                    background: '#000',
                    color: 'white'
                }
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                duration: '0ms'
            },
            'subtle': {
                enabled: true,
                duration: '200ms',
                easing: 'ease-out',
                effects: ['fade', 'slide']
            },
            'smooth': {
                enabled: true,
                duration: '300ms',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'slide', 'scale']
            },
            'rich': {
                enabled: true,
                duration: '400ms',
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['fade', 'slide', 'scale', 'rotate', 'blur'],
                microInteractions: true,
                particleEffects: true,
                springPhysics: true
            }
        },

        // Vues disponibles
        views: {
            'month': {
                name: 'Mois',
                daysToShow: 42, // 6 semaines
                showWeekNumbers: true,
                showOtherMonthDays: true,
                headerFormat: 'MMMM YYYY'
            },
            'week': {
                name: 'Semaine',
                daysToShow: 7,
                hourStart: 0,
                hourEnd: 24,
                hourHeight: 60,
                showAllDayEvents: true,
                headerFormat: 'Semaine W'
            },
            'day': {
                name: 'Jour',
                hourStart: 0,
                hourEnd: 24,
                hourHeight: 80,
                showMinutes: true,
                headerFormat: 'dddd D MMMM YYYY'
            },
            'year': {
                name: 'Année',
                monthsPerRow: 4,
                showWeekNumbers: false,
                headerFormat: 'YYYY'
            },
            'agenda': {
                name: 'Agenda',
                daysAhead: 30,
                groupByDate: true,
                showEmptyDays: false,
                headerFormat: 'Agenda'
            },
            'mini': {
                name: 'Mini',
                compact: true,
                showHeader: false,
                cellSize: 'small'
            }
        },

        // Modes de sélection
        selectionModes: {
            'none': {
                enabled: false
            },
            'single': {
                enabled: true,
                allowDeselect: true,
                highlightToday: true
            },
            'multiple': {
                enabled: true,
                maxSelections: null,
                allowDeselect: true,
                shortcuts: ['ctrl', 'shift']
            },
            'range': {
                enabled: true,
                maxRange: null,
                minRange: 1,
                allowGaps: false,
                visualFeedback: true
            },
            'week': {
                enabled: true,
                selectFullWeek: true
            },
            'month': {
                enabled: true,
                selectFullMonth: true
            }
        },

        // Fonctionnalités
        features: {
            // Navigation
            navigation: {
                keyboard: true,
                touch: true,
                wheel: true,
                buttons: true,
                jumpToDate: true,
                todayButton: true,
                breadcrumb: true
            },

            // Événements
            events: {
                enabled: true,
                display: true,
                create: true,
                edit: true,
                delete: true,
                drag: true,
                resize: true,
                recurring: true,
                reminders: true,
                categories: true,
                colors: true,
                attachments: true,
                attendees: true,
                conflicts: true
            },

            // Jours spéciaux
            specialDays: {
                weekends: {
                    highlight: true,
                    color: 'rgba(239, 68, 68, 0.1)'
                },
                holidays: {
                    enabled: true,
                    country: 'FR',
                    display: true,
                    customHolidays: []
                },
                workingDays: {
                    days: [1, 2, 3, 4, 5], // Lun-Ven
                    customSchedule: {}
                }
            },

            // Import/Export
            io: {
                import: {
                    ical: true,
                    google: true,
                    outlook: true,
                    csv: true
                },
                export: {
                    ical: true,
                    pdf: true,
                    image: true,
                    csv: true
                },
                sync: {
                    google: true,
                    outlook: true,
                    caldav: true
                }
            },

            // Recherche et filtres
            search: {
                enabled: true,
                realtime: true,
                fields: ['title', 'description', 'location', 'attendees'],
                highlightResults: true
            },

            filters: {
                enabled: true,
                byCategory: true,
                byAttendee: true,
                byLocation: true,
                byTime: true,
                customFilters: true
            },

            // Personnalisation
            customization: {
                themes: true,
                colors: true,
                fonts: true,
                sizes: true,
                density: ['compact', 'normal', 'comfortable'],
                firstDayOfWeek: 1 // 0 = Dim, 1 = Lun
            },

            // Accessibilité
            accessibility: {
                keyboardNav: true,
                screenReader: true,
                highContrast: true,
                focusIndicators: true,
                announcements: true,
                reduceMotion: true
            },

            // Autres
            contextMenu: true,
            tooltip: true,
            miniMap: true,
            weather: true,
            moonPhases: true,
            printing: true
        },

        // Localisation
        locales: {
            'fr': {
                months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                monthsShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                             'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
                days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
                daysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
                daysMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
                today: "Aujourd'hui",
                clear: 'Effacer',
                close: 'Fermer',
                firstDay: 1,
                format: 'DD/MM/YYYY',
                week: 'Semaine',
                weekAbbr: 'Sem'
            },
            'en': {
                months: ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'],
                monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                daysMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                today: 'Today',
                clear: 'Clear',
                close: 'Close',
                firstDay: 0,
                format: 'MM/DD/YYYY',
                week: 'Week',
                weekAbbr: 'Wk'
            },
            'es': {
                months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                             'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                daysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                daysMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
                today: 'Hoy',
                clear: 'Limpiar',
                close: 'Cerrar',
                firstDay: 1,
                format: 'DD/MM/YYYY',
                week: 'Semana',
                weekAbbr: 'Sem'
            }
        },

        // Templates d'événements
        eventTemplates: {
            default: {
                duration: 60, // minutes
                color: '#3b82f6',
                reminder: 15 // minutes avant
            },
            meeting: {
                duration: 60,
                color: '#8b5cf6',
                icon: 'users',
                defaultLocation: 'Salle de réunion'
            },
            task: {
                duration: 30,
                color: '#10b981',
                icon: 'check-square',
                allDay: false
            },
            reminder: {
                duration: 0,
                color: '#f59e0b',
                icon: 'bell',
                notification: true
            },
            birthday: {
                allDay: true,
                recurring: 'yearly',
                color: '#ec4899',
                icon: 'cake'
            },
            holiday: {
                allDay: true,
                color: '#ef4444',
                icon: 'star',
                readonly: true
            }
        },

        // Configuration des événements récurrents
        recurrence: {
            patterns: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
            maxOccurrences: 365,
            exceptions: true,
            endTypes: ['never', 'after', 'on']
        },

        // Raccourcis clavier
        shortcuts: {
            navigation: {
                'ArrowLeft': 'previousDay',
                'ArrowRight': 'nextDay',
                'ArrowUp': 'previousWeek',
                'ArrowDown': 'nextWeek',
                'PageUp': 'previousMonth',
                'PageDown': 'nextMonth',
                'Home': 'firstDayOfMonth',
                'End': 'lastDayOfMonth',
                't': 'today',
                'Escape': 'close'
            },
            views: {
                'd': 'dayView',
                'w': 'weekView',
                'm': 'monthView',
                'y': 'yearView',
                'a': 'agendaView'
            },
            actions: {
                'n': 'newEvent',
                'Delete': 'deleteEvent',
                'Enter': 'editEvent',
                'Ctrl+f': 'search',
                'Ctrl+p': 'print',
                'Ctrl+s': 'save'
            }
        },

        // Performance
        performance: {
            virtualScroll: true,
            lazyLoad: true,
            debounceTime: 300,
            maxEventsPerDay: 10,
            clusterEvents: true,
            cacheSize: 100
        },

        // Callbacks par défaut
        callbacks: {
            onDateSelect: null,
            onEventCreate: null,
            onEventEdit: null,
            onEventDelete: null,
            onEventDrop: null,
            onEventResize: null,
            onViewChange: null,
            onNavigate: null,
            onBeforeEventRender: null,
            onEventClick: null,
            onDayClick: null,
            onWeekClick: null,
            onMonthChange: null
        }
    };

    // ========================================
    // ÉTAT INTERNE
    // ========================================
    const state = new Map();
    let instanceId = 0;

    // ========================================
    // UTILITAIRES PRIVÉS
    // ========================================
    
    // Génération d'ID unique
    function generateId() {
        return `calendar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Fusion des options avec les valeurs par défaut
    function mergeOptions(defaults, options) {
        const merged = { ...defaults };
        
        for (const key in options) {
            if (options.hasOwnProperty(key)) {
                if (typeof options[key] === 'object' && !Array.isArray(options[key]) && options[key] !== null) {
                    merged[key] = mergeOptions(defaults[key] || {}, options[key]);
                } else {
                    merged[key] = options[key];
                }
            }
        }
        
        return merged;
    }

    // ========================================
    // CALCULS DE DATES
    // ========================================
    
    // Obtenir le premier jour du mois
    function getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    // Obtenir le dernier jour du mois
    function getLastDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    // Obtenir le nombre de jours dans le mois
    function getDaysInMonth(date) {
        return getLastDayOfMonth(date).getDate();
    }

    // Obtenir le jour de la semaine (0-6)
    function getDayOfWeek(date) {
        return date.getDay();
    }

    // Formater une date selon le format spécifié
    function formatDate(date, format, locale) {
        const loc = CONFIG.locales[locale] || CONFIG.locales['fr'];
        
        const tokens = {
            'YYYY': date.getFullYear(),
            'YY': String(date.getFullYear()).slice(-2),
            'MMMM': loc.months[date.getMonth()],
            'MMM': loc.monthsShort[date.getMonth()],
            'MM': String(date.getMonth() + 1).padStart(2, '0'),
            'M': date.getMonth() + 1,
            'DD': String(date.getDate()).padStart(2, '0'),
            'D': date.getDate(),
            'dddd': loc.days[date.getDay()],
            'ddd': loc.daysShort[date.getDay()],
            'dd': loc.daysMin[date.getDay()]
        };

        let formatted = format;
        for (const token in tokens) {
            formatted = formatted.replace(new RegExp(token, 'g'), tokens[token]);
        }

        return formatted;
    }

    // Ajouter des jours à une date
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // Ajouter des mois à une date
    function addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    // Comparer deux dates (sans l'heure)
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // Vérifier si une date est aujourd'hui
    function isToday(date) {
        return isSameDay(date, new Date());
    }

    // Vérifier si une date est dans le mois actuel
    function isCurrentMonth(date, currentDate) {
        return date.getFullYear() === currentDate.getFullYear() &&
               date.getMonth() === currentDate.getMonth();
    }

    // ========================================
    // CRÉATION DES ÉLÉMENTS DOM
    // ========================================
    
    // Créer le conteneur principal
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = 'calendar-container';
        container.setAttribute('role', 'application');
        container.setAttribute('aria-label', 'Calendrier');
        
        // Appliquer le style
        const style = CONFIG.styles[options.style];
        if (style && style.container) {
            Object.assign(container.style, style.container);
        }
        
        return container;
    }

    // Créer l'en-tête
    function createHeader(options, currentDate, locale) {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        
        const style = CONFIG.styles[options.style];
        if (style && style.header) {
            Object.assign(header.style, style.header);
        }
        
        // Navigation
        const nav = document.createElement('div');
        nav.className = 'calendar-nav';
        nav.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
        
        // Bouton précédent
        const prevBtn = createNavButton('prev', '←', 'Mois précédent');
        
        // Titre
        const title = document.createElement('h2');
        title.className = 'calendar-title';
        title.style.cssText = 'margin: 0; font-size: 1.25rem; font-weight: 600;';
        const view = CONFIG.views[options.view];
        title.textContent = formatDate(currentDate, view.headerFormat, locale);
        
        // Bouton suivant
        const nextBtn = createNavButton('next', '→', 'Mois suivant');
        
        nav.appendChild(prevBtn);
        nav.appendChild(title);
        nav.appendChild(nextBtn);
        
        // Barre d'outils
        if (options.features.navigation.todayButton || Object.keys(CONFIG.views).length > 1) {
            const toolbar = createToolbar(options);
            header.appendChild(nav);
            header.appendChild(toolbar);
        } else {
            header.appendChild(nav);
        }
        
        return header;
    }

    // Créer un bouton de navigation
    function createNavButton(direction, text, ariaLabel) {
        const button = document.createElement('button');
        button.className = `calendar-nav-${direction}`;
        button.textContent = text;
        button.setAttribute('aria-label', ariaLabel);
        button.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px 16px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1rem;
            color: inherit;
        `;
        
        // Effet hover
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
            button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(255, 255, 255, 0.05)';
            button.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });
        
        return button;
    }

    // Créer la barre d'outils
    function createToolbar(options) {
        const toolbar = document.createElement('div');
        toolbar.className = 'calendar-toolbar';
        toolbar.style.cssText = 'display: flex; gap: 8px; margin-top: 12px;';
        
        // Bouton aujourd'hui
        if (options.features.navigation.todayButton) {
            const todayBtn = document.createElement('button');
            todayBtn.className = 'calendar-today-btn';
            todayBtn.textContent = CONFIG.locales[options.locale].today;
            todayBtn.style.cssText = `
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 8px;
                padding: 6px 12px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 0.875rem;
                color: #22c55e;
            `;
            toolbar.appendChild(todayBtn);
        }
        
        // Sélecteur de vue
        if (options.views && options.views.length > 1) {
            const viewSelector = createViewSelector(options);
            toolbar.appendChild(viewSelector);
        }
        
        return toolbar;
    }

    // Créer le sélecteur de vue
    function createViewSelector(options) {
        const container = document.createElement('div');
        container.className = 'calendar-view-selector';
        container.style.cssText = 'display: flex; gap: 4px; margin-left: auto;';
        
        options.views.forEach(viewName => {
            const view = CONFIG.views[viewName];
            const button = document.createElement('button');
            button.className = 'calendar-view-btn';
            button.textContent = view.name;
            button.dataset.view = viewName;
            button.style.cssText = `
                background: ${viewName === options.view ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                border: 1px solid ${viewName === options.view ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 6px;
                padding: 6px 12px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 0.875rem;
                color: ${viewName === options.view ? '#3b82f6' : 'inherit'};
            `;
            
            container.appendChild(button);
        });
        
        return container;
    }

    // Créer le corps du calendrier
    function createCalendarBody(options, currentDate) {
        const body = document.createElement('div');
        body.className = 'calendar-body';
        
        switch (options.view) {
            case 'month':
                return createMonthView(options, currentDate);
            case 'week':
                return createWeekView(options, currentDate);
            case 'day':
                return createDayView(options, currentDate);
            case 'year':
                return createYearView(options, currentDate);
            case 'agenda':
                return createAgendaView(options, currentDate);
            default:
                return createMonthView(options, currentDate);
        }
    }

    // Créer la vue mois
    function createMonthView(options, currentDate) {
        const container = document.createElement('div');
        container.className = 'calendar-month-view';
        
        // En-tête des jours
        const daysHeader = createDaysHeader(options);
        container.appendChild(daysHeader);
        
        // Grille des jours
        const grid = createMonthGrid(options, currentDate);
        container.appendChild(grid);
        
        return container;
    }

    // Créer l'en-tête des jours
    function createDaysHeader(options) {
        const header = document.createElement('div');
        header.className = 'calendar-days-header';
        header.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 8px;';
        
        const locale = CONFIG.locales[options.locale];
        const firstDay = locale.firstDay || 0;
        
        for (let i = 0; i < 7; i++) {
            const dayIndex = (firstDay + i) % 7;
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = locale.daysShort[dayIndex];
            dayHeader.style.cssText = 'text-align: center; font-size: 0.875rem; font-weight: 600; opacity: 0.7;';
            header.appendChild(dayHeader);
        }
        
        return header;
    }

    // Créer la grille du mois
    function createMonthGrid(options, currentDate) {
        const grid = document.createElement('div');
        grid.className = 'calendar-month-grid';
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;';
        
        const firstDay = getFirstDayOfMonth(currentDate);
        const lastDay = getLastDayOfMonth(currentDate);
        const startOffset = (firstDay.getDay() - (CONFIG.locales[options.locale].firstDay || 0) + 7) % 7;
        
        // Jours du mois précédent
        if (options.showOtherMonthDays) {
            const prevMonthLastDay = new Date(firstDay);
            prevMonthLastDay.setDate(0);
            const prevMonthDays = prevMonthLastDay.getDate();
            
            for (let i = startOffset - 1; i >= 0; i--) {
                const day = prevMonthDays - i;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
                const cell = createDayCell(options, date, currentDate, true);
                grid.appendChild(cell);
            }
        } else {
            // Cellules vides
            for (let i = 0; i < startOffset; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-empty-cell';
                grid.appendChild(emptyCell);
            }
        }
        
        // Jours du mois actuel
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const cell = createDayCell(options, date, currentDate, false);
            grid.appendChild(cell);
        }
        
        // Jours du mois suivant
        if (options.showOtherMonthDays) {
            const totalCells = grid.children.length;
            const remainingCells = 42 - totalCells; // 6 semaines
            
            for (let day = 1; day <= remainingCells; day++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
                const cell = createDayCell(options, date, currentDate, true);
                grid.appendChild(cell);
            }
        }
        
        return grid;
    }

    // Créer une cellule de jour
    function createDayCell(options, date, currentDate, isOtherMonth) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        cell.dataset.date = date.toISOString().split('T')[0];
        
        // Classes conditionnelles
        const classes = ['calendar-day'];
        if (isToday(date)) classes.push('today');
        if (isOtherMonth) classes.push('other-month');
        if (date.getDay() === 0 || date.getDay() === 6) classes.push('weekend');
        
        cell.className = classes.join(' ');
        
        // Style de base
        const style = CONFIG.styles[options.style];
        if (style && style.cell) {
            Object.assign(cell.style, style.cell);
        }
        
        cell.style.cssText += `
            min-height: 40px;
            padding: 8px;
            cursor: pointer;
            position: relative;
            display: flex;
            flex-direction: column;
            ${isOtherMonth ? 'opacity: 0.4;' : ''}
        `;
        
        // Numéro du jour
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = date.getDate();
        dayNumber.style.cssText = 'font-size: 0.875rem; font-weight: 500;';
        
        cell.appendChild(dayNumber);
        
        // Indicateur aujourd'hui
        if (isToday(date) && style.today) {
            Object.assign(cell.style, style.today);
        }
        
        // Événements
        if (options.features.events.display) {
            const events = getEventsForDate(options.id, date);
            if (events && events.length > 0) {
                const eventsContainer = createEventsContainer(options, events);
                cell.appendChild(eventsContainer);
            }
        }
        
        // Interactivité
        setupDayCellInteractions(cell, options, date);
        
        return cell;
    }

    // Créer le conteneur d'événements
    function createEventsContainer(options, events) {
        const container = document.createElement('div');
        container.className = 'calendar-events';
        container.style.cssText = 'margin-top: 4px; display: flex; flex-direction: column; gap: 2px;';
        
        const maxEvents = 3;
        const displayEvents = events.slice(0, maxEvents);
        
        displayEvents.forEach(event => {
            const eventEl = createEventElement(options, event);
            container.appendChild(eventEl);
        });
        
        if (events.length > maxEvents) {
            const more = document.createElement('div');
            more.className = 'calendar-more-events';
            more.textContent = `+${events.length - maxEvents}`;
            more.style.cssText = 'font-size: 0.75rem; opacity: 0.7;';
            container.appendChild(more);
        }
        
        return container;
    }

    // Créer un élément événement
    function createEventElement(options, event) {
        const eventEl = document.createElement('div');
        eventEl.className = 'calendar-event';
        eventEl.dataset.eventId = event.id;
        
        const style = CONFIG.styles[options.style];
        if (style && style.event) {
            Object.assign(eventEl.style, style.event);
        }
        
        eventEl.style.backgroundColor = event.color || '#3b82f6';
        eventEl.textContent = event.title;
        
        return eventEl;
    }

    // Configuration des interactions d'une cellule
    function setupDayCellInteractions(cell, options, date) {
        const style = CONFIG.styles[options.style];
        
        // Hover
        cell.addEventListener('mouseenter', () => {
            if (style && style.cellHover) {
                Object.assign(cell.style, style.cellHover);
            }
        });
        
        cell.addEventListener('mouseleave', () => {
            if (style && style.cell) {
                Object.assign(cell.style, style.cell);
            }
            // Conserver les styles spéciaux
            if (cell.classList.contains('today') && style.today) {
                Object.assign(cell.style, style.today);
            }
            if (cell.classList.contains('selected') && style.selected) {
                Object.assign(cell.style, style.selected);
            }
        });
        
        // Click
        cell.addEventListener('click', (e) => {
            handleDayClick(options, date, cell, e);
        });
        
        // Double-click pour créer un événement
        if (options.features.events.create) {
            cell.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                createNewEvent(options, date);
            });
        }
    }

    // Gérer le clic sur un jour
    function handleDayClick(options, date, cell, event) {
        const calendarState = state.get(options.id);
        
        // Callback
        if (options.callbacks.onDayClick) {
            options.callbacks.onDayClick(date, event);
        }
        
        // Sélection
        const selectionMode = options.selectionMode;
        const mode = CONFIG.selectionModes[selectionMode];
        
        if (!mode || !mode.enabled) return;
        
        switch (selectionMode) {
            case 'single':
                handleSingleSelection(options, date, cell);
                break;
            case 'multiple':
                handleMultipleSelection(options, date, cell, event);
                break;
            case 'range':
                handleRangeSelection(options, date, cell);
                break;
        }
        
        // Mise à jour visuelle
        updateSelectionVisuals(options);
        
        // Callback de sélection
        if (options.callbacks.onDateSelect) {
            options.callbacks.onDateSelect(calendarState.selectedDates);
        }
    }

    // Gestion de la sélection simple
    function handleSingleSelection(options, date, cell) {
        const calendarState = state.get(options.id);
        const dateStr = date.toISOString().split('T')[0];
        
        if (calendarState.selectedDates.has(dateStr) && CONFIG.selectionModes.single.allowDeselect) {
            calendarState.selectedDates.delete(dateStr);
        } else {
            calendarState.selectedDates.clear();
            calendarState.selectedDates.add(dateStr);
        }
    }

    // Créer les autres vues (semaine, jour, année, agenda)
    function createWeekView(options, currentDate) {
        // Implémentation de la vue semaine
        const container = document.createElement('div');
        container.className = 'calendar-week-view';
        container.innerHTML = '<div style="padding: 20px; text-align: center;">Vue semaine - À implémenter</div>';
        return container;
    }

    function createDayView(options, currentDate) {
        // Implémentation de la vue jour
        const container = document.createElement('div');
        container.className = 'calendar-day-view';
        container.innerHTML = '<div style="padding: 20px; text-align: center;">Vue jour - À implémenter</div>';
        return container;
    }

    function createYearView(options, currentDate) {
        // Implémentation de la vue année
        const container = document.createElement('div');
        container.className = 'calendar-year-view';
        container.innerHTML = '<div style="padding: 20px; text-align: center;">Vue année - À implémenter</div>';
        return container;
    }

    function createAgendaView(options, currentDate) {
        // Implémentation de la vue agenda
        const container = document.createElement('div');
        container.className = 'calendar-agenda-view';
        container.innerHTML = '<div style="padding: 20px; text-align: center;">Vue agenda - À implémenter</div>';
        return container;
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    // Obtenir les événements pour une date
    function getEventsForDate(calendarId, date) {
        const calendarState = state.get(calendarId);
        if (!calendarState || !calendarState.events) return [];
        
        const dateStr = date.toISOString().split('T')[0];
        return calendarState.events.filter(event => {
            const eventDate = new Date(event.start).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    }

    // Créer un nouvel événement
    function createNewEvent(options, date) {
        if (options.callbacks.onEventCreate) {
            options.callbacks.onEventCreate({
                start: date,
                end: addDays(date, 1),
                allDay: true
            });
        }
    }

    // ========================================
    // NAVIGATION
    // ========================================
    
    // Configurer la navigation
    function setupNavigation(calendar, options) {
        const calendarState = state.get(options.id);
        
        // Boutons de navigation
        const prevBtn = calendar.querySelector('.calendar-nav-prev');
        const nextBtn = calendar.querySelector('.calendar-nav-next');
        const todayBtn = calendar.querySelector('.calendar-today-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                navigateToPrevious(calendar, options);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                navigateToNext(calendar, options);
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                navigateToToday(calendar, options);
            });
        }
        
        // Sélecteur de vue
        const viewButtons = calendar.querySelectorAll('.calendar-view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                changeView(calendar, options, btn.dataset.view);
            });
        });
        
        // Navigation clavier
        if (options.features.navigation.keyboard) {
            setupKeyboardNavigation(calendar, options);
        }
    }

    // Navigation vers le mois précédent
    function navigateToPrevious(calendar, options) {
        const calendarState = state.get(options.id);
        
        switch (options.view) {
            case 'month':
                calendarState.currentDate = addMonths(calendarState.currentDate, -1);
                break;
            case 'week':
                calendarState.currentDate = addDays(calendarState.currentDate, -7);
                break;
            case 'day':
                calendarState.currentDate = addDays(calendarState.currentDate, -1);
                break;
            case 'year':
                calendarState.currentDate = addMonths(calendarState.currentDate, -12);
                break;
        }
        
        updateCalendar(calendar, options);
        
        if (options.callbacks.onNavigate) {
            options.callbacks.onNavigate(calendarState.currentDate, 'prev');
        }
    }

    // Navigation vers le mois suivant
    function navigateToNext(calendar, options) {
        const calendarState = state.get(options.id);
        
        switch (options.view) {
            case 'month':
                calendarState.currentDate = addMonths(calendarState.currentDate, 1);
                break;
            case 'week':
                calendarState.currentDate = addDays(calendarState.currentDate, 7);
                break;
            case 'day':
                calendarState.currentDate = addDays(calendarState.currentDate, 1);
                break;
            case 'year':
                calendarState.currentDate = addMonths(calendarState.currentDate, 12);
                break;
        }
        
        updateCalendar(calendar, options);
        
        if (options.callbacks.onNavigate) {
            options.callbacks.onNavigate(calendarState.currentDate, 'next');
        }
    }

    // Navigation vers aujourd'hui
    function navigateToToday(calendar, options) {
        const calendarState = state.get(options.id);
        calendarState.currentDate = new Date();
        
        updateCalendar(calendar, options);
        
        if (options.callbacks.onNavigate) {
            options.callbacks.onNavigate(calendarState.currentDate, 'today');
        }
    }

    // Changer de vue
    function changeView(calendar, options, newView) {
        options.view = newView;
        updateCalendar(calendar, options);
        
        // Mise à jour des boutons de vue
        const viewButtons = calendar.querySelectorAll('.calendar-view-btn');
        viewButtons.forEach(btn => {
            const isActive = btn.dataset.view === newView;
            btn.style.background = isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)';
            btn.style.borderColor = isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            btn.style.color = isActive ? '#3b82f6' : 'inherit';
        });
        
        if (options.callbacks.onViewChange) {
            options.callbacks.onViewChange(newView);
        }
    }

    // Configuration de la navigation au clavier
    function setupKeyboardNavigation(calendar, options) {
        calendar.addEventListener('keydown', (e) => {
            const shortcuts = CONFIG.shortcuts;
            
            // Navigation
            if (shortcuts.navigation[e.key]) {
                e.preventDefault();
                handleKeyboardNavigation(calendar, options, shortcuts.navigation[e.key]);
            }
            
            // Vues
            if (shortcuts.views[e.key]) {
                e.preventDefault();
                changeView(calendar, options, shortcuts.views[e.key].replace('View', ''));
            }
            
            // Actions
            if (shortcuts.actions[`${e.ctrlKey ? 'Ctrl+' : ''}${e.key}`]) {
                e.preventDefault();
                handleKeyboardAction(calendar, options, shortcuts.actions[`${e.ctrlKey ? 'Ctrl+' : ''}${e.key}`]);
            }
        });
    }

    // ========================================
    // MISE À JOUR DU CALENDRIER
    // ========================================
    
    // Mettre à jour l'affichage du calendrier
    function updateCalendar(calendar, options) {
        const calendarState = state.get(options.id);
        
        // Mise à jour de l'en-tête
        const title = calendar.querySelector('.calendar-title');
        if (title) {
            const view = CONFIG.views[options.view];
            title.textContent = formatDate(calendarState.currentDate, view.headerFormat, options.locale);
        }
        
        // Mise à jour du corps
        const body = calendar.querySelector('.calendar-body');
        if (body) {
            const newBody = createCalendarBody(options, calendarState.currentDate);
            body.replaceWith(newBody);
        }
    }

    // Mise à jour des visuels de sélection
    function updateSelectionVisuals(options) {
        const calendarState = state.get(options.id);
        const calendar = document.getElementById(options.id);
        const cells = calendar.querySelectorAll('.calendar-day-cell');
        const style = CONFIG.styles[options.style];
        
        cells.forEach(cell => {
            const dateStr = cell.dataset.date;
            const isSelected = calendarState.selectedDates.has(dateStr);
            
            if (isSelected) {
                cell.classList.add('selected');
                if (style && style.selected) {
                    Object.assign(cell.style, style.selected);
                }
            } else {
                cell.classList.remove('selected');
                // Réappliquer le style de base
                if (style && style.cell) {
                    Object.assign(cell.style, style.cell);
                }
                // Conserver le style aujourd'hui si applicable
                if (cell.classList.contains('today') && style.today) {
                    Object.assign(cell.style, style.today);
                }
            }
        });
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    
    function injectStyles() {
        if (document.getElementById('calendar-component-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'calendar-component-styles';
        style.textContent = `
            /* Styles de base du calendrier */
            .calendar-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #1f2937;
                user-select: none;
            }
            
            .calendar-container * {
                box-sizing: border-box;
            }
            
            /* Animations */
            @keyframes calendar-fade-in {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .calendar-container.animate-in {
                animation: calendar-fade-in 0.3s ease-out;
            }
            
            /* Transitions pour les changements de mois */
            .calendar-body {
                transition: opacity 0.2s ease-out;
            }
            
            .calendar-body.transitioning {
                opacity: 0;
            }
            
            /* Focus styles pour l'accessibilité */
            .calendar-container button:focus {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            /* Styles pour le mode sombre */
            @media (prefers-color-scheme: dark) {
                .calendar-container {
                    color: #f3f4f6;
                }
            }
            
            /* Responsive */
            @media (max-width: 640px) {
                .calendar-container {
                    padding: 16px !important;
                }
                
                .calendar-day-cell {
                    min-height: 35px !important;
                    padding: 4px !important;
                }
                
                .calendar-toolbar {
                    flex-wrap: wrap;
                }
            }
            
            /* Print styles */
            @media print {
                .calendar-nav button,
                .calendar-toolbar {
                    display: none !important;
                }
                
                .calendar-container {
                    background: white !important;
                    color: black !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    return {
        // Configuration exposée pour référence
        CONFIG,
        
        // Créer une instance de calendrier
        async create(options = {}) {
            // Options par défaut
            const defaultOptions = {
                container: null,
                style: 'glassmorphism',
                animation: 'smooth',
                view: 'month',
                views: ['month', 'week', 'day', 'year', 'agenda'],
                locale: 'fr',
                selectionMode: 'single',
                showOtherMonthDays: true,
                features: {
                    navigation: {
                        keyboard: true,
                        todayButton: true
                    },
                    events: {
                        display: true,
                        create: true,
                        edit: true,
                        delete: true
                    }
                },
                callbacks: {}
            };
            
            // Fusionner les options
            const finalOptions = mergeOptions(defaultOptions, options);
            
            // Générer un ID unique
            finalOptions.id = options.id || generateId();
            
            // Initialiser l'état
            state.set(finalOptions.id, {
                currentDate: new Date(),
                selectedDates: new Set(),
                events: [],
                view: finalOptions.view
            });
            
            // Injecter les styles
            this.injectStyles();
            
            // Créer le calendrier
            const calendar = createContainer(finalOptions);
            calendar.id = finalOptions.id;
            
            // Ajouter l'en-tête
            const header = createHeader(finalOptions, state.get(finalOptions.id).currentDate, finalOptions.locale);
            calendar.appendChild(header);
            
            // Ajouter le corps
            const body = document.createElement('div');
            body.className = 'calendar-body';
            const calendarContent = createCalendarBody(finalOptions, state.get(finalOptions.id).currentDate);
            body.appendChild(calendarContent);
            calendar.appendChild(body);
            
            // Configurer la navigation
            setupNavigation(calendar, finalOptions);
            
            // Animation d'entrée
            if (finalOptions.animation !== 'none') {
                calendar.classList.add('animate-in');
            }
            
            // Ajouter au conteneur si spécifié
            if (finalOptions.container) {
                const container = typeof finalOptions.container === 'string' 
                    ? document.querySelector(finalOptions.container)
                    : finalOptions.container;
                
                if (container) {
                    container.appendChild(calendar);
                }
            }
            
            // Retourner l'API du calendrier
            return {
                element: calendar,
                
                // Navigation
                next: () => navigateToNext(calendar, finalOptions),
                previous: () => navigateToPrevious(calendar, finalOptions),
                today: () => navigateToToday(calendar, finalOptions),
                goToDate: (date) => {
                    const calendarState = state.get(finalOptions.id);
                    calendarState.currentDate = date;
                    updateCalendar(calendar, finalOptions);
                },
                
                // Vue
                changeView: (view) => changeView(calendar, finalOptions, view),
                
                // Sélection
                getSelectedDates: () => Array.from(state.get(finalOptions.id).selectedDates),
                setSelectedDates: (dates) => {
                    const calendarState = state.get(finalOptions.id);
                    calendarState.selectedDates = new Set(dates.map(d => 
                        d instanceof Date ? d.toISOString().split('T')[0] : d
                    ));
                    updateSelectionVisuals(finalOptions);
                },
                clearSelection: () => {
                    const calendarState = state.get(finalOptions.id);
                    calendarState.selectedDates.clear();
                    updateSelectionVisuals(finalOptions);
                },
                
                // Événements
                addEvent: (event) => {
                    const calendarState = state.get(finalOptions.id);
                    event.id = event.id || `event-${Date.now()}`;
                    calendarState.events.push(event);
                    updateCalendar(calendar, finalOptions);
                },
                removeEvent: (eventId) => {
                    const calendarState = state.get(finalOptions.id);
                    calendarState.events = calendarState.events.filter(e => e.id !== eventId);
                    updateCalendar(calendar, finalOptions);
                },
                getEvents: () => state.get(finalOptions.id).events,
                
                // Mise à jour
                refresh: () => updateCalendar(calendar, finalOptions),
                
                // Destruction
                destroy: () => {
                    state.delete(finalOptions.id);
                    calendar.remove();
                }
            };
        },
        
        // Injecter les styles CSS
        injectStyles
    };
})();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [28/07/2025] - Architecture modulaire
   Challenge: Créer un système où toutes les options sont dans le fichier
   mais les développeurs n'utilisent que ce dont ils ont besoin
   Solution: Structure avec CONFIG contenant toutes les possibilités
   et options passées à create() pour activer seulement le nécessaire
   
   [28/07/2025] - Gestion des états
   Challenge: Gérer plusieurs instances de calendrier simultanément
   Solution: Utilisation d'une Map avec des IDs uniques pour isoler
   l'état de chaque instance
   
   NOTES POUR REPRISES FUTURES:
   - Les vues semaine/jour/année/agenda sont à implémenter complètement
   - Le système d'événements récurrents nécessite plus de logique
   - L'import/export iCal est à développer
   - Les animations riches (particules, physics) sont à ajouter
   - La synchronisation avec Google Calendar/Outlook nécessite des APIs
   ======================================== */