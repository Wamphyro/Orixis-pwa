// Service pour l'import Excel/CSV bancaire
const OperationsBancairesImportService = {
  
  /**
   * Parse un fichier Excel
   */
  async parseExcelFile(file) {
    try {
      // Utiliser une librairie comme SheetJS
      const workbook = await this.readExcel(file);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      return this.normalizeData(jsonData);
    } catch (error) {
      console.error('Erreur parsing Excel:', error);
      throw error;
    }
  },
  
  /**
   * Parse un fichier CSV
   */
  async parseCSVFile(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(';');
    
    return lines.slice(1).map(line => {
      const values = line.split(';');
      const row = {};
      headers.forEach((header, i) => {
        row[header.trim()] = values[i]?.trim();
      });
      return row;
    });
  },
  
  /**
   * Normalise les données peu importe la source
   */
  normalizeData(rawData) {
    return rawData.map(row => ({
      date: this.parseDate(row['Date'] || row['Date opération']),
      libelle: row['Libellé'] || row['Description'],
      montant: this.parseMontant(row['Montant'] || row['Débit'] || row['Crédit']),
      type: this.detectType(row),
      reference: row['Référence'] || null
    }));
  },
  
  /**
   * Détecte le type d'opération
   */
  detectType(row) {
    const montant = this.parseMontant(row['Montant']);
    if (montant > 0) return 'credit';
    if (montant < 0) return 'debit';
    
    // Ou selon colonnes séparées
    if (row['Crédit']) return 'credit';
    if (row['Débit']) return 'debit';
    
    return 'unknown';
  },
  
  /**
   * Parse une date française
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    // Format DD/MM/YYYY → YYYY-MM-DD
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  },
  
  /**
   * Parse un montant
   */
  parseMontant(montantStr) {
    if (!montantStr) return 0;
    return parseFloat(
      montantStr
        .replace(/\s/g, '')
        .replace(',', '.')
        .replace('€', '')
    );
  }
};

export default OperationsBancairesImportService;