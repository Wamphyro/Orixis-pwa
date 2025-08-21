/* ========================================
   FORM-MODAL.WIDGET.JS - Widget FormModal Universal
   Chemin: /widgets/form-modal/form-modal.widget.js
   
   DESCRIPTION:
   Version améliorée du widget FormModal avec architecture découplée.
   Fonctionne comme une "prise électrique universelle".
   
   PRINCIPE:
   - Zero dépendance avec l'orchestrateur
   - Services injectables
   - Adaptateurs pour chaque type de champ
   - Configuration par composition
   
   VERSION: 2.0.0
   ======================================== */

import { loadWidgetStyles } from '/Orixis-pwa/src/utils/widget-styles-loader.js';

// ========================================
// REGISTRY DES SERVICES (Injection de dépendances)
// ========================================

class ServiceRegistry {
    static services = new Map();
    static adapters = new Map();
    
    /**
     * Enregistrer un service
     * @param {string} name - Nom du service
     * @param {object} service - Service avec ses méthodes
     */
    static registerService(name, service) {
        this.services.set(name, service);
    }
    
    /**
     * Enregistrer un adaptateur de champ
     * @param {string} type - Type de champ
     * @param {class} adapter - Classe adaptateur
     */
    static registerAdapter(type, adapter) {
        this.adapters.set(type, adapter);
    }
    
    /**
     * Récupérer un service
     */
    static getService(name) {
        const service = this.services.get(name);
        if (!service) {
            console.warn(`Service '${name}' non trouvé`);
        }
        return service;
    }
    
    /**
     * Récupérer un adaptateur
     */
    static getAdapter(type) {
        return this.adapters.get(type) || DefaultFieldAdapter;
    }
}

// ========================================
// ADAPTATEURS DE CHAMPS
// ========================================

/**
 * Adaptateur par défaut
 */
class DefaultFieldAdapter {
    constructor(field, widget) {
        this.field = field;
        this.widget = widget;
    }
    
    render(value) {
        return `<input type="text" value="${value || ''}" />`;
    }
    
    getValue(element) {
        return element.querySelector('input')?.value;
    }
    
    setValue(element, value) {
        const input = element.querySelector('input');
        if (input) input.value = value || '';
    }
    
    attachEvents(element) {
        // Par défaut, pas d'événements spéciaux
    }
    
    destroy() {
        // Nettoyage si nécessaire
    }
}

/**
 * Adaptateur pour champ de recherche universel
 */
class SearchFieldAdapter extends DefaultFieldAdapter {
    constructor(field, widget) {
        super(field, widget);
        this.searchTimeout = null;
        this.currentValue = null;
        this.resultsVisible = false;
    }
    
render(value) {
    const displayValue = this.getDisplayValue(value);
    
    return `
        <div class="field-search-universal" data-field-key="${this.field.key}" style="position: relative;">
            <input type="text" 
                   class="search-input"
                   placeholder="${this.field.placeholder || 'Rechercher...'}"
                   ${this.field.required ? 'required' : ''}
                   ${this.field.disabled ? 'disabled' : ''}>
            <div class="search-results" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 9999;"></div>
            ${value ? `
                <div class="search-selected">
                    <span class="selected-label">${displayValue}</span>
                    <button class="btn-remove" type="button">×</button>
                </div>
            ` : ''}
            <input type="hidden" 
                   name="${this.field.key}" 
                   value="${this.getValueId(value)}">
        </div>
    `;
}
    
    getDisplayValue(value) {
        if (!value) return '';
        
        // Si on a un renderer custom
        if (this.field.displayValue && typeof this.field.displayValue === 'function') {
            return this.field.displayValue(value);
        }
        
        // Sinon, affichage par défaut
        if (typeof value === 'object') {
            return value.label || value.name || value.toString();
        }
        
        return String(value);
    }
    
    getValueId(value) {
        if (!value) return '';
        
        // Si on a un extracteur d'ID custom
        if (this.field.valueId && typeof this.field.valueId === 'function') {
            return this.field.valueId(value);
        }
        
        // Sinon, extraction par défaut
        if (typeof value === 'object') {
            return value.id || value.value || '';
        }
        
        return String(value);
    }
    
    getValue(element) {
        return this.currentValue;
    }
    
    setValue(element, value) {
        this.currentValue = value;
        // Mettre à jour l'affichage
        const container = element.querySelector('.field-search-universal');
        if (container) {
            container.innerHTML = this.render(value);
            this.attachEvents(element);
        }
    }
    
