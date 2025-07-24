// src/js/components/signature-canvas.js

export class SignatureCanvas {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas avec l'ID ${canvasId} non trouvé`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.hasDrawn = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Options
        this.options = {
            strokeColor: '#000',
            strokeWidth: 3,
            backgroundColor: '#fff',
            onStart: null,
            onChange: null,
            onEnd: null,
            ...options
        };
        
        this.init();
    }

    init() {
        // Configuration du contexte
        this.ctx.strokeStyle = this.options.strokeColor;
        this.ctx.lineWidth = this.options.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Ajuster la taille du canvas
        this.resizeCanvas();
        
        // Événements
        this.attachEvents();
        
        // Redimensionnement automatique
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        
        // Sauvegarder le contenu actuel
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Redimensionner
        this.canvas.width = rect.width * scale;
        this.canvas.height = rect.height * scale;
        
        // Appliquer le scale pour la netteté
        this.ctx.scale(scale, scale);
        
        // Restaurer les paramètres
        this.ctx.strokeStyle = this.options.strokeColor;
        this.ctx.lineWidth = this.options.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Restaurer le contenu si possible
        if (this.hasDrawn && imageData.width > 0) {
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    attachEvents() {
        // Événements tactiles
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });
        
        // Événements souris
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
        this.canvas.addEventListener('mouseout', this.handleEnd.bind(this));
        
        // Empêcher le scroll sur mobile lors du dessin
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDrawing) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    getCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: (clientX - rect.left),
            y: (clientY - rect.top)
        };
    }

    handleStart(e) {
        e.preventDefault();
        
        this.isDrawing = true;
        const coords = this.getCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
        
        if (!this.hasDrawn) {
            this.hasDrawn = true;
            if (this.options.onStart) {
                this.options.onStart();
            }
        }
    }

    handleMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        const coords = this.getCoordinates(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();
        
        this.lastX = coords.x;
        this.lastY = coords.y;
        
        if (this.options.onChange) {
            this.options.onChange();
        }
    }

    handleEnd(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        this.isDrawing = false;
        
        if (this.options.onEnd) {
            this.options.onEnd();
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasDrawn = false;
        
        if (this.options.onChange) {
            this.options.onChange();
        }
    }

    isEmpty() {
        return !this.hasDrawn;
    }

    toDataURL(type = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(type, quality);
    }

    toBlob(callback, type = 'image/png', quality = 1.0) {
        this.canvas.toBlob(callback, type, quality);
    }

    setStrokeColor(color) {
        this.options.strokeColor = color;
        this.ctx.strokeStyle = color;
    }

    setStrokeWidth(width) {
        this.options.strokeWidth = width;
        this.ctx.lineWidth = width;
    }

    destroy() {
        // Nettoyer les événements
        window.removeEventListener('resize', this.resizeCanvas);
        window.removeEventListener('orientationchange', this.resizeCanvas);
    }
}

// Fonction helper pour créer rapidement un canvas de signature
export function createSignatureCanvas(canvasId, options = {}) {
    return new SignatureCanvas(canvasId, options);
}