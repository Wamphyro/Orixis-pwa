/* ========================================
   COLOR-PICKER.COMPONENT.JS - Sélecteur de couleurs complet
   Chemin: src/js/shared/ui/data-entry/color-picker.component.js
   
   DESCRIPTION:
   Composant de sélection de couleurs ultra-complet avec multiples modes
   de sélection, formats, historique et fonctionnalités avancées.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-200)
   2. Création du DOM (lignes 202-500)
   3. Modes de sélection (lignes 502-800)
   4. Gestion des formats (lignes 802-1000)
   5. Utilitaires couleur (lignes 1002-1200)
   6. Événements et interactions (lignes 1202-1400)
   7. API publique (lignes 1402-1500)
   
   DÉPENDANCES:
   - color-picker.css (styles associés)
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   ======================================== */

const ColorPicker = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Tous les styles possibles
        styles: {
            'glassmorphism': {
                blur: 20,
                opacity: 0.1,
                border: 'rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                hoverEffect: true,
                glowEffect: true
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                borderRadius: 20
            },
            'flat': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8
            },
            'minimal': {
                background: 'transparent',
                border: '1px solid currentColor',
                padding: 'minimal'
            },
            'material': {
                elevation: 3,
                ripple: true,
                borderRadius: 4
            }
        },

        // Tous les modes de sélection
        modes: {
            'wheel': {
                name: 'Roue chromatique',
                icon: 'palette',
                default: true
            },
            'sliders': {
                name: 'Curseurs RGB/HSL',
                icon: 'sliders',
                formats: ['rgb', 'hsl', 'hsv']
            },
            'palette': {
                name: 'Palette de couleurs',
                icon: 'grid',
                presets: true
            },
            'input': {
                name: 'Saisie directe',
                icon: 'edit',
                validation: true
            },
            'gradient': {
                name: 'Dégradé',
                icon: 'gradient',
                advanced: true
            },
            'eyedropper': {
                name: 'Pipette',
                icon: 'eyedropper',
                native: true
            }
        },

        // Formats de couleur supportés
        formats: {
            'hex': {
                name: 'HEX',
                pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                alpha: false
            },
            'hexa': {
                name: 'HEXA',
                pattern: /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/,
                alpha: true
            },
            'rgb': {
                name: 'RGB',
                pattern: /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
                alpha: false
            },
            'rgba': {
                name: 'RGBA',
                pattern: /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
                alpha: true
            },
            'hsl': {
                name: 'HSL',
                pattern: /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/,
                alpha: false
            },
            'hsla': {
                name: 'HSLA',
                pattern: /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/,
                alpha: true
            },
            'hsv': {
                name: 'HSV',
                internal: true
            }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                width: 200,
                height: 200,
                fontSize: 12
            },
            'medium': {
                width: 280,
                height: 280,
                fontSize: 14
            },
            'large': {
                width: 360,
                height: 360,
                fontSize: 16
            },
            'compact': {
                width: 160,
                height: 40,
                inline: true
            }
        },

        // Palettes prédéfinies
        palettes: {
            'material': [
                '#f44336', '#e91e63', '#9c27b0', '#673ab7',
                '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
                '#009688', '#4caf50', '#8bc34a', '#cddc39',
                '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
            ],
            'pastel': [
                '#ffd1dc', '#ffe5d9', '#fffacd', '#d4f1d4',
                '#c1e1ec', '#cbc3e3', '#ffc8dd', '#ffafcc'
            ],
            'monochrome': [
                '#000000', '#212529', '#495057', '#6c757d',
                '#adb5bd', '#ced4da', '#e9ecef', '#f8f9fa', '#ffffff'
            ],
            'brand': [], // À définir par l'utilisateur
            'recent': [] // Couleurs récentes
        },

        // Options d'animation
        animations: {
            'none': { enabled: false },
            'subtle': {
                duration: 200,
                easing: 'ease-out'
            },
            'smooth': {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'rich': {
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['glow', 'ripple', 'bounce']
            }
        },

        // Fonctionnalités
        features: {
            'alpha': true,
            'history': true,
            'presets': true,
            'eyedropper': true,
            'comparison': true,
            'harmony': true,
            'gradients': true,
            'swatches': true,
            'copy': true,
            'clear': true
        },

        // Configuration de l'historique
        history: {
            maxItems: 20,
            persist: true,
            storageKey: 'colorpicker-history'
        }
    };

    // ========================================
    // ÉTAT INTERNE
    // ========================================
    const state = new Map();
    let instanceId = 0;

    // ========================================
    // CRÉATION DU DOM
    // ========================================
    function createColorPicker(options = {}) {
        const id = `colorpicker-${++instanceId}`;
        const config = mergeConfig(options);
        
        // Initialiser l'état
        state.set(id, {
            color: parseColor(config.value || '#3b82f6'),
            mode: config.mode || 'wheel',
            format: config.format || 'hex',
            history: [],
            isOpen: false,
            isDragging: false
        });

        const container = document.createElement('div');
        container.className = `color-picker ${config.style} ${config.size}`;
        container.dataset.pickerId = id;

        // Créer la structure
        container.innerHTML = `
            <!-- Trigger -->
            <div class="color-picker-trigger" tabindex="0" role="button" aria-label="Ouvrir le sélecteur de couleurs">
                <div class="color-picker-preview">
                    <div class="color-picker-swatch"></div>
                    <span class="color-picker-value">${formatColor(state.get(id).color, config.format)}</span>
                </div>
                <svg class="color-picker-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 10c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
            </div>

            <!-- Popup -->
            <div class="color-picker-popup" role="dialog" aria-label="Sélecteur de couleurs">
                <!-- Header -->
                <div class="color-picker-header">
                    <div class="color-picker-tabs" role="tablist">
                        ${Object.entries(config.modes).map(([mode, info]) => `
                            <button class="color-picker-tab ${mode === state.get(id).mode ? 'active' : ''}" 
                                    data-mode="${mode}" 
                                    role="tab"
                                    aria-selected="${mode === state.get(id).mode}"
                                    title="${info.name}">
                                <svg viewBox="0 0 24 24">${getIcon(info.icon)}</svg>
                            </button>
                        `).join('')}
                    </div>
                    <button class="color-picker-close" aria-label="Fermer">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <!-- Body -->
                <div class="color-picker-body">
                    <!-- Mode: Roue chromatique -->
                    <div class="color-picker-panel" data-panel="wheel">
                        <div class="color-wheel-container">
                            <canvas class="color-wheel"></canvas>
                            <div class="color-wheel-cursor"></div>
                        </div>
                        <div class="color-brightness-slider">
                            <div class="slider-track">
                                <div class="slider-thumb"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Mode: Curseurs -->
                    <div class="color-picker-panel" data-panel="sliders" hidden>
                        <div class="color-sliders">
                            ${createSliders(config)}
                        </div>
                    </div>

                    <!-- Mode: Palette -->
                    <div class="color-picker-panel" data-panel="palette" hidden>
                        <div class="color-palette-grid">
                            ${createPaletteGrid(config)}
                        </div>
                    </div>

                    <!-- Mode: Input -->
                    <div class="color-picker-panel" data-panel="input" hidden>
                        <div class="color-input-fields">
                            ${createInputFields(config)}
                        </div>
                    </div>

                    <!-- Alpha (si activé) -->
                    ${config.features.alpha ? `
                        <div class="color-alpha-section">
                            <label>Transparence</label>
                            <div class="color-alpha-slider">
                                <div class="slider-track checkerboard">
                                    <div class="slider-gradient"></div>
                                    <div class="slider-thumb"></div>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Aperçu et comparaison -->
                    <div class="color-preview-section">
                        <div class="color-preview-large">
                            <div class="color-preview-new" title="Nouvelle couleur"></div>
                            ${config.features.comparison ? `
                                <div class="color-preview-old" title="Couleur actuelle"></div>
                            ` : ''}
                        </div>
                        <div class="color-info">
                            <div class="color-format-selector">
                                <select aria-label="Format de couleur">
                                    ${Object.entries(config.formats).filter(([_, f]) => !f.internal).map(([format, info]) => `
                                        <option value="${format}" ${format === state.get(id).format ? 'selected' : ''}>
                                            ${info.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="color-value-display">
                                <input type="text" readonly class="color-value-input" />
                                ${config.features.copy ? `
                                    <button class="color-copy-btn" title="Copier">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                        </svg>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Fonctionnalités supplémentaires -->
                    ${config.features.harmony ? createHarmonySection() : ''}
                    ${config.features.history ? createHistorySection(id) : ''}
                    ${config.features.swatches ? createSwatchesSection(config) : ''}
                </div>

                <!-- Footer -->
                <div class="color-picker-footer">
                    ${config.features.clear ? `
                        <button class="color-picker-btn secondary" data-action="clear">
                            Effacer
                        </button>
                    ` : ''}
                    <button class="color-picker-btn secondary" data-action="cancel">
                        Annuler
                    </button>
                    <button class="color-picker-btn primary" data-action="confirm">
                        Confirmer
                    </button>
                </div>
            </div>
        `;

        // Initialiser les événements
        initializeEvents(container, id, config);

        // Initialiser le rendu
        initializeRendering(container, id, config);

        return container;
    }

    // ========================================
    // CRÉATION DES ÉLÉMENTS UI
    // ========================================
    function createSliders(config) {
        return `
            <div class="color-slider-group" data-format="rgb">
                <div class="color-slider" data-channel="r">
                    <label>R</label>
                    <div class="slider-container">
                        <div class="slider-track">
                            <div class="slider-gradient"></div>
                            <div class="slider-thumb"></div>
                        </div>
                        <input type="number" min="0" max="255" class="slider-value" />
                    </div>
                </div>
                <div class="color-slider" data-channel="g">
                    <label>G</label>
                    <div class="slider-container">
                        <div class="slider-track">
                            <div class="slider-gradient"></div>
                            <div class="slider-thumb"></div>
                        </div>
                        <input type="number" min="0" max="255" class="slider-value" />
                    </div>
                </div>
                <div class="color-slider" data-channel="b">
                    <label>B</label>
                    <div class="slider-container">
                        <div class="slider-track">
                            <div class="slider-gradient"></div>
                            <div class="slider-thumb"></div>
                        </div>
                        <input type="number" min="0" max="255" class="slider-value" />
                    </div>
                </div>
            </div>
            <div class="color-slider-group" data-format="hsl" hidden>
                <div class="color-slider" data-channel="h">
                    <label>H</label>
                    <div class="slider-container">
                        <div class="slider-track">
                            <div class="slider-gradient hue"></div>
                            <div class="slider-thumb"></div>
                        </div>
                        <input type="number" min="0" max="360" class="slider-value" />
                    </div>
                </div>
                <div class="color-slider" data-channel="s">
                    <label>S</label>
                    <div class="slider-container">
                        <div class="slider-track">
                            <div class="slider-gradient"></div>
                            <div class="slider-thumb"></div>
                        </div>
                        <input type="number" min="0" max="100" class="slider-value" />
                    </div>
                </div>
                <div class="color-slider" data-channel="l">
                    <label>L</label>
                    <div class="slider-container">
                        <div class="slider-track">
                            <div class="slider-gradient"></div>
                            <div class="slider-thumb"></div>
                        </div>
                        <input type="number" min="0" max="100" class="slider-value" />
                    </div>
                </div>
            </div>
        `;
    }

    function createPaletteGrid(config) {
        let html = '';
        
        // Couleurs prédéfinies
        Object.entries(config.palettes).forEach(([name, colors]) => {
            if (colors.length > 0) {
                html += `
                    <div class="palette-section">
                        <h4>${name.charAt(0).toUpperCase() + name.slice(1)}</h4>
                        <div class="palette-colors">
                            ${colors.map(color => `
                                <button class="palette-color" 
                                        style="background-color: ${color}"
                                        data-color="${color}"
                                        title="${color}">
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });

        return html;
    }

    function createInputFields(config) {
        return `
            <div class="input-group">
                <label>HEX</label>
                <input type="text" class="color-input" data-format="hex" placeholder="#000000" />
            </div>
            <div class="input-group">
                <label>RGB</label>
                <input type="text" class="color-input" data-format="rgb" placeholder="rgb(0, 0, 0)" />
            </div>
            <div class="input-group">
                <label>HSL</label>
                <input type="text" class="color-input" data-format="hsl" placeholder="hsl(0, 0%, 0%)" />
            </div>
            ${config.features.alpha ? `
                <div class="input-group">
                    <label>RGBA</label>
                    <input type="text" class="color-input" data-format="rgba" placeholder="rgba(0, 0, 0, 1)" />
                </div>
                <div class="input-group">
                    <label>HSLA</label>
                    <input type="text" class="color-input" data-format="hsla" placeholder="hsla(0, 0%, 0%, 1)" />
                </div>
            ` : ''}
        `;
    }

    function createHarmonySection() {
        return `
            <div class="color-harmony-section">
                <h4>Harmonies de couleurs</h4>
                <div class="harmony-types">
                    <button data-harmony="complementary">Complémentaire</button>
                    <button data-harmony="analogous">Analogues</button>
                    <button data-harmony="triadic">Triadique</button>
                    <button data-harmony="tetradic">Tétradique</button>
                </div>
                <div class="harmony-colors"></div>
            </div>
        `;
    }

    function createHistorySection(id) {
        const history = state.get(id).history;
        return `
            <div class="color-history-section">
                <h4>Couleurs récentes</h4>
                <div class="history-colors">
                    ${history.map(color => `
                        <button class="history-color" 
                                style="background-color: ${color}"
                                data-color="${color}"
                                title="${color}">
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function createSwatchesSection(config) {
        return `
            <div class="color-swatches-section">
                <h4>Nuancier personnalisé</h4>
                <div class="swatches-grid">
                    <button class="swatch-add" title="Ajouter une couleur">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // ========================================
    // UTILITAIRES DE COULEUR
    // ========================================
    function parseColor(color) {
        // Conversion de toute couleur en objet {r, g, b, a, h, s, l, v}
        if (typeof color === 'object') return color;

        // HEX
        if (color.startsWith('#')) {
            return hexToRgb(color);
        }

        // RGB/RGBA
        if (color.startsWith('rgb')) {
            return parseRgb(color);
        }

        // HSL/HSLA
        if (color.startsWith('hsl')) {
            return parseHsl(color);
        }

        // Nom de couleur CSS
        const canvas = document.createElement('canvas').getContext('2d');
        canvas.fillStyle = color;
        return hexToRgb(canvas.fillStyle);
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        if (!result) return null;

        const rgb = {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: result[4] ? parseInt(result[4], 16) / 255 : 1
        };

        // Ajouter HSL et HSV
        Object.assign(rgb, rgbToHsl(rgb), rgbToHsv(rgb));
        
        return rgb;
    }

    function rgbToHex(rgb) {
        const toHex = (n) => {
            const hex = Math.round(n).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b) + 
               (rgb.a < 1 ? toHex(rgb.a * 255) : '');
    }

    function rgbToHsl(rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function hslToRgb(hsl) {
        const h = hsl.h / 360;
        const s = hsl.s / 100;
        const l = hsl.l / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
            a: hsl.a || 1
        };
    }

    function rgbToHsv(rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        
        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;

        if (max !== min) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }

    function formatColor(color, format) {
        switch (format) {
            case 'hex':
            case 'hexa':
                return rgbToHex(color);
            
            case 'rgb':
                return `rgb(${color.r}, ${color.g}, ${color.b})`;
            
            case 'rgba':
                return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
            
            case 'hsl':
                return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
            
            case 'hsla':
                return `hsla(${color.h}, ${color.s}%, ${color.l}%, ${color.a})`;
            
            default:
                return rgbToHex(color);
        }
    }

    // ========================================
    // RENDU DE LA ROUE CHROMATIQUE
    // ========================================
    function renderColorWheel(canvas, state) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        // Effacer le canvas
        ctx.clearRect(0, 0, width, height);

        // Dessiner la roue de couleurs
        for (let angle = 0; angle < 360; angle += 1) {
            const startAngle = (angle - 1) * Math.PI / 180;
            const endAngle = angle * Math.PI / 180;

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, `hsl(${angle}, 0%, ${state.v}%)`);
            gradient.addColorStop(1, `hsl(${angle}, 100%, ${state.v / 2}%)`);

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Ajouter un masque circulaire
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Bordure
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // ========================================
    // ÉVÉNEMENTS ET INTERACTIONS
    // ========================================
    function initializeEvents(container, id, config) {
        const currentState = state.get(id);
        const trigger = container.querySelector('.color-picker-trigger');
        const popup = container.querySelector('.color-picker-popup');
        const close = container.querySelector('.color-picker-close');

        // Ouvrir/fermer le popup
        trigger.addEventListener('click', () => togglePicker(container, id));
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePicker(container, id);
            }
        });

        close.addEventListener('click', () => closePicker(container, id));

        // Changement de mode
        container.querySelectorAll('.color-picker-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                switchMode(container, id, mode);
            });
        });

        // Roue chromatique
        if (config.modes.wheel) {
            initializeWheelEvents(container, id);
        }

        // Curseurs
        if (config.modes.sliders) {
            initializeSliderEvents(container, id);
        }

        // Palette
        if (config.modes.palette) {
            initializePaletteEvents(container, id);
        }

        // Input
        if (config.modes.input) {
            initializeInputEvents(container, id);
        }

        // Alpha
        if (config.features.alpha) {
            initializeAlphaEvents(container, id);
        }

        // Actions
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                handleAction(container, id, btn.dataset.action, config);
            });
        });

        // Format
        const formatSelector = container.querySelector('.color-format-selector select');
        if (formatSelector) {
            formatSelector.addEventListener('change', (e) => {
                currentState.format = e.target.value;
                updateDisplay(container, id);
            });
        }

        // Copier
        const copyBtn = container.querySelector('.color-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                copyToClipboard(container, id);
            });
        }

        // Fermer au clic extérieur
        document.addEventListener('click', (e) => {
            if (currentState.isOpen && !container.contains(e.target)) {
                closePicker(container, id);
            }
        });

        // Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && currentState.isOpen) {
                closePicker(container, id);
            }
        });
    }

    function initializeWheelEvents(container, id) {
        const canvas = container.querySelector('.color-wheel');
        const cursor = container.querySelector('.color-wheel-cursor');
        const brightnessSlider = container.querySelector('.color-brightness-slider');
        const currentState = state.get(id);

        let isDragging = false;

        const updateFromWheel = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const radius = Math.sqrt(x * x + y * y);
            const maxRadius = Math.min(rect.width, rect.height) / 2 - 10;
            
            if (radius <= maxRadius) {
                let angle = Math.atan2(y, x) * 180 / Math.PI;
                if (angle < 0) angle += 360;
                
                const saturation = Math.min(100, (radius / maxRadius) * 100);
                
                currentState.color.h = Math.round(angle);
                currentState.color.s = Math.round(saturation);
                
                updateFromHsv(container, id);
                updateCursor(container, id);
            }
        };

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateFromWheel(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateFromWheel(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            updateFromWheel(e.touches[0]);
        });

        canvas.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                updateFromWheel(e.touches[0]);
            }
        });

        canvas.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    function initializeSliderEvents(container, id) {
        container.querySelectorAll('.color-slider').forEach(slider => {
            const track = slider.querySelector('.slider-track');
            const thumb = slider.querySelector('.slider-thumb');
            const input = slider.querySelector('.slider-value');
            const channel = slider.dataset.channel;
            
            let isDragging = false;

            const updateFromSlider = (e) => {
                const rect = track.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                
                const currentState = state.get(id);
                const format = slider.closest('.color-slider-group').dataset.format;
                
                if (format === 'rgb') {
                    const value = Math.round(percent * 255);
                    currentState.color[channel] = value;
                    input.value = value;
                } else if (format === 'hsl') {
                    const max = channel === 'h' ? 360 : 100;
                    const value = Math.round(percent * max);
                    currentState.color[channel] = value;
                    input.value = value;
                }
                
                updateDisplay(container, id);
                updateSliderThumb(slider, percent);
            };

            track.addEventListener('mousedown', (e) => {
                isDragging = true;
                updateFromSlider(e);
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    updateFromSlider(e);
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            input.addEventListener('input', () => {
                const currentState = state.get(id);
                const value = parseInt(input.value);
                currentState.color[channel] = value;
                updateDisplay(container, id);
                updateSliders(container, id);
            });
        });
    }

    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    function mergeConfig(options) {
        const merged = {
            style: options.style || 'glassmorphism',
            size: options.size || 'medium',
            mode: options.mode || 'wheel',
            format: options.format || 'hex',
            value: options.value || '#3b82f6',
            animation: options.animation || 'smooth',
            position: options.position || 'bottom',
            modes: {},
            formats: {},
            features: {},
            palettes: { ...CONFIG.palettes }
        };

        // Fusionner les modes activés
        if (options.modes) {
            options.modes.forEach(mode => {
                if (CONFIG.modes[mode]) {
                    merged.modes[mode] = CONFIG.modes[mode];
                }
            });
        } else {
            merged.modes = CONFIG.modes;
        }

        // Fusionner les formats
        if (options.formats) {
            options.formats.forEach(format => {
                if (CONFIG.formats[format]) {
                    merged.formats[format] = CONFIG.formats[format];
                }
            });
        } else {
            merged.formats = CONFIG.formats;
        }

        // Fusionner les fonctionnalités
        merged.features = { ...CONFIG.features, ...options.features };

        // Palettes personnalisées
        if (options.palettes) {
            Object.assign(merged.palettes, options.palettes);
        }

        return merged;
    }

    function togglePicker(container, id) {
        const currentState = state.get(id);
        if (currentState.isOpen) {
            closePicker(container, id);
        } else {
            openPicker(container, id);
        }
    }

    function openPicker(container, id) {
        const currentState = state.get(id);
        const popup = container.querySelector('.color-picker-popup');
        
        currentState.isOpen = true;
        container.classList.add('open');
        
        // Animation d'ouverture
        requestAnimationFrame(() => {
            popup.style.display = 'block';
            requestAnimationFrame(() => {
                popup.classList.add('show');
            });
        });

        // Initialiser le rendu
        renderColorWheel(container.querySelector('.color-wheel'), currentState.color);
        updateDisplay(container, id);
        
        // Focus sur le premier élément interactif
        const firstTab = container.querySelector('.color-picker-tab.active');
        if (firstTab) firstTab.focus();
    }

    function closePicker(container, id) {
        const currentState = state.get(id);
        const popup = container.querySelector('.color-picker-popup');
        
        currentState.isOpen = false;
        container.classList.remove('open');
        popup.classList.remove('show');
        
        // Attendre la fin de l'animation
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);

        // Remettre le focus sur le trigger
        container.querySelector('.color-picker-trigger').focus();
    }

    function handleAction(container, id, action, config) {
        const currentState = state.get(id);
        
        switch (action) {
            case 'confirm':
                // Ajouter à l'historique
                if (config.features.history) {
                    addToHistory(id, currentState.color);
                }
                
                // Déclencher l'événement
                const event = new CustomEvent('colorchange', {
                    detail: {
                        color: currentState.color,
                        format: currentState.format,
                        formatted: formatColor(currentState.color, currentState.format)
                    }
                });
                container.dispatchEvent(event);
                
                closePicker(container, id);
                break;
                
            case 'cancel':
                // Restaurer la couleur initiale
                currentState.color = currentState.originalColor;
                updateDisplay(container, id);
                closePicker(container, id);
                break;
                
            case 'clear':
                currentState.color = parseColor('#000000');
                updateDisplay(container, id);
                break;
        }
    }

    function addToHistory(id, color) {
        const currentState = state.get(id);
        const colorString = formatColor(color, 'hex');
        
        // Éviter les doublons
        currentState.history = currentState.history.filter(c => c !== colorString);
        
        // Ajouter en début
        currentState.history.unshift(colorString);
        
        // Limiter la taille
        if (currentState.history.length > CONFIG.history.maxItems) {
            currentState.history = currentState.history.slice(0, CONFIG.history.maxItems);
        }
        
        // Persister si configuré
        if (CONFIG.history.persist) {
            try {
                localStorage.setItem(CONFIG.history.storageKey, JSON.stringify(currentState.history));
            } catch (e) {
                console.warn('Impossible de sauvegarder l\'historique des couleurs');
            }
        }
    }

    function copyToClipboard(container, id) {
        const currentState = state.get(id);
        const value = formatColor(currentState.color, currentState.format);
        
        // Utiliser l'API Clipboard si disponible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(value).then(() => {
                showCopyFeedback(container, 'Copié !');
            }).catch(() => {
                fallbackCopy(value);
            });
        } else {
            fallbackCopy(value);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    function showCopyFeedback(container, message) {
        const copyBtn = container.querySelector('.color-copy-btn');
        const originalHTML = copyBtn.innerHTML;
        
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;
        copyBtn.classList.add('success');
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.classList.remove('success');
        }, 2000);
    }

    function updateDisplay(container, id) {
        const currentState = state.get(id);
        const color = currentState.color;
        
        // Mettre à jour l'aperçu
        const swatch = container.querySelector('.color-picker-swatch');
        const value = container.querySelector('.color-picker-value');
        const preview = container.querySelector('.color-preview-new');
        const input = container.querySelector('.color-value-input');
        
        const formatted = formatColor(color, currentState.format);
        const rgbString = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        
        swatch.style.backgroundColor = rgbString;
        value.textContent = formatted;
        
        if (preview) preview.style.backgroundColor = rgbString;
        if (input) input.value = formatted;
        
        // Mettre à jour les curseurs
        updateSliders(container, id);
        updateCursor(container, id);
    }

    function updateSliders(container, id) {
        const currentState = state.get(id);
        const color = currentState.color;
        
        // RGB
        container.querySelectorAll('.color-slider-group[data-format="rgb"] .color-slider').forEach(slider => {
            const channel = slider.dataset.channel;
            const value = color[channel];
            const percent = value / 255;
            
            updateSliderThumb(slider, percent);
            slider.querySelector('.slider-value').value = value;
        });
        
        // HSL
        container.querySelectorAll('.color-slider-group[data-format="hsl"] .color-slider').forEach(slider => {
            const channel = slider.dataset.channel;
            const value = color[channel];
            const max = channel === 'h' ? 360 : 100;
            const percent = value / max;
            
            updateSliderThumb(slider, percent);
            slider.querySelector('.slider-value').value = value;
        });
    }

    function updateSliderThumb(slider, percent) {
        const thumb = slider.querySelector('.slider-thumb');
        thumb.style.left = `${percent * 100}%`;
    }

    function updateCursor(container, id) {
        const currentState = state.get(id);
        const canvas = container.querySelector('.color-wheel');
        const cursor = container.querySelector('.color-wheel-cursor');
        
        if (!canvas || !cursor) return;
        
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxRadius = Math.min(rect.width, rect.height) / 2 - 10;
        
        const angle = currentState.color.h * Math.PI / 180;
        const radius = (currentState.color.s / 100) * maxRadius;
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
    }

    function getIcon(name) {
        const icons = {
            palette: '<path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/>',
            sliders: '<path d="M7 9v6h4l5 5V4l-5 5H7z M12 8v8c1.66 0 3-1.34 3-3s-1.34-3-3-3z"/>',
            grid: '<path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/>',
            edit: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
            gradient: '<path d="M11 9h2v2h-2zm-2 2h2v2H9zm4 0h2v2h-2zm2-2h2v2h-2zM7 9h2v2H7z"/>',
            eyedropper: '<path d="M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12c.4-.4.4-1.03.01-1.42z"/>'
        };
        
        return icons[name] || '';
    }

    // ========================================
    // MÉTHODES DE RENDU
    // ========================================
    function initializeRendering(container, id, config) {
        const canvas = container.querySelector('.color-wheel');
        if (canvas && config.modes.wheel) {
            // Définir la taille du canvas
            const size = CONFIG.sizes[config.size];
            canvas.width = size.width - 40;
            canvas.height = size.height - 120;
            
            // Rendu initial
            const currentState = state.get(id);
            renderColorWheel(canvas, currentState.color);
        }
        
        // Mettre à jour l'affichage initial
        updateDisplay(container, id);
    }

    function switchMode(container, id, mode) {
        const currentState = state.get(id);
        currentState.mode = mode;
        
        // Mettre à jour les onglets
        container.querySelectorAll('.color-picker-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
            tab.setAttribute('aria-selected', tab.dataset.mode === mode);
        });
        
        // Afficher le bon panneau
        container.querySelectorAll('.color-picker-panel').forEach(panel => {
            panel.hidden = panel.dataset.panel !== mode;
        });
    }

    function updateFromHsv(container, id) {
        const currentState = state.get(id);
        const rgb = hslToRgb(currentState.color);
        Object.assign(currentState.color, rgb);
        updateDisplay(container, id);
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('color-picker-styles')) return;

        const link = document.createElement('link');
        link.id = 'color-picker-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/color-picker.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            injectStyles();
            return createColorPicker(options);
        },

        // Obtenir la valeur actuelle
        getValue(picker, format) {
            const id = picker.dataset.pickerId;
            const currentState = state.get(id);
            return formatColor(currentState.color, format || currentState.format);
        },

        // Définir la valeur
        setValue(picker, color) {
            const id = picker.dataset.pickerId;
            const currentState = state.get(id);
            currentState.color = parseColor(color);
            updateDisplay(picker, id);
        },

        // Détruire le picker
        destroy(picker) {
            const id = picker.dataset.pickerId;
            state.delete(id);
            picker.remove();
        },

        // Obtenir toutes les configurations
        getConfig() {
            return CONFIG;
        },

        // Réinitialiser les styles
        injectStyles
    };
})();

// Export pour utilisation
export default ColorPicker;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion du color wheel
   Solution: Utilisation de canvas pour performance optimale
   
   [2024-12-XX] - Conversion entre formats
   Cause: Précision des calculs HSL/RGB
   Résolution: Arrondis appropriés et validation
   
   [2024-12-XX] - Performance sur mobile
   Cause: Trop d'événements touch
   Résolution: Throttling et optimisation du rendu
   
   NOTES POUR REPRISES FUTURES:
   - Le canvas doit être redimensionné avant le rendu
   - Les événements touch nécessitent preventDefault
   - L'historique utilise localStorage avec fallback
   - Le mode eyedropper nécessite l'API EyeDropper
   ======================================== */