/* ========================================
   VALIDATORS.UTILS.JS - Utilitaires de validation centralisés
   Chemin: src/utils/core/validators.utils.js
   
   DESCRIPTION:
   Service centralisé pour toutes les validations de l'application.
   Gère la validation et le nettoyage des NSS, SIRET, emails, téléphones,
   IBAN, codes postaux, etc. Inclut l'extraction d'informations depuis
   les numéros validés (sexe/année pour NSS, banque pour IBAN, etc.).
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. VALIDATION IDENTIFIANTS FRANÇAIS
   3. VALIDATION COORDONNÉES
   4. VALIDATION BANCAIRE ET FINANCIÈRE
   5. VALIDATION FICHIERS ET DOCUMENTS
   6. VALIDATION MÉTIER SPÉCIFIQUE
   7. FONCTIONS DE NETTOYAGE
   8. EXTRACTION D'INFORMATIONS
   9. HELPERS PRIVÉS
   10. EXPORT
   
   UTILISATION:
   import { validerNSS, validerEmail, nettoyerNSS } from '/src/utils/core/validators.utils.js';
   const isValid = validerNSS('1850578006048');  // true
   const cleaned = nettoyerNSS('1 85 05 78 006 048');  // '1850578006048'
   const details = extraireInfosNSS('1850578006048');  // {sexe: 'H', annee: 1985, ...}
   
   API PUBLIQUE:
   - validerNSS(nss) - Valide un numéro de sécurité sociale
   - validerSIRET(siret) - Valide un numéro SIRET avec algorithme de Luhn
   - validerEmail(email) - Valide une adresse email
   - validerTelephone(tel) - Valide un numéro de téléphone français
   - validerIBAN(iban) - Valide un IBAN avec checksum
   - validerCodePostal(cp) - Valide un code postal français
   - validerMontant(montant, options) - Valide un montant avec contraintes
   - nettoyerNSS(nss) - Nettoie et formate un NSS
   - extraireInfosNSS(nss) - Extrait sexe, année, département d'un NSS
   
   DÉPENDANCES:
   - Pas de dépendances externes
   - Utilise les API natives JavaScript
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale, centralisation depuis openai.service
   
   AUTEUR: Assistant Claude (basé sur besoins identifiés)
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. IMPORTS ET CONFIGURATION
// ========================================

/**
 * Expressions régulières pour validations
 * @private
 */
const REGEX = {
    // Identifiants
    NSS: /^[12]\d{12}(\d{2})?$/,
    SIRET: /^\d{14}$/,
    SIREN: /^\d{9}$/,
    
    // Contact
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    EMAIL_STRICT: /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
    TELEPHONE_FR: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    TELEPHONE_MOBILE: /^(?:(?:\+|00)33|0)\s*[67](?:[\s.-]*\d{2}){4}$/,
    
    // Localisation
    CODE_POSTAL_FR: /^\d{5}$/,
    CODE_POSTAL_CORSE: /^20[0-9]{3}$/,
    
    // Bancaire
    IBAN_FR: /^FR\d{2}\s?\d{5}\s?\d{5}\s?\d{11}\s?\d{2}$/,
    BIC: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
    
    // Documents
    NUMERO_DECOMPTE: /^DEC-\d{8}-\d{4}$/,
    VIREMENT_ID: /^VIR-\d{4}-\d{2}-\d{3}$/,
    CODE_MAGASIN: /^[789][A-Z]{3}$/,
    FINESS: /^\d{9}$/,
    
    // Sécurité
    PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    NO_SCRIPT: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    NO_SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi
};

/**
 * Messages d'erreur par défaut
 * @private
 */
const MESSAGES = {
    NSS_INVALID: 'Numéro de sécurité sociale invalide',
    NSS_LENGTH: 'Le NSS doit contenir 13 ou 15 chiffres',
    NSS_KEY: 'Clé de contrôle NSS invalide',
    SIRET_INVALID: 'Numéro SIRET invalide',
    SIRET_LUHN: 'Erreur checksum SIRET (algorithme de Luhn)',
    EMAIL_INVALID: 'Adresse email invalide',
    TEL_INVALID: 'Numéro de téléphone invalide',
    IBAN_INVALID: 'IBAN invalide',
    IBAN_CHECKSUM: 'Checksum IBAN incorrect',
    CP_INVALID: 'Code postal invalide',
    MONTANT_MIN: 'Montant inférieur au minimum autorisé',
    MONTANT_MAX: 'Montant supérieur au maximum autorisé',
    REQUIRED: 'Champ obligatoire',
    FORMAT: 'Format invalide'
};

