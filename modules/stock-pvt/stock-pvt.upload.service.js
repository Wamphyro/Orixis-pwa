// ========================================
// STOCK-PVT.UPLOAD.SERVICE.JS - 📁 SERVICE UPLOAD/IMPORT
// Chemin: modules/stock-pvt/stock-pvt.upload.service.js
//
// DESCRIPTION:
// Service d'import et analyse des fichiers CSV stock PVT
// Détection automatique des colonnes peu importe l'ordre
// Support multi-formats et encodages
//
// VERSION: 1.0.0
// DATE: 03/02/2025
// ========================================

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    allowedExtensions: ['.csv', '.txt', '.tsv'],
    
    // Mapping des colonnes possibles
    COLUMN_MAPPINGS: {
        reference: ['reference', 'ref', 'code', 'sku', 'code_article', 'article', 'produit'],
        designation: ['designation', 'libelle', 'nom', 'description', 'article', 'produit', 'name'],
        codeBarres: ['ean', 'code_barre', 'codebarre', 'barcode', 'gtin', 'upc', 'cb'],
        quantite: ['quantite', 'qte', 'stock', 'quantity', 'qty', 'nombre', 'nb'],
        quantiteMin: ['stock_min', 'qte_min', 'minimum', 'seuil', 'alerte'],
        quantiteMax: ['stock_max', 'qte_max', 'maximum', 'max'],
        prixAchat: ['prix_achat', 'pa', 'cout', 'cost', 'price_buy', 'achat', 'prixachat'],
        prixVente: ['prix_vente', 'pv', 'prix', 'tarif', 'price', 'vente', 'prixvente'],
        fournisseur: ['fournisseur', 'supplier', 'fourn', 'vendeur', 'vendor'],
        categorie: ['categorie', 'category', 'cat', 'famille', 'rayon', 'type'],
        marque: ['marque', 'brand', 'fabricant', 'manufacturer'],
        emplacement: ['emplacement', 'location', 'rayon', 'etagere', 'lieu', 'place'],
        dateEntree: ['date', 'date_entree', 'entree', 'date_in', 'created'],
        datePeremption: ['dlc', 'dluo', 'peremption', 'expiration', 'date_limite']
    }
};

// ========================================
// SERVICE UPLOAD
// ========================================

class StockPVTUploadService {
    
    /**
     * Analyser un fichier CSV
     */
    async analyserCSV(file) {
        try {
            console.log('📊 Analyse du fichier:', file.name);
            
            // Valider le fichier
            this.validateFile(file);
            
            // Lire le contenu avec détection d'encoding
            const content = await this.readFileWithEncoding(file);
            
            // Détecter le séparateur
            const separator = this.detectSeparator(content);
            console.log('📌 Séparateur détecté:', separator === '\t' ? 'TAB' : `"${separator}"`);
            
            // Parser les lignes
            const lines = content.split(/\r?\n/).filter(line => line.trim());
            if (lines.length === 0) {
                throw new Error('Fichier vide');
            }
            
            // Détecter le mapping des colonnes depuis l'en-tête
            const headerLine = lines[0];
            const columnMapping = this.detectColumns(headerLine, separator);
            console.log('🗺️ Mapping colonnes:', columnMapping);
            
            // Vérifier qu'on a au moins les colonnes essentielles
            if (!columnMapping.hasEssentialColumns) {
                throw new Error('Colonnes essentielles manquantes (référence ou désignation)');
            }
            
            // Parser chaque ligne d'article
            const articles = [];
            const errors = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;
                
                try {
                    const article = this.parseArticle(line, separator, columnMapping.mapping);
                    if (article) {
                        articles.push(article);
                    }
                } catch (error) {
                    errors.push({
                        ligne: i + 1,
                        erreur: error.message,
                        contenu: line.substring(0, 100)
                    });
                    console.warn(`⚠️ Ligne ${i + 1} ignorée:`, error.message);
                }
            }
            
            // Calculer les statistiques
            const stats = this.calculateStats(articles);
            
            // Extraire le numéro ACM du nom de fichier
            const numeroACM = this.extractNumeroACM(file.name);
            
            return {
                articles,
                stats,
                errors,
                mapping: columnMapping,
                separator,
                numeroACM
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse CSV:', error);
            throw new Error(`Erreur analyse CSV: ${error.message}`);
        }
    }
    
