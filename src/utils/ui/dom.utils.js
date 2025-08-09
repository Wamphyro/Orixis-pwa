/* ========================================
   DOM.UTILS.JS - Utilitaires de manipulation DOM sécurisés
   Chemin: src/utils/ui/dom.utils.js
   
   DESCRIPTION:
   Service centralisé pour toutes les manipulations du DOM.
   Fournit des méthodes sécurisées contre XSS, des sélecteurs
   robustes qui ne crashent pas, et des helpers pour simplifier
   la création et manipulation d'éléments HTML.
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. SÉLECTEURS SÉCURISÉS
   3. CRÉATION D'ÉLÉMENTS
   4. MANIPULATION DE CLASSES
   5. MANIPULATION DE CONTENU
   6. AFFICHAGE ET VISIBILITÉ
   7. GESTION D'ÉVÉNEMENTS
   8. MANIPULATION D'ATTRIBUTS
   9. UTILITAIRES DE PERFORMANCE
   10. HELPERS SPÉCIALISÉS
   11. PROTECTION XSS
   12. ANIMATIONS
   13. EXPORT
   
   UTILISATION:
   import { $, $$, createElement, setHTML } from '/src/utils/ui/dom.utils.js';
   
   const element = $('.ma-classe');  // Ne crash pas si absent
   const button = createElement('button', { 
       className: 'btn btn-primary',
       textContent: 'Cliquer',
       onClick: () => console.log('Click!')
   });
   
   API PUBLIQUE:
   - $(selector, context) - querySelector sécurisé
   - $$(selector, context) - querySelectorAll en Array
   - createElement(tag, props) - Création d'élément simplifiée
   - setHTML(element, html) - innerHTML sécurisé anti-XSS
   - addClass(element, ...classes) - Ajouter classes
   - removeClass(element, ...classes) - Retirer classes
   - on(target, event, handler, options) - Attacher événement
   - show(element) / hide(element) - Afficher/cacher
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Compatible tous navigateurs modernes
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale avec protection XSS complète
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. IMPORTS ET CONFIGURATION
// ========================================

/**
 * Configuration par défaut
 * @private
 */
const CONFIG = {
    // Délai pour debounce/throttle
    DEFAULT_DEBOUNCE_DELAY: 300,
    DEFAULT_THROTTLE_DELAY: 100,
    
    // Animation
    DEFAULT_ANIMATION_DURATION: 300,
    ANIMATION_EASING: 'ease-in-out',
    
    // Sécurité
    SAFE_URL_PROTOCOLS: ['http:', 'https:', 'mailto:', 'tel:'],
    DANGEROUS_TAGS: ['script', 'iframe', 'object', 'embed', 'link'],
    DANGEROUS_ATTRS: ['onclick', 'onload', 'onerror', 'onmouseover'],
    
    // Performance
    BATCH_SIZE: 100,
    FRAGMENT_THRESHOLD: 10,
    
    // Debug
    DEBUG: localStorage.getItem('DEBUG_DOM') === 'true'
};

/**
 * Cache pour les sélecteurs fréquents
 * @private
 */
const selectorCache = new Map();

/**
 * WeakMap pour stocker les données privées des éléments
 * @private
 */
const elementData = new WeakMap();

// ========================================
// 2. SÉLECTEURS SÉCURISÉS
// ========================================

/**
 * querySelector sécurisé qui ne crash pas
 * 
 * @param {string} selector - Sélecteur CSS
 * @param {Element|Document} [context=document] - Contexte de recherche
 * @returns {Element|null} Élément trouvé ou null
 * 
 * @example
 * const header = $('.header');  // Ne crash pas si absent
 * const button = $('.btn', header);  // Recherche dans header
 */
export function $(selector, context = document) {
    if (!selector || typeof selector !== 'string') {
        return null;
    }
    
    try {
        // Utiliser le cache si possible
        const cacheKey = `${selector}:${context === document ? 'doc' : 'ctx'}`;
        
        if (selectorCache.has(cacheKey)) {
            const cached = selectorCache.get(cacheKey);
            // Vérifier que l'élément est toujours dans le DOM
            if (cached && cached.isConnected) {
                return cached;
            }
            selectorCache.delete(cacheKey);
        }
        
        const element = context.querySelector(selector);
        
        // Mettre en cache si c'est un ID ou une classe simple
        if (element && (selector.startsWith('#') || selector.match(/^\.\w+$/))) {
            selectorCache.set(cacheKey, element);
        }
        
        return element;
        
    } catch (error) {
        if (CONFIG.DEBUG) {
            console.error(`❌ Sélecteur invalide: ${selector}`, error);
        }
        return null;
    }
}

