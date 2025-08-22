// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                       REGLEMENT.UPLOAD.SERVICE.JS                          ║
// ║                      Service Import/Analyse CSV Règlements                 ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Import CSV avec détection automatique colonnes                     ║
// ║ Version: 1.1.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// ╔════════════════════════════════════════╗
// ║     SECTION 1: CONFIGURATION           ║
// ╚════════════════════════════════════════╝

const CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    allowedExtensions: ['.csv', '.txt', '.tsv']
};

// ╔════════════════════════════════════════╗
// ║   SECTION 2: SERVICE UPLOAD            ║
// ╚════════════════════════════════════════╝

class ReglementUploadService {
    
    // ┌────────────────────────────────────────┐
    // │      ANALYSE FICHIER CSV               │
    // └────────────────────────────────────────┘
    
    async analyserCSV(file) {
        try {
            console.log('💰 Analyse du fichier règlements:', file.name);
            console.log('📁 Taille du fichier:', file.size, 'octets');
            
            // ─── Validation fichier ───
            this.validateFile(file);
            
            // ─── Lecture avec détection encoding ───
            const content = await this.readFileWithEncoding(file);
            
            // ─── Parsing lignes ───
            let lines = content.split(/\r?\n/).filter(line => line.trim());
            if (lines.length === 0) {
                throw new Error('Fichier vide');
            }
            
            console.log(`📋 Nombre total de lignes: ${lines.length}`);
            
            // ─── RECHERCHE LIGNE DE COLONNES ───
            let headerLineIndex = -1;
            let headerLine = '';
            let separator = ';';
            
            // Recherche de la ligne contenant les colonnes
            for (let i = 0; i < Math.min(lines.length, 20); i++) {
                const line = lines[i];
                
                // Si la ligne contient "N° facture" ou "Client" ET "Montant", c'est notre ligne de colonnes
                if ((line.includes('N° facture') || line.includes('Client')) && 
                    (line.includes('Montant') || line.includes('Date'))) {
                    headerLineIndex = i;
                    headerLine = line;
                    console.log(`✅ Ligne de colonnes trouvée à l'index ${i}`);
                    break;
                }
            }
            
            if (headerLineIndex === -1) {
                throw new Error('Format de fichier non reconnu. Impossible de trouver les colonnes.');
            }
            
            // ─── Détection séparateur ───
            separator = this.detectSeparator(headerLine);
            console.log('📌 Séparateur détecté:', separator === '\t' ? 'TAB' : `"${separator}"`);
            
            // ─── Détection mapping colonnes ───
            const columnMapping = this.detectColumns(headerLine, separator);
            console.log('🗺️ Mapping colonnes:', columnMapping);
            
            // ─── Vérification colonnes essentielles ───
            if (!columnMapping.hasEssentialColumns) {
                throw new Error('Colonnes essentielles manquantes (Date, Client, Montant)');
            }
            
            // ─── PARSING DES DONNÉES ───
            const reglements = [];
            const errors = [];
            
            for (let i = headerLineIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;
                
                // Ignorer lignes de pied de page
                if (line.toLowerCase().includes('total') || 
                    line.toLowerCase().includes('page') ||
                    line.toLowerCase().includes('fin')) {
                    continue;
                }
                
                try {
                    const reglement = this.parseReglement(line, separator, columnMapping.mapping);
                    if (reglement && reglement.montant !== 0) {
                        reglements.push(reglement);
                    }
                } catch (error) {
                    errors.push({
                        ligne: i + 1,
                        erreur: error.message,
                        contenu: line.substring(0, 100)
                    });
                }
            }
            
            console.log(`✅ ${reglements.length} règlements extraits`);
            
            // ─── Calcul statistiques ───
            const stats = this.calculateStats(reglements);
            
            return {
                reglements,
                stats,
                errors,
                mapping: columnMapping,
                separator
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse CSV:', error);
            throw new Error(`Erreur analyse CSV: ${error.message}`);
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │      VALIDATION FICHIER                │
    // └────────────────────────────────────────┘
    
    validateFile(file) {
        if (file.size > CONFIG.maxFileSize) {
            const sizeMB = (CONFIG.maxFileSize / 1024 / 1024).toFixed(0);
            throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
        }
        
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
        
        for (const sep of separators) {
            const regex = sep === '\t' ? /\t/g : new RegExp('\\' + sep, 'g');
            const matches = firstLines.match(regex);
            const count = matches ? matches.length : 0;
            
            if (count > maxCount) {
                maxCount = count;
                bestSeparator = sep;
            }
        }
        
        return bestSeparator;
    }
    
    // ┌────────────────────────────────────────┐
    // │      DÉTECTION MAPPING COLONNES        │
    // └────────────────────────────────────────┘
    
    detectColumns(headerLine, separator) {
        const headers = headerLine.split(separator).map(h => 
            h.trim()
            .replace(/^["']|["']$/g, '')
            .replace(/^\uFEFF/, '')
        );
        
        console.log('📋 Colonnes trouvées:', headers);
        
        const mapping = {};
        const foundColumns = [];
        
        headers.forEach((header, index) => {
            const headerLower = header.toLowerCase();
            
            // ─── MAPPING SPÉCIFIQUE POUR VOTRE FORMAT ───
            
            // Date
            if (headerLower === 'date' || headerLower.includes('date') && !headerLower.includes('modif')) {
                mapping[index] = 'date';
                foundColumns.push('date');
            }
            // Client (NOM ET PRÉNOM)
            else if (headerLower === 'client') {
                mapping[index] = 'client';  // Contient nom + prénom
                foundColumns.push('client');
            }
            // NUMÉRO CLIENT
            else if (header === 'N° client' || headerLower === 'n° client' || headerLower === 'numero client') {
                mapping[index] = 'numeroClient';  // Le NUMÉRO du client
                foundColumns.push('numeroClient');
            }
            // Centre/Magasin
            else if (headerLower === 'centre' || headerLower === 'magasin') {
                mapping[index] = 'magasin';
                foundColumns.push('magasin');
            }
            // Type règlement
            else if (headerLower === 'type') {
                mapping[index] = 'typeReglement';
                foundColumns.push('typeReglement');
            }
            // Montant
            else if (headerLower === 'montant') {
                mapping[index] = 'montant';
                foundColumns.push('montant');
            }
            // Numéro Sécu
            else if (headerLower === 'numsecu' || headerLower === 'num secu') {
                mapping[index] = 'numeroSecu';
                foundColumns.push('numeroSecu');
            }
            // Tiers Payeur
            else if (headerLower === 'tp' || headerLower === 'tiers payeur') {
                mapping[index] = 'tiersPayeur';
                foundColumns.push('tiersPayeur');
            }
            // Numéro de chèque
            else if (header === 'N° CHQ' || headerLower === 'n° chq' || headerLower.includes('cheque')) {
                mapping[index] = 'numeroCheque';
                foundColumns.push('numeroCheque');
            }
        });
        
        console.log('✅ Mapping créé:', mapping);
        console.log('✅ Colonnes mappées:', foundColumns);
        
        return {
            mapping,
            headers,
            foundColumns,
            hasEssentialColumns: foundColumns.includes('date') && 
                                foundColumns.includes('client') && 
                                foundColumns.includes('montant'),
            isComplete: foundColumns.length >= 3
        };
    }
    
    // ┌────────────────────────────────────────┐
    // │      PARSING RÈGLEMENT                 │
    // └────────────────────────────────────────┘
    
    parseReglement(line, separator, columnMapping) {
        const values = this.parseCSVLine(line, separator);
        
        const reglement = {};
        let hasData = false;
        
        for (const [index, field] of Object.entries(columnMapping)) {
            const value = values[parseInt(index)];
            if (value && value.trim()) {
                hasData = true;
                
                switch (field) {
                    case 'date':
                        reglement.date = this.parseDate(value);
                        break;
                    
                    case 'client':
                        // Le champ client contient "NOM PRENOM", on doit séparer
                        const clientComplet = this.cleanString(value);
                        reglement.client = clientComplet;
                        
                        // Séparer nom et prénom
                        const parts = clientComplet.split(' ');
                        if (parts.length >= 2) {
                            // Premier mot = nom, reste = prénom
                            reglement.nomClient = parts[0];
                            reglement.prenomClient = parts.slice(1).join(' ');
                        } else {
                            // Un seul mot = nom seulement
                            reglement.nomClient = clientComplet;
                            reglement.prenomClient = '';
                        }
                        break;
                    
                    case 'numeroClient':
                        // Le NUMÉRO du client (pas son nom !)
                        reglement.numeroClient = this.cleanString(value);
                        break;
                    
                    case 'numeroSecu':
                        reglement.numeroSecu = this.cleanString(value);
                        break;
                    
                    case 'tiersPayeur':
                        reglement.tiersPayeur = this.cleanString(value);
                        break;
                    
                    case 'numeroCheque':
                        reglement.numeroCheque = this.cleanString(value);
                        break;
                    
                    case 'montant':
                        reglement.montant = this.parseMontant(value);
                        break;
                    
                    case 'typeReglement':
                        reglement.typeReglement = this.parseTypeReglement(value);
                        break;
                    
                    case 'magasin':
                        reglement.magasin = this.cleanString(value);
                        break;
                    
                    default:
                        reglement[field] = this.cleanString(value);
                }
            }
        }
        
        // ─── Validation ───
        if (!hasData || !reglement.date || !reglement.client) {
            return null;
        }
        
        // ─── Valeurs par défaut ───
        reglement.typeReglement = reglement.typeReglement || 'CHEQUE';
        reglement.magasin = reglement.magasin || '-';
        
        console.log('💰 Règlement parsé:', {
            client: reglement.client,
            nomClient: reglement.nomClient,
            prenomClient: reglement.prenomClient,
            numeroClient: reglement.numeroClient,
            montant: reglement.montant
        });
        
        return reglement;
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
                    i++;
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
        
        result.push(current);
        
        return result.map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    
    // ┌────────────────────────────────────────┐
    // │      PARSING TYPES SPÉCIFIQUES         │
    // └────────────────────────────────────────┘
    
parseTypeReglement(value) {
    if (!value) return 'AUTRE';
    
    const v = value.toUpperCase().trim();
    
    // ─── MAPPING COMPLET DES CODES ───
    
    // Carte bancaire
    if (v === 'CB') return 'CB';
    
    // Espèces
    if (v === 'ESP') return 'ESPECES';
    
    // Chèques (tous types)
    if (v === 'CHQ' || v === 'CHQ-DIFF') return 'CHEQUE';
    
    // Virements simples
    if (v === 'VIR') return 'VIREMENT';
    
    // Bons d'achat / Avoirs
    if (v === 'AN' || v === 'AV') return 'BON_ACHAT';
    
    // Cofidis (tous types)
    if (v === 'COF12' || v === 'COF24' || v === 'COF48' || v === 'WW') return 'COFIDIS';
    
    // Franfinance (tous types)
    if (v === 'FRAN12' || v === 'FRAN24' || v === 'FRAN36' || v === 'FRAN48' || v === 'FRANNEXT') return 'FRANFINANCE';
    
    // MDPH (tous types)
    if (v === 'MDPH-FDC' || v === 'MDPH-PCH' || v.startsWith('MDPH')) return 'MDPH';
    
    // ✅ TIERS PAYEURS SÉCURITÉ SOCIALE (SÉPARÉ)
    if (v === 'TPSC' || v === 'TPSV') return 'TP_SECU';
    
    // ✅ TIERS PAYEURS MUTUELLE (SÉPARÉ)
    if (v === 'TPMC' || v === 'TPMV') return 'TP_MUTUELLE';
    
    // Autres organismes
    if (v === 'AGEFIPH') return 'AGEFIPH';
    if (v === 'FIPHFP') return 'FIPHFP';
    
    // Financements spéciaux
    if (v === 'EURO') return 'EUROSSUR';
    if (v === 'SOFEMO') return 'SOFEMO';
    if (v === 'AAWS') return 'WEB_STORE';
    
    // OD - Opérations diverses
    if (v === 'OD') return 'OD';
    
    // Paiement N fois
    if (v === 'PNFC') return 'PAIEMENT_NFOIS';
    
    // ✅ SI NON RECONNU → AUTRE
    console.log('⚠️ Type de règlement non reconnu:', v);
    return 'AUTRE';
}
    
    parseDate(value) {
        if (!value) return null;
        
        const cleaned = value.trim();
        
        // Format DD/MM/YYYY
        const match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (match) {
            let [, day, month, year] = match;
            
            if (year.length === 2) {
                year = '20' + year;
            }
            
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Format YYYY-MM-DD
        if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return cleaned;
        }
        
        return new Date().toISOString().split('T')[0];
    }
    
    parseMontant(value) {
        if (!value) return 0;
        
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .replace(/[€$]/g, '')
            .trim();
        
        // Format français (virgule comme décimale)
        if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        
        const parsed = parseFloat(cleaned);
        // Peut être négatif (remboursements)
        return isNaN(parsed) ? 0 : parsed;
    }
    
    cleanString(value) {
        if (!value) return '';
        return value.trim().replace(/\s+/g, ' ');
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
                
                if (!text.includes('�') && !text.includes('�')) {
                    console.log(`✅ Encoding détecté: ${encoding}`);
                    return text;
                }
            } catch (error) {
                continue;
            }
        }
        
        return await file.text();
    }
    
    // ┌────────────────────────────────────────┐
    // │      CALCUL STATISTIQUES               │
    // └────────────────────────────────────────┘
    
    calculateStats(reglements) {
        const stats = {
            total: reglements.length,
            montantTotal: 0,
            montantPositif: 0,
            montantNegatif: 0,
            parType: {},
            parMagasin: {}
        };
        
        reglements.forEach(reglement => {
            const montant = reglement.montant || 0;
            stats.montantTotal += montant;
            
            if (montant > 0) {
                stats.montantPositif += montant;
            } else {
                stats.montantNegatif += montant;
            }
            
            // Par type
            const type = reglement.typeReglement || 'AUTRE';
            if (!stats.parType[type]) {
                stats.parType[type] = { nombre: 0, montant: 0 };
            }
            stats.parType[type].nombre++;
            stats.parType[type].montant += montant;
            
            // Par magasin
            const magasin = reglement.magasin || '-';
            if (!stats.parMagasin[magasin]) {
                stats.parMagasin[magasin] = { nombre: 0, montant: 0 };
            }
            stats.parMagasin[magasin].nombre++;
            stats.parMagasin[magasin].montant += montant;
        });
        
        return stats;
    }
}

// ╔════════════════════════════════════════╗
// ║      SECTION 3: EXPORT SINGLETON       ║
// ╚════════════════════════════════════════╝

const service = new ReglementUploadService();
export default service;