    /**
     * Valider un fichier
     */
    validateFile(file) {
        // Vérifier la taille
        if (file.size > CONFIG.maxFileSize) {
            const sizeMB = (CONFIG.maxFileSize / 1024 / 1024).toFixed(0);
            throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
        }
        
        // Vérifier le type
        const extension = '.' + this.getFileExtension(file.name);
        const typeValide = CONFIG.allowedTypes.includes(file.type) || 
                          CONFIG.allowedExtensions.includes(extension.toLowerCase());
        
        if (!typeValide) {
            throw new Error(`Type de fichier non autorisé. Formats acceptés: CSV, TXT`);
        }
    }
    
    /**
     * Obtenir l'extension d'un fichier
     */
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'csv';
    }
    
    /**
     * Détecter le séparateur
     */
    detectSeparator(content) {
        const firstLines = content.split(/\r?\n/).slice(0, 5).join('\n');
        const separators = [';', ',', '\t', '|'];
        let maxCount = 0;
        let bestSeparator = ';';
        let maxConsistency = 0;
        
        for (const sep of separators) {
            const regex = sep === '\t' ? /\t/g : new RegExp('\\' + sep, 'g');
            const lines = firstLines.split(/\r?\n/);
            const counts = [];
            
            // Compter le séparateur dans chaque ligne
            for (const line of lines) {
                if (line.trim()) {
                    const matches = line.match(regex);
                    counts.push(matches ? matches.length : 0);
                }
            }
            
            // Vérifier la cohérence (toutes les lignes ont le même nombre de séparateurs)
            if (counts.length > 0) {
                const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
                const consistency = counts.every(c => c === counts[0]) ? 1 : 0;
                
                // Préférer le séparateur avec le plus de colonnes ET la meilleure cohérence
                if (avgCount > maxCount || (avgCount === maxCount && consistency > maxConsistency)) {
                    maxCount = avgCount;
                    maxConsistency = consistency;
                    bestSeparator = sep;
                }
            }
        }
        
        console.log(`📌 Séparateur détecté: "${bestSeparator}" avec ${maxCount} colonnes`);
        return bestSeparator;
    }
    
    /**
     * Détecter le mapping des colonnes
     */
    detectColumns(headerLine, separator) {
        const headers = headerLine.split(separator).map(h => 
            h.trim()
            .toLowerCase()
            .replace(/^["']|["']$/g, '') // Enlever les quotes
            .replace(/^\uFEFF/, '')       // ⚠️ IMPORTANT: Enlever le BOM UTF-8
            .replace(/\s+/g, '_')         // Remplacer espaces par _
            .replace(/[éèêë]/g, 'e')       // Normaliser les accents
            .replace(/[àâä]/g, 'a')
            .replace(/[ùûü]/g, 'u')
            .replace(/[îï]/g, 'i')
            .replace(/[ôö]/g, 'o')
            .replace(/[ç]/g, 'c')
        );
        
        console.log('📋 Headers détectés:', headers); // LOG POUR DEBUG
        
        const mapping = {};
        const foundColumns = [];
        
        // Pour chaque colonne du CSV
        headers.forEach((header, index) => {
            // Nettoyer encore plus le header
            const cleanHeader = header
                .replace(/[^a-z0-9_]/g, '') // Garder que lettres, chiffres et _
                .replace(/__+/g, '_');       // Remplacer multiple _ par un seul
            
            console.log(`  Colonne ${index}: "${header}" -> "${cleanHeader}"`); // LOG POUR DEBUG
            
            // Chercher dans notre mapping
            for (const [field, synonyms] of Object.entries(CONFIG.COLUMN_MAPPINGS)) {
                for (const synonym of synonyms) {
                    // Comparaison plus flexible
                    if (cleanHeader === synonym || 
                        cleanHeader.includes(synonym) || 
                        synonym.includes(cleanHeader) ||
                        header === synonym ||
                        header.includes(synonym)) {
                        
                        console.log(`    ✅ Mappé vers: ${field}`); // LOG POUR DEBUG
                        mapping[index] = field;
                        foundColumns.push(field);
                        break;
                    }
                }
                if (mapping[index]) break;
            }
            
            // Si pas trouvé, essayer une détection par mots-clés
            if (!mapping[index]) {
                // Détection de la référence
                if (header.match(/ref|code|sku|article|prod/i)) {
                    mapping[index] = 'reference';
                    foundColumns.push('reference');
                    console.log(`    ✅ Détection forcée: reference`);
                }
                // Détection de la désignation
                else if (header.match(/des|lib|nom|name|titre|intitule/i)) {
                    mapping[index] = 'designation';
                    foundColumns.push('designation');
                    console.log(`    ✅ Détection forcée: designation`);
                }
                // Détection de la quantité
                else if (header.match(/qt|stock|nb|nombre|quantity/i)) {
                    mapping[index] = 'quantite';
                    foundColumns.push('quantite');
                    console.log(`    ✅ Détection forcée: quantite`);
                }
                // Détection des prix
                else if (header.match(/prix.*achat|pa|cout|cost/i)) {
                    mapping[index] = 'prixAchat';
                    foundColumns.push('prixAchat');
                    console.log(`    ✅ Détection forcée: prixAchat`);
                }
                else if (header.match(/prix.*vente|pv|tarif|price/i)) {
                    mapping[index] = 'prixVente';
                    foundColumns.push('prixVente');
                    console.log(`    ✅ Détection forcée: prixVente`);
                }
            }
        });
        
        // Vérifier les colonnes essentielles
        const hasReference = foundColumns.includes('reference');
        const hasDesignation = foundColumns.includes('designation');
        const hasQuantite = foundColumns.includes('quantite');
        
        console.log('📊 Résumé du mapping:');
        console.log('  - Colonnes trouvées:', foundColumns);
        console.log('  - Référence trouvée:', hasReference);
        console.log('  - Désignation trouvée:', hasDesignation);
        console.log('  - Quantité trouvée:', hasQuantite);
        
        // Si aucune colonne essentielle, essayer de mapper la première colonne
        if (!hasReference && !hasDesignation && headers.length > 0) {
            console.log('⚠️ Aucune colonne essentielle détectée, mapping forcé de la première colonne');
            // Supposer que la première colonne est la référence ou la désignation
            if (!mapping[0]) {
                // Regarder le contenu pour deviner
                if (headers[0].match(/\d/)) {
                    mapping[0] = 'reference';
                    foundColumns.push('reference');
                } else {
                    mapping[0] = 'designation';
                    foundColumns.push('designation');
                }
                console.log(`  Première colonne mappée vers: ${mapping[0]}`);
            }
        }
        
        return {
            mapping,
            headers,
            foundColumns,
            hasEssentialColumns: foundColumns.includes('reference') || foundColumns.includes('designation'),
            isComplete: hasReference && hasDesignation && hasQuantite
        };
    }
    
    /**
     * Parser un article depuis une ligne CSV
     */
    parseArticle(line, separator, columnMapping) {
        const values = this.parseCSVLine(line, separator);
        
        const article = {};
        let hasData = false;
        
        // Mapper chaque valeur selon le mapping détecté
        for (const [index, field] of Object.entries(columnMapping)) {
            const value = values[parseInt(index)];
            if (value && value.trim()) {
                hasData = true;
                
                // Parser selon le type de champ
                switch (field) {
                    case 'quantite':
                    case 'quantiteMin':
                    case 'quantiteMax':
                        article[field] = this.parseNumber(value, true); // Entier
                        break;
                        
                    case 'prixAchat':
                    case 'prixVente':
                        article[field] = this.parseMontant(value);
                        break;
                        
                    case 'dateEntree':
                    case 'datePeremption':
                        article[field] = this.parseDate(value);
                        break;
                        
                    default:
                        article[field] = this.cleanString(value);
                }
            }
        }
        
        // Vérifier qu'on a au minimum une référence ou désignation
        if (!hasData || (!article.reference && !article.designation)) {
            return null;
        }
        
        // Générer une référence si manquante
        if (!article.reference && article.designation) {
            article.reference = this.genererReferenceDepuisDesignation(article.designation);
        }
        
        // Valeurs par défaut
        article.quantite = article.quantite || 0;
        article.prixAchat = article.prixAchat || 0;
        article.prixVente = article.prixVente || 0;
        
        return article;
    }
    
    /**
     * Parser une ligne CSV en gérant les quotes
     */
    parseCSVLine(line, separator) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === separator && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current); // Dernière valeur
        
        return result.map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    
    /**
     * Parser un nombre
     */
    parseNumber(value, isInteger = false) {
        if (!value || value === '') return 0;
        
        // Nettoyer la valeur
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .trim();
        
        // Gérer les nombres négatifs entre parenthèses
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            cleaned = '-' + cleaned.slice(1, -1);
        }
        
        // Format français (virgule comme décimale)
        if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed)) return 0;
        
        return isInteger ? Math.round(parsed) : parsed;
    }
    
    /**
     * Parser un montant
     */
    parseMontant(value) {
        if (!value || value === '') return 0;
        
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .replace(/[€$£]/g, '')
            .replace(/EUR|USD|GBP/gi, '')
            .trim();
        
        if (!cleaned) return 0;
        
        // Format français
        if (cleaned.includes(',')) {
            const commaCount = (cleaned.match(/,/g) || []).length;
            const dotCount = (cleaned.match(/\./g) || []).length;
            
            if (commaCount === 1 && dotCount === 0) {
                // 123,45 -> 123.45
                cleaned = cleaned.replace(',', '.');
            } else if (dotCount > 0) {
                // 1.234,56 -> 1234.56
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            }
        }
        
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.abs(parsed);
    }
    
    /**
     * Parser une date
     */
    parseDate(value) {
        if (!value || value === '') return null;
        
        const cleaned = value.trim();
        
        // Format DD/MM/YYYY ou DD-MM-YYYY
        const match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (match) {
            let [, day, month, year] = match;
            
            if (year.length === 2) {
                year = (parseInt(year) > 50 ? '19' : '20') + year;
            }
            
            const date = new Date(year, month - 1, day);
            if (date.getDate() == day && date.getMonth() == month - 1) {
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        
        // Format YYYY-MM-DD
        const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            return cleaned;
        }
        
        return null;
    }
    
    /**
     * Nettoyer une chaîne
     */
    cleanString(value) {
        if (!value) return '';
        
        return value
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^["']|["']$/g, '');
    }
    
    /**
     * Générer une référence depuis la désignation
     */
    genererReferenceDepuisDesignation(designation) {
        const cleaned = designation
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 10);
        
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `AUTO-${cleaned}-${random}`;
    }
    
    /**
     * Extraire le numéro ACM du nom de fichier
     */
    extractNumeroACM(filename) {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // Si le nom est entièrement numérique
        if (/^\d+$/.test(nameWithoutExt)) {
            return nameWithoutExt;
        }
        
        // Chercher un pattern numérique long
        const match = filename.match(/(\d{8,})/);
        if (match) {
            return match[1];
        }
        
        console.warn('⚠️ Impossible d\'extraire le numéro ACM du fichier:', filename);
        return null;
    }
    
    /**
     * Lire un fichier avec détection d'encoding
     */
    async readFileWithEncoding(file) {
        const encodings = ['utf-8', 'windows-1252', 'iso-8859-1'];
        
        for (const encoding of encodings) {
            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file, encoding);
                });
                
                // Vérifier si le texte contient des caractères de remplacement
                if (!text.includes('�') && !text.includes('ï¿½')) {
                    console.log(`✅ Encoding détecté: ${encoding}`);
                    return text;
                }
            } catch (error) {
                continue;
            }
        }
        
        // Par défaut, utiliser UTF-8
        return await file.text();
    }
    
    /**
     * Calculer les statistiques
     */
    calculateStats(articles) {
        const stats = {
            total: articles.length,
            quantiteTotale: 0,
            valeurStock: 0,
            valeurAchat: 0,
            margeGlobale: 0,
            articlesEnRupture: 0,
            articlesStockBas: 0,
            parCategorie: {},
            parFournisseur: {}
        };
        
        articles.forEach(article => {
            const qte = article.quantite || 0;
            const pa = article.prixAchat || 0;
            const pv = article.prixVente || 0;
            
            stats.quantiteTotale += qte;
            stats.valeurStock += qte * pv;
            stats.valeurAchat += qte * pa;
            
            // Statuts
            if (qte <= 0) {
                stats.articlesEnRupture++;
            } else if (qte <= (article.quantiteMin || 0)) {
                stats.articlesStockBas++;
            }
            
            // Par catégorie
            const cat = article.categorie || 'autre';
            if (!stats.parCategorie[cat]) {
                stats.parCategorie[cat] = {
                    nombre: 0,
                    quantite: 0,
                    valeur: 0
                };
            }
            stats.parCategorie[cat].nombre++;
            stats.parCategorie[cat].quantite += qte;
            stats.parCategorie[cat].valeur += qte * pv;
            
            // Par fournisseur
            if (article.fournisseur) {
                const fourn = article.fournisseur;
                if (!stats.parFournisseur[fourn]) {
                    stats.parFournisseur[fourn] = {
                        nombre: 0,
                        valeur: 0
                    };
                }
                stats.parFournisseur[fourn].nombre++;
                stats.parFournisseur[fourn].valeur += qte * pv;
            }
        });
        
        // Marge globale
        stats.margeGlobale = stats.valeurStock - stats.valeurAchat;
        
        return stats;
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new StockPVTUploadService();
export default service;