/**
 * querySelectorAll sécurisé retournant un Array
 * 
 * @param {string} selector - Sélecteur CSS
 * @param {Element|Document} [context=document] - Contexte
 * @returns {Array<Element>} Array d'éléments (jamais null)
 * 
 * @example
 * $$('.btn').forEach(btn => addClass(btn, 'active'));
 */
export function $$(selector, context = document) {
    if (!selector || typeof selector !== 'string') {
        return [];
    }
    
    try {
        return Array.from(context.querySelectorAll(selector));
    } catch (error) {
        if (CONFIG.DEBUG) {
            console.error(`❌ Sélecteur invalide: ${selector}`, error);
        }
        return [];
    }
}

/**
 * Chercher le parent le plus proche
 * 
 * @param {Element} element - Élément de départ
 * @param {string} selector - Sélecteur du parent
 * @returns {Element|null} Parent trouvé ou null
 * 
 * @example
 * const form = closest(input, '.form-container');
 */
export function closest(element, selector) {
    if (!element || !selector) return null;
    
    try {
        return element.closest(selector);
    } catch {
        return null;
    }
}

/**
 * Chercher l'élément suivant
 * 
 * @param {Element} element - Élément de référence
 * @param {string} [selector] - Sélecteur optionnel
 * @returns {Element|null} Élément suivant
 */
export function next(element, selector) {
    if (!element) return null;
    
    let nextEl = element.nextElementSibling;
    
    if (!selector) return nextEl;
    
    while (nextEl) {
        if (nextEl.matches(selector)) return nextEl;
        nextEl = nextEl.nextElementSibling;
    }
    
    return null;
}

/**
 * Chercher l'élément précédent
 * 
 * @param {Element} element - Élément de référence
 * @param {string} [selector] - Sélecteur optionnel
 * @returns {Element|null} Élément précédent
 */
export function prev(element, selector) {
    if (!element) return null;
    
    let prevEl = element.previousElementSibling;
    
    if (!selector) return prevEl;
    
    while (prevEl) {
        if (prevEl.matches(selector)) return prevEl;
        prevEl = prevEl.previousElementSibling;
    }
    
    return null;
}

// ========================================
// 3. CRÉATION D'ÉLÉMENTS
// ========================================

/**
 * Créer un élément avec propriétés et enfants
 * 
 * @param {string} tag - Nom de la balise
 * @param {Object} [props={}] - Propriétés et attributs
 * @returns {Element} Nouvel élément
 * 
 * @example
 * const card = createElement('div', {
 *     className: 'card',
 *     id: 'card-1',
 *     dataset: { userId: '123' },
 *     style: { backgroundColor: 'white' },
 *     children: [
 *         createElement('h3', { textContent: 'Titre' }),
 *         createElement('p', { innerHTML: 'Contenu' })
 *     ],
 *     onClick: () => console.log('Click!')
 * });
 */
export function createElement(tag, props = {}) {
    if (!tag) {
        throw new Error('Tag requis pour createElement');
    }
    
    const element = document.createElement(tag);
    
    // Parcourir les propriétés
    Object.entries(props).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        // Gestion spéciale pour certaines propriétés
        switch (key) {
            case 'className':
                element.className = value;
                break;
                
            case 'classList':
                if (Array.isArray(value)) {
                    element.classList.add(...value);
                } else if (typeof value === 'object') {
                    Object.entries(value).forEach(([cls, enabled]) => {
                        if (enabled) element.classList.add(cls);
                    });
                }
                break;
                
            case 'style':
                if (typeof value === 'string') {
                    element.style.cssText = value;
                } else if (typeof value === 'object') {
                    Object.assign(element.style, value);
                }
                break;
                
            case 'dataset':
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
                break;
                
            case 'innerHTML':
                // Utiliser setHTML pour sécurité
                setHTML(element, value);
                break;
                
            case 'textContent':
            case 'innerText':
                element.textContent = value;
                break;
                
            case 'children':
                if (Array.isArray(value)) {
                    value.forEach(child => {
                        if (child) {
                            if (typeof child === 'string') {
                                element.appendChild(document.createTextNode(child));
                            } else if (child instanceof Element) {
                                element.appendChild(child);
                            }
                        }
                    });
                }
                break;
                
            case 'parent':
                if (value instanceof Element) {
                    value.appendChild(element);
                }
                break;
                
            case 'attributes':
                Object.entries(value).forEach(([attr, val]) => {
                    element.setAttribute(attr, val);
                });
                break;
                
            default:
                // Events (onClick, onInput, etc.)
                if (key.startsWith('on') && typeof value === 'function') {
                    const eventName = key.substring(2).toLowerCase();
                    element.addEventListener(eventName, value);
                }
                // Propriétés directes
                else if (key in element) {
                    element[key] = value;
                }
                // Attributs
                else {
                    element.setAttribute(key, value);
                }
        }
    });
    
    return element;
}

