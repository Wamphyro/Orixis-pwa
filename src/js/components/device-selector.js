// Composant de sélection de type d'appareil
export class DeviceSelector {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container avec l'id ${containerId} introuvable`);
        }
        
        this.options = {
            defaultValue: null,
            onChange: null,
            disabled: false,
            ...options
        };
        
        this.selectedDevice = this.options.defaultValue;
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="device-selector">
                <label class="device-option">
                    <input type="radio" name="device-type" value="BTE" ${this.selectedDevice === 'BTE' ? 'checked' : ''} ${this.options.disabled ? 'disabled' : ''}>
                    <div class="device-card bte">
                        <div class="device-icon">🎧</div>
                        <h4>BTE</h4>
                        <p>Contour d'oreille classique</p>
                        <div class="device-features">
                            <span class="feature">• Pile 13 ou 675</span>
                            <span class="feature">• Tube + embout</span>
                            <span class="feature">• Plus puissant</span>
                        </div>
                    </div>
                </input>
                
                <label class="device-option">
                    <input type="radio" name="device-type" value="RIC" ${this.selectedDevice === 'RIC' ? 'checked' : ''} ${this.options.disabled ? 'disabled' : ''}>
                    <div class="device-card ric">
                        <div class="device-icon">🔊</div>
                        <h4>RIC/RIE</h4>
                        <p>Écouteur dans l'oreille</p>
                        <div class="device-features">
                            <span class="feature">• Pile 10, 312 ou 13</span>
                            <span class="feature">• Écouteur + dôme</span>
                            <span class="feature">• Plus discret</span>
                        </div>
                    </div>
                </label>
                
                <label class="device-option">
                    <input type="radio" name="device-type" value="ITE" ${this.selectedDevice === 'ITE' ? 'checked' : ''} ${this.options.disabled ? 'disabled' : ''}>
                    <div class="device-card ite">
                        <div class="device-icon">🦻</div>
                        <h4>ITE/ITC/CIC</h4>
                        <p>Intra-auriculaire</p>
                        <div class="device-features">
                            <span class="feature">• Pile 10 ou 312</span>
                            <span class="feature">• Sur-mesure</span>
                            <span class="feature">• Dans l'oreille</span>
                        </div>
                    </div>
                </label>
            </div>
        `;
        
        this.addStyles();
    }
    
    addStyles() {
        if (document.getElementById('device-selector-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'device-selector-styles';
        style.textContent = `
            .device-selector {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            
            .device-option {
                cursor: pointer;
                position: relative;
            }
            
            .device-option input[type="radio"] {
                position: absolute;
                opacity: 0;
            }
            
            .device-card {
                background: white;
                border: 3px solid #e0e0e0;
                border-radius: 15px;
                padding: 25px;
                text-align: center;
                transition: all 0.3s ease;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .device-option input[type="radio"]:checked + .device-card {
                transform: scale(1.05);
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            }
            
            .device-option input[type="radio"]:checked + .device-card.bte {
                border-color: #3498db;
                background: linear-gradient(135deg, #ebf5fb 0%, #d6eaf8 100%);
            }
            
            .device-option input[type="radio"]:checked + .device-card.ric {
                border-color: #e74c3c;
                background: linear-gradient(135deg, #fdedec 0%, #fadbd8 100%);
            }
            
            .device-option input[type="radio"]:checked + .device-card.ite {
                border-color: #27ae60;
                background: linear-gradient(135deg, #e8f8f5 0%, #d5f4e6 100%);
            }
            
            .device-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }
            
            .device-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .device-card h4 {
                font-size: 24px;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .device-card p {
                color: #7f8c8d;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            .device-features {
                text-align: left;
                margin-top: auto;
            }
            
            .feature {
                display: block;
                font-size: 13px;
                color: #666;
                margin: 5px 0;
            }
            
            @media (max-width: 768px) {
                .device-selector {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    attachEventListeners() {
        const radios = this.container.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedDevice = e.target.value;
                    if (this.options.onChange) {
                        this.options.onChange(this.selectedDevice);
                    }
                }
            });
        });
    }
    
    getValue() {
        return this.selectedDevice;
    }
    
    setValue(value) {
        this.selectedDevice = value;
        const radio = this.container.querySelector(`input[value="${value}"]`);
        if (radio) {
            radio.checked = true;
        }
    }
    
    disable() {
        const radios = this.container.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => radio.disabled = true);
        this.options.disabled = true;
    }
    
    enable() {
        const radios = this.container.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => radio.disabled = false);
        this.options.disabled = false;
    }
    
    destroy() {
        this.container.innerHTML = '';
    }
}