    // NOUVEAU CODE
    attachEvents(element) {
        const container = element.querySelector('.field-search-universal');
        if (!container) return;
        
        const input = container.querySelector('.search-input');
        const results = container.querySelector('.search-results');
        
        // ⚡ NOUVEAU : Afficher tous les résultats au focus si showAllOnFocus
        if (this.field.showAllOnFocus) {
            input?.addEventListener('focus', async (e) => {
                // Si le champ est vide ou si on veut toujours montrer
                if (!e.target.value || this.field.showAllOnFocus) {
                    // Déclencher une recherche vide pour avoir tous les résultats
                    await this.performSearch('', results);
                    this.resultsVisible = true;
                }
            });
        }
        
        // Recherche avec debounce (existant)
        input?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value, results);
            }, this.field.debounce || 300);
        });
        
        // ⚡ AMÉLIORATION : Fermer seulement si on clique vraiment ailleurs
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                results.style.display = 'none';
                this.resultsVisible = false;
            }
        });
        
        // Supprimer la sélection (existant)
        const removeBtn = container.querySelector('.btn-remove');
        removeBtn?.addEventListener('click', () => {
            this.setValue(element, null);
        });
    }
    
    // NOUVEAU CODE
    async performSearch(query, resultsElement) {
        // ⚡ MODIFICATION : Permettre la recherche vide si showAllOnFocus
        const minLength = this.field.minLength ?? 2;
        
        if (!this.field.showAllOnFocus && (!query || query.length < minLength)) {
            resultsElement.style.display = 'none';
            return;
        }
        
        // ⚡ Si showAllOnFocus et pas de query, on veut quand même chercher
        if (this.field.showAllOnFocus && !query) {
            query = '';  // Forcer une query vide
        }
        
        try {
            // Obtenir le service de recherche
            const searchMethod = this.getSearchMethod();
            if (!searchMethod) {
                console.error('Aucune méthode de recherche configurée');
                return;
            }
            
            // Effectuer la recherche
            const results = await searchMethod(query);
            
            // Afficher les résultats
            this.displayResults(results, resultsElement);
            
        } catch (error) {
            console.error('Erreur recherche:', error);
            resultsElement.innerHTML = '<div class="search-error">Erreur de recherche</div>';
            resultsElement.style.display = 'block';
        }
    }
    
    getSearchMethod() {
        // 1. Méthode directe
        if (this.field.onSearch && typeof this.field.onSearch === 'function') {
            return this.field.onSearch;
        }
        
        // 2. Via un service
        if (this.field.service) {
            const service = ServiceRegistry.getService(this.field.service);
            if (service && service.search) {
                return (query) => service.search(query, this.field.searchOptions);
            }
        }
        
        // 3. Via une URL
        if (this.field.searchUrl) {
            return async (query) => {
                const url = this.field.searchUrl.replace('{query}', encodeURIComponent(query));
                const response = await fetch(url);
                return await response.json();
            };
        }
        
        return null;
    }
    
    displayResults(results, resultsElement) {
        if (!results || results.length === 0) {
            resultsElement.style.display = 'none';
            return;
        }
        
        resultsElement.innerHTML = results.map((result, index) => `
            <div class="search-result-item" data-result-index="${index}">
                ${this.renderResult(result)}
            </div>
        `).join('');
        
        resultsElement.style.display = 'block';
        
        // Attacher les événements de sélection
        resultsElement.querySelectorAll('.search-result-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectResult(results[index], resultsElement);
            });
        });
    }
    
    renderResult(result) {
        // Renderer custom
        if (this.field.renderResult && typeof this.field.renderResult === 'function') {
            return this.field.renderResult(result);
        }
        
        // Renderer par défaut
        return `<div class="search-result-default">${this.getDisplayValue(result)}</div>`;
    }
    
    selectResult(result, resultsElement) {
        const container = resultsElement.closest('.field-search-universal');
        const hiddenInput = container.querySelector('input[type="hidden"]');
        const searchInput = container.querySelector('.search-input');
        
        // Si clearOnSelect est FALSE, on garde le comportement normal
        if (!this.field.clearOnSelect) {
            // Stocker la valeur
            this.currentValue = result;
            
            // Valeur cachée
            if (hiddenInput) {
                hiddenInput.value = this.getValueId(result);
            }
            
            // Vider la recherche
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Masquer les résultats
            resultsElement.style.display = 'none';
            
            // Afficher la sélection
            let selectedEl = container.querySelector('.search-selected');
            if (!selectedEl) {
                selectedEl = document.createElement('div');
                selectedEl.className = 'search-selected';
                container.appendChild(selectedEl);
            }
            
            selectedEl.innerHTML = `
                <span class="selected-label">${this.getDisplayValue(result)}</span>
                <button class="btn-remove" type="button">×</button>
            `;
            
            selectedEl.querySelector('.btn-remove').addEventListener('click', () => {
                this.setValue(container.parentElement, null);
            });
        } 
        // Si clearOnSelect est TRUE, on ne garde RIEN
        else {
            // NE PAS stocker la valeur
            this.currentValue = null;
            
            // Vider tous les champs
            if (hiddenInput) hiddenInput.value = '';
            if (searchInput) searchInput.value = '';
            
            // Masquer les résultats
            resultsElement.style.display = 'none';
            
            // SUPPRIMER toute sélection affichée
            const selectedEl = container.querySelector('.search-selected');
            if (selectedEl) {
                selectedEl.remove();
            }
        }
        
        // Callback (toujours appelé avec le result)
        if (this.field.onSelect) {
            this.field.onSelect(result);
        }
        
        // Événement change avec la bonne valeur
        this.widget.handleFieldChange(
            this.field.key, 
            this.field.clearOnSelect ? null : result
        );
    }
    
    destroy() {
        clearTimeout(this.searchTimeout);
    }
}

