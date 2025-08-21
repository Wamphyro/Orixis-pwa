// Composant de signature réutilisable
export class SignaturePad {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas avec l'id ${canvasId} introuvable`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.hasDrawn = false;
        
        // Options par défaut
        this.options = {
            strokeStyle: '#000',
            lineWidth: 3,
            lineCap: 'round',
            lineJoin: 'round',
            backgroundColor: 'white',
            onStart: null,
            onEnd: null,
            onChange: null,
            placeholder: 'Signez ici',
            ...options
        };
        
        this.lastX = 0;
        this.lastY = 0;
        
        this.init();
    }
    
    init() {
        // Configuration du canvas
        this.resizeCanvas();
        this.setupContext();
        this.addEventListeners();
        this.createPlaceholder();
        
        // Écouter les changements de taille
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => this.resizeCanvas());
    }
    
    setupContext() {
        this.ctx.strokeStyle = this.options.strokeStyle;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.lineCap = this.options.lineCap;
        this.ctx.lineJoin = this.options.lineJoin;
    }
    
    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        if (!wrapper) return;
        
        const rect = wrapper.getBoundingClientRect();
        
        // Adapter la hauteur selon l'orientation
        let canvasHeight = 300;
        if (window.innerWidth > window.innerHeight) {
            // Mode paysage
            canvasHeight = Math.min(rect.height - 20, window.innerHeight * 0.4);
        }
        
        // Sauvegarder le contenu actuel
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Redimensionner
        this.canvas.width = rect.width * 2;
        this.canvas.height = canvasHeight * 2;
        this.canvas.style.width = '100%';
        this.canvas.style.height = canvasHeight + 'px';
        
        // Réinitialiser le contexte
        this.ctx.scale(2, 2);
        this.setupContext();
        
        // Restaurer le contenu si possible
        if (this.hasDrawn) {
            this.ctx.putImageData(imageData, 0, 0);
        }
    }
    
    createPlaceholder() {
        // Créer l'élément placeholder s'il n'existe pas
        let placeholder = this.canvas.parentElement.querySelector('.signature-placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'signature-placeholder';
            placeholder.textContent = this.options.placeholder;
            placeholder.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ccc;
                font-size: 24px;
                pointer-events: none;
                font-style: italic;
            `;
            this.canvas.parentElement.style.position = 'relative';
            this.canvas.parentElement.appendChild(placeholder);
        }
        this.placeholder = placeholder;
    }
    
    getCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return {
            x: (touch.clientX - rect.left) * (this.canvas.width / rect.width / 2),
            y: (touch.clientY - rect.top) * (this.canvas.height / rect.height / 2)
        };
    }
    
    startDrawing(e) {
        e.preventDefault();
        this.isDrawing = true;
        const coords = this.getCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
        
        if (!this.hasDrawn) {
            this.hasDrawn = true;
            if (this.placeholder) {
                this.placeholder.style.display = 'none';
            }
            if (this.options.onStart) {
                this.options.onStart();
            }
        }
    }
    
    draw(e) {
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
    
    stopDrawing(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        this.isDrawing = false;
        
        if (this.options.onEnd) {
            this.options.onEnd();
        }
    }
    
    addEventListeners() {
        // Événements tactiles
        this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.stopDrawing(e), { passive: false });
        
        // Événements souris
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('mouseout', (e) => this.stopDrawing(e));
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasDrawn = false;
        if (this.placeholder) {
            this.placeholder.style.display = 'block';
        }
    }
    
    isEmpty() {
        return !this.hasDrawn;
    }
    
    toDataURL(type = 'image/png') {
        return this.canvas.toDataURL(type);
    }
    
    fromDataURL(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.clear();
            this.ctx.drawImage(img, 0, 0);
            this.hasDrawn = true;
            if (this.placeholder) {
                this.placeholder.style.display = 'none';
            }
        };
        img.src = dataURL;
    }
    
    destroy() {
        // Retirer les event listeners
        window.removeEventListener('resize', () => this.resizeCanvas());
        window.removeEventListener('orientationchange', () => this.resizeCanvas());
    }
}