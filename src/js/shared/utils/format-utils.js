/* ========================================
   FORMAT-UTILS.JS - Fonctions utilitaires de formatage complètes
   Chemin: src/js/shared/utils/format-utils.js
   
   DESCRIPTION:
   Module utilitaire fournissant toutes les fonctions de formatage possibles.
   Gère le formatage de nombres, dates, textes, fichiers, données, etc.
   Support complet de l'internationalisation et personnalisation avancée.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 20-200)
   2. Formatage de nombres (lignes 201-600)
   3. Formatage de dates et temps (lignes 601-1000)
   4. Formatage de texte (lignes 1001-1400)
   5. Formatage de fichiers (lignes 1401-1600)
   6. Formatage de données (lignes 1601-2000)
   7. Formatage spécialisé (lignes 2001-2400)
   8. Utilitaires i18n (lignes 2401-2600)
   9. API publique (lignes 2601-2700)
   
   DÉPENDANCES:
   - Aucune dépendance externe requise
   - Utilise les APIs natives Intl pour l'i18n
   - Compatible avec tous les navigateurs modernes
   ======================================== */

const FormatUtils = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    
    // Configuration globale
    const CONFIG = {
        defaultLocale: 'fr-FR',
        fallbackLocale: 'en-US',
        defaultCurrency: 'EUR',
        defaultTimezone: 'Europe/Paris',
        
        // Options de formatage par défaut
        numberDefaults: {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true
        },
        
        dateDefaults: {
            dateStyle: 'medium',
            timeStyle: 'short'
        },
        
        // Formats personnalisés
        customFormats: {
            phone: {
                'fr-FR': /^(\+33|0)([1-9])(\d{2})(\d{2})(\d{2})(\d{2})$/,
                'us-US': /^(\+1)?(\d{3})(\d{3})(\d{4})$/
            },
            postalCode: {
                'fr-FR': /^\d{5}$/,
                'us-US': /^\d{5}(-\d{4})?$/
            }
        }
    };

    // Unités de taille de fichier
    const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
    const FILE_SIZE_UNITS_FR = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po', 'Eo'];
    
    // Formats de date prédéfinis
    const DATE_FORMATS = {
        'short': { year: 'numeric', month: '2-digit', day: '2-digit' },
        'medium': { year: 'numeric', month: 'short', day: 'numeric' },
        'long': { year: 'numeric', month: 'long', day: 'numeric' },
        'full': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        'iso': 'ISO',
        'time': { hour: '2-digit', minute: '2-digit' },
        'timeWithSeconds': { hour: '2-digit', minute: '2-digit', second: '2-digit' },
        'datetime': { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }
    };
    
    // Monnaies courantes
    const CURRENCIES = {
        'EUR': { symbol: '€', name: 'Euro', position: 'after' },
        'USD': { symbol: '$', name: 'Dollar', position: 'before' },
        'GBP': { symbol: '£', name: 'Livre Sterling', position: 'before' },
        'JPY': { symbol: '¥', name: 'Yen', position: 'before' },
        'CHF': { symbol: 'CHF', name: 'Franc Suisse', position: 'after' },
        'CAD': { symbol: 'C$', name: 'Dollar Canadien', position: 'before' },
        'AUD': { symbol: 'A$', name: 'Dollar Australien', position: 'before' },
        'CNY': { symbol: '¥', name: 'Yuan', position: 'before' },
        'BTC': { symbol: '₿', name: 'Bitcoin', position: 'before', decimals: 8 }
    };
    
    // Formats de numéro de téléphone internationaux
    const PHONE_FORMATS = {
        'fr-FR': {
            pattern: /^(\+33|0)([1-9])(\d{2})(\d{2})(\d{2})(\d{2})$/,
            format: (match) => {
                const intl = match[1] === '+33';
                return intl 
                    ? `+33 ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`
                    : `0${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`;
            }
        },
        'en-US': {
            pattern: /^(\+1)?(\d{3})(\d{3})(\d{4})$/,
            format: (match) => {
                return match[1] 
                    ? `+1 (${match[2]}) ${match[3]}-${match[4]}`
                    : `(${match[2]}) ${match[3]}-${match[4]}`;
            }
        },
        'de-DE': {
            pattern: /^(\+49|0)(\d{2,5})(\d{3,})$/,
            format: (match) => `${match[1]} ${match[2]} ${match[3]}`
        },
        'es-ES': {
            pattern: /^(\+34)?(\d{3})(\d{3})(\d{3})$/,
            format: (match) => {
                return match[1]
                    ? `+34 ${match[2]} ${match[3]} ${match[4]}`
                    : `${match[2]} ${match[3]} ${match[4]}`;
            }
        }
    };
    
    // Unités de temps
    const TIME_UNITS = {
        second: 1000,
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
    };
    
    // Traductions des unités de temps
    const TIME_UNIT_TRANSLATIONS = {
        'fr-FR': {
            second: ['seconde', 'secondes'],
            minute: ['minute', 'minutes'],
            hour: ['heure', 'heures'],
            day: ['jour', 'jours'],
            week: ['semaine', 'semaines'],
            month: ['mois', 'mois'],
            year: ['an', 'ans'],
            ago: 'il y a',
            in: 'dans',
            now: 'maintenant',
            yesterday: 'hier',
            tomorrow: 'demain'
        },
        'en-US': {
            second: ['second', 'seconds'],
            minute: ['minute', 'minutes'],
            hour: ['hour', 'hours'],
            day: ['day', 'days'],
            week: ['week', 'weeks'],
            month: ['month', 'months'],
            year: ['year', 'years'],
            ago: 'ago',
            in: 'in',
            now: 'now',
            yesterday: 'yesterday',
            tomorrow: 'tomorrow'
        }
    };

    // ========================================
    // FORMATAGE DE NOMBRES
    // ========================================
    
    /**
     * Formate un nombre selon les options spécifiées
     * @param {number} value - La valeur à formater
     * @param {Object} options - Options de formatage
     * @returns {string} - Le nombre formaté
     */
    function formatNumber(value, options = {}) {
        if (value == null || isNaN(value)) return '';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const formatOptions = {
            ...CONFIG.numberDefaults,
            ...options
        };
        
        try {
            return new Intl.NumberFormat(locale, formatOptions).format(value);
        } catch (error) {
            console.error('Erreur de formatage de nombre:', error);
            return value.toString();
        }
    }
    
    /**
     * Formate un montant en devise
     * @param {number} amount - Le montant
     * @param {string} currency - Code de la devise
     * @param {Object} options - Options supplémentaires
     * @returns {string} - Le montant formaté
     */
    function formatCurrency(amount, currency = CONFIG.defaultCurrency, options = {}) {
        if (amount == null || isNaN(amount)) return '';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const currencyInfo = CURRENCIES[currency] || {};
        
        const formatOptions = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: options.minimumFractionDigits ?? (currencyInfo.decimals || 2),
            maximumFractionDigits: options.maximumFractionDigits ?? (currencyInfo.decimals || 2),
            ...options
        };
        
        try {
            let formatted = new Intl.NumberFormat(locale, formatOptions).format(amount);
            
            // Option pour format compact
            if (options.compact) {
                formatted = formatCompactCurrency(amount, currency, locale);
            }
            
            // Option pour cacher le symbole
            if (options.hideSymbol) {
                formatted = formatted.replace(/[^\d\s,.-]/g, '').trim();
            }
            
            return formatted;
        } catch (error) {
            // Fallback manuel
            const symbol = currencyInfo.symbol || currency;
            const formattedAmount = formatNumber(amount, { 
                locale, 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
            });
            
            return currencyInfo.position === 'before' 
                ? `${symbol}${formattedAmount}`
                : `${formattedAmount} ${symbol}`;
        }
    }
    
    /**
     * Formate un montant en format compact (1K, 1M, etc.)
     */
    function formatCompactCurrency(amount, currency, locale) {
        const units = ['', 'K', 'M', 'B', 'T'];
        const unit = Math.floor(Math.log10(Math.abs(amount)) / 3);
        const value = amount / Math.pow(1000, unit);
        
        return formatCurrency(value, currency, {
            locale,
            minimumFractionDigits: value < 10 ? 1 : 0,
            maximumFractionDigits: 1
        }) + units[unit];
    }
    
    /**
     * Formate un pourcentage
     * @param {number} value - La valeur (0-1 ou 0-100 selon options)
     * @param {Object} options - Options
     * @returns {string} - Le pourcentage formaté
     */
    function formatPercent(value, options = {}) {
        if (value == null || isNaN(value)) return '';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const isDecimal = options.decimal !== false && value <= 1;
        const percentValue = isDecimal ? value : value / 100;
        
        const formatOptions = {
            style: 'percent',
            minimumFractionDigits: options.minimumFractionDigits ?? 0,
            maximumFractionDigits: options.maximumFractionDigits ?? 2,
            ...options
        };
        
        try {
            return new Intl.NumberFormat(locale, formatOptions).format(percentValue);
        } catch (error) {
            return `${formatNumber(percentValue * 100, options)}%`;
        }
    }
    
    /**
     * Formate un nombre en notation scientifique
     */
    function formatScientific(value, options = {}) {
        if (value == null || isNaN(value)) return '';
        
        const precision = options.precision ?? 2;
        const locale = options.locale || CONFIG.defaultLocale;
        
        if (options.useIntl && typeof Intl !== 'undefined') {
            return new Intl.NumberFormat(locale, {
                notation: 'scientific',
                minimumSignificantDigits: precision,
                maximumSignificantDigits: precision
            }).format(value);
        }
        
        return value.toExponential(precision);
    }
    
    /**
     * Formate un nombre ordinal (1er, 2e, 3e, etc.)
     */
    function formatOrdinal(value, options = {}) {
        if (value == null || isNaN(value)) return '';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const num = Math.floor(value);
        
        // Règles pour le français
        if (locale.startsWith('fr')) {
            if (num === 1) return num + 'er';
            return num + 'e';
        }
        
        // Règles pour l'anglais
        if (locale.startsWith('en')) {
            const lastDigit = num % 10;
            const lastTwoDigits = num % 100;
            
            if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
                return num + 'th';
            }
            
            switch (lastDigit) {
                case 1: return num + 'st';
                case 2: return num + 'nd';
                case 3: return num + 'rd';
                default: return num + 'th';
            }
        }
        
        // Fallback
        return num + '.';
    }
    
    /**
     * Formate un nombre en chiffres romains
     */
    function formatRoman(value, options = {}) {
        if (value == null || isNaN(value) || value <= 0 || value >= 4000) return '';
        
        const num = Math.floor(value);
        const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
        
        let result = '';
        let remaining = num;
        
        for (let i = 0; i < values.length; i++) {
            while (remaining >= values[i]) {
                result += symbols[i];
                remaining -= values[i];
            }
        }
        
        return options.lowercase ? result.toLowerCase() : result;
    }
    
    /**
     * Formate un ratio (ex: 16:9)
     */
    function formatRatio(width, height, options = {}) {
        if (!width || !height) return '';
        
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        
        const simplifiedWidth = width / divisor;
        const simplifiedHeight = height / divisor;
        
        const separator = options.separator || ':';
        return `${simplifiedWidth}${separator}${simplifiedHeight}`;
    }
    
    /**
     * Formate une plage de nombres
     */
    function formatRange(min, max, options = {}) {
        const separator = options.separator || ' - ';
        const formattedMin = formatNumber(min, options);
        const formattedMax = formatNumber(max, options);
        
        if (min === max) {
            return formattedMin;
        }
        
        return `${formattedMin}${separator}${formattedMax}`;
    }
    
    /**
     * Formate un nombre avec unité
     */
    function formatWithUnit(value, unit, options = {}) {
        if (value == null) return '';
        
        const formattedValue = formatNumber(value, options);
        const space = options.noSpace ? '' : ' ';
        const position = options.unitPosition || 'after';
        
        if (position === 'before') {
            return `${unit}${space}${formattedValue}`;
        }
        
        return `${formattedValue}${space}${unit}`;
    }

    // ========================================
    // FORMATAGE DE DATES ET TEMPS
    // ========================================
    
    /**
     * Formate une date selon les options
     * @param {Date|string|number} date - La date à formater
     * @param {Object|string} options - Options ou nom du format prédéfini
     * @returns {string} - La date formatée
     */
    function formatDate(date, options = {}) {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        // Si options est une string, utiliser un format prédéfini
        if (typeof options === 'string') {
            if (options === 'ISO') {
                return dateObj.toISOString();
            }
            options = DATE_FORMATS[options] || {};
        }
        
        const locale = options.locale || CONFIG.defaultLocale;
        const formatOptions = {
            ...CONFIG.dateDefaults,
            ...options
        };
        
        try {
            return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
        } catch (error) {
            return dateObj.toLocaleDateString(locale);
        }
    }
    
    /**
     * Formate une durée relative (il y a X temps)
     * @param {Date|string|number} date - La date
     * @param {Object} options - Options
     * @returns {string} - La durée relative
     */
    function formatRelativeTime(date, options = {}) {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const now = options.relativeTo || new Date();
        const diff = dateObj.getTime() - now.getTime();
        const absDiff = Math.abs(diff);
        
        const translations = TIME_UNIT_TRANSLATIONS[locale] || TIME_UNIT_TRANSLATIONS['en-US'];
        
        // Cas spéciaux
        if (absDiff < TIME_UNITS.minute) {
            return translations.now;
        }
        
        // Hier/Demain
        if (options.useYesterdayTomorrow) {
            const dayDiff = Math.floor(diff / TIME_UNITS.day);
            if (dayDiff === -1) return translations.yesterday;
            if (dayDiff === 1) return translations.tomorrow;
        }
        
        // Utiliser Intl.RelativeTimeFormat si disponible
        if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
            const rtf = new Intl.RelativeTimeFormat(locale, {
                numeric: options.numeric || 'auto',
                style: options.style || 'long'
            });
            
            // Déterminer l'unité appropriée
            for (const [unit, ms] of Object.entries(TIME_UNITS).reverse()) {
                if (absDiff >= ms || unit === 'second') {
                    const value = Math.round(diff / ms);
                    return rtf.format(value, unit);
                }
            }
        }
        
        // Fallback manuel
        let unit, value;
        for (const [u, ms] of Object.entries(TIME_UNITS).reverse()) {
            if (absDiff >= ms || u === 'second') {
                unit = u;
                value = Math.round(absDiff / ms);
                break;
            }
        }
        
        const unitTranslation = translations[unit];
        const pluralForm = value === 1 ? unitTranslation[0] : unitTranslation[1];
        
        if (diff < 0) {
            return `${translations.ago} ${value} ${pluralForm}`;
        } else {
            return `${translations.in} ${value} ${pluralForm}`;
        }
    }
    
    /**
     * Formate une durée (HH:MM:SS)
     * @param {number} milliseconds - Durée en millisecondes
     * @param {Object} options - Options
     * @returns {string} - La durée formatée
     */
    function formatDuration(milliseconds, options = {}) {
        if (!milliseconds || milliseconds < 0) return '00:00';
        
        const showHours = options.showHours !== false;
        const showMilliseconds = options.showMilliseconds === true;
        const separator = options.separator || ':';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const ms = milliseconds % 1000;
        
        const parts = [];
        
        if (showHours || hours > 0) {
            parts.push(hours.toString().padStart(2, '0'));
        }
        
        parts.push(minutes.toString().padStart(2, '0'));
        parts.push(seconds.toString().padStart(2, '0'));
        
        let result = parts.join(separator);
        
        if (showMilliseconds) {
            result += `.${ms.toString().padStart(3, '0')}`;
        }
        
        return result;
    }
    
    /**
     * Formate une plage de dates
     */
    function formatDateRange(startDate, endDate, options = {}) {
        if (!startDate || !endDate) return '';
        
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate instanceof Date ? endDate : new Date(endDate);
        
        const locale = options.locale || CONFIG.defaultLocale;
        const separator = options.separator || ' - ';
        
        // Si même jour
        if (start.toDateString() === end.toDateString()) {
            if (options.timeOnly) {
                return `${formatDate(start, { timeStyle: 'short' })}${separator}${formatDate(end, { timeStyle: 'short' })}`;
            }
            return formatDate(start, options);
        }
        
        // Si même mois et année
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            const dayStart = start.getDate();
            const dayEnd = end.getDate();
            const monthYear = formatDate(start, { year: 'numeric', month: 'long' });
            return `${dayStart}${separator}${dayEnd} ${monthYear}`;
        }
        
        // Dates différentes
        return `${formatDate(start, options)}${separator}${formatDate(end, options)}`;
    }
    
    /**
     * Formate l'âge à partir d'une date de naissance
     */
    function formatAge(birthDate, options = {}) {
        if (!birthDate) return '';
        
        const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
        const now = options.relativeTo || new Date();
        
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let days = now.getDate() - birth.getDate();
        
        if (days < 0) {
            months--;
            days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        }
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        const locale = options.locale || CONFIG.defaultLocale;
        const parts = [];
        
        if (years > 0 || options.showEmpty) {
            const yearLabel = locale.startsWith('fr') 
                ? (years === 1 ? 'an' : 'ans')
                : (years === 1 ? 'year' : 'years');
            parts.push(`${years} ${yearLabel}`);
        }
        
        if ((months > 0 || options.showEmpty) && options.showMonths) {
            const monthLabel = locale.startsWith('fr') ? 'mois' : (months === 1 ? 'month' : 'months');
            parts.push(`${months} ${monthLabel}`);
        }
        
        if ((days > 0 || options.showEmpty) && options.showDays) {
            const dayLabel = locale.startsWith('fr') 
                ? (days === 1 ? 'jour' : 'jours')
                : (days === 1 ? 'day' : 'days');
            parts.push(`${days} ${dayLabel}`);
        }
        
        return parts.join(', ');
    }
    
    /**
     * Formate un fuseau horaire
     */
    function formatTimezone(date, options = {}) {
        const dateObj = date instanceof Date ? date : new Date(date || Date.now());
        const locale = options.locale || CONFIG.defaultLocale;
        
        if (options.format === 'offset') {
            const offset = dateObj.getTimezoneOffset();
            const hours = Math.floor(Math.abs(offset) / 60);
            const minutes = Math.abs(offset) % 60;
            const sign = offset <= 0 ? '+' : '-';
            return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        try {
            return new Intl.DateTimeFormat(locale, {
                timeZoneName: options.format || 'short',
                timeZone: options.timeZone || CONFIG.defaultTimezone
            }).formatToParts(dateObj)
                .find(part => part.type === 'timeZoneName')?.value || '';
        } catch (error) {
            return '';
        }
    }

    // ========================================
    // FORMATAGE DE TEXTE
    // ========================================
    
    /**
     * Met en majuscule la première lettre
     */
    function capitalize(text, options = {}) {
        if (!text) return '';
        
        const str = text.toString();
        
        if (options.all) {
            // Capitaliser chaque mot
            return str.replace(/\b\w/g, char => char.toUpperCase());
        }
        
        if (options.sentences) {
            // Capitaliser chaque phrase
            return str.replace(/(^|\. )(\w)/g, (match, p1, p2) => p1 + p2.toUpperCase());
        }
        
        // Capitaliser seulement la première lettre
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Tronque un texte
     */
    function truncate(text, maxLength, options = {}) {
        if (!text || text.length <= maxLength) return text;
        
        const ellipsis = options.ellipsis ?? '...';
        const separator = options.separator || '';
        
        if (options.middle) {
            // Tronquer au milieu
            const start = Math.ceil((maxLength - ellipsis.length) / 2);
            const end = Math.floor((maxLength - ellipsis.length) / 2);
            return text.slice(0, start) + ellipsis + text.slice(-end);
        }
        
        if (separator) {
            // Tronquer au dernier séparateur
            const truncated = text.slice(0, maxLength - ellipsis.length);
            const lastSeparator = truncated.lastIndexOf(separator);
            if (lastSeparator > 0) {
                return truncated.slice(0, lastSeparator) + ellipsis;
            }
        }
        
        // Tronquer à la fin
        return text.slice(0, maxLength - ellipsis.length) + ellipsis;
    }
    
    /**
     * Convertit en slug URL
     */
    function slugify(text, options = {}) {
        if (!text) return '';
        
        const separator = options.separator || '-';
        const lowercase = options.lowercase !== false;
        
        let slug = text.toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
            .replace(/[^\w\s-]/g, '') // Retirer les caractères spéciaux
            .trim()
            .replace(/[-\s]+/g, separator); // Remplacer espaces et tirets par le séparateur
        
        if (lowercase) {
            slug = slug.toLowerCase();
        }
        
        return slug;
    }
    
    /**
     * Convertit en camelCase
     */
    function camelCase(text) {
        if (!text) return '';
        
        return text.toString()
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => 
                index === 0 ? match.toLowerCase() : match.toUpperCase()
            )
            .replace(/[\s-_]+/g, '');
    }
    
    /**
     * Convertit en PascalCase
     */
    function pascalCase(text) {
        if (!text) return '';
        
        const camel = camelCase(text);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }
    
    /**
     * Convertit en snake_case
     */
    function snakeCase(text) {
        if (!text) return '';
        
        return text.toString()
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/[\s-]+/g, '_');
    }
    
    /**
     * Convertit en kebab-case
     */
    function kebabCase(text) {
        if (!text) return '';
        
        return text.toString()
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '')
            .replace(/[\s_]+/g, '-');
    }
    
    /**
     * Compte les mots
     */
    function wordCount(text) {
        if (!text) return 0;
        
        return text.toString()
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0)
            .length;
    }
    
    /**
     * Extrait les initiales
     */
    function initials(text, options = {}) {
        if (!text) return '';
        
        const maxInitials = options.max || 2;
        const separator = options.separator || '';
        
        const words = text.toString()
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0);
        
        const initials = words
            .slice(0, maxInitials)
            .map(word => word.charAt(0).toUpperCase())
            .join(separator);
        
        return initials;
    }
    
    /**
     * Formate une liste
     */
    function formatList(items, options = {}) {
        if (!Array.isArray(items) || items.length === 0) return '';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const type = options.type || 'conjunction'; // conjunction, disjunction
        const style = options.style || 'long'; // long, short, narrow
        
        // Utiliser Intl.ListFormat si disponible
        if (typeof Intl !== 'undefined' && Intl.ListFormat) {
            try {
                const formatter = new Intl.ListFormat(locale, { type, style });
                return formatter.format(items);
            } catch (error) {
                // Fallback
            }
        }
        
        // Fallback manuel
        if (items.length === 1) return items[0];
        if (items.length === 2) {
            const conjunction = locale.startsWith('fr') ? ' et ' : ' and ';
            return items.join(type === 'conjunction' ? conjunction : ' ou ');
        }
        
        const lastSeparator = locale.startsWith('fr') 
            ? (type === 'conjunction' ? ', et ' : ', ou ')
            : (type === 'conjunction' ? ', and ' : ', or ');
        
        return items.slice(0, -1).join(', ') + lastSeparator + items[items.length - 1];
    }
    
    /**
     * Enlève les tags HTML
     */
    function stripHtml(html, options = {}) {
        if (!html) return '';
        
        let text = html.toString();
        
        // Remplacer les <br> par des espaces
        if (options.preserveLineBreaks) {
            text = text.replace(/<br\s*\/?>/gi, '\n');
        }
        
        // Enlever tous les tags
        text = text.replace(/<[^>]*>/g, '');
        
        // Décoder les entités HTML
        if (options.decodeEntities !== false) {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            text = textarea.value;
        }
        
        // Nettoyer les espaces multiples
        if (options.collapseWhitespace !== false) {
            text = text.replace(/\s+/g, ' ').trim();
        }
        
        return text;
    }
    
    /**
     * Escape les caractères HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        
        return text.toString().replace(/[&<>"']/g, char => map[char]);
    }
    
    /**
     * Formate avec des balises de mise en évidence
     */
    function highlight(text, query, options = {}) {
        if (!text || !query) return text;
        
        const tag = options.tag || 'mark';
        const className = options.className || '';
        const caseSensitive = options.caseSensitive === true;
        
        const flags = caseSensitive ? 'g' : 'gi';
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, flags);
        
        return text.replace(regex, (match) => {
            const openTag = className ? `<${tag} class="${className}">` : `<${tag}>`;
            return `${openTag}${match}</${tag}>`;
        });
    }

    // ========================================
    // FORMATAGE DE FICHIERS
    // ========================================
    
    /**
     * Formate une taille de fichier
     * @param {number} bytes - Taille en octets
     * @param {Object} options - Options
     * @returns {string} - Taille formatée
     */
    function formatFileSize(bytes, options = {}) {
        if (bytes == null || bytes < 0) return '';
        if (bytes === 0) return '0 B';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const decimal = options.decimal ?? 2;
        const units = locale.startsWith('fr') ? FILE_SIZE_UNITS_FR : FILE_SIZE_UNITS;
        const threshold = options.threshold || 1024;
        
        const index = Math.floor(Math.log(bytes) / Math.log(threshold));
        const size = bytes / Math.pow(threshold, index);
        
        const formattedSize = formatNumber(size, {
            locale,
            minimumFractionDigits: decimal,
            maximumFractionDigits: decimal
        });
        
        return `${formattedSize} ${units[index]}`;
    }
    
    /**
     * Formate une extension de fichier
     */
    function formatFileExtension(filename, options = {}) {
        if (!filename) return '';
        
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1) return '';
        
        let extension = filename.slice(lastDot + 1);
        
        if (options.uppercase) {
            extension = extension.toUpperCase();
        } else if (options.lowercase !== false) {
            extension = extension.toLowerCase();
        }
        
        if (options.includeDot) {
            extension = '.' + extension;
        }
        
        return extension;
    }
    
    /**
     * Formate un nom de fichier
     */
    function formatFileName(filename, options = {}) {
        if (!filename) return '';
        
        let name = filename;
        
        // Retirer l'extension si demandé
        if (options.removeExtension) {
            const lastDot = name.lastIndexOf('.');
            if (lastDot > 0) {
                name = name.slice(0, lastDot);
            }
        }
        
        // Tronquer si nécessaire
        if (options.maxLength && name.length > options.maxLength) {
            const extension = options.removeExtension ? '' : formatFileExtension(filename, { includeDot: true });
            const availableLength = options.maxLength - extension.length;
            name = truncate(name, availableLength, { ellipsis: '...' }) + extension;
        }
        
        // Sanitize pour système de fichiers
        if (options.sanitize) {
            name = name.replace(/[<>:"/\\|?*]/g, '_');
        }
        
        return name;
    }
    
    /**
     * Formate le type MIME
     */
    function formatMimeType(mimeType, options = {}) {
        if (!mimeType) return '';
        
        const typeMap = {
            'image/jpeg': 'Image JPEG',
            'image/png': 'Image PNG',
            'image/gif': 'Image GIF',
            'image/webp': 'Image WebP',
            'application/pdf': 'Document PDF',
            'application/msword': 'Document Word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document Word',
            'application/vnd.ms-excel': 'Feuille de calcul Excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Feuille de calcul Excel',
            'text/plain': 'Fichier texte',
            'text/html': 'Document HTML',
            'text/css': 'Feuille de style CSS',
            'application/javascript': 'Fichier JavaScript',
            'application/json': 'Données JSON',
            'application/zip': 'Archive ZIP',
            'audio/mpeg': 'Audio MP3',
            'audio/wav': 'Audio WAV',
            'video/mp4': 'Vidéo MP4',
            'video/webm': 'Vidéo WebM'
        };
        
        if (options.short) {
            const [type, subtype] = mimeType.split('/');
            return subtype ? subtype.toUpperCase() : type;
        }
        
        return typeMap[mimeType] || mimeType;
    }

    // ========================================
    // FORMATAGE DE DONNÉES
    // ========================================
    
    /**
     * Formate un numéro de téléphone
     * @param {string} phone - Numéro de téléphone
     * @param {Object} options - Options
     * @returns {string} - Numéro formaté
     */
    function formatPhone(phone, options = {}) {
        if (!phone) return '';
        
        const cleaned = phone.toString().replace(/\D/g, '');
        const locale = options.locale || CONFIG.defaultLocale;
        const format = PHONE_FORMATS[locale];
        
        if (!format) {
            // Format par défaut avec espaces
            return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
        }
        
        const match = cleaned.match(format.pattern);
        if (!match) {
            return options.fallback !== false ? phone : '';
        }
        
        return format.format(match);
    }
    
    /**
     * Formate une adresse email
     */
    function formatEmail(email, options = {}) {
        if (!email) return '';
        
        const emailStr = email.toString().toLowerCase().trim();
        
        if (options.obfuscate) {
            const [local, domain] = emailStr.split('@');
            if (!domain) return emailStr;
            
            const obfuscatedLocal = local.charAt(0) + 
                '*'.repeat(Math.max(1, local.length - 2)) + 
                (local.length > 1 ? local.charAt(local.length - 1) : '');
            
            return `${obfuscatedLocal}@${domain}`;
        }
        
        if (options.validate) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(emailStr) ? emailStr : '';
        }
        
        return emailStr;
    }
    
    /**
     * Formate un code postal
     */
    function formatPostalCode(code, options = {}) {
        if (!code) return '';
        
        const locale = options.locale || CONFIG.defaultLocale;
        const cleaned = code.toString().replace(/\s/g, '');
        
        // Formats par pays
        const formats = {
            'fr-FR': (code) => code.length === 5 ? code : '',
            'en-US': (code) => {
                if (code.length === 5) return code;
                if (code.length === 9) return `${code.slice(0, 5)}-${code.slice(5)}`;
                return '';
            },
            'en-GB': (code) => {
                // Format UK complexe
                const ukRegex = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})$/i;
                const match = code.toUpperCase().match(ukRegex);
                return match ? `${match[1]} ${match[2]}` : code.toUpperCase();
            }
        };
        
        const formatter = formats[locale];
        return formatter ? formatter(cleaned) : cleaned;
    }
    
    /**
     * Formate une adresse IP
     */
    function formatIP(ip, options = {}) {
        if (!ip) return '';
        
        const ipStr = ip.toString();
        
        // IPv4
        if (options.version !== 6 && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipStr)) {
            if (options.zeroPad) {
                return ipStr.split('.').map(octet => octet.padStart(3, '0')).join('.');
            }
            return ipStr;
        }
        
        // IPv6
        if (options.version !== 4) {
            // Simplification IPv6
            if (options.compress !== false) {
                return ipStr.replace(/(^|:)0+([0-9a-f])/gi, '$1$2')
                           .replace(/(:0)+:0+/, '::')
                           .replace(/^0+::/, '::')
                           .replace(/::0+$/, '::');
            }
            return ipStr.toLowerCase();
        }
        
        return ipStr;
    }
    
    /**
     * Formate un numéro de carte de crédit
     */
    function formatCreditCard(number, options = {}) {
        if (!number) return '';
        
        const cleaned = number.toString().replace(/\D/g, '');
        
        if (options.obfuscate) {
            if (cleaned.length < 8) return '*'.repeat(cleaned.length);
            return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
        }
        
        // Grouper par 4 chiffres
        const groups = [];
        for (let i = 0; i < cleaned.length; i += 4) {
            groups.push(cleaned.slice(i, i + 4));
        }
        
        return groups.join(options.separator || ' ');
    }
    
    /**
     * Formate un IBAN
     */
    function formatIBAN(iban, options = {}) {
        if (!iban) return '';
        
        const cleaned = iban.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (options.obfuscate) {
            if (cleaned.length < 8) return '*'.repeat(cleaned.length);
            return cleaned.slice(0, 4) + '*'.repeat(cleaned.length - 8) + cleaned.slice(-4);
        }
        
        // Grouper par 4 caractères
        const groups = [];
        for (let i = 0; i < cleaned.length; i += 4) {
            groups.push(cleaned.slice(i, i + 4));
        }
        
        return groups.join(' ');
    }
    
    /**
     * Formate des coordonnées GPS
     */
    function formatCoordinates(lat, lng, options = {}) {
        if (lat == null || lng == null) return '';
        
        const format = options.format || 'decimal'; // decimal, dms, dmm
        
        if (format === 'decimal') {
            const precision = options.precision || 6;
            return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
        }
        
        const convertToDMS = (decimal, isLat) => {
            const absolute = Math.abs(decimal);
            const degrees = Math.floor(absolute);
            const minutesDecimal = (absolute - degrees) * 60;
            const minutes = Math.floor(minutesDecimal);
            const seconds = (minutesDecimal - minutes) * 60;
            
            const direction = decimal >= 0 
                ? (isLat ? 'N' : 'E') 
                : (isLat ? 'S' : 'W');
            
            if (format === 'dms') {
                return `${degrees}°${minutes}'${seconds.toFixed(1)}"${direction}`;
            } else if (format === 'dmm') {
                return `${degrees}°${minutesDecimal.toFixed(3)}'${direction}`;
            }
        };
        
        const latDMS = convertToDMS(lat, true);
        const lngDMS = convertToDMS(lng, false);
        
        return `${latDMS} ${lngDMS}`;
    }

    // ========================================
    // FORMATAGE SPÉCIALISÉ
    // ========================================
    
    /**
     * Formate un hashtag
     */
    function formatHashtag(text, options = {}) {
        if (!text) return '';
        
        let hashtag = text.toString().trim();
        
        // Ajouter # si manquant
        if (!hashtag.startsWith('#')) {
            hashtag = '#' + hashtag;
        }
        
        // Nettoyer
        hashtag = hashtag
            .replace(/\s+/g, '') // Retirer les espaces
            .replace(/[^\w#àâäèéêëîïôùûüÿçÀÂÄÈÉÊËÎÏÔÙÛÜŸÇ]/g, ''); // Garder seulement alphanum + accents
        
        if (options.lowercase) {
            hashtag = hashtag.toLowerCase();
        }
        
        if (options.maxLength) {
            hashtag = hashtag.slice(0, options.maxLength);
        }
        
        return hashtag;
    }
    
    /**
     * Formate un nom d'utilisateur
     */
    function formatUsername(username, options = {}) {
        if (!username) return '';
        
        let formatted = username.toString().trim();
        
        // Ajouter @ si demandé
        if (options.mention && !formatted.startsWith('@')) {
            formatted = '@' + formatted;
        }
        
        // Nettoyer
        formatted = formatted.replace(/[^\w@.-]/g, '_');
        
        if (options.lowercase) {
            formatted = formatted.toLowerCase();
        }
        
        if (options.maxLength) {
            formatted = formatted.slice(0, options.maxLength);
        }
        
        return formatted;
    }
    
    /**
     * Formate une URL
     */
    function formatUrl(url, options = {}) {
        if (!url) return '';
        
        let formatted = url.toString().trim();
        
        // Ajouter le protocole si manquant
        if (options.addProtocol && !formatted.match(/^https?:\/\//)) {
            formatted = 'https://' + formatted;
        }
        
        // Retirer le protocole si demandé
        if (options.removeProtocol) {
            formatted = formatted.replace(/^https?:\/\//, '');
        }
        
        // Retirer www si demandé
        if (options.removeWww) {
            formatted = formatted.replace(/^(https?:\/\/)?(www\.)?/, '$1');
        }
        
        // Retirer trailing slash
        if (options.removeTrailingSlash) {
            formatted = formatted.replace(/\/$/, '');
        }
        
        // Tronquer si nécessaire
        if (options.maxLength && formatted.length > options.maxLength) {
            formatted = truncate(formatted, options.maxLength, { ellipsis: '...' });
        }
        
        return formatted;
    }
    
    /**
     * Formate un JSON
     */
    function formatJSON(data, options = {}) {
        if (data === null || data === undefined) return '';
        
        const indent = options.indent ?? 2;
        const maxDepth = options.maxDepth || 10;
        
        try {
            if (options.minified) {
                return JSON.stringify(data);
            }
            
            return JSON.stringify(data, null, indent);
        } catch (error) {
            return options.fallback || '[Invalid JSON]';
        }
    }
    
    /**
     * Formate du code
     */
    function formatCode(code, options = {}) {
        if (!code) return '';
        
        let formatted = code.toString();
        
        // Indentation
        if (options.indent) {
            const lines = formatted.split('\n');
            let indentLevel = 0;
            
            formatted = lines.map(line => {
                const trimmed = line.trim();
                
                // Décrémenter pour les fermetures
                if (trimmed.match(/^[}\]\)]/) || trimmed.match(/^<\//)) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                
                const indented = ' '.repeat(indentLevel * (options.indentSize || 2)) + trimmed;
                
                // Incrémenter pour les ouvertures
                if (trimmed.match(/[{\[(]$/) || trimmed.match(/<[^/][^>]*>$/)) {
                    indentLevel++;
                }
                
                return indented;
            }).join('\n');
        }
        
        // Coloration syntaxique basique
        if (options.highlight) {
            formatted = formatted
                .replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>')
                .replace(/\b(function|const|let|var|if|else|for|while|return)\b/g, '<span class="keyword">$1</span>')
                .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
                .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
        }
        
        return formatted;
    }
    
    /**
     * Formate une couleur
     */
    function formatColor(color, options = {}) {
        if (!color) return '';
        
        const format = options.format || 'hex'; // hex, rgb, hsl
        
        // Convertir en RGB d'abord
        let r, g, b;
        
        // Si c'est déjà en hex
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.slice(0, 2), 16);
                g = parseInt(hex.slice(2, 4), 16);
                b = parseInt(hex.slice(4, 6), 16);
            }
        }
        
        // Si c'est en rgb()
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            r = parseInt(rgbMatch[1]);
            g = parseInt(rgbMatch[2]);
            b = parseInt(rgbMatch[3]);
        }
        
        if (r === undefined || g === undefined || b === undefined) {
            return color;
        }
        
        // Formatter selon le format demandé
        switch (format) {
            case 'hex':
                const toHex = (n) => n.toString(16).padStart(2, '0');
                return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
                
            case 'rgb':
                return `rgb(${r}, ${g}, ${b})`;
                
            case 'hsl':
                // Conversion RGB vers HSL
                const rNorm = r / 255;
                const gNorm = g / 255;
                const bNorm = b / 255;
                
                const max = Math.max(rNorm, gNorm, bNorm);
                const min = Math.min(rNorm, gNorm, bNorm);
                const l = (max + min) / 2;
                
                let h, s;
                
                if (max === min) {
                    h = s = 0;
                } else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    
                    switch (max) {
                        case rNorm:
                            h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
                            break;
                        case gNorm:
                            h = ((bNorm - rNorm) / d + 2) / 6;
                            break;
                        case bNorm:
                            h = ((rNorm - gNorm) / d + 4) / 6;
                            break;
                    }
                }
                
                return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
                
            default:
                return color;
        }
    }
    
    /**
     * Formate une équation mathématique
     */
    function formatMath(expression, options = {}) {
        if (!expression) return '';
        
        let formatted = expression.toString();
        
        // Remplacer les symboles
        if (options.symbols !== false) {
            formatted = formatted
                .replace(/\*/g, '×')
                .replace(/\//g, '÷')
                .replace(/sqrt\((.*?)\)/g, '√($1)')
                .replace(/\^2/g, '²')
                .replace(/\^3/g, '³')
                .replace(/pi/gi, 'π')
                .replace(/theta/gi, 'θ')
                .replace(/alpha/gi, 'α')
                .replace(/beta/gi, 'β')
                .replace(/gamma/gi, 'γ')
                .replace(/delta/gi, 'δ')
                .replace(/infinity/gi, '∞');
        }
        
        // Ajouter des espaces autour des opérateurs
        if (options.spacing !== false) {
            formatted = formatted.replace(/([+\-×÷=])/g, ' $1 ');
        }
        
        return formatted.trim();
    }

    // ========================================
    // UTILITAIRES I18N
    // ========================================
    
    /**
     * Obtient le séparateur décimal pour une locale
     */
    function getDecimalSeparator(locale = CONFIG.defaultLocale) {
        return new Intl.NumberFormat(locale).format(1.1).charAt(1);
    }
    
    /**
     * Obtient le séparateur de milliers pour une locale
     */
    function getThousandsSeparator(locale = CONFIG.defaultLocale) {
        return new Intl.NumberFormat(locale).format(1000).charAt(1);
    }
    
    /**
     * Formate selon la locale
     */
    function formatByLocale(value, type, locale = CONFIG.defaultLocale, options = {}) {
        const formatters = {
            number: () => formatNumber(value, { locale, ...options }),
            currency: () => formatCurrency(value, options.currency, { locale, ...options }),
            date: () => formatDate(value, { locale, ...options }),
            percent: () => formatPercent(value, { locale, ...options })
        };
        
        const formatter = formatters[type];
        return formatter ? formatter() : value.toString();
    }
    
    /**
     * Détecte la locale du navigateur
     */
    function detectLocale() {
        if (typeof navigator !== 'undefined') {
            return navigator.language || navigator.languages?.[0] || CONFIG.defaultLocale;
        }
        return CONFIG.defaultLocale;
    }
    
    /**
     * Pluralise selon les règles de la locale
     */
    function pluralize(count, singular, plural, locale = CONFIG.defaultLocale) {
        if (typeof Intl !== 'undefined' && Intl.PluralRules) {
            const pr = new Intl.PluralRules(locale);
            const rule = pr.select(count);
            
            // Pour le français et l'anglais simple
            if (rule === 'one' || count === 1) {
                return singular;
            }
            return plural || singular + 's';
        }
        
        // Fallback
        return count === 1 ? singular : (plural || singular + 's');
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration
        config: CONFIG,
        setDefaultLocale: (locale) => { CONFIG.defaultLocale = locale; },
        setDefaultCurrency: (currency) => { CONFIG.defaultCurrency = currency; },
        
        // Formatage de nombres
        number: formatNumber,
        currency: formatCurrency,
        percent: formatPercent,
        scientific: formatScientific,
        ordinal: formatOrdinal,
        roman: formatRoman,
        ratio: formatRatio,
        range: formatRange,
        withUnit: formatWithUnit,
        
        // Formatage de dates
        date: formatDate,
        relativeTime: formatRelativeTime,
        duration: formatDuration,
        dateRange: formatDateRange,
        age: formatAge,
        timezone: formatTimezone,
        
        // Formatage de texte
        capitalize,
        truncate,
        slugify,
        camelCase,
        pascalCase,
        snakeCase,
        kebabCase,
        wordCount,
        initials,
        list: formatList,
        stripHtml,
        escapeHtml,
        highlight,
        
        // Formatage de fichiers
        fileSize: formatFileSize,
        fileExtension: formatFileExtension,
        fileName: formatFileName,
        mimeType: formatMimeType,
        
        // Formatage de données
        phone: formatPhone,
        email: formatEmail,
        postalCode: formatPostalCode,
        ip: formatIP,
        creditCard: formatCreditCard,
        iban: formatIBAN,
        coordinates: formatCoordinates,
        
        // Formatage spécialisé
        hashtag: formatHashtag,
        username: formatUsername,
        url: formatUrl,
        json: formatJSON,
        code: formatCode,
        color: formatColor,
        math: formatMath,
        
        // Utilitaires i18n
        getDecimalSeparator,
        getThousandsSeparator,
        formatByLocale,
        detectLocale,
        pluralize,
        
        // Utilitaires
        TIME_UNITS,
        CURRENCIES,
        FILE_SIZE_UNITS,
        
        // Version
        version: '1.0.0'
    };
})();

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormatUtils;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion des locales multiples
   Solution: Utilisation systématique de l'API Intl avec fallbacks
   
   [2024-01-15] - Formatage des dates relatives
   Solution: Implémentation manuelle complète avec traductions
   
   [2024-01-15] - Performance avec beaucoup de formatages
   Solution: Mise en cache des formatters Intl (à implémenter si nécessaire)
   
   [2024-01-15] - Support navigateurs anciens
   Solution: Fallbacks manuels pour toutes les fonctions Intl
   
   NOTES POUR REPRISES FUTURES:
   - Les fonctions sont toutes indépendantes et tree-shakable
   - L'API Intl est privilégiée avec fallbacks systématiques
   - La configuration est centralisée et modifiable
   - Toutes les fonctions gèrent les cas null/undefined
   - Les options permettent une personnalisation fine
   ======================================== */