/**
 * Adaptateur pour panier universel
 */
class CartFieldAdapter extends DefaultFieldAdapter {
    render(value) {
        const items = value || [];
        
        return `
            <div class="field-cart-universal" data-field-key="${this.field.key}">
                ${items.length > 0 ? this.renderItems(items) : this.renderEmpty()}
            </div>
        `;
    }
    
    renderItems(items) {
        return `
            <div class="cart-items">
                ${items.map((item, index) => this.renderItem(item, index)).join('')}
            </div>
            <div class="cart-summary">
                ${this.renderSummary(items)}
            </div>
        `;
    }
    
    renderItem(item, index) {
        // Renderer custom
        if (this.field.renderItem && typeof this.field.renderItem === 'function') {
            return this.field.renderItem(item, index);
        }
        
        // Renderer par défaut
        return `
            <div class="cart-item" data-item-index="${index}">
                <div class="cart-item-info">
                    <span class="item-name">${item.name || item.label || 'Article'}</span>
                    ${item.description ? `<span class="item-desc">${item.description}</span>` : ''}
                </div>
                <div class="cart-item-actions">
                    ${this.field.editable !== false ? `
                        <input type="number" 
                               class="item-quantity" 
                               value="${item.quantity || 1}" 
                               min="1"
                               data-item-index="${index}">
                        <button class="btn-remove-item" 
                                type="button"
                                data-item-index="${index}">×</button>
                    ` : `
                        <span class="item-quantity-readonly">×${item.quantity || 1}</span>
                    `}
                </div>
            </div>
        `;
    }
    
    renderSummary(items) {
        // Summary custom
        if (this.field.renderSummary && typeof this.field.renderSummary === 'function') {
            return this.field.renderSummary(items);
        }
        
        // Summary par défaut
        const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        return `<span>${items.length} article(s) • Total: ${total}</span>`;
    }
    
    renderEmpty() {
        // Empty custom
        if (this.field.renderEmpty && typeof this.field.renderEmpty === 'function') {
            return this.field.renderEmpty();
        }
        
        // Empty par défaut
        return `
            <div class="cart-empty">
                <span class="empty-icon">🛒</span>
                <p>${this.field.emptyText || 'Panier vide'}</p>
            </div>
        `;
    }
    
    getValue(element) {
        // Récupérer depuis le widget
        return this.widget.getFieldValue(this.field.key) || [];
    }
    
    setValue(element, value) {
        // Mettre à jour dans le widget
        this.widget.setFieldValue(this.field.key, value);
        // Rafraîchir l'affichage
        const container = element.querySelector('.field-cart-universal');
        if (container) {
            container.innerHTML = this.render(value);
            this.attachEvents(element);
        }
    }
    
    attachEvents(element) {
        const container = element.querySelector('.field-cart-universal');
        if (!container) return;
        
        // Changement quantité
        container.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.itemIndex);
                const quantity = parseInt(e.target.value) || 1;
                this.updateQuantity(index, quantity);
            });
        });
        
        // Suppression
        container.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.itemIndex);
                this.removeItem(index);
            });
        });
    }
    
    updateQuantity(index, quantity) {
        const items = this.getValue();
        if (items[index]) {
            items[index].quantity = quantity;
            this.setValue(this.widget.elements.content, items);
            
            // Callback
            if (this.field.onQuantityChange) {
                this.field.onQuantityChange(items[index], quantity, index);
            }
        }
    }
    
    removeItem(index) {
        const items = this.getValue();
        const removed = items.splice(index, 1)[0];
        this.setValue(this.widget.elements.content, items);
        
        // Callback
        if (this.field.onRemoveItem) {
            this.field.onRemoveItem(removed, index);
        }
    }
}

