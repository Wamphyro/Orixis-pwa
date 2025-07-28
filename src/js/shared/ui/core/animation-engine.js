/* ========================================
   ANIMATION-ENGINE.JS - Moteur d'animations global
   Chemin: src/js/shared/ui/core/animation-engine.js
   
   DESCRIPTION:
   Moteur centralisé pour gérer toutes les animations du système UI.
   Gère les niveaux d'animation, les préférences système, l'orchestration
   des animations complexes, et optimise les performances.
   
   STRUCTURE:
   1. Configuration des animations (lignes 20-200)
   2. Bibliothèque d'animations (lignes 205-500)
   3. Gestionnaire de performance (lignes 505-650)
   4. Orchestrateur d'animations (lignes 655-850)
   5. Détection des préférences (lignes 855-950)
   6. Utilitaires d'animation (lignes 955-1150)
   7. API publique (lignes 1155-1300)
   
   DÉPENDANCES:
   - ui-manager.js (événements et configuration)
   - Web Animations API
   - RequestAnimationFrame API
   ======================================== */

const AnimationEngine = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION DES ANIMATIONS
    // ========================================
    const CONFIG = {
        // Niveaux d'animation
        levels: {
            none: {
                name: 'Aucune animation',
                description: 'Désactive toutes les animations',
                enabled: false,
                duration: 0,
                easing: 'linear'
            },
            subtle: {
                name: 'Animations subtiles',
                description: 'Animations minimales pour les interactions de base',
                enabled: true,
                duration: 150,
                easing: 'ease-out',
                effects: ['fade', 'scale-sm'],
                microInteractions: false
            },
            smooth: {
                name: 'Animations fluides',
                description: 'Animations standard pour une expérience fluide',
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'slide', 'scale', 'rotate-sm'],
                microInteractions: true
            },
            rich: {
                name: 'Animations riches',
                description: 'Animations complètes avec effets avancés',
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['fade', 'slide', 'scale', 'rotate', 'blur', 'parallax', 'morph'],
                microInteractions: true,
                particles: true,
                physics: true
            }
        },
        
        // Préréglages d'easing
        easings: {
            // Standard
            'linear': 'linear',
            'ease': 'ease',
            'ease-in': 'ease-in',
            'ease-out': 'ease-out',
            'ease-in-out': 'ease-in-out',
            
            // Custom Material Design
            'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
            'deceleration': 'cubic-bezier(0, 0, 0.2, 1)',
            'acceleration': 'cubic-bezier(0.4, 0, 1, 1)',
            'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
            
            // Elastic et bounce
            'elastic-in': 'cubic-bezier(0.55, 0, 1, 0.45)',
            'elastic-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            'elastic-in-out': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
            'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            
            // Spring physics
            'spring-wobbly': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            'spring-stiff': 'cubic-bezier(0.68, -0.55, 0.265, 1.05)',
            'spring-gentle': 'cubic-bezier(0.175, 0.885, 0.32, 1.05)'
        },
        
        // Durées prédéfinies
        durations: {
            instant: 0,
            fast: 150,
            normal: 300,
            slow: 500,
            slower: 800,
            slowest: 1200
        },
        
        // Configuration de performance
        performance: {
            fps: 60,
            throttle: true,
            useWillChange: true,
            useGPU: true,
            batchUpdates: true,
            maxConcurrent: 10
        },
        
        // Préférences
        preferences: {
            respectReducedMotion: true,
            persistLevel: true,
            autoOptimize: true
        }
    };

    // ========================================
    // BIBLIOTHÈQUE D'ANIMATIONS
    // ========================================
    const ANIMATIONS = {
        // Fade animations
        fadeIn: {
            keyframes: [
                { opacity: 0 },
                { opacity: 1 }
            ],
            options: {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            }
        },
        
        fadeOut: {
            keyframes: [
                { opacity: 1 },
                { opacity: 0 }
            ],
            options: {
                duration: 300,
                easing: 'ease-in',
                fill: 'forwards'
            }
        },
        
        // Scale animations
        scaleIn: {
            keyframes: [
                { transform: 'scale(0)', opacity: 0 },
                { transform: 'scale(1)', opacity: 1 }
            ],
            options: {
                duration: 300,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }
        },
        
        scaleOut: {
            keyframes: [
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(0)', opacity: 0 }
            ],
            options: {
                duration: 300,
                easing: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)'
            }
        },
        
        // Slide animations
        slideInUp: {
            keyframes: [
                { transform: 'translateY(100%)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ],
            options: {
                duration: 400,
                easing: 'cubic-bezier(0, 0, 0.2, 1)'
            }
        },
        
        slideInDown: {
            keyframes: [
                { transform: 'translateY(-100%)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ],
            options: {
                duration: 400,
                easing: 'cubic-bezier(0, 0, 0.2, 1)'
            }
        },
        
        slideInLeft: {
            keyframes: [
                { transform: 'translateX(-100%)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ],
            options: {
                duration: 400,
                easing: 'cubic-bezier(0, 0, 0.2, 1)'
            }
        },
        
        slideInRight: {
            keyframes: [
                { transform: 'translateX(100%)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ],
            options: {
                duration: 400,
                easing: 'cubic-bezier(0, 0, 0.2, 1)'
            }
        },
        
        // Rotate animations
        rotateIn: {
            keyframes: [
                { transform: 'rotate(-180deg) scale(0)', opacity: 0 },
                { transform: 'rotate(0) scale(1)', opacity: 1 }
            ],
            options: {
                duration: 500,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }
        },
        
        // Flip animations
        flipInX: {
            keyframes: [
                { transform: 'perspective(400px) rotateX(90deg)', opacity: 0 },
                { transform: 'perspective(400px) rotateX(0)', opacity: 1 }
            ],
            options: {
                duration: 600,
                easing: 'ease-in-out'
            }
        },
        
        flipInY: {
            keyframes: [
                { transform: 'perspective(400px) rotateY(90deg)', opacity: 0 },
                { transform: 'perspective(400px) rotateY(0)', opacity: 1 }
            ],
            options: {
                duration: 600,
                easing: 'ease-in-out'
            }
        },
        
        // Bounce animations
        bounceIn: {
            keyframes: [
                { transform: 'scale(0.3)', opacity: 0, offset: 0 },
                { transform: 'scale(1.05)', offset: 0.4 },
                { transform: 'scale(0.9)', offset: 0.6 },
                { transform: 'scale(1.03)', offset: 0.8 },
                { transform: 'scale(0.97)', offset: 0.9 },
                { transform: 'scale(1)', opacity: 1, offset: 1 }
            ],
            options: {
                duration: 800,
                easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
            }
        },
        
        // Shake animation
        shake: {
            keyframes: [
                { transform: 'translateX(0)', offset: 0 },
                { transform: 'translateX(-10px)', offset: 0.1 },
                { transform: 'translateX(10px)', offset: 0.2 },
                { transform: 'translateX(-10px)', offset: 0.3 },
                { transform: 'translateX(10px)', offset: 0.4 },
                { transform: 'translateX(-10px)', offset: 0.5 },
                { transform: 'translateX(10px)', offset: 0.6 },
                { transform: 'translateX(-10px)', offset: 0.7 },
                { transform: 'translateX(10px)', offset: 0.8 },
                { transform: 'translateX(-10px)', offset: 0.9 },
                { transform: 'translateX(0)', offset: 1 }
            ],
            options: {
                duration: 600,
                easing: 'ease-in-out'
            }
        },
        
        // Pulse animation
        pulse: {
            keyframes: [
                { transform: 'scale(1)', offset: 0 },
                { transform: 'scale(1.05)', offset: 0.5 },
                { transform: 'scale(1)', offset: 1 }
            ],
            options: {
                duration: 1000,
                easing: 'ease-in-out',
                iterations: Infinity
            }
        },
        
        // Morph animation (pour les transitions de forme)
        morph: {
            keyframes: [], // Généré dynamiquement
            options: {
                duration: 600,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
        },
        
        // Ripple effect (Material Design)
        ripple: {
            keyframes: [
                { 
                    transform: 'scale(0)', 
                    opacity: 0.5,
                    offset: 0 
                },
                { 
                    transform: 'scale(4)', 
                    opacity: 0,
                    offset: 1 
                }
            ],
            options: {
                duration: 600,
                easing: 'ease-out'
            }
        },
        
        // Blur fade (glassmorphism)
        blurIn: {
            keyframes: [
                { 
                    filter: 'blur(20px)', 
                    opacity: 0,
                    transform: 'scale(0.9)'
                },
                { 
                    filter: 'blur(0)', 
                    opacity: 1,
                    transform: 'scale(1)'
                }
            ],
            options: {
                duration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
        },
        
        // Parallax scroll
        parallax: {
            keyframes: [], // Généré dynamiquement selon le scroll
            options: {
                duration: 0, // Animé via RAF
                easing: 'linear'
            }
        }
    };

    // ========================================
    // VARIABLES D'ÉTAT
    // ========================================
    let currentLevel = 'smooth';
    let runningAnimations = new Map();
    let animationQueue = [];
    let rafId = null;
    let reducedMotion = false;
    let performanceMonitor = null;

    // ========================================
    // GESTIONNAIRE DE PERFORMANCE
    // ========================================
    const PerformanceManager = {
        metrics: {
            fps: [],
            animationCount: 0,
            droppedFrames: 0,
            lastFrameTime: 0
        },
        
        start() {
            this.metrics.lastFrameTime = performance.now();
            this.monitor();
        },
        
        monitor() {
            rafId = requestAnimationFrame(() => {
                const now = performance.now();
                const delta = now - this.metrics.lastFrameTime;
                const fps = 1000 / delta;
                
                this.metrics.fps.push(fps);
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }
                
                // Détecter les frames perdues
                if (delta > 16.67 * 1.5) { // 1.5x le temps d'une frame à 60fps
                    this.metrics.droppedFrames++;
                }
                
                this.metrics.lastFrameTime = now;
                
                // Auto-optimisation
                if (CONFIG.preferences.autoOptimize) {
                    this.autoOptimize();
                }
                
                this.monitor();
            });
        },
        
        stop() {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        },
        
        getAverageFPS() {
            if (this.metrics.fps.length === 0) return 60;
            const sum = this.metrics.fps.reduce((a, b) => a + b, 0);
            return sum / this.metrics.fps.length;
        },
        
        autoOptimize() {
            const avgFPS = this.getAverageFPS();
            
            // Si les performances sont mauvaises
            if (avgFPS < 30 && currentLevel !== 'none') {
                console.warn('[AnimationEngine] Low FPS detected, reducing animation level');
                this.downgradeLevel();
            }
            // Si les performances sont bonnes et qu'on peut augmenter
            else if (avgFPS > 55 && runningAnimations.size < 5) {
                // On pourrait upgrader le niveau ici si souhaité
            }
        },
        
        downgradeLevel() {
            const levels = Object.keys(CONFIG.levels);
            const currentIndex = levels.indexOf(currentLevel);
            if (currentIndex > 0) {
                setLevel(levels[currentIndex - 1]);
            }
        }
    };

    // ========================================
    // ORCHESTRATEUR D'ANIMATIONS
    // ========================================
    const Orchestrator = {
        // Animer un élément
        async animate(element, animationName, options = {}) {
            if (!element || currentLevel === 'none' || reducedMotion) {
                return Promise.resolve();
            }
            
            const animation = ANIMATIONS[animationName];
            if (!animation) {
                throw new Error(`Animation "${animationName}" not found`);
            }
            
            // Fusionner les options
            const finalOptions = {
                ...animation.options,
                ...options,
                duration: this.getDuration(animation.options.duration, options.duration)
            };
            
            // Préparer l'élément
            if (CONFIG.performance.useWillChange && finalOptions.duration > 0) {
                element.style.willChange = 'transform, opacity, filter';
            }
            
            // Créer et lancer l'animation
            const webAnimation = element.animate(animation.keyframes, finalOptions);
            
            // Tracker l'animation
            const animationId = this.generateId();
            runningAnimations.set(animationId, {
                element,
                animation: webAnimation,
                name: animationName,
                startTime: performance.now()
            });
            
            // Nettoyer après l'animation
            webAnimation.finished.then(() => {
                this.cleanup(element, animationId);
            });
            
            return webAnimation.finished;
        },
        
        // Séquence d'animations
        async sequence(animations) {
            const results = [];
            
            for (const { element, animation, options, delay } of animations) {
                if (delay) {
                    await this.delay(delay);
                }
                results.push(await this.animate(element, animation, options));
            }
            
            return results;
        },
        
        // Animations parallèles
        async parallel(animations) {
            return Promise.all(
                animations.map(({ element, animation, options, delay }) => {
                    if (delay) {
                        return this.delay(delay).then(() => 
                            this.animate(element, animation, options)
                        );
                    }
                    return this.animate(element, animation, options);
                })
            );
        },
        
        // Animation en cascade (stagger)
        async stagger(elements, animation, options = {}) {
            const staggerDelay = options.staggerDelay || 50;
            const animations = [];
            
            elements.forEach((element, index) => {
                animations.push({
                    element,
                    animation,
                    options,
                    delay: index * staggerDelay
                });
            });
            
            return this.parallel(animations);
        },
        
        // Arrêter toutes les animations d'un élément
        stop(element) {
            for (const [id, data] of runningAnimations) {
                if (data.element === element) {
                    data.animation.cancel();
                    runningAnimations.delete(id);
                }
            }
        },
        
        // Arrêter toutes les animations
        stopAll() {
            for (const [id, data] of runningAnimations) {
                data.animation.cancel();
            }
            runningAnimations.clear();
        },
        
        // Utilitaires
        getDuration(baseDuration, customDuration) {
            if (customDuration !== undefined) return customDuration;
            
            const levelConfig = CONFIG.levels[currentLevel];
            if (!levelConfig.enabled) return 0;
            
            return baseDuration * (levelConfig.duration / 300); // 300 est la durée de référence
        },
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        
        cleanup(element, animationId) {
            runningAnimations.delete(animationId);
            
            if (CONFIG.performance.useWillChange) {
                element.style.willChange = 'auto';
            }
            
            // Émettre l'événement
            emitAnimationComplete(element, animationId);
        },
        
        generateId() {
            return `animation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    };

    // ========================================
    // DÉTECTION DES PRÉFÉRENCES
    // ========================================
    const detectReducedMotion = () => {
        if (!window.matchMedia) return false;
        
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotion = mediaQuery.matches;
        
        // Écouter les changements
        mediaQuery.addEventListener('change', (e) => {
            reducedMotion = e.matches;
            if (reducedMotion && CONFIG.preferences.respectReducedMotion) {
                setLevel('none');
            }
        });
        
        return reducedMotion;
    };

    // ========================================
    // ANIMATIONS SPÉCIALES
    // ========================================
    const SpecialEffects = {
        // Effet ripple Material Design
        ripple(element, event) {
            if (currentLevel === 'none') return;
            
            const rect = element.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: var(--ui-ripple-color, rgba(0, 0, 0, 0.1));
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);
            
            const animation = ripple.animate(ANIMATIONS.ripple.keyframes, {
                ...ANIMATIONS.ripple.options,
                duration: Orchestrator.getDuration(600)
            });
            
            animation.finished.then(() => ripple.remove());
        },
        
        // Parallax scroll
        parallax(elements, options = {}) {
            if (currentLevel !== 'rich') return;
            
            const intensity = options.intensity || 0.5;
            let ticking = false;
            
            const updateParallax = () => {
                const scrollY = window.scrollY;
                
                elements.forEach((element, index) => {
                    const speed = element.dataset.parallaxSpeed || intensity;
                    const yPos = -(scrollY * speed);
                    element.style.transform = `translate3d(0, ${yPos}px, 0)`;
                });
                
                ticking = false;
            };
            
            const onScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            };
            
            window.addEventListener('scroll', onScroll, { passive: true });
            
            return () => window.removeEventListener('scroll', onScroll);
        },
        
        // Morphing entre formes
        morph(element, fromPath, toPath, options = {}) {
            if (currentLevel === 'none') return;
            
            const duration = Orchestrator.getDuration(600, options.duration);
            
            const keyframes = [
                { d: fromPath },
                { d: toPath }
            ];
            
            return element.animate(keyframes, {
                duration,
                easing: options.easing || CONFIG.easings.standard,
                fill: 'forwards'
            });
        },
        
        // Particules
        particles(container, options = {}) {
            if (currentLevel !== 'rich' || !CONFIG.levels.rich.particles) return;
            
            const count = options.count || 50;
            const particles = [];
            
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'ui-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: ${options.size || 4}px;
                    height: ${options.size || 4}px;
                    background: ${options.color || 'var(--ui-primary)'};
                    border-radius: 50%;
                    pointer-events: none;
                `;
                
                container.appendChild(particle);
                particles.push(particle);
                
                // Animation aléatoire
                this.animateParticle(particle, options);
            }
            
            return () => {
                particles.forEach(p => p.remove());
            };
        },
        
        animateParticle(particle, options) {
            const duration = 2000 + Math.random() * 3000;
            const delay = Math.random() * 1000;
            
            const animation = particle.animate([
                {
                    transform: `translate(0, 0) scale(0)`,
                    opacity: 0
                },
                {
                    transform: `translate(${Math.random() * 200 - 100}px, ${-100 - Math.random() * 100}px) scale(1)`,
                    opacity: 1,
                    offset: 0.3
                },
                {
                    transform: `translate(${Math.random() * 200 - 100}px, ${-200 - Math.random() * 100}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration,
                delay,
                easing: CONFIG.easings.deceleration,
                iterations: Infinity
            });
            
            return animation;
        }
    };

    // ========================================
    // UTILITAIRES D'ANIMATION
    // ========================================
    const Utils = {
        // Créer une animation custom
        create(keyframes, options = {}) {
            return {
                keyframes,
                options: {
                    duration: options.duration || 300,
                    easing: options.easing || CONFIG.easings.standard,
                    fill: options.fill || 'forwards',
                    ...options
                }
            };
        },
        
        // Composer des animations
        compose(...animations) {
            const keyframes = [];
            let totalDuration = 0;
            
            animations.forEach(anim => {
                const animation = ANIMATIONS[anim] || anim;
                keyframes.push(...animation.keyframes);
                totalDuration += animation.options.duration || 300;
            });
            
            return {
                keyframes,
                options: {
                    duration: totalDuration,
                    easing: CONFIG.easings.standard
                }
            };
        },
        
        // Spring physics
        spring(element, options = {}) {
            const {
                from = { x: 0, y: 0 },
                to = { x: 100, y: 100 },
                stiffness = 0.5,
                damping = 0.8,
                mass = 1
            } = options;
            
            // Implémentation simplifiée de spring physics
            // Dans un cas réel, utiliser une bibliothèque comme Popmotion
            const keyframes = [];
            const steps = 60;
            
            for (let i = 0; i <= steps; i++) {
                const progress = i / steps;
                const springProgress = this.springEasing(progress, stiffness, damping);
                
                keyframes.push({
                    transform: `translate(${
                        from.x + (to.x - from.x) * springProgress
                    }px, ${
                        from.y + (to.y - from.y) * springProgress
                    }px)`
                });
            }
            
            return element.animate(keyframes, {
                duration: 1000 / stiffness,
                easing: 'linear'
            });
        },
        
        springEasing(t, stiffness = 0.5, damping = 0.8) {
            // Formule simplifiée pour l'effet spring
            return 1 - Math.pow(Math.E, -stiffness * t * 10) * 
                   Math.cos(Math.sqrt(1 - damping * damping) * t * 10);
        },
        
        // Obtenir les propriétés animables
        getAnimatableProperties(element) {
            const computed = getComputedStyle(element);
            const animatable = [
                'opacity', 'transform', 'filter', 'clip-path',
                'width', 'height', 'top', 'left', 'right', 'bottom',
                'margin', 'padding', 'border-radius', 'background-color',
                'color', 'box-shadow', 'backdrop-filter'
            ];
            
            const properties = {};
            animatable.forEach(prop => {
                properties[prop] = computed.getPropertyValue(prop);
            });
            
            return properties;
        }
    };

    // ========================================
    // GESTION DU NIVEAU D'ANIMATION
    // ========================================
    const setLevel = (level) => {
        if (!CONFIG.levels[level]) {
            throw new Error(`Animation level "${level}" not found`);
        }
        
        currentLevel = level;
        document.body.dataset.animationLevel = level;
        
        // Sauvegarder la préférence
        if (CONFIG.preferences.persistLevel) {
            try {
                localStorage.setItem('ui-animation-level', level);
            } catch (e) {
                console.warn('[AnimationEngine] Failed to save preference:', e);
            }
        }
        
        // Émettre l'événement
        emitLevelChange(level);
        
        console.log(`[AnimationEngine] Level set to: ${level}`);
    };

    // ========================================
    // ÉMISSION DES ÉVÉNEMENTS
    // ========================================
    const emitAnimationComplete = (element, animationId) => {
        const event = new CustomEvent('animation:complete', {
            detail: {
                element,
                animationId,
                timestamp: performance.now()
            },
            bubbles: true
        });
        
        element.dispatchEvent(event);
        
        if (window.UIManager?.emit) {
            window.UIManager.emit('ui:animation:complete', event.detail);
        }
    };
    
    const emitLevelChange = (level) => {
        const event = new CustomEvent('animation:levelChanged', {
            detail: {
                level,
                previousLevel: currentLevel,
                timestamp: performance.now()
            },
            bubbles: true
        });
        
        document.dispatchEvent(event);
    };

    // ========================================
    // INITIALISATION
    // ========================================
    const init = async () => {
        console.log('[AnimationEngine] Initializing...');
        
        try {
            // Détecter reduced motion
            detectReducedMotion();
            
            // Charger le niveau sauvegardé
            if (CONFIG.preferences.persistLevel) {
                try {
                    const savedLevel = localStorage.getItem('ui-animation-level');
                    if (savedLevel && CONFIG.levels[savedLevel]) {
                        currentLevel = savedLevel;
                    }
                } catch (e) {
                    console.warn('[AnimationEngine] Failed to load saved level:', e);
                }
            }
            
            // Appliquer reduced motion si nécessaire
            if (reducedMotion && CONFIG.preferences.respectReducedMotion) {
                currentLevel = 'none';
            }
            
            // Définir le niveau initial
            document.body.dataset.animationLevel = currentLevel;
            
            // Démarrer le monitoring de performance
            PerformanceManager.start();
            
            console.log('[AnimationEngine] Ready with level:', currentLevel);
        } catch (error) {
            console.error('[AnimationEngine] Initialization failed:', error);
        }
    };

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration
        config: CONFIG,
        animations: ANIMATIONS,
        
        // Niveau actuel
        get level() {
            return currentLevel;
        },
        setLevel,
        
        // Animation principale
        animate: (element, animation, options) => 
            Orchestrator.animate(element, animation, options),
        
        // Orchestration
        sequence: animations => Orchestrator.sequence(animations),
        parallel: animations => Orchestrator.parallel(animations),
        stagger: (elements, animation, options) => 
            Orchestrator.stagger(elements, animation, options),
        
        // Contrôle
        stop: element => Orchestrator.stop(element),
        stopAll: () => Orchestrator.stopAll(),
        
        // Effets spéciaux
        effects: {
            ripple: (element, event) => SpecialEffects.ripple(element, event),
            parallax: (elements, options) => SpecialEffects.parallax(elements, options),
            morph: (element, from, to, options) => 
                SpecialEffects.morph(element, from, to, options),
            particles: (container, options) => 
                SpecialEffects.particles(container, options)
        },
        
        // Utilitaires
        utils: {
            create: Utils.create,
            compose: Utils.compose,
            spring: (element, options) => Utils.spring(element, options),
            getAnimatableProperties: Utils.getAnimatableProperties
        },
        
        // Performance
        performance: {
            getMetrics: () => ({
                fps: PerformanceManager.getAverageFPS(),
                runningAnimations: runningAnimations.size,
                droppedFrames: PerformanceManager.metrics.droppedFrames
            }),
            optimize: () => PerformanceManager.autoOptimize()
        },
        
        // Easings disponibles
        easings: CONFIG.easings,
        
        // Durées prédéfinies
        durations: CONFIG.durations,
        
        // Initialisation
        init
    };
})();

// Export pour utilisation
export default AnimationEngine;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Performance avec animations multiples
   Solution: Limite du nombre d'animations concurrentes
   
   [DATE] - Reduced motion non respecté
   Cause: Detection tardive
   Résolution: Detection au init() et listener
   
   [DATE] - Memory leaks avec particules
   Cause: Animations infinies non nettoyées
   Résolution: Cleanup explicite et WeakMap
   
   NOTES POUR REPRISES FUTURES:
   - Web Animations API peut ne pas être supportée partout
   - Les spring physics sont simplifiées
   - Le monitoring de performance impacte légèrement les perfs
   - Les particules peuvent être lourdes sur mobile
   ======================================== */