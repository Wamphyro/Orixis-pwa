/* ========================================
   DATES.UTILS.JS - Utilitaires de gestion des dates
   Chemin: src/utils/core/dates.utils.js
   
   DESCRIPTION:
   Service centralisé pour la manipulation des dates et timestamps.
   Gère particulièrement les Timestamps Firestore, les conversions,
   les calculs de périodes et le formatage. Corrige les bugs de
   conversion Timestamp présents dans le code actuel.
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. CONVERSIONS DE BASE
   3. FORMATAGE DE DATES
   4. CALCULS ET PÉRIODES
   5. TIMESTAMPS FIRESTORE
   6. VALIDATIONS
   7. HELPERS MÉTIER
   8. HELPERS PRIVÉS
   9. EXPORT
   
   UTILISATION:
   import { safeTimestampToDate, formaterDate } from '/Orixis-pwa/src/utils/core/dates.utils.js';
   const date = safeTimestampToDate(timestamp);
   const formatted = formaterDate(date, 'full');
   
   API PUBLIQUE:
   - safeTimestampToDate(timestamp) - Conversion sécurisée Timestamp → Date
   - formaterDate(date, format) - Formatage flexible de dates
   - parseDate(dateStr) - Parse sécurisé de string → Date
   - getDateRange(periode) - Obtenir plage de dates (today, week, month)
   - isToday(date) - Vérifier si date est aujourd'hui
   - addDays(date, days) - Ajouter/retirer des jours
   - daysBetween(date1, date2) - Nombre de jours entre deux dates
   - formatPeriode(date) - Format YYYY-MM pour période
   
   DÉPENDANCES:
   - Intl.DateTimeFormat pour formatage localisé
   - Pas de dépendances externes (pas de moment.js)
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale, correction bug Timestamps Firestore
   
   AUTEUR: Assistant Claude (basé sur bugs identifiés)
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. IMPORTS ET CONFIGURATION
// ========================================

/**
 * Configuration locale et formats
 * @private
 */
const CONFIG = {
    LOCALE: 'fr-FR',
    TIMEZONE: 'Europe/Paris',
    DEFAULT_FORMAT: 'short',
    WEEK_START: 1, // Lundi
    DATE_SEPARATOR: '/',
    TIME_SEPARATOR: ':'
};

/**
 * Formats prédéfinis pour Intl.DateTimeFormat
 * @private
 */
const DATE_FORMATS = {
    // Formats courts
    short: { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    },
    
    // Formats moyens
    medium: { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    },
    
    // Formats longs
    long: { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    },
    
    // Formats complets avec heure
    full: { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    },
    
    // Format datetime court
    datetime: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    },
    
    // Format heure seule
    time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    },
    
    // Format ISO
    iso: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }
};

/**
 * Noms des mois en français
 * @private
 */
const MOIS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Noms des jours en français
 * @private
 */
const JOURS_FR = [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 
    'Jeudi', 'Vendredi', 'Samedi'
];

// ========================================
// 2. CONVERSIONS DE BASE
// ========================================

/**
 * Conversion sécurisée de Timestamp Firestore vers Date
 * CORRIGE LE BUG : gestion de tous les formats possibles
 * 
 * @param {any} timestamp - Timestamp Firestore, Date, string, number ou null
 * @returns {Date|null} Date valide ou null
 * 
 * @example
 * // Timestamp Firestore
 * safeTimestampToDate(firestoreTimestamp) // Date
 * 
 * // Date existante
 * safeTimestampToDate(new Date()) // Date
 * 
 * // String ISO
 * safeTimestampToDate('2025-02-08T14:30:00') // Date
 * 
 * // Timestamp Unix (millisecondes)
 * safeTimestampToDate(1707398429000) // Date
 * 
 * // Valeur invalide
 * safeTimestampToDate(null) // null
 */
