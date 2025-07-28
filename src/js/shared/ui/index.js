// ========================================
// UI SYSTEM - INDEX CENTRAL
// Export principal avec lazy loading automatique
// Version: 1.0.0
// ========================================

/**
 * 🎨 SYSTÈME UI COMPLET - INDEX CENTRAL
 * 
 * UTILISATION:
 * import { UI } from '/src/js/shared/ui';
 * 
 * // Utilisation simple
 * const modal = await UI.Modal({ title: 'Test' });
 * 
 * // Ou récupérer le composant complet
 * const ModalComponent = await UI.Modal();
 * const modal = ModalComponent.create({ title: 'Test' });
 * 
 * AVANTAGES:
 * - Lazy loading automatique (charge uniquement ce qui est utilisé)
 * - Import unique pour tout le système
 * - Auto-complétion dans les IDEs modernes
 * - Tree-shaking optimisé
 */

// ========================================
// CONFIGURATION DU SYSTÈME
// ========================================
export const UI_CONFIG = {
    version: '1.0.0',
    defaultTheme: 'glassmorphism',
    defaultAnimation: 'smooth',
    defaultLocale: 'fr-FR',
    
    // Chemins des composants
    paths: {
        base: '/src/js/shared/ui',
        css: '/src/css/shared/ui',
        themes: '/src/css/shared/themes'
    }
};

// ========================================
// LAZY LOADING DES COMPOSANTS
// ========================================

/**
 * Fonction helper pour le lazy loading avec options
 */
async function loadComponent(path, componentName, options) {
    try {
        const module = await import(path);
        const Component = module[componentName] || module.default;
        
        // Si des options sont passées, créer directement
        if (options && Component.create) {
            return Component.create(options);
        }
        
        // Sinon retourner le composant
        return Component;
    } catch (error) {
        console.error(`Erreur chargement ${componentName}:`, error);
        throw error;
    }
}

