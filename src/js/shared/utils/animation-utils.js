/* ========================================
   ANIMATION-UTILS.JS - Utilitaires d'animation
   Chemin: src/js/shared/utils/animation-utils.js
   
   DESCRIPTION:
   Bibliothèque complète de fonctions utilitaires pour gérer
   toutes les animations du système UI. Inclut des animations CSS,
   JS, des easings personnalisés, et des effets avancés.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 20-200)
   2. Easings et courbes (lignes 202-400)
   3. Animations de base (lignes 402-700)
   4. Animations complexes (lignes 702-1200)
   5. Gestionnaires et contrôleurs (lignes 1202-1600)
   6. Utilitaires DOM (lignes 1602-1900)
   7. Export et API publique (lignes 1902-2000)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Utilisé par tous les composants UI
   ======================================== */

const AnimationUtils = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    const CONFIG = {
        // Durées par défaut
        durations: {
            instant: 0,
            fast: 200,
            normal: 300,
            slow: 500,
            slower: 700,
            slowest: 1000,
            custom: (ms) => ms
        },

        // Easings prédéfinis
        easings: {
            // Basiques
            linear: 'linear',
            ease: 'ease',
            easeIn: 'ease-in',
            easeOut: 'ease-out',
            easeInOut: 'ease-in-out',
            
            // Cubiques
            easeInCubic: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
            easeOutCubic: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
            easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
            
            // Quartiques
            easeInQuart: 'cubic-bezier(0.895, 0.030, 0.685, 0.220)',
            easeOutQuart: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
            easeInOutQuart: 'cubic-bezier(0.770, 0.000, 0.175, 1.000)',
            
            // Quintiques
            easeInQuint: 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
            easeOutQuint: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
            easeInOutQuint: 'cubic-bezier(0.860, 0.000, 0.070, 1.000)',
            
            // Exponentielles
            easeInExpo: 'cubic-bezier(0.950, 0.050, 0.795, 0.035)',
            easeOutExpo: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
            easeInOutExpo: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)',
            
            // Circulaires
            easeInCirc: 'cubic-bezier(0.600, 0.040, 0.980, 0.335)',
            easeOutCirc: 'cubic-bezier(0.075, 0.820, 0.165, 1.000)',
            easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.150, 0.860)',
            
            // Back (avec rebond)
            easeInBack: 'cubic-bezier(0.600, -0.280, 0.735, 0.045)',
            easeOutBack: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
            easeInOutBack: 'cubic-bezier(0.680, -0.550, 0.265, 1.550)',
            
            // Elastic
            elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            
            // Custom Material Design
            materialStandard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
            materialDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
            materialAccelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
            materialSharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
        },

        // Types d'animations prédéfinies
        animations: {
            // Fade
            fade: {
                in: { opacity: [0, 1] },
                out: { opacity: [1, 0] }
            },
            
            // Slide
            slide: {
                inTop: { transform: ['translateY(-100%)', 'translateY(0)'], opacity: [0, 1] },
                inRight: { transform: ['translateX(100%)', 'translateX(0)'], opacity: [0, 1] },
                inBottom: { transform: ['translateY(100%)', 'translateY(0)'], opacity: [0, 1] },
                inLeft: { transform: ['translateX(-100%)', 'translateX(0)'], opacity: [0, 1] },
                outTop: { transform: ['translateY(0)', 'translateY(-100%)'], opacity: [1, 0] },
                outRight: { transform: ['translateX(0)', 'translateX(100%)'], opacity: [1, 0] },
                outBottom: { transform: ['translateY(0)', 'translateY(100%)'], opacity: [1, 0] },
                outLeft: { transform: ['translateX(0)', 'translateX(-100%)'], opacity: [1, 0] }
            },
            
            // Scale
            scale: {
                in: { transform: ['scale(0)', 'scale(1)'], opacity: [0, 1] },
                out: { transform: ['scale(1)', 'scale(0)'], opacity: [1, 0] },
                bounce: { transform: ['scale(0)', 'scale(1.1)', 'scale(0.9)', 'scale(1)'] }
            },
            
            // Rotate
            rotate: {
                in: { transform: ['rotate(-180deg)', 'rotate(0deg)'], opacity: [0, 1] },
                out: { transform: ['rotate(0deg)', 'rotate(180deg)'], opacity: [1, 0] },
                inLeft: { transform: ['rotate(-90deg)', 'rotate(0deg)'], opacity: [0, 1] },
                inRight: { transform: ['rotate(90deg)', 'rotate(0deg)'], opacity: [0, 1] }
            },
            
            // Flip
            flip: {
                inX: { transform: ['rotateX(-90deg)', 'rotateX(0deg)'], opacity: [0, 1] },
                inY: { transform: ['rotateY(-90deg)', 'rotateY(0deg)'], opacity: [0, 1] },
                outX: { transform: ['rotateX(0deg)', 'rotateX(90deg)'], opacity: [1, 0] },
                outY: { transform: ['rotateY(0deg)', 'rotateY(90deg)'], opacity: [1, 0] }
            },
            
            // Zoom
            zoom: {
                in: { transform: ['scale(0.5)', 'scale(1)'], opacity: [0, 1] },
                out: { transform: ['scale(1)', 'scale(0.5)'], opacity: [1, 0] }
            },
            
            // Glassmorphism specific
            glass: {
                in: {
                    backdropFilter: ['blur(0px)', 'blur(20px)'],
                    background: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)'],
                    opacity: [0, 1]
                },
                out: {
                    backdropFilter: ['blur(20px)', 'blur(0px)'],
                    background: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'],
                    opacity: [1, 0]
                }
            }
        },

        // Propriétés animables
        animatableProperties: [
            'opacity', 'transform', 'filter', 'backdrop-filter',
            'background', 'background-color', 'border-color',
            'box-shadow', 'text-shadow', 'color', 'fill', 'stroke',
            'width', 'height', 'top', 'right', 'bottom', 'left',
            'margin', 'padding', 'border-width', 'border-radius',
            'font-size', 'line-height', 'letter-spacing'
        ],

        // Options par défaut
        defaultOptions: {
            duration: 300,
            easing: 'ease-out',
            delay: 0,
            fill: 'both',
            iterations: 1,
            direction: 'normal'
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = {
        activeAnimations: new Map(),
        animationId: 0,
        reducedMotion: null,
        performanceMode: 'auto'
    };

    // ========================================
    // EASINGS PERSONNALISÉS
    // ========================================
    
    // Fonctions d'easing mathématiques
    const EasingFunctions = {
        // Linéaire
        linear: (t) => t,
        
        // Quadratique
        easeInQuad: (t) => t * t,
        easeOutQuad: (t) => t * (2 - t),
        easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        
        // Cubique
        easeInCubic: (t) => t * t * t,
        easeOutCubic: (t) => (--t) * t * t + 1,
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        
        // Quartique
        easeInQuart: (t) => t * t * t * t,
        easeOutQuart: (t) => 1 - (--t) * t * t * t,
        easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        
        // Quintique
        easeInQuint: (t) => t * t * t * t * t,
        easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
        easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
        
        // Sinusoïdale
        easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
        easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
        easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
        
        // Exponentielle
        easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
        easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        easeInOutExpo: (t) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
            return (2 - Math.pow(2, -20 * t + 10)) / 2;
        },
        
        // Circulaire
        easeInCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
        easeOutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
        easeInOutCirc: (t) => {
            if (t < 0.5) return (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2;
            return (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
        },
        
        // Back (avec dépassement)
        easeInBack: (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        },
        easeOutBack: (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        },
        easeInOutBack: (t) => {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            if (t < 0.5) return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
            return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
        },
        
        // Elastic
        easeInElastic: (t) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            const c4 = (2 * Math.PI) / 3;
            return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
        },
        easeOutElastic: (t) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            const c4 = (2 * Math.PI) / 3;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        },
        easeInOutElastic: (t) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            const c5 = (2 * Math.PI) / 4.5;
            if (t < 0.5) {
                return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
            }
            return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
        },
        
        // Bounce
        easeOutBounce: (t) => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        },
        easeInBounce: (t) => 1 - EasingFunctions.easeOutBounce(1 - t),
        easeInOutBounce: (t) => {
            if (t < 0.5) return (1 - EasingFunctions.easeOutBounce(1 - 2 * t)) / 2;
            return (1 + EasingFunctions.easeOutBounce(2 * t - 1)) / 2;
        }
    };

    // ========================================
    // MÉTHODES PRIVÉES - UTILITAIRES
    // ========================================
    
    // Vérification des préférences de mouvement réduit
    function checkReducedMotion() {
        if (state.reducedMotion === null) {
            state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return state.reducedMotion;
    }

    // Génération d'ID unique
    function generateAnimationId() {
        return `anim-${Date.now()}-${++state.animationId}`;
    }

    // Parsing des valeurs CSS
    function parseValue(value) {
        const match = value.toString().match(/^(-?\d*\.?\d+)(.*)$/);
        if (!match) return { value: 0, unit: '' };
        return {
            value: parseFloat(match[1]),
            unit: match[2] || ''
        };
    }

    // Interpolation entre deux valeurs
    function interpolate(from, to, progress, easingFunction) {
        const fromParsed = parseValue(from);
        const toParsed = parseValue(to);
        
        if (fromParsed.unit !== toParsed.unit && fromParsed.unit && toParsed.unit) {
            console.warn('Unit mismatch in animation');
            return to;
        }
        
        const easedProgress = easingFunction ? easingFunction(progress) : progress;
        const value = fromParsed.value + (toParsed.value - fromParsed.value) * easedProgress;
        
        return value + (toParsed.unit || fromParsed.unit);
    }

    // Interpolation de couleurs
    function interpolateColor(from, to, progress) {
        // Conversion hex en RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Conversion RGB string en objet
        const rgbStringToObject = (rgb) => {
            const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
            if (!match) return null;
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        };
        
        // Parse des couleurs
        let fromColor = from.startsWith('#') ? hexToRgb(from) : rgbStringToObject(from);
        let toColor = to.startsWith('#') ? hexToRgb(to) : rgbStringToObject(to);
        
        if (!fromColor || !toColor) return to;
        
        // Interpolation
        const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * progress);
        const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * progress);
        const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * progress);
        const a = fromColor.a !== undefined && toColor.a !== undefined
            ? fromColor.a + (toColor.a - fromColor.a) * progress
            : 1;
        
        return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    // ========================================
    // MÉTHODES PRIVÉES - ANIMATIONS
    // ========================================
    
    // Animation avec requestAnimationFrame
    function animateRAF(element, properties, options = {}) {
        const opts = { ...CONFIG.defaultOptions, ...options };
        const animationId = generateAnimationId();
        
        return new Promise((resolve, reject) => {
            if (checkReducedMotion() && !opts.forceAnimation) {
                // Mode mouvement réduit
                Object.keys(properties).forEach(prop => {
                    const values = Array.isArray(properties[prop]) ? properties[prop] : [properties[prop]];
                    element.style[prop] = values[values.length - 1];
                });
                resolve(element);
                return;
            }
            
            const startTime = performance.now();
            const duration = opts.duration;
            const easingFunction = typeof opts.easing === 'function' 
                ? opts.easing 
                : EasingFunctions[opts.easing] || EasingFunctions.linear;
            
            // Sauvegarde des valeurs initiales
            const initialValues = {};
            Object.keys(properties).forEach(prop => {
                initialValues[prop] = getComputedStyle(element)[prop];
            });
            
            // Fonction d'animation
            function animate(currentTime) {
                const elapsed = currentTime - startTime - opts.delay;
                
                if (elapsed < 0) {
                    state.activeAnimations.set(animationId, requestAnimationFrame(animate));
                    return;
                }
                
                let progress = elapsed / duration;
                progress = Math.min(progress, 1);
                
                // Application des propriétés
                Object.keys(properties).forEach(prop => {
                    const values = Array.isArray(properties[prop]) ? properties[prop] : [initialValues[prop], properties[prop]];
                    
                    if (values.length === 2) {
                        // Animation simple de A vers B
                        const from = values[0] === 'current' ? initialValues[prop] : values[0];
                        const to = values[1];
                        
                        if (prop === 'transform' || prop.includes('color') || prop.includes('Color')) {
                            // Traitement spécial pour transform et couleurs
                            if (prop.includes('color') || prop.includes('Color')) {
                                element.style[prop] = interpolateColor(from, to, progress);
                            } else {
                                element.style[prop] = progress === 1 ? to : from;
                            }
                        } else {
                            element.style[prop] = interpolate(from, to, progress, easingFunction);
                        }
                    } else {
                        // Animation avec keyframes
                        const keyframeIndex = Math.floor(progress * (values.length - 1));
                        const localProgress = (progress * (values.length - 1)) % 1;
                        
                        if (keyframeIndex < values.length - 1) {
                            const from = values[keyframeIndex];
                            const to = values[keyframeIndex + 1];
                            element.style[prop] = interpolate(from, to, localProgress, easingFunction);
                        } else {
                            element.style[prop] = values[values.length - 1];
                        }
                    }
                });
                
                if (progress < 1) {
                    state.activeAnimations.set(animationId, requestAnimationFrame(animate));
                } else {
                    state.activeAnimations.delete(animationId);
                    if (opts.onComplete) opts.onComplete(element);
                    resolve(element);
                }
            }
            
            // Démarrage de l'animation
            state.activeAnimations.set(animationId, requestAnimationFrame(animate));
        });
    }

    // Animation CSS avec Web Animations API
    function animateWAPI(element, keyframes, options = {}) {
        if (!element.animate) {
            // Fallback vers animateRAF si Web Animations API non supportée
            return animateRAF(element, keyframes, options);
        }
        
        const opts = { ...CONFIG.defaultOptions, ...options };
        
        if (checkReducedMotion() && !opts.forceAnimation) {
            // Application immédiate de l'état final
            const finalKeyframe = Array.isArray(keyframes) ? keyframes[keyframes.length - 1] : keyframes;
            Object.assign(element.style, finalKeyframe);
            return Promise.resolve(element);
        }
        
        const animation = element.animate(keyframes, {
            duration: opts.duration,
            easing: opts.easing,
            delay: opts.delay,
            iterations: opts.iterations,
            direction: opts.direction,
            fill: opts.fill
        });
        
        return animation.finished;
    }

    // ========================================
    // ANIMATIONS COMPLEXES
    // ========================================
    
    // Animation FLIP (First, Last, Invert, Play)
    function flip(element, callback, options = {}) {
        // First: capture de l'état initial
        const first = element.getBoundingClientRect();
        const firstStyles = getComputedStyle(element);
        
        // Execute le callback qui modifie le DOM
        callback();
        
        // Last: capture de l'état final
        const last = element.getBoundingClientRect();
        
        // Invert: calcul des différences
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;
        const deltaW = first.width / last.width;
        const deltaH = first.height / last.height;
        
        // Play: animation depuis l'état inversé vers l'état final
        return animateWAPI(element, [
            {
                transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`,
                opacity: firstStyles.opacity
            },
            {
                transform: 'translate(0, 0) scale(1, 1)',
                opacity: 1
            }
        ], options);
    }

    // Animation de morphing entre deux éléments
    function morph(fromElement, toElement, options = {}) {
        const opts = {
            duration: 800,
            easing: 'ease-in-out',
            hideOriginal: true,
            ...options
        };
        
        // Récupération des positions et styles
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const fromStyles = getComputedStyle(fromElement);
        const toStyles = getComputedStyle(toElement);
        
        // Création d'un clone pour l'animation
        const clone = fromElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = fromRect.left + 'px';
        clone.style.top = fromRect.top + 'px';
        clone.style.width = fromRect.width + 'px';
        clone.style.height = fromRect.height + 'px';
        clone.style.margin = '0';
        clone.style.zIndex = '9999';
        clone.style.transition = 'none';
        
        document.body.appendChild(clone);
        
        if (opts.hideOriginal) {
            fromElement.style.opacity = '0';
            toElement.style.opacity = '0';
        }
        
        // Animation du morphing
        const animation = animateWAPI(clone, [
            {
                left: fromRect.left + 'px',
                top: fromRect.top + 'px',
                width: fromRect.width + 'px',
                height: fromRect.height + 'px',
                borderRadius: fromStyles.borderRadius,
                backgroundColor: fromStyles.backgroundColor,
                transform: 'scale(1)'
            },
            {
                left: toRect.left + 'px',
                top: toRect.top + 'px',
                width: toRect.width + 'px',
                height: toRect.height + 'px',
                borderRadius: toStyles.borderRadius,
                backgroundColor: toStyles.backgroundColor,
                transform: 'scale(1)'
            }
        ], opts);
        
        return animation.then(() => {
            clone.remove();
            if (opts.hideOriginal) {
                toElement.style.opacity = '1';
            }
            return toElement;
        });
    }

    // Animation de particules
    function particles(element, options = {}) {
        const opts = {
            count: 20,
            colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
            size: { min: 4, max: 8 },
            duration: 1000,
            spread: 50,
            gravity: 0.5,
            ...options
        };
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const particles = [];
        
        for (let i = 0; i < opts.count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * (opts.size.max - opts.size.min) + opts.size.min;
            const color = opts.colors[Math.floor(Math.random() * opts.colors.length)];
            
            particle.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                left: ${centerX}px;
                top: ${centerY}px;
            `;
            
            document.body.appendChild(particle);
            particles.push(particle);
            
            // Animation de chaque particule
            const angle = (Math.PI * 2 * i) / opts.count;
            const velocity = Math.random() * opts.spread + opts.spread / 2;
            const endX = Math.cos(angle) * velocity;
            const endY = Math.sin(angle) * velocity - (opts.gravity * opts.duration) / 100;
            
            animateWAPI(particle, [
                {
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1
                },
                {
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1,
                    offset: 0.1
                },
                {
                    transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) scale(0.5)`,
                    opacity: 0
                }
            ], {
                duration: opts.duration,
                easing: 'ease-out'
            }).then(() => particle.remove());
        }
        
        return Promise.all(particles.map(p => p.getAnimations()[0].finished));
    }

    // Animation de texte (par lettre/mot)
    function textAnimation(element, options = {}) {
        const opts = {
            type: 'letter', // 'letter' ou 'word'
            animation: 'fade',
            stagger: 50,
            duration: 300,
            ...options
        };
        
        const text = element.textContent;
        element.textContent = '';
        
        const parts = opts.type === 'letter' 
            ? text.split('') 
            : text.split(' ');
        
        const spans = parts.map((part, index) => {
            const span = document.createElement('span');
            span.textContent = part + (opts.type === 'word' ? ' ' : '');
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            element.appendChild(span);
            return span;
        });
        
        // Animation de chaque partie avec délai
        return Promise.all(spans.map((span, index) => {
            const delay = index * opts.stagger;
            
            switch (opts.animation) {
                case 'fade':
                    return animate(span, 'fadeIn', { ...opts, delay });
                case 'slide':
                    return animate(span, 'slideInBottom', { ...opts, delay });
                case 'rotate':
                    return animate(span, 'rotateIn', { ...opts, delay });
                default:
                    return animate(span, opts.animation, { ...opts, delay });
            }
        }));
    }

    // ========================================
    // GESTIONNAIRES ET CONTRÔLEURS
    // ========================================
    
    // Gestionnaire de séquences d'animations
    class AnimationSequence {
        constructor() {
            this.queue = [];
            this.running = false;
        }
        
        add(element, animation, options = {}) {
            this.queue.push({ element, animation, options });
            return this;
        }
        
        addParallel(animations) {
            this.queue.push({ parallel: animations });
            return this;
        }
        
        addDelay(duration) {
            this.queue.push({ delay: duration });
            return this;
        }
        
        async play() {
            if (this.running) return;
            this.running = true;
            
            for (const item of this.queue) {
                if (item.delay) {
                    await new Promise(resolve => setTimeout(resolve, item.delay));
                } else if (item.parallel) {
                    await Promise.all(item.parallel.map(anim => 
                        animate(anim.element, anim.animation, anim.options)
                    ));
                } else {
                    await animate(item.element, item.animation, item.options);
                }
            }
            
            this.running = false;
            this.queue = [];
        }
        
        clear() {
            this.queue = [];
            this.running = false;
        }
    }

    // Contrôleur d'animations avec état
    class AnimationController {
        constructor(element) {
            this.element = element;
            this.currentAnimation = null;
            this.state = {};
        }
        
        async animate(animation, options = {}) {
            // Annuler l'animation en cours si elle existe
            if (this.currentAnimation) {
                this.cancel();
            }
            
            this.currentAnimation = animate(this.element, animation, options);
            
            try {
                await this.currentAnimation;
                this.currentAnimation = null;
            } catch (e) {
                // Animation annulée
            }
            
            return this;
        }
        
        cancel() {
            if (this.currentAnimation && this.currentAnimation.cancel) {
                this.currentAnimation.cancel();
            }
            this.currentAnimation = null;
        }
        
        pause() {
            if (this.currentAnimation && this.currentAnimation.pause) {
                this.currentAnimation.pause();
            }
        }
        
        resume() {
            if (this.currentAnimation && this.currentAnimation.play) {
                this.currentAnimation.play();
            }
        }
        
        reverse() {
            if (this.currentAnimation && this.currentAnimation.reverse) {
                this.currentAnimation.reverse();
            }
        }
    }

    // ========================================
    // ANIMATIONS PRÉDÉFINIES
    // ========================================
    
    // Application d'une animation prédéfinie
    async function animate(element, animationType, options = {}) {
        if (!element) return Promise.reject('No element provided');
        
        // Si c'est une fonction personnalisée
        if (typeof animationType === 'function') {
            return animationType(element, options);
        }
        
        // Recherche dans les animations prédéfinies
        let animation = null;
        
        // Vérification dans les catégories
        for (const category of Object.keys(CONFIG.animations)) {
            if (CONFIG.animations[category][animationType]) {
                animation = CONFIG.animations[category][animationType];
                break;
            }
        }
        
        // Animation simple par nom
        const simpleAnimations = {
            // Fade
            fadeIn: CONFIG.animations.fade.in,
            fadeOut: CONFIG.animations.fade.out,
            
            // Slide
            slideInTop: CONFIG.animations.slide.inTop,
            slideInRight: CONFIG.animations.slide.inRight,
            slideInBottom: CONFIG.animations.slide.inBottom,
            slideInLeft: CONFIG.animations.slide.inLeft,
            slideOutTop: CONFIG.animations.slide.outTop,
            slideOutRight: CONFIG.animations.slide.outRight,
            slideOutBottom: CONFIG.animations.slide.outBottom,
            slideOutLeft: CONFIG.animations.slide.outLeft,
            
            // Scale
            scaleIn: CONFIG.animations.scale.in,
            scaleOut: CONFIG.animations.scale.out,
            scaleBounce: CONFIG.animations.scale.bounce,
            
            // Rotate
            rotateIn: CONFIG.animations.rotate.in,
            rotateOut: CONFIG.animations.rotate.out,
            
            // Zoom
            zoomIn: CONFIG.animations.zoom.in,
            zoomOut: CONFIG.animations.zoom.out,
            
            // Glass
            glassIn: CONFIG.animations.glass.in,
            glassOut: CONFIG.animations.glass.out,
            
            // Spéciaux
            shake: {
                transform: [
                    'translateX(0)',
                    'translateX(-10px)',
                    'translateX(10px)',
                    'translateX(-10px)',
                    'translateX(10px)',
                    'translateX(0)'
                ]
            },
            pulse: {
                transform: [
                    'scale(1)',
                    'scale(1.05)',
                    'scale(1)'
                ]
            },
            bounce: {
                transform: [
                    'translateY(0)',
                    'translateY(-20px)',
                    'translateY(0)',
                    'translateY(-10px)',
                    'translateY(0)'
                ]
            },
            flash: {
                opacity: ['1', '0', '1', '0', '1']
            },
            rubberBand: {
                transform: [
                    'scale(1)',
                    'scale(1.25, 0.75)',
                    'scale(0.75, 1.25)',
                    'scale(1.15, 0.85)',
                    'scale(0.95, 1.05)',
                    'scale(1.05, 0.95)',
                    'scale(1)'
                ]
            },
            swing: {
                transform: [
                    'rotate(0deg)',
                    'rotate(15deg)',
                    'rotate(-10deg)',
                    'rotate(5deg)',
                    'rotate(-5deg)',
                    'rotate(0deg)'
                ]
            },
            tada: {
                transform: [
                    'scale(1) rotate(0deg)',
                    'scale(0.9) rotate(-3deg)',
                    'scale(1.1) rotate(3deg)',
                    'scale(1.1) rotate(-3deg)',
                    'scale(1.1) rotate(3deg)',
                    'scale(1.1) rotate(-3deg)',
                    'scale(1.1) rotate(3deg)',
                    'scale(1) rotate(0deg)'
                ]
            },
            wobble: {
                transform: [
                    'translateX(0)',
                    'translateX(-25%) rotate(-5deg)',
                    'translateX(20%) rotate(3deg)',
                    'translateX(-15%) rotate(-3deg)',
                    'translateX(10%) rotate(2deg)',
                    'translateX(-5%) rotate(-1deg)',
                    'translateX(0)'
                ]
            },
            jello: {
                transform: [
                    'skewX(0deg) skewY(0deg)',
                    'skewX(-12.5deg) skewY(-12.5deg)',
                    'skewX(6.25deg) skewY(6.25deg)',
                    'skewX(-3.125deg) skewY(-3.125deg)',
                    'skewX(1.5625deg) skewY(1.5625deg)',
                    'skewX(-0.78125deg) skewY(-0.78125deg)',
                    'skewX(0.390625deg) skewY(0.390625deg)',
                    'skewX(0deg) skewY(0deg)'
                ]
            }
        };
        
        animation = animation || simpleAnimations[animationType];
        
        if (!animation) {
            return Promise.reject(`Animation type '${animationType}' not found`);
        }
        
        // Application de l'animation
        return animateWAPI(element, animation, options);
    }

    // ========================================
    // UTILITAIRES DOM
    // ========================================
    
    // Observer pour animations au scroll
    function scrollTrigger(elements, animation, options = {}) {
        const opts = {
            threshold: 0.5,
            once: true,
            ...options
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate(entry.target, animation, opts);
                    
                    if (opts.once) {
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            threshold: opts.threshold
        });
        
        const elementsArray = elements.length ? Array.from(elements) : [elements];
        elementsArray.forEach(el => observer.observe(el));
        
        return observer;
    }

    // Animation au hover
    function hoverAnimation(element, inAnimation, outAnimation, options = {}) {
        let isHovered = false;
        
        element.addEventListener('mouseenter', async () => {
            isHovered = true;
            await animate(element, inAnimation, options);
        });
        
        element.addEventListener('mouseleave', async () => {
            isHovered = false;
            await animate(element, outAnimation, options);
        });
        
        return () => {
            element.removeEventListener('mouseenter');
            element.removeEventListener('mouseleave');
        };
    }

    // Ripple effect (Material Design)
    function ripple(element, options = {}) {
        const opts = {
            color: 'rgba(255, 255, 255, 0.5)',
            duration: 600,
            size: 'auto',
            ...options
        };
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        
        element.addEventListener('click', function(e) {
            const rect = element.getBoundingClientRect();
            const size = opts.size === 'auto' 
                ? Math.max(rect.width, rect.height) * 2
                : opts.size;
            
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: ${opts.color};
                pointer-events: none;
                width: ${size}px;
                height: ${size}px;
                left: ${e.clientX - rect.left - size / 2}px;
                top: ${e.clientY - rect.top - size / 2}px;
                transform: scale(0);
            `;
            
            element.appendChild(ripple);
            
            animateWAPI(ripple, [
                { transform: 'scale(0)', opacity: 1 },
                { transform: 'scale(1)', opacity: 0 }
            ], {
                duration: opts.duration,
                easing: 'ease-out'
            }).then(() => ripple.remove());
        });
    }

    // ========================================
    // PERFORMANCE ET OPTIMISATION
    // ========================================
    
    // Batch animations pour performance
    function batchAnimate(animations) {
        // Regrouper les animations par frame
        const batches = new Map();
        
        animations.forEach(({ element, animation, options = {} }) => {
            const delay = options.delay || 0;
            if (!batches.has(delay)) {
                batches.set(delay, []);
            }
            batches.get(delay).push({ element, animation, options });
        });
        
        // Exécuter les batches
        const promises = [];
        for (const [delay, batch] of batches) {
            promises.push(
                new Promise(resolve => {
                    setTimeout(() => {
                        Promise.all(
                            batch.map(({ element, animation, options }) => 
                                animate(element, animation, options)
                            )
                        ).then(resolve);
                    }, delay);
                })
            );
        }
        
        return Promise.all(promises);
    }

    // Throttle pour animations fréquentes
    function throttleAnimation(func, delay = 16) {
        let lastCall = 0;
        let timeout;
        
        return function(...args) {
            const now = Date.now();
            const timeSinceLastCall = now - lastCall;
            
            if (timeSinceLastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            } else {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    lastCall = Date.now();
                    func.apply(this, args);
                }, delay - timeSinceLastCall);
            }
        };
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration
        config: CONFIG,
        
        // Animations de base
        animate,
        animateRAF,
        animateWAPI,
        
        // Animations complexes
        flip,
        morph,
        particles,
        textAnimation,
        
        // Classes utilitaires
        AnimationSequence,
        AnimationController,
        
        // Utilitaires DOM
        scrollTrigger,
        hoverAnimation,
        ripple,
        
        // Performance
        batchAnimate,
        throttleAnimation,
        
        // Easings
        easings: EasingFunctions,
        
        // Méthodes utilitaires
        interpolate,
        interpolateColor,
        checkReducedMotion,
        
        // Gestion des animations actives
        cancelAll() {
            state.activeAnimations.forEach(id => cancelAnimationFrame(id));
            state.activeAnimations.clear();
        },
        
        getActiveAnimations() {
            return Array.from(state.activeAnimations.keys());
        },
        
        // Configuration globale
        setReducedMotion(value) {
            state.reducedMotion = value;
        },
        
        setPerformanceMode(mode) {
            state.performanceMode = mode;
        },
        
        // Présets d'animations
        presets: {
            // Entrées
            fadeIn: { animation: 'fadeIn', duration: 300 },
            slideIn: { animation: 'slideInBottom', duration: 400 },
            scaleIn: { animation: 'scaleIn', duration: 300 },
            bounceIn: { animation: 'scaleBounce', duration: 600 },
            
            // Sorties
            fadeOut: { animation: 'fadeOut', duration: 300 },
            slideOut: { animation: 'slideOutTop', duration: 400 },
            scaleOut: { animation: 'scaleOut', duration: 300 },
            
            // Attention
            shake: { animation: 'shake', duration: 500 },
            pulse: { animation: 'pulse', duration: 1000 },
            flash: { animation: 'flash', duration: 1000 },
            
            // Fun
            rubberBand: { animation: 'rubberBand', duration: 700 },
            swing: { animation: 'swing', duration: 600 },
            tada: { animation: 'tada', duration: 800 },
            wobble: { animation: 'wobble', duration: 700 },
            jello: { animation: 'jello', duration: 800 }
        }
    };
})();

// Export pour utilisation
export default AnimationUtils;

// Support CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationUtils;
}

// Support global
if (typeof window !== 'undefined') {
    window.AnimationUtils = AnimationUtils;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-XX] - Web Animations API vs RAF
   Solution: Support des deux avec fallback automatique
   
   [2024-01-XX] - Performance avec animations multiples
   Cause: Trop d'appels RAF simultanés
   Résolution: Batch animations et throttling
   
   [2024-01-XX] - Interpolation de valeurs complexes
   Cause: Parsing des unités CSS
   Résolution: Fonction parseValue robuste
   
   NOTES POUR REPRISES FUTURES:
   - Les animations respectent prefers-reduced-motion
   - RAF est préféré pour les animations complexes
   - Web Animations API pour les animations simples
   - Toujours nettoyer les animations en cours
   ======================================== */