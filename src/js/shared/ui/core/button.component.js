/**
 * 🎨 ULTIMATE BUTTON COMPONENT
 * Version: 1.0.0
 * 
 * Le composant bouton le plus complet jamais créé !
 * Contient TOUTES les options possibles et imaginables.
 * 
 * @example Simple
 * const btn = await UI.Button({ text: 'Cliquer' });
 * 
 * @example Complexe
 * const btn = await UI.Button({
 *     text: 'Sauvegarder',
 *     type: 'primary',
 *     style: 'glassmorphism',
 *     animation: 'rich',
 *     icon: { name: 'save', position: 'start' },
 *     loading: { state: true, text: 'Sauvegarde...' },
 *     gradient: { from: '#3b82f6', to: '#8b5cf6', angle: 135 }
 * });
 */

const ButtonComponent = (() => {
    'use strict';

    // 🎨 CONFIGURATION COMPLÈTE - TOUTES LES OPTIONS POSSIBLES
    const CONFIG = {
        // Types de boutons
        types: {
            'primary': {
                bg: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: 'rgba(59, 130, 246, 0.2)',
                hover: { bg: 'rgba(59, 130, 246, 0.2)', scale: 1.02 },
                active: { bg: 'rgba(59, 130, 246, 0.3)', scale: 0.98 }
            },
            'secondary': {
                bg: 'rgba(107, 114, 128, 0.1)',
                color: '#6b7280',
                border: 'rgba(107, 114, 128, 0.2)',
                hover: { bg: 'rgba(107, 114, 128, 0.2)', scale: 1.02 },
                active: { bg: 'rgba(107, 114, 128, 0.3)', scale: 0.98 }
            },
            'success': {
                bg: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                border: 'rgba(34, 197, 94, 0.2)',
                hover: { bg: 'rgba(34, 197, 94, 0.2)', scale: 1.02 },
                active: { bg: 'rgba(34, 197, 94, 0.3)', scale: 0.98 }
            },
            'danger': {
                bg: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: 'rgba(239, 68, 68, 0.2)',
                hover: { bg: 'rgba(239, 68, 68, 0.2)', scale: 1.02 },
                active: { bg: 'rgba(239, 68, 68, 0.3)', scale: 0.98 }
            },
            'warning': {
                bg: 'rgba(251, 191, 36, 0.1)',
                color: '#fbbf24',
                border: 'rgba(251, 191, 36, 0.2)',
                hover: { bg: 'rgba(251, 191, 36, 0.2)', scale: 1.02 },
                active: { bg: 'rgba(251, 191, 36, 0.3)', scale: 0.98 }
            },
            'info': {
                bg: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: 'rgba(59, 130, 246, 0.2)',
                hover: { bg: 'rgba(59, 130, 246, 0.2)', scale: 1.02 },
                active: { bg: 'rgba(59, 130, 246, 0.3)', scale: 0.98 }
            },
            'light': {
                bg: 'rgba(249, 250, 251, 0.9)',
                color: '#374151',
                border: 'rgba(229, 231, 235, 0.8)',
                hover: { bg: 'rgba(243, 244, 246, 0.95)', scale: 1.02 },
                active: { bg: 'rgba(229, 231, 235, 0.95)', scale: 0.98 }
            },
            'dark': {
                bg: 'rgba(31, 41, 55, 0.9)',
                color: '#e5e7eb',
                border: 'rgba(75, 85, 99, 0.8)',
                hover: { bg: 'rgba(55, 65, 81, 0.95)', scale: 1.02 },
                active: { bg: 'rgba(75, 85, 99, 0.95)', scale: 0.98 }
            },
            'ghost': {
                bg: 'transparent',
                color: '#6b7280',
                border: 'transparent',
                hover: { bg: 'rgba(107, 114, 128, 0.1)', scale: 1.02 },
                active: { bg: 'rgba(107, 114, 128, 0.2)', scale: 0.98 }
            },
            'outline': {
                bg: 'transparent',
                color: '#3b82f6',
                border: 'rgba(59, 130, 246, 0.5)',
                borderWidth: '2px',
                hover: { bg: 'rgba(59, 130, 246, 0.1)', scale: 1.02 },
                active: { bg: 'rgba(59, 130, 246, 0.2)', scale: 0.98 }
            },
            'text': {
                bg: 'transparent',
                color: '#3b82f6',
                border: 'transparent',
                hover: { bg: 'rgba(59, 130, 246, 0.05)', textDecoration: 'underline' },
                active: { bg: 'rgba(59, 130, 246, 0.1)' }
            },
            'gradient': {
                bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'transparent',
                hover: { brightness: 1.1, scale: 1.02 },
                active: { brightness: 0.95, scale: 0.98 }
            },
            'neon': {
                bg: 'rgba(167, 139, 250, 0.1)',
                color: '#a78bfa',
                border: 'rgba(167, 139, 250, 0.5)',
                shadow: '0 0 20px rgba(167, 139, 250, 0.5)',
                hover: { shadow: '0 0 30px rgba(167, 139, 250, 0.8)', scale: 1.05 },
                active: { shadow: '0 0 15px rgba(167, 139, 250, 0.4)', scale: 0.95 }
            },
            'glass': {
                bg: 'rgba(255, 255, 255, 0.1)',
                color: '#1f2937',
                border: 'rgba(255, 255, 255, 0.2)',
                backdropBlur: '20px',
                hover: { bg: 'rgba(255, 255, 255, 0.2)', scale: 1.02 },
                active: { bg: 'rgba(255, 255, 255, 0.3)', scale: 0.98 }
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                backdropFilter: 'blur(20px)',
                webkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'neumorphism': {
                boxShadow: '20px 20px 60px #d1d1d1, -20px -20px 60px #ffffff',
                borderRadius: '20px',
                transition: 'all 0.3s ease'
            },
            'material': {
                boxShadow: '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)',
                borderRadius: '4px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            },
            'minimal': {
                boxShadow: 'none',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
            },
            'flat': {
                boxShadow: 'none',
                borderRadius: '0',
                transition: 'all 0.2s linear'
            },
            'brutal': {
                boxShadow: '4px 4px 0 #000',
                border: '3px solid #000',
                borderRadius: '0',
                transition: 'all 0.1s ease',
                fontWeight: '900'
            },
            'retro': {
                boxShadow: '4px 4px 0 #ff6b6b',
                border: '2px solid #4ecdc4',
                borderRadius: '8px',
                fontFamily: 'monospace',
                transition: 'all 0.2s ease'
            },
            '3d': {
                boxShadow: '0 10px 0 #0005, 0 20px 20px #0002',
                borderRadius: '10px',
                transform: 'rotateX(20deg)',
                transformStyle: 'preserve-3d',
                transition: 'all 0.3s ease'
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                hover: {
                    transform: 'translateY(-1px)',
                    duration: '0.2s'
                },
                active: {
                    transform: 'translateY(0)',
                    duration: '0.1s'
                }
            },
            'smooth': {
                hover: {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    duration: '0.3s',
                    timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                },
                active: {
                    transform: 'translateY(0)',
                    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)',
                    duration: '0.1s'
                },
                loading: {
                    animation: 'button-pulse 1.5s ease-in-out infinite'
                }
            },
            'rich': {
                hover: {
                    transform: 'translateY(-3px) scale(1.02)',
                    boxShadow: '0 15px 50px rgba(0, 0, 0, 0.2)',
                    duration: '0.4s',
                    timing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                },
                active: {
                    transform: 'translateY(0) scale(0.98)',
                    duration: '0.1s'
                },
                loading: {
                    animation: 'button-spin 1s linear infinite'
                },
                ripple: true,
                particles: true
            },
            'playful': {
                hover: {
                    transform: 'rotate(-5deg) scale(1.1)',
                    duration: '0.3s',
                    timing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                },
                active: {
                    transform: 'rotate(5deg) scale(0.9)',
                    duration: '0.1s'
                },
                shake: true,
                confetti: true
            },
            'elastic': {
                hover: {
                    transform: 'scale(1.05)',
                    duration: '0.4s',
                    timing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                },
                active: {
                    transform: 'scale(0.95)',
                    duration: '0.2s',
                    timing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                }
            },
            'bounce': {
                hover: {
                    animation: 'button-bounce 0.5s ease-in-out'
                },
                active: {
                    animation: 'button-press 0.2s ease'
                }
            },
            'morphing': {
                hover: {
                    borderRadius: '50px',
                    duration: '0.4s'
                },
                active: {
                    borderRadius: '5px',
                    duration: '0.2s'
                }
            },
            'glitch': {
                hover: {
                    animation: 'button-glitch 0.3s ease'
                },
                active: {
                    animation: 'button-glitch-active 0.1s ease'
                }
            }
        },

        // Tailles
        sizes: {
            'xs': {
                padding: '6px 12px',
                fontSize: '12px',
                iconSize: '14px',
                height: '28px'
            },
            'sm': {
                padding: '8px 16px',
                fontSize: '14px',
                iconSize: '16px',
                height: '32px'
            },
            'md': {
                padding: '10px 20px',
                fontSize: '16px',
                iconSize: '20px',
                height: '40px'
            },
            'lg': {
                padding: '12px 28px',
                fontSize: '18px',
                iconSize: '24px',
                height: '48px'
            },
            'xl': {
                padding: '16px 32px',
                fontSize: '20px',
                iconSize: '28px',
                height: '56px'
            },
            'jumbo': {
                padding: '20px 40px',
                fontSize: '24px',
                iconSize: '32px',
                height: '72px'
            }
        },

        // États de chargement
        loadingStates: {
            'spinner': {
                icon: `<svg class="button-spinner" viewBox="0 0 24 24">
                    <circle class="button-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"/>
                </svg>`,
                animation: 'spin 1s linear infinite'
            },
            'dots': {
                icon: `<span class="button-dots">
                    <span></span><span></span><span></span>
                </span>`,
                animation: 'dots 1.4s ease-in-out infinite'
            },
            'pulse': {
                animation: 'pulse 1.5s ease-in-out infinite'
            },
            'progress': {
                showBar: true,
                animation: 'progress 2s linear'
            },
            'skeleton': {
                animation: 'skeleton 1.5s ease-in-out infinite'
            }
        },

        // Fonctionnalités spéciales
        features: {
            'ripple': {
                color: 'rgba(255, 255, 255, 0.5)',
                duration: 600,
                easing: 'ease-out'
            },
            'tooltip': {
                position: 'top',
                delay: 500,
                animation: 'fade'
            },
            'badge': {
                position: 'top-right',
                size: '18px',
                animation: 'bounce'
            },
            'particles': {
                count: 12,
                colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
                duration: 1000
            },
            'sound': {
                click: '/sounds/click.mp3',
                hover: '/sounds/hover.mp3',
                success: '/sounds/success.mp3'
            },
            'haptic': {
                click: { duration: 10, intensity: 'medium' },
                hover: { duration: 5, intensity: 'light' }
            },
            'accessibility': {
                announceState: true,
                highContrast: false,
                focusRing: true
            }
        },

        // Icônes prédéfinies
        icons: {
            'save': '💾',
            'delete': '🗑️',
            'edit': '✏️',
            'add': '➕',
            'remove': '➖',
            'search': '🔍',
            'filter': '🔽',
            'download': '⬇️',
            'upload': '⬆️',
            'refresh': '🔄',
            'settings': '⚙️',
            'user': '👤',
            'logout': '🚪',
            'home': '🏠',
            'menu': '☰',
            'close': '✖️',
            'check': '✓',
            'warning': '⚠️',
            'info': 'ℹ️',
            'question': '❓',
            'star': '⭐',
            'heart': '❤️',
            'share': '🔗',
            'copy': '📋',
            'print': '🖨️',
            'mail': '✉️',
            'phone': '📞',
            'calendar': '📅',
            'time': '⏰',
            'location': '📍',
            'lock': '🔒',
            'unlock': '🔓',
            'eye': '👁️',
            'eyeOff': '🙈',
            'cart': '🛒',
            'payment': '💳',
            'notification': '🔔',
            'mute': '🔇',
            'play': '▶️',
            'pause': '⏸️',
            'stop': '⏹️',
            'forward': '⏩',
            'backward': '⏪',
            'next': '⏭️',
            'previous': '⏮️',
            'fullscreen': '🔳',
            'minimize': '🔲',
            'maximize': '🔳',
            'sun': '☀️',
            'moon': '🌙',
            'cloud': '☁️',
            'lightning': '⚡',
            'fire': '🔥',
            'water': '💧',
            'earth': '🌍',
            'wind': '💨'
        },

        // CSS Keyframes à injecter
        keyframes: `
            @keyframes button-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(0.98); }
            }
            
            @keyframes button-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes button-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            @keyframes button-press {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }
            
            @keyframes button-glitch {
                0%, 100% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
            }
            
            @keyframes button-glitch-active {
                0%, 100% { transform: translate(0) scale(1); }
                25% { transform: translate(-1px, 1px) scale(0.98); }
                50% { transform: translate(1px, -1px) scale(0.98); }
                75% { transform: translate(-1px, -1px) scale(0.98); }
            }
            
            @keyframes dots {
                0%, 80%, 100% { opacity: 0; transform: scale(0); }
                40% { opacity: 1; transform: scale(1); }
            }
            
            @keyframes skeleton {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
            }
            
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes particle-float {
                0% {
                    transform: translate(0, 0) scale(0);
                    opacity: 1;
                }
                50% {
                    transform: translate(var(--x), var(--y)) scale(1);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(calc(var(--x) * 2), calc(var(--y) * 2)) scale(0);
                    opacity: 0;
                }
            }
            
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            
            @keyframes confetti-fall {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `
    };

    // 🔧 MÉTHODES PRIVÉES
    let stylesInjected = false;
    let soundsEnabled = true;
    let audioCache = {};

    /**
     * Injecter les styles CSS
     */
    function injectStyles() {
        if (stylesInjected) return;

        const style = document.createElement('style');
        style.id = 'button-component-styles';
        style.textContent = `
            ${CONFIG.keyframes}
            
            /* Base button styles */
            .ui-button {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-weight: 500;
                cursor: pointer;
                user-select: none;
                outline: none;
                border: 1px solid;
                overflow: hidden;
                white-space: nowrap;
                text-decoration: none;
                vertical-align: middle;
                line-height: 1;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* Disabled state */
            .ui-button:disabled,
            .ui-button.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }
            
            /* Focus styles */
            .ui-button:focus-visible {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            /* Loading state */
            .ui-button.loading {
                color: transparent;
                pointer-events: none;
            }
            
            .ui-button.loading > *:not(.button-loading-icon) {
                opacity: 0;
            }
            
            /* Loading spinner */
            .button-spinner {
                position: absolute;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
            }
            
            .button-spinner-circle {
                stroke-dasharray: 1, 200;
                stroke-dashoffset: 0;
                animation: dash 1.5s ease-in-out infinite;
                stroke-linecap: round;
            }
            
            @keyframes dash {
                0% {
                    stroke-dasharray: 1, 200;
                    stroke-dashoffset: 0;
                }
                50% {
                    stroke-dasharray: 90, 200;
                    stroke-dashoffset: -35px;
                }
                100% {
                    stroke-dasharray: 90, 200;
                    stroke-dashoffset: -124px;
                }
            }
            
            /* Loading dots */
            .button-dots {
                position: absolute;
                display: flex;
                gap: 4px;
            }
            
            .button-dots span {
                width: 6px;
                height: 6px;
                background: currentColor;
                border-radius: 50%;
                animation: dots 1.4s ease-in-out infinite both;
            }
            
            .button-dots span:nth-child(1) { animation-delay: -0.32s; }
            .button-dots span:nth-child(2) { animation-delay: -0.16s; }
            
            /* Ripple effect */
            .button-ripple {
                position: absolute;
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            }
            
            /* Badge */
            .button-badge {
                position: absolute;
                min-width: 18px;
                height: 18px;
                padding: 0 4px;
                background: #ef4444;
                color: white;
                font-size: 11px;
                font-weight: 600;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                top: -6px;
                right: -6px;
                animation: badge-bounce 0.3s ease;
            }
            
            @keyframes badge-bounce {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            /* Icon styles */
            .button-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            /* Progress bar */
            .button-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                opacity: 0.3;
                transition: width 0.3s ease;
            }
            
            /* Tooltip */
            .button-tooltip {
                position: absolute;
                padding: 6px 12px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                font-size: 12px;
                border-radius: 4px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transform: translateY(5px);
                transition: all 0.3s ease;
                z-index: 1000;
            }
            
            .button-tooltip.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .button-tooltip::before {
                content: '';
                position: absolute;
                width: 0;
                height: 0;
                border: 4px solid transparent;
            }
            
            .button-tooltip.top {
                bottom: calc(100% + 8px);
                left: 50%;
                transform: translateX(-50%) translateY(5px);
            }
            
            .button-tooltip.top.show {
                transform: translateX(-50%) translateY(0);
            }
            
            .button-tooltip.top::before {
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border-top-color: rgba(0, 0, 0, 0.9);
            }
            
            /* Particles container */
            .button-particles {
                position: absolute;
                inset: 0;
                pointer-events: none;
                overflow: visible;
            }
            
            .particle {
                position: absolute;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                animation: particle-float 1s ease-out forwards;
            }
            
            /* Shimmer effect */
            .ui-button.shimmer::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.4),
                    transparent
                );
                animation: shimmer 2s infinite;
            }
            
            /* Button group */
            .button-group {
                display: inline-flex;
                gap: -1px;
            }
            
            .button-group .ui-button {
                border-radius: 0;
            }
            
            .button-group .ui-button:first-child {
                border-top-left-radius: var(--radius);
                border-bottom-left-radius: var(--radius);
            }
            
            .button-group .ui-button:last-child {
                border-top-right-radius: var(--radius);
                border-bottom-right-radius: var(--radius);
            }
            
            /* Split button */
            .split-button {
                display: inline-flex;
                position: relative;
            }
            
            .split-button .ui-button:first-child {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
                padding-right: 12px;
            }
            
            .split-button .ui-button:last-child {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
                border-left: 0;
                padding: 0 8px;
                min-width: auto;
            }
            
            .split-button .ui-button:last-child::before {
                content: '';
                position: absolute;
                left: 0;
                top: 20%;
                bottom: 20%;
                width: 1px;
                background: currentColor;
                opacity: 0.2;
            }
            
            /* Floating action button */
            .ui-button.fab {
                position: fixed;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                padding: 0;
                z-index: 1000;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }
            
            .ui-button.fab.mini {
                width: 40px;
                height: 40px;
            }
            
            /* Full width */
            .ui-button.full-width {
                width: 100%;
            }
            
            /* Icon-only button */
            .ui-button.icon-only {
                padding: 8px;
                min-width: auto;
                aspect-ratio: 1;
            }
            
            /* Rounded button */
            .ui-button.rounded {
                border-radius: 9999px;
            }
            
            /* Shake animation */
            .ui-button.shake {
                animation: shake 0.5s ease;
            }
            
            /* Confetti container */
            .confetti-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            }
            
            .confetti {
                position: absolute;
                width: 10px;
                height: 10px;
                background: #ff6b6b;
                animation: confetti-fall 3s ease-out forwards;
            }
        `;

        document.head.appendChild(style);
        stylesInjected = true;
    }

    /**
     * Créer l'élément bouton
     */
    function createButton(options = {}) {
        const {
            // Texte et contenu
            text = '',
            html = '',
            
            // Type et style
            type = 'primary',
            style = 'glassmorphism',
            
            // Taille
            size = 'md',
            fullWidth = false,
            
            // État
            disabled = false,
            loading = false,
            active = false,
            
            // Icônes
            icon = null,
            iconPosition = 'start',
            iconOnly = false,
            
            // Animation
            animation = 'smooth',
            ripple = false,
            particles = false,
            shimmer = false,
            
            // Badge
            badge = null,
            
            // Tooltip
            tooltip = null,
            
            // Gradient
            gradient = null,
            
            // Classes et styles personnalisés
            className = '',
            customStyle = {},
            
            // Attributs
            id = '',
            name = '',
            value = '',
            ariaLabel = '',
            tabIndex = 0,
            
            // Événements
            onClick = null,
            onHover = null,
            onFocus = null,
            onBlur = null,
            
            // Autres options
            sound = false,
            haptic = false,
            href = null,
            target = null,
            download = null,
            form = null,
            formAction = null,
            formMethod = null,
            rounded = false,
            fab = false,
            fabPosition = { bottom: 20, right: 20 }
        } = options;

        // Créer l'élément (button ou a)
        const element = href ? 'a' : 'button';
        const button = document.createElement(element);
        
        // Classes de base
        const classes = ['ui-button'];
        
        // Ajouter les classes selon les options
        if (type) classes.push(type);
        if (style) classes.push(style);
        if (size) classes.push(size);
        if (fullWidth) classes.push('full-width');
        if (disabled) classes.push('disabled');
        if (loading) classes.push('loading');
        if (active) classes.push('active');
        if (iconOnly) classes.push('icon-only');
        if (rounded) classes.push('rounded');
        if (fab) classes.push('fab', fab === 'mini' ? 'mini' : '');
        if (shimmer) classes.push('shimmer');
        if (className) classes.push(className);
        
        button.className = classes.join(' ');
        
        // Attributs
        if (id) button.id = id;
        if (name) button.name = name;
        if (value) button.value = value;
        if (disabled && element === 'button') button.disabled = true;
        if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
        if (tabIndex !== null) button.tabIndex = tabIndex;
        
        // Attributs pour les liens
        if (href) {
            button.href = href;
            if (target) button.target = target;
            if (download) button.download = download;
        }
        
        // Attributs pour les formulaires
        if (form) button.form = form;
        if (formAction) button.formAction = formAction;
        if (formMethod) button.formMethod = formMethod;
        
        // Appliquer les styles selon le type et style
        applyButtonStyles(button, type, style, options);
        
        // Contenu du bouton
        let content = '';
        
        // Icône (début)
        if (icon && iconPosition === 'start') {
            content += createIcon(icon, size);
        }
        
        // Texte ou HTML
        if (!iconOnly) {
            if (html) {
                content += `<span class="button-content">${html}</span>`;
            } else if (text) {
                content += `<span class="button-text">${text}</span>`;
            }
        }
        
        // Icône (fin)
        if (icon && iconPosition === 'end') {
            content += createIcon(icon, size);
        }
        
        button.innerHTML = content;
        
        // Ajouter les éléments supplémentaires
        if (loading) {
            addLoadingState(button, loading, style);
        }
        
        if (badge !== null) {
            addBadge(button, badge);
        }
        
        if (tooltip) {
            addTooltip(button, tooltip);
        }
        
        if (ripple || (animation === 'rich' && CONFIG.animations.rich.ripple)) {
            enableRippleEffect(button);
        }
        
        if (particles || (animation === 'rich' && CONFIG.animations.rich.particles)) {
            enableParticles(button);
        }
        
        // Gestionnaires d'événements
        if (onClick) {
            button.addEventListener('click', (e) => {
                if (sound) playSound('click');
                if (haptic) triggerHaptic('click');
                if (animation === 'playful' && CONFIG.animations.playful.shake) {
                    button.classList.add('shake');
                    setTimeout(() => button.classList.remove('shake'), 500);
                }
                onClick(e);
            });
        }
        
        if (onHover) {
            button.addEventListener('mouseenter', (e) => {
                if (sound) playSound('hover');
                if (haptic) triggerHaptic('hover');
                onHover(e);
            });
        }
        
        if (onFocus) button.addEventListener('focus', onFocus);
        if (onBlur) button.addEventListener('blur', onBlur);
        
        // Animations spéciales au hover
        if (animation && CONFIG.animations[animation]) {
            applyAnimations(button, animation);
        }
        
        // Position FAB
        if (fab) {
            Object.entries(fabPosition).forEach(([key, value]) => {
                button.style[key] = `${value}px`;
            });
        }
        
        // Confetti pour animation playful
        if (animation === 'playful' && CONFIG.animations.playful.confetti) {
            button.addEventListener('click', () => createConfetti());
        }
        
        return button;
    }

    /**
     * Appliquer les styles au bouton
     */
    function applyButtonStyles(button, type, style, options) {
        const typeConfig = CONFIG.types[type] || CONFIG.types.primary;
        const styleConfig = CONFIG.styles[style] || CONFIG.styles.glassmorphism;
        const sizeConfig = CONFIG.sizes[options.size || 'md'];
        
        // Appliquer les styles de base du type
        button.style.background = typeConfig.bg;
        button.style.color = typeConfig.color;
        button.style.borderColor = typeConfig.border;
        if (typeConfig.borderWidth) button.style.borderWidth = typeConfig.borderWidth;
        
        // Appliquer les styles du style visuel
        Object.entries(styleConfig).forEach(([prop, value]) => {
            if (prop === 'backdropFilter') {
                button.style.backdropFilter = value;
                button.style.webkitBackdropFilter = value;
            } else {
                button.style[prop] = value;
            }
        });
        
        // Appliquer la taille
        button.style.padding = sizeConfig.padding;
        button.style.fontSize = sizeConfig.fontSize;
        button.style.height = sizeConfig.height;
        
        // Gradient personnalisé
        if (options.gradient) {
            const { from, to, angle = 135 } = options.gradient;
            button.style.background = `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
            button.style.color = '#ffffff';
            button.style.borderColor = 'transparent';
        }
        
        // Styles personnalisés
        if (options.customStyle) {
            Object.assign(button.style, options.customStyle);
        }
        
        // Variables CSS pour les animations
        button.style.setProperty('--radius', styleConfig.borderRadius || '12px');
    }

    /**
     * Créer une icône
     */
    function createIcon(icon, size) {
        const sizeConfig = CONFIG.sizes[size] || CONFIG.sizes.md;
        let iconHtml = '';
        
        if (typeof icon === 'string') {
            // Vérifier si c'est une icône prédéfinie
            const predefinedIcon = CONFIG.icons[icon];
            iconHtml = predefinedIcon || icon;
        } else if (icon.svg) {
            iconHtml = icon.svg;
        } else if (icon.emoji) {
            iconHtml = icon.emoji;
        } else if (icon.html) {
            iconHtml = icon.html;
        } else if (icon.name) {
            const predefinedIcon = CONFIG.icons[icon.name];
            iconHtml = predefinedIcon || icon.name;
        }
        
        return `<span class="button-icon" style="font-size: ${sizeConfig.iconSize}">${iconHtml}</span>`;
    }

    /**
     * Ajouter l'état de chargement
     */
    function addLoadingState(button, loading, style) {
        const loadingConfig = typeof loading === 'object' ? loading : { state: loading };
        const { state, type = 'spinner', progress = 0, text = '' } = loadingConfig;
        
        if (!state) return;
        
        const loadingState = CONFIG.loadingStates[type] || CONFIG.loadingStates.spinner;
        
        if (type === 'spinner' || type === 'dots') {
            const loadingIcon = document.createElement('span');
            loadingIcon.className = 'button-loading-icon';
            loadingIcon.innerHTML = loadingState.icon;
            loadingIcon.style.position = 'absolute';
            button.appendChild(loadingIcon);
        }
        
        if (type === 'progress' && loadingState.showBar) {
            const progressBar = document.createElement('span');
            progressBar.className = 'button-progress';
            progressBar.style.width = `${progress}%`;
            button.appendChild(progressBar);
        }
        
        if (text) {
            const textSpan = button.querySelector('.button-text');
            if (textSpan) textSpan.textContent = text;
        }
    }

    /**
     * Ajouter un badge
     */
    function addBadge(button, badge) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'button-badge';
        
        if (typeof badge === 'object') {
            badgeEl.textContent = badge.text || badge.count || '';
            if (badge.color) badgeEl.style.background = badge.color;
            if (badge.position) {
                const [vertical, horizontal] = badge.position.split('-');
                badgeEl.style[vertical] = '-6px';
                badgeEl.style[horizontal] = '-6px';
            }
        } else {
            badgeEl.textContent = badge;
        }
        
        button.appendChild(badgeEl);
    }

    /**
     * Ajouter un tooltip
     */
    function addTooltip(button, tooltip) {
        const tooltipConfig = typeof tooltip === 'string' 
            ? { text: tooltip } 
            : tooltip;
            
        const { text, position = 'top', delay = 500 } = tooltipConfig;
        
        const tooltipEl = document.createElement('span');
        tooltipEl.className = `button-tooltip ${position}`;
        tooltipEl.textContent = text;
        button.appendChild(tooltipEl);
        
        let timeoutId;
        
        button.addEventListener('mouseenter', () => {
            timeoutId = setTimeout(() => {
                tooltipEl.classList.add('show');
            }, delay);
        });
        
        button.addEventListener('mouseleave', () => {
            clearTimeout(timeoutId);
            tooltipEl.classList.remove('show');
        });
    }

    /**
     * Activer l'effet ripple
     */
    function enableRippleEffect(button) {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'button-ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.background = CONFIG.features.ripple.color;
            
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.marginLeft = -size/2 + 'px';
            ripple.style.marginTop = -size/2 + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), CONFIG.features.ripple.duration);
        });
    }

    /**
     * Activer les particules
     */
    function enableParticles(button) {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const container = document.createElement('div');
            container.className = 'button-particles';
            this.appendChild(container);
            
            const { count, colors, duration } = CONFIG.features.particles;
            
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('span');
                particle.className = 'particle';
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                
                const angle = (360 / count) * i;
                const distance = 50 + Math.random() * 50;
                const rad = angle * Math.PI / 180;
                const xDest = Math.cos(rad) * distance;
                const yDest = Math.sin(rad) * distance;
                
                particle.style.setProperty('--x', xDest + 'px');
                particle.style.setProperty('--y', yDest + 'px');
                
                container.appendChild(particle);
            }
            
            setTimeout(() => container.remove(), duration);
        });
    }

    /**
     * Appliquer les animations
     */
    function applyAnimations(button, animation) {
        const animConfig = CONFIG.animations[animation];
        if (!animConfig || !animConfig.enabled !== false) return;
        
        // Hover animations
        if (animConfig.hover) {
            button.addEventListener('mouseenter', function() {
                Object.entries(animConfig.hover).forEach(([prop, value]) => {
                    if (prop === 'animation') {
                        this.style.animation = value;
                    } else if (prop !== 'duration' && prop !== 'timing') {
                        this.style[prop] = value;
                    }
                });
            });
            
            button.addEventListener('mouseleave', function() {
                Object.entries(animConfig.hover).forEach(([prop]) => {
                    if (prop === 'animation') {
                        this.style.animation = '';
                    } else if (prop !== 'duration' && prop !== 'timing') {
                        this.style[prop] = '';
                    }
                });
            });
        }
        
        // Active animations
        if (animConfig.active) {
            button.addEventListener('mousedown', function() {
                Object.entries(animConfig.active).forEach(([prop, value]) => {
                    if (prop === 'animation') {
                        this.style.animation = value;
                    } else if (prop !== 'duration' && prop !== 'timing') {
                        this.style[prop] = value;
                    }
                });
            });
            
            button.addEventListener('mouseup', function() {
                Object.entries(animConfig.active).forEach(([prop]) => {
                    if (prop === 'animation') {
                        this.style.animation = '';
                    } else if (prop !== 'duration' && prop !== 'timing') {
                        this.style[prop] = '';
                    }
                });
            });
        }
    }

    /**
     * Jouer un son
     */
    async function playSound(type) {
        if (!soundsEnabled || !CONFIG.features.sound[type]) return;
        
        try {
            if (!audioCache[type]) {
                audioCache[type] = new Audio(CONFIG.features.sound[type]);
            }
            await audioCache[type].play();
        } catch (e) {
            console.warn('Impossible de jouer le son:', e);
        }
    }

    /**
     * Déclencher un retour haptique
     */
    function triggerHaptic(type) {
        if ('vibrate' in navigator && CONFIG.features.haptic[type]) {
            const { duration, intensity } = CONFIG.features.haptic[type];
            navigator.vibrate(duration);
        }
    }

    /**
     * Créer des confettis
     */
    function createConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd93d', '#a8e6cf'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            container.appendChild(confetti);
        }
        
        setTimeout(() => container.remove(), 4000);
    }

    /**
     * Créer un groupe de boutons
     */
    function createButtonGroup(buttons, options = {}) {
        const { orientation = 'horizontal', spacing = -1 } = options;
        
        const group = document.createElement('div');
        group.className = 'button-group';
        if (orientation === 'vertical') {
            group.style.flexDirection = 'column';
        }
        if (spacing !== -1) {
            group.style.gap = `${spacing}px`;
        }
        
        buttons.forEach((buttonOptions) => {
            const button = createButton(buttonOptions);
            group.appendChild(button);
        });
        
        return group;
    }

    /**
     * Créer un split button
     */
    function createSplitButton(mainButton, dropdownButton, options = {}) {
        const container = document.createElement('div');
        container.className = 'split-button';
        
        const main = createButton(mainButton);
        const dropdown = createButton({
            ...dropdownButton,
            icon: dropdownButton.icon || 'filter',
            iconOnly: true
        });
        
        container.appendChild(main);
        container.appendChild(dropdown);
        
        return container;
    }

    // 🎯 API PUBLIQUE
    return {
        /**
         * Créer un bouton
         * @param {Object} options - Options de configuration
         * @returns {Promise<HTMLElement>} Element bouton
         */
        async create(options = {}) {
            if (!stylesInjected) {
                injectStyles();
            }
            
            // Simuler le chargement asynchrone
            await new Promise(resolve => setTimeout(resolve, 0));
            
            return createButton(options);
        },

        /**
         * Créer un groupe de boutons
         * @param {Array} buttons - Tableau de configurations de boutons
         * @param {Object} options - Options du groupe
         * @returns {Promise<HTMLElement>} Groupe de boutons
         */
        async createGroup(buttons, options = {}) {
            if (!stylesInjected) {
                injectStyles();
            }
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            return createButtonGroup(buttons, options);
        },

        /**
         * Créer un split button
         * @param {Object} mainButton - Config du bouton principal
         * @param {Object} dropdownButton - Config du bouton dropdown
         * @param {Object} options - Options
         * @returns {Promise<HTMLElement>} Split button
         */
        async createSplit(mainButton, dropdownButton, options = {}) {
            if (!stylesInjected) {
                injectStyles();
            }
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            return createSplitButton(mainButton, dropdownButton, options);
        },

        /**
         * Mettre à jour un bouton existant
         * @param {HTMLElement|string} button - Bouton ou sélecteur
         * @param {Object} updates - Mises à jour
         */
        update(button, updates) {
            const el = typeof button === 'string' 
                ? document.querySelector(button) 
                : button;
                
            if (!el || !el.classList.contains('ui-button')) return;
            
            // Mettre à jour le texte
            if (updates.text !== undefined) {
                const textEl = el.querySelector('.button-text');
                if (textEl) textEl.textContent = updates.text;
            }
            
            // Mettre à jour l'état de chargement
            if (updates.loading !== undefined) {
                if (updates.loading) {
                    el.classList.add('loading');
                    addLoadingState(el, updates.loading);
                } else {
                    el.classList.remove('loading');
                    const loadingIcon = el.querySelector('.button-loading-icon');
                    if (loadingIcon) loadingIcon.remove();
                }
            }
            
            // Mettre à jour le disabled
            if (updates.disabled !== undefined) {
                if (updates.disabled) {
                    el.classList.add('disabled');
                    el.disabled = true;
                } else {
                    el.classList.remove('disabled');
                    el.disabled = false;
                }
            }
            
            // Mettre à jour le badge
            if (updates.badge !== undefined) {
                const existingBadge = el.querySelector('.button-badge');
                if (existingBadge) existingBadge.remove();
                if (updates.badge !== null) {
                    addBadge(el, updates.badge);
                }
            }
            
            // Mettre à jour les styles
            if (updates.type || updates.style) {
                if (updates.type) {
                    // Retirer l'ancien type
                    Object.keys(CONFIG.types).forEach(t => el.classList.remove(t));
                    el.classList.add(updates.type);
                }
                if (updates.style) {
                    // Retirer l'ancien style
                    Object.keys(CONFIG.styles).forEach(s => el.classList.remove(s));
                    el.classList.add(updates.style);
                }
                // Réappliquer les styles
                applyButtonStyles(el, updates.type || 'primary', updates.style || 'glassmorphism', {});
            }
        },

        /**
         * Détruire un bouton
         * @param {HTMLElement|string} button - Bouton ou sélecteur
         */
        destroy(button) {
            const el = typeof button === 'string' 
                ? document.querySelector(button) 
                : button;
                
            if (el && el.classList.contains('ui-button')) {
                el.remove();
            }
        },

        /**
         * Configuration globale
         */
        config(options = {}) {
            if (options.sounds !== undefined) {
                soundsEnabled = options.sounds;
            }
            if (options.customTypes) {
                Object.assign(CONFIG.types, options.customTypes);
            }
            if (options.customStyles) {
                Object.assign(CONFIG.styles, options.customStyles);
            }
            if (options.customAnimations) {
                Object.assign(CONFIG.animations, options.customAnimations);
            }
            if (options.customIcons) {
                Object.assign(CONFIG.icons, options.customIcons);
            }
        },

        /**
         * Obtenir la configuration
         */
        getConfig() {
            return CONFIG;
        },

        /**
         * Exposer la configuration pour référence
         */
        CONFIG,

        /**
         * Injecter les styles manuellement
         */
        injectStyles
    };
})();

// Export pour modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButtonComponent;
}

// Export pour le système UI global
window.ButtonComponent = ButtonComponent;