/**
 * Configuration de validation
 * @private
 */
const CONFIG = {
    NSS_CLE_MODULO: 97,
    SIRET_LENGTH: 14,
    SIREN_LENGTH: 9,
    CP_LENGTH: 5,
    IBAN_MIN_LENGTH: 15,
    IBAN_MAX_LENGTH: 34,
    TEL_MIN_LENGTH: 10,
    EMAIL_MAX_LENGTH: 254
};

// ========================================
// 2. VALIDATION IDENTIFIANTS FRANÇAIS
// ========================================

/**
 * Valider un numéro de sécurité sociale français
 * Vérifie le format, la cohérence et la clé de contrôle
 * 
 * @param {string|number} nss - NSS à valider
 * @param {Object} [options] - Options de validation
 * @param {boolean} [options.allowPartial=false] - Accepter NSS partiel (sans clé)
 * @param {boolean} [options.checkKey=true] - Vérifier la clé de contrôle
 * @returns {boolean} true si valide
 * 
 * @example
 * validerNSS('1850578006048')      // true
 * validerNSS('185057800604822')    // true (avec clé)
 * validerNSS('2850578006048')      // true (femme)
 * validerNSS('3850578006048')      // false (commence par 3)
 */
export function validerNSS(nss, options = {}) {
    if (!nss) return false;
    
    // Nettoyer
    const cleaned = String(nss).replace(/\s/g, '');
    
    // Vérifier format de base
    if (!REGEX.NSS.test(cleaned)) {
        return false;
    }
    
    // Extraire les parties
    const sexe = cleaned.charAt(0);
    const annee = cleaned.substring(1, 3);
    const mois = cleaned.substring(3, 5);
    const dept = cleaned.substring(5, 7);
    
    // Validation du sexe (1 ou 2)
    if (sexe !== '1' && sexe !== '2') {
        return false;
    }
    
    // Validation du mois (01-12 ou 20-30/50-99 pour les personnes nées à l'étranger)
    const moisNum = parseInt(mois);
    if (moisNum < 1 || (moisNum > 12 && moisNum < 20) || (moisNum > 30 && moisNum < 50)) {
        return false;
    }
    
    // Validation du département (01-95, 2A, 2B, 97-99)
    const deptNum = parseInt(dept);
    if (dept === '2A' || dept === '2B') {
        // Corse
    } else if (deptNum < 1 || (deptNum > 95 && deptNum < 97) || deptNum > 99) {
        return false;
    }
    
    // Si clé de contrôle présente et vérification demandée
    if (cleaned.length === 15 && options.checkKey !== false) {
        return validerCleNSS(cleaned);
    }
    
    return true;
}

/**
 * Valider un numéro SIRET (14 chiffres)
 * Utilise l'algorithme de Luhn pour la validation
 * 
 * @param {string|number} siret - SIRET à valider
 * @param {Object} [options] - Options
 * @param {boolean} [options.allowSIREN=false] - Accepter aussi SIREN (9 chiffres)
 * @returns {boolean} true si valide
 * 
 * @example
 * validerSIRET('73282932000074')  // true
 * validerSIRET('73282932000075')  // false (mauvais checksum)
 */
export function validerSIRET(siret, options = {}) {
    if (!siret) return false;
    
    const cleaned = String(siret).replace(/\s/g, '');
    
    // Vérifier SIREN si option
    if (options.allowSIREN && cleaned.length === CONFIG.SIREN_LENGTH) {
        return validerSIREN(cleaned);
    }
    
    // Vérifier format SIRET
    if (!REGEX.SIRET.test(cleaned)) {
        return false;
    }
    
    // Validation par algorithme de Luhn
    return validerLuhn(cleaned);
}

/**
 * Valider un numéro SIREN (9 chiffres)
 * 
 * @param {string|number} siren - SIREN à valider
 * @returns {boolean} true si valide
 */