/**
 * Créer plusieurs éléments d'un coup
 * 
 * @param {Array<Object>} elements - Tableau de définitions d'éléments
 * @returns {DocumentFragment} Fragment contenant tous les éléments
 * 
 * @example
 * const items = createElements([
 *     { tag: 'li', props: { textContent: 'Item 1' }},
 *     { tag: 'li', props: { textContent: 'Item 2' }}
 * ]);
 * list.appendChild(items);
 */
export function createElements(elements) {
    const fragment = document.createDocumentFragment();
    
    elements.forEach(({ tag, props }) => {
        fragment.appendChild(createElement(tag, props));
    });
    
    return fragment;
}

/**
 * Cloner un élément avec ses événements
 * 
 * @param {Element} element - Élément à cloner
 * @param {boolean} [deep=true] - Clonage profond
 * @returns {Element} Clone de l'élément
 */
export function cloneElement(element, deep = true) {
    if (!element) return null;
    
    const clone = element.cloneNode(deep);
    
    // Copier les données privées si présentes
    if (elementData.has(element)) {
        elementData.set(clone, { ...elementData.get(element) });
    }
    
    return clone;
}

// ========================================
// 4. MANIPULATION DE CLASSES
// ========================================

/**
 * Ajouter une ou plusieurs classes
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {...string} classes - Classes à ajouter
 * @returns {void}
 * 
 * @example
 * addClass(element, 'active', 'highlight');
 * addClass($$('.card'), 'visible');
 */
export function addClass(elements, ...classes) {
    if (!elements || classes.length === 0) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (el && el.classList) {
            classes.forEach(cls => {
                if (cls && typeof cls === 'string') {
                    // Support des classes multiples séparées par espaces
                    cls.split(/\s+/).forEach(c => {
                        if (c) el.classList.add(c);
                    });
                }
            });
        }
    });
}

/**
 * Retirer une ou plusieurs classes
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {...string} classes - Classes à retirer
 * @returns {void}
 */
export function removeClass(elements, ...classes) {
    if (!elements || classes.length === 0) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (el && el.classList) {
            classes.forEach(cls => {
                if (cls && typeof cls === 'string') {
                    cls.split(/\s+/).forEach(c => {
                        if (c) el.classList.remove(c);
                    });
                }
            });
        }
    });
}

/**
 * Basculer une classe
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {string} className - Classe à basculer
 * @param {boolean} [force] - Forcer l'état
 * @returns {void}
 * 
 * @example
 * toggleClass(element, 'active');  // Bascule
 * toggleClass(element, 'active', isActive);  // Force selon condition
 */
export function toggleClass(elements, className, force) {
    if (!elements || !className) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (el && el.classList) {
            el.classList.toggle(className, force);
        }
    });
}

/**
 * Vérifier si un élément a une classe
 * 
 * @param {Element} element - Élément
 * @param {string} className - Classe à vérifier
 * @returns {boolean} true si la classe est présente
 */
export function hasClass(element, className) {
    if (!element || !className) return false;
    return element.classList && element.classList.contains(className);
}

/**
 * Remplacer une classe par une autre
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {string} oldClass - Classe à remplacer
 * @param {string} newClass - Nouvelle classe
 * @returns {void}
 */
export function replaceClass(elements, oldClass, newClass) {
    if (!elements || !oldClass || !newClass) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (el && el.classList) {
            el.classList.replace(oldClass, newClass);
        }
    });
}

// ========================================
// 5. MANIPULATION DE CONTENU
// ========================================

/**
 * Définir le HTML de manière sécurisée (protection XSS)
 * 
 * @param {Element} element - Élément
 * @param {string} html - HTML à insérer
 * @param {Object} [options] - Options
 * @param {boolean} [options.sanitize=true] - Nettoyer le HTML
 * @param {boolean} [options.allowScripts=false] - Autoriser scripts
 * @returns {void}
 * 
 * @example
 * setHTML(element, userContent);  // Sécurisé par défaut
 * setHTML(element, trustedHTML, { sanitize: false });  // HTML de confiance
 */
export function setHTML(element, html, options = {}) {
    if (!element) return;
    
    const config = {
        sanitize: true,
        allowScripts: false,
        ...options
    };
    
    // Si pas de sanitization demandée et HTML de confiance
    if (!config.sanitize) {
        element.innerHTML = html;
        return;
    }
    
    // Sanitizer le HTML
    const sanitized = sanitizeHTML(html, config.allowScripts);
    element.innerHTML = sanitized;
}

