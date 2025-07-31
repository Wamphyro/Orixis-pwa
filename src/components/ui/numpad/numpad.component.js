// ========================================
// NUMPAD.COMPONENT.JS - Composant Clavier Numérique
// Chemin: src/components/ui/numpad/numpad.component.js
//
// DESCRIPTION:
// Composant réutilisable de clavier numérique
// ========================================

export class NumpadComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxLength: 4,
            onInput: null,
            onComplete: null,
            onDelete: null,
            allowDecimal: false,
            showValidate: true,
            validateOnComplete: true,
            ...options
        };
        
        this.value = '';
        this.render();
        this.attachEvents();
    }
    
    render() {
        const numpadHtml = `
            <div class="numpad">
                ${this.renderButtons()}
            </div>
        `;
        
        this.container.innerHTML = numpadHtml;
    }
    
    renderButtons() {
        const buttons = [];
        
        // Boutons 1-9
        for (let i = 1; i <= 9; i++) {
            buttons.push(`
                <button type="button" class="numpad-button" data-value="${i}">
                    ${i}
                </button>
            `);
        }
        
        // Bouton delete
        buttons.push(`
            <button type="button" class="numpad-button numpad-delete" data-action="delete">
                ←
            </button>
        `);
        
        // Bouton 0
        buttons.push(`
            <button type="button" class="numpad-button numpad-zero" data-value="0">
                0
            </button>
        `);
        
        // Bouton validate ou decimal
        if (this.options.allowDecimal) {
            buttons.push(`
                <button type="button" class="numpad-button" data-value=".">
                    .
                </button>
            `);
        } else if (this.options.showValidate) {
            buttons.push(`
                <button type="button" class="numpad-button numpad-action" data-action="validate">
                    ✓
                </button>
            `);
        } else {
            // Bouton vide pour garder la grille
            buttons.push(`<div></div>`);
        }
        
        return buttons.join('');
    }
    
    attachEvents() {
        // Event delegation
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('.numpad-button');
            if (!button) return;
            
            if (button.dataset.value) {
                this.addDigit(button.dataset.value);
            } else if (button.dataset.action) {
                this.handleAction(button.dataset.action);
            }
        });
    }
    
    addDigit(digit) {
        if (this.value.length >= this.options.maxLength) return;
        
        // Validation décimale
        if (digit === '.' && this.value.includes('.')) return;
        
        this.value += digit;
        
        // Callback
        if (this.options.onInput) {
            this.options.onInput(this.value);
        }
        
        // Auto-validate si complet
        if (this.value.length === this.options.maxLength && 
            this.options.validateOnComplete && 
            this.options.onComplete) {
            setTimeout(() => {
                this.options.onComplete(this.value);
            }, 200);
        }
    }
    
    handleAction(action) {
        switch(action) {
            case 'delete':
                this.deleteDigit();
                break;
            case 'validate':
                if (this.options.onComplete) {
                    this.options.onComplete(this.value);
                }
                break;
        }
    }
    
    deleteDigit() {
        if (this.value.length > 0) {
            this.value = this.value.slice(0, -1);
            
            if (this.options.onDelete) {
                this.options.onDelete(this.value);
            }
            
            if (this.options.onInput) {
                this.options.onInput(this.value);
            }
        }
    }
    
    // Méthodes publiques
    clear() {
        this.value = '';
        if (this.options.onInput) {
            this.options.onInput(this.value);
        }
    }
    
    setValue(value) {
        this.value = String(value);
        if (this.options.onInput) {
            this.options.onInput(this.value);
        }
    }
    
    getValue() {
        return this.value;
    }
    
    disable() {
        const buttons = this.container.querySelectorAll('.numpad-button');
        buttons.forEach(btn => btn.disabled = true);
    }
    
    enable() {
        const buttons = this.container.querySelectorAll('.numpad-button');
        buttons.forEach(btn => btn.disabled = false);
    }
}

// Auto-register si le système de composants existe
if (window.ComponentsManager?.register) {
    window.ComponentsManager.register('numpad', NumpadComponent);
}