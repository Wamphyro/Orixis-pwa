/* ========================================
   FORMATTERS.UTILS.JS - Utilitaires de formatage centralisés
   Chemin: src/utils/core/formatters.utils.js
   
   DESCRIPTION:
   Service centralisé pour tous les formatages de l'application.
   Remplace les fonctions dupliquées dans orchestrator.js, grid.widget.js
   et autres composants. Gère montants, NSS, dates, tailles fichiers, etc.
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. FORMATAGE MONÉTAIRE
   3. FORMATAGE NUMÉROS ET CODES
   4. FORMATAGE TEXTES
   5. FORMATAGE FICHIERS
   6. FORMATAGE NOMBRES ET STATISTIQUES
   7. FORMATAGE BUSINESS SPÉCIFIQUE
   8. HELPERS PRIVÉS
   9. EXPORT
   
   UTILISATION:
   import { formaterMontant, formaterNSS } from '/src/utils/core/formatters.utils.js';
   const montant = formaterMontant(150.50); // "150,50 €"
   const nss = formaterNSS('1850578006048'); // "1 85 05 78 006 048"
   
   API PUBLIQUE:
   - formaterMontant(montant, options) - Formate un montant en euros
   - formaterNSS(nss) - Formate un numéro de sécurité sociale
   - formaterTailleFichier(bytes) - Formate une taille en B/KB/MB/GB
   - formaterCodeMagasin(code) - Formate un code magasin
   - formaterNomComplet(prenom, nom) - Formate un nom complet
   - formaterPourcentage(valeur, decimales) - Formate un pourcentage
   - formaterStatut(statut, withBadge) - Formate un statut avec badge HTML
   - tronquerTexte(texte, max, suffix) - Tronque un texte avec ellipses
   
   DÉPENDANCES:
   - Intl.NumberFormat pour les nombres et devises
   - Pas de dépendances externes
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale, centralisation depuis orchestrator
   
   AUTEUR: Assistant Claude (basé sur code existant)
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. IMPORTS ET CONFIGURATION
// ========================================

/**
 * Configuration des formatages
 * @private
 */
const CONFIG = {
    LOCALE: 'fr-FR',
    CURRENCY: 'EUR',
    NSS_SEPARATOR: ' ',
    FILE_SIZES: ['B', 'KB', 'MB', 'GB', 'TB'],
    ELLIPSIS: '...'
};

/**
 * Mapping des statuts pour affichage
 * @private
 */
const STATUTS_DISPLAY = {
    'nouveau': { label: 'Nouveau', class: 'badge-secondary', icon: '📋' },
    'traitement_ia': { label: 'IA', class: 'badge-info', icon: '🤖' },
    'traitement_effectue': { label: 'Traité', class: 'badge-success', icon: '✅' },
    'traitement_manuel': { label: 'Manuel', class: 'badge-warning', icon: '✏️' },
    'rapprochement_bancaire': { label: 'Rapproché', class: 'badge-primary', icon: '🔗' },
    'supprime': { label: 'Supprimé', class: 'badge-danger', icon: '🗑️' }
};

// ========================================
// 2. FORMATAGE MONÉTAIRE
// ========================================

/**
 * Formater un montant en euros
 * Centralise la logique dupliquée dans orchestrator et grid
 * 
 * @param {number|string|null} montant - Montant à formater
 * @param {Object} [options] - Options de formatage
 * @param {boolean} [options.showSign=false] - Afficher le signe + pour positifs
 * @param {number} [options.decimals=2] - Nombre de décimales
 * @param {boolean} [options.hideZero=false] - Retourner vide si zéro
 * @param {string} [options.currency='EUR'] - Devise
 * @returns {string} Montant formaté
 * 
 * @example
 * formaterMontant(150.50)           // "150,50 €"
 * formaterMontant(-50)              // "-50,00 €"
 * formaterMontant(1000.5, {showSign: true}) // "+1 000,50 €"
 * formaterMontant(0, {hideZero: true})      // ""
 */