/**
 * Définir le texte
 * 
 * @param {Element} element - Élément
 * @param {string} text - Texte
 * @returns {void}
 */
export function setText(element, text) {
    if (!element) return;
    element.textContent = text;
}

/**
 * Obtenir le texte
 * 
 * @param {Element} element - Élément
 * @returns {string} Texte de l'élément
 */
export function getText(element) {
    if (!element) return '';
    return element.textContent || '';
}

/**
 * Vider le contenu d'un élément
 * 
 * @param {Element} element - Élément à vider
 * @returns {void}
 */
export function empty(element) {
    if (!element) return;
    
    // Plus rapide que innerHTML = ''
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Ajouter du contenu à la fin
 * 
 * @param {Element} parent - Parent
 * @param {...(Element|string)} children - Enfants à ajouter
 * @returns {void}
 */
export function append(parent, ...children) {
    if (!parent) return;
    
    children.forEach(child => {
        if (!child) return;
        
        if (typeof child === 'string') {
            parent.appendChild(document.createTextNode(child));
        } else if (child instanceof Element || child instanceof DocumentFragment) {
            parent.appendChild(child);
        }
    });
}

/**
 * Ajouter du contenu au début
 * 
 * @param {Element} parent - Parent
 * @param {...(Element|string)} children - Enfants à ajouter
 * @returns {void}
 */
export function prepend(parent, ...children) {
    if (!parent) return;
    
    const firstChild = parent.firstChild;
    
    children.forEach(child => {
        if (!child) return;
        
        if (typeof child === 'string') {
            parent.insertBefore(document.createTextNode(child), firstChild);
        } else if (child instanceof Element || child instanceof DocumentFragment) {
            parent.insertBefore(child, firstChild);
        }
    });
}

/**
 * Insérer avant un élément
 * 
 * @param {Element} element - Élément de référence
 * @param {Element|string} content - Contenu à insérer
 * @returns {void}
 */
export function insertBefore(element, content) {
    if (!element || !element.parentNode || !content) return;
    
    if (typeof content === 'string') {
        element.insertAdjacentHTML('beforebegin', sanitizeHTML(content));
    } else if (content instanceof Element) {
        element.parentNode.insertBefore(content, element);
    }
}

/**
 * Insérer après un élément
 * 
 * @param {Element} element - Élément de référence
 * @param {Element|string} content - Contenu à insérer
 * @returns {void}
 */
export function insertAfter(element, content) {
    if (!element || !element.parentNode || !content) return;
    
    if (typeof content === 'string') {
        element.insertAdjacentHTML('afterend', sanitizeHTML(content));
    } else if (content instanceof Element) {
        element.parentNode.insertBefore(content, element.nextSibling);
    }
}

// ========================================
// 6. AFFICHAGE ET VISIBILITÉ
// ========================================

/**
 * Afficher un élément
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {string} [display] - Valeur display (auto-détectée)
 * @returns {void}
 */
export function show(elements, display) {
    if (!elements) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (!el) return;
        
        // Retirer display: none
        if (el.style.display === 'none') {
            el.style.display = '';
        }
        
        // Si toujours caché, forcer le display
        if (window.getComputedStyle(el).display === 'none') {
            el.style.display = display || getDefaultDisplay(el.tagName);
        }
        
        // Retirer classe hide si présente
        el.classList.remove('hide', 'hidden', 'd-none');
    });
}

/**
 * Cacher un élément
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @returns {void}
 */
export function hide(elements) {
    if (!elements) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (el) {
            el.style.display = 'none';
        }
    });
}

/**
 * Basculer l'affichage
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {boolean} [force] - Forcer l'état
 * @returns {void}
 */
export function toggle(elements, force) {
    if (!elements) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (!el) return;
        
        const isHidden = window.getComputedStyle(el).display === 'none';
        
        if (force === undefined) {
            isHidden ? show(el) : hide(el);
        } else {
            force ? show(el) : hide(el);
        }
    });
}

/**
 * Vérifier si un élément est visible
 * 
 * @param {Element} element - Élément
 * @returns {boolean} true si visible
 */
export function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
}

/**
 * Vérifier si un élément est dans le viewport
 * 
 * @param {Element} element - Élément
 * @param {number} [threshold=0] - Marge en pixels
 * @returns {boolean} true si dans le viewport
 */
export function isInViewport(element, threshold = 0) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    
    return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
    );
}

// ========================================
// 7. GESTION D'ÉVÉNEMENTS
// ========================================

