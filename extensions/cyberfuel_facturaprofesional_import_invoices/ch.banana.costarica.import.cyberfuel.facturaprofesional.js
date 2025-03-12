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
// @inputencoding = utf-8
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
        this.existingCustomersInvoicesTableData = this.banDoc.invoicesCustomers(); // Journal table with all data.
        this.existingSuppliersInvoicesTableData = this.banDoc.invoicesSuppliers(); // Journal table with all data.
        this.existingInvoices = new Set();
        this.headersRowIndex = 8;
        //Files content
        this.CRVGContent = this.getFileContent("CRVG");
        this.CRVGMContent = this.getFileContent("CRVGM");
        this.CRCFECContent = this.getFileContent("CRCFEC");
        this.CRCFECMContent = this.getFileContent("CRCFECM");
        this.CRCGContent = this.getFileContent("CRCG");
        this.CRCGMContent = this.getFileContent("CRCGM");
        this.CRGSEContent = this.getFileContent("CRGSE");
        this.CRGSEMContent = this.getFileContent("CRGSEM");
        // Map all the content into the Classes created to manage each report.
        this.CRVGData = this.mapDataCRVG();
        this.CRVGMData = this.mapDataCRVGM();
        this.CRCFECData = this.mapDataCRCFEC();
        this.CRCFECMData = this.mapDataCRCFECM();
        this.CRCGData = this.mapDataCRCG();
        this.CRCGMData = this.mapDataCRCGM();
        this.CRGSEData = this.mapDataCRGSE();
        this.CRGSEMData = this.mapDataCRGSEM();

        // Methods
        this.setExistingInvoicesIdentificationList();
    }

    getDocumentChange() {
        let jsonDoc = { "format": "documentChange", "error": "" };
        jsonDoc["data"] = this.getDocumentChangeInvoicesData();
        return jsonDoc;
    }

    getDocumentChangeInvoicesData() {
        let data = [];
        let newInvoicesDoc = this.getNewInvoicesDocumentChange();
        let existingInvoicesDoc = this.getInvoicesToUpdateDocumentChange();
        data.push(newInvoicesDoc);
        data.push(existingInvoicesDoc);

        return data;
    }

    getInvoicesToUpdateDocumentChange() {
        let invoicesToUpdate = this.getInvoicesToUpdateList();
    }

    getNewInvoicesDocumentChange() {
        let newInvoicesList = [];
        newInvoicesList = this.getNewInvoicesList();
        //Banana.Ui.showText(JSON.stringify(newInvoicesList)); //Ok

        let docChangeObj = this.getDocumentChangeInit();
        let rows = [];

        //method to save the transactions, must watch how they record various cases into accounting

        let dataUnitTransactionsTable = {};
        dataUnitTransactionsTable.nameXml = "Transactions";
        dataUnitTransactionsTable.data = {};
        dataUnitTransactionsTable.data.rowLists = [];
        dataUnitTransactionsTable.data.rowLists.push({ "rows": rows });

        docChangeObj.document.dataUnits.push(dataUnitTransactionsTable);

        return docChangeObj;
    }

    getInvoicesToUpdateList() {
        let existingInvoicesCRVG = [];
        let existingInvoicesCRCFEC = [];
        let existingInvoicesCRCG = [];
        let existingInvoicesCRGSE = [];

        existingInvoicesCRVG = this.getExistingInvoicesListCustomersCRVG();
        Banana.Ui.showText(JSON.stringify(existingInvoicesCRVG)); // 13.03 riprendere da qui.

    }

    /**
     * Get the list of new invoices to import.
     * We keep the difference between customers and suppliers invoices as our
     * API already provides the list of customers and suppliers separately.
     */
    getNewInvoicesList() {
        let newInvoicesCRVG = [];
        let newInvoicesCRCFEC = [];
        let newInvoicesCRCG = [];
        let newInvoicesCRGSE = [];

        newInvoicesCRVG = this.getNewInvoicesListCustomersCRVG();
        newInvoicesCRCFEC = this.getNewInvoicesListSuppliersCRCFEC();
        newInvoicesCRCG = this.getNewInvoicesListSuppliersCRCG();
        newInvoicesCRGSE = this.getNewInvoicesListSuppliersCRGSE();


        let invoicesToAdd = [];

        // Map the new customers invoices
        for (let i = 0; i < newInvoicesCRVG.length; i++) {
            invoicesToAdd.push(CRVG.mapToInvoice(newInvoicesCRVG[i], this.CRVGMData));
        }

        // Map the new suppliers electronic invoices
        for (let i = 0; i < newInvoicesCRCFEC.length; i++) {
            invoicesToAdd.push(CRCFEC.mapToInvoice(newInvoicesCRCFEC[i], this.CRCFECMData)); // Pass CRCFECMData to define if a invoice has been paid.
        }

        // Map the new suppliers general invoices
        for (let i = 0; i < newInvoicesCRCG.length; i++) {
            invoicesToAdd.push(CRCG.mapToInvoice(newInvoicesCRCG[i], this.CRCGMData)); // Pass CRCGMData to define if a invoice has been paid.
        }

        // Map the new suppliers general invoices (without electronic format)
        for (let i = 0; i < newInvoicesCRGSE.length; i++) {
            invoicesToAdd.push(CRGSE.mapToInvoice(newInvoicesCRGSE[i], this.CRGSEMData));
        }

        return invoicesToAdd;

    }

    mapDataCRVG() {
        return this.CRVGContent.slice(this.headersRowIndex + 1).map(row => CRVG.fromCsvRow(row));
    }

    mapDataCRVGM() {
        return this.CRVGMContent.slice(this.headersRowIndex + 1).map(row => CRVGM.fromCsvRow(row));
    }

    mapDataCRCFEC() {
        return this.CRCFECContent.slice(this.headersRowIndex + 1).map(row => CRCFEC.fromCsvRow(row));
    }

    mapDataCRCFECM() {
        return this.CRCFECMContent.slice(this.headersRowIndex + 1).map(row => CRCFECM.fromCsvRow(row));
    }

    mapDataCRCG() {
        return this.CRCGContent.slice(this.headersRowIndex + 1).map(row => CRCG.fromCsvRow(row));
    }

    mapDataCRCGM() {
        return this.CRCGMContent.slice(this.headersRowIndex + 1).map(row => CRCGM.fromCsvRow(row));
    }

    mapDataCRGSE() {
        return this.CRGSEContent.slice(this.headersRowIndex + 1).map(row => CRGSE.fromCsvRow(row));
    }

    mapDataCRGSEM() {
        return this.CRGSEMContent.slice(this.headersRowIndex + 1).map(row => CRGSEM.fromCsvRow(row));
    }

    /**
     * Returns a list of CRCFEC objects containing the new invoices to be imported.
     * Works with invoices from customers received in electronic format (CRCFEC)
     */
    getNewInvoicesListSuppliersCRCFEC() {
        return this.CRCFECData.filter(invoice => {
            const uniqueKey = `${invoice.invoiceId}|${invoice.supplierId}`;
            return !this.existingInvoices.has(uniqueKey) && invoice.documentType === "Factura de compra";
        });
    }

    /**
     * Returns a list of CRCG objects containing the new invoices to be imported.
     * Works with invoices from suppliers received in electronic format (CRCG)
     */
    getNewInvoicesListSuppliersCRCG() {
        return this.CRCGData.filter(invoice => {
            const uniqueKey = `${invoice.invoiceId}|${invoice.supplierId}`;
            return !this.existingInvoices.has(uniqueKey) && invoice.documentType === "Factura";
        });
    }

    /**
    * Returns a list of CRGSE objects containing the new invoices to be imported.
    * Works with invoices from suppliers NOT received in electronic format (CRGSE)
    */
    getNewInvoicesListSuppliersCRGSE() {
        return this.CRGSEData.filter(invoice => {
            const uniqueKey = `${invoice.invoiceId}|${invoice.supplierId}`;
            return !this.existingInvoices.has(uniqueKey);
        });
    }

    /**
     * Returns a list of CRVG objects containing the new invoices to be imported.
     * We check for the new invoices for costumers into the following report:
     * - CRVG (Costa Rica, Ventas Generales)
     */
    getNewInvoicesListCustomersCRVG() {
        return this.CRVGData.filter(invoice => {
            const uniqueKey = `${invoice.invoiceId}|${invoice.customerId}`;
            return !this.existingInvoices.has(uniqueKey) && invoice.documentType === "Factura";
        });
    }

    /**
     * Returns a list of CRVG objects containing invoices that already exist in the accounting system.
     * We check for existing invoices for customers in the following report:
     * - CRVG (Costa Rica, Ventas Generales)
     */
    getExistingInvoicesListCustomersCRVG() {
        return this.CRVGData.filter(invoice => {
            const uniqueKey = `${invoice.invoiceId}|${invoice.customerId}`;
            return this.existingInvoices.has(uniqueKey) && invoice.documentType === "Factura";
        });
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
     * Set the list of existing invoices identification.
     * We make association: "InvoiceId|CounterpartyId".
     * Works on the two invoices tables: Customers and Suppliers.
     */
    setExistingInvoicesIdentificationList() {
        let tablesList = [this.existingCustomersInvoicesTableData, this.existingSuppliersInvoicesTableData];

        tablesList.forEach(table => {
            if (!table) return;

            for (let i = 0; i < table.rowCount; i++) {
                let jsonRow = JSON.parse(table.row(i).toJSON() || "{}");
                let invNr = jsonRow["Invoice"];
                let counterpartyId = jsonRow["CounterpartyId"];
                if (invNr && counterpartyId) {
                    this.existingInvoices.add(`${invNr.toString()}|${counterpartyId.toString()}`);
                }
            }
        });
    }


    getDocumentChangeInit() {

        let jsonDoc = {};
        jsonDoc.document = {};
        jsonDoc.document.dataUnitsfileVersion = "1.0.0";
        jsonDoc.document.dataUnits = [];
        jsonDoc.document.cursorPosition = {};

        jsonDoc.creator = {};
        var d = new Date();
        //jsonDoc.creator.executionDate = Banana.Converter.toInternalDateFormat(datestring, "yyyymmdd");
        //jsonDoc.creator.executionTime = Banana.Converter.toInternalTimeFormat(timestring, "hh:mm");
        jsonDoc.creator.name = Banana.script.getParamValue('id');
        jsonDoc.creator.version = "1.0";

        return jsonDoc;

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