/**
 * Adaptateur pour champ SELECT
 */
class SelectFieldAdapter extends DefaultFieldAdapter {
    render(value) {
        const options = this.field.options || [];
        const placeholder = this.field.placeholder || '-- Sélectionner --';
        
        return `
            <select class="field-select" 
                    ${this.field.required ? 'required' : ''}
                    ${this.field.disabled ? 'disabled' : ''}
                    ${this.field.searchable ? 'data-searchable="true"' : ''}>
                ${placeholder ? `<option value="">${placeholder}</option>` : ''}
                ${options.map(opt => `
                    <option value="${opt.value}" 
                            ${value === opt.value ? 'selected' : ''}>
                        ${opt.label}
                    </option>
                `).join('')}
            </select>
        `;
    }
    
    getValue(element) {
        return element.querySelector('select')?.value || '';
    }
    
    setValue(element, value) {
        const select = element.querySelector('select');
        if (select) select.value = value || '';
    }
    
    attachEvents(element) {
        const select = element.querySelector('select');
        if (!select) return;
        
        select.addEventListener('change', (e) => {
            const value = e.target.value;
            this.widget.setFieldValue(this.field.key, value);
            
            if (this.field.onChange) {
                this.field.onChange(value);
            }
        });
    }
}

/**
 * Adaptateur pour RADIO GROUP
 */
class RadioGroupAdapter extends DefaultFieldAdapter {
    render(value) {
        const options = this.field.options || [];
        const name = `radio-${this.field.key}-${Date.now()}`;
        
        return `
            <div class="field-radio-group">
                ${options.map(opt => `
                    <label class="radio-option">
                        <input type="radio" 
                               name="${name}"
                               value="${opt.value}"
                               ${value === opt.value ? 'checked' : ''}
                               ${this.field.required && !value ? 'required' : ''}
                               ${this.field.disabled ? 'disabled' : ''}>
                        <span class="radio-label">${opt.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }
    
    getValue(element) {
        const checked = element.querySelector('input[type="radio"]:checked');
        return checked?.value || this.field.defaultValue || '';
    }
    
    setValue(element, value) {
        const radio = element.querySelector(`input[value="${value}"]`);
        if (radio) radio.checked = true;
    }
    
    attachEvents(element) {
        const radios = element.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const value = e.target.value;
                    this.widget.setFieldValue(this.field.key, value);
                    
                    if (this.field.onChange) {
                        this.field.onChange(value);
                    }
                }
            });
        });
    }
}

/**
 * Adaptateur pour DATE
 */
class DateFieldAdapter extends DefaultFieldAdapter {
    render(value) {
        // Formater la date au format YYYY-MM-DD si nécessaire
        let dateValue = value || this.field.defaultValue || '';
        if (dateValue && typeof dateValue === 'object') {
            dateValue = dateValue.toISOString().split('T')[0];
        }
        
        return `
            <input type="date" 
                   class="field-input"
                   value="${dateValue}"
                   ${this.field.min ? `min="${this.field.min}"` : ''}
                   ${this.field.max ? `max="${this.field.max}"` : ''}
                   ${this.field.required ? 'required' : ''}
                   ${this.field.disabled ? 'disabled' : ''}>
        `;
    }
    
    getValue(element) {
        return element.querySelector('input[type="date"]')?.value || '';
    }
    
    setValue(element, value) {
        const input = element.querySelector('input[type="date"]');
        if (input) {
            if (value && typeof value === 'object') {
                input.value = value.toISOString().split('T')[0];
            } else {
                input.value = value || '';
            }
        }
    }
    
    attachEvents(element) {
        const input = element.querySelector('input[type="date"]');
        if (!input) return;
        
        input.addEventListener('change', (e) => {
            const value = e.target.value;
            this.widget.setFieldValue(this.field.key, value);
            
            if (this.field.onChange) {
                this.field.onChange(value);
            }
        });
    }
}

/**
 * Adaptateur pour TEXTAREA
 */
class TextareaFieldAdapter extends DefaultFieldAdapter {
    render(value) {
        return `
            <textarea class="field-textarea"
                      rows="${this.field.rows || 3}"
                      placeholder="${this.field.placeholder || ''}"
                      ${this.field.maxLength ? `maxlength="${this.field.maxLength}"` : ''}
                      ${this.field.required ? 'required' : ''}
                      ${this.field.disabled ? 'disabled' : ''}>${value || ''}</textarea>
            ${this.field.maxLength ? `
                <div class="field-counter">
                    <span class="counter-current">${(value || '').length}</span>
                    / ${this.field.maxLength}
                </div>
            ` : ''}
        `;
    }
    
