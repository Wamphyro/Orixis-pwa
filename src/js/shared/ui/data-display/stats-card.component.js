/* ========================================
   STATS-CARD.COMPONENT.JS - Composant carte statistique glassmorphism
   Chemin: src/js/shared/ui/data-display/stats-card.component.js
   
   DESCRIPTION:
   Composant modulaire pour afficher des statistiques avec style glassmorphism.
   Supporte tous les types de données, animations et variantes possibles.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-250)
   2. Méthodes privées (lignes 251-800)
   3. Styles CSS (lignes 801-1200)
   4. API publique (lignes 1201-1300)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Utilise les icônes SVG intégrées
   - Compatible avec frosted-icons.component.js
   ======================================== */

const StatsCard = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) brightness(1.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                hover: {
                    background: 'rgba(255, 255, 255, 0.12)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                }
            },
            'neumorphism': {
                background: '#f0f0f0',
                borderRadius: '20px',
                boxShadow: '20px 20px 40px #bebebe, -20px -20px 40px #ffffff',
                hover: {
                    boxShadow: '10px 10px 20px #bebebe, -10px -10px 20px #ffffff'
                }
            },
            'flat': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            },
            'material': {
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                hover: {
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.08)'
                }
            },
            'gradient': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
            },
            'minimal': {
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
            },
            'dark': {
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                color: '#ffffff'
            }
        },

        // Types de données
        dataTypes: {
            'number': {
                format: (value) => new Intl.NumberFormat().format(value),
                suffix: ''
            },
            'currency': {
                format: (value, currency = 'EUR') => new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: currency
                }).format(value),
                suffix: ''
            },
            'percentage': {
                format: (value) => `${value}%`,
                suffix: '%'
            },
            'duration': {
                format: (value) => {
                    const hours = Math.floor(value / 3600);
                    const minutes = Math.floor((value % 3600) / 60);
                    return `${hours}h ${minutes}m`;
                },
                suffix: ''
            },
            'bytes': {
                format: (value) => {
                    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
                    let index = 0;
                    while (value >= 1024 && index < units.length - 1) {
                        value /= 1024;
                        index++;
                    }
                    return `${value.toFixed(1)} ${units[index]}`;
                },
                suffix: ''
            },
            'custom': {
                format: (value, formatter) => formatter ? formatter(value) : value,
                suffix: ''
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                enabled: true,
                duration: 300,
                easing: 'ease-out',
                hover: true,
                counter: false
            },
            'smooth': {
                enabled: true,
                duration: 600,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                hover: true,
                counter: true,
                counterDuration: 1500
            },
            'rich': {
                enabled: true,
                duration: 800,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                hover: true,
                counter: true,
                counterDuration: 2000,
                particles: true,
                glow: true,
                pulse: true
            }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                minHeight: '80px',
                padding: '16px',
                titleSize: '12px',
                valueSize: '20px',
                iconSize: '24px'
            },
            'medium': {
                minHeight: '120px',
                padding: '24px',
                titleSize: '14px',
                valueSize: '28px',
                iconSize: '32px'
            },
            'large': {
                minHeight: '160px',
                padding: '32px',
                titleSize: '16px',
                valueSize: '36px',
                iconSize: '40px'
            },
            'xl': {
                minHeight: '200px',
                padding: '40px',
                titleSize: '18px',
                valueSize: '48px',
                iconSize: '48px'
            }
        },

        // Indicateurs de tendance
        trends: {
            'up': {
                icon: 'M5 15l7-7 7 7',
                color: '#10b981',
                rotation: 0
            },
            'down': {
                icon: 'M19 9l-7 7-7-7',
                color: '#ef4444',
                rotation: 0
            },
            'stable': {
                icon: 'M5 12h14',
                color: '#6b7280',
                rotation: 0
            }
        },

        // Icônes prédéfinies
        icons: {
            'users': { path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
            'revenue': { path: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
            'orders': { path: 'M9 2v17.5A2.5 2.5 0 0 1 6.5 22A2.5 2.5 0 0 1 4 19.5V2M20 2v17.5a2.5 2.5 0 0 1-2.5 2.5a2.5 2.5 0 0 1-2.5-2.5V2M13 2l.5 1.5L15 4l-1.5.5L13 6l-.5-1.5L11 4l1.5-.5L13 2z' },
            'performance': { path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
            'growth': { path: 'M23 6l-9.5 9.5-5-5L1 18' },
            'time': { path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2' },
            'check': { path: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
            'alert': { path: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
            'info': { path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01' }
        },

        // Options de graphiques sparkline
        sparklineOptions: {
            'line': {
                type: 'line',
                strokeWidth: 2,
                smooth: true,
                fill: false
            },
            'area': {
                type: 'area',
                strokeWidth: 2,
                smooth: true,
                fill: true,
                fillOpacity: 0.3
            },
            'bar': {
                type: 'bar',
                barWidth: 0.8,
                gap: 2
            },
            'dots': {
                type: 'scatter',
                dotSize: 3
            }
        },

        // Couleurs thématiques
        colors: {
            primary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6',
            neutral: '#6b7280'
        }
    };

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    // Génération d'ID unique
    function generateId() {
        return `stats-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Création de la structure HTML
    function createStructure(options) {
        const card = document.createElement('div');
        card.className = 'stats-card';
        card.id = options.id || generateId();
        
        // Structure principale
        card.innerHTML = `
            <div class="stats-card-inner">
                ${options.icon ? `
                    <div class="stats-card-icon">
                        ${createIcon(options.icon, options.iconColor)}
                    </div>
                ` : ''}
                
                <div class="stats-card-content">
                    <h3 class="stats-card-title">${options.title || 'Statistique'}</h3>
                    <div class="stats-card-value" data-value="${options.value || 0}">
                        ${formatValue(0, options.dataType, options.formatter)}
                    </div>
                    
                    ${options.trend ? `
                        <div class="stats-card-trend ${options.trend}">
                            ${createTrendIcon(options.trend)}
                            <span class="trend-value">${options.trendValue || ''}</span>
                            <span class="trend-label">${options.trendLabel || ''}</span>
                        </div>
                    ` : ''}
                    
                    ${options.subtitle ? `
                        <p class="stats-card-subtitle">${options.subtitle}</p>
                    ` : ''}
                    
                    ${options.progress !== undefined ? `
                        <div class="stats-card-progress">
                            <div class="progress-bar" style="width: ${options.progress}%"></div>
                        </div>
                    ` : ''}
                </div>
                
                ${options.sparkline ? `
                    <div class="stats-card-sparkline">
                        <canvas width="100" height="40"></canvas>
                    </div>
                ` : ''}
                
                ${options.badge ? `
                    <div class="stats-card-badge ${options.badgeType || 'info'}">
                        ${options.badge}
                    </div>
                ` : ''}
            </div>
            
            ${options.footer ? `
                <div class="stats-card-footer">
                    ${options.footer}
                </div>
            ` : ''}
        `;

        // Application des styles
        applyStyles(card, options);

        // Animation du compteur si activée
        if (options.animation !== 'none' && CONFIG.animations[options.animation].counter) {
            requestAnimationFrame(() => {
                animateValue(card, 0, options.value, options);
            });
        } else {
            const valueElement = card.querySelector('.stats-card-value');
            valueElement.textContent = formatValue(options.value, options.dataType, options.formatter);
        }

        // Sparkline si demandé
        if (options.sparkline && options.sparklineData) {
            drawSparkline(card, options.sparklineData, options.sparklineOptions);
        }

        return card;
    }

    // Création d'icône SVG
    function createIcon(iconName, color) {
        const iconConfig = CONFIG.icons[iconName] || CONFIG.icons.info;
        const iconColor = color || CONFIG.colors.primary;
        
        return `
            <svg viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${iconConfig.path}"></path>
            </svg>
        `;
    }

    // Création d'icône de tendance
    function createTrendIcon(trend) {
        const trendConfig = CONFIG.trends[trend];
        return `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="${trendConfig.icon}"></polyline>
            </svg>
        `;
    }

    // Formatage des valeurs
    function formatValue(value, dataType = 'number', customFormatter) {
        const formatter = CONFIG.dataTypes[dataType];
        if (!formatter) return value;
        
        return formatter.format(value, customFormatter);
    }

    // Animation de compteur
    function animateValue(card, start, end, options) {
        const duration = CONFIG.animations[options.animation].counterDuration || 1500;
        const startTime = performance.now();
        const valueElement = card.querySelector('.stats-card-value');
        
        function update() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + (end - start) * easeProgress;
            
            valueElement.textContent = formatValue(
                Math.round(currentValue), 
                options.dataType, 
                options.formatter
            );
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                valueElement.textContent = formatValue(end, options.dataType, options.formatter);
                
                // Effet de particules pour animation 'rich'
                if (options.animation === 'rich' && CONFIG.animations.rich.particles) {
                    createParticleEffect(card);
                }
            }
        }
        
        update();
    }

    // Dessin du sparkline
    function drawSparkline(card, data, options = {}) {
        const canvas = card.querySelector('.stats-card-sparkline canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const type = options.type || 'line';
        const color = options.color || CONFIG.colors.primary;
        
        // Dimensions
        const width = canvas.width;
        const height = canvas.height;
        const padding = 5;
        
        // Échelle
        const minValue = Math.min(...data);
        const maxValue = Math.max(...data);
        const range = maxValue - minValue || 1;
        
        const xScale = (width - 2 * padding) / (data.length - 1);
        const yScale = (height - 2 * padding) / range;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Dessin selon le type
        if (type === 'line' || type === 'area') {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = options.strokeWidth || 2;
            
            data.forEach((value, index) => {
                const x = padding + index * xScale;
                const y = height - padding - (value - minValue) * yScale;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    if (options.smooth) {
                        const prevX = padding + (index - 1) * xScale;
                        const prevY = height - padding - (data[index - 1] - minValue) * yScale;
                        const cp1x = prevX + xScale / 3;
                        const cp1y = prevY;
                        const cp2x = x - xScale / 3;
                        const cp2y = y;
                        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            });
            
            if (type === 'area') {
                ctx.lineTo(width - padding, height - padding);
                ctx.lineTo(padding, height - padding);
                ctx.closePath();
                ctx.fillStyle = color + '33'; // 20% opacity
                ctx.fill();
            }
            
            ctx.stroke();
            
        } else if (type === 'bar') {
            const barWidth = (width - 2 * padding) / data.length * 0.8;
            const gap = (width - 2 * padding) / data.length * 0.2;
            
            ctx.fillStyle = color;
            
            data.forEach((value, index) => {
                const x = padding + index * (barWidth + gap);
                const barHeight = (value - minValue) * yScale;
                const y = height - padding - barHeight;
                
                ctx.fillRect(x, y, barWidth, barHeight);
            });
        }
    }

    // Effet de particules
    function createParticleEffect(card) {
        const particles = 8;
        const container = card.querySelector('.stats-card-inner');
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'stats-particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${CONFIG.colors.primary};
                border-radius: 50%;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                animation: particle-float 2s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                opacity: 0;
            `;
            
            container.appendChild(particle);
            
            // Suppression après animation
            setTimeout(() => particle.remove(), 2000 + i * 100);
        }
    }

    // Application des styles
    function applyStyles(card, options) {
        const style = CONFIG.styles[options.style || 'glassmorphism'];
        const size = CONFIG.sizes[options.size || 'medium'];
        const animation = CONFIG.animations[options.animation || 'smooth'];
        
        // Styles de base
        Object.assign(card.style, {
            minHeight: size.minHeight,
            padding: size.padding,
            ...style
        });

        // Tailles de police
        const title = card.querySelector('.stats-card-title');
        const value = card.querySelector('.stats-card-value');
        const icon = card.querySelector('.stats-card-icon svg');
        
        if (title) title.style.fontSize = size.titleSize;
        if (value) value.style.fontSize = size.valueSize;
        if (icon) {
            icon.style.width = size.iconSize;
            icon.style.height = size.iconSize;
        }

        // Animations hover
        if (animation.hover && style.hover) {
            card.addEventListener('mouseenter', () => {
                Object.assign(card.style, style.hover);
            });
            
            card.addEventListener('mouseleave', () => {
                Object.assign(card.style, {
                    background: style.background,
                    transform: 'translateY(0)',
                    boxShadow: style.boxShadow
                });
            });
        }

        // Classes pour animations CSS
        if (animation.enabled) {
            card.classList.add(`animation-${options.animation}`);
        }

        // Pulsation pour rich
        if (options.animation === 'rich' && animation.pulse) {
            card.classList.add('pulse-effect');
        }
    }

    // Mise à jour en temps réel
    function setupRealtime(card, options) {
        if (!options.realtime || !options.realtimeUrl) return;
        
        const interval = options.realtimeInterval || 5000;
        const valueElement = card.querySelector('.stats-card-value');
        const oldValue = parseFloat(valueElement.dataset.value);
        
        const fetchData = async () => {
            try {
                const response = await fetch(options.realtimeUrl);
                const data = await response.json();
                const newValue = data[options.realtimeField || 'value'];
                
                if (newValue !== oldValue) {
                    animateValue(card, oldValue, newValue, options);
                    valueElement.dataset.value = newValue;
                    
                    // Mise à jour de la tendance
                    if (options.showTrendChange) {
                        updateTrend(card, oldValue, newValue);
                    }
                    
                    // Mise à jour du sparkline
                    if (options.sparkline && data.sparklineData) {
                        drawSparkline(card, data.sparklineData, options.sparklineOptions);
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour temps réel:', error);
            }
        };
        
        const intervalId = setInterval(fetchData, interval);
        
        // Stocker l'ID pour pouvoir l'arrêter plus tard
        card.dataset.realtimeInterval = intervalId;
    }

    // Mise à jour de la tendance
    function updateTrend(card, oldValue, newValue) {
        const trendElement = card.querySelector('.stats-card-trend');
        if (!trendElement) return;
        
        const trend = newValue > oldValue ? 'up' : newValue < oldValue ? 'down' : 'stable';
        const trendConfig = CONFIG.trends[trend];
        
        trendElement.className = `stats-card-trend ${trend}`;
        trendElement.querySelector('svg').innerHTML = `<polyline points="${trendConfig.icon}"></polyline>`;
        
        const difference = ((newValue - oldValue) / oldValue * 100).toFixed(1);
        const trendValue = trendElement.querySelector('.trend-value');
        if (trendValue) {
            trendValue.textContent = `${difference > 0 ? '+' : ''}${difference}%`;
        }
    }

    // ========================================
    // STYLES CSS
    // ========================================
    const styles = `
        .stats-card {
            position: relative;
            width: 100%;
            display: flex;
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }

        .stats-card-inner {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 16px;
            flex: 1;
        }

        .stats-card-icon {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            transition: all 0.3s ease;
        }

        .stats-card:hover .stats-card-icon {
            opacity: 1;
            transform: scale(1.1);
        }

        .stats-card-content {
            flex: 1;
            min-width: 0;
        }

        .stats-card-title {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            letter-spacing: 0.025em;
            text-transform: uppercase;
        }

        .stats-card-value {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            line-height: 1.2;
            transition: all 0.3s ease;
        }

        /* Dark theme adjustments */
        .dark .stats-card-title,
        .stats-card[style*="dark"] .stats-card-title {
            color: #9ca3af;
        }

        .dark .stats-card-value,
        .stats-card[style*="dark"] .stats-card-value {
            color: #f9fafb;
        }

        /* Tendance */
        .stats-card-trend {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .stats-card-trend svg {
            width: 16px;
            height: 16px;
        }

        .stats-card-trend.up {
            color: #10b981;
        }

        .stats-card-trend.down {
            color: #ef4444;
        }

        .stats-card-trend.stable {
            color: #6b7280;
        }

        .trend-value {
            font-weight: 600;
        }

        .trend-label {
            color: #6b7280;
            font-weight: 400;
        }

        /* Sous-titre */
        .stats-card-subtitle {
            margin: 8px 0 0 0;
            font-size: 13px;
            color: #6b7280;
            line-height: 1.5;
        }

        /* Barre de progression */
        .stats-card-progress {
            margin-top: 12px;
            height: 6px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: #3b82f6;
            border-radius: 3px;
            transition: width 0.6s ease;
            position: relative;
            overflow: hidden;
        }

        .progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            );
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        /* Sparkline */
        .stats-card-sparkline {
            position: absolute;
            right: 0;
            bottom: 0;
            opacity: 0.3;
            transition: opacity 0.3s ease;
        }

        .stats-card:hover .stats-card-sparkline {
            opacity: 0.6;
        }

        /* Badge */
        .stats-card-badge {
            position: absolute;
            top: 16px;
            right: 16px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-radius: 4px;
            background: #3b82f6;
            color: white;
        }

        .stats-card-badge.success { background: #10b981; }
        .stats-card-badge.warning { background: #f59e0b; }
        .stats-card-badge.danger { background: #ef4444; }
        .stats-card-badge.info { background: #3b82f6; }

        /* Footer */
        .stats-card-footer {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            font-size: 13px;
            color: #6b7280;
        }

        /* Animations */
        .animation-subtle {
            transition: all 0.3s ease-out;
        }

        .animation-smooth {
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animation-rich {
            transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        /* Effet de pulsation */
        .pulse-effect {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            }
        }

        /* Particules */
        @keyframes particle-float {
            0% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(0);
            }
            50% {
                opacity: 0.8;
            }
            100% {
                opacity: 0;
                transform: translate(
                    calc(-50% + ${Math.random() * 100 - 50}px),
                    calc(-50% - 100px)
                ) scale(1);
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .stats-card {
                min-height: auto !important;
            }

            .stats-card-inner {
                flex-direction: column;
            }

            .stats-card-sparkline {
                position: static;
                margin-top: 16px;
                opacity: 0.6;
            }
        }

        /* Grille de cartes */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
        }

        /* Hover group effect */
        .stats-grid:hover .stats-card {
            opacity: 0.7;
            transform: scale(0.98);
        }

        .stats-grid:hover .stats-card:hover {
            opacity: 1;
            transform: scale(1);
        }

        /* Loading state */
        .stats-card.loading .stats-card-value {
            background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
            background-size: 200% 100%;
            animation: loading 1.5s ease-in-out infinite;
            color: transparent;
            min-height: 1em;
            border-radius: 4px;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Print styles */
        @media print {
            .stats-card {
                break-inside: avoid;
                box-shadow: none !important;
                border: 1px solid #e5e7eb;
            }
        }
    `;

    // Injection des styles
    function injectStyles() {
        if (document.getElementById('stats-card-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'stats-card-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration exposée pour référence
        CONFIG,

        // Création d'une carte statistique
        create(options = {}) {
            // Injection des styles au premier appel
            injectStyles();

            // Options par défaut
            const defaultOptions = {
                style: 'glassmorphism',
                size: 'medium',
                animation: 'smooth',
                dataType: 'number',
                value: 0
            };

            // Fusion des options
            const finalOptions = { ...defaultOptions, ...options };

            // Création de la carte
            const card = createStructure(finalOptions);

            // Configuration temps réel si demandé
            if (finalOptions.realtime) {
                setupRealtime(card, finalOptions);
            }

            // Retour de l'élément et des méthodes
            return {
                element: card,
                
                // Mise à jour de la valeur
                updateValue(newValue, animate = true) {
                    const valueElement = card.querySelector('.stats-card-value');
                    const oldValue = parseFloat(valueElement.dataset.value);
                    
                    if (animate && finalOptions.animation !== 'none') {
                        animateValue(card, oldValue, newValue, finalOptions);
                    } else {
                        valueElement.textContent = formatValue(newValue, finalOptions.dataType, finalOptions.formatter);
                    }
                    
                    valueElement.dataset.value = newValue;
                },
                
                // Mise à jour du sparkline
                updateSparkline(data) {
                    drawSparkline(card, data, finalOptions.sparklineOptions);
                },
                
                // Changement de style
                setStyle(styleName) {
                    const style = CONFIG.styles[styleName];
                    if (style) {
                        Object.assign(card.style, style);
                    }
                },
                
                // Destruction
                destroy() {
                    // Arrêt des mises à jour temps réel
                    if (card.dataset.realtimeInterval) {
                        clearInterval(card.dataset.realtimeInterval);
                    }
                    
                    // Suppression du DOM
                    card.remove();
                }
            };
        },

        // Création d'une grille de cartes
        createGrid(cardsConfig = [], containerOptions = {}) {
            const grid = document.createElement('div');
            grid.className = 'stats-grid';
            
            if (containerOptions.className) {
                grid.className += ` ${containerOptions.className}`;
            }
            
            const cards = cardsConfig.map(config => {
                const card = this.create(config);
                grid.appendChild(card.element);
                return card;
            });
            
            return {
                element: grid,
                cards,
                
                updateAll(updates = {}) {
                    Object.entries(updates).forEach(([index, value]) => {
                        if (cards[index]) {
                            cards[index].updateValue(value);
                        }
                    });
                }
            };
        },

        // Méthode utilitaire pour formater les valeurs
        formatValue,

        // Liste des styles disponibles
        getAvailableStyles() {
            return Object.keys(CONFIG.styles);
        },

        // Liste des types de données
        getDataTypes() {
            return Object.keys(CONFIG.dataTypes);
        },

        // Injection manuelle des styles si nécessaire
        injectStyles
    };
})();

// Export pour utilisation en modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsCard;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2025-01-28] - Implémentation initiale
   - Création du système complet avec tous les styles
   - Support glassmorphism avec effet frost
   - Animations de compteur et sparkline
   - Système de mise à jour temps réel
   
   NOTES POUR REPRISES FUTURES:
   - Les animations 'rich' incluent des particules
   - Le sparkline utilise Canvas pour performance
   - Support complet du responsive et dark mode
   - Lazy loading via index.js du système UI
   ======================================== */