/**
 * Attacher un événement avec options avancées
 * 
 * @param {Element|string} target - Élément ou sélecteur
 * @param {string} event - Nom de l'événement
 * @param {Function} handler - Handler
 * @param {Object} [options] - Options
 * @returns {Function} Fonction pour détacher l'événement
 * 
 * @example
 * // Simple
 * on('.btn', 'click', handleClick);
 * 
 * // Avec délégation
 * on('.container', 'click', '.btn', handleClick);
 * 
 * // Avec options
 * const off = on(element, 'scroll', handleScroll, {
 *     passive: true,
 *     throttle: 100
 * });
 * // Plus tard : off();
 */
export function on(target, event, selectorOrHandler, handlerOrOptions, options = {}) {
    // Normaliser les arguments (surcharge pour délégation)
    let selector, handler, opts;
    
    if (typeof selectorOrHandler === 'function') {
        handler = selectorOrHandler;
        opts = handlerOrOptions || {};
    } else {
        selector = selectorOrHandler;
        handler = handlerOrOptions;
        opts = options;
    }
    
    // Résoudre la cible
    const elements = typeof target === 'string' ? $$(target) : [target];
    
    if (elements.length === 0) return () => {};
    
    // Wrapper pour options avancées
    let wrappedHandler = handler;
    
    // Debounce
    if (opts.debounce) {
        wrappedHandler = debounce(handler, opts.debounce);
    }
    // Throttle
    else if (opts.throttle) {
        wrappedHandler = throttle(handler, opts.throttle);
    }
    
    // Délégation
    if (selector) {
        const originalHandler = wrappedHandler;
        wrappedHandler = function(e) {
            const delegateTarget = e.target.closest(selector);
            if (delegateTarget && this.contains(delegateTarget)) {
                originalHandler.call(delegateTarget, e);
            }
        };
    }
    
    // Attacher l'événement
    elements.forEach(el => {
        if (el) {
            el.addEventListener(event, wrappedHandler, opts);
        }
    });
    
    // Retourner une fonction pour détacher
    return () => off(elements, event, wrappedHandler, opts);
}

/**
 * Détacher un événement
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {string} event - Nom de l'événement
 * @param {Function} handler - Handler
 * @param {Object} [options] - Options
 * @returns {void}
 */
export function off(elements, event, handler, options = {}) {
    if (!elements) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (el) {
            el.removeEventListener(event, handler, options);
        }
    });
}

/**
 * Déclencher un événement
 * 
 * @param {Element} element - Élément
 * @param {string} event - Nom de l'événement
 * @param {any} [detail] - Données additionnelles
 * @returns {boolean} true si pas annulé
 */
export function trigger(element, event, detail) {
    if (!element || !event) return false;
    
    let evt;
    
    if (detail !== undefined) {
        evt = new CustomEvent(event, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
    } else {
        evt = new Event(event, {
            bubbles: true,
            cancelable: true
        });
    }
    
    return element.dispatchEvent(evt);
}

/**
 * Attacher un événement une seule fois
 * 
 * @param {Element|string} target - Élément ou sélecteur
 * @param {string} event - Événement
 * @param {Function} handler - Handler
 * @returns {Function} Fonction pour détacher
 */
export function once(target, event, handler) {
    return on(target, event, handler, { once: true });
}

// ========================================
// 8. MANIPULATION D'ATTRIBUTS
// ========================================

/**
 * Définir un ou plusieurs attributs
 * 
 * @param {Element} element - Élément
 * @param {string|Object} name - Nom ou objet d'attributs
 * @param {string} [value] - Valeur si name est string
 * @returns {void}
 * 
 * @example
 * setAttr(element, 'disabled', 'true');
 * setAttr(element, { 
 *     'data-id': '123',
 *     'aria-label': 'Button'
 * });
 */
export function setAttr(element, name, value) {
    if (!element) return;
    
    if (typeof name === 'object') {
        Object.entries(name).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
                element.setAttribute(key, val);
            }
        });
    } else if (name && value !== undefined) {
        element.setAttribute(name, value);
    }
}

/**
 * Obtenir un attribut
 * 
 * @param {Element} element - Élément
 * @param {string} name - Nom de l'attribut
 * @returns {string|null} Valeur de l'attribut
 */
export function getAttr(element, name) {
    if (!element || !name) return null;
    return element.getAttribute(name);
}

/**
 * Retirer un ou plusieurs attributs
 * 
 * @param {Element} element - Élément
 * @param {...string} names - Noms des attributs
 * @returns {void}
 */
export function removeAttr(element, ...names) {
    if (!element) return;
    
    names.forEach(name => {
        if (name) {
            element.removeAttribute(name);
        }
    });
}

