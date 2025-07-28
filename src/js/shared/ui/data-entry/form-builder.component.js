/**
 * 📝 ULTIMATE FORM BUILDER COMPONENT
 * Version: 1.0.0
 * 
 * Le composant formulaire le plus complet jamais créé !
 * Construction dynamique de formulaires avec TOUTES les options possibles.
 * 
 * @example Simple
 * const form = await UI.Form({
 *     fields: [
 *         { type: 'text', name: 'name', label: 'Nom' },
 *         { type: 'email', name: 'email', label: 'Email' }
 *     ],
 *     onSubmit: async (data) => console.log(data)
 * });
 * 
 * @example Complexe
 * const form = await UI.Form({
 *     fields: [...],
 *     layout: 'multi-column',
 *     validation: 'realtime',
 *     features: {
 *         steps: true,
 *         conditional: true,
 *         autosave: true,
 *         progress: true
 *     },
 *     style: 'glassmorphism',
 *     animation: 'rich'
 * });
 */

const FormBuilderComponent = (() => {
    'use strict';

    // 🎨 CONFIGURATION COMPLÈTE - TOUTES LES OPTIONS POSSIBLES
    const CONFIG = {
        // Types de champs
        fieldTypes: {
            // Champs de texte
            'text': {
                tag: 'input',
                type: 'text',
                icon: '📝',
                validation: ['required', 'minLength', 'maxLength', 'pattern'],
                features: ['placeholder', 'autocomplete', 'mask', 'counter', 'clearable']
            },
            'email': {
                tag: 'input',
                type: 'email',
                icon: '✉️',
                validation: ['required', 'email', 'unique'],
                features: ['placeholder', 'autocomplete', 'suggestions']
            },
            'password': {
                tag: 'input',
                type: 'password',
                icon: '🔒',
                validation: ['required', 'minLength', 'strength', 'match'],
                features: ['showToggle', 'strengthMeter', 'generator', 'requirements']
            },
            'url': {
                tag: 'input',
                type: 'url',
                icon: '🔗',
                validation: ['required', 'url', 'accessible'],
                features: ['placeholder', 'preview']
            },
            'tel': {
                tag: 'input',
                type: 'tel',
                icon: '📞',
                validation: ['required', 'phone', 'international'],
                features: ['placeholder', 'countryCode', 'mask', 'formatter']
            },
            'search': {
                tag: 'input',
                type: 'search',
                icon: '🔍',
                validation: ['minLength'],
                features: ['placeholder', 'suggestions', 'history', 'voice']
            },
            
            // Champs numériques
            'number': {
                tag: 'input',
                type: 'number',
                icon: '🔢',
                validation: ['required', 'min', 'max', 'step', 'integer'],
                features: ['placeholder', 'spinner', 'formatter', 'calculator']
            },
            'range': {
                tag: 'input',
                type: 'range',
                icon: '📊',
                validation: ['min', 'max', 'step'],
                features: ['labels', 'ticks', 'tooltip', 'dual']
            },
            'currency': {
                tag: 'input',
                type: 'text',
                icon: '💰',
                validation: ['required', 'min', 'max'],
                features: ['currency', 'locale', 'calculator', 'converter']
            },
            'percentage': {
                tag: 'input',
                type: 'number',
                icon: '📈',
                validation: ['required', 'min', 'max'],
                features: ['suffix', 'decimals', 'slider']
            },
            
            // Champs de date/heure
            'date': {
                tag: 'input',
                type: 'date',
                icon: '📅',
                validation: ['required', 'min', 'max', 'range', 'businessDays'],
                features: ['calendar', 'format', 'locale', 'presets']
            },
            'time': {
                tag: 'input',
                type: 'time',
                icon: '⏰',
                validation: ['required', 'min', 'max', 'step'],
                features: ['picker', 'format', '12hour', 'seconds']
            },
            'datetime': {
                tag: 'input',
                type: 'datetime-local',
                icon: '📆',
                validation: ['required', 'min', 'max'],
                features: ['calendar', 'timePicker', 'timezone', 'format']
            },
            'daterange': {
                tag: 'div',
                icon: '📆',
                validation: ['required', 'minDays', 'maxDays'],
                features: ['presets', 'comparison', 'calendar', 'relative']
            },
            'month': {
                tag: 'input',
                type: 'month',
                icon: '🗓️',
                validation: ['required', 'min', 'max'],
                features: ['picker', 'format']
            },
            'week': {
                tag: 'input',
                type: 'week',
                icon: '📅',
                validation: ['required', 'min', 'max'],
                features: ['picker', 'format']
            },
            
            // Champs de sélection
            'select': {
                tag: 'select',
                icon: '📋',
                validation: ['required', 'options'],
                features: ['placeholder', 'search', 'groups', 'icons', 'descriptions', 'async']
            },
            'multiselect': {
                tag: 'select',
                multiple: true,
                icon: '☑️',
                validation: ['required', 'min', 'max'],
                features: ['search', 'tags', 'checkboxes', 'selectAll', 'reorder']
            },
            'radio': {
                tag: 'input',
                type: 'radio',
                icon: '⭕',
                validation: ['required'],
                features: ['inline', 'buttons', 'icons', 'descriptions']
            },
            'checkbox': {
                tag: 'input',
                type: 'checkbox',
                icon: '☑️',
                validation: ['required', 'terms'],
                features: ['indeterminate', 'switch', 'toggle']
            },
            'checkboxgroup': {
                tag: 'div',
                icon: '☑️',
                validation: ['required', 'min', 'max'],
                features: ['inline', 'selectAll', 'tree', 'search']
            },
            'toggle': {
                tag: 'button',
                icon: '🔘',
                validation: ['required'],
                features: ['labels', 'icons', 'colors', 'sizes']
            },
            'switch': {
                tag: 'button',
                icon: '🔀',
                validation: ['required'],
                features: ['labels', 'icons', 'loading', 'confirm']
            },
            
            // Champs de texte long
            'textarea': {
                tag: 'textarea',
                icon: '📄',
                validation: ['required', 'minLength', 'maxLength'],
                features: ['placeholder', 'autoResize', 'counter', 'toolbar']
            },
            'richtext': {
                tag: 'div',
                icon: '📝',
                validation: ['required', 'minLength', 'maxLength'],
                features: ['toolbar', 'mentions', 'emoji', 'media', 'code', 'tables']
            },
            'markdown': {
                tag: 'div',
                icon: '📝',
                validation: ['required', 'minLength', 'maxLength'],
                features: ['preview', 'toolbar', 'syntax', 'shortcuts']
            },
            'code': {
                tag: 'div',
                icon: '💻',
                validation: ['required', 'syntax'],
                features: ['syntax', 'theme', 'language', 'lint', 'format', 'autocomplete']
            },
            'json': {
                tag: 'div',
                icon: '{}',
                validation: ['required', 'valid', 'schema'],
                features: ['syntax', 'validate', 'format', 'tree', 'schema']
            },
            
            // Champs de fichier
            'file': {
                tag: 'input',
                type: 'file',
                icon: '📎',
                validation: ['required', 'size', 'type', 'dimensions'],
                features: ['multiple', 'drag', 'preview', 'progress', 'chunked']
            },
            'image': {
                tag: 'input',
                type: 'file',
                accept: 'image/*',
                icon: '🖼️',
                validation: ['required', 'size', 'dimensions', 'ratio'],
                features: ['preview', 'crop', 'rotate', 'filters', 'compress']
            },
            'avatar': {
                tag: 'div',
                icon: '👤',
                validation: ['required', 'size', 'dimensions'],
                features: ['camera', 'crop', 'filters', 'shapes']
            },
            'video': {
                tag: 'input',
                type: 'file',
                accept: 'video/*',
                icon: '🎥',
                validation: ['required', 'size', 'duration', 'format'],
                features: ['preview', 'thumbnail', 'trim', 'compress']
            },
            'audio': {
                tag: 'input',
                type: 'file',
                accept: 'audio/*',
                icon: '🎵',
                validation: ['required', 'size', 'duration', 'format'],
                features: ['preview', 'record', 'trim', 'visualizer']
            },
            'document': {
                tag: 'input',
                type: 'file',
                accept: '.pdf,.doc,.docx,.xls,.xlsx',
                icon: '📄',
                validation: ['required', 'size', 'type'],
                features: ['preview', 'scan', 'ocr']
            },
            
            // Champs spéciaux
            'color': {
                tag: 'input',
                type: 'color',
                icon: '🎨',
                validation: ['required', 'format'],
                features: ['picker', 'palette', 'eyedropper', 'history']
            },
            'rating': {
                tag: 'div',
                icon: '⭐',
                validation: ['required', 'min', 'max'],
                features: ['icons', 'half', 'clear', 'feedback']
            },
            'slider': {
                tag: 'div',
                icon: '🎚️',
                validation: ['required', 'min', 'max', 'step'],
                features: ['labels', 'marks', 'tooltip', 'vertical', 'reverse']
            },
            'tags': {
                tag: 'div',
                icon: '🏷️',
                validation: ['required', 'min', 'max', 'unique'],
                features: ['autocomplete', 'create', 'colors', 'icons', 'drag']
            },
            'chips': {
                tag: 'div',
                icon: '🔖',
                validation: ['required', 'min', 'max'],
                features: ['colors', 'icons', 'removable', 'selectable']
            },
            'otp': {
                tag: 'div',
                icon: '🔐',
                validation: ['required', 'length', 'numeric'],
                features: ['mask', 'paste', 'autofocus', 'secure']
            },
            'pin': {
                tag: 'div',
                icon: '📍',
                validation: ['required', 'length', 'pattern'],
                features: ['mask', 'secure', 'numeric', 'alphanumeric']
            },
            'pattern': {
                tag: 'div',
                icon: '🔣',
                validation: ['required', 'pattern'],
                features: ['visual', 'touch', 'complexity']
            },
            'signature': {
                tag: 'canvas',
                icon: '✍️',
                validation: ['required'],
                features: ['pen', 'touch', 'clear', 'undo', 'save']
            },
            'location': {
                tag: 'div',
                icon: '📍',
                validation: ['required', 'coordinates'],
                features: ['map', 'search', 'current', 'radius', 'polygon']
            },
            'address': {
                tag: 'div',
                icon: '🏠',
                validation: ['required', 'complete'],
                features: ['autocomplete', 'map', 'components', 'international']
            },
            'captcha': {
                tag: 'div',
                icon: '🤖',
                validation: ['required', 'valid'],
                features: ['image', 'audio', 'math', 'puzzle', 'recaptcha']
            },
            'matrix': {
                tag: 'table',
                icon: '📊',
                validation: ['required', 'complete'],
                features: ['headers', 'totals', 'formulas']
            },
            'repeater': {
                tag: 'div',
                icon: '🔁',
                validation: ['min', 'max'],
                features: ['add', 'remove', 'reorder', 'duplicate', 'template']
            },
            'wizard': {
                tag: 'div',
                icon: '🧙',
                validation: ['steps'],
                features: ['progress', 'navigation', 'validation', 'save']
            },
            'survey': {
                tag: 'div',
                icon: '📊',
                validation: ['required'],
                features: ['branching', 'scoring', 'progress', 'timer']
            },
            'quiz': {
                tag: 'div',
                icon: '❓',
                validation: ['required', 'correct'],
                features: ['timer', 'hints', 'explanation', 'score']
            },
            'poll': {
                tag: 'div',
                icon: '📊',
                validation: ['required'],
                features: ['results', 'anonymous', 'multiple', 'ranked']
            }
        },

        // Layouts de formulaire
        layouts: {
            'single-column': {
                columns: 1,
                gap: '24px',
                responsive: true
            },
            'two-column': {
                columns: 2,
                gap: '24px',
                breakpoint: 768,
                responsive: true
            },
            'multi-column': {
                columns: 'auto',
                gap: '24px',
                minWidth: '300px',
                responsive: true
            },
            'grid': {
                display: 'grid',
                gap: '24px',
                template: 'custom',
                responsive: true
            },
            'inline': {
                display: 'flex',
                gap: '16px',
                wrap: true,
                align: 'center'
            },
            'stacked': {
                display: 'block',
                gap: '16px',
                fullWidth: true
            },
            'floating': {
                position: 'absolute',
                animation: 'float',
                interactive: true
            },
            'accordion': {
                collapsible: true,
                animated: true,
                icons: true
            },
            'tabs': {
                position: 'top',
                animated: true,
                swipeable: true
            },
            'steps': {
                orientation: 'horizontal',
                numbered: true,
                progress: true
            },
            'wizard': {
                navigation: true,
                validation: 'step',
                save: 'auto'
            },
            'sidebar': {
                position: 'left',
                sticky: true,
                collapsible: true
            },
            'masonry': {
                columns: 'auto',
                gap: '24px',
                order: 'optimal'
            },
            'kanban': {
                columns: 'status',
                draggable: true,
                animated: true
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    padding: '32px'
                },
                field: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                },
                fieldHover: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                },
                fieldFocus: {
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)'
                },
                label: {
                    color: '#1f2937',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                },
                input: {
                    background: 'transparent',
                    color: '#1f2937',
                    padding: '12px 16px',
                    fontSize: '16px'
                },
                button: {
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                    backdropFilter: 'blur(10px)'
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    borderRadius: '20px',
                    padding: '32px',
                    boxShadow: '20px 20px 60px #bec3c9, -20px -20px 60px #ffffff'
                },
                field: {
                    background: '#e0e5ec',
                    borderRadius: '15px',
                    border: 'none',
                    boxShadow: 'inset 6px 6px 12px #bec3c9, inset -6px -6px 12px #ffffff'
                },
                fieldHover: {
                    boxShadow: 'inset 4px 4px 8px #bec3c9, inset -4px -4px 8px #ffffff'
                },
                fieldFocus: {
                    boxShadow: 'inset 8px 8px 16px #bec3c9, inset -8px -8px 16px #ffffff'
                },
                label: {
                    color: '#4a5568',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '10px'
                },
                input: {
                    background: 'transparent',
                    color: '#2d3748',
                    padding: '14px 18px',
                    fontSize: '16px'
                },
                button: {
                    background: '#e0e5ec',
                    border: 'none',
                    borderRadius: '15px',
                    color: '#4a5568',
                    boxShadow: '6px 6px 12px #bec3c9, -6px -6px 12px #ffffff'
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    borderRadius: '4px',
                    padding: '24px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)'
                },
                field: {
                    position: 'relative',
                    marginTop: '20px',
                    borderBottom: '1px solid #e0e0e0',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                fieldHover: {
                    borderBottomColor: '#9e9e9e'
                },
                fieldFocus: {
                    borderBottomColor: '#2196f3',
                    borderBottomWidth: '2px'
                },
                label: {
                    position: 'absolute',
                    top: '16px',
                    left: '0',
                    color: '#9e9e9e',
                    fontSize: '16px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none'
                },
                labelFloat: {
                    top: '-20px',
                    fontSize: '12px',
                    color: '#2196f3'
                },
                input: {
                    background: 'transparent',
                    border: 'none',
                    color: '#212121',
                    padding: '16px 0 8px',
                    fontSize: '16px',
                    width: '100%'
                },
                button: {
                    background: '#2196f3',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    padding: '24px'
                },
                field: {
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                },
                fieldHover: {
                    borderColor: '#d1d5db'
                },
                fieldFocus: {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.05)'
                },
                label: {
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '6px'
                },
                input: {
                    background: 'transparent',
                    color: '#1f2937',
                    padding: '10px 14px',
                    fontSize: '16px'
                },
                button: {
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '10px 20px'
                }
            },
            'dark': {
                container: {
                    background: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid #333333'
                },
                field: {
                    background: '#262626',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                },
                fieldHover: {
                    borderColor: '#525252',
                    background: '#2a2a2a'
                },
                fieldFocus: {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)'
                },
                label: {
                    color: '#e5e7eb',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                },
                input: {
                    background: 'transparent',
                    color: '#f3f4f6',
                    padding: '12px 16px',
                    fontSize: '16px'
                },
                button: {
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff'
                }
            },
            'gradient': {
                container: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    padding: '32px',
                    position: 'relative',
                    overflow: 'hidden'
                },
                containerBefore: {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                },
                field: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                },
                fieldHover: {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
                },
                fieldFocus: {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)'
                },
                label: {
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                },
                input: {
                    background: 'transparent',
                    color: '#1a202c',
                    padding: '12px 16px',
                    fontSize: '16px'
                },
                button: {
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }
            },
            'neon': {
                container: {
                    background: '#0a0a0a',
                    borderRadius: '20px',
                    padding: '32px',
                    border: '2px solid #1a1a1a',
                    position: 'relative'
                },
                field: {
                    background: '#1a1a1a',
                    border: '2px solid #2a2a2a',
                    borderRadius: '10px',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                },
                fieldHover: {
                    borderColor: '#3a3a3a',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                },
                fieldFocus: {
                    borderColor: '#8b5cf6',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.6), inset 0 0 20px rgba(139, 92, 246, 0.2)'
                },
                label: {
                    color: '#e0e0e0',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                },
                input: {
                    background: 'transparent',
                    color: '#ffffff',
                    padding: '12px 16px',
                    fontSize: '16px'
                },
                button: {
                    background: 'transparent',
                    border: '2px solid #8b5cf6',
                    borderRadius: '10px',
                    color: '#8b5cf6',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                },
                buttonHover: {
                    color: '#ffffff',
                    textShadow: '0 0 10px #8b5cf6',
                    boxShadow: '0 0 40px rgba(139, 92, 246, 0.8), inset 0 0 20px rgba(139, 92, 246, 0.4)'
                }
            }
        },

        // Animations
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                field: {
                    enter: 'fadeIn 0.3s ease',
                    focus: 'focusPulse 0.3s ease',
                    error: 'shake 0.3s ease',
                    success: 'successPulse 0.3s ease'
                },
                submit: 'submitPulse 0.3s ease'
            },
            'smooth': {
                field: {
                    enter: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    focus: 'focusGlow 0.4s ease',
                    error: 'errorShake 0.4s ease',
                    success: 'successBounce 0.4s ease',
                    hover: 'fieldHover 0.3s ease'
                },
                label: {
                    float: 'labelFloat 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                submit: 'submitWave 0.6s ease',
                progress: 'progressSlide 0.5s ease'
            },
            'rich': {
                field: {
                    enter: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    focus: 'focusExpand 0.5s ease',
                    error: 'errorWobble 0.6s ease',
                    success: 'successZoom 0.5s ease',
                    hover: 'fieldFloat 0.4s ease',
                    typing: 'typingPulse 0.3s ease'
                },
                label: {
                    float: 'labelBounce 0.4s ease',
                    focus: 'labelGlow 0.4s ease'
                },
                submit: {
                    click: 'submitPress 0.2s ease',
                    loading: 'submitSpin 1s linear infinite',
                    success: 'submitSuccess 0.6s ease'
                },
                progress: {
                    update: 'progressGrow 0.4s ease',
                    complete: 'progressComplete 0.6s ease'
                },
                validation: {
                    show: 'validationSlide 0.3s ease',
                    hide: 'validationFade 0.3s ease'
                }
            },
            'playful': {
                field: {
                    enter: 'fieldDrop 0.6s ease',
                    focus: 'fieldJump 0.4s ease',
                    error: 'fieldShakeRotate 0.5s ease',
                    success: 'fieldDance 0.6s ease',
                    hover: 'fieldWiggle 0.3s ease',
                    typing: 'fieldBounce 0.2s ease'
                },
                label: {
                    float: 'labelSpin 0.5s ease',
                    focus: 'labelRainbow 2s linear infinite'
                },
                submit: {
                    hover: 'buttonJelly 0.5s ease',
                    click: 'buttonSquish 0.3s ease',
                    loading: 'buttonMorph 1.5s ease infinite',
                    success: 'buttonCelebrate 1s ease'
                },
                characters: {
                    type: 'charBounce 0.1s ease',
                    limit: 'charExplode 0.3s ease'
                },
                emoji: {
                    react: 'emojiPop 0.4s ease',
                    rain: 'emojiRain 2s linear'
                }
            },
            'elegant': {
                field: {
                    enter: 'fadeSlideIn 0.6s ease',
                    focus: 'elegantFocus 0.5s ease',
                    blur: 'elegantBlur 0.5s ease'
                },
                container: {
                    reveal: 'containerReveal 1s ease',
                    parallax: true
                }
            },
            'futuristic': {
                field: {
                    enter: 'glitchIn 0.5s ease',
                    focus: 'hologramFocus 0.4s ease',
                    type: 'scanType 0.1s ease',
                    error: 'glitchError 0.3s ease'
                },
                container: {
                    scan: 'scanLine 3s linear infinite',
                    glow: 'neonGlow 2s ease infinite'
                }
            }
        },

        // Validations prédéfinies
        validations: {
            // Validations de base
            'required': {
                message: 'Ce champ est requis',
                test: (value) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
            },
            'email': {
                message: 'Email invalide',
                test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            },
            'url': {
                message: 'URL invalide',
                test: (value) => {
                    try {
                        new URL(value);
                        return true;
                    } catch {
                        return false;
                    }
                }
            },
            'phone': {
                message: 'Numéro de téléphone invalide',
                test: (value) => /^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10
            },
            'number': {
                message: 'Doit être un nombre',
                test: (value) => !isNaN(value) && isFinite(value)
            },
            'integer': {
                message: 'Doit être un nombre entier',
                test: (value) => Number.isInteger(Number(value))
            },
            'positive': {
                message: 'Doit être positif',
                test: (value) => Number(value) > 0
            },
            'negative': {
                message: 'Doit être négatif',
                test: (value) => Number(value) < 0
            },
            
            // Validations de longueur
            'minLength': {
                message: (min) => `Minimum ${min} caractères`,
                test: (value, min) => String(value).length >= min
            },
            'maxLength': {
                message: (max) => `Maximum ${max} caractères`,
                test: (value, max) => String(value).length <= max
            },
            'exactLength': {
                message: (length) => `Doit contenir exactement ${length} caractères`,
                test: (value, length) => String(value).length === length
            },
            
            // Validations numériques
            'min': {
                message: (min) => `Doit être supérieur ou égal à ${min}`,
                test: (value, min) => Number(value) >= min
            },
            'max': {
                message: (max) => `Doit être inférieur ou égal à ${max}`,
                test: (value, max) => Number(value) <= max
            },
            'between': {
                message: (min, max) => `Doit être entre ${min} et ${max}`,
                test: (value, min, max) => Number(value) >= min && Number(value) <= max
            },
            'step': {
                message: (step) => `Doit être un multiple de ${step}`,
                test: (value, step) => Number(value) % step === 0
            },
            
            // Validations de pattern
            'pattern': {
                message: 'Format invalide',
                test: (value, pattern) => new RegExp(pattern).test(value)
            },
            'alphanumeric': {
                message: 'Doit contenir uniquement des lettres et des chiffres',
                test: (value) => /^[a-zA-Z0-9]+$/.test(value)
            },
            'alpha': {
                message: 'Doit contenir uniquement des lettres',
                test: (value) => /^[a-zA-Z]+$/.test(value)
            },
            'numeric': {
                message: 'Doit contenir uniquement des chiffres',
                test: (value) => /^\d+$/.test(value)
            },
            'lowercase': {
                message: 'Doit être en minuscules',
                test: (value) => value === value.toLowerCase()
            },
            'uppercase': {
                message: 'Doit être en majuscules',
                test: (value) => value === value.toUpperCase()
            },
            
            // Validations de date
            'date': {
                message: 'Date invalide',
                test: (value) => !isNaN(Date.parse(value))
            },
            'dateMin': {
                message: (min) => `Doit être après le ${new Date(min).toLocaleDateString()}`,
                test: (value, min) => new Date(value) >= new Date(min)
            },
            'dateMax': {
                message: (max) => `Doit être avant le ${new Date(max).toLocaleDateString()}`,
                test: (value, max) => new Date(value) <= new Date(max)
            },
            'dateBetween': {
                message: (min, max) => `Doit être entre le ${new Date(min).toLocaleDateString()} et le ${new Date(max).toLocaleDateString()}`,
                test: (value, min, max) => {
                    const date = new Date(value);
                    return date >= new Date(min) && date <= new Date(max);
                }
            },
            'age': {
                message: (min) => `Vous devez avoir au moins ${min} ans`,
                test: (value, min) => {
                    const age = new Date().getFullYear() - new Date(value).getFullYear();
                    return age >= min;
                }
            },
            'future': {
                message: 'Doit être dans le futur',
                test: (value) => new Date(value) > new Date()
            },
            'past': {
                message: 'Doit être dans le passé',
                test: (value) => new Date(value) < new Date()
            },
            'businessDay': {
                message: 'Doit être un jour ouvrable',
                test: (value) => {
                    const day = new Date(value).getDay();
                    return day > 0 && day < 6;
                }
            },
            
            // Validations de fichier
            'fileSize': {
                message: (max) => `La taille du fichier ne doit pas dépasser ${formatFileSize(max)}`,
                test: (file, max) => file.size <= max
            },
            'fileType': {
                message: (types) => `Types de fichier acceptés : ${types.join(', ')}`,
                test: (file, types) => types.includes(file.type) || types.some(type => file.name.endsWith(type))
            },
            'imageDimensions': {
                message: (width, height) => `L'image doit faire ${width}x${height} pixels`,
                test: async (file, width, height) => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(img.width === width && img.height === height);
                        img.onerror = () => resolve(false);
                        img.src = URL.createObjectURL(file);
                    });
                }
            },
            'imageRatio': {
                message: (ratio) => `L'image doit avoir un ratio de ${ratio}`,
                test: async (file, ratio) => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(Math.abs(img.width / img.height - ratio) < 0.01);
                        img.onerror = () => resolve(false);
                        img.src = URL.createObjectURL(file);
                    });
                }
            },
            
            // Validations de sécurité
            'password': {
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
                test: (value) => {
                    return value.length >= 8 &&
                           /[A-Z]/.test(value) &&
                           /[a-z]/.test(value) &&
                           /\d/.test(value);
                }
            },
            'passwordStrength': {
                message: 'Mot de passe trop faible',
                test: (value, level = 'medium') => {
                    let strength = 0;
                    if (value.length >= 8) strength++;
                    if (value.length >= 12) strength++;
                    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) strength++;
                    if (/\d/.test(value)) strength++;
                    if (/[^A-Za-z0-9]/.test(value)) strength++;
                    
                    const levels = { weak: 1, medium: 3, strong: 4 };
                    return strength >= levels[level];
                }
            },
            'match': {
                message: (field) => `Doit correspondre au champ ${field}`,
                test: (value, fieldName, formData) => value === formData[fieldName]
            },
            'unique': {
                message: 'Cette valeur existe déjà',
                test: async (value, checkFunction) => {
                    if (typeof checkFunction === 'function') {
                        return !(await checkFunction(value));
                    }
                    return true;
                }
            },
            
            // Validations personnalisées
            'creditCard': {
                message: 'Numéro de carte invalide',
                test: (value) => {
                    const cleanValue = value.replace(/\s/g, '');
                    if (!/^\d{13,19}$/.test(cleanValue)) return false;
                    
                    // Algorithme de Luhn
                    let sum = 0;
                    let isEven = false;
                    for (let i = cleanValue.length - 1; i >= 0; i--) {
                        let digit = parseInt(cleanValue[i]);
                        if (isEven) {
                            digit *= 2;
                            if (digit > 9) digit -= 9;
                        }
                        sum += digit;
                        isEven = !isEven;
                    }
                    return sum % 10 === 0;
                }
            },
            'iban': {
                message: 'IBAN invalide',
                test: (value) => {
                    const iban = value.replace(/\s/g, '').toUpperCase();
                    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
                    
                    // Vérification du checksum IBAN
                    const rearranged = iban.slice(4) + iban.slice(0, 4);
                    const numeric = rearranged.replace(/[A-Z]/g, char => char.charCodeAt(0) - 55);
                    const remainder = numeric.match(/.{1,9}/g).reduce((acc, val) => (acc + val) % 97, '');
                    return remainder === '1';
                }
            },
            'uuid': {
                message: 'UUID invalide',
                test: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
            },
            'json': {
                message: 'JSON invalide',
                test: (value) => {
                    try {
                        JSON.parse(value);
                        return true;
                    } catch {
                        return false;
                    }
                }
            },
            'hex': {
                message: 'Couleur hexadécimale invalide',
                test: (value) => /^#[0-9A-F]{6}$/i.test(value)
            },
            'rgb': {
                message: 'Couleur RGB invalide',
                test: (value) => /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(value)
            },
            'ipv4': {
                message: 'Adresse IPv4 invalide',
                test: (value) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)
            },
            'ipv6': {
                message: 'Adresse IPv6 invalide',
                test: (value) => /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(value)
            }
        },

        // Fonctionnalités
        features: {
            // Validation
            validation: {
                trigger: 'blur', // 'change', 'blur', 'submit', 'realtime'
                delay: 300,
                showErrors: true,
                scrollToError: true,
                focusOnError: true,
                validateOnMount: false,
                abortEarly: false
            },
            
            // Auto-save
            autosave: {
                enabled: false,
                interval: 30000, // 30 secondes
                debounce: 1000,
                storage: 'localStorage',
                key: 'form-autosave',
                restore: true,
                notification: true
            },
            
            // Progress
            progress: {
                enabled: false,
                position: 'top',
                style: 'bar', // 'bar', 'circle', 'steps'
                showPercentage: true,
                animated: true,
                color: '#3b82f6'
            },
            
            // Steps/Wizard
            steps: {
                enabled: false,
                navigation: true,
                validation: 'step', // 'step', 'all', 'none'
                allowSkip: false,
                showProgress: true,
                animation: 'slide',
                persist: true
            },
            
            // Conditional fields
            conditional: {
                enabled: false,
                animation: 'fade',
                validateHidden: false,
                clearHidden: true
            },
            
            // Tooltips
            tooltips: {
                enabled: true,
                position: 'top',
                trigger: 'hover', // 'hover', 'focus', 'click'
                delay: 500,
                animation: 'fade'
            },
            
            // Accessibility
            accessibility: {
                announceErrors: true,
                keyboardNavigation: true,
                focusManagement: true,
                highContrast: false,
                reducedMotion: false
            },
            
            // Localization
            localization: {
                locale: 'fr-FR',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: 'HH:mm',
                currency: 'EUR',
                translations: {}
            }
        },

        // Messages par défaut
        messages: {
            // Messages généraux
            loading: 'Chargement...',
            submitting: 'Envoi en cours...',
            success: 'Formulaire envoyé avec succès !',
            error: 'Une erreur est survenue',
            
            // Validation
            required: 'Ce champ est requis',
            invalid: 'Valeur invalide',
            tooShort: 'Trop court',
            tooLong: 'Trop long',
            
            // Fichiers
            fileTooBig: 'Fichier trop volumineux',
            wrongFileType: 'Type de fichier non autorisé',
            uploadError: 'Erreur lors du téléchargement',
            
            // Actions
            save: 'Enregistrer',
            cancel: 'Annuler',
            reset: 'Réinitialiser',
            submit: 'Envoyer',
            next: 'Suivant',
            previous: 'Précédent',
            finish: 'Terminer',
            
            // Confirmations
            confirmReset: 'Êtes-vous sûr de vouloir réinitialiser le formulaire ?',
            confirmCancel: 'Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.',
            unsavedChanges: 'Vous avez des modifications non enregistrées.',
            
            // Tooltips
            passwordStrength: 'Force du mot de passe',
            characterCount: 'caractères',
            optional: 'Optionnel',
            
            // Progress
            step: 'Étape',
            of: 'sur',
            completed: 'Complété'
        },

        // Icônes
        icons: {
            // États
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳',
            
            // Actions
            add: '➕',
            remove: '➖',
            edit: '✏️',
            delete: '🗑️',
            save: '💾',
            cancel: '❌',
            reset: '🔄',
            submit: '📤',
            
            // Navigation
            next: '→',
            previous: '←',
            up: '↑',
            down: '↓',
            
            // Fichiers
            upload: '📤',
            download: '📥',
            file: '📄',
            image: '🖼️',
            
            // Autres
            calendar: '📅',
            time: '⏰',
            search: '🔍',
            filter: '🔽',
            settings: '⚙️',
            help: '❓',
            close: '✖️',
            check: '✓',
            eye: '👁️',
            eyeOff: '🙈'
        },

        // CSS Keyframes
        keyframes: `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes bounceIn {
                0% {
                    opacity: 0;
                    transform: scale(0.3);
                }
                50% {
                    transform: scale(1.05);
                }
                70% {
                    transform: scale(0.9);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                20%, 40%, 60%, 80% { transform: translateX(4px); }
            }
            
            @keyframes pulse {
                0%, 100% { 
                    opacity: 1;
                    transform: scale(1);
                }
                50% { 
                    opacity: 0.8;
                    transform: scale(0.98);
                }
            }
            
            @keyframes focusPulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
                }
                100% {
                    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
                }
            }
            
            @keyframes labelFloat {
                from {
                    transform: translateY(0);
                    font-size: 16px;
                    color: #9e9e9e;
                }
                to {
                    transform: translateY(-24px);
                    font-size: 12px;
                    color: #3b82f6;
                }
            }
            
            @keyframes errorShake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            
            @keyframes successBounce {
                0%, 100% { transform: scale(1); }
                30% { transform: scale(1.1); }
                60% { transform: scale(0.95); }
            }
            
            @keyframes fieldHover {
                from {
                    transform: translateY(0);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                to {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                }
            }
            
            @keyframes typingPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            @keyframes submitWave {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.05);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes progressSlide {
                from {
                    transform: scaleX(0);
                    transform-origin: left;
                }
                to {
                    transform: scaleX(1);
                    transform-origin: left;
                }
            }
            
            @keyframes fieldDrop {
                0% {
                    opacity: 0;
                    transform: translateY(-50px) rotate(-5deg);
                }
                50% {
                    transform: translateY(10px) rotate(2deg);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) rotate(0);
                }
            }
            
            @keyframes validationSlide {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                    max-height: 0;
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                    max-height: 100px;
                }
            }
            
            @keyframes charBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            @keyframes neonGlow {
                0%, 100% {
                    text-shadow: 0 0 10px #8b5cf6,
                                 0 0 20px #8b5cf6,
                                 0 0 30px #8b5cf6;
                }
                50% {
                    text-shadow: 0 0 20px #8b5cf6,
                                 0 0 30px #8b5cf6,
                                 0 0 40px #8b5cf6;
                }
            }
            
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
        `
    };

    // 🔧 MÉTHODES PRIVÉES
    let stylesInjected = false;
    let formInstances = new Map();
    let instanceCounter = 0;

    /**
     * Classe FormBuilder
     */
    class FormBuilder {
        constructor(options) {
            this.id = `ui-form-${++instanceCounter}`;
            this.options = this.mergeOptions(options);
            this.fields = new Map();
            this.values = {};
            this.errors = {};
            this.touched = {};
            this.dirty = false;
            this.submitting = false;
            this.currentStep = 0;
            this.history = [];
            
            this.init();
        }

        /**
         * Fusionner les options
         */
        mergeOptions(options) {
            const defaults = {
                fields: [],
                layout: 'single-column',
                style: 'glassmorphism',
                animation: 'smooth',
                validation: 'blur',
                features: {},
                initialValues: {},
                onSubmit: async () => {},
                onChange: null,
                onValidate: null,
                className: '',
                id: ''
            };

            // Fusionner les features
            const features = {};
            Object.keys(CONFIG.features).forEach(key => {
                features[key] = {
                    ...CONFIG.features[key],
                    ...(options.features?.[key] || {})
                };
            });

            return {
                ...defaults,
                ...options,
                features
            };
        }

        /**
         * Initialiser le formulaire
         */
        async init() {
            // Injecter les styles
            if (!stylesInjected) {
                this.injectStyles();
            }

            // Créer la structure DOM
            this.createDOM();

            // Initialiser les valeurs
            this.values = { ...this.options.initialValues };

            // Créer les champs
            await this.createFields();

            // Initialiser les fonctionnalités
            this.initFeatures();

            // Appliquer les animations
            this.applyAnimations();

            // Charger l'autosave si activé
            if (this.options.features.autosave?.enabled && this.options.features.autosave?.restore) {
                this.loadAutosave();
            }

            // Sauvegarder l'instance
            formInstances.set(this.id, this);
        }

        /**
         * Créer la structure DOM
         */
        createDOM() {
            // Container principal
            this.container = document.createElement('form');
            this.container.className = `ui-form ${this.options.style} ${this.options.layout} ${this.options.className}`;
            this.container.id = this.options.id || this.id;
            this.container.noValidate = true; // Validation custom

            // Appliquer les styles
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            this.applyStyles(this.container, styleConfig.container);

            // Progress bar
            if (this.options.features.progress?.enabled || this.options.features.steps?.enabled) {
                this.progressBar = this.createProgressBar();
                this.container.appendChild(this.progressBar);
            }

            // Steps navigation
            if (this.options.features.steps?.enabled) {
                this.stepsNav = this.createStepsNavigation();
                this.container.appendChild(this.stepsNav);
            }

            // Fields container
            this.fieldsContainer = document.createElement('div');
            this.fieldsContainer.className = 'form-fields';
            
            // Appliquer le layout
            this.applyLayout();
            
            this.container.appendChild(this.fieldsContainer);

            // Actions
            this.actionsContainer = this.createActions();
            this.container.appendChild(this.actionsContainer);

            // Événements du formulaire
            this.container.addEventListener('submit', (e) => this.handleSubmit(e));
            this.container.addEventListener('reset', (e) => this.handleReset(e));

            // Prévenir la perte de données
            if (this.options.features.autosave?.enabled || this.options.features.validation?.trigger === 'realtime') {
                window.addEventListener('beforeunload', (e) => {
                    if (this.dirty && !this.submitting) {
                        e.preventDefault();
                        e.returnValue = CONFIG.messages.unsavedChanges;
                    }
                });
            }
        }

        /**
         * Créer la barre de progression
         */
        createProgressBar() {
            const container = document.createElement('div');
            container.className = 'form-progress';
            
            const bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.style.width = '0%';
            
            if (this.options.features.progress?.showPercentage) {
                const text = document.createElement('span');
                text.className = 'progress-text';
                text.textContent = '0%';
                bar.appendChild(text);
            }
            
            container.appendChild(bar);
            return container;
        }

        /**
         * Créer la navigation par étapes
         */
        createStepsNavigation() {
            const nav = document.createElement('div');
            nav.className = 'form-steps-nav';
            
            const steps = this.getSteps();
            steps.forEach((step, index) => {
                const stepEl = document.createElement('div');
                stepEl.className = 'step';
                if (index === 0) stepEl.classList.add('active');
                
                const number = document.createElement('span');
                number.className = 'step-number';
                number.textContent = index + 1;
                
                const label = document.createElement('span');
                label.className = 'step-label';
                label.textContent = step.label || `Étape ${index + 1}`;
                
                stepEl.appendChild(number);
                stepEl.appendChild(label);
                
                if (this.options.features.steps?.navigation) {
                    stepEl.addEventListener('click', () => this.goToStep(index));
                }
                
                nav.appendChild(stepEl);
                
                if (index < steps.length - 1) {
                    const connector = document.createElement('div');
                    connector.className = 'step-connector';
                    nav.appendChild(connector);
                }
            });
            
            return nav;
        }

        /**
         * Créer les actions
         */
        createActions() {
            const container = document.createElement('div');
            container.className = 'form-actions';
            
            // Bouton précédent (pour steps)
            if (this.options.features.steps?.enabled) {
                this.prevButton = this.createButton({
                    text: CONFIG.messages.previous,
                    type: 'button',
                    className: 'btn-previous',
                    onClick: () => this.previousStep()
                });
                container.appendChild(this.prevButton);
            }
            
            // Bouton réinitialiser
            if (this.options.showReset !== false) {
                const resetBtn = this.createButton({
                    text: CONFIG.messages.reset,
                    type: 'reset',
                    className: 'btn-reset',
                    variant: 'secondary'
                });
                container.appendChild(resetBtn);
            }
            
            // Bouton suivant/soumettre
            if (this.options.features.steps?.enabled) {
                this.nextButton = this.createButton({
                    text: CONFIG.messages.next,
                    type: 'button',
                    className: 'btn-next',
                    variant: 'primary',
                    onClick: () => this.nextStep()
                });
                container.appendChild(this.nextButton);
            }
            
            // Bouton soumettre
            this.submitButton = this.createButton({
                text: this.options.submitText || CONFIG.messages.submit,
                type: 'submit',
                className: 'btn-submit',
                variant: 'primary'
            });
            
            if (!this.options.features.steps?.enabled) {
                container.appendChild(this.submitButton);
            }
            
            return container;
        }

        /**
         * Créer un bouton
         */
        createButton(options) {
            const button = document.createElement('button');
            button.type = options.type || 'button';
            button.className = `form-button ${options.className} ${options.variant || ''}`;
            button.textContent = options.text;
            
            if (options.onClick) {
                button.addEventListener('click', options.onClick);
            }
            
            // Appliquer les styles
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            if (styleConfig.button) {
                this.applyStyles(button, styleConfig.button);
            }
            
            return button;
        }

        /**
         * Appliquer le layout
         */
        applyLayout() {
            const layoutConfig = CONFIG.layouts[this.options.layout] || CONFIG.layouts['single-column'];
            
            if (layoutConfig.columns) {
                this.fieldsContainer.style.display = 'grid';
                if (layoutConfig.columns === 'auto') {
                    this.fieldsContainer.style.gridTemplateColumns = `repeat(auto-fit, minmax(${layoutConfig.minWidth || '300px'}, 1fr))`;
                } else {
                    this.fieldsContainer.style.gridTemplateColumns = `repeat(${layoutConfig.columns}, 1fr)`;
                }
                this.fieldsContainer.style.gap = layoutConfig.gap || '24px';
            } else if (layoutConfig.display) {
                this.fieldsContainer.style.display = layoutConfig.display;
                if (layoutConfig.gap) {
                    this.fieldsContainer.style.gap = layoutConfig.gap;
                }
                if (layoutConfig.wrap) {
                    this.fieldsContainer.style.flexWrap = 'wrap';
                }
            }
            
            // Responsive
            if (layoutConfig.responsive && layoutConfig.breakpoint) {
                const mediaQuery = window.matchMedia(`(max-width: ${layoutConfig.breakpoint}px)`);
                const handleBreakpoint = (e) => {
                    if (e.matches) {
                        this.fieldsContainer.style.gridTemplateColumns = '1fr';
                    } else {
                        this.applyLayout();
                    }
                };
                mediaQuery.addListener(handleBreakpoint);
                handleBreakpoint(mediaQuery);
            }
        }

        /**
         * Créer les champs
         */
        async createFields() {
            const fields = this.options.features.steps?.enabled 
                ? this.getCurrentStepFields() 
                : this.options.fields;
                
            for (const fieldConfig of fields) {
                const field = await this.createField(fieldConfig);
                if (field) {
                    this.fields.set(fieldConfig.name, field);
                    this.fieldsContainer.appendChild(field.container);
                }
            }
        }

        /**
         * Créer un champ
         */
        async createField(config) {
            const fieldType = CONFIG.fieldTypes[config.type];
            if (!fieldType) {
                console.warn(`Type de champ inconnu: ${config.type}`);
                return null;
            }
            
            // Container du champ
            const container = document.createElement('div');
            container.className = `form-field field-${config.type} ${config.className || ''}`;
            container.dataset.name = config.name;
            
            // Largeur personnalisée
            if (config.width) {
                container.style.gridColumn = `span ${config.width}`;
            }
            
            // Appliquer les styles
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            if (styleConfig.field) {
                this.applyStyles(container, styleConfig.field);
            }
            
            // Label
            if (config.label && config.type !== 'checkbox' && config.type !== 'radio') {
                const label = document.createElement('label');
                label.className = 'form-label';
                label.htmlFor = `${this.id}-${config.name}`;
                label.innerHTML = config.label;
                
                if (config.required) {
                    label.innerHTML += ' <span class="required">*</span>';
                }
                
                if (styleConfig.label) {
                    this.applyStyles(label, styleConfig.label);
                }
                
                container.appendChild(label);
            }
            
            // Créer l'input selon le type
            let input;
            switch (config.type) {
                case 'select':
                case 'multiselect':
                    input = this.createSelect(config, fieldType);
                    break;
                    
                case 'textarea':
                    input = this.createTextarea(config, fieldType);
                    break;
                    
                case 'radio':
                case 'checkboxgroup':
                    input = this.createGroup(config, fieldType);
                    break;
                    
                case 'file':
                case 'image':
                case 'avatar':
                    input = await this.createFileInput(config, fieldType);
                    break;
                    
                case 'richtext':
                case 'markdown':
                case 'code':
                    input = await this.createRichEditor(config, fieldType);
                    break;
                    
                case 'range':
                case 'slider':
                    input = this.createSlider(config, fieldType);
                    break;
                    
                case 'rating':
                    input = this.createRating(config, fieldType);
                    break;
                    
                case 'tags':
                case 'chips':
                    input = this.createTags(config, fieldType);
                    break;
                    
                case 'daterange':
                    input = this.createDateRange(config, fieldType);
                    break;
                    
                case 'color':
                    input = this.createColorPicker(config, fieldType);
                    break;
                    
                case 'location':
                case 'address':
                    input = await this.createLocationInput(config, fieldType);
                    break;
                    
                case 'signature':
                    input = this.createSignature(config, fieldType);
                    break;
                    
                case 'otp':
                case 'pin':
                    input = this.createOTP(config, fieldType);
                    break;
                    
                case 'toggle':
                case 'switch':
                    input = this.createToggle(config, fieldType);
                    break;
                    
                default:
                    input = this.createInput(config, fieldType);
            }
            
            // Wrapper pour l'input
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'form-input-wrapper';
            
            // Icône
            if (config.icon || fieldType.icon) {
                const icon = document.createElement('span');
                icon.className = 'form-icon';
                icon.innerHTML = config.icon || fieldType.icon;
                inputWrapper.appendChild(icon);
            }
            
            // Ajouter l'input
            if (input instanceof Element) {
                inputWrapper.appendChild(input);
            } else if (input?.element) {
                inputWrapper.appendChild(input.element);
            }
            
            // Features additionnelles
            if (config.clearable && ['text', 'email', 'search', 'tel', 'url'].includes(config.type)) {
                const clearBtn = document.createElement('button');
                clearBtn.type = 'button';
                clearBtn.className = 'form-clear';
                clearBtn.innerHTML = CONFIG.icons.close;
                clearBtn.style.display = 'none';
                clearBtn.addEventListener('click', () => {
                    input.value = '';
                    this.handleChange(config.name, '');
                    clearBtn.style.display = 'none';
                });
                inputWrapper.appendChild(clearBtn);
                
                // Afficher/masquer le bouton clear
                input.addEventListener('input', () => {
                    clearBtn.style.display = input.value ? 'block' : 'none';
                });
            }
            
            // Compteur de caractères
            if (config.counter && (config.maxLength || config.maxlength)) {
                const counter = document.createElement('div');
                counter.className = 'form-counter';
                const maxLength = config.maxLength || config.maxlength;
                counter.textContent = `0 / ${maxLength}`;
                inputWrapper.appendChild(counter);
                
                const updateCounter = () => {
                    const length = input.value.length;
                    counter.textContent = `${length} / ${maxLength}`;
                    counter.classList.toggle('error', length > maxLength);
                };
                
                input.addEventListener('input', updateCounter);
            }
            
            container.appendChild(inputWrapper);
            
            // Description
            if (config.description) {
                const description = document.createElement('div');
                description.className = 'form-description';
                description.textContent = config.description;
                container.appendChild(description);
            }
            
            // Conteneur d'erreur
            const errorContainer = document.createElement('div');
            errorContainer.className = 'form-error';
            errorContainer.style.display = 'none';
            container.appendChild(errorContainer);
            
            // Tooltip
            if (config.tooltip) {
                this.addTooltip(container, config.tooltip);
            }
            
            // Conditional display
            if (config.condition) {
                this.addConditionalLogic(container, config.condition);
            }
            
            // Événements
            this.attachFieldEvents(input, config);
            
            return {
                container,
                input: input?.element || input,
                config,
                getValue: () => this.getFieldValue(input, config),
                setValue: (value) => this.setFieldValue(input, config, value),
                validate: () => this.validateField(config.name),
                reset: () => this.resetField(config.name)
            };
        }

        /**
         * Créer un input standard
         */
        createInput(config, fieldType) {
            const input = document.createElement('input');
            input.type = fieldType.type || config.type;
            input.id = `${this.id}-${config.name}`;
            input.name = config.name;
            input.className = 'form-input';
            
            // Attributs
            if (config.placeholder) input.placeholder = config.placeholder;
            if (config.required) input.required = true;
            if (config.disabled) input.disabled = true;
            if (config.readonly) input.readOnly = true;
            if (config.pattern) input.pattern = config.pattern;
            if (config.min !== undefined) input.min = config.min;
            if (config.max !== undefined) input.max = config.max;
            if (config.step !== undefined) input.step = config.step;
            if (config.maxLength || config.maxlength) input.maxLength = config.maxLength || config.maxlength;
            if (config.autocomplete) input.autocomplete = config.autocomplete;
            
            // Valeur initiale
            if (this.values[config.name] !== undefined) {
                input.value = this.values[config.name];
            } else if (config.defaultValue !== undefined) {
                input.value = config.defaultValue;
                this.values[config.name] = config.defaultValue;
            }
            
            // Styles
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            if (styleConfig.input) {
                this.applyStyles(input, styleConfig.input);
            }
            
            // Features spéciales
            if (config.type === 'password' && config.showToggle) {
                return this.createPasswordInput(input, config);
            }
            
            if (config.mask) {
                this.applyMask(input, config.mask);
            }
            
            if (config.formatter) {
                this.applyFormatter(input, config.formatter);
            }
            
            return input;
        }

        /**
         * Créer un select
         */
        createSelect(config, fieldType) {
            if (config.searchable || config.multiple || config.features?.includes('search')) {
                return this.createAdvancedSelect(config, fieldType);
            }
            
            const select = document.createElement('select');
            select.id = `${this.id}-${config.name}`;
            select.name = config.name;
            select.className = 'form-select';
            
            if (config.multiple || fieldType.multiple) {
                select.multiple = true;
            }
            
            if (config.required) select.required = true;
            if (config.disabled) select.disabled = true;
            
            // Placeholder
            if (config.placeholder) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = config.placeholder;
                option.disabled = true;
                option.selected = true;
                select.appendChild(option);
            }
            
            // Options
            if (config.options) {
                this.populateSelectOptions(select, config.options);
            }
            
            // Valeur initiale
            if (this.values[config.name] !== undefined) {
                select.value = this.values[config.name];
            } else if (config.defaultValue !== undefined) {
                select.value = config.defaultValue;
                this.values[config.name] = config.defaultValue;
            }
            
            // Styles
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            if (styleConfig.input) {
                this.applyStyles(select, styleConfig.input);
            }
            
            return select;
        }

        /**
         * Créer un select avancé
         */
        createAdvancedSelect(config, fieldType) {
            const container = document.createElement('div');
            container.className = 'advanced-select';
            
            // Input de recherche
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'select-search';
            searchInput.placeholder = config.placeholder || 'Rechercher...';
            
            // Container des options
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'select-options';
            optionsContainer.style.display = 'none';
            
            // Tags pour multi-select
            let tagsContainer;
            if (config.multiple) {
                tagsContainer = document.createElement('div');
                tagsContainer.className = 'select-tags';
                container.appendChild(tagsContainer);
            }
            
            container.appendChild(searchInput);
            container.appendChild(optionsContainer);
            
            // Logique du select avancé
            let selectedValues = config.multiple ? [] : null;
            
            const updateDisplay = () => {
                if (config.multiple) {
                    tagsContainer.innerHTML = '';
                    selectedValues.forEach(value => {
                        const tag = document.createElement('span');
                        tag.className = 'select-tag';
                        tag.innerHTML = `
                            <span>${this.getOptionLabel(value, config.options)}</span>
                            <button type="button" class="tag-remove">${CONFIG.icons.close}</button>
                        `;
                        tag.querySelector('.tag-remove').addEventListener('click', () => {
                            selectedValues = selectedValues.filter(v => v !== value);
                            updateDisplay();
                            this.handleChange(config.name, selectedValues);
                        });
                        tagsContainer.appendChild(tag);
                    });
                } else {
                    searchInput.value = selectedValues ? this.getOptionLabel(selectedValues, config.options) : '';
                }
            };
            
            // Créer les options
            const createOptions = (options, search = '') => {
                optionsContainer.innerHTML = '';
                
                options.forEach(option => {
                    const value = option.value !== undefined ? option.value : option;
                    const label = option.label || option;
                    
                    if (search && !label.toLowerCase().includes(search.toLowerCase())) {
                        return;
                    }
                    
                    const optionEl = document.createElement('div');
                    optionEl.className = 'select-option';
                    if ((config.multiple && selectedValues.includes(value)) || 
                        (!config.multiple && selectedValues === value)) {
                        optionEl.classList.add('selected');
                    }
                    
                    optionEl.innerHTML = `
                        ${config.multiple ? `<input type="checkbox" ${selectedValues.includes(value) ? 'checked' : ''}>` : ''}
                        ${option.icon ? `<span class="option-icon">${option.icon}</span>` : ''}
                        <span class="option-label">${label}</span>
                        ${option.description ? `<span class="option-description">${option.description}</span>` : ''}
                    `;
                    
                    optionEl.addEventListener('click', () => {
                        if (config.multiple) {
                            if (selectedValues.includes(value)) {
                                selectedValues = selectedValues.filter(v => v !== value);
                            } else {
                                selectedValues.push(value);
                            }
                        } else {
                            selectedValues = value;
                            optionsContainer.style.display = 'none';
                        }
                        
                        updateDisplay();
                        this.handleChange(config.name, config.multiple ? selectedValues : selectedValues);
                        
                        if (!config.multiple) {
                            searchInput.blur();
                        }
                    });
                    
                    optionsContainer.appendChild(optionEl);
                });
                
                if (options.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.className = 'select-no-results';
                    noResults.textContent = 'Aucun résultat';
                    optionsContainer.appendChild(noResults);
                }
            };
            
            // Initialiser les options
            if (config.options) {
                createOptions(config.options);
            }
            
            // Événements
            searchInput.addEventListener('focus', () => {
                optionsContainer.style.display = 'block';
                if (config.searchable) {
                    searchInput.select();
                }
            });
            
            searchInput.addEventListener('input', (e) => {
                if (config.searchable) {
                    createOptions(config.options, e.target.value);
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    optionsContainer.style.display = 'none';
                }
            });
            
            // Valeur initiale
            if (this.values[config.name] !== undefined) {
                selectedValues = this.values[config.name];
                updateDisplay();
            } else if (config.defaultValue !== undefined) {
                selectedValues = config.defaultValue;
                this.values[config.name] = config.defaultValue;
                updateDisplay();
            }
            
            return {
                element: container,
                getValue: () => selectedValues,
                setValue: (value) => {
                    selectedValues = value;
                    updateDisplay();
                }
            };
        }

        /**
         * Obtenir le label d'une option
         */
        getOptionLabel(value, options) {
            const option = options.find(opt => 
                (opt.value !== undefined ? opt.value : opt) === value
            );
            return option ? (option.label || option) : value;
        }

        /**
         * Peupler les options d'un select
         */
        populateSelectOptions(select, options) {
            options.forEach(option => {
                if (option.group) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = option.group;
                    option.options.forEach(subOption => {
                        optgroup.appendChild(this.createOption(subOption));
                    });
                    select.appendChild(optgroup);
                } else {
                    select.appendChild(this.createOption(option));
                }
            });
        }

        /**
         * Créer une option
         */
        createOption(option) {
            const optionEl = document.createElement('option');
            optionEl.value = option.value !== undefined ? option.value : option;
            optionEl.textContent = option.label || option;
            
            if (option.disabled) optionEl.disabled = true;
            if (option.selected) optionEl.selected = true;
            
            return optionEl;
        }

        /**
         * Créer un textarea
         */
        createTextarea(config, fieldType) {
            const textarea = document.createElement('textarea');
            textarea.id = `${this.id}-${config.name}`;
            textarea.name = config.name;
            textarea.className = 'form-textarea';
            
            if (config.placeholder) textarea.placeholder = config.placeholder;
            if (config.required) textarea.required = true;
            if (config.disabled) textarea.disabled = true;
            if (config.readonly) textarea.readOnly = true;
            if (config.rows) textarea.rows = config.rows;
            if (config.cols) textarea.cols = config.cols;
            if (config.maxLength || config.maxlength) textarea.maxLength = config.maxLength || config.maxlength;
            
            // Valeur initiale
            if (this.values[config.name] !== undefined) {
                textarea.value = this.values[config.name];
            } else if (config.defaultValue !== undefined) {
                textarea.value = config.defaultValue;
                this.values[config.name] = config.defaultValue;
            }
            
            // Auto-resize
            if (config.autoResize) {
                textarea.style.overflow = 'hidden';
                textarea.style.resize = 'none';
                
                const resize = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                };
                
                textarea.addEventListener('input', resize);
                setTimeout(resize, 0);
            }
            
            // Styles
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            if (styleConfig.input) {
                this.applyStyles(textarea, styleConfig.input);
            }
            
            return textarea;
        }

        /**
         * Créer un groupe (radio/checkbox)
         */
        createGroup(config, fieldType) {
            const container = document.createElement('div');
            container.className = `form-group ${config.inline ? 'inline' : ''}`;
            
            const options = config.options || [];
            const values = config.type === 'checkboxgroup' ? [] : null;
            
            options.forEach((option, index) => {
                const value = option.value !== undefined ? option.value : option;
                const label = option.label || option;
                
                const wrapper = document.createElement('label');
                wrapper.className = 'form-group-item';
                
                const input = document.createElement('input');
                input.type = config.type === 'checkboxgroup' ? 'checkbox' : 'radio';
                input.name = config.name;
                input.value = value;
                input.id = `${this.id}-${config.name}-${index}`;
                
                if (config.required && config.type === 'radio' && index === 0) {
                    input.required = true;
                }
                
                // Valeur initiale
                if (config.type === 'checkboxgroup') {
                    if (this.values[config.name]?.includes(value)) {
                        input.checked = true;
                    }
                } else {
                    if (this.values[config.name] === value) {
                        input.checked = true;
                    }
                }
                
                input.addEventListener('change', () => {
                    if (config.type === 'checkboxgroup') {
                        if (input.checked) {
                            values.push(value);
                        } else {
                            const index = values.indexOf(value);
                            if (index > -1) values.splice(index, 1);
                        }
                        this.handleChange(config.name, values);
                    } else {
                        this.handleChange(config.name, value);
                    }
                });
                
                const labelText = document.createElement('span');
                labelText.textContent = label;
                
                wrapper.appendChild(input);
                if (option.icon) {
                    const icon = document.createElement('span');
                    icon.className = 'group-icon';
                    icon.innerHTML = option.icon;
                    wrapper.appendChild(icon);
                }
                wrapper.appendChild(labelText);
                
                if (option.description) {
                    const desc = document.createElement('span');
                    desc.className = 'group-description';
                    desc.textContent = option.description;
                    wrapper.appendChild(desc);
                }
                
                container.appendChild(wrapper);
            });
            
            return {
                element: container,
                getValue: () => config.type === 'checkboxgroup' ? values : 
                    container.querySelector('input:checked')?.value,
                setValue: (value) => {
                    if (config.type === 'checkboxgroup') {
                        values.length = 0;
                        values.push(...(Array.isArray(value) ? value : [value]));
                        container.querySelectorAll('input').forEach(input => {
                            input.checked = values.includes(input.value);
                        });
                    } else {
                        container.querySelectorAll('input').forEach(input => {
                            input.checked = input.value === value;
                        });
                    }
                }
            };
        }

        /**
         * Créer un input password avec toggle
         */
        createPasswordInput(input, config) {
            const container = document.createElement('div');
            container.className = 'password-input-container';
            
            container.appendChild(input);
            
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'password-toggle';
            toggle.innerHTML = CONFIG.icons.eye;
            
            toggle.addEventListener('click', () => {
                if (input.type === 'password') {
                    input.type = 'text';
                    toggle.innerHTML = CONFIG.icons.eyeOff;
                } else {
                    input.type = 'password';
                    toggle.innerHTML = CONFIG.icons.eye;
                }
            });
            
            container.appendChild(toggle);
            
            // Indicateur de force
            if (config.strengthMeter) {
                const strengthMeter = document.createElement('div');
                strengthMeter.className = 'password-strength';
                
                const strengthBar = document.createElement('div');
                strengthBar.className = 'strength-bar';
                
                const strengthText = document.createElement('span');
                strengthText.className = 'strength-text';
                
                strengthMeter.appendChild(strengthBar);
                strengthMeter.appendChild(strengthText);
                
                input.addEventListener('input', () => {
                    const strength = this.calculatePasswordStrength(input.value);
                    strengthBar.style.width = `${strength.score * 25}%`;
                    strengthBar.className = `strength-bar strength-${strength.level}`;
                    strengthText.textContent = strength.text;
                });
                
                container.appendChild(strengthMeter);
            }
            
            return {
                element: container,
                getValue: () => input.value,
                setValue: (value) => { input.value = value; }
            };
        }

        /**
         * Calculer la force d'un mot de passe
         */
        calculatePasswordStrength(password) {
            let score = 0;
            const checks = {
                length: password.length >= 8,
                lowercase: /[a-z]/.test(password),
                uppercase: /[A-Z]/.test(password),
                numbers: /\d/.test(password),
                special: /[^A-Za-z0-9]/.test(password)
            };
            
            Object.values(checks).forEach(passed => {
                if (passed) score++;
            });
            
            if (password.length >= 12) score++;
            if (password.length >= 16) score++;
            
            const levels = [
                { score: 0, level: 'weak', text: 'Faible' },
                { score: 2, level: 'fair', text: 'Moyen' },
                { score: 4, level: 'good', text: 'Bon' },
                { score: 6, level: 'strong', text: 'Fort' }
            ];
            
            const level = levels.reverse().find(l => score >= l.score) || levels[0];
            
            return {
                score: Math.min(score / 4, 1),
                level: level.level,
                text: level.text,
                checks
            };
        }

        /**
         * Appliquer un masque
         */
        applyMask(input, mask) {
            // Implementation simple du masquage
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                let masked = '';
                let valueIndex = 0;
                
                for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
                    if (mask[i] === '9') {
                        masked += value[valueIndex++];
                    } else {
                        masked += mask[i];
                    }
                }
                
                e.target.value = masked;
            });
        }

        /**
         * Appliquer un formateur
         */
        applyFormatter(input, formatter) {
            input.addEventListener('blur', (e) => {
                const value = e.target.value;
                
                switch (formatter) {
                    case 'currency':
                        e.target.value = this.formatCurrency(value);
                        break;
                    case 'number':
                        e.target.value = this.formatNumber(value);
                        break;
                    case 'phone':
                        e.target.value = this.formatPhone(value);
                        break;
                }
            });
        }

        /**
         * Formater en devise
         */
        formatCurrency(value) {
            const number = parseFloat(value.replace(/[^\d.-]/g, ''));
            if (isNaN(number)) return value;
            
            return new Intl.NumberFormat(
                this.options.features.localization?.locale || 'fr-FR',
                {
                    style: 'currency',
                    currency: this.options.features.localization?.currency || 'EUR'
                }
            ).format(number);
        }

        /**
         * Formater un nombre
         */
        formatNumber(value) {
            const number = parseFloat(value.replace(/[^\d.-]/g, ''));
            if (isNaN(number)) return value;
            
            return new Intl.NumberFormat(
                this.options.features.localization?.locale || 'fr-FR'
            ).format(number);
        }

        /**
         * Formater un téléphone
         */
        formatPhone(value) {
            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length === 10) {
                return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
            }
            return value;
        }

        /**
         * Créer un champ fichier
         */
        async createFileInput(config, fieldType) {
            const container = document.createElement('div');
            container.className = 'file-input-container';
            
            const input = document.createElement('input');
            input.type = 'file';
            input.id = `${this.id}-${config.name}`;
            input.name = config.name;
            input.className = 'file-input';
            input.style.display = 'none';
            
            if (config.accept || fieldType.accept) {
                input.accept = config.accept || fieldType.accept;
            }
            if (config.multiple) {
                input.multiple = true;
            }
            
            // Zone de drop
            const dropZone = document.createElement('div');
            dropZone.className = 'file-drop-zone';
            dropZone.innerHTML = `
                <div class="drop-icon">${config.icon || fieldType.icon}</div>
                <div class="drop-text">
                    ${config.dropText || 'Glissez-déposez ou cliquez pour sélectionner'}
                </div>
                <button type="button" class="file-select-btn">
                    Parcourir
                </button>
            `;
            
            // Preview container
            const previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview-container';
            
            // Événements
            const handleFiles = (files) => {
                const validFiles = [];
                
                Array.from(files).forEach(file => {
                    // Validation
                    if (config.maxSize && file.size > config.maxSize) {
                        this.showFieldError(config.name, CONFIG.messages.fileTooBig);
                        return;
                    }
                    
                    if (config.accept && !this.isAcceptedFileType(file, config.accept)) {
                        this.showFieldError(config.name, CONFIG.messages.wrongFileType);
                        return;
                    }
                    
                    validFiles.push(file);
                    
                    // Preview
                    if (config.preview !== false) {
                        this.createFilePreview(file, previewContainer, config);
                    }
                });
                
                if (validFiles.length > 0) {
                    this.handleChange(config.name, config.multiple ? validFiles : validFiles[0]);
                }
            };
            
            input.addEventListener('change', (e) => handleFiles(e.target.files));
            
            dropZone.addEventListener('click', () => input.click());
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragging');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragging');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragging');
                handleFiles(e.dataTransfer.files);
            });
            
            container.appendChild(input);
            container.appendChild(dropZone);
            container.appendChild(previewContainer);
            
            return {
                element: container,
                getValue: () => this.values[config.name],
                setValue: (value) => {
                    // Les fichiers ne peuvent pas être définis programmatiquement
                    console.warn('Les fichiers ne peuvent pas être définis programmatiquement');
                }
            };
        }

        /**
         * Vérifier le type de fichier
         */
        isAcceptedFileType(file, accept) {
            const accepts = accept.split(',').map(a => a.trim());
            
            return accepts.some(acceptType => {
                if (acceptType.startsWith('.')) {
                    return file.name.endsWith(acceptType);
                } else if (acceptType.includes('*')) {
                    const [type, subtype] = acceptType.split('/');
                    const [fileType] = file.type.split('/');
                    return type === fileType;
                } else {
                    return file.type === acceptType;
                }
            });
        }

        /**
         * Créer une preview de fichier
         */
        createFilePreview(file, container, config) {
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            
            const info = document.createElement('div');
            info.className = 'file-info';
            
            // Icône ou image
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.className = 'file-preview-image';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                    
                    // Crop pour avatar
                    if (config.type === 'avatar' && config.crop) {
                        this.initImageCropper(img, file, config);
                    }
                };
                reader.readAsDataURL(file);
                
                preview.appendChild(img);
            } else {
                const icon = document.createElement('div');
                icon.className = 'file-icon';
                icon.textContent = this.getFileIcon(file.type);
                preview.appendChild(icon);
            }
            
            // Infos du fichier
            info.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
            `;
            
            // Bouton supprimer
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'file-remove';
            removeBtn.innerHTML = CONFIG.icons.close;
            removeBtn.addEventListener('click', () => {
                preview.remove();
                // Mettre à jour la valeur
                if (config.multiple) {
                    const files = this.values[config.name] || [];
                    const index = files.indexOf(file);
                    if (index > -1) {
                        files.splice(index, 1);
                        this.handleChange(config.name, files);
                    }
                } else {
                    this.handleChange(config.name, null);
                }
            });
            
            preview.appendChild(info);
            preview.appendChild(removeBtn);
            
            // Progress bar pour upload
            if (config.upload) {
                const progressBar = document.createElement('div');
                progressBar.className = 'file-progress';
                progressBar.innerHTML = '<div class="progress-bar"></div>';
                preview.appendChild(progressBar);
                
                // Simuler un upload
                this.uploadFile(file, config, progressBar);
            }
            
            container.appendChild(preview);
        }

        /**
         * Obtenir l'icône d'un fichier
         */
        getFileIcon(type) {
            if (type.startsWith('image/')) return '🖼️';
            if (type.startsWith('video/')) return '🎥';
            if (type.startsWith('audio/')) return '🎵';
            if (type.includes('pdf')) return '📄';
            if (type.includes('zip') || type.includes('rar')) return '🗜️';
            if (type.includes('word') || type.includes('document')) return '📝';
            if (type.includes('sheet') || type.includes('excel')) return '📊';
            return '📎';
        }

        /**
         * Formater la taille d'un fichier
         */
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        /**
         * Upload un fichier
         */
        async uploadFile(file, config, progressBar) {
            if (!config.upload || !config.uploadUrl) return;
            
            const formData = new FormData();
            formData.append(config.name, file);
            
            try {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        progressBar.querySelector('.progress-bar').style.width = percentComplete + '%';
                    }
                });
                
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        progressBar.classList.add('complete');
                        const response = JSON.parse(xhr.responseText);
                        // Stocker l'URL du fichier uploadé
                        this.handleChange(`${config.name}_url`, response.url);
                    } else {
                        progressBar.classList.add('error');
                        this.showFieldError(config.name, CONFIG.messages.uploadError);
                    }
                });
                
                xhr.addEventListener('error', () => {
                    progressBar.classList.add('error');
                    this.showFieldError(config.name, CONFIG.messages.uploadError);
                });
                
                xhr.open('POST', config.uploadUrl);
                xhr.send(formData);
            } catch (error) {
                console.error('Erreur upload:', error);
                progressBar.classList.add('error');
                this.showFieldError(config.name, CONFIG.messages.uploadError);
            }
        }

        /**
         * Attacher les événements d'un champ
         */
        attachFieldEvents(input, config) {
            const inputEl = input?.element || input;
            if (!inputEl || !inputEl.addEventListener) return;
            
            // Change event
            inputEl.addEventListener('change', (e) => {
                const value = this.getFieldValue(input, config);
                this.handleChange(config.name, value);
            });
            
            // Input event pour validation temps réel
            if (this.options.validation === 'realtime' || config.validation === 'realtime') {
                inputEl.addEventListener('input', (e) => {
                    const value = this.getFieldValue(input, config);
                    this.handleChange(config.name, value);
                    
                    // Debounce validation
                    clearTimeout(this.validationTimeout);
                    this.validationTimeout = setTimeout(() => {
                        this.validateField(config.name);
                    }, this.options.features.validation?.delay || 300);
                });
            }
            
            // Blur event pour validation
            if (this.options.validation === 'blur' || config.validation === 'blur') {
                inputEl.addEventListener('blur', () => {
                    this.touched[config.name] = true;
                    this.validateField(config.name);
                });
            }
            
            // Focus event
            inputEl.addEventListener('focus', () => {
                const container = inputEl.closest('.form-field');
                if (container) {
                    container.classList.add('focused');
                    
                    // Animation focus
                    const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
                    if (styleConfig.fieldFocus) {
                        this.applyStyles(container, styleConfig.fieldFocus);
                    }
                }
            });
            
            // Blur event pour styles
            inputEl.addEventListener('blur', () => {
                const container = inputEl.closest('.form-field');
                if (container) {
                    container.classList.remove('focused');
                    
                    // Retirer les styles focus
                    const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
                    if (styleConfig.field) {
                        this.applyStyles(container, styleConfig.field);
                    }
                }
            });
            
            // Hover events
            const container = inputEl.closest('.form-field');
            if (container) {
                container.addEventListener('mouseenter', () => {
                    if (!container.classList.contains('focused')) {
                        const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
                        if (styleConfig.fieldHover) {
                            this.applyStyles(container, styleConfig.fieldHover);
                        }
                    }
                });
                
                container.addEventListener('mouseleave', () => {
                    if (!container.classList.contains('focused')) {
                        const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
                        if (styleConfig.field) {
                            this.applyStyles(container, styleConfig.field);
                        }
                    }
                });
            }
        }

        /**
         * Gérer le changement d'une valeur
         */
        handleChange(name, value) {
            this.values[name] = value;
            this.dirty = true;
            
            // Callback onChange
            if (this.options.onChange) {
                this.options.onChange(name, value, this.values);
            }
            
            // Autosave
            if (this.options.features.autosave?.enabled) {
                this.scheduleAutosave();
            }
            
            // Mettre à jour la progression
            this.updateProgress();
            
            // Mettre à jour les conditions
            this.updateConditionalFields();
        }

        /**
         * Obtenir la valeur d'un champ
         */
        getFieldValue(input, config) {
            const inputEl = input?.element || input;
            
            if (input?.getValue) {
                return input.getValue();
            }
            
            switch (config.type) {
                case 'checkbox':
                    return inputEl.checked;
                    
                case 'number':
                case 'range':
                    return inputEl.valueAsNumber || parseFloat(inputEl.value);
                    
                case 'date':
                case 'datetime-local':
                    return inputEl.valueAsDate || inputEl.value;
                    
                case 'file':
                    return inputEl.files?.[0] || null;
                    
                default:
                    return inputEl.value;
            }
        }

        /**
         * Définir la valeur d'un champ
         */
        setFieldValue(input, config, value) {
            const inputEl = input?.element || input;
            
            if (input?.setValue) {
                input.setValue(value);
                return;
            }
            
            switch (config.type) {
                case 'checkbox':
                    inputEl.checked = !!value;
                    break;
                    
                case 'radio':
                    const radios = this.container.querySelectorAll(`input[name="${config.name}"]`);
                    radios.forEach(radio => {
                        radio.checked = radio.value === value;
                    });
                    break;
                    
                default:
                    inputEl.value = value || '';
            }
        }

        /**
         * Valider un champ
         */
        async validateField(name) {
            const field = this.fields.get(name);
            if (!field) return true;
            
            const { config } = field;
            const value = this.values[name];
            const errors = [];
            
            // Validation requise
            if (config.required) {
                const validation = CONFIG.validations.required;
                if (!validation.test(value)) {
                    errors.push(validation.message);
                }
            }
            
            // Autres validations
            if (config.validation && value !== undefined && value !== '') {
                const validations = Array.isArray(config.validation) 
                    ? config.validation 
                    : config.validation.split('|');
                    
                for (const rule of validations) {
                    if (typeof rule === 'function') {
                        // Validation personnalisée
                        const result = await rule(value, this.values);
                        if (result !== true) {
                            errors.push(result || CONFIG.messages.invalid);
                        }
                    } else {
                        // Validation prédéfinie
                        const [ruleName, ...params] = rule.split(':');
                        const validation = CONFIG.validations[ruleName];
                        
                        if (validation) {
                            const testParams = params.map(p => {
                                // Convertir les paramètres
                                if (!isNaN(p)) return Number(p);
                                if (p === 'true') return true;
                                if (p === 'false') return false;
                                return p;
                            });
                            
                            const isValid = await validation.test(value, ...testParams, this.values);
                            if (!isValid) {
                                const message = typeof validation.message === 'function'
                                    ? validation.message(...testParams)
                                    : validation.message;
                                errors.push(message);
                            }
                        }
                    }
                }
            }
            
            // Type-specific validations
            const fieldType = CONFIG.fieldTypes[config.type];
            if (fieldType?.validation) {
                // Ajouter les validations par défaut du type
            }
            
            // Mettre à jour les erreurs
            if (errors.length > 0) {
                this.errors[name] = errors;
                this.showFieldError(name, errors[0]);
            } else {
                delete this.errors[name];
                this.hideFieldError(name);
            }
            
            return errors.length === 0;
        }

        /**
         * Afficher une erreur de champ
         */
        showFieldError(name, message) {
            const field = this.fields.get(name);
            if (!field) return;
            
            const { container } = field;
            container.classList.add('error');
            
            const errorEl = container.querySelector('.form-error');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.style.display = 'block';
                
                // Animation
                if (this.options.animation !== 'none') {
                    errorEl.style.animation = 'validationSlide 0.3s ease';
                }
            }
            
            // Animation du champ
            const animConfig = CONFIG.animations[this.options.animation];
            if (animConfig?.field?.error) {
                container.style.animation = animConfig.field.error;
            }
        }

        /**
         * Masquer une erreur de champ
         */
        hideFieldError(name) {
            const field = this.fields.get(name);
            if (!field) return;
            
            const { container } = field;
            container.classList.remove('error');
            
            const errorEl = container.querySelector('.form-error');
            if (errorEl) {
                errorEl.style.display = 'none';
                errorEl.textContent = '';
            }
        }

        /**
         * Valider tout le formulaire
         */
        async validateForm() {
            const promises = [];
            
            for (const [name, field] of this.fields) {
                if (!this.isFieldVisible(field.container)) continue;
                promises.push(this.validateField(name));
            }
            
            const results = await Promise.all(promises);
            return results.every(result => result === true);
        }

        /**
         * Vérifier si un champ est visible
         */
        isFieldVisible(container) {
            return container.style.display !== 'none' && 
                   !container.classList.contains('hidden') &&
                   container.offsetParent !== null;
        }

        /**
         * Gérer la soumission
         */
        async handleSubmit(e) {
            e.preventDefault();
            
            if (this.submitting) return;
            
            // Marquer tous les champs comme touchés
            for (const name of this.fields.keys()) {
                this.touched[name] = true;
            }
            
            // Valider
            const isValid = await this.validateForm();
            
            if (!isValid) {
                // Scroll vers la première erreur
                if (this.options.features.validation?.scrollToError) {
                    const firstError = this.container.querySelector('.form-field.error');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                
                // Focus sur la première erreur
                if (this.options.features.validation?.focusOnError) {
                    const firstErrorInput = this.container.querySelector('.form-field.error .form-input');
                    if (firstErrorInput) {
                        firstErrorInput.focus();
                    }
                }
                
                return;
            }
            
            // Callback de validation personnalisée
            if (this.options.onValidate) {
                const customValid = await this.options.onValidate(this.values);
                if (!customValid) return;
            }
            
            // Soumission
            this.submitting = true;
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
            
            // Animation
            const animConfig = CONFIG.animations[this.options.animation];
            if (animConfig?.submit) {
                if (typeof animConfig.submit === 'string') {
                    this.submitButton.style.animation = animConfig.submit;
                } else if (animConfig.submit.loading) {
                    this.submitButton.style.animation = animConfig.submit.loading;
                }
            }
            
            try {
                await this.options.onSubmit(this.values, this);
                
                // Succès
                this.dirty = false;
                
                // Animation succès
                if (animConfig?.submit?.success) {
                    this.submitButton.style.animation = animConfig.submit.success;
                }
                
                // Message de succès
                if (this.options.showSuccess !== false) {
                    this.showSuccess(this.options.successMessage || CONFIG.messages.success);
                }
                
                // Réinitialiser si demandé
                if (this.options.resetOnSuccess) {
                    setTimeout(() => this.reset(), 1500);
                }
            } catch (error) {
                console.error('Erreur lors de la soumission:', error);
                
                // Animation erreur
                if (animConfig?.field?.error) {
                    this.container.style.animation = animConfig.field.error;
                }
                
                // Message d'erreur
                this.showError(error.message || CONFIG.messages.error);
            } finally {
                this.submitting = false;
                this.submitButton.disabled = false;
                this.submitButton.classList.remove('loading');
            }
        }

        /**
         * Gérer la réinitialisation
         */
        handleReset(e) {
            e.preventDefault();
            
            if (this.dirty && !confirm(CONFIG.messages.confirmReset)) {
                return;
            }
            
            this.reset();
        }

        /**
         * Réinitialiser le formulaire
         */
        reset() {
            // Réinitialiser les valeurs
            this.values = { ...this.options.initialValues };
            this.errors = {};
            this.touched = {};
            this.dirty = false;
            
            // Réinitialiser les champs
            for (const [name, field] of this.fields) {
                const value = this.values[name] || '';
                field.setValue(value);
                this.hideFieldError(name);
                field.container.classList.remove('error', 'success');
            }
            
            // Réinitialiser la progression
            if (this.options.features.progress?.enabled) {
                this.updateProgress();
            }
            
            // Réinitialiser les étapes
            if (this.options.features.steps?.enabled) {
                this.currentStep = 0;
                this.updateSteps();
            }
            
            // Mettre à jour les conditions
            this.updateConditionalFields();
        }

        /**
         * Afficher un message de succès
         */
        showSuccess(message) {
            const notification = document.createElement('div');
            notification.className = 'form-notification success';
            notification.innerHTML = `
                <span class="notification-icon">${CONFIG.icons.success}</span>
                <span class="notification-text">${message}</span>
            `;
            
            this.container.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        /**
         * Afficher un message d'erreur
         */
        showError(message) {
            const notification = document.createElement('div');
            notification.className = 'form-notification error';
            notification.innerHTML = `
                <span class="notification-icon">${CONFIG.icons.error}</span>
                <span class="notification-text">${message}</span>
            `;
            
            this.container.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }

        /**
         * Mettre à jour la progression
         */
        updateProgress() {
            if (!this.progressBar) return;
            
            const totalFields = this.fields.size;
            const filledFields = Object.keys(this.values).filter(key => {
                const value = this.values[key];
                return value !== undefined && value !== '' && value !== null;
            }).length;
            
            const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
            
            const bar = this.progressBar.querySelector('.progress-bar');
            bar.style.width = percentage + '%';
            
            if (this.options.features.progress?.showPercentage) {
                const text = bar.querySelector('.progress-text');
                if (text) text.textContent = percentage + '%';
            }
            
            // Animation
            if (this.options.animation !== 'none') {
                bar.style.animation = 'progressSlide 0.5s ease';
            }
        }

        /**
         * Obtenir les étapes
         */
        getSteps() {
            if (!this.options.steps) return [];
            
            return this.options.steps.map((step, index) => ({
                index,
                label: step.label || `Étape ${index + 1}`,
                fields: step.fields || [],
                validation: step.validation,
                condition: step.condition
            }));
        }

        /**
         * Obtenir les champs de l'étape courante
         */
        getCurrentStepFields() {
            const steps = this.getSteps();
            if (steps.length === 0) return this.options.fields;
            
            const currentStep = steps[this.currentStep];
            return currentStep ? currentStep.fields : [];
        }

        /**
         * Aller à une étape
         */
        async goToStep(index) {
            const steps = this.getSteps();
            if (index < 0 || index >= steps.length) return;
            
            // Valider l'étape courante si on avance
            if (index > this.currentStep && this.options.features.steps?.validation === 'step') {
                const isValid = await this.validateCurrentStep();
                if (!isValid) return;
            }
            
            this.currentStep = index;
            this.updateSteps();
        }

        /**
         * Étape suivante
         */
        async nextStep() {
            const steps = this.getSteps();
            if (this.currentStep >= steps.length - 1) {
                // Dernière étape, soumettre
                await this.handleSubmit(new Event('submit'));
                return;
            }
            
            await this.goToStep(this.currentStep + 1);
        }

        /**
         * Étape précédente
         */
        previousStep() {
            this.goToStep(this.currentStep - 1);
        }

        /**
         * Valider l'étape courante
         */
        async validateCurrentStep() {
            const currentFields = this.getCurrentStepFields();
            const promises = [];
            
            for (const fieldConfig of currentFields) {
                promises.push(this.validateField(fieldConfig.name));
            }
            
            const results = await Promise.all(promises);
            return results.every(result => result === true);
        }

        /**
         * Mettre à jour l'affichage des étapes
         */
        updateSteps() {
            // Vider le container des champs
            this.fieldsContainer.innerHTML = '';
            this.fields.clear();
            
            // Créer les champs de l'étape courante
            this.createFields();
            
            // Mettre à jour la navigation
            if (this.stepsNav) {
                const steps = this.stepsNav.querySelectorAll('.step');
                steps.forEach((step, index) => {
                    step.classList.toggle('active', index === this.currentStep);
                    step.classList.toggle('completed', index < this.currentStep);
                });
            }
            
            // Mettre à jour les boutons
            if (this.prevButton) {
                this.prevButton.style.display = this.currentStep > 0 ? 'block' : 'none';
            }
            
            if (this.nextButton) {
                const steps = this.getSteps();
                const isLastStep = this.currentStep === steps.length - 1;
                
                if (isLastStep) {
                    this.nextButton.style.display = 'none';
                    this.submitButton.style.display = 'block';
                } else {
                    this.nextButton.style.display = 'block';
                    this.submitButton.style.display = 'none';
                }
            }
            
            // Animation
            if (this.options.animation !== 'none') {
                this.fieldsContainer.style.animation = 'slideIn 0.4s ease';
            }
        }

        /**
         * Ajouter un tooltip
         */
        addTooltip(element, content) {
            const tooltip = document.createElement('div');
            tooltip.className = 'form-tooltip';
            tooltip.textContent = content;
            tooltip.style.display = 'none';
            
            element.appendChild(tooltip);
            
            const trigger = this.options.features.tooltips?.trigger || 'hover';
            
            if (trigger === 'hover') {
                element.addEventListener('mouseenter', () => {
                    tooltip.style.display = 'block';
                });
                
                element.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });
            } else if (trigger === 'click') {
                const icon = document.createElement('span');
                icon.className = 'tooltip-icon';
                icon.innerHTML = CONFIG.icons.help;
                element.appendChild(icon);
                
                icon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tooltip.style.display = tooltip.style.display === 'none' ? 'block' : 'none';
                });
                
                document.addEventListener('click', (e) => {
                    if (!element.contains(e.target)) {
                        tooltip.style.display = 'none';
                    }
                });
            }
        }

        /**
         * Ajouter une logique conditionnelle
         */
        addConditionalLogic(container, condition) {
            this.conditionalFields = this.conditionalFields || [];
            this.conditionalFields.push({ container, condition });
            
            // Vérifier initialement
            this.updateConditionalField(container, condition);
        }

        /**
         * Mettre à jour les champs conditionnels
         */
        updateConditionalFields() {
            if (!this.conditionalFields) return;
            
            this.conditionalFields.forEach(({ container, condition }) => {
                this.updateConditionalField(container, condition);
            });
        }

        /**
         * Mettre à jour un champ conditionnel
         */
        updateConditionalField(container, condition) {
            let show = true;
            
            if (typeof condition === 'function') {
                show = condition(this.values);
            } else if (typeof condition === 'object') {
                const { field, operator = '=', value } = condition;
                const fieldValue = this.values[field];
                
                switch (operator) {
                    case '=':
                    case '==':
                        show = fieldValue == value;
                        break;
                    case '===':
                        show = fieldValue === value;
                        break;
                    case '!=':
                        show = fieldValue != value;
                        break;
                    case '!==':
                        show = fieldValue !== value;
                        break;
                    case '>':
                        show = fieldValue > value;
                        break;
                    case '<':
                        show = fieldValue < value;
                        break;
                    case '>=':
                        show = fieldValue >= value;
                        break;
                    case '<=':
                        show = fieldValue <= value;
                        break;
                    case 'in':
                        show = Array.isArray(value) && value.includes(fieldValue);
                        break;
                    case 'not in':
                        show = Array.isArray(value) && !value.includes(fieldValue);
                        break;
                    case 'contains':
                        show = String(fieldValue).includes(value);
                        break;
                    case 'empty':
                        show = !fieldValue || fieldValue === '';
                        break;
                    case 'not empty':
                        show = fieldValue && fieldValue !== '';
                        break;
                }
            }
            
            const wasVisible = container.style.display !== 'none';
            
            if (show) {
                container.style.display = '';
                container.classList.remove('hidden');
                
                if (!wasVisible && this.options.animation !== 'none') {
                    container.style.animation = 'fadeIn 0.3s ease';
                }
            } else {
                container.style.display = 'none';
                container.classList.add('hidden');
                
                // Nettoyer les valeurs si demandé
                if (this.options.features.conditional?.clearHidden) {
                    const name = container.dataset.name;
                    if (name && this.fields.has(name)) {
                        delete this.values[name];
                        delete this.errors[name];
                    }
                }
            }
        }

        /**
         * Programmer l'autosave
         */
        scheduleAutosave() {
            if (!this.options.features.autosave?.enabled) return;
            
            // Annuler l'autosave précédent
            clearTimeout(this.autosaveTimeout);
            
            // Programmer le nouveau
            const delay = this.options.features.autosave?.debounce || 1000;
            this.autosaveTimeout = setTimeout(() => {
                this.autosave();
            }, delay);
        }

        /**
         * Autosave
         */
        async autosave() {
            const storage = this.options.features.autosave?.storage === 'sessionStorage' 
                ? sessionStorage 
                : localStorage;
                
            const key = this.options.features.autosave?.key || `form-autosave-${this.id}`;
            
            const data = {
                values: this.values,
                timestamp: Date.now()
            };
            
            try {
                storage.setItem(key, JSON.stringify(data));
                
                if (this.options.features.autosave?.notification) {
                    this.showAutosaveNotification();
                }
            } catch (error) {
                console.error('Erreur autosave:', error);
            }
        }

        /**
         * Charger l'autosave
         */
        loadAutosave() {
            const storage = this.options.features.autosave?.storage === 'sessionStorage' 
                ? sessionStorage 
                : localStorage;
                
            const key = this.options.features.autosave?.key || `form-autosave-${this.id}`;
            
            try {
                const saved = storage.getItem(key);
                if (!saved) return;
                
                const data = JSON.parse(saved);
                
                // Vérifier l'âge des données
                const maxAge = this.options.features.autosave?.maxAge || 24 * 60 * 60 * 1000; // 24h
                if (Date.now() - data.timestamp > maxAge) {
                    storage.removeItem(key);
                    return;
                }
                
                // Restaurer les valeurs
                this.values = { ...this.values, ...data.values };
                
                // Mettre à jour les champs
                for (const [name, field] of this.fields) {
                    if (data.values[name] !== undefined) {
                        field.setValue(data.values[name]);
                    }
                }
                
                // Notification
                if (this.options.features.autosave?.notification) {
                    this.showSuccess('Données restaurées automatiquement');
                }
            } catch (error) {
                console.error('Erreur chargement autosave:', error);
            }
        }

        /**
         * Afficher la notification d'autosave
         */
        showAutosaveNotification() {
            let notification = this.container.querySelector('.autosave-notification');
            
            if (!notification) {
                notification = document.createElement('div');
                notification.className = 'autosave-notification';
                notification.innerHTML = `
                    <span class="autosave-icon">${CONFIG.icons.save}</span>
                    <span class="autosave-text">Sauvegarde automatique</span>
                `;
                this.container.appendChild(notification);
            }
            
            notification.style.display = 'block';
            notification.style.animation = 'fadeIn 0.3s ease';
            
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 300);
            }, 2000);
        }

        /**
         * Initialiser les fonctionnalités
         */
        initFeatures() {
            // Autosave
            if (this.options.features.autosave?.enabled) {
                // Sauvegarder périodiquement
                if (this.options.features.autosave?.interval) {
                    setInterval(() => {
                        if (this.dirty) {
                            this.autosave();
                        }
                    }, this.options.features.autosave.interval);
                }
            }
            
            // Raccourcis clavier
            if (this.options.features.accessibility?.keyboardNavigation) {
                this.initKeyboardNavigation();
            }
            
            // Reduced motion
            if (this.options.features.accessibility?.reducedMotion) {
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
                if (prefersReducedMotion.matches) {
                    this.options.animation = 'none';
                }
            }
        }

        /**
         * Initialiser la navigation clavier
         */
        initKeyboardNavigation() {
            this.container.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Enter pour soumettre
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSubmit(new Event('submit'));
                }
                
                // Échap pour annuler
                if (e.key === 'Escape' && this.dirty) {
                    if (confirm(CONFIG.messages.confirmCancel)) {
                        this.reset();
                    }
                }
                
                // Tab pour navigation entre champs
                if (e.key === 'Tab') {
                    // Navigation personnalisée si nécessaire
                }
            });
        }

        /**
         * Appliquer les animations
         */
        applyAnimations() {
            if (this.options.animation === 'none') return;
            
            const animConfig = CONFIG.animations[this.options.animation];
            if (!animConfig) return;
            
            // Animation d'entrée des champs
            if (animConfig.field?.enter) {
                this.fields.forEach((field, index) => {
                    field.container.style.animation = animConfig.field.enter;
                    field.container.style.animationDelay = `${index * 50}ms`;
                });
            }
            
            // Animation du container
            if (animConfig.container?.reveal) {
                this.container.style.animation = animConfig.container.reveal;
            }
        }

        /**
         * Appliquer des styles
         */
        applyStyles(element, styles) {
            if (!styles) return;
            
            Object.entries(styles).forEach(([prop, value]) => {
                if (prop === 'backdropFilter') {
                    element.style.backdropFilter = value;
                    element.style.webkitBackdropFilter = value;
                } else {
                    element.style[prop] = value;
                }
            });
        }

        /**
         * Injecter les styles CSS
         */
        injectStyles() {
            if (stylesInjected) return;
            
            const style = document.createElement('style');
            style.id = 'ui-form-styles';
            style.textContent = `
                ${CONFIG.keyframes}
                
                /* Form container */
                .ui-form {
                    position: relative;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                /* Fields container */
                .form-fields {
                    margin-bottom: 24px;
                }
                
                /* Field container */
                .form-field {
                    position: relative;
                    margin-bottom: 24px;
                    transition: all 0.3s ease;
                }
                
                .form-field.hidden {
                    display: none !important;
                }
                
                /* Label */
                .form-label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .form-label .required {
                    color: #ef4444;
                    margin-left: 4px;
                }
                
                /* Input wrapper */
                .form-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                /* Input base */
                .form-input,
                .form-select,
                .form-textarea {
                    width: 100%;
                    border: none;
                    outline: none;
                    font-family: inherit;
                    font-size: inherit;
                    transition: all 0.3s ease;
                }
                
                /* Icon */
                .form-icon {
                    position: absolute;
                    left: 16px;
                    font-size: 20px;
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                .form-input-wrapper .form-icon + .form-input {
                    padding-left: 48px;
                }
                
                /* Clear button */
                .form-clear {
                    position: absolute;
                    right: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    opacity: 0.5;
                    transition: opacity 0.2s;
                }
                
                .form-clear:hover {
                    opacity: 1;
                }
                
                /* Counter */
                .form-counter {
                    position: absolute;
                    right: 12px;
                    bottom: -20px;
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .form-counter.error {
                    color: #ef4444;
                }
                
                /* Description */
                .form-description {
                    margin-top: 6px;
                    font-size: 14px;
                    color: #6b7280;
                }
                
                /* Error */
                .form-error {
                    margin-top: 6px;
                    font-size: 14px;
                    color: #ef4444;
                    display: none;
                }
                
                .form-field.error .form-input,
                .form-field.error .form-select,
                .form-field.error .form-textarea {
                    border-color: #ef4444 !important;
                }
                
                /* Progress bar */
                .form-progress {
                    height: 4px;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 2px;
                    margin-bottom: 24px;
                    overflow: hidden;
                }
                
                .progress-bar {
                    height: 100%;
                    background: #3b82f6;
                    transition: width 0.3s ease;
                    position: relative;
                }
                
                .progress-text {
                    position: absolute;
                    right: 8px;
                    top: -24px;
                    font-size: 12px;
                    color: #6b7280;
                }
                
                /* Steps navigation */
                .form-steps-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 32px;
                }
                
                .step {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: all 0.3s ease;
                }
                
                .step.active {
                    opacity: 1;
                }
                
                .step.completed {
                    opacity: 0.8;
                }
                
                .step-number {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    margin-right: 8px;
                }
                
                .step.active .step-number {
                    background: #3b82f6;
                    color: white;
                }
                
                .step.completed .step-number {
                    background: #22c55e;
                    color: white;
                }
                
                .step-label {
                    font-size: 14px;
                }
                
                .step-connector {
                    width: 60px;
                    height: 2px;
                    background: rgba(0, 0, 0, 0.1);
                    margin: 0 16px;
                }
                
                /* Actions */
                .form-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 32px;
                }
                
                .form-button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .form-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .form-button.loading {
                    color: transparent;
                }
                
                .form-button.loading::after {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    top: 50%;
                    left: 50%;
                    margin-left: -10px;
                    margin-top: -10px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Notifications */
                .form-notification {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    animation: slideIn 0.3s ease;
                    z-index: 1000;
                }
                
                .form-notification.success {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #86efac;
                }
                
                .form-notification.error {
                    background: #fef2f2;
                    color: #991b1b;
                    border: 1px solid #fca5a5;
                }
                
                .notification-icon {
                    font-size: 20px;
                }
                
                /* Autosave notification */
                .autosave-notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    border-radius: 8px;
                    display: none;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    z-index: 1000;
                }
                
                /* File input */
                .file-drop-zone {
                    padding: 40px;
                    border: 2px dashed rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .file-drop-zone:hover {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.05);
                }
                
                .file-drop-zone.dragging {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    transform: scale(1.02);
                }
                
                .drop-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                
                .drop-text {
                    margin-bottom: 16px;
                    color: #6b7280;
                }
                
                .file-select-btn {
                    padding: 8px 20px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .file-select-btn:hover {
                    background: #2563eb;
                }
                
                /* File preview */
                .file-preview-container {
                    margin-top: 16px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                }
                
                .file-preview {
                    position: relative;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .file-preview-image {
                    width: 60px;
                    height: 60px;
                    object-fit: cover;
                    border-radius: 4px;
                }
                
                .file-icon {
                    font-size: 32px;
                }
                
                .file-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .file-name {
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .file-size {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .file-remove {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(239, 68, 68, 0.1);
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .file-remove:hover {
                    background: rgba(239, 68, 68, 0.2);
                }
                
                .file-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 0 0 8px 8px;
                    overflow: hidden;
                }
                
                .file-progress .progress-bar {
                    height: 100%;
                    background: #3b82f6;
                    transition: width 0.3s ease;
                }
                
                .file-progress.complete .progress-bar {
                    background: #22c55e;
                }
                
                .file-progress.error .progress-bar {
                    background: #ef4444;
                }
                
                /* Advanced select */
                .advanced-select {
                    position: relative;
                }
                
                .select-search {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    outline: none;
                }
                
                .select-options {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 4px;
                    background: white;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    max-height: 300px;
                    overflow-y: auto;
                    z-index: 100;
                }
                
                .select-option {
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .select-option:hover {
                    background: rgba(59, 130, 246, 0.05);
                }
                
                .select-option.selected {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }
                
                .option-icon {
                    font-size: 20px;
                }
                
                .option-description {
                    font-size: 12px;
                    color: #6b7280;
                    display: block;
                }
                
                .select-no-results {
                    padding: 20px;
                    text-align: center;
                    color: #6b7280;
                }
                
                /* Select tags */
                .select-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .select-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 12px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 16px;
                    font-size: 14px;
                    color: #3b82f6;
                }
                
                .tag-remove {
                    background: none;
                    border: none;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .tag-remove:hover {
                    opacity: 1;
                }
                
                /* Group items */
                .form-group-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    cursor: pointer;
                }
                
                .form-group.inline {
                    display: flex;
                    gap: 24px;
                    flex-wrap: wrap;
                }
                
                .form-group.inline .form-group-item {
                    margin-bottom: 0;
                }
                
                /* Password strength */
                .password-input-container {
                    position: relative;
                    width: 100%;
                }
                
                .password-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    opacity: 0.5;
                    transition: opacity 0.2s;
                }
                
                .password-toggle:hover {
                    opacity: 1;
                }
                
                .password-strength {
                    margin-top: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .strength-bar {
                    height: 4px;
                    border-radius: 2px;
                    background: #e5e7eb;
                    transition: all 0.3s ease;
                    flex: 1;
                }
                
                .strength-bar.strength-weak {
                    background: #ef4444;
                }
                
                .strength-bar.strength-fair {
                    background: #fbbf24;
                }
                
                .strength-bar.strength-good {
                    background: #3b82f6;
                }
                
                .strength-bar.strength-strong {
                    background: #22c55e;
                }
                
                .strength-text {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                /* Tooltip */
                .form-tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 8px 12px;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    font-size: 12px;
                    border-radius: 4px;
                    white-space: nowrap;
                    margin-bottom: 8px;
                    z-index: 1000;
                }
                
                .form-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border: 4px solid transparent;
                    border-top-color: rgba(0, 0, 0, 0.9);
                }
                
                .tooltip-icon {
                    margin-left: 4px;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: opacity 0.2s;
                }
                
                .tooltip-icon:hover {
                    opacity: 1;
                }
                
                /* Mobile responsive */
                @media (max-width: 640px) {
                    .ui-form {
                        padding: 16px;
                    }
                    
                    .form-fields {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .form-actions {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .form-button {
                        width: 100%;
                    }
                    
                    .form-steps-nav {
                        flex-wrap: wrap;
                    }
                }
            `;
            
            document.head.appendChild(style);
            stylesInjected = true;
        }

        /**
         * Obtenir l'élément DOM
         */
        getElement() {
            return this.container;
        }

        /**
         * Obtenir les valeurs
         */
        getValues() {
            return { ...this.values };
        }

        /**
         * Définir les valeurs
         */
        setValues(values) {
            Object.entries(values).forEach(([name, value]) => {
                if (this.fields.has(name)) {
                    this.values[name] = value;
                    const field = this.fields.get(name);
                    field.setValue(value);
                }
            });
            
            this.updateConditionalFields();
            this.updateProgress();
        }

        /**
         * Obtenir les erreurs
         */
        getErrors() {
            return { ...this.errors };
        }

        /**
         * Définir une erreur
         */
        setError(name, message) {
            this.errors[name] = [message];
            this.showFieldError(name, message);
        }

        /**
         * Nettoyer les erreurs
         */
        clearErrors() {
            this.errors = {};
            for (const [name, field] of this.fields) {
                this.hideFieldError(name);
            }
        }

        /**
         * Activer/désactiver un champ
         */
        setFieldEnabled(name, enabled) {
            const field = this.fields.get(name);
            if (!field) return;
            
            const input = field.input;
            if (input) {
                input.disabled = !enabled;
                field.container.classList.toggle('disabled', !enabled);
            }
        }

        /**
         * Afficher/masquer un champ
         */
        setFieldVisible(name, visible) {
            const field = this.fields.get(name);
            if (!field) return;
            
            field.container.style.display = visible ? '' : 'none';
            
            if (!visible && this.options.features.conditional?.clearHidden) {
                delete this.values[name];
                delete this.errors[name];
            }
        }

        /**
         * Ajouter un champ dynamiquement
         */
        async addField(config, position) {
            const field = await this.createField(config);
            if (!field) return;
            
            this.fields.set(config.name, field);
            
            if (position === 'start') {
                this.fieldsContainer.prepend(field.container);
            } else if (typeof position === 'number') {
                const children = Array.from(this.fieldsContainer.children);
                if (position < children.length) {
                    this.fieldsContainer.insertBefore(field.container, children[position]);
                } else {
                    this.fieldsContainer.appendChild(field.container);
                }
            } else {
                this.fieldsContainer.appendChild(field.container);
            }
            
            // Animation
            if (this.options.animation !== 'none') {
                field.container.style.animation = 'fadeIn 0.3s ease';
            }
            
            return field;
        }

        /**
         * Supprimer un champ
         */
        removeField(name) {
            const field = this.fields.get(name);
            if (!field) return;
            
            // Animation
            if (this.options.animation !== 'none') {
                field.container.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    field.container.remove();
                }, 300);
            } else {
                field.container.remove();
            }
            
            this.fields.delete(name);
            delete this.values[name];
            delete this.errors[name];
            delete this.touched[name];
            
            this.updateProgress();
        }

        /**
         * Focus sur un champ
         */
        focusField(name) {
            const field = this.fields.get(name);
            if (!field) return;
            
            const input = field.input;
            if (input && input.focus) {
                input.focus();
                field.container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        /**
         * Détruire le formulaire
         */
        destroy() {
            // Nettoyer les timeouts
            clearTimeout(this.validationTimeout);
            clearTimeout(this.autosaveTimeout);
            
            // Retirer les event listeners
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            
            // Retirer l'instance
            formInstances.delete(this.id);
            
            // Retirer le DOM
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }
    }

    // Fonction utilitaire pour formater la taille de fichier
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 🎯 API PUBLIQUE
    return {
        /**
         * Créer un formulaire
         * @param {Object} options - Options de configuration
         * @returns {Promise<FormBuilder>} Instance du formulaire
         */
        async create(options = {}) {
            // Simuler le chargement asynchrone
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const form = new FormBuilder(options);
            return form;
        },

        /**
         * Créer un champ individuel
         * @param {Object} config - Configuration du champ
         * @returns {Promise<HTMLElement>} Élément du champ
         */
        async createField(config) {
            if (!stylesInjected) {
                const tempForm = new FormBuilder({});
                tempForm.injectStyles();
            }
            
            const tempForm = new FormBuilder({});
            const field = await tempForm.createField(config);
            return field?.container;
        },

        /**
         * Obtenir une instance de formulaire
         * @param {string} id - ID du formulaire
         * @returns {FormBuilder|null} Instance ou null
         */
        getInstance(id) {
            return formInstances.get(id) || null;
        },

        /**
         * Détruire tous les formulaires
         */
        destroyAll() {
            formInstances.forEach(form => form.destroy());
            formInstances.clear();
        },

        /**
         * Configuration globale
         */
        config(options = {}) {
            if (options.messages) {
                Object.assign(CONFIG.messages, options.messages);
            }
            if (options.icons) {
                Object.assign(CONFIG.icons, options.icons);
            }
            if (options.validations) {
                Object.assign(CONFIG.validations, options.validations);
            }
            if (options.fieldTypes) {
                Object.assign(CONFIG.fieldTypes, options.fieldTypes);
            }
        },

        /**
         * Ajouter un type de champ personnalisé
         */
        addFieldType(name, config) {
            CONFIG.fieldTypes[name] = config;
        },

        /**
         * Ajouter une validation personnalisée
         */
        addValidation(name, validation) {
            CONFIG.validations[name] = validation;
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
         * Exposer la classe pour extension
         */
        FormBuilderClass: FormBuilder
    };
})();

// Export pour modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormBuilderComponent;
}

// Export pour le système UI global
window.FormBuilderComponent = FormBuilderComponent;