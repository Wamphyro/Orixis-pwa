/* ========================================
   SIGNATURE-PAD.COMPONENT.JS - Composant de signature complet
   Chemin: src/js/shared/ui/data-entry/signature-pad.component.js
   
   DESCRIPTION:
   Composant de signature ultra-complet avec support tactile/souris,
   tous les styles, animations et fonctionnalités avancées.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-350)
   2. Variables privées (lignes 352-380)
   3. Méthodes de création (lignes 382-700)
   4. Gestion du dessin (lignes 702-1000)
   5. Fonctionnalités avancées (lignes 1002-1400)
   6. Utilitaires et export (lignes 1402-1600)
   7. API publique (lignes 1602-1700)
   
   DÉPENDANCES:
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   - format-utils.js (export formats)
   ======================================== */

const SignaturePad = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            glassmorphism: {
                background: 'rgba(255, 255, 255, 0.08)',
                blur: 20,
                border: 'rgba(255, 255, 255, 0.15)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                borderRadius: 16,
                overlayGradient: true
            },
            neumorphism: {
                background: '#e0e5ec',
                boxShadow: 'inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff',
                borderRadius: 20
            },
            flat: {
                background: '#ffffff',
                border: '#e5e7eb',
                borderRadius: 8
            },
            minimal: {
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #e5e7eb'
            },
            material: {
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                borderRadius: 4
            },
            paper: {
                background: '#fffef7',
                texture: 'paper',
                border: '#d4d4d4',
                shadow: '2px 2px 5px rgba(0,0,0,0.1)'
            },
            chalkboard: {
                background: '#2d3436',
                strokeColor: '#ffffff',
                texture: 'chalk',
                borderRadius: 8
            }
        },

        // Options de trait
        strokes: {
            pen: {
                lineWidth: 2,
                lineCap: 'round',
                lineJoin: 'round',
                smoothing: true,
                pressure: false
            },
            marker: {
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                opacity: 0.8,
                smoothing: false
            },
            brush: {
                lineWidth: 8,
                lineCap: 'round',
                lineJoin: 'round',
                texture: true,
                pressure: true,
                opacity: 0.9
            },
            pencil: {
                lineWidth: 1,
                lineCap: 'round',
                lineJoin: 'round',
                texture: 'pencil',
                smoothing: true
            },
            calligraphy: {
                lineWidth: 3,
                lineCap: 'square',
                lineJoin: 'miter',
                angleVariation: true,
                pressure: true
            },
            fountain: {
                lineWidth: 2,
                lineCap: 'round',
                lineJoin: 'round',
                inkFlow: true,
                pressure: true
            }
        },

        // Couleurs prédéfinies
        colors: {
            black: '#000000',
            blue: '#0066cc',
            red: '#cc0000',
            green: '#00cc66',
            purple: '#6600cc',
            brown: '#663300',
            navy: '#000066',
            custom: null
        },

        // Animations
        animations: {
            none: {
                enabled: false
            },
            subtle: {
                enabled: true,
                fadeIn: true,
                duration: 200
            },
            smooth: {
                enabled: true,
                fadeIn: true,
                drawingEffect: 'smooth',
                duration: 300,
                easing: 'ease-out'
            },
            rich: {
                enabled: true,
                fadeIn: true,
                drawingEffect: 'particle',
                strokeAnimation: true,
                glowEffect: true,
                rippleOnTouch: true,
                duration: 400
            }
        },

        // Tailles prédéfinies
        sizes: {
            small: {
                width: 300,
                height: 150,
                scale: 1
            },
            medium: {
                width: 500,
                height: 250,
                scale: 1.5
            },
            large: {
                width: 700,
                height: 350,
                scale: 2
            },
            fullwidth: {
                width: '100%',
                height: 300,
                scale: 2
            },
            square: {
                width: 400,
                height: 400,
                scale: 2
            },
            responsive: {
                width: '100%',
                height: 'auto',
                scale: 'auto'
            }
        },

        // Fonctionnalités
        features: {
            // Outils de base
            tools: {
                clear: true,
                undo: true,
                redo: true,
                save: true,
                load: true
            },
            // Guide et assistance
            guides: {
                enabled: false,
                baseline: false,
                grid: false,
                centerCross: false,
                signatureBox: false
            },
            // Validation
            validation: {
                minPoints: 20,
                minLength: 100,
                minTime: 500,
                maxTime: null,
                requireCompleteness: false
            },
            // Effets avancés
            effects: {
                smoothing: true,
                pressureSimulation: true,
                velocityBased: true,
                jitter: false,
                beautification: false
            },
            // Accessibilité
            accessibility: {
                keyboardSupport: true,
                announcements: true,
                highContrast: false,
                reducedMotion: false
            },
            // Export
            export: {
                formats: ['png', 'jpg', 'svg', 'json'],
                quality: 0.92,
                background: 'transparent',
                trimWhitespace: true,
                scale: 1
            },
            // Sécurité
            security: {
                watermark: false,
                timestamp: false,
                geolocation: false,
                deviceInfo: false,
                encryption: false
            }
        },

        // Modes d'interaction
        modes: {
            draw: {
                tool: 'pen',
                continuous: true
            },
            text: {
                enabled: false,
                font: 'cursive',
                size: 24
            },
            stamp: {
                enabled: false,
                stamps: []
            },
            gesture: {
                enabled: false,
                pinchZoom: false,
                panMove: false
            }
        },

        // États
        states: {
            empty: 'is-empty',
            drawing: 'is-drawing',
            signed: 'is-signed',
            invalid: 'is-invalid',
            disabled: 'is-disabled',
            loading: 'is-loading',
            saved: 'is-saved'
        },

        // Classes CSS
        classes: {
            container: 'signature-pad',
            canvas: 'signature-pad-canvas',
            toolbar: 'signature-pad-toolbar',
            button: 'signature-pad-button',
            colorPicker: 'signature-pad-color',
            status: 'signature-pad-status',
            guide: 'signature-pad-guide',
            placeholder: 'signature-pad-placeholder'
        },

        // Messages
        messages: {
            placeholder: 'Signez ici',
            clear: 'Effacer',
            undo: 'Annuler',
            redo: 'Refaire',
            save: 'Sauvegarder',
            tooShort: 'Signature trop courte',
            tooFast: 'Veuillez signer plus lentement',
            incomplete: 'Signature incomplète',
            saved: 'Signature sauvegardée'
        }
    };

    // ========================================
    // VARIABLES PRIVÉES
    // ========================================
    let instances = new Map();
    let instanceIdCounter = 0;
    let stylesInjected = false;

    // État global pour le support des fonctionnalités
    const deviceSupport = {
        touch: 'ontouchstart' in window,
        pressure: false,
        tilt: false
    };

    // Détection du support de la pression
    if (window.PointerEvent) {
        const testCanvas = document.createElement('canvas');
        const testCtx = testCanvas.getContext('2d');
        if (testCtx && typeof testCtx.pressure !== 'undefined') {
            deviceSupport.pressure = true;
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    function generateId() {
        return `signature-pad-${++instanceIdCounter}`;
    }

    function createContainer(options) {
        const container = document.createElement('div');
        container.className = `${CONFIG.classes.container} ${options.style} ${options.size}`;
        container.setAttribute('role', 'application');
        container.setAttribute('aria-label', 'Zone de signature');
        
        if (options.id) {
            container.id = options.id;
        }

        // Ajouter les classes d'état initial
        container.classList.add(CONFIG.states.empty);

        return container;
    }

    function createCanvas(options) {
        const wrapper = document.createElement('div');
        wrapper.className = `${CONFIG.classes.canvas}-wrapper`;

        const canvas = document.createElement('canvas');
        canvas.className = CONFIG.classes.canvas;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Canvas de signature');
        
        // Touch-action pour éviter le scrolling pendant le dessin
        canvas.style.touchAction = 'none';

        // Placeholder
        if (options.features?.placeholder !== false) {
            const placeholder = createPlaceholder(options);
            wrapper.appendChild(placeholder);
        }

        // Guides
        if (options.features?.guides?.enabled) {
            const guides = createGuides(options);
            wrapper.appendChild(guides);
        }

        wrapper.appendChild(canvas);
        return { wrapper, canvas };
    }

    function createPlaceholder(options) {
        const placeholder = document.createElement('div');
        placeholder.className = CONFIG.classes.placeholder;
        placeholder.textContent = options.messages?.placeholder || CONFIG.messages.placeholder;
        
        if (options.style === 'glassmorphism') {
            placeholder.style.color = 'rgba(255, 255, 255, 0.5)';
        }
        
        return placeholder;
    }

    function createGuides(options) {
        const guides = document.createElement('svg');
        guides.className = CONFIG.classes.guide;
        guides.style.position = 'absolute';
        guides.style.inset = '0';
        guides.style.pointerEvents = 'none';
        
        const guideOptions = options.features.guides;
        
        // Ligne de base
        if (guideOptions.baseline) {
            const baseline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            baseline.setAttribute('x1', '10%');
            baseline.setAttribute('y1', '75%');
            baseline.setAttribute('x2', '90%');
            baseline.setAttribute('y2', '75%');
            baseline.setAttribute('stroke', 'rgba(0,0,0,0.1)');
            baseline.setAttribute('stroke-dasharray', '5,5');
            guides.appendChild(baseline);
        }
        
        // Grille
        if (guideOptions.grid) {
            const pattern = createGridPattern();
            guides.appendChild(pattern);
        }
        
        // Croix centrale
        if (guideOptions.centerCross) {
            const cross = createCenterCross();
            guides.appendChild(cross);
        }
        
        return guides;
    }

    function createToolbar(options) {
        if (!options.features?.tools) return null;
        
        const toolbar = document.createElement('div');
        toolbar.className = CONFIG.classes.toolbar;
        
        const tools = options.features.tools;
        
        // Bouton Effacer
        if (tools.clear) {
            const clearBtn = createToolButton('clear', 'trash-2', options);
            toolbar.appendChild(clearBtn);
        }
        
        // Bouton Annuler
        if (tools.undo) {
            const undoBtn = createToolButton('undo', 'undo', options);
            toolbar.appendChild(undoBtn);
        }
        
        // Bouton Refaire
        if (tools.redo) {
            const redoBtn = createToolButton('redo', 'redo', options);
            toolbar.appendChild(redoBtn);
        }
        
        // Sélecteur de couleur
        if (options.features?.colorPicker) {
            const colorPicker = createColorPicker(options);
            toolbar.appendChild(colorPicker);
        }
        
        // Sélecteur de trait
        if (options.features?.strokePicker) {
            const strokePicker = createStrokePicker(options);
            toolbar.appendChild(strokePicker);
        }
        
        // Bouton Sauvegarder
        if (tools.save) {
            const saveBtn = createToolButton('save', 'save', options);
            toolbar.appendChild(saveBtn);
        }
        
        return toolbar;
    }

    function createToolButton(action, icon, options) {
        const button = document.createElement('button');
        button.className = `${CONFIG.classes.button} ${CONFIG.classes.button}-${action}`;
        button.setAttribute('aria-label', CONFIG.messages[action] || action);
        button.dataset.action = action;
        
        // Icône SVG
        button.innerHTML = getIcon(icon);
        
        // Style glassmorphism
        if (options.style === 'glassmorphism') {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
            button.style.backdropFilter = 'blur(10px)';
            button.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        }
        
        return button;
    }

    function createColorPicker(options) {
        const picker = document.createElement('div');
        picker.className = CONFIG.classes.colorPicker;
        
        Object.entries(CONFIG.colors).forEach(([name, color]) => {
            if (color) {
                const colorBtn = document.createElement('button');
                colorBtn.className = `${CONFIG.classes.colorPicker}-option`;
                colorBtn.style.backgroundColor = color;
                colorBtn.dataset.color = color;
                colorBtn.setAttribute('aria-label', `Couleur ${name}`);
                picker.appendChild(colorBtn);
            }
        });
        
        // Input couleur personnalisée
        if (options.features?.customColor) {
            const customColor = document.createElement('input');
            customColor.type = 'color';
            customColor.className = `${CONFIG.classes.colorPicker}-custom`;
            picker.appendChild(customColor);
        }
        
        return picker;
    }

    function createStatusBar(options) {
        if (!options.features?.statusBar) return null;
        
        const status = document.createElement('div');
        status.className = CONFIG.classes.status;
        
        // Indicateur de points
        const pointsIndicator = document.createElement('span');
        pointsIndicator.className = `${CONFIG.classes.status}-points`;
        pointsIndicator.textContent = 'Points: 0';
        
        // Indicateur de temps
        const timeIndicator = document.createElement('span');
        timeIndicator.className = `${CONFIG.classes.status}-time`;
        timeIndicator.textContent = 'Temps: 0s';
        
        status.appendChild(pointsIndicator);
        status.appendChild(timeIndicator);
        
        return status;
    }

    // ========================================
    // MÉTHODES PRIVÉES - GESTION DU DESSIN
    // ========================================
    function initializeCanvas(instance) {
        const { canvas, options } = instance;
        const ctx = canvas.getContext('2d');
        instance.ctx = ctx;
        
        // Configuration du contexte
        applyStrokeStyle(instance, options.stroke || 'pen');
        
        // Dimensions
        resizeCanvas(instance);
        
        // Background
        if (options.features?.background) {
            applyBackground(instance, options.features.background);
        }
        
        // État initial
        instance.state = {
            isDrawing: false,
            isEmpty: true,
            points: [],
            history: [],
            historyStep: -1,
            startTime: null,
            lastPoint: null,
            currentPath: []
        };
    }

    function resizeCanvas(instance) {
        const { canvas, options } = instance;
        const wrapper = canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        
        // Calculer les dimensions selon la configuration
        let width, height, scale;
        
        const sizeConfig = CONFIG.sizes[options.size] || CONFIG.sizes.medium;
        
        if (sizeConfig.width === '100%') {
            width = rect.width;
        } else {
            width = typeof sizeConfig.width === 'number' ? sizeConfig.width : rect.width;
        }
        
        if (sizeConfig.height === 'auto') {
            height = width * 0.5; // Ratio 2:1 par défaut
        } else {
            height = typeof sizeConfig.height === 'number' ? sizeConfig.height : 250;
        }
        
        scale = sizeConfig.scale === 'auto' ? window.devicePixelRatio || 1 : sizeConfig.scale;
        
        // Sauvegarder le contenu actuel
        const imageData = instance.state?.isEmpty ? null : 
            instance.ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Appliquer les dimensions
        canvas.width = width * scale;
        canvas.height = height * scale;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // Configurer le contexte avec le scale
        instance.ctx.scale(scale, scale);
        
        // Réappliquer les styles
        applyStrokeStyle(instance, instance.currentStroke || options.stroke || 'pen');
        
        // Restaurer le contenu
        if (imageData) {
            instance.ctx.putImageData(imageData, 0, 0);
        }
    }

    function applyStrokeStyle(instance, strokeType) {
        const { ctx, options } = instance;
        const strokeConfig = CONFIG.strokes[strokeType] || CONFIG.strokes.pen;
        
        ctx.lineWidth = strokeConfig.lineWidth;
        ctx.lineCap = strokeConfig.lineCap;
        ctx.lineJoin = strokeConfig.lineJoin;
        ctx.strokeStyle = instance.currentColor || options.color || CONFIG.colors.black;
        
        if (strokeConfig.opacity) {
            ctx.globalAlpha = strokeConfig.opacity;
        }
        
        instance.currentStroke = strokeType;
        instance.strokeConfig = strokeConfig;
    }

    function startDrawing(instance, e) {
        const { options, state } = instance;
        
        e.preventDefault();
        state.isDrawing = true;
        
        const point = getCoordinates(instance, e);
        state.lastPoint = point;
        state.currentPath = [point];
        
        // Marquer le début
        if (state.isEmpty) {
            state.isEmpty = false;
            state.startTime = Date.now();
            instance.elements.container.classList.remove(CONFIG.states.empty);
            instance.elements.container.classList.add(CONFIG.states.drawing);
            hidePlaceholder(instance);
            
            // Callback onStart
            if (options.onStart) {
                options.onStart(instance);
            }
        }
        
        // Animation de début si activée
        if (options.animation !== 'none') {
            animateDrawStart(instance, point);
        }
        
        // Commencer le trait
        instance.ctx.beginPath();
        instance.ctx.moveTo(point.x, point.y);
    }

    function draw(instance, e) {
        const { state, strokeConfig } = instance;
        
        if (!state.isDrawing) return;
        e.preventDefault();
        
        const point = getCoordinates(instance, e);
        
        // Smoothing si activé
        if (strokeConfig.smoothing) {
            drawSmoothLine(instance, state.lastPoint, point);
        } else {
            instance.ctx.lineTo(point.x, point.y);
            instance.ctx.stroke();
        }
        
        // Effets avancés
        if (instance.options.features?.effects) {
            applyDrawingEffects(instance, point, e);
        }
        
        // Enregistrer le point
        state.currentPath.push(point);
        state.points.push(point);
        state.lastPoint = point;
        
        // Callback onChange
        if (instance.options.onChange) {
            instance.options.onChange(instance);
        }
        
        // Mise à jour du status
        updateStatus(instance);
    }

    function stopDrawing(instance, e) {
        const { state } = instance;
        
        if (!state.isDrawing) return;
        e.preventDefault();
        
        state.isDrawing = false;
        instance.elements.container.classList.remove(CONFIG.states.drawing);
        
        // Sauvegarder dans l'historique
        saveToHistory(instance);
        
        // Valider si nécessaire
        if (instance.options.features?.validation) {
            validateSignature(instance);
        }
        
        // Animation de fin si activée
        if (instance.options.animation !== 'none') {
            animateDrawEnd(instance);
        }
        
        // Callback onEnd
        if (instance.options.onEnd) {
            instance.options.onEnd(instance);
        }
    }

    function getCoordinates(instance, e) {
        const rect = instance.canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        const scale = instance.canvas.width / rect.width;
        
        let pressure = 1;
        let tiltX = 0;
        let tiltY = 0;
        
        // Support de la pression
        if (deviceSupport.pressure && e.pressure !== undefined) {
            pressure = e.pressure;
        }
        
        // Support de l'inclinaison
        if (deviceSupport.tilt && e.tiltX !== undefined) {
            tiltX = e.tiltX;
            tiltY = e.tiltY;
        }
        
        return {
            x: (touch.clientX - rect.left) * scale / (instance.canvas.width / rect.width),
            y: (touch.clientY - rect.top) * scale / (instance.canvas.height / rect.height),
            pressure,
            tiltX,
            tiltY,
            time: Date.now()
        };
    }

    function drawSmoothLine(instance, from, to) {
        const { ctx } = instance;
        
        // Courbe de Bézier quadratique pour le lissage
        const cp = {
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2
        };
        
        ctx.quadraticCurveTo(from.x, from.y, cp.x, cp.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
    }

    function applyDrawingEffects(instance, point, e) {
        const effects = instance.options.features.effects;
        
        // Variation de pression
        if (effects.pressureSimulation && !deviceSupport.pressure) {
            const velocity = calculateVelocity(instance.state.lastPoint, point);
            const pressure = Math.max(0.1, 1 - velocity / 100);
            instance.ctx.lineWidth = instance.strokeConfig.lineWidth * pressure;
        }
        
        // Effet de vitesse
        if (effects.velocityBased) {
            applyVelocityEffect(instance, point);
        }
        
        // Jitter artistique
        if (effects.jitter) {
            applyJitterEffect(instance, point);
        }
        
        // Effet calligraphique
        if (instance.currentStroke === 'calligraphy') {
            applyCalligraphyEffect(instance, point);
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES - FONCTIONNALITÉS
    // ========================================
    function clearCanvas(instance) {
        const { ctx, canvas, state } = instance;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Réinitialiser l'état
        state.isEmpty = true;
        state.points = [];
        state.currentPath = [];
        
        // Réappliquer le background si nécessaire
        if (instance.options.features?.background) {
            applyBackground(instance, instance.options.features.background);
        }
        
        // Mettre à jour les classes
        instance.elements.container.classList.add(CONFIG.states.empty);
        instance.elements.container.classList.remove(CONFIG.states.signed, CONFIG.states.invalid);
        
        // Afficher le placeholder
        showPlaceholder(instance);
        
        // Réinitialiser le status
        updateStatus(instance);
        
        // Callback
        if (instance.options.onClear) {
            instance.options.onClear(instance);
        }
    }

    function undo(instance) {
        const { state } = instance;
        
        if (state.historyStep > 0) {
            state.historyStep--;
            restoreFromHistory(instance, state.historyStep);
        }
    }

    function redo(instance) {
        const { state } = instance;
        
        if (state.historyStep < state.history.length - 1) {
            state.historyStep++;
            restoreFromHistory(instance, state.historyStep);
        }
    }

    function saveToHistory(instance) {
        const { canvas, state } = instance;
        
        // Limiter l'historique
        state.historyStep++;
        state.history = state.history.slice(0, state.historyStep);
        
        // Sauvegarder l'état actuel
        state.history.push({
            imageData: canvas.toDataURL(),
            points: [...state.points],
            timestamp: Date.now()
        });
        
        // Limiter la taille de l'historique
        if (state.history.length > 50) {
            state.history = state.history.slice(-50);
            state.historyStep = state.history.length - 1;
        }
    }

    function restoreFromHistory(instance, step) {
        const historyItem = instance.state.history[step];
        if (!historyItem) return;
        
        const img = new Image();
        img.onload = () => {
            clearCanvas(instance);
            instance.ctx.drawImage(img, 0, 0);
            instance.state.points = [...historyItem.points];
            instance.state.isEmpty = false;
            instance.elements.container.classList.remove(CONFIG.states.empty);
            hidePlaceholder(instance);
        };
        img.src = historyItem.imageData;
    }

    function saveSignature(instance) {
        const { options } = instance;
        const exportOptions = options.features?.export || {};
        
        // Format par défaut
        const format = exportOptions.defaultFormat || 'png';
        const quality = exportOptions.quality || 0.92;
        
        let data;
        
        switch (format) {
            case 'svg':
                data = exportToSVG(instance);
                break;
            case 'json':
                data = exportToJSON(instance);
                break;
            default:
                data = exportToImage(instance, format, quality);
        }
        
        // Ajouter les métadonnées si activées
        if (options.features?.security) {
            data = addSecurityMetadata(instance, data);
        }
        
        // Callback
        if (options.onSave) {
            options.onSave(data, instance);
        }
        
        // Feedback visuel
        instance.elements.container.classList.add(CONFIG.states.saved);
        setTimeout(() => {
            instance.elements.container.classList.remove(CONFIG.states.saved);
        }, 2000);
        
        return data;
    }

    function exportToImage(instance, format = 'png', quality = 0.92) {
        const { canvas, options } = instance;
        const exportOptions = options.features?.export || {};
        
        // Créer un canvas temporaire pour l'export
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Dimensions d'export
        const scale = exportOptions.scale || 1;
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        
        // Background
        if (exportOptions.background && exportOptions.background !== 'transparent') {
            tempCtx.fillStyle = exportOptions.background;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // Dessiner la signature
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Trim whitespace si activé
        if (exportOptions.trimWhitespace) {
            return trimCanvas(tempCanvas).toDataURL(`image/${format}`, quality);
        }
        
        return tempCanvas.toDataURL(`image/${format}`, quality);
    }

    function exportToSVG(instance) {
        const { state, options } = instance;
        const paths = [];
        
        // Convertir les points en chemins SVG
        state.history.forEach(item => {
            if (item.points && item.points.length > 0) {
                const pathData = pointsToSVGPath(item.points);
                paths.push(pathData);
            }
        });
        
        // Créer le SVG
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            width="${instance.canvas.width}" 
            height="${instance.canvas.height}"
            viewBox="0 0 ${instance.canvas.width} ${instance.canvas.height}">
            ${paths.map(path => 
                `<path d="${path}" 
                    fill="none" 
                    stroke="${instance.currentColor || CONFIG.colors.black}" 
                    stroke-width="${instance.strokeConfig.lineWidth}" 
                    stroke-linecap="${instance.strokeConfig.lineCap}" 
                    stroke-linejoin="${instance.strokeConfig.lineJoin}"/>`
            ).join('')}
        </svg>`;
        
        return svg;
    }

    function exportToJSON(instance) {
        const { state, options } = instance;
        
        return {
            version: '1.0',
            timestamp: Date.now(),
            signature: {
                points: state.points,
                paths: state.history.map(h => h.points),
                duration: state.startTime ? Date.now() - state.startTime : 0
            },
            metadata: {
                device: navigator.userAgent,
                screen: {
                    width: window.screen.width,
                    height: window.screen.height
                },
                canvas: {
                    width: instance.canvas.width,
                    height: instance.canvas.height
                }
            },
            options: {
                stroke: instance.currentStroke,
                color: instance.currentColor,
                style: options.style
            }
        };
    }

    function validateSignature(instance) {
        const { state, options } = instance;
        const validation = options.features?.validation;
        
        if (!validation) return true;
        
        let isValid = true;
        const errors = [];
        
        // Nombre minimum de points
        if (validation.minPoints && state.points.length < validation.minPoints) {
            isValid = false;
            errors.push(CONFIG.messages.tooShort);
        }
        
        // Longueur minimum du trait
        if (validation.minLength) {
            const totalLength = calculatePathLength(state.points);
            if (totalLength < validation.minLength) {
                isValid = false;
                errors.push(CONFIG.messages.incomplete);
            }
        }
        
        // Temps minimum
        if (validation.minTime && state.startTime) {
            const duration = Date.now() - state.startTime;
            if (duration < validation.minTime) {
                isValid = false;
                errors.push(CONFIG.messages.tooFast);
            }
        }
        
        // Mettre à jour l'état
        if (isValid) {
            instance.elements.container.classList.add(CONFIG.states.signed);
            instance.elements.container.classList.remove(CONFIG.states.invalid);
        } else {
            instance.elements.container.classList.add(CONFIG.states.invalid);
            instance.elements.container.classList.remove(CONFIG.states.signed);
        }
        
        // Callback
        if (options.onValidate) {
            options.onValidate(isValid, errors, instance);
        }
        
        return isValid;
    }

    // ========================================
    // MÉTHODES PRIVÉES - UTILITAIRES
    // ========================================
    function attachEvents(instance) {
        const { canvas, elements, options } = instance;
        
        // Événements de dessin
        if (deviceSupport.touch) {
            canvas.addEventListener('touchstart', e => startDrawing(instance, e), { passive: false });
            canvas.addEventListener('touchmove', e => draw(instance, e), { passive: false });
            canvas.addEventListener('touchend', e => stopDrawing(instance, e), { passive: false });
            canvas.addEventListener('touchcancel', e => stopDrawing(instance, e), { passive: false });
        }
        
        canvas.addEventListener('mousedown', e => startDrawing(instance, e));
        canvas.addEventListener('mousemove', e => draw(instance, e));
        canvas.addEventListener('mouseup', e => stopDrawing(instance, e));
        canvas.addEventListener('mouseout', e => {
            if (instance.state.isDrawing) stopDrawing(instance, e);
        });
        
        // Support du stylet
        if (window.PointerEvent) {
            canvas.addEventListener('pointerdown', e => {
                if (e.pointerType === 'pen') {
                    deviceSupport.pressure = true;
                    startDrawing(instance, e);
                }
            });
        }
        
        // Événements toolbar
        if (elements.toolbar) {
            elements.toolbar.addEventListener('click', e => {
                const button = e.target.closest('[data-action]');
                if (button) {
                    handleToolbarAction(instance, button.dataset.action);
                }
            });
        }
        
        // Sélecteur de couleur
        if (elements.colorPicker) {
            elements.colorPicker.addEventListener('click', e => {
                const colorOption = e.target.closest('[data-color]');
                if (colorOption) {
                    instance.currentColor = colorOption.dataset.color;
                    applyStrokeStyle(instance, instance.currentStroke);
                }
            });
        }
        
        // Redimensionnement
        window.addEventListener('resize', () => resizeCanvas(instance));
        window.addEventListener('orientationchange', () => {
            setTimeout(() => resizeCanvas(instance), 100);
        });
        
        // Accessibilité clavier
        if (options.features?.accessibility?.keyboardSupport) {
            attachKeyboardEvents(instance);
        }
    }

    function attachKeyboardEvents(instance) {
        const { canvas } = instance;
        
        canvas.tabIndex = 0;
        
        canvas.addEventListener('keydown', e => {
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    clearCanvas(instance);
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            redo(instance);
                        } else {
                            undo(instance);
                        }
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        saveSignature(instance);
                    }
                    break;
            }
        });
    }

    function handleToolbarAction(instance, action) {
        switch (action) {
            case 'clear':
                clearCanvas(instance);
                break;
            case 'undo':
                undo(instance);
                break;
            case 'redo':
                redo(instance);
                break;
            case 'save':
                saveSignature(instance);
                break;
        }
    }

    function hidePlaceholder(instance) {
        const placeholder = instance.elements.wrapper.querySelector(`.${CONFIG.classes.placeholder}`);
        if (placeholder) {
            placeholder.style.opacity = '0';
            setTimeout(() => {
                placeholder.style.display = 'none';
            }, 200);
        }
    }

    function showPlaceholder(instance) {
        const placeholder = instance.elements.wrapper.querySelector(`.${CONFIG.classes.placeholder}`);
        if (placeholder) {
            placeholder.style.display = 'block';
            setTimeout(() => {
                placeholder.style.opacity = '1';
            }, 10);
        }
    }

    function updateStatus(instance) {
        if (!instance.elements.status) return;
        
        const { state } = instance;
        const pointsSpan = instance.elements.status.querySelector(`.${CONFIG.classes.status}-points`);
        const timeSpan = instance.elements.status.querySelector(`.${CONFIG.classes.status}-time`);
        
        if (pointsSpan) {
            pointsSpan.textContent = `Points: ${state.points.length}`;
        }
        
        if (timeSpan && state.startTime) {
            const duration = Math.round((Date.now() - state.startTime) / 1000);
            timeSpan.textContent = `Temps: ${duration}s`;
        }
    }

    function calculateVelocity(from, to) {
        if (!from || !to) return 0;
        
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dt = to.time - from.time || 1;
        
        return Math.sqrt(dx * dx + dy * dy) / dt;
    }

    function calculatePathLength(points) {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    function pointsToSVGPath(points) {
        if (points.length < 2) return '';
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const cp = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            };
            path += ` Q ${p1.x} ${p1.y} ${cp.x} ${cp.y}`;
        }
        
        return path;
    }

    function trimCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        
        let top = null, bottom = null, left = null, right = null;
        
        // Trouver les limites
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const alpha = data[(y * canvas.width + x) * 4 + 3];
                if (alpha > 0) {
                    if (top === null) top = y;
                    bottom = y;
                    if (left === null || x < left) left = x;
                    if (right === null || x > right) right = x;
                }
            }
        }
        
        if (top === null) return canvas; // Canvas vide
        
        // Créer un nouveau canvas avec les dimensions trimées
        const trimmed = document.createElement('canvas');
        const padding = 10;
        trimmed.width = right - left + 1 + padding * 2;
        trimmed.height = bottom - top + 1 + padding * 2;
        
        const trimmedCtx = trimmed.getContext('2d');
        trimmedCtx.drawImage(
            canvas,
            left - padding,
            top - padding,
            trimmed.width,
            trimmed.height,
            0,
            0,
            trimmed.width,
            trimmed.height
        );
        
        return trimmed;
    }

    function getIcon(name) {
        const icons = {
            'trash-2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
            'undo': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path></svg>',
            'redo': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path></svg>',
            'save': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>'
        };
        return icons[name] || '';
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (stylesInjected) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/signature-pad.css';
        document.head.appendChild(link);
        
        stylesInjected = true;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            // Injection des styles
            if (!stylesInjected) {
                injectStyles();
            }

            // Options par défaut
            const defaultOptions = {
                style: 'glassmorphism',
                size: 'medium',
                stroke: 'pen',
                color: CONFIG.colors.black,
                animation: 'smooth',
                features: {
                    tools: {
                        clear: true,
                        undo: true,
                        redo: false,
                        save: false
                    },
                    guides: {
                        enabled: false
                    },
                    validation: null,
                    effects: {
                        smoothing: true
                    }
                }
            };

            // Fusion des options
            options = Object.assign({}, defaultOptions, options);

            // Créer l'instance
            const instance = {
                id: generateId(),
                options,
                elements: {},
                canvas: null,
                ctx: null,
                state: null,
                currentColor: options.color,
                currentStroke: options.stroke
            };

            // Créer les éléments
            instance.elements.container = createContainer(options);
            
            // Canvas
            const { wrapper, canvas } = createCanvas(options);
            instance.elements.wrapper = wrapper;
            instance.canvas = canvas;
            instance.elements.container.appendChild(wrapper);

            // Toolbar
            if (options.features?.tools) {
                instance.elements.toolbar = createToolbar(options);
                if (instance.elements.toolbar) {
                    instance.elements.container.appendChild(instance.elements.toolbar);
                }
            }

            // Status bar
            if (options.features?.statusBar) {
                instance.elements.status = createStatusBar(options);
                if (instance.elements.status) {
                    instance.elements.container.appendChild(instance.elements.status);
                }
            }

            // Initialiser le canvas
            initializeCanvas(instance);

            // Attacher les événements
            attachEvents(instance);

            // Stocker l'instance
            instances.set(instance.id, instance);

            // API de l'instance
            instance.clear = () => clearCanvas(instance);
            instance.undo = () => undo(instance);
            instance.redo = () => redo(instance);
            instance.save = (format) => saveSignature(instance, format);
            instance.isEmpty = () => instance.state.isEmpty;
            instance.isValid = () => validateSignature(instance);
            
            instance.toDataURL = (type = 'image/png', quality = 0.92) => {
                return exportToImage(instance, type.replace('image/', ''), quality);
            };
            
            instance.toSVG = () => exportToSVG(instance);
            instance.toJSON = () => exportToJSON(instance);
            
            instance.fromDataURL = (dataURL) => {
                const img = new Image();
                img.onload = () => {
                    clearCanvas(instance);
                    instance.ctx.drawImage(img, 0, 0);
                    instance.state.isEmpty = false;
                    instance.elements.container.classList.remove(CONFIG.states.empty);
                    hidePlaceholder(instance);
                };
                img.src = dataURL;
            };
            
            instance.setColor = (color) => {
                instance.currentColor = color;
                applyStrokeStyle(instance, instance.currentStroke);
            };
            
            instance.setStroke = (strokeType) => {
                applyStrokeStyle(instance, strokeType);
            };
            
            instance.enable = () => {
                instance.elements.container.classList.remove(CONFIG.states.disabled);
                instance.canvas.style.pointerEvents = 'auto';
            };
            
            instance.disable = () => {
                instance.elements.container.classList.add(CONFIG.states.disabled);
                instance.canvas.style.pointerEvents = 'none';
            };
            
            instance.destroy = () => {
                instances.delete(instance.id);
                window.removeEventListener('resize', () => resizeCanvas(instance));
                window.removeEventListener('orientationchange', () => resizeCanvas(instance));
                instance.elements.container.remove();
            };

            // Retourner l'élément et l'instance
            return {
                element: instance.elements.container,
                instance
            };
        },

        // Configuration exposée
        CONFIG,
        
        // Méthode pour obtenir une instance
        getInstance(id) {
            return instances.get(id);
        },
        
        // Méthode pour obtenir toutes les instances
        getAllInstances() {
            return Array.from(instances.values());
        },
        
        // Support des fonctionnalités
        getDeviceSupport() {
            return { ...deviceSupport };
        },
        
        // Injection manuelle des styles si nécessaire
        injectStyles
    };
})();

// Export pour utilisation
export default SignaturePad;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion de la pression du stylet
   Solution: Détection du PointerEvent et fallback sur simulation
   
   [2024-12-XX] - Performance sur mobile avec haute résolution
   Cause: Canvas trop grand avec devicePixelRatio
   Résolution: Option de scale configurable
   
   [2024-12-XX] - Smoothing des courbes
   Solution: Utilisation de courbes de Bézier quadratiques
   
   NOTES POUR REPRISES FUTURES:
   - Le support de la pression nécessite PointerEvent
   - Les animations riches peuvent impacter les performances
   - Le trimCanvas est coûteux pour de grandes signatures
   - L'historique peut consommer beaucoup de mémoire
   ======================================== */