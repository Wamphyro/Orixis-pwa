// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                     STOCK-PRODUIT.UPLOAD.SERVICE.JS                        ║
// ║                      Service Import/Analyse CSV                            ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Import CSV avec détection automatique colonnes                     ║
// ║ Version: 1.0.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// ╔════════════════════════════════════════╗
// ║     SECTION 1: CONFIGURATION           ║
// ╚════════════════════════════════════════╝

const CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    allowedExtensions: ['.csv', '.txt', '.tsv'],
    
    // ─── MAPPING COLONNES CSV → FIREBASE ───
    COLUMN_MAPPINGS: {
        // CSV → Firebase
        marque: ['marque', 'brand', 'fabricant'],
        libelle: ['libelle', 'libellé', 'description', 'nom'],
        numeroSerie: ['numero_de_serie', 'num_serie', 'n_serie', 'serie', 'serial'],
        magasin: ['centre', 'magasin', 'lieu', 'site'],
        statut: ['etat', 'état', 'statut', 'status'],
        quantite: ['qte', 'quantite', 'quantité', 'qty', 'stock'],
        client: ['client', 'customer', 'destinataire'],
        fournisseur: ['fournisseur', 'supplier', 'vendor'],
        date: ['date', 'date_edition', 'date_édition', 'date_creation']
    }
};

// ╔════════════════════════════════════════╗
// ║   SECTION 2: SERVICE UPLOAD            ║
// ╚════════════════════════════════════════╝

class StockProduitUploadService {
    