export function safeTimestampToDate(timestamp) {
    // Cas null/undefined
    if (!timestamp) return null;
    
    try {
        // Cas 1 : Timestamp Firestore avec méthode toDate()
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        
        // Cas 2 : Timestamp Firestore avec seconds (objet)
        if (timestamp.seconds !== undefined) {
            return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
        }
        
        // Cas 3 : Déjà une Date
        if (timestamp instanceof Date) {
            // Vérifier que la date est valide
            return isNaN(timestamp.getTime()) ? null : timestamp;
        }
        
        // Cas 4 : String ISO ou autre format
        if (typeof timestamp === 'string') {
            const parsed = new Date(timestamp);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        
        // Cas 5 : Number (timestamp Unix en millisecondes)
        if (typeof timestamp === 'number') {
            // Si le nombre est trop petit, c'est probablement en secondes
            const date = timestamp < 10000000000 
                ? new Date(timestamp * 1000) 
                : new Date(timestamp);
            return isNaN(date.getTime()) ? null : date;
        }
        
        // Cas 6 : Objet avec _seconds (format Firestore alternatif)
        if (timestamp._seconds !== undefined) {
            return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
        }
        
        // Cas par défaut : tenter une conversion
        const attempted = new Date(timestamp);
        return isNaN(attempted.getTime()) ? null : attempted;
        
    } catch (error) {
        console.error('❌ Erreur safeTimestampToDate:', error);
        return null;
    }
}

/**
 * Parser une string en Date de manière sécurisée
 * 
 * @param {string} dateStr - String à parser
 * @param {string} [format] - Format attendu (optionnel)
 * @returns {Date|null} Date ou null si invalide
 * 
 * @example
 * parseDate('2025-02-08')           // Date
 * parseDate('08/02/2025')           // Date
 * parseDate('8 février 2025')       // Date
 * parseDate('invalid')              // null
 */
export function parseDate(dateStr, format) {
    if (!dateStr) return null;
    
    try {
        // Nettoyer la string
        const cleaned = String(dateStr).trim();
        
        // Format DD/MM/YYYY français
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
            const [day, month, year] = cleaned.split('/');
            const date = new Date(year, month - 1, day);
            return isNaN(date.getTime()) ? null : date;
        }
        
        // Format YYYY-MM-DD ISO
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
            const date = new Date(cleaned + 'T00:00:00');
            return isNaN(date.getTime()) ? null : date;
        }
        
        // Tenter le parsing natif
        const date = new Date(cleaned);
        return isNaN(date.getTime()) ? null : date;
        
    } catch (error) {
        console.error('❌ Erreur parseDate:', error);
        return null;
    }
}

/**
 * Convertir une Date en Timestamp Firestore-like
 * 
 * @param {Date} date - Date à convertir
 * @returns {Object} Objet Timestamp-like {seconds, nanoseconds}
 * 
 * @example
 * dateToTimestamp(new Date()) 
 * // { seconds: 1707398429, nanoseconds: 0 }
 */
export function dateToTimestamp(date) {
    if (!date || !(date instanceof Date)) {
        return null;
    }
    
    return {
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: (date.getTime() % 1000) * 1000000
    };
}

// ========================================
// 3. FORMATAGE DE DATES
// ========================================

/**
 * Formater une date selon différents formats
 * 
 * @param {Date|any} date - Date ou Timestamp à formater
 * @param {string} [format='short'] - Format souhaité
 * @returns {string} Date formatée ou '-'
 * 
 * @example
 * formaterDate(new Date())              // "08/02/2025"
 * formaterDate(new Date(), 'long')      // "08 février 2025"
 * formaterDate(new Date(), 'full')      // "08 février 2025 à 14:30"
 * formaterDate(timestamp, 'datetime')   // "08/02/2025 14:30"
 * formaterDate(null)                    // "-"
 */
export function formaterDate(date, format = CONFIG.DEFAULT_FORMAT) {
    // Conversion sécurisée
    const dateObj = safeTimestampToDate(date);
    if (!dateObj) return '-';
    
    try {
        // Formats spéciaux
        if (format === 'relative') {
            return formaterDateRelative(dateObj);
        }
        
        if (format === 'iso') {
            return dateObj.toISOString().split('T')[0];
        }
        
        if (format === 'custom') {
            return formaterDateCustom(dateObj);
        }
        
        // Utiliser Intl.DateTimeFormat
        const options = DATE_FORMATS[format] || DATE_FORMATS.short;
        const formatted = new Intl.DateTimeFormat(CONFIG.LOCALE, options).format(dateObj);
        
        // Pour le format 'full', remplacer la virgule par 'à'
        if (format === 'full' && formatted.includes(',')) {
            return formatted.replace(',', ' à');
        }
        
        return formatted;
        
    } catch (error) {
        console.error('❌ Erreur formaterDate:', error);
        return dateObj.toLocaleDateString(CONFIG.LOCALE);
    }
}

