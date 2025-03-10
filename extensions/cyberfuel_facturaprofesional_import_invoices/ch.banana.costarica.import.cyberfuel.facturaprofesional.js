// Copyright [2025] [Banana.ch SA - Lugano Switzerland]
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// @id = ch.banana.costarica.import.cyberfuel.facturaprofesional
// @api = 1.0
// @pubdate = 2025-03-07
// @publisher = Banana.ch SA
// @description = Factura Profesional - Import invoices (*.csv)
// @description.es = Factura Profesional - Importación de facturas (*.csv)
// @inputdatasource = opendirdialog
// @inputfilefilter = *.csv
// @doctype = 100.*
// @docproperties =
// @task = import.file
// @includejs = import.utilities.js
// @includejs = ch.banana.costarica.import.cyberfuel.facturaprofesional.classes.js

/**
 * This extension imports invoices in CSV format from Cyberfuel Factura Profesional into accounting
 */
function exec(inData) {

    let banDoc = Banana.document;
    if (!banDoc)
        return "@Cancel";

    // Read the data
    let parsedFiles = {};

    try {
        parsedFiles = JSON.parse(inData);
    }
    catch (e) {
        parsedFiles[0] = inData;
    }

    if (!parsedFiles)
        return "@Cancel";

    const importFacturaProfesionalInvoices = new ImportFacturaProfesionalInvoices(banDoc, parsedFiles);
    let docChange = importFacturaProfesionalInvoices.getDocumentChange();
    return docChange;
}

