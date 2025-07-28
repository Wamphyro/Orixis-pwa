/* ========================================
   DOM-UTILS.JS - Utilitaires de manipulation DOM
   Chemin: src/js/shared/utils/dom-utils.js
   
   DESCRIPTION:
   Bibliothèque complète de fonctions utilitaires pour la manipulation du DOM.
   Fournit une API fluide et chainable pour toutes les opérations DOM courantes
   avec optimisations de performance et gestion d'erreurs robuste.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 20-100)
   2. Classe DOMWrapper chainable (lignes 101-500)
   3. Sélection et requêtes (lignes 501-700)
   4. Création d'éléments (lignes 701-900)
   5. Manipulation classes/attributs (lignes 901-1100)
   6. Styles et CSS (lignes 1101-1300)
   7. Événements (lignes 1301-1600)
   8. Animations et transitions (lignes 1601-1900)
   9. Performance et optimisation (lignes 1901-2100)
   10. Détection et mesures (lignes 2101-2300)
   11. API publique (lignes 2301-2400)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Compatible ES6+
   - Support IE11 avec polyfills
   ======================================== */

(function(global) {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    const CONFIG = {
        // Préfixes vendeurs
        vendorPrefixes: ['webkit', 'moz', 'ms', 'o'],
        
        // Propriétés CSS nécessitant des préfixes
        prefixedProperties: [
            'transform', 'transition', 'animation', 'backdrop-filter',
            'user-select', 'box-shadow', 'border-radius'
        ],
        
        // Événements tactiles vs souris
        touchEvents: {
            start: 'touchstart',
            move: 'touchmove',
            end: 'touchend',
            cancel: 'touchcancel'
        },
        
        mouseEvents: {
            start: 'mousedown',
            move: 'mousemove',
            end: 'mouseup',
            cancel: 'mouseleave'
        },
        
        // Seuils de performance
        performance: {
            batchThreshold: 10,          // Nombre d'opérations avant batching
            rafThrottle: 16,            // ~60fps
            debounceDelay: 300,         // Délai par défaut pour debounce
            throttleDelay: 100,         // Délai par défaut pour throttle
            observerThreshold: 0.1      // Seuil IntersectionObserver
        },
        
        // Cache des sélecteurs
        selectorCache: new Map(),
        cacheMaxSize: 100,
        
        // Animations par défaut
        defaultAnimations: {
            fadeIn: { opacity: [0, 1] },
            fadeOut: { opacity: [1, 0] },
            slideIn: { transform: ['translateY(100%)', 'translateY(0)'] },
            slideOut: { transform: ['translateY(0)', 'translateY(-100%)'] },
            scaleIn: { transform: ['scale(0)', 'scale(1)'] },
            scaleOut: { transform: ['scale(1)', 'scale(0)'] }
        },
        
        // Classes utilitaires
        utilityClasses: {
            hidden: 'dom-utils-hidden',
            invisible: 'dom-utils-invisible',
            loading: 'dom-utils-loading',
            disabled: 'dom-utils-disabled'
        }
    };

    // ========================================
    // HELPERS PRIVÉS
    // ========================================
    
    // Convertit NodeList en Array
    function toArray(nodeList) {
        return Array.prototype.slice.call(nodeList);
    }
    
    // Vérifie si c'est un élément DOM
    function isElement(obj) {
        return obj instanceof Element || obj instanceof HTMLDocument;
    }
    
    // Vérifie si c'est une fonction
    function isFunction(obj) {
        return typeof obj === 'function';
    }
    
    // Normalise le sélecteur
    function normalizeSelector(selector, context = document) {
        if (typeof selector === 'string') {
            return context.querySelectorAll(selector);
        }
        if (isElement(selector)) {
            return [selector];
        }
        if (selector instanceof NodeList || Array.isArray(selector)) {
            return selector;
        }
        if (selector instanceof DOMWrapper) {
            return selector.elements;
        }
        return [];
    }

    // ========================================
    // CLASSE DOMWRAPPER (CHAINABLE)
    // ========================================
    class DOMWrapper {
        constructor(elements) {
            this.elements = Array.isArray(elements) ? elements : toArray(elements);
            this.length = this.elements.length;
        }

        // ========================================
        // ITERATION ET TRAVERSÉE
        // ========================================
        each(callback) {
            this.elements.forEach((el, index) => {
                callback.call(el, el, index);
            });
            return this;
        }

        map(callback) {
            return this.elements.map((el, index) => callback.call(el, el, index));
        }

        filter(selector) {
            const filtered = this.elements.filter(el => {
                if (isFunction(selector)) {
                    return selector.call(el, el);
                }
                return el.matches(selector);
            });
            return new DOMWrapper(filtered);
        }

        first() {
            return new DOMWrapper(this.elements[0] ? [this.elements[0]] : []);
        }

        last() {
            const last = this.elements[this.elements.length - 1];
            return new DOMWrapper(last ? [last] : []);
        }

        eq(index) {
            const el = this.elements[index];
            return new DOMWrapper(el ? [el] : []);
        }

        // ========================================
        // CLASSES
        // ========================================
        addClass(...classNames) {
            return this.each(el => {
                classNames.forEach(className => {
                    if (className) {
                        const classes = className.split(' ').filter(c => c);
                        el.classList.add(...classes);
                    }
                });
            });
        }

        removeClass(...classNames) {
            return this.each(el => {
                if (classNames.length === 0) {
                    el.className = '';
                } else {
                    classNames.forEach(className => {
                        if (className) {
                            const classes = className.split(' ').filter(c => c);
                            el.classList.remove(...classes);
                        }
                    });
                }
            });
        }

        toggleClass(className, force) {
            return this.each(el => {
                if (force !== undefined) {
                    el.classList.toggle(className, force);
                } else {
                    el.classList.toggle(className);
                }
            });
        }

        hasClass(className) {
            return this.elements.some(el => el.classList.contains(className));
        }

        // ========================================
        // ATTRIBUTS
        // ========================================
        attr(name, value) {
            if (value === undefined && typeof name === 'string') {
                return this.elements[0]?.getAttribute(name);
            }
            
            if (typeof name === 'object') {
                return this.each(el => {
                    Object.entries(name).forEach(([key, val]) => {
                        if (val === null) {
                            el.removeAttribute(key);
                        } else {
                            el.setAttribute(key, val);
                        }
                    });
                });
            }
            
            return this.each(el => {
                if (value === null) {
                    el.removeAttribute(name);
                } else {
                    el.setAttribute(name, value);
                }
            });
        }

        removeAttr(name) {
            return this.each(el => el.removeAttribute(name));
        }

        data(key, value) {
            if (value === undefined && typeof key === 'string') {
                const el = this.elements[0];
                if (!el) return undefined;
                
                // Essayer d'abord dataset
                if (key in el.dataset) {
                    return el.dataset[key];
                }
                
                // Fallback sur getAttribute
                return el.getAttribute(`data-${key}`);
            }
            
            if (typeof key === 'object') {
                return this.each(el => {
                    Object.entries(key).forEach(([k, v]) => {
                        if (v === null) {
                            delete el.dataset[k];
                        } else {
                            el.dataset[k] = v;
                        }
                    });
                });
            }
            
            return this.each(el => {
                if (value === null) {
                    delete el.dataset[key];
                } else {
                    el.dataset[key] = value;
                }
            });
        }

        // ========================================
        // STYLES
        // ========================================
        css(property, value) {
            if (value === undefined && typeof property === 'string') {
                const el = this.elements[0];
                if (!el) return undefined;
                return getComputedStyle(el)[property];
            }
            
            if (typeof property === 'object') {
                return this.each(el => {
                    Object.entries(property).forEach(([prop, val]) => {
                        if (val === null || val === '') {
                            el.style.removeProperty(prop);
                        } else {
                            // Gestion des préfixes vendeurs
                            const prefixedProp = getPrefixedProperty(prop);
                            el.style[prefixedProp] = val;
                        }
                    });
                });
            }
            
            return this.each(el => {
                if (value === null || value === '') {
                    el.style.removeProperty(property);
                } else {
                    const prefixedProp = getPrefixedProperty(property);
                    el.style[prefixedProp] = value;
                }
            });
        }

        show(display = '') {
            return this.each(el => {
                el.style.display = display || '';
                if (getComputedStyle(el).display === 'none') {
                    el.style.display = 'block';
                }
            });
        }

        hide() {
            return this.each(el => {
                el.style.display = 'none';
            });
        }

        toggle(display) {
            return this.each(el => {
                if (getComputedStyle(el).display === 'none') {
                    $(el).show(display);
                } else {
                    $(el).hide();
                }
            });
        }

        // ========================================
        // DIMENSIONS ET POSITION
        // ========================================
        width(value) {
            if (value === undefined) {
                const el = this.elements[0];
                return el ? el.offsetWidth : 0;
            }
            return this.css('width', typeof value === 'number' ? `${value}px` : value);
        }

        height(value) {
            if (value === undefined) {
                const el = this.elements[0];
                return el ? el.offsetHeight : 0;
            }
            return this.css('height', typeof value === 'number' ? `${value}px` : value);
        }

        innerWidth() {
            const el = this.elements[0];
            if (!el) return 0;
            const styles = getComputedStyle(el);
            return el.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
        }

        innerHeight() {
            const el = this.elements[0];
            if (!el) return 0;
            const styles = getComputedStyle(el);
            return el.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
        }

        outerWidth(includeMargin = false) {
            const el = this.elements[0];
            if (!el) return 0;
            let width = el.offsetWidth;
            if (includeMargin) {
                const styles = getComputedStyle(el);
                width += parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
            }
            return width;
        }

        outerHeight(includeMargin = false) {
            const el = this.elements[0];
            if (!el) return 0;
            let height = el.offsetHeight;
            if (includeMargin) {
                const styles = getComputedStyle(el);
                height += parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
            }
            return height;
        }

        offset() {
            const el = this.elements[0];
            if (!el) return { top: 0, left: 0 };
            const rect = el.getBoundingClientRect();
            return {
                top: rect.top + window.pageYOffset,
                left: rect.left + window.pageXOffset
            };
        }

        position() {
            const el = this.elements[0];
            if (!el) return { top: 0, left: 0 };
            return {
                top: el.offsetTop,
                left: el.offsetLeft
            };
        }

        // ========================================
        // CONTENU
        // ========================================
        html(content) {
            if (content === undefined) {
                return this.elements[0]?.innerHTML;
            }
            return this.each(el => {
                el.innerHTML = content;
            });
        }

        text(content) {
            if (content === undefined) {
                return this.elements[0]?.textContent;
            }
            return this.each(el => {
                el.textContent = content;
            });
        }

        val(value) {
            if (value === undefined) {
                const el = this.elements[0];
                if (!el) return undefined;
                if ('value' in el) return el.value;
                return el.getAttribute('value');
            }
            return this.each(el => {
                if ('value' in el) {
                    el.value = value;
                } else {
                    el.setAttribute('value', value);
                }
            });
        }

        // ========================================
        // MANIPULATION DOM
        // ========================================
        append(...contents) {
            return this.each(el => {
                contents.forEach(content => {
                    if (typeof content === 'string') {
                        el.insertAdjacentHTML('beforeend', content);
                    } else if (content instanceof DOMWrapper) {
                        content.elements.forEach(child => el.appendChild(child.cloneNode(true)));
                    } else if (isElement(content)) {
                        el.appendChild(content);
                    }
                });
            });
        }

        prepend(...contents) {
            return this.each(el => {
                contents.reverse().forEach(content => {
                    if (typeof content === 'string') {
                        el.insertAdjacentHTML('afterbegin', content);
                    } else if (content instanceof DOMWrapper) {
                        content.elements.forEach(child => el.insertBefore(child.cloneNode(true), el.firstChild));
                    } else if (isElement(content)) {
                        el.insertBefore(content, el.firstChild);
                    }
                });
            });
        }

        before(...contents) {
            return this.each(el => {
                contents.forEach(content => {
                    if (typeof content === 'string') {
                        el.insertAdjacentHTML('beforebegin', content);
                    } else if (content instanceof DOMWrapper) {
                        content.elements.forEach(sibling => el.parentNode.insertBefore(sibling.cloneNode(true), el));
                    } else if (isElement(content)) {
                        el.parentNode.insertBefore(content, el);
                    }
                });
            });
        }

        after(...contents) {
            return this.each(el => {
                contents.reverse().forEach(content => {
                    if (typeof content === 'string') {
                        el.insertAdjacentHTML('afterend', content);
                    } else if (content instanceof DOMWrapper) {
                        content.elements.forEach(sibling => el.parentNode.insertBefore(sibling.cloneNode(true), el.nextSibling));
                    } else if (isElement(content)) {
                        el.parentNode.insertBefore(content, el.nextSibling);
                    }
                });
            });
        }

        remove() {
            return this.each(el => {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        }

        empty() {
            return this.each(el => {
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            });
        }

        clone(deep = true) {
            const cloned = this.elements.map(el => el.cloneNode(deep));
            return new DOMWrapper(cloned);
        }

        // ========================================
        // ÉVÉNEMENTS
        // ========================================
        on(events, selector, handler, options) {
            if (typeof selector === 'function') {
                options = handler;
                handler = selector;
                selector = null;
            }

            const eventList = events.split(' ').filter(e => e);

            return this.each(el => {
                eventList.forEach(event => {
                    const [eventName, namespace] = event.split('.');
                    
                    const wrappedHandler = function(e) {
                        if (selector) {
                            // Event delegation
                            let target = e.target;
                            while (target && target !== el) {
                                if (target.matches(selector)) {
                                    handler.call(target, e);
                                    break;
                                }
                                target = target.parentElement;
                            }
                        } else {
                            handler.call(this, e);
                        }
                    };

                    // Stocker le handler pour pouvoir le retirer
                    if (!el._domUtilsHandlers) {
                        el._domUtilsHandlers = {};
                    }
                    if (!el._domUtilsHandlers[eventName]) {
                        el._domUtilsHandlers[eventName] = [];
                    }
                    
                    el._domUtilsHandlers[eventName].push({
                        original: handler,
                        wrapped: wrappedHandler,
                        selector: selector,
                        namespace: namespace
                    });

                    el.addEventListener(eventName, wrappedHandler, options);
                });
            });
        }

        off(events, selector, handler) {
            if (typeof selector === 'function') {
                handler = selector;
                selector = null;
            }

            const eventList = events ? events.split(' ').filter(e => e) : [];

            return this.each(el => {
                if (!el._domUtilsHandlers) return;

                if (eventList.length === 0) {
                    // Retirer tous les événements
                    Object.keys(el._domUtilsHandlers).forEach(eventName => {
                        el._domUtilsHandlers[eventName].forEach(item => {
                            el.removeEventListener(eventName, item.wrapped);
                        });
                    });
                    el._domUtilsHandlers = {};
                } else {
                    eventList.forEach(event => {
                        const [eventName, namespace] = event.split('.');
                        
                        if (!el._domUtilsHandlers[eventName]) return;

                        el._domUtilsHandlers[eventName] = el._domUtilsHandlers[eventName].filter(item => {
                            const shouldRemove = (!namespace || item.namespace === namespace) &&
                                                (!handler || item.original === handler) &&
                                                (!selector || item.selector === selector);
                            
                            if (shouldRemove) {
                                el.removeEventListener(eventName, item.wrapped);
                                return false;
                            }
                            return true;
                        });

                        if (el._domUtilsHandlers[eventName].length === 0) {
                            delete el._domUtilsHandlers[eventName];
                        }
                    });
                }
            });
        }

        once(events, selector, handler, options) {
            if (typeof selector === 'function') {
                options = handler;
                handler = selector;
                selector = null;
            }

            const wrappedHandler = function(e) {
                handler.call(this, e);
                $(this).off(events, selector, wrappedHandler);
            };

            return this.on(events, selector, wrappedHandler, options);
        }

        trigger(eventName, data) {
            return this.each(el => {
                let event;
                if (typeof eventName === 'string') {
                    event = new CustomEvent(eventName, {
                        detail: data,
                        bubbles: true,
                        cancelable: true
                    });
                } else {
                    event = eventName;
                }
                el.dispatchEvent(event);
            });
        }

        // ========================================
        // ANIMATIONS
        // ========================================
        animate(properties, options = {}) {
            const {
                duration = 400,
                easing = 'ease',
                delay = 0,
                fill = 'forwards',
                onComplete,
                onStart
            } = options;

            const promises = this.elements.map(el => {
                if (onStart) onStart.call(el);

                // Utiliser Web Animations API si disponible
                if (el.animate) {
                    const animation = el.animate(properties, {
                        duration,
                        easing,
                        delay,
                        fill
                    });

                    return animation.finished.then(() => {
                        if (onComplete) onComplete.call(el);
                    });
                } else {
                    // Fallback CSS transitions
                    return new Promise(resolve => {
                        const transitionProps = Object.keys(properties).join(', ');
                        el.style.transition = `${transitionProps} ${duration}ms ${easing} ${delay}ms`;
                        
                        Object.entries(properties).forEach(([prop, value]) => {
                            el.style[prop] = Array.isArray(value) ? value[1] : value;
                        });

                        setTimeout(() => {
                            el.style.transition = '';
                            if (onComplete) onComplete.call(el);
                            resolve();
                        }, duration + delay);
                    });
                }
            });

            return Promise.all(promises);
        }

        fadeIn(duration = 400, onComplete) {
            this.css('opacity', '0').show();
            return this.animate(CONFIG.defaultAnimations.fadeIn, { duration, onComplete });
        }

        fadeOut(duration = 400, onComplete) {
            return this.animate(CONFIG.defaultAnimations.fadeOut, {
                duration,
                onComplete: function() {
                    $(this).hide();
                    if (onComplete) onComplete.call(this);
                }
            });
        }

        slideDown(duration = 400, onComplete) {
            return this.each(el => {
                const $el = $(el);
                const height = el.scrollHeight;
                
                $el.css({
                    height: '0',
                    overflow: 'hidden',
                    display: 'block'
                });

                $el.animate({ height: `${height}px` }, {
                    duration,
                    onComplete: function() {
                        $el.css({ height: '', overflow: '' });
                        if (onComplete) onComplete.call(this);
                    }
                });
            });
        }

        slideUp(duration = 400, onComplete) {
            return this.each(el => {
                const $el = $(el);
                const height = el.offsetHeight;
                
                $el.css({
                    height: `${height}px`,
                    overflow: 'hidden'
                });

                // Force reflow
                el.offsetHeight;

                $el.animate({ height: '0' }, {
                    duration,
                    onComplete: function() {
                        $el.hide().css({ height: '', overflow: '' });
                        if (onComplete) onComplete.call(this);
                    }
                });
            });
        }
    }

    // ========================================
    // FONCTIONS UTILITAIRES GLOBALES
    // ========================================
    
    // Fonction principale de sélection
    function $(selector, context) {
        if (typeof selector === 'string') {
            // Vérifier le cache
            const cacheKey = `${context || 'document'}:${selector}`;
            if (CONFIG.selectorCache.has(cacheKey)) {
                return new DOMWrapper(CONFIG.selectorCache.get(cacheKey));
            }

            const elements = normalizeSelector(selector, context);
            
            // Mettre en cache si pas trop d'éléments
            if (CONFIG.selectorCache.size < CONFIG.cacheMaxSize) {
                CONFIG.selectorCache.set(cacheKey, toArray(elements));
            }

            return new DOMWrapper(elements);
        }
        
        if (selector instanceof DOMWrapper) {
            return selector;
        }

        return new DOMWrapper(normalizeSelector(selector, context));
    }

    // ========================================
    // CRÉATION D'ÉLÉMENTS
    // ========================================
    const DOM = {
        create(tag, options = {}) {
            const el = document.createElement(tag);
            const $el = $(el);

            // Attributs
            if (options.attrs || options.attributes) {
                $el.attr(options.attrs || options.attributes);
            }

            // Classes
            if (options.class || options.className) {
                $el.addClass(options.class || options.className);
            }

            // Styles
            if (options.style || options.styles || options.css) {
                $el.css(options.style || options.styles || options.css);
            }

            // Data attributes
            if (options.data) {
                $el.data(options.data);
            }

            // Contenu
            if (options.text) {
                $el.text(options.text);
            } else if (options.html) {
                $el.html(options.html);
            }

            // Enfants
            if (options.children) {
                options.children.forEach(child => {
                    if (typeof child === 'string') {
                        el.insertAdjacentHTML('beforeend', child);
                    } else if (isElement(child)) {
                        el.appendChild(child);
                    } else if (child && child.element) {
                        el.appendChild(child.element);
                    }
                });
            }

            // Parent
            if (options.parent) {
                $(options.parent).append(el);
            }

            // Événements
            if (options.events) {
                Object.entries(options.events).forEach(([event, handler]) => {
                    $el.on(event, handler);
                });
            }

            // Animation d'entrée
            if (options.animate) {
                $el.animate(options.animate, options.animateOptions);
            }

            return {
                element: el,
                $: $el,
                appendTo(parent) {
                    $(parent).append(el);
                    return this;
                },
                prependTo(parent) {
                    $(parent).prepend(el);
                    return this;
                }
            };
        },

        fragment() {
            return document.createDocumentFragment();
        },

        fromHTML(html) {
            const template = document.createElement('template');
            template.innerHTML = html.trim();
            return template.content.firstElementChild;
        },

        fromTemplate(selector) {
            const template = document.querySelector(selector);
            if (!template) return null;
            return template.content.cloneNode(true);
        }
    };

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    const Events = {
        // Debounce
        debounce(func, wait = CONFIG.performance.debounceDelay) {
            let timeout;
            return function debounced(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        // Throttle
        throttle(func, limit = CONFIG.performance.throttleDelay) {
            let inThrottle;
            return function throttled(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Event delegation helper
        delegate(parent, event, selector, handler) {
            $(parent).on(event, selector, handler);
        },

        // Touch/Mouse unification
        unifyTouch(element, handlers = {}) {
            const $el = $(element);
            const isTouchDevice = 'ontouchstart' in window;
            
            const events = isTouchDevice ? CONFIG.touchEvents : CONFIG.mouseEvents;
            
            if (handlers.start) $el.on(events.start, handlers.start);
            if (handlers.move) $el.on(events.move, handlers.move);
            if (handlers.end) $el.on(events.end, handlers.end);
            if (handlers.cancel) $el.on(events.cancel, handlers.cancel);
            
            return () => {
                if (handlers.start) $el.off(events.start, handlers.start);
                if (handlers.move) $el.off(events.move, handlers.move);
                if (handlers.end) $el.off(events.end, handlers.end);
                if (handlers.cancel) $el.off(events.cancel, handlers.cancel);
            };
        }
    };

    // ========================================
    // ANIMATIONS ET TRANSITIONS
    // ========================================
    const Animations = {
        // Attendre la fin d'une transition CSS
        waitForTransition(element, property) {
            return new Promise(resolve => {
                const el = $(element).elements[0];
                if (!el) {
                    resolve();
                    return;
                }

                const handler = (e) => {
                    if (!property || e.propertyName === property) {
                        el.removeEventListener('transitionend', handler);
                        resolve();
                    }
                };

                el.addEventListener('transitionend', handler);
                
                // Timeout de sécurité
                setTimeout(() => {
                    el.removeEventListener('transitionend', handler);
                    resolve();
                }, 5000);
            });
        },

        // Attendre la fin d'une animation CSS
        waitForAnimation(element) {
            return new Promise(resolve => {
                const el = $(element).elements[0];
                if (!el) {
                    resolve();
                    return;
                }

                const handler = () => {
                    el.removeEventListener('animationend', handler);
                    resolve();
                };

                el.addEventListener('animationend', handler);
                
                // Timeout de sécurité
                setTimeout(() => {
                    el.removeEventListener('animationend', handler);
                    resolve();
                }, 5000);
            });
        },

        // Force reflow
        forceReflow(element) {
            const el = $(element).elements[0];
            if (el) {
                void el.offsetHeight;
            }
        },

        // Request Animation Frame helper
        raf(callback) {
            return window.requestAnimationFrame(callback);
        },

        // Cancel Animation Frame
        cancelRaf(id) {
            window.cancelAnimationFrame(id);
        },

        // Animation frame loop
        loop(callback) {
            let running = true;
            let lastTime = 0;

            const frame = (time) => {
                if (!running) return;
                
                const deltaTime = time - lastTime;
                lastTime = time;
                
                callback(deltaTime, time);
                Animations.raf(frame);
            };

            Animations.raf(frame);

            return () => {
                running = false;
            };
        }
    };

    // ========================================
    // PERFORMANCE ET OPTIMISATION
    // ========================================
    const Performance = {
        // Batch DOM reads
        batchRead(callbacks) {
            return new Promise(resolve => {
                Animations.raf(() => {
                    const results = callbacks.map(cb => cb());
                    resolve(results);
                });
            });
        },

        // Batch DOM writes
        batchWrite(callbacks) {
            return new Promise(resolve => {
                Animations.raf(() => {
                    callbacks.forEach(cb => cb());
                    resolve();
                });
            });
        },

        // Batch reads and writes
        batch(reads = [], writes = []) {
            return Performance.batchRead(reads).then(results => {
                return Performance.batchWrite(writes).then(() => results);
            });
        },

        // Lazy load images
        lazyLoadImages(selector = 'img[data-src]', options = {}) {
            const images = $(selector).elements;
            
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: options.rootMargin || '50px',
                    threshold: options.threshold || 0.01
                });

                images.forEach(img => imageObserver.observe(img));
                
                return () => {
                    images.forEach(img => imageObserver.unobserve(img));
                    imageObserver.disconnect();
                };
            } else {
                // Fallback
                images.forEach(img => {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                });
            }
        },

        // Virtual scrolling helper
        virtualScroll(container, items, itemHeight, renderItem) {
            const $container = $(container);
            const containerHeight = $container.height();
            const totalHeight = items.length * itemHeight;
            const visibleCount = Math.ceil(containerHeight / itemHeight);
            const overscan = 3;

            let scrollTop = 0;
            let startIndex = 0;
            let endIndex = visibleCount + overscan;

            const wrapper = DOM.create('div', {
                styles: {
                    height: `${totalHeight}px`,
                    position: 'relative'
                }
            });

            const viewport = DOM.create('div', {
                styles: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0
                }
            });

            $container.empty().append(wrapper.element);
            wrapper.$.append(viewport.element);

            const render = () => {
                viewport.$.empty();
                
                for (let i = startIndex; i < endIndex && i < items.length; i++) {
                    const item = renderItem(items[i], i);
                    const $item = $(item);
                    $item.css({
                        position: 'absolute',
                        top: `${i * itemHeight}px`,
                        left: 0,
                        right: 0
                    });
                    viewport.$.append(item);
                }
            };

            $container.on('scroll', Events.throttle(() => {
                scrollTop = container.scrollTop;
                startIndex = Math.floor(scrollTop / itemHeight) - overscan;
                startIndex = Math.max(0, startIndex);
                endIndex = startIndex + visibleCount + (overscan * 2);
                render();
            }, 16));

            render();

            return {
                update(newItems) {
                    items = newItems;
                    wrapper.$.css('height', `${items.length * itemHeight}px`);
                    render();
                },
                destroy() {
                    $container.off('scroll').empty();
                }
            };
        }
    };

    // ========================================
    // DÉTECTION ET MESURES
    // ========================================
    const Detection = {
        // Vérifier si l'élément est visible
        isVisible(element) {
            const el = $(element).elements[0];
            if (!el) return false;
            
            const rect = el.getBoundingClientRect();
            const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
            
            return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
        },

        // Vérifier si l'élément est dans le viewport
        isInViewport(element, threshold = 0) {
            const el = $(element).elements[0];
            if (!el) return false;
            
            const rect = el.getBoundingClientRect();
            
            return (
                rect.top >= -threshold &&
                rect.left >= -threshold &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
            );
        },

        // Observer la visibilité
        observeVisibility(elements, callback, options = {}) {
            const $elements = $(elements);
            
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        callback(entry.target, entry.isIntersecting, entry);
                    });
                }, {
                    root: options.root || null,
                    rootMargin: options.rootMargin || '0px',
                    threshold: options.threshold || CONFIG.performance.observerThreshold
                });

                $elements.each(el => observer.observe(el));

                return () => {
                    $elements.each(el => observer.unobserve(el));
                    observer.disconnect();
                };
            } else {
                // Fallback avec scroll
                const checkVisibility = Events.throttle(() => {
                    $elements.each(el => {
                        const isVisible = Detection.isInViewport(el);
                        callback(el, isVisible);
                    });
                }, 100);

                $(window).on('scroll resize', checkVisibility);
                checkVisibility();

                return () => {
                    $(window).off('scroll resize', checkVisibility);
                };
            }
        },

        // Observer les mutations
        observeMutations(element, callback, options = {}) {
            const el = $(element).elements[0];
            if (!el || !window.MutationObserver) return () => {};

            const observer = new MutationObserver(callback);
            observer.observe(el, {
                childList: options.childList !== false,
                attributes: options.attributes !== false,
                characterData: options.characterData !== false,
                subtree: options.subtree !== false,
                attributeOldValue: options.attributeOldValue || false,
                characterDataOldValue: options.characterDataOldValue || false,
                attributeFilter: options.attributeFilter || undefined
            });

            return () => observer.disconnect();
        },

        // Observer le resize
        observeResize(element, callback) {
            const el = $(element).elements[0];
            if (!el) return () => {};

            if (window.ResizeObserver) {
                const observer = new ResizeObserver(entries => {
                    entries.forEach(entry => {
                        callback(entry.target, entry.contentRect);
                    });
                });
                observer.observe(el);
                return () => observer.disconnect();
            } else {
                // Fallback avec window resize
                const handler = Events.debounce(() => {
                    callback(el, el.getBoundingClientRect());
                }, 100);
                $(window).on('resize', handler);
                return () => $(window).off('resize', handler);
            }
        },

        // Obtenir la distance de scroll
        getScrollPosition() {
            return {
                x: window.pageXOffset || document.documentElement.scrollLeft,
                y: window.pageYOffset || document.documentElement.scrollTop
            };
        },

        // Obtenir les dimensions du viewport
        getViewportSize() {
            return {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight
            };
        }
    };

    // ========================================
    // HELPERS SUPPLÉMENTAIRES
    // ========================================
    const Helpers = {
        // Escape HTML
        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        // Parse HTML string
        parseHTML(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            return toArray(doc.body.childNodes);
        },

        // Sérialiser un formulaire
        serializeForm(form) {
            const $form = $(form);
            const formData = {};
            
            $form.find('input, select, textarea').each(el => {
                const name = el.name;
                if (!name) return;
                
                if (el.type === 'checkbox') {
                    if (!formData[name]) formData[name] = [];
                    if (el.checked) formData[name].push(el.value);
                } else if (el.type === 'radio') {
                    if (el.checked) formData[name] = el.value;
                } else {
                    formData[name] = el.value;
                }
            });
            
            return formData;
        },

        // Obtenir le préfixe vendeur pour une propriété
        getPrefixedProperty,

        // Vérifier le support d'une propriété CSS
        supportsCSSProperty(property) {
            const prefixed = getPrefixedProperty(property);
            return prefixed in document.documentElement.style;
        },

        // Générer un ID unique
        uniqueId(prefix = 'dom-utils-') {
            return prefix + Math.random().toString(36).substr(2, 9);
        },

        // Deep merge d'objets
        deepMerge(...objects) {
            const result = {};
            
            objects.forEach(obj => {
                Object.keys(obj).forEach(key => {
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        result[key] = Helpers.deepMerge(result[key] || {}, obj[key]);
                    } else {
                        result[key] = obj[key];
                    }
                });
            });
            
            return result;
        }
    };

    // ========================================
    // FONCTION HELPER POUR LES PRÉFIXES
    // ========================================
    function getPrefixedProperty(property) {
        if (!(property in document.documentElement.style)) {
            const prefixed = CONFIG.vendorPrefixes.find(prefix => {
                const prop = prefix + property.charAt(0).toUpperCase() + property.slice(1);
                return prop in document.documentElement.style;
            });
            
            if (prefixed) {
                return prefixed + property.charAt(0).toUpperCase() + property.slice(1);
            }
        }
        return property;
    }

    // ========================================
    // MÉTHODES STATIQUES SUR $
    // ========================================
    Object.assign($, {
        // Expose la classe DOMWrapper
        DOMWrapper,
        
        // Modules
        DOM,
        Events,
        Animations,
        Performance,
        Detection,
        Helpers,
        
        // Configuration
        config: CONFIG,
        
        // Méthodes utilitaires directes
        create: DOM.create,
        fragment: DOM.fragment,
        fromHTML: DOM.fromHTML,
        fromTemplate: DOM.fromTemplate,
        
        debounce: Events.debounce,
        throttle: Events.throttle,
        delegate: Events.delegate,
        unifyTouch: Events.unifyTouch,
        
        waitForTransition: Animations.waitForTransition,
        waitForAnimation: Animations.waitForAnimation,
        forceReflow: Animations.forceReflow,
        raf: Animations.raf,
        cancelRaf: Animations.cancelRaf,
        loop: Animations.loop,
        
        batch: Performance.batch,
        batchRead: Performance.batchRead,
        batchWrite: Performance.batchWrite,
        lazyLoadImages: Performance.lazyLoadImages,
        virtualScroll: Performance.virtualScroll,
        
        isVisible: Detection.isVisible,
        isInViewport: Detection.isInViewport,
        observeVisibility: Detection.observeVisibility,
        observeMutations: Detection.observeMutations,
        observeResize: Detection.observeResize,
        getScrollPosition: Detection.getScrollPosition,
        getViewportSize: Detection.getViewportSize,
        
        escapeHtml: Helpers.escapeHtml,
        parseHTML: Helpers.parseHTML,
        serializeForm: Helpers.serializeForm,
        supportsCSSProperty: Helpers.supportsCSSProperty,
        uniqueId: Helpers.uniqueId,
        deepMerge: Helpers.deepMerge,

        // Méthodes globales
        ready(callback) {
            if (document.readyState !== 'loading') {
                callback();
            } else {
                document.addEventListener('DOMContentLoaded', callback);
            }
        },

        ajax(options) {
            return fetch(options.url, {
                method: options.method || 'GET',
                headers: options.headers || {},
                body: options.data ? JSON.stringify(options.data) : undefined
            }).then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return options.dataType === 'json' ? response.json() : response.text();
            });
        }
    });

    // ========================================
    // EXPORT
    // ========================================
    
    // AMD
    if (typeof define === 'function' && define.amd) {
        define(() => $);
    }
    // CommonJS
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = $;
    }
    // Global
    else {
        global.$ = global.DOMUtils = $;
    }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date création] - Event namespacing
   Solution: Parser les événements avec split('.')
   
   [Date création] - Memory leaks avec handlers
   Cause: Références circulaires
   Résolution: Stockage des handlers dans _domUtilsHandlers
   
   [Date création] - Performance sélecteurs
   Cause: Requêtes répétées
   Résolution: Cache de sélecteurs avec limite
   
   NOTES POUR REPRISES FUTURES:
   - Le cache de sélecteurs a une limite pour éviter les fuites mémoire
   - Les préfixes vendeurs sont détectés automatiquement
   - L'API est chainable comme jQuery mais en vanilla
   - Support des anciens navigateurs avec polyfills
   ======================================== */