export function validerSIREN(siren) {
    if (!siren) return false;
    
    const cleaned = String(siren).replace(/\s/g, '');
    
    if (!REGEX.SIREN.test(cleaned)) {
        return false;
    }
    
    // Validation par algorithme de Luhn
    return validerLuhn(cleaned);
}

/**
 * Valider un numéro FINESS
 * 
 * @param {string|number} finess - Numéro FINESS
 * @returns {boolean} true si valide
 * 
 * @example
 * validerFINESS('750000000')  // true
 */
export function validerFINESS(finess) {
    if (!finess) return false;
    
    const cleaned = String(finess).replace(/\s/g, '');
    return REGEX.FINESS.test(cleaned);
}

// ========================================
// 3. VALIDATION COORDONNÉES
// ========================================

/**
 * Valider une adresse email
 * 
 * @param {string} email - Email à valider
 * @param {Object} [options] - Options
 * @param {boolean} [options.strict=false] - Validation stricte RFC 5322
 * @param {string[]} [options.allowedDomains] - Domaines autorisés
 * @param {string[]} [options.blockedDomains] - Domaines bloqués
 * @returns {boolean} true si valide
 * 
 * @example
 * validerEmail('test@example.com')     // true
 * validerEmail('invalid@')             // false
 * validerEmail('test@gmail.com', {
 *     allowedDomains: ['gmail.com', 'company.fr']
 * })  // true
 */