export function formaterMontant(montant, options = {}) {
    // Gestion des valeurs nulles/undefined
    if (montant === null || montant === undefined) {
        return options.hideZero ? '' : '0,00 €';
    }
    
    // Conversion en nombre
    const valeur = typeof montant === 'string' ? parseFloat(montant) : montant;
    
    // Vérification NaN
    if (isNaN(valeur)) {
        return options.hideZero ? '' : '0,00 €';
    }
    
    // Gestion du zéro
    if (valeur === 0 && options.hideZero) {
        return '';
    }
    
    try {
        // Formatage avec Intl
        const formatted = new Intl.NumberFormat(CONFIG.LOCALE, {
            style: 'currency',
            currency: options.currency || CONFIG.CURRENCY,
            minimumFractionDigits: options.decimals ?? 2,
            maximumFractionDigits: options.decimals ?? 2
        }).format(Math.abs(valeur));
        
        // Ajout du signe si demandé
        if (options.showSign && valeur > 0) {
            return `+${formatted}`;
        }
        
        // Signe négatif
        if (valeur < 0) {
            return `-${formatted}`;
        }
        
        return formatted;
        
    } catch (error) {
        console.error('❌ Erreur formaterMontant:', error);
        return `${valeur} €`;
    }
}

/**
 * Formater un montant pour export (sans symbole)
 * 
 * @param {number} montant - Montant à formater
 * @returns {string} Montant sans symbole euro
 * 
 * @example
 * formaterMontantExport(1234.56) // "1234.56"
 */
export function formaterMontantExport(montant) {
    if (montant === null || montant === undefined) return '0';
    const valeur = typeof montant === 'string' ? parseFloat(montant) : montant;
    return isNaN(valeur) ? '0' : valeur.toFixed(2);
}

// ========================================
// 3. FORMATAGE NUMÉROS ET CODES
// ========================================

/**
 * Formater un numéro de sécurité sociale
 * Format : 1 85 05 78 006 048 [22]
 * 
 * @param {string|number|null} nss - NSS à formater
 * @param {boolean} [maskPartial=false] - Masquer partiellement pour confidentialité
 * @returns {string} NSS formaté ou '-'
 * 
 * @example
 * formaterNSS('1850578006048')     // "1 85 05 78 006 048"
 * formaterNSS('185057800604822')   // "1 85 05 78 006 048 22"
 * formaterNSS('1850578006048', true) // "1 85 05 ** *** ***"
 */
export function formaterNSS(nss, maskPartial = false) {
    if (!nss) return '-';
    
    // Nettoyer : retirer tous les caractères non numériques
    const nssClean = String(nss).replace(/\D/g, '');
    
    // Vérifier la longueur (13 ou 15 chiffres)
    if (nssClean.length !== 13 && nssClean.length !== 15) {
        return nss; // Retourner tel quel si format incorrect
    }
    
    // Si masquage partiel demandé
    if (maskPartial) {
        return formatNSSMasked(nssClean);
    }
    
    // Format 13 chiffres : 1 85 05 78 006 048
    if (nssClean.length === 13) {
        return [
            nssClean.substring(0, 1),   // Sexe
            nssClean.substring(1, 3),   // Année
            nssClean.substring(3, 5),   // Mois
            nssClean.substring(5, 7),   // Département
            nssClean.substring(7, 10),  // Commune
            nssClean.substring(10, 13)  // Ordre
        ].join(CONFIG.NSS_SEPARATOR);
    }
    
    // Format 15 chiffres : 1 85 05 78 006 048 22
    return [
        nssClean.substring(0, 1),   // Sexe
        nssClean.substring(1, 3),   // Année
        nssClean.substring(3, 5),   // Mois
        nssClean.substring(5, 7),   // Département
        nssClean.substring(7, 10),  // Commune
        nssClean.substring(10, 13), // Ordre
        nssClean.substring(13, 15)  // Clé
    ].join(CONFIG.NSS_SEPARATOR);
}

/**
 * Formater un code magasin
 * Met en majuscules et vérifie le format
 * 
 * @param {string|null} code - Code magasin
 * @param {boolean} [withPrefix=false] - Ajouter un préfixe descriptif
 * @returns {string} Code formaté
 * 
 * @example
 * formaterCodeMagasin('9par')           // "9PAR"
 * formaterCodeMagasin('9PAR', true)     // "BA-9PAR"
 */
export function formaterCodeMagasin(code, withPrefix = false) {
    if (!code) return '-';
    
    const codeUpper = String(code).toUpperCase().trim();
    
    if (withPrefix) {
        const prefix = codeUpper.charAt(0);
        const societePrefix = {
            '9': 'BA',
            '8': 'ORIXIS',
            '7': 'AUTRE'
        };
        
        if (societePrefix[prefix]) {
            return `${societePrefix[prefix]}-${codeUpper}`;
        }
    }
    
    return codeUpper;
}

