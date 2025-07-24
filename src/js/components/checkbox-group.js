// Composant de groupe de checkboxes
export class CheckboxGroup {
    constructor(containerId, items, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container avec l'id ${containerId} introuvable`);
        }
        
        this.items = items;
        this.options = {
            multiple: true,
            defaultValues: [],
            onChange: null,
            columns: 'auto',
            disabled: false,
            ...options
        };
        
        this.selectedValues = new Set(this.options.defaultValues);
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        const columnsClass = this.getColumnsClass();
        
        const checkboxesHTML = this.items.map(item => {
            const isChecked = this.selectedValues.has(item.value);
            const itemId = `checkbox-${this.container.id}-${item.id || item.value.replace(/\s+/g, '-')}`;
            
            return `
                <div class="checkbox-item ${isChecked ? 'checked' : ''}">
                    <input 
                        type="checkbox" 
                        id="${itemId}"
                        name="${this.container.id}-group"
                        value="${item.value}"
                        ${isChecked ? 'checked' : ''}
                        ${this.options.disabled ? 'disabled' : ''}
                    >
                    <label for="${itemId}">
                        ${item.icon ? `<span class="checkbox-icon">${item.icon}</span>` : ''}
                        <span class="checkbox-label">${item.label}</span>
                        ${item.description ? `<span class="checkbox-description">${item.description}</span>` : ''}
                    </label>
                </div>
            `;
        }).join('');
        
        this.container.innerHTML = `
            <div class="checkbox-group ${columnsClass}">
                ${checkboxesHTML}
            </div>
        `;
        
        this.addStyles();
    }
    
    getColumnsClass() {
        if (this.options.columns === 'auto') {
            return 'columns-auto';
        } else if (typeof this.options.columns === 'number') {
            return `columns-${this.options.columns}`;
        }
        return '';
    }
    
    addStyles() {
        if (document.getElementById('checkbox-group-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'checkbox-group-styles';
        style.textContent = `
            .checkbox-group {
                display: grid;
                gap: 15px;
                margin: 20px 0;
            }
            
            .checkbox-group.columns-auto {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
            
            .checkbox-group.columns-1 {
                grid-template-columns: 1fr;
            }
            
            .checkbox-group.columns-2 {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .checkbox-group.columns-3 {
                grid-template-columns: repeat(3, 1fr);
            }
            
            .checkbox-item {
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                padding: 15px;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .checkbox-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .checkbox-item.checked {
                background: linear-gradient(135deg, #ebf5fb 0%, #d6eaf8 100%);
                border-color: #3498db;
            }
            
            .checkbox-item input[type="checkbox"] {
                position: absolute;
                opacity: 0;
                cursor: pointer;
            }
            
            .checkbox-item label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                position: relative;
                padding-left: 35px;
                margin: 0;
            }
            
            .checkbox-item label::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 24px;
                height: 24px;
                border: 2px solid #3498db;
                border-radius: 6px;
                background: white;
                transition: all 0.3s ease;
            }
            
            .checkbox-item.checked label::before {
                background: #3498db;
            }
            
            .checkbox-item.checked label::after {
                content: '✓';
                position: absolute;
                left: 6px;
                top: 50%;
                transform: translateY(-50%);
                color: white;
                font-weight: bold;
                font-size: 16px;
            }
            
            .checkbox-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .checkbox-label {
                font-weight: 500;
                color: #2c3e50;
                font-size: 16px;
            }
            
            .checkbox-description {
                display: block;
                font-size: 13px;
                color: #7f8c8d;
                margin-top: 5px;
            }
            
            @media (max-width: 768px) {
                .checkbox-group {
                    grid-template-columns: 1fr;
                }
                
                .checkbox-item {
                    padding: 12px;
                }
                
                .checkbox-label {
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    attachEventListeners() {
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const value = e.target.value;
                const item = e.target.closest('.checkbox-item');
                
                if (e.target.checked) {
                    if (!this.options.multiple) {
                        // Si pas multiple, décocher les autres
                        this.selectedValues.clear();
                        this.container.querySelectorAll('.checkbox-item').forEach(el => {
                            el.classList.remove('checked');
                        });
                    }
                    this.selectedValues.add(value);
                    item.classList.add('checked');
                } else {
                    this.selectedValues.delete(value);
                    item.classList.remove('checked');
                }
                
                if (this.options.onChange) {
                    this.options.onChange(this.getValues());
                }
            });
        });
        
        // Click sur tout l'item
        const items = this.container.querySelectorAll('.checkbox-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    checkbox.click();
                }
            });
        });
    }
    
    getValues() {
        return Array.from(this.selectedValues);
    }
    
    setValues(values) {
        this.selectedValues = new Set(values);
        
        // Mettre à jour l'UI
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const item = checkbox.closest('.checkbox-item');
            if (this.selectedValues.has(checkbox.value)) {
                checkbox.checked = true;
                item.classList.add('checked');
            } else {
                checkbox.checked = false;
                item.classList.remove('checked');
            }
        });
    }
    
    clear() {
        this.selectedValues.clear();
        this.container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.checkbox-item').classList.remove('checked');
        });
    }
    
    disable() {
        this.options.disabled = true;
        this.container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.disabled = true;
        });
    }
    
    enable() {
        this.options.disabled = false;
        this.container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.disabled = false;
        });
    }
    
    destroy() {
        this.container.innerHTML = '';
    }
}