/**
 * Vérifier si un attribut existe
 * 
 * @param {Element} element - Élément
 * @param {string} name - Nom de l'attribut
 * @returns {boolean} true si l'attribut existe
 */
export function hasAttr(element, name) {
    if (!element || !name) return false;
    return element.hasAttribute(name);
}

/**
 * Gérer les data attributes
 * 
 * @param {Element} element - Élément
 * @param {string|Object} key - Clé ou objet
 * @param {any} [value] - Valeur si key est string
 * @returns {any} Valeur si lecture, undefined si écriture
 * 
 * @example
 * // Setter
 * data(element, 'userId', '123');
 * data(element, { userId: '123', role: 'admin' });
 * 
 * // Getter
 * const userId = data(element, 'userId');
 * const allData = data(element);
 */
export function data(element, key, value) {
    if (!element) return;
    
    // Getter tous les data
    if (key === undefined) {
        return { ...element.dataset };
    }
    
    // Setter multiple
    if (typeof key === 'object') {
        Object.entries(key).forEach(([k, v]) => {
            element.dataset[k] = v;
        });
        return;
    }
    
    // Getter single
    if (value === undefined) {
        return element.dataset[key];
    }
    
    // Setter single
    element.dataset[key] = value;
}

// ========================================
// 9. UTILITAIRES DE PERFORMANCE
// ========================================

/**
 * Créer un DocumentFragment pour insertions multiples
 * 
 * @param {Function} callback - Fonction recevant le fragment
 * @returns {DocumentFragment} Fragment créé
 * 
 * @example
 * const fragment = createFragment(frag => {
 *     for (let i = 0; i < 1000; i++) {
 *         frag.appendChild(createElement('li', {
 *             textContent: `Item ${i}`
 *         }));
 *     }
 * });
 * list.appendChild(fragment);
 */
export function createFragment(callback) {
    const fragment = document.createDocumentFragment();
    
    if (callback && typeof callback === 'function') {
        callback(fragment);
    }
    
    return fragment;
}

/**
 * Batch DOM updates avec requestAnimationFrame
 * 
 * @param {Function} callback - Fonction de mise à jour
 * @returns {number} ID de l'animation frame
 */
export function batchUpdate(callback) {
    return requestAnimationFrame(callback);
}

/**
 * Debounce une fonction
 * 
 * @private
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debouncée
 */
function debounce(func, wait = CONFIG.DEFAULT_DEBOUNCE_DELAY) {
    let timeout;
    
    return function debounced(...args) {
        const context = this;
        
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Throttle une fonction
 * 
 * @private
 * @param {Function} func - Fonction à throttler
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction throttlée
 */
function throttle(func, wait = CONFIG.DEFAULT_THROTTLE_DELAY) {
    let inThrottle;
    let lastTime = 0;
    
    return function throttled(...args) {
        const context = this;
        const now = Date.now();
        
        if (!inThrottle) {
            func.apply(context, args);
            lastTime = now;
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, wait);
        }
    };
}

// ========================================
// 10. HELPERS SPÉCIALISÉS
// ========================================

/**
 * Attendre que le DOM soit prêt
 * 
 * @param {Function} callback - Fonction à exécuter
 * @returns {void}
 * 
 * @example
 * ready(() => {
 *     console.log('DOM prêt!');
 * });
 */
export function ready(callback) {
    if (!callback || typeof callback !== 'function') return;
    
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    }
}

/**
 * Supprimer un élément du DOM
 * 
 * @param {Element|Array<Element>} elements - Élément(s) à supprimer
 * @returns {void}
 */