/**
 * Formater un numéro de décompte
 * 
 * @param {string} numero - Numéro format DEC-YYYYMMDD-XXXX
 * @param {boolean} [short=false] - Version courte
 * @returns {string} Numéro formaté
 * 
 * @example
 * formaterNumeroDecompte('DEC-20250208-0001')       // "DEC-20250208-0001"
 * formaterNumeroDecompte('DEC-20250208-0001', true) // "DEC-0001"
 */
export function formaterNumeroDecompte(numero, short = false) {
    if (!numero) return '-';
    
    if (short && numero.includes('-')) {
        const parts = numero.split('-');
        return `${parts[0]}-${parts[parts.length - 1]}`;
    }
    
    return numero;
}

// ========================================
// 4. FORMATAGE TEXTES
// ========================================

/**
 * Formater un nom complet
 * 
 * @param {string|null} prenom - Prénom
 * @param {string|null} nom - Nom
 * @param {Object} [options] - Options
 * @param {boolean} [options.uppercase=true] - Nom en majuscules
 * @param {boolean} [options.firstnameFirst=true] - Prénom en premier
 * @returns {string} Nom complet formaté
 * 
 * @example
 * formaterNomComplet('Jean', 'Dupont')                        // "Jean DUPONT"
 * formaterNomComplet('Jean', 'Dupont', {uppercase: false})    // "Jean Dupont"
 * formaterNomComplet('Jean', 'Dupont', {firstnameFirst: false}) // "DUPONT Jean"
 */
export function formaterNomComplet(prenom, nom, options = {}) {
    const prenomClean = (prenom || '').trim();
    const nomClean = (nom || '').trim();
    
    if (!prenomClean && !nomClean) return '-';
    
    const nomFinal = options.uppercase !== false ? nomClean.toUpperCase() : nomClean;
    
    if (!prenomClean) return nomFinal;
    if (!nomClean) return prenomClean;
    
    if (options.firstnameFirst === false) {
        return `${nomFinal} ${prenomClean}`;
    }
    
    return `${prenomClean} ${nomFinal}`;
}

/**
 * Obtenir les initiales
 * 
 * @param {string} prenom - Prénom
 * @param {string} nom - Nom
 * @returns {string} Initiales
 * 
 * @example
 * formaterInitiales('Jean', 'Dupont') // "JD"
 * formaterInitiales('Jean-Pierre', 'Dupont') // "JPD"
 */
export function formaterInitiales(prenom, nom) {
    const initiales = [];
    
    if (prenom) {
        // Gérer les prénoms composés
        prenom.split(/[\s-]/).forEach(p => {
            if (p) initiales.push(p.charAt(0).toUpperCase());
        });
    }
    
    if (nom) {
        initiales.push(nom.charAt(0).toUpperCase());
    }
    
    return initiales.join('') || '-';
}

/**
 * Tronquer un texte avec ellipses
 * 
 * @param {string} texte - Texte à tronquer
 * @param {number} [maxLength=50] - Longueur maximale
 * @param {string} [suffix='...'] - Suffixe à ajouter
 * @returns {string} Texte tronqué
 * 
 * @example
 * tronquerTexte('Texte très long qui dépasse', 15) // "Texte très long..."
 * tronquerTexte('Court', 10) // "Court"
 */
export function tronquerTexte(texte, maxLength = 50, suffix = CONFIG.ELLIPSIS) {
    if (!texte) return '';
    
    const texteClean = String(texte).trim();
    
    if (texteClean.length <= maxLength) {
        return texteClean;
    }
    
    // Couper au dernier espace avant la limite
    const truncated = texteClean.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
        return truncated.substring(0, lastSpace) + suffix;
    }
    
    return truncated + suffix;
}

// ========================================
// 5. FORMATAGE FICHIERS
// ========================================

/**
 * Formater une taille de fichier
 * Convertit les bytes en format lisible
 * 
 * @param {number|null} bytes - Taille en octets
 * @param {number} [decimals=1] - Nombre de décimales
 * @returns {string} Taille formatée
 * 
 * @example
 * formaterTailleFichier(1024)       // "1.0 KB"
 * formaterTailleFichier(1536, 2)    // "1.50 KB"
 * formaterTailleFichier(10485760)   // "10.0 MB"
 */