    getValue(element) {
        return element.querySelector('textarea')?.value || '';
    }
    
    setValue(element, value) {
        const textarea = element.querySelector('textarea');
        if (textarea) {
            textarea.value = value || '';
            this.updateCounter(element, value);
        }
    }
    
    attachEvents(element) {
        const textarea = element.querySelector('textarea');
        if (!textarea) return;
        
        textarea.addEventListener('input', (e) => {
            const value = e.target.value;
            this.widget.setFieldValue(this.field.key, value);
            this.updateCounter(element, value);
            
            if (this.field.onChange) {
                this.field.onChange(value);
            }
        });
    }
    
    updateCounter(element, value) {
        if (!this.field.maxLength) return;
        const counter = element.querySelector('.counter-current');
        if (counter) {
            counter.textContent = (value || '').length;
        }
    }
}

/**
 * Adaptateur pour SUMMARY (récapitulatif)
 */
class SummaryFieldAdapter extends DefaultFieldAdapter {
    render(value) {
        // Le template est une fonction qui reçoit toutes les données
        const data = this.widget.getData();
        let content = '';
        
        if (this.field.template && typeof this.field.template === 'function') {
            content = this.field.template(data);
        } else {
            content = '<p>Récapitulatif non configuré</p>';
        }
        
        return `
            <div class="field-summary">
                ${content}
            </div>
        `;
    }
    
    getValue(element) {
        // Un summary n'a pas de valeur
        return null;
    }
    
    setValue(element, value) {
        // On rafraîchit juste l'affichage
        const container = element.querySelector('.field-summary');
        if (container) {
            const data = this.widget.getData();
            if (this.field.template && typeof this.field.template === 'function') {
                container.innerHTML = this.field.template(data);
            }
        }
    }
    
    attachEvents(element) {
        // Pas d'événements pour un summary
    }
}

// ========================================
// ENREGISTRER LES ADAPTATEURS PAR DÉFAUT
// ========================================

ServiceRegistry.registerAdapter('search', SearchFieldAdapter);
ServiceRegistry.registerAdapter('cart', CartFieldAdapter);
ServiceRegistry.registerAdapter('product-cart', CartFieldAdapter);
ServiceRegistry.registerAdapter('select', SelectFieldAdapter);
ServiceRegistry.registerAdapter('radio-group', RadioGroupAdapter);
ServiceRegistry.registerAdapter('date', DateFieldAdapter);
ServiceRegistry.registerAdapter('textarea', TextareaFieldAdapter);
ServiceRegistry.registerAdapter('summary', SummaryFieldAdapter);

// ========================================
// WIDGET PRINCIPAL
// ========================================

export class FormModalWidget {
    constructor(config = {}) {
        // Configuration
        this.config = this.mergeConfig(config);
        
        // État
        this.state = {
            isOpen: false,
            currentStep: 0,
            data: { ...this.config.initialData },
            errors: {},
            touched: {},
            pristine: true,
            processing: false
        };
        
        // Éléments DOM
        this.elements = {};
        
        // Adaptateurs actifs
        this.adapters = new Map();
        
        // ID unique
        this.id = 'form-modal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Charger CSS
        this.loadCSS();
        
        // Initialiser
        this.init();
    }
    
    /**
     * Configuration par défaut complète
     */
    mergeConfig(config) {
        return {
            // Base
            title: 'Formulaire',
            theme: 'purple',
            size: 'large',
            height: null,  // ← AJOUTER
            minHeight: null,  // ← AJOUTER
            maxHeight: null,  // ← AJOUTER
            steps: [],
            
            // Services (injection de dépendances)
            services: {},
            
            // Timeline
            timeline: {
                enabled: true,
                clickable: true,
                ...config.timeline
            },
            
            // Navigation
            navigation: {
                showPrevious: true,
                showNext: true,
                previousText: '← Précédent',
                nextText: 'Suivant →',
                finishText: '✓ Terminer',
                ...config.navigation
            },
            
            // Validation
            validation: {
                enabled: true,
                validateOnNext: true,
                ...config.validation
            },
            
            // Données
            initialData: {},
            
            // Callbacks
            onOpen: null,
            onClose: null,
            onSave: null,
            onStepChange: null,
            onFieldChange: null,
            onValidateStep: null,
            
            ...config
        };
    }
    