// ========================================
// EXPORT PRINCIPAL - UI
// ========================================
export const UI = {
    // ========================================
    // CORE - Composants de base
    // ========================================
    
    async Button(options) {
        return loadComponent('./core/button.component.js', 'ButtonComponent', options);
    },
    
    async Card(options) {
        return loadComponent('./core/card.component.js', 'CardComponent', options);
    },
    
    async FAB(options) {
        return loadComponent('./core/fab.component.js', 'FABComponent', options);
    },
    
    // ========================================
    // FEEDBACK - Retours utilisateur
    // ========================================
    
    async Modal(options) {
        return loadComponent('./feedback/modal.component.js', 'Modal', options);
    },
    
    async Dialog(options) {
        return loadComponent('./feedback/dialog.component.js', 'Dialog', options);
    },
    
    async Notification(options) {
        return loadComponent('./feedback/notification.component.js', 'NotificationComponent', options);
    },
    
    // Alias pour notification
    async notify(message, options) {
        const Notification = await this.Notification();
        return Notification.show(message, options);
    },
    
    async Toast(options) {
        return loadComponent('./feedback/toast.component.js', 'ToastComponent', options);
    },
    
    async Alert(options) {
        return loadComponent('./feedback/alert.component.js', 'AlertComponent', options);
    },
    
    async Snackbar(options) {
        return loadComponent('./feedback/snackbar.component.js', 'SnackbarComponent', options);
    },
    
    async Progress(options) {
        return loadComponent('./feedback/progress.component.js', 'ProgressComponent', options);
    },
    
    async Tour(options) {
        return loadComponent('./feedback/tour.component.js', 'TourComponent', options);
    },
    
    // ========================================
    // DATA DISPLAY - Affichage de données
    // ========================================
    
    async Table(options) {
        return loadComponent('./data-display/table.component.js', 'TableComponent', options);
    },
    
    async Timeline(options) {
        return loadComponent('./data-display/timeline.component.js', 'Timeline', options);
    },
    
    async List(options) {
        return loadComponent('./data-display/list.component.js', 'ListComponent', options);
    },
    
    async Grid(options) {
        return loadComponent('./data-display/grid.component.js', 'GridComponent', options);
    },
    
    async Tree(options) {
        return loadComponent('./data-display/tree.component.js', 'TreeComponent', options);
    },
    
    async Calendar(options) {
        return loadComponent('./data-display/calendar.component.js', 'CalendarComponent', options);
    },
    
    async StatsCard(options) {
        return loadComponent('./data-display/stats-card.component.js', 'StatsCardComponent', options);
    },
    
    async EmptyState(options) {
        return loadComponent('./data-display/empty-state.component.js', 'EmptyStateComponent', options);
    },
    
    async Kanban(options) {
        return loadComponent('./data-display/kanban.component.js', 'KanbanComponent', options);
    },
    
    async Heatmap(options) {
        return loadComponent('./data-display/heatmap.component.js', 'HeatmapComponent', options);
    },
    
    // ========================================
    // DATA ENTRY - Formulaires
    // ========================================
    
    async Form(options) {
        return loadComponent('./data-entry/form-builder.component.js', 'FormBuilder', options);
    },
    
    async Input(options) {
        return loadComponent('./data-entry/input-field.component.js', 'InputComponent', options);
    },
    
    async Select(options) {
        return loadComponent('./data-entry/select-field.component.js', 'SelectComponent', options);
    },
    
    async Checkbox(options) {
        return loadComponent('./data-entry/checkbox-group.component.js', 'CheckboxGroup', options);
    },
    
    async Radio(options) {
        return loadComponent('./data-entry/radio-group.component.js', 'RadioComponent', options);
    },
    
    async Switch(options) {
        return loadComponent('./data-entry/switch.component.js', 'SwitchComponent', options);
    },
    
    async Slider(options) {
        return loadComponent('./data-entry/slider.component.js', 'SliderComponent', options);
    },
    
    async DatePicker(options) {
        return loadComponent('./data-entry/date-picker.component.js', 'DatePickerComponent', options);
    },
    
    async TimePicker(options) {
        return loadComponent('./data-entry/time-picker.component.js', 'TimePickerComponent', options);
    },
    
    async ColorPicker(options) {
        return loadComponent('./data-entry/color-picker.component.js', 'ColorPickerComponent', options);
    },
    
    async FileUpload(options) {
        return loadComponent('./data-entry/file-upload.component.js', 'FileUploadComponent', options);
    },
    
    async Signature(options) {
        return loadComponent('./data-entry/signature-pad.component.js', 'SignaturePad', options);
    },
    
    // ========================================
    // ELEMENTS - Éléments visuels
    // ========================================
    
    async Icon(name, options) {
        const Icons = await loadComponent('./elements/icons.component.js', 'Icons', options);
        return Icons.create(name, options);
    },
    
    async Badge(type, text, options) {
        const StatusBadge = await loadComponent('./elements/status-badge.component.js', 'StatusBadge', options);
        if (type === 'status') {
            return StatusBadge.createStatus(text, null, options);
        }
        return StatusBadge.create(type, text, options);
    },
    
    async Chip(options) {
        return loadComponent('./elements/chip.component.js', 'ChipComponent', options);
    },
    
    async Avatar(options) {
        return loadComponent('./elements/avatar.component.js', 'AvatarComponent', options);
    },
    
    async Rating(options) {
        return loadComponent('./elements/rating.component.js', 'RatingComponent', options);
    },
    
    async Tooltip(options) {
        return loadComponent('./elements/tooltip.component.js', 'TooltipComponent', options);
    },
    
    async Popover(options) {
        return loadComponent('./elements/popover.component.js', 'PopoverComponent', options);
    },
    
    async Skeleton(options) {
        return loadComponent('./elements/skeleton.component.js', 'SkeletonComponent', options);
    },
    
    // ========================================
    // LAYOUT - Mise en page
    // ========================================
    
    async PageTemplate(options) {
        return loadComponent('./layout/page-template.component.js', 'PageTemplate', options);
    },
    
    async Sidebar(options) {
        return loadComponent('./layout/sidebar.component.js', 'SidebarComponent', options);
    },
    
    async Header(options) {
        return loadComponent('./layout/header.component.js', 'HeaderComponent', options);
    },
    
    async Footer(options) {
        return loadComponent('./layout/footer.component.js', 'FooterComponent', options);
    },
    
    async Tabs(options) {
        return loadComponent('./layout/tabs.component.js', 'TabsComponent', options);
    },
    
    async Accordion(options) {
        return loadComponent('./layout/accordion.component.js', 'AccordionComponent', options);
    },
    
    async Stepper(options) {
        return loadComponent('./layout/stepper.component.js', 'StepperComponent', options);
    },
    
    async Breadcrumb(options) {
        return loadComponent('./layout/breadcrumb.component.js', 'BreadcrumbComponent', options);
    },
    
    async Divider(options) {
        return loadComponent('./layout/divider.component.js', 'DividerComponent', options);
    },
    
    // ========================================
    // NAVIGATION - Navigation
    // ========================================
    
    async Menu(options) {
        return loadComponent('./navigation/menu.component.js', 'MenuComponent', options);
    },
    
    async NavMenu(options) {
        return loadComponent('./navigation/nav-menu.component.js', 'NavMenuComponent', options);
    },
    
    async ContextMenu(options) {
        return loadComponent('./navigation/context-menu.component.js', 'ContextMenuComponent', options);
    },
    
    async Dropdown(options) {
        return loadComponent('./navigation/dropdown.component.js', 'DropdownComponent', options);
    },
    
    async Pagination(options) {
        return loadComponent('./navigation/pagination.component.js', 'PaginationComponent', options);
    },
    
    async Anchor(options) {
        return loadComponent('./navigation/anchor.component.js', 'AnchorComponent', options);
    },
    
    async SpeedDial(options) {
        return loadComponent('./navigation/speed-dial.component.js', 'SpeedDialComponent', options);
    },
    
    async CommandPalette(options) {
        return loadComponent('./navigation/command-palette.component.js', 'CommandPaletteComponent', options);
    },
    
    async BottomSheet(options) {
        return loadComponent('./navigation/bottom-sheet.component.js', 'BottomSheetComponent', options);
    },
    
    // ========================================
    // FILTERS - Filtrage
    // ========================================
    
    async FilterPanel(options) {
        return loadComponent('./filters/filter-panel.component.js', 'FilterPanelComponent', options);
    },
    
    async SearchBox(options) {
        return loadComponent('./filters/search-box.component.js', 'SearchBoxComponent', options);
    },
    
    async FilterChips(options) {
        return loadComponent('./filters/filter-chips.component.js', 'FilterChipsComponent', options);
    },
    
    async DateRange(options) {
        return loadComponent('./filters/date-range.component.js', 'DateRangeComponent', options);
    },
    
    async AdvancedFilter(options) {
        return loadComponent('./filters/advanced-filter.component.js', 'AdvancedFilterComponent', options);
    },
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Configurer le système UI
     */
    config(options) {
        Object.assign(UI_CONFIG, options);
        
        // Appliquer le thème si spécifié
        if (options.defaultTheme) {
            this.applyTheme(options.defaultTheme);
        }
        
        return UI_CONFIG;
    },
    
    /**
     * Appliquer un thème global
     */
    async applyTheme(themeName) {
        const theme = document.createElement('link');
        theme.rel = 'stylesheet';
        theme.href = `${UI_CONFIG.paths.themes}/${themeName}.css`;
        theme.id = 'ui-theme';
        
        // Remplacer le thème existant
        const existingTheme = document.getElementById('ui-theme');
        if (existingTheme) {
            existingTheme.remove();
        }
        
        document.head.appendChild(theme);
    },
    
    /**
     * Précharger des composants
     */
    async preload(...componentNames) {
        const promises = componentNames.map(name => {
            if (typeof this[name] === 'function') {
                return this[name]();
            }
            return null;
        }).filter(Boolean);
        
        return Promise.all(promises);
    },
    
    /**
     * Obtenir la version
     */
    get version() {
        return UI_CONFIG.version;
    },
    
    /**
     * Liste des composants disponibles
     */
    get components() {
        return Object.keys(this).filter(key => 
            typeof this[key] === 'function' && 
            !['config', 'applyTheme', 'preload'].includes(key)
        );
    }
};

// Export par défaut
export default UI;