export function remove(elements) {
    if (!elements) return;
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    els.forEach(el => {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}

/**
 * Remplacer un élément par un autre
 * 
 * @param {Element} oldElement - Élément à remplacer
 * @param {Element} newElement - Nouvel élément
 * @returns {void}
 */
export function replace(oldElement, newElement) {
    if (!oldElement || !newElement || !oldElement.parentNode) return;
    oldElement.parentNode.replaceChild(newElement, oldElement);
}

/**
 * Wrapper un élément dans un autre
 * 
 * @param {Element} element - Élément à wrapper
 * @param {Element|string} wrapper - Wrapper (élément ou tag)
 * @returns {Element} Le wrapper
 * 
 * @example
 * wrap(element, 'div');
 * wrap(element, createElement('div', { className: 'wrapper' }));
 */
export function wrap(element, wrapper) {
    if (!element || !wrapper) return null;
    
    const wrapperEl = typeof wrapper === 'string' 
        ? document.createElement(wrapper)
        : wrapper;
    
    if (element.parentNode) {
        element.parentNode.insertBefore(wrapperEl, element);
    }
    
    wrapperEl.appendChild(element);
    return wrapperEl;
}

/**
 * Unwrap un élément (retirer son parent)
 * 
 * @param {Element} element - Élément à unwrapper
 * @returns {void}
 */
export function unwrap(element) {
    if (!element || !element.parentNode || !element.parentNode.parentNode) return;
    
    const parent = element.parentNode;
    const grandParent = parent.parentNode;
    
    while (parent.firstChild) {
        grandParent.insertBefore(parent.firstChild, parent);
    }
    
    grandParent.removeChild(parent);
}

/**
 * Obtenir les dimensions d'un élément
 * 
 * @param {Element} element - Élément
 * @returns {Object} Dimensions {width, height, top, left, ...}
 */
export function getDimensions(element) {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    
    return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        x: rect.x,
        y: rect.y,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight
    };
}

/**
 * Scroller vers un élément
 * 
 * @param {Element|string} target - Élément ou sélecteur
 * @param {Object} [options] - Options de scroll
 * @returns {void}
 * 
 * @example
 * scrollTo('#section-2', { 
 *     behavior: 'smooth',
 *     offset: -100  // 100px de marge en haut
 * });
 */
export function scrollTo(target, options = {}) {
    const element = typeof target === 'string' ? $(target) : target;
    
    if (!element) return;
    
    const config = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
        offset: 0,
        ...options
    };
    
    if (config.offset) {
        const top = element.getBoundingClientRect().top + window.pageYOffset + config.offset;
        
        window.scrollTo({
            top: top,
            behavior: config.behavior
        });
    } else {
        element.scrollIntoView({
            behavior: config.behavior,
            block: config.block,
            inline: config.inline
        });
    }
}

// ========================================
// 11. PROTECTION XSS
// ========================================

/**
 * Nettoyer le HTML contre XSS
 * 
 * @private
 * @param {string} html - HTML à nettoyer
 * @param {boolean} [allowScripts=false] - Autoriser scripts
 * @returns {string} HTML nettoyé
 */
function sanitizeHTML(html, allowScripts = false) {
    if (!html) return '';
    
    // Créer un élément temporaire
    const temp = document.createElement('div');
    temp.textContent = html;
    let sanitized = temp.innerHTML;
    
    // Si on veut interpréter le HTML mais sans scripts
    if (!allowScripts) {
        // Parser le HTML
        temp.innerHTML = html;
        
        // Supprimer les tags dangereux
        CONFIG.DANGEROUS_TAGS.forEach(tag => {
            const elements = temp.getElementsByTagName(tag);
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        });
        
        // Supprimer les attributs dangereux
        const allElements = temp.getElementsByTagName('*');
        for (let el of allElements) {
            CONFIG.DANGEROUS_ATTRS.forEach(attr => {
                el.removeAttribute(attr);
            });
            
            // Vérifier les URLs dans href et src
            ['href', 'src'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value && !isSafeURL(value)) {
                    el.removeAttribute(attr);
                }
            });
        }
        
        sanitized = temp.innerHTML;
    }
    
    return sanitized;
}

/**
 * Vérifier si une URL est sûre
 * 
 * @private
 * @param {string} url - URL à vérifier
 * @returns {boolean} true si sûre
 */
function isSafeURL(url) {
    try {
        const parsed = new URL(url, window.location.href);
        return CONFIG.SAFE_URL_PROTOCOLS.includes(parsed.protocol);
    } catch {
        // URL relative
        return !url.startsWith('javascript:') && !url.startsWith('data:');
    }
}

/**
 * Échapper le HTML pour affichage texte
 * 
 * @param {string} str - String à échapper
 * @returns {string} String échappée
 */
