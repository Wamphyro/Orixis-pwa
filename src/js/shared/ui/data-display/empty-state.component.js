/* ========================================
   EMPTY-STATE.COMPONENT.JS - Composant d'état vide
   Chemin: src/js/shared/ui/data-display/empty-state.component.js
   
   DESCRIPTION:
   Composant pour afficher des états vides élégants avec style glassmorphism.
   Utilisé pour les listes vides, recherches sans résultats, erreurs, etc.
   Inclut des illustrations animées et des calls-to-action.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. Bibliothèque d'illustrations SVG (lignes 401-800)
   3. Création du DOM (lignes 801-1000)
   4. Système d'animations (lignes 1001-1200)
   5. API publique (lignes 1201-1300)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - ui.config.js (configuration globale si disponible)
   - CSS intégré ou empty-state.component.css
   ======================================== */

const EmptyStateComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    borderRadius: '24px'
                },
                text: {
                    titleColor: 'rgba(255, 255, 255, 0.95)',
                    descriptionColor: 'rgba(255, 255, 255, 0.7)',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                },
                illustration: {
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))',
                    opacity: 0.9
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    backdropFilter: 'none',
                    border: 'none',
                    boxShadow: '20px 20px 60px #bec3cb, -20px -20px 60px #ffffff',
                    borderRadius: '30px'
                },
                text: {
                    titleColor: '#2d3748',
                    descriptionColor: '#4a5568',
                    textShadow: 'none'
                },
                illustration: {
                    filter: 'none',
                    opacity: 0.8
                }
            },
            'flat': {
                container: {
                    background: '#f7fafc',
                    backdropFilter: 'none',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                    borderRadius: '16px'
                },
                text: {
                    titleColor: '#1a202c',
                    descriptionColor: '#718096',
                    textShadow: 'none'
                },
                illustration: {
                    filter: 'none',
                    opacity: 1
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    backdropFilter: 'none',
                    border: 'none',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                    borderRadius: '8px'
                },
                text: {
                    titleColor: '#212121',
                    descriptionColor: '#757575',
                    textShadow: 'none'
                },
                illustration: {
                    filter: 'none',
                    opacity: 0.87
                }
            },
            'gradient': {
                container: {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    borderRadius: '20px'
                },
                text: {
                    titleColor: '#ffffff',
                    descriptionColor: 'rgba(255, 255, 255, 0.8)',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                },
                illustration: {
                    filter: 'drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3))',
                    opacity: 0.95
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    backdropFilter: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    borderRadius: '0'
                },
                text: {
                    titleColor: '#000000',
                    descriptionColor: '#666666',
                    textShadow: 'none'
                },
                illustration: {
                    filter: 'none',
                    opacity: 0.6
                }
            }
        },

        // Types d'états vides prédéfinis
        types: {
            'no-data': {
                icon: 'inbox',
                title: 'Aucune donnée',
                description: 'Il n\'y a pas encore de données à afficher.',
                illustration: 'empty-box',
                color: '#6366f1'
            },
            'no-results': {
                icon: 'search',
                title: 'Aucun résultat',
                description: 'Aucun résultat ne correspond à votre recherche.',
                illustration: 'search-empty',
                color: '#8b5cf6'
            },
            'error': {
                icon: 'alert-circle',
                title: 'Une erreur est survenue',
                description: 'Impossible de charger les données. Veuillez réessayer.',
                illustration: 'error-robot',
                color: '#ef4444'
            },
            'offline': {
                icon: 'wifi-off',
                title: 'Hors ligne',
                description: 'Vérifiez votre connexion internet et réessayez.',
                illustration: 'no-connection',
                color: '#f59e0b'
            },
            'maintenance': {
                icon: 'tool',
                title: 'Maintenance en cours',
                description: 'Cette fonctionnalité est temporairement indisponible.',
                illustration: 'maintenance',
                color: '#3b82f6'
            },
            'coming-soon': {
                icon: 'clock',
                title: 'Bientôt disponible',
                description: 'Cette fonctionnalité sera bientôt disponible.',
                illustration: 'rocket',
                color: '#10b981'
            },
            'access-denied': {
                icon: 'lock',
                title: 'Accès refusé',
                description: 'Vous n\'avez pas les permissions nécessaires.',
                illustration: 'locked',
                color: '#f97316'
            },
            'empty-cart': {
                icon: 'shopping-cart',
                title: 'Panier vide',
                description: 'Votre panier est vide. Commencez vos achats!',
                illustration: 'empty-cart',
                color: '#ec4899'
            },
            'no-notifications': {
                icon: 'bell',
                title: 'Aucune notification',
                description: 'Vous êtes à jour avec toutes vos notifications.',
                illustration: 'notifications',
                color: '#14b8a6'
            },
            'custom': {
                icon: 'help-circle',
                title: 'État personnalisé',
                description: '',
                illustration: 'custom',
                color: '#6b7280'
            }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                container: { padding: '24px', maxWidth: '300px' },
                illustration: { width: '80px', height: '80px' },
                title: { fontSize: '16px', marginBottom: '8px' },
                description: { fontSize: '14px', marginBottom: '16px' },
                spacing: { gap: '16px' }
            },
            'medium': {
                container: { padding: '48px', maxWidth: '400px' },
                illustration: { width: '120px', height: '120px' },
                title: { fontSize: '20px', marginBottom: '12px' },
                description: { fontSize: '16px', marginBottom: '24px' },
                spacing: { gap: '24px' }
            },
            'large': {
                container: { padding: '64px', maxWidth: '500px' },
                illustration: { width: '160px', height: '160px' },
                title: { fontSize: '24px', marginBottom: '16px' },
                description: { fontSize: '18px', marginBottom: '32px' },
                spacing: { gap: '32px' }
            },
            'fullscreen': {
                container: { padding: '80px', maxWidth: '600px', minHeight: '100vh' },
                illustration: { width: '200px', height: '200px' },
                title: { fontSize: '32px', marginBottom: '20px' },
                description: { fontSize: '20px', marginBottom: '40px' },
                spacing: { gap: '40px' }
            }
        },

        // Animations disponibles
        animations: {
            'none': {
                enabled: false
            },
            'fade': {
                enabled: true,
                keyframes: [
                    { opacity: 0, transform: 'translateY(20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                options: { duration: 600, easing: 'ease-out', fill: 'forwards' }
            },
            'scale': {
                enabled: true,
                keyframes: [
                    { opacity: 0, transform: 'scale(0.8)' },
                    { opacity: 1, transform: 'scale(1)' }
                ],
                options: { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
            },
            'bounce': {
                enabled: true,
                keyframes: [
                    { opacity: 0, transform: 'scale(0.3) translateY(100px)' },
                    { opacity: 0.9, transform: 'scale(1.1)' },
                    { opacity: 1, transform: 'scale(1)' }
                ],
                options: { duration: 800, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', fill: 'forwards' }
            },
            'float': {
                enabled: true,
                continuous: true,
                keyframes: [
                    { transform: 'translateY(0px)' },
                    { transform: 'translateY(-10px)' },
                    { transform: 'translateY(0px)' }
                ],
                options: { duration: 3000, iterations: Infinity, easing: 'ease-in-out' }
            },
            'pulse': {
                enabled: true,
                continuous: true,
                target: 'illustration',
                keyframes: [
                    { transform: 'scale(1)', opacity: 0.9 },
                    { transform: 'scale(1.05)', opacity: 1 },
                    { transform: 'scale(1)', opacity: 0.9 }
                ],
                options: { duration: 2000, iterations: Infinity, easing: 'ease-in-out' }
            },
            'slide': {
                enabled: true,
                keyframes: [
                    { opacity: 0, transform: 'translateX(-50px)' },
                    { opacity: 1, transform: 'translateX(0)' }
                ],
                options: { duration: 600, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' }
            },
            'morph': {
                enabled: true,
                keyframes: [
                    { opacity: 0, transform: 'scale(0.8) rotate(-180deg)' },
                    { opacity: 0.5, transform: 'scale(1.1) rotate(-90deg)' },
                    { opacity: 1, transform: 'scale(1) rotate(0deg)' }
                ],
                options: { duration: 1000, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', fill: 'forwards' }
            }
        },

        // Layouts disponibles
        layouts: {
            'vertical': {
                container: { flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
                content: { maxWidth: '100%' }
            },
            'horizontal': {
                container: { flexDirection: 'row', alignItems: 'center', textAlign: 'left' },
                content: { flex: 1, paddingLeft: '32px' }
            },
            'compact': {
                container: { flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
                content: { maxWidth: '100%' },
                spacing: { gap: '12px' }
            },
            'spacious': {
                container: { flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
                content: { maxWidth: '100%' },
                spacing: { gap: '48px' }
            }
        },

        // Features disponibles
        features: {
            'actions': {
                enabled: true,
                maxActions: 3,
                style: 'button', // 'button', 'link', 'icon'
                alignment: 'center' // 'center', 'left', 'right', 'stretch'
            },
            'badge': {
                enabled: false,
                position: 'top-right',
                style: 'dot' // 'dot', 'count', 'text'
            },
            'progress': {
                enabled: false,
                type: 'linear', // 'linear', 'circular'
                position: 'bottom'
            },
            'background': {
                enabled: false,
                type: 'pattern', // 'pattern', 'gradient', 'image'
                opacity: 0.05
            },
            'interactive': {
                enabled: true,
                hoverEffect: true,
                clickable: false,
                draggable: false
            }
        },

        // Configuration par défaut
        defaults: {
            type: 'no-data',
            style: 'glassmorphism',
            size: 'medium',
            layout: 'vertical',
            animation: 'fade',
            showIllustration: true,
            showIcon: false,
            className: '',
            customColors: null
        }
    };

    // ========================================
    // BIBLIOTHÈQUE D'ILLUSTRATIONS SVG
    // ========================================
    const ILLUSTRATIONS = {
        'empty-box': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <rect x="40" y="60" width="120" height="100" rx="8" stroke="currentColor" stroke-width="3" fill="none" opacity="0.3"/>
                    <path d="M40 80L100 110L160 80" stroke="currentColor" stroke-width="3" opacity="0.5"/>
                    <path d="M100 110V160" stroke="currentColor" stroke-width="3" opacity="0.5"/>
                    <circle cx="100" cy="100" r="60" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5" fill="none" opacity="0.2"/>
                    <path d="M70 120C70 120 80 130 100 130C120 130 130 120 130 120" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
                </g>
            </svg>
        `,
        'search-empty': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <circle cx="85" cy="85" r="40" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <path d="M115 115L140 140" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                    <path d="M65 85C65 85 75 95 85 95C95 95 105 85 105 85" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
                    <circle cx="70" cy="70" r="3" fill="currentColor" opacity="0.6"/>
                    <circle cx="100" cy="70" r="3" fill="currentColor" opacity="0.6"/>
                    <rect x="50" y="130" width="100" height="8" rx="4" fill="currentColor" opacity="0.2"/>
                    <rect x="60" y="145" width="80" height="6" rx="3" fill="currentColor" opacity="0.15"/>
                </g>
            </svg>
        `,
        'error-robot': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <rect x="60" y="70" width="80" height="90" rx="12" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <circle cx="100" cy="50" r="25" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <path d="M100 25V45" stroke="currentColor" stroke-width="3" opacity="0.5"/>
                    <circle cx="100" cy="20" r="5" fill="currentColor" opacity="0.6"/>
                    <circle cx="85" cy="50" r="4" fill="currentColor" opacity="0.8"/>
                    <circle cx="115" cy="50" r="4" fill="currentColor" opacity="0.8"/>
                    <path d="M80 100L120 100" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
                    <path d="M80 120L120 120" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
                    <path d="M80 140L120 140" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.2"/>
                    <text x="100" y="110" text-anchor="middle" font-size="24" fill="currentColor" opacity="0.8">X_X</text>
                </g>
            </svg>
        `,
        'no-connection': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <path d="M100 140C130 140 155 115 155 85C155 55 130 30 100 30" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 5" opacity="0.3"/>
                    <path d="M100 140C70 140 45 115 45 85C45 55 70 30 100 30" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 5" opacity="0.3"/>
                    <circle cx="100" cy="140" r="8" fill="currentColor" opacity="0.8"/>
                    <path d="M70 60L130 120M130 60L70 120" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
                    <rect x="80" y="150" width="40" height="20" rx="4" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                </g>
            </svg>
        `,
        'maintenance': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <path d="M85 45L115 45L120 85L100 100L80 85Z" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <circle cx="100" cy="100" r="50" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="10 5" opacity="0.3"/>
                    <rect x="90" y="100" width="20" height="40" rx="10" fill="currentColor" opacity="0.6"/>
                    <path d="M60 140L70 130M140 140L130 130" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                    <path d="M85 60C85 60 90 65 100 65C110 65 115 60 115 60" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
                </g>
            </svg>
        `,
        'rocket': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <path d="M100 40C100 40 120 60 120 100C120 140 100 160 100 160C100 160 80 140 80 100C80 60 100 40 100 40Z" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <circle cx="100" cy="80" r="15" stroke="currentColor" stroke-width="3" fill="none" opacity="0.6"/>
                    <path d="M80 140L70 160M120 140L130 160" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
                    <path d="M90 160C90 160 95 180 100 180C105 180 110 160 110 160" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
                    <circle cx="100" cy="80" r="8" fill="currentColor" opacity="0.8"/>
                </g>
            </svg>
        `,
        'locked': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <rect x="60" y="90" width="80" height="60" rx="8" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <path d="M80 90V70C80 60 90 50 100 50C110 50 120 60 120 70V90" stroke="currentColor" stroke-width="3" fill="none" opacity="0.6"/>
                    <circle cx="100" cy="115" r="8" fill="currentColor" opacity="0.8"/>
                    <path d="M100 115V130" stroke="currentColor" stroke-width="3" opacity="0.6"/>
                    <path d="M70 60L60 50M130 60L140 50" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
                </g>
            </svg>
        `,
        'empty-cart': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <path d="M50 50L60 60H140L130 110H70L60 60" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.5"/>
                    <circle cx="80" cy="140" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <circle cx="120" cy="140" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <path d="M85 80C85 80 90 85 100 85C110 85 115 80 115 80" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
                    <circle cx="90" cy="70" r="3" fill="currentColor" opacity="0.6"/>
                    <circle cx="110" cy="70" r="3" fill="currentColor" opacity="0.6"/>
                </g>
            </svg>
        `,
        'notifications': `
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g class="empty-state-illustration">
                    <path d="M80 80C80 69 89 60 100 60C111 60 120 69 120 80V110L130 120H70L80 110V80Z" stroke="currentColor" stroke-width="3" fill="none" opacity="0.5"/>
                    <path d="M85 120C85 128 92 135 100 135C108 135 115 128 115 120" stroke="currentColor" stroke-width="3" opacity="0.6"/>
                    <circle cx="100" cy="50" r="5" fill="currentColor" opacity="0.4"/>
                    <path d="M60 100L50 90M140 100L150 90" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
                    <text x="100" y="95" text-anchor="middle" font-size="20" fill="currentColor" opacity="0.6">Zzz</text>
                </g>
            </svg>
        `
    };

    // ========================================
    // GESTION DU DOM ET DES STYLES
    // ========================================
    let styleSheet = null;

    function injectStyles() {
        if (styleSheet) return;

        const styles = `
            /* ========================================
               EMPTY STATE STYLES
               ======================================== */
            .empty-state-container {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                min-height: 200px;
                position: relative;
                overflow: hidden;
            }

            .empty-state {
                display: flex;
                align-items: center;
                position: relative;
                z-index: 1;
                transition: all 0.3s ease;
            }

            /* Glassmorphism style */
            .empty-state.glassmorphism {
                background: ${CONFIG.styles.glassmorphism.container.background};
                backdrop-filter: ${CONFIG.styles.glassmorphism.container.backdropFilter};
                -webkit-backdrop-filter: ${CONFIG.styles.glassmorphism.container.backdropFilter};
                border: ${CONFIG.styles.glassmorphism.container.border};
                box-shadow: ${CONFIG.styles.glassmorphism.container.boxShadow};
                border-radius: ${CONFIG.styles.glassmorphism.container.borderRadius};
            }

            /* Hover effect for glassmorphism */
            .empty-state.glassmorphism.interactive:hover {
                background: rgba(255, 255, 255, 0.12);
                transform: translateY(-2px);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }

            /* Content wrapper */
            .empty-state-content {
                display: flex;
                flex-direction: column;
                align-items: inherit;
                text-align: inherit;
                width: 100%;
            }

            /* Illustration */
            .empty-state-illustration-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .empty-state-illustration {
                width: 100%;
                height: 100%;
                color: currentColor;
            }

            .empty-state.glassmorphism .empty-state-illustration {
                filter: ${CONFIG.styles.glassmorphism.illustration.filter};
                opacity: ${CONFIG.styles.glassmorphism.illustration.opacity};
            }

            /* Text content */
            .empty-state-text {
                display: flex;
                flex-direction: column;
            }

            .empty-state-title {
                font-weight: 600;
                line-height: 1.2;
                margin: 0;
            }

            .empty-state.glassmorphism .empty-state-title {
                color: ${CONFIG.styles.glassmorphism.text.titleColor};
                text-shadow: ${CONFIG.styles.glassmorphism.text.textShadow};
            }

            .empty-state-description {
                line-height: 1.5;
                margin: 0;
                opacity: 0.9;
            }

            .empty-state.glassmorphism .empty-state-description {
                color: ${CONFIG.styles.glassmorphism.text.descriptionColor};
            }

            /* Actions */
            .empty-state-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-top: 8px;
            }

            .empty-state-action {
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                font-family: inherit;
                font-size: inherit;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .empty-state-action.primary {
                background: rgba(255, 255, 255, 0.2);
                color: #ffffff;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .empty-state-action.primary:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .empty-state-action.secondary {
                background: transparent;
                color: rgba(255, 255, 255, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .empty-state-action.secondary:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.3);
            }

            /* Badge */
            .empty-state-badge {
                position: absolute;
                top: 16px;
                right: 16px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #ef4444;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
            }

            .empty-state-badge.count {
                width: auto;
                height: auto;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                color: white;
            }

            /* Progress */
            .empty-state-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }

            .empty-state-progress-bar {
                height: 100%;
                background: rgba(255, 255, 255, 0.5);
                animation: progress 2s ease-in-out infinite;
            }

            @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            /* Background patterns */
            .empty-state-background {
                position: absolute;
                inset: 0;
                opacity: 0.05;
                pointer-events: none;
            }

            .empty-state-background.pattern {
                background-image: 
                    repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px);
            }

            .empty-state-background.gradient {
                background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
            }

            /* Other styles */
            .empty-state.neumorphism {
                background: ${CONFIG.styles.neumorphism.container.background};
                box-shadow: ${CONFIG.styles.neumorphism.container.boxShadow};
                border-radius: ${CONFIG.styles.neumorphism.container.borderRadius};
            }

            .empty-state.flat {
                background: ${CONFIG.styles.flat.container.background};
                border: ${CONFIG.styles.flat.container.border};
                border-radius: ${CONFIG.styles.flat.container.borderRadius};
            }

            .empty-state.material {
                background: ${CONFIG.styles.material.container.background};
                box-shadow: ${CONFIG.styles.material.container.boxShadow};
                border-radius: ${CONFIG.styles.material.container.borderRadius};
            }

            .empty-state.gradient {
                background: ${CONFIG.styles.gradient.container.background};
                backdrop-filter: ${CONFIG.styles.gradient.container.backdropFilter};
                border: ${CONFIG.styles.gradient.container.border};
                box-shadow: ${CONFIG.styles.gradient.container.boxShadow};
                border-radius: ${CONFIG.styles.gradient.container.borderRadius};
            }

            .empty-state.minimal {
                background: ${CONFIG.styles.minimal.container.background};
            }

            /* Responsive */
            @media (max-width: 768px) {
                .empty-state.horizontal {
                    flex-direction: column !important;
                    text-align: center !important;
                }
                
                .empty-state.horizontal .empty-state-content {
                    padding-left: 0 !important;
                    padding-top: 24px;
                }
                
                .empty-state-actions {
                    justify-content: center;
                }
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .empty-state.glassmorphism {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                
                .empty-state.flat {
                    background: #1a202c;
                    border-color: #2d3748;
                }
            }

            /* Animation classes */
            .empty-state-animated {
                animation-fill-mode: forwards;
            }

            .empty-state-illustration.floating {
                animation: float 3s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }

            .empty-state-illustration.pulsing {
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.9; }
                50% { transform: scale(1.05); opacity: 1; }
            }
        `;

        styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ========================================
    // CRÉATION DU EMPTY STATE
    // ========================================
    function createElement(options = {}) {
        const config = { ...CONFIG.defaults, ...options };
        const typeConfig = CONFIG.types[config.type] || CONFIG.types.custom;
        const styleConfig = CONFIG.styles[config.style];
        const sizeConfig = CONFIG.sizes[config.size];
        const layoutConfig = CONFIG.layouts[config.layout];

        // Container principal
        const container = document.createElement('div');
        container.className = 'empty-state-container';

        // Empty state wrapper
        const emptyState = document.createElement('div');
        emptyState.className = `empty-state ${config.style} ${config.size} ${config.layout} ${config.className}`;
        
        // Application des styles
        Object.assign(emptyState.style, {
            padding: sizeConfig.container.padding,
            maxWidth: sizeConfig.container.maxWidth,
            ...layoutConfig.container,
            gap: sizeConfig.spacing.gap
        });

        // Background pattern/gradient
        if (CONFIG.features.background.enabled && config.showBackground) {
            const bg = document.createElement('div');
            bg.className = `empty-state-background ${CONFIG.features.background.type}`;
            emptyState.appendChild(bg);
        }

        // Illustration
        if (config.showIllustration && typeConfig.illustration) {
            const illustrationWrapper = document.createElement('div');
            illustrationWrapper.className = 'empty-state-illustration-wrapper';
            
            Object.assign(illustrationWrapper.style, {
                width: sizeConfig.illustration.width,
                height: sizeConfig.illustration.height,
                color: config.customColors?.primary || typeConfig.color
            });

            // SVG illustration
            const illustration = ILLUSTRATIONS[typeConfig.illustration] || ILLUSTRATIONS['empty-box'];
            illustrationWrapper.innerHTML = illustration;

            // Animation continue pour l'illustration
            if (config.animation === 'float' || config.animation === 'pulse') {
                illustrationWrapper.firstElementChild.classList.add(config.animation === 'float' ? 'floating' : 'pulsing');
            }

            emptyState.appendChild(illustrationWrapper);
        }

        // Content wrapper
        const content = document.createElement('div');
        content.className = 'empty-state-content';
        if (layoutConfig.content) {
            Object.assign(content.style, layoutConfig.content);
        }

        // Text wrapper
        const textWrapper = document.createElement('div');
        textWrapper.className = 'empty-state-text';

        // Title
        if (config.title || typeConfig.title) {
            const title = document.createElement('h3');
            title.className = 'empty-state-title';
            title.textContent = config.title || typeConfig.title;
            Object.assign(title.style, sizeConfig.title);
            textWrapper.appendChild(title);
        }

        // Description
        if (config.description || typeConfig.description) {
            const description = document.createElement('p');
            description.className = 'empty-state-description';
            description.textContent = config.description || typeConfig.description;
            Object.assign(description.style, sizeConfig.description);
            textWrapper.appendChild(description);
        }

        content.appendChild(textWrapper);

        // Actions
        if (config.actions && config.actions.length > 0 && CONFIG.features.actions.enabled) {
            const actionsWrapper = document.createElement('div');
            actionsWrapper.className = 'empty-state-actions';
            actionsWrapper.style.justifyContent = CONFIG.features.actions.alignment;

            config.actions.slice(0, CONFIG.features.actions.maxActions).forEach((action, index) => {
                const element = document.createElement(action.href ? 'a' : 'button');
                element.className = `empty-state-action ${action.variant || (index === 0 ? 'primary' : 'secondary')}`;
                element.textContent = action.text;
                
                if (action.href) {
                    element.href = action.href;
                }
                
                if (action.handler) {
                    element.addEventListener('click', action.handler);
                }

                actionsWrapper.appendChild(element);
            });

            content.appendChild(actionsWrapper);
        }

        emptyState.appendChild(content);

        // Badge
        if (CONFIG.features.badge.enabled && config.badge) {
            const badge = document.createElement('div');
            badge.className = `empty-state-badge ${CONFIG.features.badge.style}`;
            
            if (CONFIG.features.badge.style === 'count' && config.badge.count) {
                badge.textContent = config.badge.count;
            } else if (CONFIG.features.badge.style === 'text' && config.badge.text) {
                badge.textContent = config.badge.text;
            }
            
            emptyState.appendChild(badge);
        }

        // Progress
        if (CONFIG.features.progress.enabled && config.showProgress) {
            const progress = document.createElement('div');
            progress.className = 'empty-state-progress';
            
            const bar = document.createElement('div');
            bar.className = 'empty-state-progress-bar';
            
            progress.appendChild(bar);
            emptyState.appendChild(progress);
        }

        // Interactive effects
        if (CONFIG.features.interactive.enabled && CONFIG.features.interactive.hoverEffect) {
            emptyState.classList.add('interactive');
        }

        container.appendChild(emptyState);

        // Animation initiale
        if (config.animation && CONFIG.animations[config.animation].enabled) {
            applyAnimation(emptyState, config.animation);
        }

        return container;
    }

    // ========================================
    // SYSTÈME D'ANIMATIONS
    // ========================================
    function applyAnimation(element, animationType) {
        const animation = CONFIG.animations[animationType];
        if (!animation || !animation.enabled) return;

        const target = animation.target === 'illustration' 
            ? element.querySelector('.empty-state-illustration')
            : element;

        if (!target) return;

        // Pour les animations continues
        if (animation.continuous) {
            return; // Déjà gérées via CSS
        }

        // Animation d'entrée
        target.classList.add('empty-state-animated');
        
        if (animation.keyframes && animation.options) {
            target.animate(
                animation.keyframes,
                animation.options
            );
        }
    }

    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    function updateContent(container, updates) {
        if (!container) return;

        const emptyState = container.querySelector('.empty-state');
        if (!emptyState) return;

        // Mise à jour du titre
        if (updates.title !== undefined) {
            const titleEl = emptyState.querySelector('.empty-state-title');
            if (titleEl) titleEl.textContent = updates.title;
        }

        // Mise à jour de la description
        if (updates.description !== undefined) {
            const descEl = emptyState.querySelector('.empty-state-description');
            if (descEl) descEl.textContent = updates.description;
        }

        // Mise à jour du type (change l'illustration et les couleurs)
        if (updates.type) {
            const typeConfig = CONFIG.types[updates.type];
            if (typeConfig) {
                const illustrationWrapper = emptyState.querySelector('.empty-state-illustration-wrapper');
                if (illustrationWrapper && typeConfig.illustration) {
                    illustrationWrapper.innerHTML = ILLUSTRATIONS[typeConfig.illustration] || ILLUSTRATIONS['empty-box'];
                    illustrationWrapper.style.color = typeConfig.color;
                }
            }
        }

        // Mise à jour du badge
        if (updates.badge !== undefined) {
            const badge = emptyState.querySelector('.empty-state-badge');
            if (badge && updates.badge.count !== undefined) {
                badge.textContent = updates.badge.count;
            }
        }
    }

    function destroy(container) {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration exposée
        CONFIG,
        ILLUSTRATIONS,
        
        // Méthode principale
        create: (options) => {
            injectStyles();
            return createElement(options);
        },
        
        // Méthodes utilitaires
        update: updateContent,
        destroy,
        
        // Méthodes de convenance par type
        noData: (options = {}) => createElement({ ...options, type: 'no-data' }),
        noResults: (options = {}) => createElement({ ...options, type: 'no-results' }),
        error: (options = {}) => createElement({ ...options, type: 'error' }),
        offline: (options = {}) => createElement({ ...options, type: 'offline' }),
        maintenance: (options = {}) => createElement({ ...options, type: 'maintenance' }),
        comingSoon: (options = {}) => createElement({ ...options, type: 'coming-soon' }),
        accessDenied: (options = {}) => createElement({ ...options, type: 'access-denied' }),
        
        // Gestion des styles
        injectStyles,
        
        // Ajout d'illustrations personnalisées
        addIllustration: (name, svg) => {
            ILLUSTRATIONS[name] = svg;
        }
    };
})();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmptyStateComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date création] - Gestion des illustrations SVG
   Solution: Bibliothèque intégrée avec SVG inline
   
   [Date création] - Animations complexes
   Cause: Mix entre CSS et JS animations
   Résolution: Séparation claire des responsabilités
   
   [Date création] - Responsive design
   Cause: Layout horizontal sur mobile
   Résolution: Media queries avec bascule en vertical
   
   NOTES POUR REPRISES FUTURES:
   - Les illustrations sont en SVG inline pour la customisation
   - Les animations continues utilisent CSS
   - Les animations d'entrée utilisent l'API Web Animations
   - Support complet du dark mode
   - Les styles sont injectés dynamiquement
   ======================================== */