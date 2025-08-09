/* ========================================
   DETAIL-VIEWER.WIDGET.JS - Widget de visualisation détaillée
   Chemin: /widgets/detail-viewer/detail-viewer.widget.js
   
   DESCRIPTION:
   Widget modal complet pour afficher le détail d'un élément.
   Inclut une timeline optionnelle et des sections configurables.
   100% autonome avec son propre CSS.
   
   STRUCTURE DU FICHIER:
   1. CONFIGURATION ET ÉTAT
   2. INITIALISATION
   3. RENDU DU MODAL
   4. TIMELINE INTÉGRÉE
   5. SECTIONS DYNAMIQUES
   6. INTERACTIONS
   7. API PUBLIQUE
   8. DESTRUCTION
   
   UTILISATION:
   import { DetailViewerWidget } from '/widgets/detail-viewer/detail-viewer.widget.js';
   const viewer = new DetailViewerWidget({
       title: 'Facture #123',
       data: factureData,
       timeline: { enabled: true, items: [...] },
       sections: [...],
       actions: [...]
   });
   
   API PUBLIQUE:
   - open() - Ouvrir le modal
   - close() - Fermer le modal
   - update(data) - Mettre à jour les données
   - refresh() - Rafraîchir l'affichage
   - destroy() - Détruire le widget
   
   OPTIONS:
   - title: string - Titre du modal
   - subtitle: string - Sous-titre optionnel
   - data: object - Données à afficher
   - timeline: object - Configuration timeline
   - sections: array - Sections à afficher
   - actions: array - Boutons d'action
   - theme: string - Thème visuel
   - size: string - Taille du modal
   - buttonClasses: object - Classes CSS externes pour boutons
   - onOpen: function - Callback ouverture
   - onClose: function - Callback fermeture
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

export class DetailViewerWidget {
    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec spread pour défauts
        this.config = {
            // Apparence
            title: config.title || 'Détail',
            subtitle: config.subtitle || null,
            theme: config.theme || 'default', // 'default' | 'minimal' | 'dark'
            size: config.size || 'large', // 'small' | 'medium' | 'large' | 'xlarge'
            
            // Données
            data: config.data || {},
            
            // Timeline intégrée (optionnelle)
            timeline: {
                enabled: config.timeline?.enabled ?? false,
                items: config.timeline?.items || [],
                theme: config.timeline?.theme || 'default', // 'default' | 'minimal' | 'colorful'
                size: config.timeline?.size || 'medium', // 'small' | 'medium' | 'large'
                orientation: config.timeline?.orientation || 'horizontal', // 'horizontal' | 'vertical'
                animated: config.timeline?.animated ?? true,
                showDates: config.timeline?.showDates ?? true,
                showLabels: config.timeline?.showLabels ?? true,
                pulse: config.timeline?.pulse ?? true,
                ...config.timeline
            },
            
            // Sections configurables
            sections: config.sections || [],
            
            // Actions footer
            actions: config.actions || [],
            
            // Classes CSS externes pour les boutons
            buttonClasses: config.buttonClasses || {
                primary: 'btn btn-primary',
                secondary: 'btn btn-secondary',
                success: 'btn btn-success',
                danger: 'btn btn-danger',
                warning: 'btn btn-warning',
                info: 'btn btn-info',
                close: 'btn-close'
            },
            
            // Comportement
            closeOnOverlay: config.closeOnOverlay !== false,
            closeOnEscape: config.closeOnEscape !== false,
            animated: config.animated !== false,
            
            // Callbacks
            onOpen: config.onOpen || null,
            onClose: config.onClose || null,
            onAction: config.onAction || null,
            
            // Spread pour surcharger
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            isOpen: false,
            loaded: false,
            currentData: this.config.data
        };
        
        // 4. Références DOM
        this.elements = {
            overlay: null,
            modal: null,
            body: null,
            timelineContainer: null,
            sectionsContainer: null,
            actionsContainer: null
        };
        
        // 5. ID unique (pattern obligatoire)
        this.id = 'detail-viewer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // 6. Initialiser
        this.init();
    }
    
    /**
     * Charge le CSS avec timestamp anti-cache
     */
    loadCSS() {
        // Charger les styles communs (buttons, badges, modal)
        import('/src/utils/widget-styles-loader.js').then(module => {
            module.loadWidgetStyles();
        });
        
        // Charger le CSS spécifique du widget
        const cssId = 'detail-viewer-widget-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `/widgets/detail-viewer/detail-viewer.widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
    }
    /**
     * Initialisation
     */
    async init() {
        try {
            this.render();
            this.attachEvents();
            this.showWithDelay();
            
            // Auto-open si configuré
            if (this.config.autoOpen !== false) {
                this.open();
            }
        } catch (error) {
            console.error('❌ Erreur init DetailViewerWidget:', error);
        }
    }
    
    /**
     * Rendu du modal complet
     */
    render() {
        // Créer l'overlay
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = `modal-overlay modal-theme-${this.config.theme}`;
        this.elements.overlay.id = `${this.id}-overlay`;

        // Créer le modal
        this.elements.modal = document.createElement('div');
        this.elements.modal.className = `modal-container modal-${this.config.size}`;
        
        // Structure du modal
        this.elements.modal.innerHTML = `
        <!-- Header -->
        <div class="modal-header">
            <div class="modal-header-content">
                <h2 class="modal-title">${this.escapeHtml(this.config.title)}</h2>
                ${this.config.subtitle ? `
                    <p class="modal-subtitle">${this.escapeHtml(this.config.subtitle)}</p>
                ` : ''}
            </div>
            <button class="modal-close" aria-label="Fermer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Body -->
            <div class="modal-body">
                <!-- Timeline (si activée) -->
                ${this.config.timeline.enabled ? `
                    <div class="detail-viewer-timeline-zone">
                        ${this.renderTimeline()}
                    </div>
                ` : ''}
                
                <!-- Sections -->
                <div class="detail-viewer-sections">
                    ${this.renderSections()}
                </div>
            </div>

            <!-- Footer (si actions) -->
            ${this.config.actions.length > 0 ? `
                <div class="modal-footer">
                    ${this.renderActions()}
                </div>
            ` : ''}
        `;
        
        // Ajouter au DOM
        this.elements.overlay.appendChild(this.elements.modal);
        document.body.appendChild(this.elements.overlay);
        
        // Stocker les références
        this.elements.body = this.elements.modal.querySelector('.detail-viewer-body');
        this.elements.timelineContainer = this.elements.modal.querySelector('.detail-viewer-timeline-zone');
        this.elements.sectionsContainer = this.elements.modal.querySelector('.detail-viewer-sections');
        this.elements.actionsContainer = this.elements.modal.querySelector('.detail-viewer-footer');
    
    }
    
    /**
     * Rendu de la timeline intégrée
     */
    renderTimeline() {
        if (!this.config.timeline.enabled || !this.config.timeline.items.length) {
            return '';
        }
        
        const { theme, size, orientation, animated, showDates, showLabels, pulse } = this.config.timeline;
        
        // Classes de la timeline
        const timelineClasses = [
            'detail-timeline',
            `timeline-${orientation}`,
            `timeline-${theme}`,
            `timeline-${size}`,
            animated && 'timeline-animated',
            pulse && 'timeline-pulse'
        ].filter(Boolean).join(' ');
        
        // Calculer la progression pour le connector
        const items = this.config.timeline.items;
        const completedCount = items.filter(item => item.status === 'completed').length;
        const activeIndex = items.findIndex(item => item.status === 'active' || item.status === 'current');
        const progress = activeIndex >= 0 ? 
            ((completedCount + 0.5) / items.length) * 100 : 
            (completedCount / items.length) * 100;
        
        return `
            <div class="${timelineClasses}" style="--progress: ${progress}%;">
                <div class="timeline-connector"></div>
                <div class="timeline-items">
                    ${items.map((item, index) => this.renderTimelineItem(item, index)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendu d'un item de timeline
     */
    renderTimelineItem(item, index) {
        const { showDates, showLabels } = this.config.timeline;
        
        // Classes de l'item
        const itemClasses = [
            'timeline-item',
            `timeline-item-${item.status || 'pending'}`,
            item.disabled && 'timeline-item-disabled'
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${itemClasses}" data-index="${index}">
                <div class="timeline-icon-wrapper">
                    <div class="timeline-icon">
                        ${item.icon || this.getDefaultTimelineIcon(item.status)}
                    </div>
                    ${(item.status === 'active' || item.status === 'current') ? 
                        '<div class="icon-pulse"></div>' : ''
                    }
                </div>
                <div class="timeline-content">
                    ${showLabels && item.label ? `
                        <div class="timeline-label">${this.escapeHtml(item.label)}</div>
                    ` : ''}
                    ${showDates && item.date ? `
                        <div class="timeline-date">${item.date}</div>
                    ` : ''}
                    ${item.description ? `
                        <div class="timeline-description">${this.escapeHtml(item.description)}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Icône par défaut selon le statut
     */
    getDefaultTimelineIcon(status) {
        const icons = {
            completed: '✓',
            active: '●',
            current: '●',
            pending: '○',
            disabled: '×',
            error: '!',
            warning: '⚠'
        };
        return icons[status] || '○';
    }
    
    /**
     * Rendu des sections
     */
    renderSections() {
        if (!this.config.sections || this.config.sections.length === 0) {
            return '<div class="detail-viewer-empty">Aucune donnée à afficher</div>';
        }
        
        return this.config.sections
            .filter(section => section.enabled !== false)
            .map(section => this.renderSection(section))
            .join('');
    }
    
    /**
     * Rendu d'une section
     */
    renderSection(section) {
        // Extraire les champs visibles
        const visibleFields = (section.fields || []).filter(field => field.visible !== false);
        
        if (visibleFields.length === 0 && !section.customContent) {
            return '';
        }
        
        // Classes de la section
        const sectionClasses = [
            'detail-viewer-section',
            section.className,
            section.collapsible && 'section-collapsible',
            section.collapsed && 'section-collapsed'
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${sectionClasses}" data-section-id="${section.id}">
                ${section.title ? `
                    <div class="section-header" ${section.collapsible ? 
                        `data-section-toggle="${section.id}"` : ''
                    }>
                        <h3 class="section-title">
                            ${section.icon ? `<span class="section-icon">${section.icon}</span>` : ''}
                            ${this.escapeHtml(section.title)}
                        </h3>
                        ${section.collapsible ? `
                            <span class="section-toggle">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 11L3 6h10z"/>
                                </svg>
                            </span>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="section-content">
                    ${section.customContent ? 
                        section.customContent : 
                        this.renderSectionFields(visibleFields, section)
                    }
                </div>
            </div>
        `;
    }
    
    /**
     * Rendu des champs d'une section
     */
    renderSectionFields(fields, section) {
        // Mode d'affichage
        const layout = section.layout || 'grid'; // 'grid' | 'list' | 'table'
        
        if (layout === 'table' && fields.length > 0) {
            return `
                <table class="section-table">
                    <tbody>
                        ${fields.map(field => `
                            <tr>
                                <td class="field-label">${this.escapeHtml(field.label)}</td>
                                <td class="field-value ${field.bold ? 'value-bold' : ''} ${field.className || ''}">
                                    ${this.getFieldValue(field)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        return `
            <div class="section-fields ${layout === 'list' ? 'fields-list' : 'fields-grid'}">
                ${fields.map(field => `
                    <div class="field-item ${field.className || ''}" ${field.fullWidth ? 'style="grid-column: 1 / -1;"' : ''}>
                        <span class="field-label">${this.escapeHtml(field.label)}</span>
                        <span class="field-value ${field.bold ? 'value-bold' : ''}">
                            ${this.getFieldValue(field)}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Obtenir la valeur d'un champ
     */
    getFieldValue(field) {
        // Valeur brute
        let value = field.value;
        
        // Si c'est une clé, extraire de data
        if (field.key && this.state.currentData) {
            value = this.getNestedValue(this.state.currentData, field.key);
        }
        
        // Valeur par défaut
        if (value === undefined || value === null || value === '') {
            return field.defaultValue || '-';
        }
        
        // Formatter si nécessaire
        if (field.formatter) {
            value = this.formatValue(value, field.formatter, field.formatterOptions);
        }
        
        // Si c'est du HTML, ne pas échapper
        if (field.html) {
            return value;
        }
        
        return this.escapeHtml(String(value));
    }
    
    /**
     * Extraire une valeur imbriquée
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    /**
     * Formater une valeur
     */
    formatValue(value, formatter, options = {}) {
        if (typeof formatter === 'function') {
            return formatter(value, options);
        }
        
        switch (formatter) {
            case 'currency':
                return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: options.currency || 'EUR'
                }).format(value);
                
            case 'number':
                return new Intl.NumberFormat('fr-FR', options).format(value);
                
            case 'percent':
                return new Intl.NumberFormat('fr-FR', {
                    style: 'percent',
                    minimumFractionDigits: options.decimals || 0
                }).format(value / 100);
                
            case 'date':
                if (!value) return '-';
                const date = value instanceof Date ? value : new Date(value);
                return date.toLocaleDateString('fr-FR', options);
                
            case 'datetime':
                if (!value) return '-';
                const datetime = value instanceof Date ? value : new Date(value);
                return datetime.toLocaleString('fr-FR', options);
                
            case 'boolean':
                return value ? (options.trueText || 'Oui') : (options.falseText || 'Non');
                
            case 'badge':
                const badgeClass = options.class || 'badge-default';
                const badgeIcon = options.icon || '';
                return `<span class="badge ${badgeClass}">${badgeIcon} ${this.escapeHtml(String(value))}</span>`;
                
            default:
                return String(value);
        }
    }
    
    /**
     * Rendu des actions
     */
    renderActions() {
        if (!this.config.actions || this.config.actions.length === 0) {
            return '';
        }
        
        return this.config.actions.map((action, index) => {
            // Classes du bouton
            const btnClass = action.class || 
                            this.config.buttonClasses[action.style || 'secondary'] || 
                            this.config.buttonClasses.secondary;
            
            // Attributs
            const disabled = action.disabled ? 'disabled' : '';
            const dataAttrs = Object.entries(action.data || {})
                .map(([key, val]) => `data-${key}="${val}"`)
                .join(' ');
            
            return `
                <button class="${btnClass}" 
                        data-action-index="${index}"
                        ${disabled}
                        ${dataAttrs}>
                    ${action.icon ? `<span class="action-icon">${action.icon}</span>` : ''}
                    ${this.escapeHtml(action.label)}
                </button>
            `;
        }).join('');
    }
    
    /**
     * Gestion d'une action
     */
    handleAction(index) {
        const action = this.config.actions[index];
        if (!action) return;
        
        // Callback spécifique de l'action
        if (action.onClick) {
            action.onClick(this.state.currentData, this);
        }
        
        // Callback global
        if (this.config.onAction) {
            this.config.onAction(action, this.state.currentData, this);
        }
        
        // Fermer si configuré
        if (action.closeOnClick !== false && action.style !== 'danger') {
            this.close();
        }
    }
    
    /**
     * Basculer une section collapsible
     */
    toggleSection(sectionId) {
        const sectionEl = this.elements.modal.querySelector(`[data-section-id="${sectionId}"]`);
        if (sectionEl) {
            sectionEl.classList.toggle('section-collapsed');
        }
    }
    
    /**
     * Attache les événements
     */
    attachEvents() {
        // Fermeture par croix
        const closeBtn = this.elements.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Fermeture par overlay
        if (this.config.closeOnOverlay) {
            this.elements.overlay.addEventListener('click', (e) => {
                if (e.target === this.elements.overlay) {
                    this.close();
                }
            });
        }
        
        // Toggle sections collapsibles (délégation d'événements)
        this.elements.modal.addEventListener('click', (e) => {
            // Gestion des sections collapsibles
            const toggleTarget = e.target.closest('[data-section-toggle]');
            if (toggleTarget) {
                const sectionId = toggleTarget.dataset.sectionToggle;
                this.toggleSection(sectionId);
            }
            
            // Gestion des boutons d'action
            const actionBtn = e.target.closest('[data-action-index]');
            if (actionBtn) {
                const index = parseInt(actionBtn.dataset.actionIndex);
                this.handleAction(index);
            }
        });
        
        // Fermeture par Escape
        if (this.config.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape' && this.state.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
    }
    
    /**
     * Anti-FOUC : affichage avec délai
     */
    showWithDelay() {
        setTimeout(() => {
            this.show();
        }, 100);
    }
    
    /**
     * Affiche le widget (transition opacity)
     */
    show() {
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    /**
     * Ouvre le modal
     */
    open() {
        if (this.state.isOpen) return;
        
        this.state.isOpen = true;
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Callback
        if (this.config.onOpen) {
            this.config.onOpen(this.state.currentData, this);
        }
        
        // Scroll au top
        setTimeout(() => {
            if (this.elements.body) {
                this.elements.body.scrollTop = 0;
            }
        }, 100);
    }
    
    /**
     * Ferme le modal
     */
    close() {
        if (!this.state.isOpen) return;
        
        this.state.isOpen = false;
        if (this.elements.overlay) {
            this.elements.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Callback
        if (this.config.onClose) {
            this.config.onClose(this.state.currentData, this);
        }
        
        // Détruire après animation si configuré
        if (this.config.destroyOnClose) {
            setTimeout(() => this.destroy(), 300);
        }
    }
    
/**
     * Met à jour les données
     */
    setData(newData) {
        this.state.currentData = { ...this.state.currentData, ...newData };
        this.refresh();
    }
    
    /**
     * Alias pour compatibilité
     * @deprecated Utiliser setData() à la place
     */
    update(newData) {
        console.warn('update() est déprécié, utiliser setData()');
        return this.setData(newData);
    }
    
    /**
     * Rafraîchit l'affichage
     */
    refresh() {
        // Sauvegarder l'état
        const wasOpen = this.state.isOpen;
        const scrollPos = this.elements.body ? this.elements.body.scrollTop : 0;
        
        // Re-render
        this.destroy(false); // Sans nettoyer les handlers
        this.render();
        this.attachEvents();
        
        // Restaurer l'état
        if (wasOpen) {
            this.open();
            if (this.elements.body) {
                this.elements.body.scrollTop = scrollPos;
            }
        }
    }
    
    /**
     * Destruction propre OBLIGATOIRE
     */
    destroy(cleanHandlers = true) {
        // Retirer les event listeners
        if (cleanHandlers && this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Retirer du DOM
        if (this.elements.overlay && this.elements.overlay.parentNode) {
            this.elements.overlay.parentNode.removeChild(this.elements.overlay);
        }
        
        // Réinitialiser état
        this.state = {
            isOpen: false,
            loaded: false,
            currentData: {}
        };
        
        // Réinitialiser éléments
        this.elements = {
            overlay: null,
            modal: null,
            body: null,
            timelineContainer: null,
            sectionsContainer: null,
            actionsContainer: null
        };
        
        console.log('🗑️ DetailViewerWidget détruit:', this.id);
    }
    
    /**
     * Helpers
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default DetailViewerWidget;