    // ┌────────────────────────────────────────┐
    // │      ANALYSE FICHIER CSV               │
    // └────────────────────────────────────────┘
    
async analyserCSV(file) {
    try {
        console.log('📊 Analyse du fichier:', file.name);
        
        // Validation fichier
        this.validateFile(file);
        
        // Lecture fichier
        const content = await this.readFileWithEncoding(file);
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length === 0) {
            throw new Error('Fichier vide');
        }
        
        // Trouver la ligne avec les colonnes (celle qui contient "Marque", "Libellé", etc.)
        let headerLineIndex = -1;
        let separator = ';';
        
        for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('marque') && line.includes('libellé')) {
                headerLineIndex = i;
                console.log(`✅ Headers trouvés ligne ${i}: ${lines[i]}`);
                break;
            }
        }
        
        if (headerLineIndex === -1) {
            throw new Error('Colonnes non trouvées');
        }
        
        // Parser les colonnes
        const headerLine = lines[headerLineIndex];
        const headers = headerLine.split(separator).map(h => h.replace(/"/g, '').trim());
        
        console.log('📋 COLONNES:', headers);
        
        // MAPPING DIRECT DES INDEX
        const mapping = {};
        headers.forEach((header, index) => {
            const h = header.toLowerCase();
            if (h === 'date') mapping.date = index;
            else if (h === 'marque') mapping.marque = index;
            else if (h === 'libellé') mapping.libelle = index;
            else if (h === 'n° série') mapping.numeroSerie = index;
            else if (h === 'centre') mapping.magasin = index;
            else if (h === 'état') mapping.statut = index;
            else if (h === 'qté') mapping.quantite = index;
            else if (h === 'client') mapping.client = index;
            else if (h === 'fournisseur') mapping.fournisseur = index;
        });
        
        console.log('📍 MAPPING:', mapping);
        
        // Parser les articles
        const articles = [];
        
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            const values = line.split(separator).map(v => v.replace(/"/g, '').trim());
            
            const article = {
                date: values[mapping.date] || '-',
                marque: values[mapping.marque] || '-',
                libelle: values[mapping.libelle] || '-',
                numeroSerie: values[mapping.numeroSerie] || null,
                magasin: values[mapping.magasin] || '-',
                statut: values[mapping.statut] || 'STO',
                quantite: parseInt(values[mapping.quantite]) || 0,
                client: values[mapping.client] || '-',
                fournisseur: values[mapping.fournisseur] || '-'
            };
            
            // Convertir la date DD/MM/YYYY en YYYY-MM-DD
            if (article.date && article.date !== '-') {
                const match = article.date.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (match) {
                    const [, day, month, year] = match;
                    article.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            }
            
            // Ne pas ajouter les lignes vides
            if (article.libelle !== '-' || article.numeroSerie) {
                articles.push(article);
                console.log(`✅ Article ${i}: Date=${article.date}, Série=${article.numeroSerie}`);
            }
        }
        
        console.log(`✅ ${articles.length} articles extraits`);
        
        return {
            articles,
            stats: {
                total: articles.length,
                quantiteTotale: articles.reduce((sum, a) => sum + a.quantite, 0)
            },
            errors: [],
            mapping: mapping,
            separator: separator
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
}
    
    // ┌────────────────────────────────────────┐
    // │      VALIDATION FICHIER                │
    // └────────────────────────────────────────┘
    
    validateFile(file) {
        // ─── Vérification taille ───
        if (file.size > CONFIG.maxFileSize) {
            const sizeMB = (CONFIG.maxFileSize / 1024 / 1024).toFixed(0);
            throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
        }
        
        // ─── Vérification type ───
        const extension = '.' + this.getFileExtension(file.name);
        const typeValide = CONFIG.allowedTypes.includes(file.type) || 
                          CONFIG.allowedExtensions.includes(extension.toLowerCase());
        
        if (!typeValide) {
            throw new Error(`Type de fichier non autorisé. Formats acceptés: CSV, TXT`);
        }
    }
    
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'csv';
    }
    
    // ┌────────────────────────────────────────┐
    // │      DÉTECTION SÉPARATEUR              │
    // └────────────────────────────────────────┘
    
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
            
            // ─── Compter séparateur dans chaque ligne ───
            for (const line of lines) {
                if (line.trim()) {
                    const matches = line.match(regex);
                    counts.push(matches ? matches.length : 0);
                }
            }
            
            // ─── Vérifier cohérence ───
            if (counts.length > 0) {
                const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
                const consistency = counts.every(c => c === counts[0]) ? 1 : 0;
                
                // Préférer le séparateur avec plus de colonnes ET meilleure cohérence
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
    
    // ┌────────────────────────────────────────┐
    // │      DÉTECTION MAPPING COLONNES        │
    // └────────────────────────────────────────┘
    
// REMPLACER la fonction detectColumns COMPLÈTE
parseArticle(line, separator, columnMapping) {
    const values = this.parseCSVLine(line, separator);
    
    // DEBUG: AFFICHER LES VALEURS
    console.log('📝 Ligne CSV:', line);
    console.log('📊 Valeurs parsées:', values);
    console.log('🗺️ Mapping:', columnMapping);
    
    const article = {};
    let hasData = false;
    
    for (const [index, field] of Object.entries(columnMapping)) {
        const value = values[parseInt(index)];
        
        // DEBUG SPÉCIFIQUE POUR LA DATE
        if (field === 'date') {
            console.log(`📅 COLONNE DATE - Index ${index}: "${value}"`);
        }
        
        if (value && value.trim()) {
            hasData = true;
            
            switch (field) {
                case 'date':
                    article.date = this.parseDate(value) || value || '-';
                    console.log(`📅 DATE FINALE: "${article.date}"`);
                    break;
                    
                case 'quantite':
                    article.quantite = this.parseNumber(value, true);
                    break;
                    
                case 'marque':
                    article.marque = this.cleanString(value);
                    break;
                    
                case 'libelle':
                    article.libelle = this.cleanString(value);
                    break;
                    
                case 'numeroSerie':
                    article.numeroSerie = this.cleanString(value);
                    break;
                    
                case 'magasin':
                    article.magasin = this.cleanString(value);
                    break;
                    
                case 'client':
                    article.client = this.cleanString(value);
                    break;
                    
                case 'fournisseur':
                    article.fournisseur = this.cleanString(value);
                    break;
                    
                case 'statut':
                    article.statut = this.cleanString(value).toUpperCase();
                    break;
                    
                default:
                    article[field] = this.cleanString(value);
            }
        }
    }
    
    // Valeurs par défaut
    article.quantite = article.quantite || 0;
    article.statut = article.statut || 'STO';
    article.date = article.date || '-';
    
    console.log('✅ ARTICLE COMPLET:', article);
    
    return hasData ? article : null;
}
    
    // ┌────────────────────────────────────────┐
    // │      PARSING ARTICLE                   │
    // └────────────────────────────────────────┘
    
// REMPLACER la fonction parseArticle COMPLÈTE
parseArticle(line, separator, columnMapping) {
    const values = line.split(separator).map(v => v.trim());
    
    console.log('📝 Valeurs de la ligne:', values);
    
    const article = {};
    let hasData = false;
    
    for (const [index, field] of Object.entries(columnMapping)) {
        const value = values[parseInt(index)];
        
        if (field === 'date') {
            // PARSER LA DATE DE CETTE LIGNE
            if (value && value !== '') {
                // Convertir DD/MM/YYYY en YYYY-MM-DD
                const match = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
                if (match) {
                    const [, day, month, year] = match;
                    const fullYear = year.length === 2 ? '20' + year : year;
                    article.date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    console.log(`📅 DATE PARSÉE: ${value} → ${article.date}`);
                } else {
                    article.date = value; // Garder la valeur originale
                }
            } else {
                article.date = '-';
            }
        }
        else if (value && value.trim()) {
            hasData = true;
            
            switch (field) {
                case 'quantite':
                    article.quantite = parseInt(value) || 0;
                    break;
                case 'marque':
                    article.marque = value;
                    break;
                case 'libelle':
                    article.libelle = value;
                    break;
                case 'numeroSerie':
                    article.numeroSerie = value;
                    break;
                case 'magasin':
                    article.magasin = value;
                    break;
                case 'client':
                    article.client = value;
                    break;
                case 'statut':
                    article.statut = value.toUpperCase();
                    break;
                default:
                    article[field] = value;
            }
        }
    }
    
    // Valeurs par défaut
    if (!article.date) article.date = '-';
    if (!article.quantite) article.quantite = 0;
    if (!article.statut) article.statut = 'STO';
    
    console.log('✅ ARTICLE FINAL AVEC DATE:', article);
    
    return hasData ? article : null;
}
    
    // ┌────────────────────────────────────────┐
    // │      PARSING LIGNE CSV                 │
    // └────────────────────────────────────────┘
    
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
    
    // ┌────────────────────────────────────────┐
    // │      PARSING NOMBRES                   │
    // └────────────────────────────────────────┘
    
    parseNumber(value, isInteger = false) {
        if (!value || value === '') return 0;
        
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .trim();
        
        // ─── Gérer nombres négatifs entre parenthèses ───
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            cleaned = '-' + cleaned.slice(1, -1);
        }
        
        // ─── Format français (virgule comme décimale) ───
        if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed)) return 0;
        
        return isInteger ? Math.round(parsed) : parsed;
    }
    
    parseMontant(value) {
        if (!value || value === '') return 0;
        
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .replace(/[€$£]/g, '')
            .replace(/EUR|USD|GBP/gi, '')
            .trim();
        
        if (!cleaned) return 0;
        
        // ─── Format français ───
        if (cleaned.includes(',')) {
            const commaCount = (cleaned.match(/,/g) || []).length;
            const dotCount = (cleaned.match(/\./g) || []).length;
            
            if (commaCount === 1 && dotCount === 0) {
                cleaned = cleaned.replace(',', '.');
            } else if (dotCount > 0) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            }
        }
        
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.abs(parsed);
    }
    
    parseDate(value) {
        if (!value || value === '') return '-';
        
        const cleaned = value.trim();
        
        // ─── Format DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY ───
        const match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (match) {
            let [, day, month, year] = match;
            
            // Gérer les années sur 2 chiffres
            if (year.length === 2) {
                year = (parseInt(year) > 50 ? '19' : '20') + year;
            }
            
            // Vérification de validité
            const date = new Date(year, month - 1, day);
            if (date.getDate() == day && date.getMonth() == month - 1) {
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        
        // ─── Format YYYY-MM-DD (ISO) ───
        const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            return cleaned;
        }
        
        // ─── Format MM/DD/YYYY (américain) ───
        const usMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (usMatch) {
            const [, month, day, year] = usMatch;
            const date = new Date(year, month - 1, day);
            if (date.getDate() == day && date.getMonth() == month - 1) {
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        
        // Si aucun format reconnu, retourner la valeur originale ou '-'
        console.warn(`⚠️ Format de date non reconnu: "${value}"`);
        return '-';
    }
    
    // ┌────────────────────────────────────────┐
    // │      NETTOYAGE STRING                  │
    // └────────────────────────────────────────┘
    
    cleanString(value) {
        if (!value) return '';
        
        return value
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^["']|["']$/g, '');
    }
    
    genererReferenceDepuisDesignation(designation) {
        const cleaned = designation
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 10);
        
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `AUTO-${cleaned}-${random}`;
    }
    
    // ┌────────────────────────────────────────┐
    // │      EXTRACTION NUMÉRO ACM             │
    // └────────────────────────────────────────┘
    
    extractNumeroACM(filename) {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // ─── Si le nom est entièrement numérique ───
        if (/^\d+$/.test(nameWithoutExt)) {
            return nameWithoutExt;
        }
        
        // ─── Chercher un pattern numérique long ───
        const match = filename.match(/(\d{8,})/);
        if (match) {
            return match[1];
        }
        
        console.warn('⚠️ Impossible d\'extraire le numéro ACM du fichier:', filename);
        return null;
    }
    
    // ┌────────────────────────────────────────┐
    // │      LECTURE AVEC DÉTECTION ENCODING   │
    // └────────────────────────────────────────┘
    
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
                
                // ─── Vérifier caractères de remplacement ───
                if (!text.includes('�') && !text.includes('ï¿½')) {
                    console.log(`✅ Encoding détecté: ${encoding}`);
                    return text;
                }
            } catch (error) {
                continue;
            }
        }
        
        // ─── Par défaut UTF-8 ───
        return await file.text();
    }
    
    // ┌────────────────────────────────────────┐
    // │      CALCUL STATISTIQUES               │
    // └────────────────────────────────────────┘
    
    calculateStats(articles) {
        const stats = {
            total: articles.length,
            quantiteTotale: 0,
            valeurStock: 0,
            valeurAchat: 0,
            margeGlobale: 0,
            articlesEnRupture: 0,
            articlesStockBas: 0,
            parStatut: {},
            parMarque: {}
        };
        
        articles.forEach(article => {
            const qte = article.quantite || 0;
            const pa = article.prixAchat || 0;
            const pv = article.prixVente || 0;
            
            stats.quantiteTotale += qte;
            stats.valeurStock += qte * pv;
            stats.valeurAchat += qte * pa;
            
            // ─── États stock ───
            if (qte <= 0) {
                stats.articlesEnRupture++;
            } else if (qte <= (article.quantiteMin || 0)) {
                stats.articlesStockBas++;
            }
            
            // ─── Par statut ───
            const statut = article.statut || 'STO';
            if (!stats.parStatut[statut]) {
                stats.parStatut[statut] = {
                    nombre: 0,
                    quantite: 0
                };
            }
            stats.parStatut[statut].nombre++;
            stats.parStatut[statut].quantite += qte;
            
            // ─── Par marque ───
            if (article.marque) {
                const marque = article.marque;
                if (!stats.parMarque[marque]) {
                    stats.parMarque[marque] = {
                        nombre: 0,
                        quantite: 0
                    };
                }
                stats.parMarque[marque].nombre++;
                stats.parMarque[marque].quantite += qte;
            }
        });
        
        // ─── Marge globale ───
        stats.margeGlobale = stats.valeurStock - stats.valeurAchat;
        
        return stats;
    }
}

// ╔════════════════════════════════════════╗
// ║      SECTION 3: EXPORT SINGLETON       ║
// ╚════════════════════════════════════════╝

const service = new StockProduitUploadService();
export default service;