export function formaterTailleFichier(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = CONFIG.FILE_SIZES;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Protection contre les valeurs trop grandes
    const sizeIndex = Math.min(i, sizes.length - 1);
    
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(decimals)) + ' ' + sizes[sizeIndex];
}

/**
 * Formater un nom de fichier
 * Nettoie et tronque si nécessaire
 * 
 * @param {string} filename - Nom du fichier
 * @param {number} [maxLength=30] - Longueur max avant extension
 * @returns {string} Nom formaté
 * 
 * @example
 * formaterNomFichier('document_très_long_nom.pdf', 15) // "document_très_l...pdf"
 */
export function formaterNomFichier(filename, maxLength = 30) {
    if (!filename) return '-';
    
    const lastDot = filename.lastIndexOf('.');
    
    // Pas d'extension
    if (lastDot === -1) {
        return tronquerTexte(filename, maxLength);
    }
    
    const name = filename.substring(0, lastDot);
    const ext = filename.substring(lastDot + 1);
    
    if (name.length <= maxLength) {
        return filename;
    }
    
    return tronquerTexte(name, maxLength, '...') + '.' + ext;
}

// ========================================
// 6. FORMATAGE NOMBRES ET STATISTIQUES
// ========================================

/**
 * Formater un pourcentage
 * 
 * @param {number} valeur - Valeur à formater (0-100 ou 0-1)
 * @param {Object} [options] - Options
 * @param {number} [options.decimals=1] - Nombre de décimales
 * @param {boolean} [options.isRatio=false] - Si true, valeur est entre 0 et 1
 * @param {boolean} [options.showSign=false] - Afficher le signe +
 * @returns {string} Pourcentage formaté
 * 
 * @example
 * formaterPourcentage(85.5)                    // "85,5%"
 * formaterPourcentage(0.855, {isRatio: true})  // "85,5%"
 * formaterPourcentage(10, {showSign: true})    // "+10%"
 */
export function formaterPourcentage(valeur, options = {}) {
    if (valeur === null || valeur === undefined) return '0%';
    
    let percentage = parseFloat(valeur);
    if (isNaN(percentage)) return '0%';
    
    // Convertir si c'est un ratio
    if (options.isRatio) {
        percentage = percentage * 100;
    }
    
    // Formatage
    const formatted = percentage.toFixed(options.decimals ?? 1).replace('.', ',');
    
    // Ajout du signe
    if (options.showSign && percentage > 0) {
        return `+${formatted}%`;
    }
    
    return `${formatted}%`;
}

/**
 * Formater une progression
 * 
 * @param {number} current - Valeur actuelle
 * @param {number} total - Valeur totale
 * @param {Object} [options] - Options
 * @param {boolean} [options.showPercent=false] - Afficher aussi le pourcentage
 * @returns {string} Progression formatée
 * 
 * @example
 * formaterProgression(3, 10)                        // "3/10"
 * formaterProgression(3, 10, {showPercent: true})   // "3/10 (30%)"
 */
export function formaterProgression(current, total, options = {}) {
    const currentClean = parseInt(current) || 0;
    const totalClean = parseInt(total) || 0;
    
    let result = `${currentClean}/${totalClean}`;
    
    if (options.showPercent && totalClean > 0) {
        const percent = (currentClean / totalClean * 100).toFixed(0);
        result += ` (${percent}%)`;
    }
    
    return result;
}

/**
 * Formater un nombre avec séparateurs
 * 
 * @param {number} nombre - Nombre à formater
 * @param {number} [decimals=0] - Nombre de décimales
 * @returns {string} Nombre formaté
 * 
 * @example
 * formaterNombre(1234567)      // "1 234 567"
 * formaterNombre(1234.567, 2)  // "1 234,57"
 */