export function validerEmail(email, options = {}) {
    if (!email) return false;
    
    const cleaned = String(email).trim().toLowerCase();
    
    // Vérifier longueur max
    if (cleaned.length > CONFIG.EMAIL_MAX_LENGTH) {
        return false;
    }
    
    // Validation regex
    const regex = options.strict ? REGEX.EMAIL_STRICT : REGEX.EMAIL;
    if (!regex.test(cleaned)) {
        return false;
    }
    
    // Extraire le domaine
    const domain = cleaned.split('@')[1];
    
    // Vérifier domaines autorisés
    if (options.allowedDomains && options.allowedDomains.length > 0) {
        if (!options.allowedDomains.includes(domain)) {
            return false;
        }
    }
    
    // Vérifier domaines bloqués
    if (options.blockedDomains && options.blockedDomains.length > 0) {
        if (options.blockedDomains.includes(domain)) {
            return false;
        }
    }
    
    // Vérifier les emails jetables courants
    if (options.blockDisposable) {
        const disposableDomains = [
            'tempmail.com', 'throwaway.email', '10minutemail.com',
            'guerrillamail.com', 'mailinator.com', 'yopmail.com'
        ];
        if (disposableDomains.includes(domain)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Valider un numéro de téléphone français
 * 
 * @param {string} telephone - Téléphone à valider
 * @param {Object} [options] - Options
 * @param {boolean} [options.mobileOnly=false] - Accepter uniquement les mobiles
 * @param {boolean} [options.allowInternational=true] - Accepter format international
 * @returns {boolean} true si valide
 * 
 * @example
 * validerTelephone('0612345678')           // true
 * validerTelephone('+33 6 12 34 56 78')    // true
 * validerTelephone('06.12.34.56.78')       // true
 * validerTelephone('0112345678', {mobileOnly: true})  // false
 */
export function validerTelephone(telephone, options = {}) {
    if (!telephone) return false;
    
    const cleaned = String(telephone).replace(/[\s.-]/g, '');
    
    // Vérifier longueur minimale
    if (cleaned.replace(/\D/g, '').length < CONFIG.TEL_MIN_LENGTH) {
        return false;
    }
    
    // Mobile uniquement
    if (options.mobileOnly) {
        return REGEX.TELEPHONE_MOBILE.test(telephone);
    }
    
    // Validation standard
    if (!REGEX.TELEPHONE_FR.test(telephone)) {
        // Essayer sans le format international
        if (!options.allowInternational) {
            return false;
        }
        
        // Vérifier si c'est un numéro français sans préfixe
        const withoutPrefix = cleaned.replace(/^(?:\+33|0033)/, '0');
        return REGEX.TELEPHONE_FR.test(withoutPrefix);
    }
    
    return true;
}

/**
 * Valider un code postal français
 * 
 * @param {string|number} codePostal - Code postal
 * @param {Object} [options] - Options
 * @param {boolean} [options.checkDepartment=false] - Vérifier cohérence département
 * @returns {boolean} true si valide
 * 
 * @example
 * validerCodePostal('75001')   // true
 * validerCodePostal('20000')   // true (Corse)
 * validerCodePostal('97400')   // true (DOM)
 * validerCodePostal('00000')   // false
 */
export function validerCodePostal(codePostal, options = {}) {
    if (!codePostal) return false;
    
    const cleaned = String(codePostal).replace(/\s/g, '');
    
    // Vérifier format
    if (!REGEX.CODE_POSTAL_FR.test(cleaned)) {
        return false;
    }
    
    // Vérifier que ce n'est pas 00000
    if (cleaned === '00000') {
        return false;
    }
    
    // Vérifier cohérence département si demandé
    if (options.checkDepartment) {
        const dept = cleaned.substring(0, 2);
        const deptNum = parseInt(dept);
        
        // Départements métropolitains : 01-95
        // Corse : 20 (2A et 2B mais code postal commence par 20)
        // DOM : 97-98
        if (deptNum === 0 || (deptNum > 95 && deptNum < 97) || deptNum > 98) {
            return false;
        }
    }
    
    return true;
}

// ========================================
// 4. VALIDATION BANCAIRE ET FINANCIÈRE
// ========================================

/**
 * Valider un IBAN
 * Vérifie le format et le checksum
 * 
 * @param {string} iban - IBAN à valider
 * @param {Object} [options] - Options
 * @param {string} [options.country] - Limiter à un pays (FR, DE, etc.)
 * @returns {boolean} true si valide
 * 
 * @example
 * validerIBAN('FR76 3000 6000 0112 3456 7890 189')  // true
 * validerIBAN('FR00 1234 5678 9012 3456 7890 123')  // false (checksum)
 */
export function validerIBAN(iban, options = {}) {
    if (!iban) return false;
    
    // Nettoyer : retirer espaces et tirets
    const cleaned = String(iban).replace(/[\s-]/g, '').toUpperCase();
    
    // Vérifier longueur
    if (cleaned.length < CONFIG.IBAN_MIN_LENGTH || cleaned.length > CONFIG.IBAN_MAX_LENGTH) {
        return false;
    }
    
    // Vérifier format pays (2 lettres + 2 chiffres)
    if (!/^[A-Z]{2}\d{2}/.test(cleaned)) {
        return false;
    }
    
    // Si pays spécifique demandé
    if (options.country) {
        const countryCode = options.country.toUpperCase();
        if (!cleaned.startsWith(countryCode)) {
            return false;
        }
        
        // Vérifier format spécifique pour la France
        if (countryCode === 'FR' && !REGEX.IBAN_FR.test(iban)) {
            return false;
        }
    }
    
    // Validation du checksum IBAN
    return validerChecksumIBAN(cleaned);
}

/**
 * Valider un code BIC/SWIFT
 * 
 * @param {string} bic - Code BIC
 * @returns {boolean} true si valide
 * 
 * @example
 * validerBIC('BNPAFRPP')     // true (8 caractères)
 * validerBIC('BNPAFRPPXXX')  // true (11 caractères)
 */
export function validerBIC(bic) {
    if (!bic) return false;
    
    const cleaned = String(bic).replace(/\s/g, '').toUpperCase();
    return REGEX.BIC.test(cleaned);
}

/**
 * Valider un montant
 * 
 * @param {number|string} montant - Montant à valider
 * @param {Object} [options] - Options
 * @param {number} [options.min=0] - Montant minimum
 * @param {number} [options.max] - Montant maximum
 * @param {boolean} [options.allowNegative=false] - Autoriser négatif
 * @param {number} [options.decimals=2] - Nombre max de décimales
 * @returns {boolean} true si valide
 * 
 * @example
 * validerMontant(150.50)                    // true
 * validerMontant(-50, {allowNegative: true}) // true
 * validerMontant(10000, {max: 5000})        // false
 * validerMontant(10.999, {decimals: 2})     // false
 */
export function validerMontant(montant, options = {}) {
    // Conversion en nombre
    const value = typeof montant === 'string' 
        ? parseFloat(montant.replace(',', '.').replace(/\s/g, ''))
        : montant;
    
    // Vérifier que c'est un nombre
    if (isNaN(value) || value === null || value === undefined) {
        return false;
    }
    
    // Vérifier négatif
    if (!options.allowNegative && value < 0) {
        return false;
    }
    
    // Vérifier minimum
    const min = options.min ?? 0;
    if (value < min) {
        return false;
    }
    
    // Vérifier maximum
    if (options.max !== undefined && value > options.max) {
        return false;
    }
    
    // Vérifier décimales
    if (options.decimals !== undefined) {
        const parts = value.toString().split('.');
        if (parts[1] && parts[1].length > options.decimals) {
            return false;
        }
    }
    
    return true;
}

// ========================================
// 5. VALIDATION FICHIERS ET DOCUMENTS
// ========================================

/**
 * Valider un type de fichier
 * 
 * @param {File|string} file - Fichier ou nom de fichier
 * @param {Object} [options] - Options
 * @param {string[]} [options.allowedTypes] - Types MIME autorisés
 * @param {string[]} [options.allowedExtensions] - Extensions autorisées
 * @param {number} [options.maxSize] - Taille max en octets
 * @returns {boolean} true si valide
 * 
 * @example
 * validerFichier(file, {
 *     allowedTypes: ['application/pdf', 'image/jpeg'],
 *     maxSize: 10 * 1024 * 1024  // 10MB
 * })
 */
export function validerFichier(file, options = {}) {
    if (!file) return false;
    
    // Si c'est un objet File
    if (file instanceof File) {
        // Vérifier le type MIME
        if (options.allowedTypes && options.allowedTypes.length > 0) {
            if (!options.allowedTypes.includes(file.type)) {
                return false;
            }
        }
        
        // Vérifier la taille
        if (options.maxSize && file.size > options.maxSize) {
            return false;
        }
        
        // Vérifier l'extension
        if (options.allowedExtensions && options.allowedExtensions.length > 0) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!ext || !options.allowedExtensions.includes(ext)) {
                return false;
            }
        }
    } 
    // Si c'est un nom de fichier
    else if (typeof file === 'string') {
        // Vérifier l'extension seulement
        if (options.allowedExtensions && options.allowedExtensions.length > 0) {
            const ext = file.split('.').pop()?.toLowerCase();
            if (!ext || !options.allowedExtensions.includes(ext)) {
                return false;
            }
        }
    } else {
        return false;
    }
    
    return true;
}

/**
 * Valider un hash SHA-256
 * 
 * @param {string} hash - Hash à valider
 * @returns {boolean} true si format SHA-256 valide
 * 
 * @example
 * validerHashSHA256('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')  // true
 */
export function validerHashSHA256(hash) {
    if (!hash) return false;
    return /^[a-f0-9]{64}$/i.test(hash);
}

// ========================================
// 6. VALIDATION MÉTIER SPÉCIFIQUE
// ========================================

/**
 * Valider un numéro de décompte
 * Format : DEC-YYYYMMDD-XXXX
 * 
 * @param {string} numero - Numéro de décompte
 * @returns {boolean} true si valide
 * 
 * @example
 * validerNumeroDecompte('DEC-20250208-0001')  // true
 */
export function validerNumeroDecompte(numero) {
    if (!numero) return false;
    return REGEX.NUMERO_DECOMPTE.test(numero);
}

/**
 * Valider un ID de virement
 * Format : VIR-YYYY-MM-XXX
 * 
 * @param {string} id - ID virement
 * @returns {boolean} true si valide
 */
export function validerVirementId(id) {
    if (!id) return false;
    return REGEX.VIREMENT_ID.test(id);
}

/**
 * Valider un code magasin
 * Format : [789]XXX (commence par 7, 8 ou 9 + 3 lettres)
 * 
 * @param {string} code - Code magasin
 * @returns {boolean} true si valide
 * 
 * @example
 * validerCodeMagasin('9PAR')  // true
 * validerCodeMagasin('8LYO')  // true
 * validerCodeMagasin('6PAR')  // false
 */
export function validerCodeMagasin(code) {
    if (!code) return false;
    return REGEX.CODE_MAGASIN.test(String(code).toUpperCase());
}

/**
 * Valider un mot de passe fort
 * 
 * @param {string} password - Mot de passe
 * @param {Object} [options] - Options
 * @param {number} [options.minLength=8] - Longueur minimale
 * @param {boolean} [options.requireUppercase=true] - Majuscule obligatoire
 * @param {boolean} [options.requireLowercase=true] - Minuscule obligatoire
 * @param {boolean} [options.requireNumber=true] - Chiffre obligatoire
 * @param {boolean} [options.requireSpecial=true] - Caractère spécial obligatoire
 * @returns {Object} {valid: boolean, errors: string[]}
 * 
 * @example
 * validerMotDePasse('MonPass123!')  
 * // {valid: true, errors: []}
 */
export function validerMotDePasse(password, options = {}) {
    const errors = [];
    
    if (!password) {
        return { valid: false, errors: ['Mot de passe requis'] };
    }
    
    const minLength = options.minLength ?? 8;
    
    if (password.length < minLength) {
        errors.push(`Minimum ${minLength} caractères`);
    }
    
    if (options.requireUppercase !== false && !/[A-Z]/.test(password)) {
        errors.push('Au moins une majuscule requise');
    }
    
    if (options.requireLowercase !== false && !/[a-z]/.test(password)) {
        errors.push('Au moins une minuscule requise');
    }
    
    if (options.requireNumber !== false && !/\d/.test(password)) {
        errors.push('Au moins un chiffre requis');
    }
    
    if (options.requireSpecial !== false && !/[@$!%*?&]/.test(password)) {
        errors.push('Au moins un caractère spécial requis (@$!%*?&)');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ========================================
// 7. FONCTIONS DE NETTOYAGE
// ========================================

/**
 * Nettoyer et formater un NSS
 * Retire tous les caractères non numériques
 * 
 * @param {string} nss - NSS à nettoyer
 * @returns {string|null} NSS nettoyé ou null
 * 
 * @example
 * nettoyerNSS('1 85 05 78 006 048')     // '1850578006048'
 * nettoyerNSS('1-85-05-78-006-048-22')  // '185057800604822'
 */
export function nettoyerNSS(nss) {
    if (!nss) return null;
    
    const cleaned = String(nss).replace(/\D/g, '');
    
    // Vérifier la longueur
    if (cleaned.length !== 13 && cleaned.length !== 15) {
        return nss; // Retourner original si format incorrect
    }
    
    return cleaned;
}

/**
 * Nettoyer un numéro de téléphone
 * 
 * @param {string} telephone - Téléphone à nettoyer
 * @param {Object} [options] - Options
 * @param {boolean} [options.international=false] - Format international
 * @returns {string} Téléphone nettoyé
 * 
 * @example
 * nettoyerTelephone('06.12.34.56.78')           // '0612345678'
 * nettoyerTelephone('+33 6 12 34 56 78', {international: true})  // '+33612345678'
 */
export function nettoyerTelephone(telephone, options = {}) {
    if (!telephone) return '';
    
    let cleaned = String(telephone).replace(/[\s.-]/g, '');
    
    // Gérer le format international
    if (!options.international) {
        // Convertir +33 en 0
        cleaned = cleaned.replace(/^(?:\+33|0033)/, '0');
    } else if (!cleaned.startsWith('+')) {
        // Ajouter +33 si nécessaire
        if (cleaned.startsWith('0')) {
            cleaned = '+33' + cleaned.substring(1);
        }
    }
    
    return cleaned;
}

/**
 * Nettoyer un SIRET
 * 
 * @param {string} siret - SIRET à nettoyer
 * @returns {string} SIRET nettoyé
 * 
 * @example
 * nettoyerSIRET('732 829 320 00074')  // '73282932000074'
 */
export function nettoyerSIRET(siret) {
    if (!siret) return '';
    return String(siret).replace(/\D/g, '');
}

/**
 * Nettoyer un IBAN
 * 
 * @param {string} iban - IBAN à nettoyer
 * @param {boolean} [formatted=false] - Retourner formaté avec espaces
 * @returns {string} IBAN nettoyé
 * 
 * @example
 * nettoyerIBAN('FR76 3000 6000 0112 3456 7890 189')  
 * // 'FR7630006000011234567890189'
 * 
 * nettoyerIBAN('FR7630006000011234567890189', true)  
 * // 'FR76 3000 6000 0112 3456 7890 189'
 */
export function nettoyerIBAN(iban, formatted = false) {
    if (!iban) return '';
    
    const cleaned = String(iban).replace(/[\s-]/g, '').toUpperCase();
    
    if (formatted && cleaned.length > 4) {
        // Formater par groupes de 4
        return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    }
    
    return cleaned;
}

/**
 * Nettoyer une adresse email
 * 
 * @param {string} email - Email à nettoyer
 * @returns {string} Email nettoyé en minuscules
 */
export function nettoyerEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase();
}

/**
 * Nettoyer contre les injections
 * 
 * @param {string} input - Input à nettoyer
 * @param {Object} [options] - Options
 * @param {boolean} [options.sql=true] - Nettoyer SQL
 * @param {boolean} [options.script=true] - Nettoyer scripts
 * @param {boolean} [options.html=true] - Échapper HTML
 * @returns {string} Input nettoyé
 */
export function nettoyerInjection(input, options = {}) {
    if (!input) return '';
    
    let cleaned = String(input);
    
    // Nettoyer SQL injection
    if (options.sql !== false) {
        cleaned = cleaned.replace(REGEX.NO_SQL_INJECTION, '');
    }
    
    // Nettoyer scripts
    if (options.script !== false) {
        cleaned = cleaned.replace(REGEX.NO_SCRIPT, '');
    }
    
    // Échapper HTML
    if (options.html !== false) {
        cleaned = cleaned
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    return cleaned;
}

// ========================================
// 8. EXTRACTION D'INFORMATIONS
// ========================================

/**
 * Extraire les informations d'un NSS
 * 
 * @param {string} nss - NSS valide
 * @returns {Object|null} Informations extraites
 * 
 * @example
 * extraireInfosNSS('1850578006048')
 * // {
 * //   sexe: 'H',
 * //   anneeNaissance: 1985,
 * //   moisNaissance: 5,
 * //   departement: '78',
 * //   commune: '006',
 * //   ordre: '048',
 * //   age: 39
 * // }
 */
export function extraireInfosNSS(nss) {
    if (!nss || !validerNSS(nss)) return null;
    
    const cleaned = nettoyerNSS(nss);
    if (!cleaned) return null;
    
    const currentYear = new Date().getFullYear();
    const annee = parseInt(cleaned.substring(1, 3));
    
    // Déterminer le siècle
    let anneeComplete;
    if (annee <= currentYear % 100) {
        anneeComplete = 2000 + annee;
    } else {
        anneeComplete = 1900 + annee;
    }
    
    // Ajuster si la personne n'est pas encore née
    if (anneeComplete > currentYear) {
        anneeComplete -= 100;
    }
    
    return {
        sexe: cleaned.charAt(0) === '1' ? 'H' : 'F',
        anneeNaissance: anneeComplete,
        moisNaissance: parseInt(cleaned.substring(3, 5)),
        departement: cleaned.substring(5, 7),
        commune: cleaned.substring(7, 10),
        ordre: cleaned.substring(10, 13),
        cle: cleaned.length === 15 ? cleaned.substring(13, 15) : null,
        age: currentYear - anneeComplete
    };
}

/**
 * Extraire les informations d'un IBAN
 * 
 * @param {string} iban - IBAN valide
 * @returns {Object|null} Informations extraites
 * 
 * @example
 * extraireInfosIBAN('FR7630006000011234567890189')
 * // {
 * //   pays: 'FR',
 * //   checkDigits: '76',
 * //   banque: '30006',
 * //   guichet: '00001',
 * //   compte: '1234567890',
 * //   cle: '189'
 * // }
 */
export function extraireInfosIBAN(iban) {
    if (!iban || !validerIBAN(iban)) return null;
    
    const cleaned = nettoyerIBAN(iban);
    
    // Format français
    if (cleaned.startsWith('FR')) {
        return {
            pays: 'FR',
            checkDigits: cleaned.substring(2, 4),
            banque: cleaned.substring(4, 9),
            guichet: cleaned.substring(9, 14),
            compte: cleaned.substring(14, 25),
            cle: cleaned.substring(25, 27),
            formatted: nettoyerIBAN(iban, true)
        };
    }
    
    // Format générique
    return {
        pays: cleaned.substring(0, 2),
        checkDigits: cleaned.substring(2, 4),
        bban: cleaned.substring(4),
        formatted: nettoyerIBAN(iban, true)
    };
}

/**
 * Extraire le domaine d'un email
 * 
 * @param {string} email - Email
 * @returns {string|null} Domaine
 * 
 * @example
 * extraireDomaineEmail('user@example.com')  // 'example.com'
 */
export function extraireDomaineEmail(email) {
    if (!email || !validerEmail(email)) return null;
    return email.split('@')[1];
}

// ========================================
// 9. HELPERS PRIVÉS
// ========================================

/**
 * Valider la clé de contrôle NSS
 * 
 * @private
 * @param {string} nss - NSS avec clé (15 chiffres)
 * @returns {boolean} true si clé valide
 */
function validerCleNSS(nss) {
    const nssBase = nss.substring(0, 13);
    const cle = parseInt(nss.substring(13, 15));
    
    // Cas spécial Corse
    let nssForCalcul = nssBase;
    const dept = nssBase.substring(5, 7);
    
    if (dept === '2A') {
        nssForCalcul = nssBase.substring(0, 5) + '19' + nssBase.substring(7);
    } else if (dept === '2B') {
        nssForCalcul = nssBase.substring(0, 5) + '18' + nssBase.substring(7);
    }
    
    const nssNumber = parseInt(nssForCalcul);
    const calculatedKey = CONFIG.NSS_CLE_MODULO - (nssNumber % CONFIG.NSS_CLE_MODULO);
    
    return calculatedKey === cle;
}

/**
 * Algorithme de Luhn pour validation SIRET/SIREN
 * 
 * @private
 * @param {string} number - Nombre à valider
 * @returns {boolean} true si valide selon Luhn
 */
function validerLuhn(number) {
    let sum = 0;
    let isEven = false;
    
    // Parcourir de droite à gauche
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

/**
 * Valider le checksum d'un IBAN
 * 
 * @private
 * @param {string} iban - IBAN nettoyé
 * @returns {boolean} true si checksum valide
 */
function validerChecksumIBAN(iban) {
    // Déplacer les 4 premiers caractères à la fin
    const rearranged = iban.substring(4) + iban.substring(0, 4);
    
    // Convertir les lettres en nombres (A=10, B=11, ..., Z=35)
    let numericIBAN = '';
    for (let i = 0; i < rearranged.length; i++) {
        const char = rearranged.charAt(i);
        if (/[A-Z]/.test(char)) {
            numericIBAN += (char.charCodeAt(0) - 55).toString();
        } else {
            numericIBAN += char;
        }
    }
    
    // Calculer mod 97 (utiliser BigInt pour les grands nombres)
    const remainder = BigInt(numericIBAN) % 97n;
    
    return remainder === 1n;
}

// ========================================
// 10. EXPORT
// ========================================

/**
 * Export par défaut pour import simplifié
 */
export default {
    // Validations identifiants
    validerNSS,
    validerSIRET,
    validerSIREN,
    validerFINESS,
    
    // Validations coordonnées
    validerEmail,
    validerTelephone,
    validerCodePostal,
    
    // Validations bancaires
    validerIBAN,
    validerBIC,
    validerMontant,
    
    // Validations fichiers
    validerFichier,
    validerHashSHA256,
    
    // Validations métier
    validerNumeroDecompte,
    validerVirementId,
    validerCodeMagasin,
    validerMotDePasse,
    
    // Nettoyage
    nettoyerNSS,
    nettoyerTelephone,
    nettoyerSIRET,
    nettoyerIBAN,
    nettoyerEmail,
    nettoyerInjection,
    
    // Extraction
    extraireInfosNSS,
    extraireInfosIBAN,
    extraireDomaineEmail,
    
    // Export des regex pour usage direct si besoin
    REGEX,
    MESSAGES,
    CONFIG
};

/* ========================================
   FIN DU FICHIER
   ======================================== */