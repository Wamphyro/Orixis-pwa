// ========================================
// DATE.UTILS.JS - Utilitaires de dates
// Chemin: src/utils/date.utils.js
//
// DESCRIPTION:
// Fonctions utilitaires pour formater les dates
// ========================================

/**
 * Formater une date selon le format spécifié
 * @param {Date|string|number} date - La date à formater
 * @param {string} format - Le format désiré
 * @returns {string} La date formatée
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '-';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return '-';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * Formater une date en français
 * @param {Date|string|number} date - La date à formater
 * @param {string} type - Type de format ('jour', 'mois', 'complet')
 * @returns {string} La date formatée en français
 */
export function formatDateFr(date, type = 'jour') {
    if (!date) return '-';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return '-';
    
    switch (type) {
        case 'jour':
            return d.toLocaleDateString('fr-FR');
        case 'mois':
            return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        case 'complet':
        default:
            return d.toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    }
}