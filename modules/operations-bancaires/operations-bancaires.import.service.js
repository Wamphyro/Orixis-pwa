// ========================================
// OPERATIONS-BANCAIRES.IMPORT.SERVICE.JS
// Service d'import CSV/Excel pour opérations bancaires
// 
// ARCHITECTURE:
// - Détection automatique du format bancaire
// - Support multi-banques françaises
// - Gestion robuste des erreurs
// - Normalisation des données
// ========================================

const OperationsBancairesImportService = {
  
  // ========================================
  // CONFIGURATION DES FORMATS BANCAIRES
  // ========================================
  
  BANK_FORMATS: {
    'CREDIT_MUTUEL': {
      name: 'Crédit Mutuel',
      separator: ';',
      encoding: 'windows-1252',
      dateFormat: 'DD/MM/YYYY',
      columns: {
        0: 'date',
        1: 'dateValeur', 
        2: 'debit',
        3: 'credit',
        4: 'libelle',
        5: 'solde'
      },
      skipLines: 0,
      hasHeader: true
    },
    'BNP_PARIBAS': {
      name: 'BNP Paribas',
      separator: ';',
      encoding: 'utf-8',
      dateFormat: 'DD/MM/YYYY',
      columns: {
        0: 'date',
        1: 'libelle',
        2: 'montant',
        3: 'devise'
      },
      skipLines: 1,
      hasHeader: true
    },
    'SOCIETE_GENERALE': {
      name: 'Société Générale',
      separator: '\t',
      encoding: 'utf-8',
      dateFormat: 'DD/MM/YYYY',
      columns: {
        0: 'date',
        1: 'libelle',
        2: 'debit',
        3: 'credit'
      },
      skipLines: 1,
      hasHeader: true
    }
  },

  // ========================================
  // POINT D'ENTRÉE PRINCIPAL
  // ========================================
  
  async importFile(file) {
    try {
      console.log(`📁 Import du fichier: ${file.name}`);
      
      // 1. Détecter les infos du compte
      const accountInfo = this.detectAccountFromFilename(file.name);
      if (accountInfo) {
        console.log(`💳 Compte détecté: ${accountInfo.accountNumber}`);
      }
      
      // 2. Importer selon le type de fichier
      const extension = file.name.split('.').pop().toLowerCase();
      let result;
      
      if (extension === 'csv' || extension === 'txt') {
        result = await this.importCSV(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        result = await this.importExcel(file);
      } else {
        throw new Error(`Format non supporté: ${extension}`);
      }
      
      // 3. Enrichir avec les infos du compte
      if (accountInfo) {
        result.accountInfo = accountInfo;
        result.operations = result.operations.map(op => ({
          ...op,
          accountNumber: accountInfo.accountNumber,
          accountName: accountInfo.accountName,
          bank: accountInfo.bank
        }));
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur import:', error);
      throw error;
    }
  },

  // ========================================
  // IMPORT CSV
  // ========================================
  
  async importCSV(file) {
    // 1. Lire le fichier avec le bon encoding
    const text = await this.readFileWithEncoding(file);
    
    // 2. Détecter le format bancaire
    const format = this.detectBankFormat(text);
    console.log(`🏦 Format détecté: ${format.name}`);
    
    // 3. Parser les lignes
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    // 4. Traiter les opérations
    const operations = [];
    const startLine = format.hasHeader ? 1 : 0;
    
    for (let i = startLine + format.skipLines; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const operation = this.parseOperation(line, format);
        if (operation && operation.montant !== 0) {
          operations.push(operation);
        }
      } catch (error) {
        console.warn(`Ligne ${i + 1} ignorée:`, error.message);
      }
    }
    
    // 5. Trier par date
    operations.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 6. Calculer les statistiques
    const stats = this.calculateStats(operations);
    
    return {
      operations,
      stats,
      format: format.name,
      filename: file.name
    };
  },

  // ========================================
  // DÉTECTION DU FORMAT BANCAIRE
  // ========================================
  
  detectBankFormat(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Fichier vide');
    }
    
    // Analyser la première ligne
    const firstLine = lines[0];
    
    // Détecter le séparateur
    const separator = this.detectSeparator(firstLine);
    
    // Compter les colonnes
    const columnCount = firstLine.split(separator).length;
    
    // Identifier le format par le nombre de colonnes et le contenu
    if (columnCount === 6 && separator === ';') {
      // Probablement Crédit Mutuel
      return this.BANK_FORMATS.CREDIT_MUTUEL;
    } else if (columnCount === 4 && separator === ';') {
      // Probablement BNP
      return this.BANK_FORMATS.BNP_PARIBAS;
    } else if (separator === '\t') {
      // Probablement Société Générale
      return this.BANK_FORMATS.SOCIETE_GENERALE;
    }
    
    // Format par défaut basé sur l'analyse
    return this.createCustomFormat(firstLine, separator);
  },

  // ========================================
  // CRÉATION D'UN FORMAT PERSONNALISÉ
  // ========================================
  
  createCustomFormat(headerLine, separator) {
    const headers = headerLine.split(separator).map(h => h.trim().toLowerCase());
    const columns = {};
    
    // Mapper les colonnes par leur position
    headers.forEach((header, index) => {
      if (header.includes('date') && !header.includes('valeur')) {
        columns[index] = 'date';
      } else if (header.includes('valeur')) {
        columns[index] = 'dateValeur';
      } else if (header.includes('débit') || header.includes('debit')) {
        columns[index] = 'debit';
      } else if (header.includes('crédit') || header.includes('credit')) {
        columns[index] = 'credit';
      } else if (header.includes('libellé') || header.includes('libelle') || header.includes('description')) {
        columns[index] = 'libelle';
      } else if (header.includes('solde') || header.includes('balance')) {
        columns[index] = 'solde';
      } else if (header.includes('montant') || header.includes('amount')) {
        columns[index] = 'montant';
      }
    });
    
    return {
      name: 'Format personnalisé',
      separator: separator,
      encoding: 'utf-8',
      dateFormat: 'DD/MM/YYYY',
      columns: columns,
      skipLines: 0,
      hasHeader: true
    };
  },

  // ========================================
  // PARSING D'UNE OPÉRATION
  // ========================================
  
  parseOperation(line, format) {
    const values = line.split(format.separator).map(v => v.trim());
    
    // Extraire les valeurs selon le mapping des colonnes
    const getValue = (fieldName) => {
      for (const [index, field] of Object.entries(format.columns)) {
        if (field === fieldName) {
          return values[parseInt(index)] || '';
        }
      }
      return '';
    };
    
    // Parser les montants
    let montant = 0;
    const debitStr = getValue('debit');
    const creditStr = getValue('credit');
    const montantStr = getValue('montant');
    
    if (debitStr) {
      montant = -Math.abs(this.parseMontant(debitStr));
    } else if (creditStr) {
      montant = Math.abs(this.parseMontant(creditStr));
    } else if (montantStr) {
      montant = this.parseMontant(montantStr);
    }
    
    // Parser les dates
    const dateStr = getValue('date');
    const dateValeurStr = getValue('dateValeur');
    
    const date = this.parseDate(dateStr, format.dateFormat);
    if (!date) {
      throw new Error(`Date invalide: ${dateStr}`);
    }
    
    // Créer l'opération
    return {
      date: date,
      dateValeur: this.parseDate(dateValeurStr, format.dateFormat) || date,
      libelle: this.cleanLibelle(getValue('libelle')),
      montant: montant,
      type: montant >= 0 ? 'credit' : 'debit',
      solde: this.parseMontant(getValue('solde')),
      devise: 'EUR',
      categorie: this.detectCategorie(getValue('libelle')),
      raw: line
    };
  },

  // ========================================
  // PARSING DES MONTANTS
  // ========================================
  
  parseMontant(value) {
    if (!value || value === '') return 0;
    
    // Nettoyer la valeur
    let cleaned = value.toString()
      .replace(/\s/g, '')           // Espaces
      .replace(/[€$£]/g, '')        // Symboles monétaires
      .replace(/EUR|USD|GBP/gi, '') // Codes devises
      .trim();
    
    // Si vide après nettoyage
    if (!cleaned) return 0;
    
    // Gérer le format français (virgule comme séparateur décimal)
    if (cleaned.includes(',')) {
      // Compter les séparateurs
      const commaCount = (cleaned.match(/,/g) || []).length;
      const dotCount = (cleaned.match(/\./g) || []).length;
      
      if (commaCount === 1 && dotCount === 0) {
        // Format simple: 1234,56
        cleaned = cleaned.replace(',', '.');
      } else if (dotCount > 0) {
        // Format avec milliers: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (commaCount > 1) {
        // Plusieurs virgules = erreur
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  },

  // ========================================
  // PARSING DES DATES
  // ========================================
  
  parseDate(value, format = 'DD/MM/YYYY') {
    if (!value || value === '') return null;
    
    const cleaned = value.trim();
    
    // Pattern pour DD/MM/YYYY
    const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (match) {
      let [, day, month, year] = match;
      
      // Gérer les années sur 2 chiffres
      if (year.length === 2) {
        year = (parseInt(year) > 50 ? '19' : '20') + year;
      }
      
      // Vérifier la validité
      const date = new Date(year, month - 1, day);
      if (date.getDate() == day && date.getMonth() == month - 1) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    return null;
  },

  // ========================================
  // UTILITAIRES
  // ========================================
  
  detectSeparator(line) {
    const separators = [';', ',', '\t', '|'];
    let maxCount = 0;
    let bestSeparator = ';';
    
    for (const sep of separators) {
      const count = (line.match(new RegExp('\\' + sep, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestSeparator = sep;
      }
    }
    
    return bestSeparator;
  },

  cleanLibelle(value) {
    if (!value) return '';
    
    return value
      .replace(/\s+/g, ' ')
      .replace(/\*+/g, '')
      .trim();
  },

  detectCategorie(libelle) {
    if (!libelle) return 'autre';
    
    const libelleUpper = libelle.toUpperCase();
    
    const rules = [
      { pattern: /SALAIRE|PAIE|VIREMENT\s+EMPLOYEUR/, categorie: 'salaires' },
      { pattern: /CPAM|SECU|SECURITE\s+SOCIALE|REMBT\s+SS/, categorie: 'remboursement_secu' },
      { pattern: /MUTUELLE|MMA|ALMERYS|HARMONIE/, categorie: 'remboursement_mutuelle' },
      { pattern: /IMPOT|IMPOTS|DGFIP|TRESOR\s+PUBLIC/, categorie: 'impots' },
      { pattern: /EDF|ENGIE|GAZ|ELECTRICITE/, categorie: 'energie' },
      { pattern: /ORANGE|SFR|BOUYGUES|FREE/, categorie: 'telecom' },
      { pattern: /ASSURANCE|MAIF|MACIF|AXA/, categorie: 'assurances' },
      { pattern: /CARREFOUR|LECLERC|AUCHAN|LIDL/, categorie: 'alimentation' },
      { pattern: /ESSENCE|CARBURANT|TOTAL|SHELL/, categorie: 'carburant' },
      { pattern: /RESTAURANT|RESTO|BRASSERIE/, categorie: 'restaurant' },
      { pattern: /AMAZON|FNAC|CDISCOUNT/, categorie: 'ecommerce' },
      { pattern: /CREDIT\s+IMMOBILIER|PRET\s+HABITAT/, categorie: 'credit_immobilier' },
      { pattern: /LOYER|LOCATION/, categorie: 'loyer' },
      { pattern: /PHARMACIE|DOCTEUR|MEDECIN/, categorie: 'sante' },
      { pattern: /RETRAIT|DAB|DISTRIBUTEUR/, categorie: 'retrait_especes' },
      { pattern: /VIREMENT|VIR\s+/, categorie: 'virement' },
      { pattern: /CHEQUE|CHQ/, categorie: 'cheque' },
      { pattern: /FRAIS|COMMISSION|AGIOS/, categorie: 'frais_bancaires' },
      { pattern: /NETFLIX|SPOTIFY|CANAL/, categorie: 'abonnements' },
      { pattern: /CB\s+\d{4}/, categorie: 'carte_bancaire' },
      { pattern: /C A T\s+\d+|INTERETS/, categorie: 'epargne' }
    ];
    
    for (const rule of rules) {
      if (rule.pattern.test(libelleUpper)) {
        return rule.categorie;
      }
    }
    
    return 'autre';
  },

  detectAccountFromFilename(filename) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Pattern pour numéro de compte (11 chiffres)
    const match = nameWithoutExt.match(/^(\d{11})$/);
    if (match) {
      return {
        accountNumber: match[1],
        maskedNumber: '•••' + match[1].slice(-4),
        accountName: `Compte ${match[1].slice(-4)}`,
        bank: 'Crédit Mutuel'
      };
    }
    
    return null;
  },

  async readFileWithEncoding(file) {
    // Essayer plusieurs encodings
    const encodings = ['windows-1252', 'utf-8', 'iso-8859-1'];
    
    for (const encoding of encodings) {
      try {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file, encoding);
        });
        
        // Vérifier si le texte est lisible
        if (!text.includes('�')) {
          console.log(`✅ Encoding: ${encoding}`);
          return text;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Fallback
    return await file.text();
  },

  calculateStats(operations) {
    const stats = {
      total: operations.length,
      credits: 0,
      debits: 0,
      montantCredits: 0,
      montantDebits: 0,
      balance: 0,
      categories: {},
      periodes: {
        debut: null,
        fin: null,
        jours: 0
      }
    };
    
    operations.forEach(op => {
      if (op.type === 'credit') {
        stats.credits++;
        stats.montantCredits += op.montant;
      } else {
        stats.debits++;
        stats.montantDebits += Math.abs(op.montant);
      }
      
      stats.balance += op.montant;
      
      // Catégories
      const cat = op.categorie || 'autre';
      if (!stats.categories[cat]) {
        stats.categories[cat] = { nombre: 0, montant: 0 };
      }
      stats.categories[cat].nombre++;
      stats.categories[cat].montant += op.montant;
      
      // Période
      if (op.date) {
        if (!stats.periodes.debut || op.date < stats.periodes.debut) {
          stats.periodes.debut = op.date;
        }
        if (!stats.periodes.fin || op.date > stats.periodes.fin) {
          stats.periodes.fin = op.date;
        }
      }
    });
    
    // Calculer les jours
    if (stats.periodes.debut && stats.periodes.fin) {
      const debut = new Date(stats.periodes.debut);
      const fin = new Date(stats.periodes.fin);
      stats.periodes.jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    return stats;
  },

  // ========================================
  // IMPORT EXCEL (OPTIONNEL)
  // ========================================
  
  async importExcel(file) {
    throw new Error('Import Excel non implémenté. Utilisez le format CSV.');
  }
};

// Export du service
export default OperationsBancairesImportService;