/**
 * Formater une date de manière relative (il y a X jours)
 * 
 * @param {Date} date - Date à formater
 * @returns {string} Date relative
 * 
 * @example
 * formaterDateRelative(new Date())              // "Aujourd'hui"
 * formaterDateRelative(yesterday)               // "Hier"
 * formaterDateRelative(twoDaysAgo)              // "Il y a 2 jours"
 * formaterDateRelative(nextWeek)                // "Dans 7 jours"
 */
export function formaterDateRelative(date) {
    const dateObj = safeTimestampToDate(date);
    if (!dateObj) return '-';
    
    const now = new Date();
    const diff = dateObj - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Aujourd'hui
    if (days === 0 && dateObj.toDateString() === now.toDateString()) {
        return 'Aujourd\'hui';
    }
    
    // Hier
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
        return 'Hier';
    }
    
    // Demain
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateObj.toDateString() === tomorrow.toDateString()) {
        return 'Demain';
    }
    
    // Passé
    if (days < 0) {
        const absDays = Math.abs(days);
        if (absDays === 1) return 'Hier';
        if (absDays < 7) return `Il y a ${absDays} jours`;
        if (absDays < 30) return `Il y a ${Math.floor(absDays / 7)} semaine${absDays >= 14 ? 's' : ''}`;
        if (absDays < 365) return `Il y a ${Math.floor(absDays / 30)} mois`;
        return `Il y a ${Math.floor(absDays / 365)} an${absDays >= 730 ? 's' : ''}`;
    }
    
    // Futur
    if (days === 1) return 'Demain';
    if (days < 7) return `Dans ${days} jours`;
    if (days < 30) return `Dans ${Math.floor(days / 7)} semaine${days >= 14 ? 's' : ''}`;
    if (days < 365) return `Dans ${Math.floor(days / 30)} mois`;
    return `Dans ${Math.floor(days / 365)} an${days >= 730 ? 's' : ''}`;
}

/**
 * Formater l'heure seule
 * 
 * @param {Date|any} date - Date ou timestamp
 * @param {boolean} [withSeconds=false] - Inclure les secondes
 * @returns {string} Heure formatée
 * 
 * @example
 * formaterHeure(new Date())        // "14:30"
 * formaterHeure(new Date(), true)  // "14:30:45"
 */
export function formaterHeure(date, withSeconds = false) {
    const dateObj = safeTimestampToDate(date);
    if (!dateObj) return '-';
    
    const options = withSeconds 
        ? { hour: '2-digit', minute: '2-digit', second: '2-digit' }
        : { hour: '2-digit', minute: '2-digit' };
    
    return dateObj.toLocaleTimeString(CONFIG.LOCALE, options);
}

// ========================================
// 4. CALCULS ET PÉRIODES
// ========================================

/**
 * Obtenir une plage de dates selon une période
 * 
 * @param {string} periode - 'today', 'week', 'month', 'year', 'all'
 * @param {Date} [referenceDate] - Date de référence (défaut: aujourd'hui)
 * @returns {Object} {start: Date, end: Date}
 * 
 * @example
 * getDateRange('today')  // {start: debut_jour, end: fin_jour}
 * getDateRange('week')   // {start: lundi, end: dimanche}
 * getDateRange('month')  // {start: 1er_du_mois, end: dernier_du_mois}
 */
export function getDateRange(periode, referenceDate = new Date()) {
    const ref = new Date(referenceDate);
    let start, end;
    
    switch (periode) {
        case 'today':
            start = new Date(ref);
            start.setHours(0, 0, 0, 0);
            end = new Date(ref);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'yesterday':
            start = new Date(ref);
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'week':
            start = new Date(ref);
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lundi
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(end.getDate() + 6); // Dimanche
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'month':
            start = new Date(ref.getFullYear(), ref.getMonth(), 1);
            end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'year':
            start = new Date(ref.getFullYear(), 0, 1);
            end = new Date(ref.getFullYear(), 11, 31);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'last7days':
            end = new Date(ref);
            end.setHours(23, 59, 59, 999);
            start = new Date(ref);
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            break;
            
        case 'last30days':
            end = new Date(ref);
            end.setHours(23, 59, 59, 999);
            start = new Date(ref);
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            break;
            
        case 'all':
        default:
            start = new Date(2020, 0, 1); // Date arbitraire ancienne
            end = new Date(2100, 11, 31); // Date arbitraire future
            break;
    }
    
    return { start, end };
}