    /**
     * Charger CSS
     */
    loadCSS() {
        loadWidgetStyles();
        
        const cssId = 'form-modal-widget-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `/widgets/form-modal/form-modal.widget.css?v=${Date.now()}`;
            document.head.appendChild(link);
        }
    }
    
    /**
     * Initialisation
     */
    init() {
        // Enregistrer les services fournis
        Object.entries(this.config.services).forEach(([name, service]) => {
            ServiceRegistry.registerService(name, service);
        });
        
        this.render();
        this.attachEvents();
        
        if (this.config.autoOpen) {
            this.open();
        }
    }
    
    /**
     * Rendu principal
     */
    render() {
        // Créer overlay
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'modal-overlay form-modal-overlay';
        
        // Créer modal
        this.elements.modal = document.createElement('div');
        this.elements.modal.className = `modal-container form-modal modal-${this.config.size}`;

        if (this.config.height) {
        this.elements.modal.style.height = this.config.height;
        }
        if (this.config.minHeight) {
            this.elements.modal.style.minHeight = this.config.minHeight;
        }
        if (this.config.maxHeight) {
            this.elements.modal.style.maxHeight = this.config.maxHeight;
        }
        
        // Structure
        this.elements.modal.innerHTML = `
            <div class="modal-header form-modal-header">
                <h2 class="modal-title">${this.config.title}</h2>
                <button class="modal-close">×</button>
            </div>
            
            ${this.config.timeline.enabled ? `
                <div class="form-modal-timeline-container">
                    ${this.renderTimeline()}
                </div>
            ` : ''}
            
            <div class="modal-body form-modal-body">
                <div class="form-modal-content">
                    ${this.renderCurrentStep()}
                </div>
            </div>
            
            <div class="modal-footer form-modal-footer">
                ${this.renderNavigation()}
            </div>
        `;
        
        this.elements.overlay.appendChild(this.elements.modal);
        document.body.appendChild(this.elements.overlay);
        
        // Références
        this.elements.content = this.elements.modal.querySelector('.form-modal-content');
        
        // Initialiser les adaptateurs pour l'étape courante
        this.initializeAdapters();
    }
    
    /**
     * Initialiser les adaptateurs de l'étape courante
     */
    initializeAdapters() {
        const step = this.config.steps[this.state.currentStep];
        if (!step || !step.fields) return;
        
        // Nettoyer les anciens adaptateurs
        this.adapters.forEach(adapter => {
            if (adapter.destroy) adapter.destroy();
        });
        this.adapters.clear();
        
        // Créer les nouveaux adaptateurs
        step.fields.forEach(field => {
            if (!field.type || !field.key) return;
            
            const AdapterClass = ServiceRegistry.getAdapter(field.type);
            const adapter = new AdapterClass(field, this);
            this.adapters.set(field.key, adapter);
            
            // Attacher les événements
            const fieldElement = this.elements.content.querySelector(`[data-field-key="${field.key}"]`);
            if (fieldElement && adapter.attachEvents) {
                adapter.attachEvents(fieldElement);
            }
        });
    }
    
    /**
     * Rendu de la timeline
     */
    renderTimeline() {
        const progress = ((this.state.currentStep + 0.5) / this.config.steps.length) * 100;
        
        return `
            <div class="form-modal-timeline timeline-horizontal" style="--progress: ${progress}%;">
                <div class="timeline-connector"></div>
                <div class="timeline-items">
                    ${this.config.steps.map((step, index) => `
                        <div class="timeline-item ${this.getTimelineItemClass(index)}" 
                             data-step-index="${index}">
                            <div class="timeline-icon-wrapper">
                                <div class="timeline-icon">
                                    ${index < this.state.currentStep ? '✓' : (index + 1)}
                                </div>
                            </div>
                            <div class="timeline-label">${step.title}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    getTimelineItemClass(index) {
        const classes = ['timeline-item'];
        if (index === this.state.currentStep) {
            classes.push('timeline-item-active');
        } else if (index < this.state.currentStep) {
            classes.push('timeline-item-completed');
        }
        if (this.config.timeline.clickable) {
            classes.push('timeline-item-clickable');
        }
        return classes.join(' ');
    }
    
    /**
     * Rendu de l'étape courante
     */
    renderCurrentStep() {
        const step = this.config.steps[this.state.currentStep];
        if (!step) return '';
        
        return `
            <div class="form-modal-step">
                ${step.title ? `
                    <div class="step-header">
                        <h3 class="step-title">${step.title}</h3>
                        ${step.description ? `<p class="step-description">${step.description}</p>` : ''}
                    </div>
                ` : ''}
                
                <div class="step-fields">
                    ${this.renderFields(step.fields || [])}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendu des champs
     */
    renderFields(fields) {
        return fields.map(field => this.renderField(field)).join('');
    }
    
    /**
     * Rendu d'un champ
     */
    renderField(field) {
        // Récupérer l'adaptateur
        const AdapterClass = ServiceRegistry.getAdapter(field.type);
        const adapter = new AdapterClass(field, this);
        
        // Récupérer la valeur
        const value = this.getFieldValue(field.key);
        
        // Wrapper
        return `
            <div class="form-field field-type-${field.type}" data-field-key="${field.key || ''}">
                ${field.label ? `
                    <label class="field-label">
                        ${field.label}
                        ${field.required ? '<span class="field-required-mark">*</span>' : ''}
                    </label>
                ` : ''}
                ${adapter.render(value)}
                ${field.help ? `<span class="field-help">${field.help}</span>` : ''}
            </div>
        `;
    }
    
    /**
     * Rendu de la navigation
     */
    renderNavigation() {
        const isFirst = this.state.currentStep === 0;
        const isLast = this.state.currentStep === this.config.steps.length - 1;
        
        return `
            <div class="form-modal-navigation">
                ${!isFirst && this.config.navigation.showPrevious ? `
                    <button class="btn btn-secondary btn-previous">
                        ${this.config.navigation.previousText}
                    </button>
                ` : '<div></div>'}
                
                <div></div>
                
                ${this.config.navigation.showNext ? `
                    <button class="btn btn-primary btn-next">
                        ${isLast ? this.config.navigation.finishText : this.config.navigation.nextText}
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Attacher les événements
     */
    attachEvents() {
        // Fermeture
        this.elements.modal.querySelector('.modal-close')?.addEventListener('click', () => {
            this.close();
        });
        
        // Navigation
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target.closest('.btn-previous')) {
                this.previousStep();
            } else if (e.target.closest('.btn-next')) {
                this.nextStep();
            } else if (e.target.closest('.timeline-item-clickable')) {
                const index = parseInt(e.target.closest('.timeline-item').dataset.stepIndex);
                this.goToStep(index);
            }
        });
        
        // Changements de valeur
        this.elements.modal.addEventListener('change', (e) => {
            const field = e.target.closest('[data-field-key]');
            if (field) {
                const fieldKey = field.dataset.fieldKey;
                this.updateFieldValue(fieldKey);
            }
        });
    }
    
    /**
     * Mettre à jour la valeur d'un champ
     */
    updateFieldValue(fieldKey) {
        const adapter = this.adapters.get(fieldKey);
        if (!adapter) return;
        
        const fieldElement = this.elements.content.querySelector(`[data-field-key="${fieldKey}"]`);
        if (!fieldElement) return;
        
        const value = adapter.getValue(fieldElement);
        this.setFieldValue(fieldKey, value);
    }
    
    /**
     * Gestion du changement de champ
     */
    handleFieldChange(fieldKey, value) {
        this.state.touched[fieldKey] = true;
        this.state.pristine = false;
        
        if (this.config.onFieldChange) {
            this.config.onFieldChange(fieldKey, value, this.state.data);
        }
    }
    
    /**
     * Navigation
     */
    async nextStep() {
        const isLast = this.state.currentStep === this.config.steps.length - 1;
        
        // Validation
        if (this.config.validation.validateOnNext) {
            const isValid = await this.validateCurrentStep();
            if (!isValid) return;
        }
        
        if (isLast) {
            await this.finish();
        } else {
            this.state.currentStep++;
            this.refresh();
            
            if (this.config.onStepChange) {
                this.config.onStepChange(this.state.currentStep - 1, this.state.currentStep, this.state.data);
            }
        }
    }
    
    previousStep() {
        if (this.state.currentStep > 0) {
            this.state.currentStep--;
            this.refresh();
            
            if (this.config.onStepChange) {
                this.config.onStepChange(this.state.currentStep + 1, this.state.currentStep, this.state.data);
            }
        }
    }
    
    goToStep(index) {
        if (index >= 0 && index < this.config.steps.length && index !== this.state.currentStep) {
            const oldStep = this.state.currentStep;
            this.state.currentStep = index;
            this.refresh();
            
            if (this.config.onStepChange) {
                this.config.onStepChange(oldStep, index, this.state.data);
            }
        }
    }
    
    /**
     * Validation
     */
    async validateCurrentStep() {
        if (this.config.onValidateStep) {
            const result = await this.config.onValidateStep(this.state.currentStep, this.state.data);
            if (result !== true) {
                if (result.errors) {
                    this.state.errors = result.errors;
                }
                return false;
            }
        }
        return true;
    }
    
    /**
     * Terminer
     */
    async finish() {
        if (this.state.processing) return;
        
        this.state.processing = true;
        
        try {
            if (this.config.onSave) {
                await this.config.onSave(this.state.data);
            }
            
            setTimeout(() => this.close(), 500);
            
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        } finally {
            this.state.processing = false;
        }
    }
    
    /**
     * Rafraîchir l'affichage
     */
    async refresh() {
    // Appeler le hook onBeforeShow si présent
    await this.showStep(this.state.currentStep);
    
    // Timeline
    const timeline = this.elements.modal.querySelector('.form-modal-timeline-container');
    if (timeline) {
        timeline.innerHTML = this.renderTimeline();
    }
    
    // Contenu
    this.elements.content.innerHTML = this.renderCurrentStep();
    
    // Navigation
    const footer = this.elements.modal.querySelector('.form-modal-footer');
    if (footer) {
        footer.innerHTML = this.renderNavigation();
    }
    
    // Réinitialiser les adaptateurs
    this.initializeAdapters();
}
    
    /**
     * Gestion des données
     */
    getFieldValue(key) {
        if (!key) return undefined;
        return key.split('.').reduce((obj, k) => obj?.[k], this.state.data);
    }
    
    setFieldValue(key, value) {
        if (!key) return;
        
        const keys = key.split('.');
        const lastKey = keys.pop();
        
        let target = this.state.data;
        for (const k of keys) {
            if (!target[k]) target[k] = {};
            target = target[k];
        }
        
        target[lastKey] = value;
    }
    
    getData() {
        return { ...this.state.data };
    }
    
    /**
     * Ouverture/Fermeture
     */
    open() {
        this.state.isOpen = true;
        this.elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (this.config.onOpen) {
            this.config.onOpen(this);
        }
    }
    
    close() {
        this.state.isOpen = false;
        this.elements.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        if (this.config.onClose) {
            this.config.onClose(this);
        }
        
        if (this.config.destroyOnClose) {
            setTimeout(() => this.destroy(), 300);
        }
    }
    
    /**
     * Destruction
     */
    destroy() {
        // Nettoyer les adaptateurs
        this.adapters.forEach(adapter => {
            if (adapter.destroy) adapter.destroy();
        });
        this.adapters.clear();
        
        // Retirer du DOM
        if (this.elements.overlay?.parentNode) {
            this.elements.overlay.parentNode.removeChild(this.elements.overlay);
        }
        
        // Réinitialiser
        this.state = {};
        this.elements = {};
    }
    
    /**
     * Méthode pour rafraîchir uniquement l'étape courante
     * Plus performant que refresh() complet
     */
    refreshCurrentStep() {
        const step = this.config.steps[this.state.currentStep];
        if (!step || !step.fields) return;
        
        // Pour chaque champ, mettre à jour seulement si nécessaire
        step.fields.forEach(field => {
            const adapter = this.adapters.get(field.key);
            if (adapter) {
                const fieldElement = this.elements.content.querySelector(`[data-field-key="${field.key}"]`);
                if (fieldElement) {
                    const currentValue = this.getFieldValue(field.key);
                    adapter.setValue(fieldElement, currentValue);
                }
            }
        });
    }

    /**
     * Met à jour le contenu sans recréer tout le modal
     */
    updateContent(newData) {
        // Mettre à jour les données
        this.state.currentData = { ...this.state.currentData, ...newData };
        this.config.data = this.state.currentData;
        
        // Re-render uniquement la timeline si elle existe
        const timelineZone = this.elements.modal.querySelector('.detail-viewer-timeline-zone');
        if (timelineZone && this.config.timeline.enabled) {
            timelineZone.innerHTML = this.renderTimeline();
        }
        
        // Re-render uniquement les sections
        const sectionsContainer = this.elements.modal.querySelector('.detail-viewer-sections');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = this.renderSections();
        }
        
        // Re-render les actions si elles ont changé
        const footer = this.elements.modal.querySelector('.modal-footer');
        if (footer && this.config.actions.length > 0) {
            footer.innerHTML = this.renderActions();
        }
        
        console.log('✅ Contenu mis à jour sans fermer le modal');
    }

    /**
     * Hook pour exécuter du code avant d'afficher une étape
     */
    async showStep(stepIndex) {
        const step = this.config.steps[stepIndex];
        if (step && step.onBeforeShow) {
            await step.onBeforeShow();
        }
    }

}

// ========================================
// EXPORT ET HELPERS
// ========================================

// Export du widget principal
export default FormModalWidget;

// Export du registry pour utilisation externe
export { ServiceRegistry };

// Helper pour créer facilement un formulaire
export function createForm(config) {
    return new FormModalWidget(config);
}

// Helper pour enregistrer un service global
export function registerGlobalService(name, service) {
    ServiceRegistry.registerService(name, service);
}

// Helper pour enregistrer un adaptateur custom
export function registerFieldAdapter(type, adapter) {
    ServiceRegistry.registerAdapter(type, adapter);
}