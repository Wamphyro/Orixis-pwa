// src/js/utils/date.utils.js
/**
 * Utilitaires pour la manipulation des dates
 */

/**
 * Formate une date en format français
 * @param {string|Date} date - Date à formater
 * @returns {string}
 */
export function formatDate(date) {
    if (!date) return 'Non spécifié';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formate une heure
 * @param {string|Date} time - Heure à formater
 * @returns {string}
 */
export function formatTime(time) {
    if (!time) return 'Non spécifié';
    
    if (typeof time === 'string' && time.includes(':')) {
        return time;
    }
    
    const dateObj = typeof time === 'string' ? new Date(time) : time;
    
    return dateObj.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Obtient la date et l'heure actuelles
 * @returns {Object}
 */
export function getCurrentDateTime() {
    const now = new Date();
    
    return {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        timestamp: now.toISOString(),
        formatted: now.toLocaleString('fr-FR')
    };
}

/**
 * Calcule la différence entre deux dates
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {Object}
 */
export function getDateDifference(date1, date2) {
    const diff = Math.abs(date2 - date1);
    
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        milliseconds: diff
    };
}

// src/js/utils/dom.utils.js
/**
 * Utilitaires pour la manipulation du DOM
 */

/**
 * Sélectionne un élément avec gestion d'erreur
 * @param {string} selector - Sélecteur CSS
 * @param {HTMLElement} parent - Parent optionnel
 * @returns {HTMLElement|null}
 */
export function $(selector, parent = document) {
    try {
        return parent.querySelector(selector);
    } catch (error) {
        console.error(`Erreur sélecteur: ${selector}`, error);
        return null;
    }
}

/**
 * Sélectionne plusieurs éléments
 * @param {string} selector - Sélecteur CSS
 * @param {HTMLElement} parent - Parent optionnel
 * @returns {NodeList}
 */
export function $$(selector, parent = document) {
    try {
        return parent.querySelectorAll(selector);
    } catch (error) {
        console.error(`Erreur sélecteur: ${selector}`, error);
        return [];
    }
}

/**
 * Crée un élément HTML avec attributs
 * @param {string} tag - Nom de la balise
 * @param {Object} attributes - Attributs
 * @param {string|HTMLElement} content - Contenu
 * @returns {HTMLElement}
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Attributs
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else {
            element[key] = value;
        }
    });
    
    // Contenu
    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    }
    
    return element;
}

/**
 * Toggle une classe CSS
 * @param {HTMLElement} element 
 * @param {string} className 
 * @param {boolean} force 
 */
export function toggleClass(element, className, force) {
    if (!element) return;
    element.classList.toggle(className, force);
}

/**
 * Affiche/cache un élément
 * @param {HTMLElement} element 
 * @param {boolean} show 
 */
export function toggleDisplay(element, show) {
    if (!element) return;
    element.style.display = show ? '' : 'none';
}

/**
 * Désactive/active un élément
 * @param {HTMLElement} element 
 * @param {boolean} disabled 
 */
export function setDisabled(element, disabled) {
    if (!element) return;
    element.disabled = disabled;
}

// src/js/utils/validation.utils.js
/**
 * Utilitaires de validation
 */

/**
 * Valide un numéro de téléphone français
 * @param {string} phone 
 * @returns {boolean}
 */
export function validatePhone(phone) {
    if (!phone) return false;
    
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone.trim());
}

/**
 * Formate un numéro de téléphone
 * @param {string} phone 
 * @returns {string}
 */
export function formatPhone(phone) {
    if (!phone) return '';
    
    // Supprimer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');
    
    // Format français
    if (cleaned.startsWith('33')) {
        const number = cleaned.substring(2);
        return `+33 ${number.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`;
    }
    
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    return phone;
}

/**
 * Valide un formulaire
 * @param {HTMLFormElement} form 
 * @returns {Object}
 */
export function validateForm(form) {
    if (!form) return { valid: false, errors: ['Formulaire introuvable'] };
    
    const errors = [];
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value || field.value.trim() === '') {
            const label = field.labels?.[0]?.textContent || field.name || field.id;
            errors.push(`Le champ "${label}" est obligatoire`);
        }
    });
    
    // Validation spécifique par type
    const phoneFields = form.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        if (field.value && !validatePhone(field.value)) {
            const label = field.labels?.[0]?.textContent || 'Téléphone';
            errors.push(`${label} invalide`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Obtient les données d'un formulaire
 * @param {HTMLFormElement} form 
 * @returns {Object}
 */
export function getFormData(form) {
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    // Données simples
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Gestion des champs multiples (checkboxes)
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

/**
 * Réinitialise un formulaire
 * @param {HTMLFormElement} form 
 */
export function resetForm(form) {
    if (!form) return;
    
    form.reset();
    
    // Réinitialiser les éléments custom
    form.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
}