export function escapeHTML(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Dé-échapper le HTML
 * 
 * @param {string} str - String échappée
 * @returns {string} String originale
 */
export function unescapeHTML(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || '';
}

// ========================================
// 12. ANIMATIONS
// ========================================

/**
 * Animer un élément avec fade in
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {number} [duration] - Durée en ms
 * @returns {Promise} Promise résolue à la fin
 */
export function fadeIn(elements, duration = CONFIG.DEFAULT_ANIMATION_DURATION) {
    if (!elements) return Promise.resolve();
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    const promises = els.map(el => {
        return new Promise(resolve => {
            if (!el) {
                resolve();
                return;
            }
            
            el.style.opacity = '0';
            el.style.transition = `opacity ${duration}ms ${CONFIG.ANIMATION_EASING}`;
            show(el);
            
            // Force reflow
            el.offsetHeight;
            
            el.style.opacity = '1';
            
            setTimeout(() => {
                el.style.transition = '';
                resolve();
            }, duration);
        });
    });
    
    return Promise.all(promises);
}

/**
 * Animer un élément avec fade out
 * 
 * @param {Element|Array<Element>} elements - Élément(s)
 * @param {number} [duration] - Durée en ms
 * @returns {Promise} Promise résolue à la fin
 */
export function fadeOut(elements, duration = CONFIG.DEFAULT_ANIMATION_DURATION) {
    if (!elements) return Promise.resolve();
    
    const els = Array.isArray(elements) ? elements : [elements];
    
    const promises = els.map(el => {
        return new Promise(resolve => {
            if (!el) {
                resolve();
                return;
            }
            
            el.style.transition = `opacity ${duration}ms ${CONFIG.ANIMATION_EASING}`;
            el.style.opacity = '0';
            
            setTimeout(() => {
                hide(el);
                el.style.transition = '';
                el.style.opacity = '';
                resolve();
            }, duration);
        });
    });
    
    return Promise.all(promises);
}

/**
 * Animer un élément avec slide down
 * 
 * @param {Element} element - Élément
 * @param {number} [duration] - Durée en ms
 * @returns {Promise} Promise résolue à la fin
 */
export function slideDown(element, duration = CONFIG.DEFAULT_ANIMATION_DURATION) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        // Sauvegarder les styles originaux
        const originalStyles = {
            height: element.style.height,
            overflow: element.style.overflow,
            transition: element.style.transition,
            display: element.style.display
        };
        
        // Préparer l'animation
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ${CONFIG.ANIMATION_EASING}`;
        show(element);
        
        // Calculer la hauteur cible
        const targetHeight = element.scrollHeight;
        
        // Force reflow
        element.offsetHeight;
        
        // Animer
        element.style.height = targetHeight + 'px';
        
        setTimeout(() => {
            // Restaurer les styles
            Object.assign(element.style, originalStyles);
            resolve();
        }, duration);
    });
}

/**
 * Animer un élément avec slide up
 * 
 * @param {Element} element - Élément
 * @param {number} [duration] - Durée en ms
 * @returns {Promise} Promise résolue à la fin
 */
export function slideUp(element, duration = CONFIG.DEFAULT_ANIMATION_DURATION) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        // Préparer l'animation
        element.style.height = element.scrollHeight + 'px';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ${CONFIG.ANIMATION_EASING}`;
        
        // Force reflow
        element.offsetHeight;
        
        // Animer
        element.style.height = '0';
        
        setTimeout(() => {
            hide(element);
            element.style.height = '';
            element.style.overflow = '';
            element.style.transition = '';
            resolve();
        }, duration);
    });
}

// ========================================
// HELPERS PRIVÉS
// ========================================

/**
 * Obtenir le display par défaut d'un tag
 * 
 * @private
 * @param {string} tagName - Nom du tag
 * @returns {string} Display par défaut
 */
function getDefaultDisplay(tagName) {
    const defaults = {
        'DIV': 'block',
        'SPAN': 'inline',
        'P': 'block',
        'A': 'inline',
        'UL': 'block',
        'LI': 'list-item',
        'TABLE': 'table',
        'TR': 'table-row',
        'TD': 'table-cell',
        'TH': 'table-cell',
        'THEAD': 'table-header-group',
        'TBODY': 'table-row-group',
        'H1': 'block',
        'H2': 'block',
        'H3': 'block',
        'H4': 'block',
        'H5': 'block',
        'H6': 'block'
    };
    
    return defaults[tagName.toUpperCase()] || 'block';
}

// ========================================
// 13. EXPORT
// ========================================

/**
 * Export par défaut
 */
export default {
    // Sélecteurs
    $,
    $$,
    closest,
    next,
    prev,
    
    // Création
    createElement,
    createElements,
    cloneElement,
    
    // Classes
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    replaceClass,
    
    // Contenu
    setHTML,
    setText,
    getText,
    empty,
    append,
    prepend,
    insertBefore,
    insertAfter,
    
    // Affichage
    show,
    hide,
    toggle,
    isVisible,
    isInViewport,
    
    // Events
    on,
    off,
    once,
    trigger,
    
    // Attributs
    setAttr,
    getAttr,
    removeAttr,
    hasAttr,
    data,
    
    // Performance
    createFragment,
    batchUpdate,
    
    // Helpers
    ready,
    remove,
    replace,
    wrap,
    unwrap,
    getDimensions,
    scrollTo,
    
    // Sécurité
    escapeHTML,
    unescapeHTML,
    
    // Animations
    fadeIn,
    fadeOut,
    slideDown,
    slideUp,
    
    // Config exportée
    CONFIG
};

/* ========================================
   FIN DU FICHIER
   ======================================== */