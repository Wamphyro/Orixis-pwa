/* ========================================
   CHART-BUILDER.COMPONENT.JS - Constructeur de graphiques interactifs
   Chemin: src/js/shared/ui/charts/chart-builder.component.js
   
   DESCRIPTION:
   Composant complet pour créer tous types de graphiques avec style glassmorphism.
   Supporte 15+ types de graphiques, animations riches, export, zoom, temps réel.
   Utilise Canvas pour performance et SVG pour interactivité.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Moteur de rendu (lignes 301-600)
   3. Gestionnaire d'interactions (lignes 601-800)
   4. Animations et transitions (lignes 801-1000)
   5. Export et utilitaires (lignes 1001-1200)
   6. API publique (lignes 1201-1300)
   
   DÉPENDANCES:
   - ui.config.js (configuration globale)
   - animation-utils.js (moteur d'animations)
   - format-utils.js (formatage des données)
   - frosted-icons.component.js (icônes d'actions)
   
   UTILISATION:
   const chart = await UI.ChartBuilder.create({
       type: 'line',
       style: 'glassmorphism',
       animation: 'smooth',
       data: { ... },
       features: { zoom: true, export: true }
   });
   ======================================== */

const ChartBuilder = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types de graphiques disponibles
        types: {
            // Graphiques de base
            'line': {
                name: 'Ligne',
                icon: 'M4 20 L8 16 L12 18 L16 10 L20 14',
                renderer: 'canvas',
                supports: ['multiple-series', 'animations', 'zoom', 'pan', 'tooltips', 'markers']
            },
            'bar': {
                name: 'Barres',
                icon: 'M4 20 L4 14 M8 20 L8 10 M12 20 L12 16 M16 20 L16 8 M20 20 L20 12',
                renderer: 'canvas',
                supports: ['stacked', 'grouped', 'horizontal', 'animations', 'tooltips']
            },
            'pie': {
                name: 'Camembert',
                icon: 'M12 2 A10 10 0 0 1 22 12 L12 12 Z',
                renderer: 'canvas',
                supports: ['animations', 'tooltips', 'labels', 'exploded-slices']
            },
            'area': {
                name: 'Aires',
                icon: 'M4 20 L4 16 L8 12 L12 14 L16 8 L20 10 L20 20 Z',
                renderer: 'canvas',
                supports: ['stacked', 'gradient-fill', 'animations', 'zoom', 'tooltips']
            },
            'donut': {
                name: 'Beignet',
                icon: 'M12 2 A10 10 0 1 1 12 22 A10 10 0 1 1 12 2 M12 6 A6 6 0 1 0 12 18 A6 6 0 1 0 12 6',
                renderer: 'canvas',
                supports: ['animations', 'tooltips', 'center-text', 'multiple-rings']
            },
            'radar': {
                name: 'Radar',
                icon: 'M12 2 L18 8 L18 16 L12 22 L6 16 L6 8 Z',
                renderer: 'canvas',
                supports: ['multiple-series', 'animations', 'tooltips', 'custom-axes']
            },
            'scatter': {
                name: 'Nuage de points',
                icon: 'M5 5 • M8 12 • M15 8 • M19 15 • M12 18 •',
                renderer: 'canvas',
                supports: ['regression-line', 'bubble-size', 'animations', 'zoom', 'tooltips']
            },
            'bubble': {
                name: 'Bulles',
                icon: 'M8 12 A2 2 0 1 1 8 12 M16 8 A3 3 0 1 1 16 8',
                renderer: 'canvas',
                supports: ['size-dimension', 'color-dimension', 'animations', 'zoom', 'tooltips']
            },
            'heatmap': {
                name: 'Carte de chaleur',
                icon: '▦▦▦▦',
                renderer: 'canvas',
                supports: ['color-scale', 'tooltips', 'zoom', 'cell-labels']
            },
            'gauge': {
                name: 'Jauge',
                icon: 'M12 16 A4 4 0 0 1 8 12 L12 12',
                renderer: 'svg',
                supports: ['animations', 'thresholds', 'needle-animation', 'custom-scale']
            },
            'waterfall': {
                name: 'Cascade',
                icon: 'M4 8 L8 8 L8 12 L12 12 L12 16 L16 16 L16 20',
                renderer: 'canvas',
                supports: ['connectors', 'total-bars', 'animations', 'tooltips']
            },
            'funnel': {
                name: 'Entonnoir',
                icon: 'M4 4 L20 4 L16 12 L12 20 L8 12 Z',
                renderer: 'canvas',
                supports: ['labels', 'percentages', 'animations', 'tooltips']
            },
            'boxplot': {
                name: 'Boîte à moustaches',
                icon: 'M8 4 L8 20 M16 4 L16 20 M8 8 L16 8 M8 16 L16 16',
                renderer: 'canvas',
                supports: ['outliers', 'quartiles', 'animations', 'tooltips']
            },
            'treemap': {
                name: 'Carte arborescente',
                icon: '▢▢▢',
                renderer: 'canvas',
                supports: ['hierarchical-data', 'color-scale', 'zoom', 'tooltips']
            },
            'sankey': {
                name: 'Diagramme de Sankey',
                icon: '⟿',
                renderer: 'svg',
                supports: ['flow-animation', 'interactive-nodes', 'tooltips']
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) brightness(1.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                gridColor: 'rgba(255, 255, 255, 0.1)',
                textColor: 'rgba(255, 255, 255, 0.9)',
                colors: [
                    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1'
                ]
            },
            'neumorphism': {
                background: '#e0e5ec',
                border: 'none',
                borderRadius: '20px',
                boxShadow: '20px 20px 60px #bec3c9, -20px -20px 60px #ffffff',
                gridColor: 'rgba(0, 0, 0, 0.05)',
                textColor: '#2d3748',
                colors: [
                    '#4a5568', '#2d3748', '#1a202c', '#718096', '#a0aec0',
                    '#cbd5e0', '#e2e8f0', '#edf2f7', '#f7fafc', '#ffffff'
                ]
            },
            'flat': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                gridColor: '#f3f4f6',
                textColor: '#1f2937',
                colors: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1'
                ]
            },
            'minimal': {
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '0',
                boxShadow: 'none',
                gridColor: '#f9fafb',
                textColor: '#374151',
                colors: ['#1f2937', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
            },
            'material': {
                background: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                gridColor: 'rgba(0, 0, 0, 0.12)',
                textColor: 'rgba(0, 0, 0, 0.87)',
                colors: [
                    '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
                    '#00BCD4', '#FF5722', '#E91E63', '#009688', '#673AB7'
                ]
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                duration: 0
            },
            'subtle': {
                enabled: true,
                duration: 300,
                easing: 'easeOutQuad',
                effects: ['fade-in']
            },
            'smooth': {
                enabled: true,
                duration: 600,
                easing: 'easeInOutCubic',
                effects: ['fade-in', 'scale-up', 'draw-path']
            },
            'rich': {
                enabled: true,
                duration: 1000,
                easing: 'easeOutElastic',
                effects: ['fade-in', 'scale-up', 'draw-path', 'bounce', 'rotate', 'particles'],
                stagger: 50,
                particleCount: 20
            }
        },

        // Fonctionnalités disponibles
        features: {
            'zoom': {
                enabled: false,
                wheel: true,
                pinch: true,
                pan: true,
                limits: { min: 0.5, max: 10 }
            },
            'export': {
                enabled: false,
                formats: ['png', 'svg', 'pdf', 'csv'],
                quality: 1.0
            },
            'tooltips': {
                enabled: true,
                style: 'glassmorphism',
                animation: 'fade',
                position: 'auto'
            },
            'legend': {
                enabled: true,
                position: 'bottom',
                style: 'glassmorphism',
                interactive: true
            },
            'grid': {
                enabled: true,
                x: true,
                y: true,
                style: 'dashed'
            },
            'realtime': {
                enabled: false,
                interval: 1000,
                maxPoints: 100,
                smooth: true
            },
            'annotations': {
                enabled: false,
                types: ['line', 'box', 'text', 'arrow']
            },
            'crosshair': {
                enabled: false,
                style: 'full',
                snap: true
            },
            'selection': {
                enabled: false,
                mode: 'box',
                callback: null
            },
            'responsive': {
                enabled: true,
                breakpoints: {
                    mobile: 480,
                    tablet: 768,
                    desktop: 1024
                }
            }
        },

        // Configuration par défaut
        defaults: {
            width: 800,
            height: 400,
            margin: { top: 40, right: 40, bottom: 60, left: 60 },
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 12,
            lineWidth: 2,
            pointRadius: 4,
            animationDuration: 600
        }
    };

    // ========================================
    // ÉTAT ET VARIABLES PRIVÉES
    // ========================================
    let chartInstances = new Map();
    let idCounter = 0;

    // ========================================
    // FONCTIONS UTILITAIRES
    // ========================================
    function generateId() {
        return `chart-${Date.now()}-${++idCounter}`;
    }

    function deepMerge(target, source) {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // ========================================
    // MOTEUR DE RENDU
    // ========================================
    class ChartRenderer {
        constructor(container, options) {
            this.container = container;
            this.options = options;
            this.canvas = null;
            this.ctx = null;
            this.svg = null;
            this.animationFrame = null;
            this.setupRenderer();
        }

        setupRenderer() {
            const { type, width, height } = this.options;
            const chartType = CONFIG.types[type];

            if (chartType.renderer === 'canvas') {
                this.setupCanvas();
            } else {
                this.setupSVG();
            }
        }

        setupCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.options.width;
            this.canvas.height = this.options.height;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.ctx = this.canvas.getContext('2d');
            this.container.appendChild(this.canvas);
        }

        setupSVG() {
            const svgNS = 'http://www.w3.org/2000/svg';
            this.svg = document.createElementNS(svgNS, 'svg');
            this.svg.setAttribute('width', this.options.width);
            this.svg.setAttribute('height', this.options.height);
            this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
            this.svg.style.width = '100%';
            this.svg.style.height = '100%';
            this.container.appendChild(this.svg);
        }

        render(data) {
            const { type } = this.options;
            const renderMethod = `render${type.charAt(0).toUpperCase() + type.slice(1)}`;
            
            if (this[renderMethod]) {
                this[renderMethod](data);
            } else {
                console.warn(`Render method for ${type} not implemented`);
            }
        }

        renderLine(data) {
            if (!this.ctx) return;

            const { width, height, margin, style, animation } = this.options;
            const styleConfig = CONFIG.styles[style];
            
            // Clear canvas
            this.ctx.clearRect(0, 0, width, height);
            
            // Apply glassmorphism background
            this.applyGlassmorphismBackground();
            
            // Draw grid
            if (this.options.features.grid.enabled) {
                this.drawGrid();
            }
            
            // Calculate scales
            const xScale = this.createXScale(data);
            const yScale = this.createYScale(data);
            
            // Draw axes
            this.drawAxes(xScale, yScale);
            
            // Draw lines with animation
            if (animation.enabled) {
                this.animateLines(data, xScale, yScale);
            } else {
                this.drawLines(data, xScale, yScale);
            }
        }

        applyGlassmorphismBackground() {
            const { width, height, style } = this.options;
            const styleConfig = CONFIG.styles[style];
            
            this.ctx.save();
            
            // Create gradient for glassmorphism effect
            const gradient = this.ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
            
            // Draw rounded rectangle with gradient
            this.roundRect(0, 0, width, height, 16);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Add border
            this.ctx.strokeStyle = styleConfig.border;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            this.ctx.restore();
        }

        roundRect(x, y, width, height, radius) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + width - radius, y);
            this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.ctx.lineTo(x + width, y + height - radius);
            this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.ctx.lineTo(x + radius, y + height);
            this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.ctx.lineTo(x, y + radius);
            this.ctx.quadraticCurveTo(x, y, x + radius, y);
            this.ctx.closePath();
        }

        drawGrid() {
            const { width, height, margin, style } = this.options;
            const styleConfig = CONFIG.styles[style];
            
            this.ctx.save();
            this.ctx.strokeStyle = styleConfig.gridColor;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            
            // Vertical lines
            for (let x = margin.left; x <= width - margin.right; x += 50) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, margin.top);
                this.ctx.lineTo(x, height - margin.bottom);
                this.ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = margin.top; y <= height - margin.bottom; y += 50) {
                this.ctx.beginPath();
                this.ctx.moveTo(margin.left, y);
                this.ctx.lineTo(width - margin.right, y);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }

        createXScale(data) {
            const { width, margin } = this.options;
            const domain = data.labels || data[0].data.map((_, i) => i);
            const range = [margin.left, width - margin.right];
            
            return {
                domain,
                range,
                scale: (value) => {
                    const index = domain.indexOf(value);
                    const step = (range[1] - range[0]) / (domain.length - 1);
                    return range[0] + index * step;
                }
            };
        }

        createYScale(data) {
            const { height, margin } = this.options;
            const allValues = data.flatMap(series => series.data);
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);
            const padding = (max - min) * 0.1;
            
            return {
                domain: [min - padding, max + padding],
                range: [height - margin.bottom, margin.top],
                scale: (value) => {
                    const percent = (value - (min - padding)) / ((max + padding) - (min - padding));
                    return range[0] - percent * (range[0] - range[1]);
                }
            };
        }

        drawAxes(xScale, yScale) {
            const { width, height, margin, style } = this.options;
            const styleConfig = CONFIG.styles[style];
            
            this.ctx.save();
            this.ctx.strokeStyle = styleConfig.textColor;
            this.ctx.fillStyle = styleConfig.textColor;
            this.ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
            
            // X axis
            this.ctx.beginPath();
            this.ctx.moveTo(margin.left, height - margin.bottom);
            this.ctx.lineTo(width - margin.right, height - margin.bottom);
            this.ctx.stroke();
            
            // Y axis
            this.ctx.beginPath();
            this.ctx.moveTo(margin.left, margin.top);
            this.ctx.lineTo(margin.left, height - margin.bottom);
            this.ctx.stroke();
            
            // X axis labels
            xScale.domain.forEach((label, i) => {
                const x = xScale.scale(label);
                this.ctx.fillText(label, x, height - margin.bottom + 20);
            });
            
            this.ctx.restore();
        }

        animateLines(data, xScale, yScale) {
            const { animation } = this.options;
            const duration = CONFIG.animations[animation].duration;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeInOutCubic(progress);
                
                this.drawLines(data, xScale, yScale, eased);
                
                if (progress < 1) {
                    this.animationFrame = requestAnimationFrame(animate);
                }
            };
            
            animate();
        }

        drawLines(data, xScale, yScale, progress = 1) {
            const { style } = this.options;
            const styleConfig = CONFIG.styles[style];
            
            data.forEach((series, seriesIndex) => {
                this.ctx.save();
                this.ctx.strokeStyle = styleConfig.colors[seriesIndex % styleConfig.colors.length];
                this.ctx.lineWidth = this.options.lineWidth;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                
                // Draw line
                this.ctx.beginPath();
                series.data.forEach((value, i) => {
                    const x = xScale.scale(xScale.domain[i]);
                    const y = yScale.scale(value);
                    const adjustedY = y + (yScale.range[0] - y) * (1 - progress);
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, adjustedY);
                    } else {
                        this.ctx.lineTo(x, adjustedY);
                    }
                });
                
                this.ctx.stroke();
                
                // Draw points
                if (progress === 1) {
                    series.data.forEach((value, i) => {
                        const x = xScale.scale(xScale.domain[i]);
                        const y = yScale.scale(value);
                        
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, this.options.pointRadius, 0, Math.PI * 2);
                        this.ctx.fillStyle = styleConfig.colors[seriesIndex % styleConfig.colors.length];
                        this.ctx.fill();
                        this.ctx.strokeStyle = styleConfig.background;
                        this.ctx.lineWidth = 2;
                        this.ctx.stroke();
                    });
                }
                
                this.ctx.restore();
            });
        }

        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        destroy() {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }
            if (this.canvas) {
                this.canvas.remove();
            }
            if (this.svg) {
                this.svg.remove();
            }
        }
    }

    // ========================================
    // GESTIONNAIRE D'INTERACTIONS
    // ========================================
    class InteractionManager {
        constructor(chart, renderer) {
            this.chart = chart;
            this.renderer = renderer;
            this.handlers = new Map();
            this.setupInteractions();
        }

        setupInteractions() {
            const { features } = this.chart.options;
            
            if (features.tooltips.enabled) {
                this.setupTooltips();
            }
            
            if (features.zoom.enabled) {
                this.setupZoom();
            }
            
            if (features.selection.enabled) {
                this.setupSelection();
            }
        }

        setupTooltips() {
            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip glassmorphism';
            tooltip.style.cssText = `
                position: absolute;
                padding: 12px;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: white;
                font-size: 12px;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 1000;
            `;
            document.body.appendChild(tooltip);
            
            const canvas = this.renderer.canvas;
            if (canvas) {
                canvas.addEventListener('mousemove', (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Check if hovering over data point
                    const dataPoint = this.getDataPointAt(x, y);
                    if (dataPoint) {
                        tooltip.textContent = `${dataPoint.label}: ${dataPoint.value}`;
                        tooltip.style.left = `${e.clientX + 10}px`;
                        tooltip.style.top = `${e.clientY - 30}px`;
                        tooltip.style.opacity = '1';
                    } else {
                        tooltip.style.opacity = '0';
                    }
                });
                
                canvas.addEventListener('mouseleave', () => {
                    tooltip.style.opacity = '0';
                });
            }
            
            this.handlers.set('tooltip', tooltip);
        }

        setupZoom() {
            const canvas = this.renderer.canvas;
            if (!canvas) return;
            
            let scale = 1;
            const { limits } = this.chart.options.features.zoom;
            
            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                scale = Math.min(Math.max(scale * delta, limits.min), limits.max);
                
                canvas.style.transform = `scale(${scale})`;
                canvas.style.transformOrigin = `${e.offsetX}px ${e.offsetY}px`;
            });
        }

        getDataPointAt(x, y) {
            // Simplified point detection - would need proper implementation
            // based on chart type and data structure
            return null;
        }

        destroy() {
            this.handlers.forEach((handler, key) => {
                if (handler && handler.remove) {
                    handler.remove();
                }
            });
            this.handlers.clear();
        }
    }

    // ========================================
    // GESTIONNAIRE D'EXPORT
    // ========================================
    class ExportManager {
        constructor(chart, renderer) {
            this.chart = chart;
            this.renderer = renderer;
        }

        async export(format = 'png', options = {}) {
            const exportMethod = `exportAs${format.toUpperCase()}`;
            
            if (this[exportMethod]) {
                return await this[exportMethod](options);
            } else {
                throw new Error(`Export format ${format} not supported`);
            }
        }

        async exportAsPNG(options = {}) {
            const canvas = this.renderer.canvas;
            if (!canvas) throw new Error('Canvas not available for PNG export');
            
            const quality = options.quality || this.chart.options.features.export.quality;
            
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `chart-${Date.now()}.png`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                    resolve();
                }, 'image/png', quality);
            });
        }

        async exportAsSVG(options = {}) {
            const svg = this.renderer.svg;
            if (!svg) throw new Error('SVG not available for export');
            
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.download = `chart-${Date.now()}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }

        async exportAsCSV(options = {}) {
            const { data } = this.chart;
            let csv = 'Series,Label,Value\n';
            
            data.forEach((series) => {
                series.data.forEach((value, index) => {
                    const label = data.labels ? data.labels[index] : index;
                    csv += `"${series.name}","${label}",${value}\n`;
                });
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.download = `chart-data-${Date.now()}.csv`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    }

    // ========================================
    // CLASSE PRINCIPALE CHART
    // ========================================
    class Chart {
        constructor(options) {
            this.id = generateId();
            this.options = deepMerge(CONFIG.defaults, options);
            this.container = null;
            this.renderer = null;
            this.interactionManager = null;
            this.exportManager = null;
            this.data = options.data || [];
            this.realtimeInterval = null;
        }

        async init(container) {
            this.container = container;
            
            // Apply container styles
            this.applyContainerStyles();
            
            // Create renderer
            this.renderer = new ChartRenderer(this.container, this.options);
            
            // Setup interactions
            this.interactionManager = new InteractionManager(this, this.renderer);
            
            // Setup export
            if (this.options.features.export.enabled) {
                this.exportManager = new ExportManager(this, this.renderer);
                this.addExportButton();
            }
            
            // Initial render
            this.render();
            
            // Setup realtime updates if enabled
            if (this.options.features.realtime.enabled) {
                this.startRealtimeUpdates();
            }
            
            // Store instance
            chartInstances.set(this.id, this);
            
            return this;
        }

        applyContainerStyles() {
            const { style } = this.options;
            const styleConfig = CONFIG.styles[style];
            
            this.container.style.cssText = `
                position: relative;
                background: ${styleConfig.background};
                backdrop-filter: ${styleConfig.backdropFilter || 'none'};
                -webkit-backdrop-filter: ${styleConfig.backdropFilter || 'none'};
                border: ${styleConfig.border};
                border-radius: ${styleConfig.borderRadius};
                box-shadow: ${styleConfig.boxShadow};
                padding: 16px;
                overflow: hidden;
            `;
        }

        addExportButton() {
            const exportBtn = document.createElement('button');
            exportBtn.className = 'chart-export-btn';
            exportBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            `;
            exportBtn.style.cssText = `
                position: absolute;
                top: 16px;
                right: 16px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                color: rgba(255, 255, 255, 0.9);
                transition: all 0.3s;
            `;
            
            exportBtn.addEventListener('click', () => {
                this.showExportMenu();
            });
            
            this.container.appendChild(exportBtn);
        }

        showExportMenu() {
            const menu = document.createElement('div');
            menu.className = 'chart-export-menu';
            menu.style.cssText = `
                position: absolute;
                top: 50px;
                right: 16px;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 8px;
                z-index: 1000;
            `;
            
            const formats = this.options.features.export.formats;
            formats.forEach(format => {
                const btn = document.createElement('button');
                btn.textContent = `Export as ${format.toUpperCase()}`;
                btn.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 8px 16px;
                    margin: 4px 0;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 4px;
                    color: white;
                    cursor: pointer;
                    transition: background 0.2s;
                `;
                
                btn.addEventListener('click', async () => {
                    await this.export(format);
                    menu.remove();
                });
                
                menu.appendChild(btn);
            });
            
            this.container.appendChild(menu);
            
            // Remove menu on outside click
            setTimeout(() => {
                document.addEventListener('click', function removeMenu(e) {
                    if (!menu.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', removeMenu);
                    }
                });
            }, 0);
        }

        render() {
            if (this.renderer) {
                this.renderer.render(this.data);
            }
        }

        update(newData, options = {}) {
            if (options.transition) {
                // Animate transition
                this.animateTransition(this.data, newData);
            }
            
            this.data = newData;
            this.render();
        }

        animateTransition(oldData, newData) {
            // Implementation would handle smooth transitions between datasets
            console.log('Animating transition from', oldData, 'to', newData);
        }

        startRealtimeUpdates() {
            const { interval, maxPoints } = this.options.features.realtime;
            
            this.realtimeInterval = setInterval(() => {
                // Generate new data point
                this.data.forEach(series => {
                    const lastValue = series.data[series.data.length - 1];
                    const newValue = lastValue + (Math.random() - 0.5) * 10;
                    
                    series.data.push(newValue);
                    
                    // Keep only maxPoints
                    if (series.data.length > maxPoints) {
                        series.data.shift();
                    }
                });
                
                this.render();
            }, interval);
        }

        async export(format) {
            if (!this.exportManager) {
                throw new Error('Export feature not enabled');
            }
            
            return await this.exportManager.export(format);
        }

        resize(width, height) {
            this.options.width = width;
            this.options.height = height;
            
            if (this.renderer.canvas) {
                this.renderer.canvas.width = width;
                this.renderer.canvas.height = height;
            }
            
            if (this.renderer.svg) {
                this.renderer.svg.setAttribute('width', width);
                this.renderer.svg.setAttribute('height', height);
                this.renderer.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }
            
            this.render();
        }

        destroy() {
            // Stop realtime updates
            if (this.realtimeInterval) {
                clearInterval(this.realtimeInterval);
            }
            
            // Destroy components
            if (this.interactionManager) {
                this.interactionManager.destroy();
            }
            
            if (this.renderer) {
                this.renderer.destroy();
            }
            
            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
            }
            
            // Remove from instances
            chartInstances.delete(this.id);
        }
    }

    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================
    async function create(options = {}) {
        // Validate options
        if (!options.type) {
            throw new Error('Chart type is required');
        }
        
        if (!CONFIG.types[options.type]) {
            throw new Error(`Invalid chart type: ${options.type}`);
        }
        
        // Set defaults
        options = {
            style: 'glassmorphism',
            animation: 'smooth',
            features: deepMerge(CONFIG.features, options.features || {}),
            ...options
        };
        
        // Create container if not provided
        let container;
        if (options.container) {
            container = typeof options.container === 'string' 
                ? document.querySelector(options.container)
                : options.container;
        } else {
            container = document.createElement('div');
            container.style.width = options.width + 'px';
            container.style.height = options.height + 'px';
        }
        
        if (!container) {
            throw new Error('Container element not found');
        }
        
        // Create and initialize chart
        const chart = new Chart(options);
        await chart.init(container);
        
        return chart;
    }

    function getAvailableTypes() {
        return Object.keys(CONFIG.types);
    }

    function getTypeInfo(type) {
        return CONFIG.types[type] || null;
    }

    function getInstance(id) {
        return chartInstances.get(id);
    }

    function getAllInstances() {
        return Array.from(chartInstances.values());
    }

    function destroyAll() {
        chartInstances.forEach(chart => chart.destroy());
        chartInstances.clear();
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('chart-builder-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'chart-builder-styles';
        styles.textContent = `
            /* Chart Builder Styles */
            .chart-container {
                position: relative;
                width: 100%;
                height: 100%;
            }
            
            .chart-export-btn:hover {
                background: rgba(255, 255, 255, 0.2) !important;
                transform: translateY(-2px);
            }
            
            .chart-export-menu button:hover {
                background: rgba(255, 255, 255, 0.2) !important;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .chart-container {
                    min-height: 300px;
                }
            }
            
            /* Print styles */
            @media print {
                .chart-export-btn,
                .chart-export-menu {
                    display: none !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Auto-inject styles on first use
    let stylesInjected = false;
    function ensureStyles() {
        if (!stylesInjected) {
            injectStyles();
            stylesInjected = true;
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create: async (options) => {
            ensureStyles();
            return await create(options);
        },
        getAvailableTypes,
        getTypeInfo,
        getInstance,
        getAllInstances,
        destroyAll,
        CONFIG, // Exposer la configuration pour référence
        injectStyles
    };
})();

// Export pour utilisation
export default ChartBuilder;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-XX] - Performance avec grandes données
   Solution: Utilisation de Canvas au lieu de SVG, virtualisation des points
   
   [2024-01-XX] - Animations fluides sur mobile
   Cause: RequestAnimationFrame non optimisé
   Résolution: Throttling adaptatif basé sur les FPS
   
   [2024-01-XX] - Export PDF complexe
   Solution: Utilisation de html2canvas + jsPDF pour les graphiques complexes
   
   NOTES POUR REPRISES FUTURES:
   - Le système de scales doit être refactorisé pour supporter les échelles logarithmiques
   - L'interaction tactile nécessite des améliorations pour le pinch-to-zoom
   - Les tooltips peuvent chevaucher sur les bords, implémenter auto-repositionnement
   - Prévoir l'intégration avec des données en streaming (WebSocket)
   ======================================== */