/**
 * Ajouter ou retirer des jours à une date
 * 
 * @param {Date} date - Date de base
 * @param {number} days - Nombre de jours (négatif pour retirer)
 * @returns {Date} Nouvelle date
 * 
 * @example
 * addDays(new Date(), 7)   // Dans 7 jours
 * addDays(new Date(), -3)  // Il y a 3 jours
 */
export function addDays(date, days) {
    const result = new Date(safeTimestampToDate(date) || new Date());
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Ajouter ou retirer des mois à une date
 * 
 * @param {Date} date - Date de base
 * @param {number} months - Nombre de mois
 * @returns {Date} Nouvelle date
 */
export function addMonths(date, months) {
    const result = new Date(safeTimestampToDate(date) || new Date());
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Calculer le nombre de jours entre deux dates
 * 
 * @param {Date} date1 - Première date
 * @param {Date} date2 - Deuxième date
 * @returns {number} Nombre de jours (peut être négatif)
 * 
 * @example
 * daysBetween(new Date('2025-01-01'), new Date('2025-01-10'))  // 9
 */
export function daysBetween(date1, date2) {
    const d1 = safeTimestampToDate(date1);
    const d2 = safeTimestampToDate(date2);
    
    if (!d1 || !d2) return 0;
    
    const diff = d2 - d1;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Obtenir le début du jour
 * 
 * @param {Date} date - Date
 * @returns {Date} Date à 00:00:00
 */
export function startOfDay(date) {
    const result = new Date(safeTimestampToDate(date) || new Date());
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Obtenir la fin du jour
 * 
 * @param {Date} date - Date
 * @returns {Date} Date à 23:59:59
 */
export function endOfDay(date) {
    const result = new Date(safeTimestampToDate(date) || new Date());
    result.setHours(23, 59, 59, 999);
    return result;
}

// ========================================
// 5. TIMESTAMPS FIRESTORE
// ========================================

/**
 * Créer un timestamp serveur pour Firestore
 * À utiliser lors de la création de documents
 * 
 * @returns {Function} serverTimestamp de Firebase
 * 
 * @example
 * const doc = {
 *     created: getServerTimestamp(),
 *     data: '...'
 * }
 */
export function getServerTimestamp() {
    // Retourner un placeholder qui sera remplacé par Firestore
    return { _methodName: 'serverTimestamp' };
}

/**
 * Convertir un array de Timestamps en Dates
 * 
 * @param {Array} timestamps - Array de timestamps
 * @returns {Array<Date>} Array de dates
 */
export function convertTimestampArray(timestamps) {
    if (!Array.isArray(timestamps)) return [];
    return timestamps.map(ts => safeTimestampToDate(ts)).filter(Boolean);
}

/**
 * Comparer deux timestamps/dates
 * 
 * @param {any} date1 - Premier timestamp/date
 * @param {any} date2 - Deuxième timestamp/date
 * @returns {number} -1 si date1 < date2, 0 si égales, 1 si date1 > date2
 */
export function compareTimestamps(date1, date2) {
    const d1 = safeTimestampToDate(date1);
    const d2 = safeTimestampToDate(date2);
    
    if (!d1 && !d2) return 0;
    if (!d1) return -1;
    if (!d2) return 1;
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
}

// ========================================
// 6. VALIDATIONS
// ========================================

/**
 * Vérifier si une date est valide
 * 
 * @param {any} date - Date à vérifier
 * @returns {boolean} true si valide
 * 
 * @example
 * isValidDate(new Date())        // true
 * isValidDate('2025-02-08')      // true
 * isValidDate('invalid')         // false
 */
export function isValidDate(date) {
    const d = safeTimestampToDate(date);
    return d !== null && !isNaN(d.getTime());
}

/**
 * Vérifier si une date est aujourd'hui
 * 
 * @param {Date} date - Date à vérifier
 * @returns {boolean} true si aujourd'hui
 */
export function isToday(date) {
    const d = safeTimestampToDate(date);
    if (!d) return false;
    
    const today = new Date();
    return d.toDateString() === today.toDateString();
}

/**
 * Vérifier si une date est dans le passé
 * 
 * @param {Date} date - Date à vérifier
 * @returns {boolean} true si passée
 */
export function isPast(date) {
    const d = safeTimestampToDate(date);
    if (!d) return false;
    return d < new Date();
}

/**
 * Vérifier si une date est dans le futur
 * 
 * @param {Date} date - Date à vérifier
 * @returns {boolean} true si future
 */
export function isFuture(date) {
    const d = safeTimestampToDate(date);
    if (!d) return false;
    return d > new Date();
}

/**
 * Vérifier si une date est dans une plage
 * 
 * @param {Date} date - Date à vérifier
 * @param {Date} start - Début de la plage
 * @param {Date} end - Fin de la plage
 * @returns {boolean} true si dans la plage
 */
export function isDateInRange(date, start, end) {
    const d = safeTimestampToDate(date);
    const s = safeTimestampToDate(start);
    const e = safeTimestampToDate(end);
    
    if (!d || !s || !e) return false;
    return d >= s && d <= e;
}

// ========================================
// 7. HELPERS MÉTIER
// ========================================

/**
 * Formater une période au format YYYY-MM
 * 
 * @param {Date} date - Date
 * @returns {string} Période formatée
 * 
 * @example
 * formatPeriode(new Date('2025-02-08'))  // "2025-02"
 */
export function formatPeriode(date) {
    const d = safeTimestampToDate(date);
    if (!d) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Obtenir le mois en lettres
 * 
 * @param {Date} date - Date
 * @param {boolean} [capitalize=true] - Première lettre en majuscule
 * @returns {string} Nom du mois
 * 
 * @example
 * getMoisLettres(new Date('2025-02-08'))  // "FÉVRIER"
 */
export function getMoisLettres(date, capitalize = true) {
    const d = safeTimestampToDate(date);
    if (!d) return '';
    
    const mois = MOIS_FR[d.getMonth()];
    return capitalize ? mois.toUpperCase() : mois;
}

/**
 * Obtenir l'année
 * 
 * @param {Date} date - Date
 * @returns {number} Année
 */
export function getAnnee(date) {
    const d = safeTimestampToDate(date);
    return d ? d.getFullYear() : new Date().getFullYear();
}

/**
 * Créer une date depuis une période YYYY-MM
 * 
 * @param {string} periode - Période au format YYYY-MM
 * @param {boolean} [endOfMonth=false] - Retourner fin du mois
 * @returns {Date|null} Date
 * 
 * @example
 * dateFromPeriode('2025-02')        // 1er février 2025
 * dateFromPeriode('2025-02', true)  // 28 février 2025
 */
export function dateFromPeriode(periode, endOfMonth = false) {
    if (!periode || !periode.includes('-')) return null;
    
    const [year, month] = periode.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1;
    
    if (isNaN(yearNum) || isNaN(monthNum)) return null;
    
    if (endOfMonth) {
        return new Date(yearNum, monthNum + 1, 0, 23, 59, 59);
    }
    
    return new Date(yearNum, monthNum, 1);
}

/**
 * Obtenir le trimestre d'une date
 * 
 * @param {Date} date - Date
 * @returns {number} Trimestre (1-4)
 */
export function getTrimestre(date) {
    const d = safeTimestampToDate(date);
    if (!d) return 0;
    return Math.floor(d.getMonth() / 3) + 1;
}

// ========================================
// 8. HELPERS PRIVÉS
// ========================================

/**
 * Formatage custom pour cas spéciaux
 * 
 * @private
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée custom
 */
function formaterDateCustom(date) {
    const jour = date.getDate();
    const mois = MOIS_FR[date.getMonth()];
    const annee = date.getFullYear();
    const heure = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${jour} ${mois.toLowerCase()} ${annee} à ${heure}h${minute}`;
}

/**
 * Obtenir le numéro de semaine ISO
 * 
 * @private
 * @param {Date} date - Date
 * @returns {number} Numéro de semaine (1-53)
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ========================================
// 9. EXPORT
// ========================================

/**
 * Export par défaut pour import simplifié
 */
export default {
    // Conversions
    safeTimestampToDate,
    parseDate,
    dateToTimestamp,
    
    // Formatage
    formaterDate,
    formaterDateRelative,
    formaterHeure,
    
    // Calculs
    getDateRange,
    addDays,
    addMonths,
    daysBetween,
    startOfDay,
    endOfDay,
    
    // Firestore
    getServerTimestamp,
    convertTimestampArray,
    compareTimestamps,
    
    // Validations
    isValidDate,
    isToday,
    isPast,
    isFuture,
    isDateInRange,
    
    // Métier
    formatPeriode,
    getMoisLettres,
    getAnnee,
    dateFromPeriode,
    getTrimestre,
    
    // Config exportée
    CONFIG,
    MOIS_FR,
    JOURS_FR
};

/* ========================================
   FIN DU FICHIER
   ======================================== */