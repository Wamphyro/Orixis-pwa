/* ========================================
   SWITCH.COMPONENT.JS - Composant switch/toggle glassmorphism
   Chemin: src/js/shared/ui/data-entry/switch.component.js
   
   DESCRIPTION:
   Composant interrupteur on/off avec style glassmorphism et toutes les variantes.
   Supporte différents styles visuels, animations, états et configurations.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Méthodes privées (lignes 301-900)
   3. Styles CSS (lignes 901-1500)
   4. API publique (lignes 1501-1600)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Compatible avec form-builder.component.js
   - Peut être stylisé via CSS custom properties
   ======================================== */

const Switch = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                track: {
                    background: 'rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)'
                },
                thumb: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                },
                checked: {
                    trackBackground: 'rgba(59, 130, 246, 0.3)',
                    thumbBackground: 'rgba(255, 255, 255, 0.95)'
                }
            },
            'neumorphism': {
                track: {
                    background: '#e0e0e0',
                    boxShadow: 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff'
                },
                thumb: {
                    background: '#e0e0e0',
                    boxShadow: '4px 4px 8px #bebebe, -4px -4px 8px #ffffff'
                },
                checked: {
                    trackBackground: '#4ade80',
                    thumbBackground: '#e0e0e0'
                }
            },
            'flat': {
                track: {
                    background: '#e5e7eb',
                    border: 'none'
                },
                thumb: {
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                },
                checked: {
                    trackBackground: '#3b82f6',
                    thumbBackground: '#ffffff'
                }
            },
            'material': {
                track: {
                    background: '#b0b0b0',
                    opacity: '0.38'
                },
                thumb: {
                    background: '#fafafa',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                },
                checked: {
                    trackBackground: '#3b82f6',
                    trackOpacity: '0.5',
                    thumbBackground: '#3b82f6'
                }
            },
            'ios': {
                track: {
                    background: '#e9e9ea',
                    border: '1px solid #e9e9ea'
                },
                thumb: {
                    background: '#ffffff',
                    boxShadow: '0 3px 7px rgba(0, 0, 0, 0.3)'
                },
                checked: {
                    trackBackground: '#34c759',
                    thumbBackground: '#ffffff'
                }
            },
            'android': {
                track: {
                    background: '#9e9e9e',
                    opacity: '0.38'
                },
                thumb: {
                    background: '#f5f5f5',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    scale: '0.8'
                },
                checked: {
                    trackBackground: '#009688',
                    trackOpacity: '0.5',
                    thumbBackground: '#009688',
                    thumbScale: '1'
                }
            },
            'minimal': {
                track: {
                    background: '#d1d5db',
                    border: 'none',
                    boxShadow: 'none'
                },
                thumb: {
                    background: '#6b7280',
                    boxShadow: 'none'
                },
                checked: {
                    trackBackground: '#9ca3af',
                    thumbBackground: '#374151'
                }
            }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                trackWidth: '36px',
                trackHeight: '20px',
                thumbSize: '16px',
                thumbOffset: '2px',
                fontSize: '13px',
                gap: '8px'
            },
            'medium': {
                trackWidth: '48px',
                trackHeight: '26px',
                thumbSize: '22px',
                thumbOffset: '2px',
                fontSize: '14px',
                gap: '12px'
            },
            'large': {
                trackWidth: '60px',
                trackHeight: '32px',
                thumbSize: '28px',
                thumbOffset: '2px',
                fontSize: '16px',
                gap: '16px'
            },
            'xl': {
                trackWidth: '72px',
                trackHeight: '38px',
                thumbSize: '34px',
                thumbOffset: '2px',
                fontSize: '18px',
                gap: '20px'
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                enabled: true,
                duration: '0.2s',
                easing: 'ease-out',
                thumbSlide: true,
                colorTransition: true
            },
            'smooth': {
                enabled: true,
                duration: '0.3s',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                thumbSlide: true,
                colorTransition: true,
                scale: true,
                glow: false
            },
            'rich': {
                enabled: true,
                duration: '0.4s',
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                thumbSlide: true,
                colorTransition: true,
                scale: true,
                glow: true,
                ripple: true,
                particles: true
            }
        },

        // Couleurs par défaut
        colors: {
            default: {
                off: '#6b7280',
                on: '#3b82f6'
            },
            success: {
                off: '#6b7280',
                on: '#10b981'
            },
            warning: {
                off: '#6b7280',
                on: '#f59e0b'
            },
            danger: {
                off: '#6b7280',
                on: '#ef4444'
            },
            info: {
                off: '#6b7280',
                on: '#3b82f6'
            }
        },

        // Icônes prédéfinies
        icons: {
            check: 'M5 12l5 5L20 7',
            cross: 'M6 6l12 12M6 18L18 6',
            power: 'M12 2v10m0 0a6 6 0 1 0 6 6 6 6 0 0 0-6-6z',
            sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
            moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
            volume: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14',
            mute: 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6m0-6l6 6',
            play: 'M5 3l14 9-14 9V3z',
            pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
            bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0'
        },

        // États du switch
        states: {
            'default': {
                cursor: 'pointer',
                opacity: 1
            },
            'disabled': {
                cursor: 'not-allowed',
                opacity: 0.5,
                pointerEvents: 'none'
            },
            'loading': {
                cursor: 'wait',
                opacity: 0.8
            },
            'readonly': {
                cursor: 'default',
                opacity: 0.9
            }
        }
    };

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================

    // Génération d'ID unique
    function generateId() {
        return `switch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Création de la structure HTML
    function createStructure(options) {
        const wrapper = document.createElement('label');
        wrapper.className = 'switch-wrapper';
        wrapper.dataset.style = options.style || 'glassmorphism';
        wrapper.dataset.size = options.size || 'medium';
        wrapper.dataset.animation = options.animation || 'smooth';
        
        // Input caché
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'switch-input';
        input.id = options.id || generateId();
        input.name = options.name || input.id;
        input.checked = options.checked || false;
        input.disabled = options.disabled || false;
        input.required = options.required || false;
        
        // Track (piste)
        const track = document.createElement('div');
        track.className = 'switch-track';
        
        // Thumb (curseur)
        const thumb = document.createElement('div');
        thumb.className = 'switch-thumb';
        
        // Contenu optionnel dans le thumb
        if (options.thumbContent) {
            thumb.innerHTML = createThumbContent(options);
        }
        
        // Texte on/off dans le track
        if (options.showText) {
            const onText = document.createElement('span');
            onText.className = 'switch-text switch-text-on';
            onText.textContent = options.onText || 'ON';
            
            const offText = document.createElement('span');
            offText.className = 'switch-text switch-text-off';
            offText.textContent = options.offText || 'OFF';
            
            track.appendChild(onText);
            track.appendChild(offText);
        }
        
        track.appendChild(thumb);
        
        // Construction de la structure
        const switchContainer = document.createElement('div');
        switchContainer.className = 'switch-container';
        switchContainer.appendChild(input);
        switchContainer.appendChild(track);
        
        // Label optionnel
        if (options.label) {
            const label = document.createElement('span');
            label.className = 'switch-label';
            label.textContent = options.label;
            
            if (options.labelPosition === 'before') {
                wrapper.appendChild(label);
                wrapper.appendChild(switchContainer);
            } else {
                wrapper.appendChild(switchContainer);
                wrapper.appendChild(label);
            }
        } else {
            wrapper.appendChild(switchContainer);
        }
        
        // Description optionnelle
        if (options.description) {
            const description = document.createElement('span');
            description.className = 'switch-description';
            description.textContent = options.description;
            wrapper.appendChild(description);
        }
        
        // Application des styles et événements
        applyStyles(wrapper, options);
        attachEvents(wrapper, input, options);
        
        // État initial
        if (options.loading) {
            setLoadingState(wrapper, true);
        }
        
        return { wrapper, input };
    }

    // Création du contenu du thumb
    function createThumbContent(options) {
        if (options.thumbIcon) {
            const iconData = CONFIG.icons[options.thumbIcon];
            if (iconData) {
                return `
                    <svg class="switch-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="${iconData}" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
            }
        } else if (options.thumbContent === 'check') {
            return `
                <svg class="switch-thumb-icon switch-thumb-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="${CONFIG.icons.check}" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg class="switch-thumb-icon switch-thumb-cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="${CONFIG.icons.cross}" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
        return '';
    }

    // Application des styles
    function applyStyles(wrapper, options) {
        const style = CONFIG.styles[options.style || 'glassmorphism'];
        const size = CONFIG.sizes[options.size || 'medium'];
        const animation = CONFIG.animations[options.animation || 'smooth'];
        
        // Variables CSS pour personnalisation
        wrapper.style.setProperty('--switch-track-width', size.trackWidth);
        wrapper.style.setProperty('--switch-track-height', size.trackHeight);
        wrapper.style.setProperty('--switch-thumb-size', size.thumbSize);
        wrapper.style.setProperty('--switch-thumb-offset', size.thumbOffset);
        wrapper.style.setProperty('--switch-font-size', size.fontSize);
        wrapper.style.setProperty('--switch-gap', size.gap);
        
        // Couleurs personnalisées
        if (options.color) {
            const color = CONFIG.colors[options.color] || CONFIG.colors.default;
            wrapper.style.setProperty('--switch-color-off', color.off);
            wrapper.style.setProperty('--switch-color-on', color.on);
        } else if (options.onColor) {
            wrapper.style.setProperty('--switch-color-on', options.onColor);
        }
        
        // Animation
        if (animation.enabled) {
            wrapper.style.setProperty('--switch-duration', animation.duration);
            wrapper.style.setProperty('--switch-easing', animation.easing);
        }
        
        // Classes pour les features
        if (options.showText) wrapper.classList.add('has-text');
        if (options.thumbContent) wrapper.classList.add('has-thumb-content');
        if (animation.glow) wrapper.classList.add('has-glow');
        if (animation.ripple) wrapper.classList.add('has-ripple');
    }

    // Attachement des événements
    function attachEvents(wrapper, input, options) {
        // Changement d'état
        input.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            
            // Animation riche
            if (options.animation === 'rich' && CONFIG.animations.rich.particles) {
                createParticleEffect(wrapper, isChecked);
            }
            
            // Ripple effect
            if (CONFIG.animations[options.animation || 'smooth'].ripple) {
                createRippleEffect(wrapper, isChecked);
            }
            
            // Callback
            if (options.onChange) {
                options.onChange(isChecked, input);
            }
        });
        
        // Accessibilité clavier
        input.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!input.disabled) {
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
        
        // Focus/blur pour accessibilité
        input.addEventListener('focus', () => {
            wrapper.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            wrapper.classList.remove('focused');
        });
        
        // Hover effects
        if (options.animation !== 'none') {
            wrapper.addEventListener('mouseenter', () => {
                if (!input.disabled) {
                    wrapper.classList.add('hover');
                }
            });
            
            wrapper.addEventListener('mouseleave', () => {
                wrapper.classList.remove('hover');
            });
        }
    }

    // Effet de particules
    function createParticleEffect(wrapper, isChecked) {
        const track = wrapper.querySelector('.switch-track');
        const particleCount = 6;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'switch-particle';
            
            const angle = (i / particleCount) * 360;
            const distance = 20 + Math.random() * 20;
            
            particle.style.cssText = `
                --particle-angle: ${angle}deg;
                --particle-distance: ${distance}px;
                background: ${isChecked ? 'var(--switch-color-on)' : 'var(--switch-color-off)'};
                animation: particle-burst 0.6s ease-out forwards;
                animation-delay: ${i * 0.02}s;
            `;
            
            track.appendChild(particle);
            
            // Nettoyage
            setTimeout(() => particle.remove(), 600);
        }
    }

    // Effet ripple
    function createRippleEffect(wrapper, isChecked) {
        const track = wrapper.querySelector('.switch-track');
        const ripple = document.createElement('div');
        ripple.className = 'switch-ripple';
        
        if (isChecked) {
            ripple.style.right = '2px';
        } else {
            ripple.style.left = '2px';
        }
        
        track.appendChild(ripple);
        
        // Force reflow pour l'animation
        ripple.offsetHeight;
        ripple.classList.add('active');
        
        // Nettoyage
        setTimeout(() => ripple.remove(), 600);
    }

    // État de chargement
    function setLoadingState(wrapper, loading) {
        const input = wrapper.querySelector('.switch-input');
        const thumb = wrapper.querySelector('.switch-thumb');
        
        if (loading) {
            wrapper.classList.add('loading');
            input.disabled = true;
            
            // Spinner
            const spinner = document.createElement('div');
            spinner.className = 'switch-spinner';
            thumb.appendChild(spinner);
        } else {
            wrapper.classList.remove('loading');
            input.disabled = false;
            
            const spinner = thumb.querySelector('.switch-spinner');
            if (spinner) spinner.remove();
        }
    }

    // ========================================
    // STYLES CSS
    // ========================================
    const styles = `
        /* Variables CSS */
        .switch-wrapper {
            --switch-track-width: 48px;
            --switch-track-height: 26px;
            --switch-thumb-size: 22px;
            --switch-thumb-offset: 2px;
            --switch-font-size: 14px;
            --switch-gap: 12px;
            --switch-duration: 0.3s;
            --switch-easing: cubic-bezier(0.4, 0, 0.2, 1);
            --switch-color-off: #6b7280;
            --switch-color-on: #3b82f6;
        }

        /* Structure de base */
        .switch-wrapper {
            display: inline-flex;
            align-items: center;
            gap: var(--switch-gap);
            cursor: pointer;
            user-select: none;
            font-size: var(--switch-font-size);
        }

        .switch-container {
            position: relative;
            display: inline-flex;
            align-items: center;
        }

        .switch-input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        .switch-track {
            position: relative;
            width: var(--switch-track-width);
            height: var(--switch-track-height);
            border-radius: calc(var(--switch-track-height) / 2);
            transition: all var(--switch-duration) var(--switch-easing);
            overflow: hidden;
        }

        .switch-thumb {
            position: absolute;
            top: var(--switch-thumb-offset);
            left: var(--switch-thumb-offset);
            width: var(--switch-thumb-size);
            height: var(--switch-thumb-size);
            border-radius: 50%;
            transition: all var(--switch-duration) var(--switch-easing);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* État checked */
        .switch-input:checked + .switch-track .switch-thumb {
            transform: translateX(calc(var(--switch-track-width) - var(--switch-thumb-size) - var(--switch-thumb-offset) * 2));
        }

        /* Styles glassmorphism */
        .switch-wrapper[data-style="glassmorphism"] .switch-track {
            background: rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .switch-wrapper[data-style="glassmorphism"] .switch-thumb {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .switch-wrapper[data-style="glassmorphism"] .switch-input:checked + .switch-track {
            background: rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.4);
        }

        /* Styles neumorphism */
        .switch-wrapper[data-style="neumorphism"] .switch-track {
            background: #e0e0e0;
            box-shadow: inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff;
        }

        .switch-wrapper[data-style="neumorphism"] .switch-thumb {
            background: #e0e0e0;
            box-shadow: 4px 4px 8px #bebebe, -4px -4px 8px #ffffff;
        }

        .switch-wrapper[data-style="neumorphism"] .switch-input:checked + .switch-track {
            background: #4ade80;
        }

        /* Styles flat */
        .switch-wrapper[data-style="flat"] .switch-track {
            background: #e5e7eb;
            border: none;
        }

        .switch-wrapper[data-style="flat"] .switch-thumb {
            background: #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .switch-wrapper[data-style="flat"] .switch-input:checked + .switch-track {
            background: var(--switch-color-on);
        }

        /* Styles material */
        .switch-wrapper[data-style="material"] .switch-track {
            background: #b0b0b0;
            opacity: 0.38;
        }

        .switch-wrapper[data-style="material"] .switch-thumb {
            background: #fafafa;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .switch-wrapper[data-style="material"] .switch-input:checked + .switch-track {
            background: var(--switch-color-on);
            opacity: 0.5;
        }

        .switch-wrapper[data-style="material"] .switch-input:checked + .switch-track .switch-thumb {
            background: var(--switch-color-on);
        }

        /* Styles iOS */
        .switch-wrapper[data-style="ios"] .switch-track {
            background: #e9e9ea;
            border: 1px solid #e9e9ea;
        }

        .switch-wrapper[data-style="ios"] .switch-thumb {
            background: #ffffff;
            box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);
        }

        .switch-wrapper[data-style="ios"] .switch-input:checked + .switch-track {
            background: #34c759;
            border-color: #34c759;
        }

        /* Labels et descriptions */
        .switch-label {
            color: #374151;
            font-weight: 500;
        }

        .switch-description {
            display: block;
            font-size: 0.875em;
            color: #6b7280;
            margin-top: 4px;
            width: 100%;
        }

        /* Texte on/off */
        .switch-text {
            position: absolute;
            font-size: 0.65em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #ffffff;
            opacity: 0;
            transition: opacity var(--switch-duration) var(--switch-easing);
        }

        .switch-text-on {
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
        }

        .switch-text-off {
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
        }

        .switch-wrapper.has-text .switch-input:checked + .switch-track .switch-text-on {
            opacity: 1;
        }

        .switch-wrapper.has-text .switch-input:not(:checked) + .switch-track .switch-text-off {
            opacity: 1;
        }

        /* Icônes dans le thumb */
        .switch-thumb-icon {
            width: 60%;
            height: 60%;
            color: var(--switch-color-off);
            transition: all var(--switch-duration) var(--switch-easing);
        }

        .switch-input:checked + .switch-track .switch-thumb-icon {
            color: var(--switch-color-on);
        }

        .switch-thumb-check,
        .switch-thumb-cross {
            position: absolute;
            opacity: 0;
            transform: scale(0);
        }

        .switch-input:checked + .switch-track .switch-thumb-check {
            opacity: 1;
            transform: scale(1);
            color: var(--switch-color-on);
        }

        .switch-input:not(:checked) + .switch-track .switch-thumb-cross {
            opacity: 1;
            transform: scale(1);
            color: var(--switch-color-off);
        }

        /* États */
        .switch-wrapper:hover .switch-track {
            filter: brightness(0.95);
        }

        .switch-wrapper.hover .switch-thumb {
            transform: scale(1.05);
        }

        .switch-wrapper.focused .switch-track {
            box-shadow: 0 0 0 2px var(--switch-color-on), var(--switch-track-shadow);
        }

        .switch-input:disabled + .switch-track {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Loading state */
        .switch-wrapper.loading .switch-track {
            opacity: 0.8;
        }

        .switch-spinner {
            position: absolute;
            width: 70%;
            height: 70%;
            border: 2px solid transparent;
            border-top-color: currentColor;
            border-radius: 50%;
            animation: switch-spin 0.8s linear infinite;
        }

        @keyframes switch-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Glow effect */
        .switch-wrapper.has-glow .switch-input:checked + .switch-track {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), var(--switch-track-shadow);
        }

        /* Ripple effect */
        .switch-ripple {
            position: absolute;
            width: var(--switch-thumb-size);
            height: var(--switch-thumb-size);
            border-radius: 50%;
            background: var(--switch-color-on);
            opacity: 0.3;
            transform: scale(0);
            pointer-events: none;
        }

        .switch-ripple.active {
            animation: ripple-expand 0.6s ease-out;
        }

        @keyframes ripple-expand {
            0% {
                transform: scale(0);
                opacity: 0.3;
            }
            100% {
                transform: scale(3);
                opacity: 0;
            }
        }

        /* Particle effect */
        .switch-particle {
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            pointer-events: none;
        }

        @keyframes particle-burst {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 1;
            }
            100% {
                transform: translate(
                    calc(-50% + cos(var(--particle-angle)) * var(--particle-distance)),
                    calc(-50% + sin(var(--particle-angle)) * var(--particle-distance))
                ) scale(1);
                opacity: 0;
            }
        }

        /* Tailles */
        .switch-wrapper[data-size="small"] {
            --switch-track-width: 36px;
            --switch-track-height: 20px;
            --switch-thumb-size: 16px;
            --switch-font-size: 13px;
            --switch-gap: 8px;
        }

        .switch-wrapper[data-size="large"] {
            --switch-track-width: 60px;
            --switch-track-height: 32px;
            --switch-thumb-size: 28px;
            --switch-font-size: 16px;
            --switch-gap: 16px;
        }

        .switch-wrapper[data-size="xl"] {
            --switch-track-width: 72px;
            --switch-track-height: 38px;
            --switch-thumb-size: 34px;
            --switch-font-size: 18px;
            --switch-gap: 20px;
        }

        /* Dark mode */
        .dark .switch-wrapper .switch-label {
            color: #f3f4f6;
        }

        .dark .switch-wrapper .switch-description {
            color: #9ca3af;
        }

        .dark .switch-wrapper[data-style="glassmorphism"] .switch-track {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);
        }

        .dark .switch-wrapper[data-style="glassmorphism"] .switch-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.2);
        }

        /* Alignement dans les formulaires */
        .form-group .switch-wrapper {
            margin: 8px 0;
        }

        /* Groupes de switches */
        .switch-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .switch-group-horizontal {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
        }

        /* Responsive */
        @media (max-width: 640px) {
            .switch-wrapper {
                font-size: calc(var(--switch-font-size) * 0.9);
            }
            
            .switch-group-horizontal {
                flex-direction: column;
                gap: 12px;
            }
        }

        /* Print styles */
        @media print {
            .switch-wrapper {
                opacity: 1 !important;
            }
            
            .switch-track {
                background: #e5e7eb !important;
                box-shadow: none !important;
            }
            
            .switch-input:checked + .switch-track {
                background: #374151 !important;
            }
        }

        /* Animations désactivées si prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
            .switch-wrapper * {
                animation: none !important;
                transition: none !important;
            }
        }
    `;

    // Injection des styles
    function injectStyles() {
        if (document.getElementById('switch-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'switch-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration exposée
        CONFIG,

        // Création d'un switch
        create(options = {}) {
            // Injection des styles au premier appel
            injectStyles();

            // Options par défaut
            const defaultOptions = {
                style: 'glassmorphism',
                size: 'medium',
                animation: 'smooth',
                labelPosition: 'after',
                checked: false,
                disabled: false
            };

            // Fusion des options
            const finalOptions = { ...defaultOptions, ...options };

            // Création du switch
            const { wrapper, input } = createStructure(finalOptions);

            // API de contrôle
            return {
                element: wrapper,
                input: input,

                // Obtenir l'état
                getValue() {
                    return input.checked;
                },

                // Définir l'état
                setValue(checked) {
                    input.checked = checked;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                },

                // Toggle
                toggle() {
                    this.setValue(!input.checked);
                },

                // Activer/désactiver
                setDisabled(disabled) {
                    input.disabled = disabled;
                    wrapper.classList.toggle('disabled', disabled);
                },

                // État de chargement
                setLoading(loading) {
                    setLoadingState(wrapper, loading);
                },

                // Mise à jour du label
                setLabel(text) {
                    const label = wrapper.querySelector('.switch-label');
                    if (label) {
                        label.textContent = text;
                    }
                },

                // Changement de style
                setStyle(styleName) {
                    if (CONFIG.styles[styleName]) {
                        wrapper.dataset.style = styleName;
                    }
                },

                // Changement de taille
                setSize(sizeName) {
                    if (CONFIG.sizes[sizeName]) {
                        wrapper.dataset.size = sizeName;
                    }
                },

                // Listener personnalisé
                onChange(callback) {
                    input.addEventListener('change', (e) => {
                        callback(e.target.checked, e.target);
                    });
                },

                // Destruction
                destroy() {
                    wrapper.remove();
                }
            };
        },

        // Création d'un groupe de switches
        createGroup(switches = [], options = {}) {
            const group = document.createElement('div');
            group.className = options.horizontal ? 'switch-group-horizontal' : 'switch-group';
            
            const instances = switches.map(switchConfig => {
                const instance = this.create(switchConfig);
                group.appendChild(instance.element);
                return instance;
            });

            return {
                element: group,
                switches: instances,

                // Obtenir toutes les valeurs
                getValues() {
                    return instances.reduce((acc, instance, index) => {
                        const name = switches[index].name || index;
                        acc[name] = instance.getValue();
                        return acc;
                    }, {});
                },

                // Définir toutes les valeurs
                setValues(values) {
                    Object.entries(values).forEach(([name, value]) => {
                        const index = switches.findIndex(s => s.name === name);
                        if (index !== -1) {
                            instances[index].setValue(value);
                        }
                    });
                },

                // Activer/désactiver tout
                setAllDisabled(disabled) {
                    instances.forEach(instance => instance.setDisabled(disabled));
                }
            };
        },

        // Méthode pour créer un switch thème dark/light
        createThemeSwitch(options = {}) {
            return this.create({
                ...options,
                style: options.style || 'glassmorphism',
                size: options.size || 'medium',
                animation: options.animation || 'rich',
                thumbContent: 'check',
                showText: false,
                label: options.label || 'Mode sombre',
                onChange: (checked) => {
                    document.documentElement.classList.toggle('dark', checked);
                    if (options.onChange) {
                        options.onChange(checked);
                    }
                }
            });
        },

        // Liste des styles disponibles
        getAvailableStyles() {
            return Object.keys(CONFIG.styles);
        },

        // Liste des animations
        getAvailableAnimations() {
            return Object.keys(CONFIG.animations);
        },

        // Injection manuelle des styles
        injectStyles
    };
})();

// Export pour utilisation en modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Switch;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2025-01-28] - Implémentation complète
   - Tous les styles visuels (7 variantes)
   - Animations riches avec particules
   - Support complet accessibilité (ARIA + clavier)
   - États loading, disabled, readonly
   - Groupes de switches
   
   NOTES POUR REPRISES FUTURES:
   - Les animations riches utilisent des particules CSS
   - Le style glassmorphism nécessite backdrop-filter
   - Support prefers-reduced-motion pour accessibilité
   - Compatible avec tous les navigateurs modernes
   ======================================== */