export function formaterNombre(nombre, decimals = 0) {
    if (nombre === null || nombre === undefined) return '0';
    
    const valeur = parseFloat(nombre);
    if (isNaN(valeur)) return '0';
    
    return new Intl.NumberFormat(CONFIG.LOCALE, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(valeur);
}

// ========================================
// 7. FORMATAGE BUSINESS SPÉCIFIQUE
// ========================================

/**
 * Formater un statut avec badge HTML optionnel
 * 
 * @param {string} statut - Code du statut
 * @param {boolean} [withBadge=false] - Retourner HTML avec badge
 * @param {boolean} [withIcon=false] - Inclure l'icône
 * @returns {string} Statut formaté ou HTML
 * 
 * @example
 * formaterStatut('nouveau')                    // "Nouveau"
 * formaterStatut('nouveau', true)              // '<span class="badge badge-secondary">Nouveau</span>'
 * formaterStatut('nouveau', true, true)        // '<span class="badge badge-secondary">📋 Nouveau</span>'
 */
export function formaterStatut(statut, withBadge = false, withIcon = false) {
    if (!statut) return '-';
    
    const statutConfig = STATUTS_DISPLAY[statut] || {
        label: statut,
        class: 'badge-secondary',
        icon: ''
    };
    
    // Texte simple
    if (!withBadge) {
        return withIcon && statutConfig.icon 
            ? `${statutConfig.icon} ${statutConfig.label}`
            : statutConfig.label;
    }
    
    // HTML avec badge
    const iconHtml = withIcon && statutConfig.icon ? `${statutConfig.icon} ` : '';
    return `<span class="badge ${statutConfig.class}">${iconHtml}${statutConfig.label}</span>`;
}

/**
 * Formater un type de décompte
 * 
 * @param {string} type - Type de décompte
 * @param {number} [nombreClients] - Nombre de clients pour les groupes
 * @returns {string} Type formaté
 * 
 * @example
 * formaterTypeDecompte('individuel')      // "Individuel"
 * formaterTypeDecompte('groupe', 5)       // "Groupé (5 clients)"
 */
export function formaterTypeDecompte(type, nombreClients) {
    if (!type) return '-';
    
    if (type === 'groupe' && nombreClients) {
        return `Groupé (${nombreClients} client${nombreClients > 1 ? 's' : ''})`;
    }
    
    return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Formater une période (mois/année)
 * 
 * @param {string} periode - Période au format YYYY-MM
 * @returns {string} Période formatée
 * 
 * @example
 * formaterPeriode('2025-02')  // "Février 2025"
 */
export function formaterPeriode(periode) {
    if (!periode || !periode.includes('-')) return periode || '-';
    
    const [annee, mois] = periode.split('-');
    const moisNoms = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const moisIndex = parseInt(mois) - 1;
    if (moisIndex >= 0 && moisIndex < 12) {
        return `${moisNoms[moisIndex]} ${annee}`;
    }
    
    return periode;
}

// ========================================
// 8. HELPERS PRIVÉS
// ========================================

/**
 * Formater un NSS masqué pour confidentialité
 * 
 * @private
 * @param {string} nssClean - NSS nettoyé
 * @returns {string} NSS masqué
 */
function formatNSSMasked(nssClean) {
    if (nssClean.length === 13) {
        return [
            nssClean.substring(0, 1),   // Sexe
            nssClean.substring(1, 3),   // Année
            nssClean.substring(3, 5),   // Mois
            '**',                        // Département masqué
            '***',                       // Commune masquée
            '***'                        // Ordre masqué
        ].join(CONFIG.NSS_SEPARATOR);
    }
    
    return [
        nssClean.substring(0, 1),
        nssClean.substring(1, 3),
        nssClean.substring(3, 5),
        '**',
        '***',
        '***',
        '**'
    ].join(CONFIG.NSS_SEPARATOR);
}

// ========================================
// 9. EXPORT
// ========================================

/**
 * Export par défaut pour import simplifié
 */
export default {
    // Monétaire
    formaterMontant,
    formaterMontantExport,
    
    // Codes et numéros
    formaterNSS,
    formaterCodeMagasin,
    formaterNumeroDecompte,
    
    // Textes
    formaterNomComplet,
    formaterInitiales,
    tronquerTexte,
    
    // Fichiers
    formaterTailleFichier,
    formaterNomFichier,
    
    // Nombres et stats
    formaterPourcentage,
    formaterProgression,
    formaterNombre,
    
    // Business
    formaterStatut,
    formaterTypeDecompte,
    formaterPeriode,
    
    // Config exportée pour tests
    CONFIG
};

/* ========================================
   FIN DU FICHIER
   ======================================== */