var ImportFacturaProfesionalInvoices = class ImportFacturaProfesionalInvoices {

    constructor(banDoc, filesData) {
        this.banDoc = banDoc;
        this.filesData = filesData;
        this.existingCustomersInvoices = this.banDoc.invoicesCustomers(); // Journal table with all data.
        this.existingSuppliersInvoices = this.banDoc.invoicesSuppliers(); // Journal table with all data.
        this.CRVGContent = this.getFileContent("CRVG");
        this.CRCGContent = this.getFileContent("CRCG");
        this.CRGSEContent = this.getFileContent("CRGSE");
    }

    getDocumentChange() {
        let jsonDoc = { "format": "documentChange", "error": "" };
        jsonDoc["data"] = this.getDocumentChangeInvoicesData();
        return jsonDoc;
    }

    getDocumentChangeInvoicesData() {
        let newInvoicesList = [];
        // First identify new invoices
        newInvoicesList = this.getNewInvoicesList();
    }

    /**
     * Get the list of new invoices to import.
     * We keep the difference between customers and suppliers invoices as our
     * API already provides the list of customers and suppliers separately.
     */
    getNewInvoicesList() {
        let existingInvoicesSet = new Set();
        this.getExistingInvoicesNumbersList(this.existingSuppliersInvoices, existingInvoicesSet);
        let newInvoicesCus = [];
        let newInvoicesESup = [];
        let newInvoicesNESup = [];

        newInvoicesCus = this.getNewInvoicesListCustomers(existingInvoicesSet);
        newInvoicesESup = this.getNewInvoicesListSuppliersCRCG(existingInvoicesSet);
        newInvoicesNESup = this.getNewInvoicesListSuppliersCRGSE(existingInvoicesSet);

        /** Devo uniformare i dati, in maniera che posso lavorare con un solo formato "Fattura".
         * Posso creare una classe InvoiceBanana che contiene tutti i dati necessari per creare una 
         * fattura in Banana, indipendentemente dal tipo di fattura, che posso gestire in maniera flessibile.
         * posso creare un metodo di mappatura per ogni tipologia di fattura (posso farle a livello di classe di report)
         * mapInvoiceBananaFromCRVG (invoiceObj, isNew), mapInvoiceBananaFromCRCG (invoiceObj, isNew), mapInvoiceBananaFromCRGSE (invoiceObj, isNew)
         * Per ogni fattura identificare lo stato: 
         * - Open: Per identificare che una fattura non sia ancora stata pagata, controllare se esiste un pagamento associato controllando nel report dei pagamenti/estratto conto.
         * - Paid: Per identificare che una fattura sia stata pagata, controllare se esiste un pagamento associato controllando nel report dei pagamenti/estratto conto.
         * - Partial: Per identificare se una fattura è stata pagata parzialmente, controllare se esiste un pagamento associato controllando nel report dei pagamenti/estratto conto, 
         * se corrisponde al totale
         * Anche i metodi appena citati dovrebbero essere implementatati a livello di classe di report perche per ogni report, i file di controllo possono variare.
         * Ad esempio per verificare se una fattura di vendita è stata pagata, devo controllare il report dei pagamenti delle vendite
         * */
    }

    /**
     * Returns a list of CRCG objects containing the new invoices to be imported.
     * Works with invoices from suppliers received in electronic format (CRCG)
     */
    getNewInvoicesListSuppliersCRCG(existingInvoicesSet) {

        const headerRowIndex = 8;
        const counterpartyIdColumn = 3;
        const invoiceIdColumn = 6;
        const docType = 5;

        const newInvoices = this.CRCGContent.slice(headerRowIndex + 1).filter(row => {
            const invoiceId = row[invoiceIdColumn];
            const counterpartyId = row[counterpartyIdColumn];
            const uniqueKey = `${invoiceId}|${counterpartyId}`;
            let toMap = false;
            if (!existingInvoicesSet.has(uniqueKey) && row[docType] == "Factura")
                toMap = true;

            return toMap;
        }).map(row => CRCG.fromCsvRow(row));

        return newInvoices;
    }

    /**
    * Returns a list of CRGSE objects containing the new invoices to be imported.
    * Works with invoices from suppliers NOT received in electronic format (CRGSE)
    */
    getNewInvoicesListSuppliersCRGSE(existingInvoicesSet) {
        const headerRowIndex = 8;
        const counterpartyIdColumn = 3;
        const invoiceIdColumn = 3; // Eventualmente usare colonna "N gasto", forse si tratta di un identificativo alternativo interno loro.

        const newInvoices = this.CRGSEContent.slice(headerRowIndex + 1).filter(row => {
            const invoiceId = row[invoiceIdColumn];
            const counterpartyId = row[counterpartyIdColumn];
            const uniqueKey = `${invoiceId}|${counterpartyId}`;

            return !existingInvoicesSet.has(uniqueKey);
        }).map(row => CRGSE.fromCsvRow(row));

        return newInvoices;
    }

    /**
     * Returns a list of “Invoice” objects containing the new invoices to be imported.
     * We check for the new invoices for costumers into the following report:
     * - CRVG (Costa Rica, Ventas Generales)
     */
    getNewInvoicesListCustomers(existingInvoicesSet) {

        const headerRowIndex = 8;
        const counterpartyIdColumn = 6;
        const invoiceIdColumn = 9;
        const docType = 8;

        const newInvoices = this.CRVGContent.slice(headerRowIndex + 1).filter(row => {
            const invoiceId = row[invoiceIdColumn];
            const counterpartyId = row[counterpartyIdColumn];
            const uniqueKey = `${invoiceId}|${counterpartyId}`;
            let toMap = false;
            if (!existingInvoicesSet.has(uniqueKey) && row[docType] == "Factura")
                toMap = true;

            return toMap;
        }).map(row => CRVG.fromCsvRow(row));

        return newInvoices;
    }

    /** Ritorna l'array con i dati del file letto.*/
    getFileContent(fileType) {
        let fileContent = "";
        for (let file in this.filesData) {
            if (this.getFileType(this.filesData[file]) === fileType) {
                fileContent = this.filesData[file];
                return Banana.Converter.csvToArray(fileContent, ";", '"');
            }
        }
        return [];
    }

    /**
    * Each file contains an identification of the file type:
    * - CRVG (Costa Rica, Ventas Generales)
    * - CRVGM (Costa Rica, Ventas Generales Movimientos)
    * - CRCFEC (Costa Rica, Factura Electrónica de Compra)
    * - CRCFECM (Costa Rica, Factura Electrónica de Compra Movimientos) 
    * - CRCG (Costa Rica, Compras Generales)
    * - CRCGM (Costa Rica, Compras Generales Movimientos)
    * - CRGSE (Costa Rica, Gastos sin Soporte Electrónico)
    * - CRGSEM (Costa Rica, Gastos sin soporte electrónico Movimientos de Pago)
    */
    getFileType(fileContent) {
        if (fileContent.indexOf(";CRVG;") > -1) {
            return "CRVG";
        } else if (fileContent.indexOf(";CRVGM;") > -1) {
            return "CRVGM";
        } else if (fileContent.indexOf(";CRCFEC;") > -1) {
            return "CRCFEC";
        } else if (fileContent.indexOf(";CRCFECM;") > -1) {
            return "CRCFECM";
        } else if (fileContent.indexOf(";CRCG;") > -1) {
            return "CRCG";
        } else if (fileContent.indexOf(";CRCGM;") > -1) {
            return "CRCGM";
        } else if (fileContent.indexOf(";CRGSE;") > -1) {
            return "CRGSE";
        } else if (fileContent.indexOf(";CRGSEM;") > -1) {
            return "CRGSEM";
        }
        return "";
    }

    /**
     * Returns the list of existing invoices numbers.
     * Works for both customers and suppliers.
     * We make association: "InvoiceId|CounterpartyId".
     */
    getExistingInvoicesNumbersList(invoicesTableData, existingInvoicesSet) {
        if (invoicesTableData) {
            for (var i = 0; i < invoicesTableData.rowCount; i++) {
                var tRow = invoicesTableData.row(i);
                var jsonString = tRow.toJSON();
                if (jsonString.length > 0) {
                    var jsonRow = JSON.parse(jsonString);
                    let invNr = jsonRow["Invoice"];
                    let counterpartyId = jsonRow["CounterpartyId"];
                    if (invNr && counterpartyId) {
                        existingInvoicesSet.add(jsonRow["Invoice"].toString() + "|" + jsonRow["CounterpartyId"].toString());
                    }
                }
            }
        }
    }
}

// Utilities functions

function displayJournalInvoicesData(invoicesTableData) {
    if (invoicesTableData) { // Invoice customers or suppliers.
        for (var i = 0; i < invoicesTableData.rowCount; i++) {
            var tRow = invoicesTableData.row(i);
            var jsonString = tRow.toJSON();
            if (jsonString.length > 0) {
                var jsonRow = JSON.parse(jsonString);
                for (var key in jsonRow) {
                    if (jsonRow[key])
                        Banana.console.debug(key + ": " + jsonRow[key].toString());
                }
            }
        }
    }
}