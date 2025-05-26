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
//
// @id = ch.banana.costarica.import.statement.bcr
// @api = 1.0
// @pubdate = 2025-05-26
// @publisher = Banana.ch SA
// @description = Banco de Costa Rica - Import account statement (*.csv)
// @description.en = Banco de Costa Rica - Import account statement (*.csv)
// @description.es = Banco de Costa Rica - Importar estado de cuenta (*.csv)
// @doctype = *
// @docproperties =
// @task = import.transactions
// @outputformat = transactions.simple
// @inputdatasource = openfiledialog
// @inputencoding = latin1
// @inputfilefilter = Archivos de texto (*.txt *.csv);;Todos los archivo (*.*)
// @includejs = import.utilities.js

function exec(inData, isTest) {

    var importUtilities = new ImportUtilities(Banana.document);

    if (isTest !== true && !importUtilities.verifyBananaAdvancedVersion())
        return "";

    // Banco de Costa Rica Bank statement format 1
    let bcrBankStatement1 = new BCRBankStatementFormat1()
    let formB1 = bcrBankStatement1.getFormattedData(inData, importUtilities);
    if (bcrBankStatement1.match(formB1))
        return Banana.Converter.arrayToTsv(bcrBankStatement1.convertCsvToIntermediaryData(formB1));


    importUtilities.getUnknownFormatError();
    return "";
}

/**
 * Class for Banco de Costa Rica Bank statement format 1
 * 
 * Note: With this excel file format, could be that the user needs to expand the column "X", the first column
 * where the "Monto Debito" header is located, as it is not always visible and if it is not visible, the import will fail
 * for that column. The problem is only present if data are imported from the clipboard
 */
var BCRBankStatementFormat1 = class BCRBankStatementFormat1 {
    constructor() {
        this.dateFormat = "dd.mm.yyyy";
    }

    getFormattedData(inData, importUtilities) {
        let separator = findSeparator(inData);
        let headerLineStart = separator === '\t' ? 20 : 25;
        let dataLineStart = separator === '\t' ? 21 : 26;
        let transactions = Banana.Converter.csvToArray(inData, separator, '');

        if (!transactions || transactions.length === 0 || transactions.length < dataLineStart || transactions.length < headerLineStart)
            return [];

        let columns = importUtilities.getHeaderData(transactions, headerLineStart); //array
        let rows = importUtilities.getRowData(transactions, dataLineStart); //array of array
        let form = [];
        //Load the form with data taken from the array. Create objects
        importUtilities.loadForm(form, columns, rows);
        return form;
    }

    match(transactionsData) {

        if (!transactionsData || transactionsData.length === 0)
            return false;

        for (let i = 0; i < transactionsData.length; i++) {
            var transaction = transactionsData[i];

            var formatMatched = false;

            if (transaction["Fecha Movimiento"] && transaction["Fecha Movimiento"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/))
                formatMatched = true;
            else
                formatMatched = false;

            if (formatMatched && transaction["Documento"])
                formatMatched = true;
            else
                formatMatched = false;

            if (formatMatched)
                return true;
        }

        return false;
    }

    convertCsvToIntermediaryData(transactionsData) {
        var transactionsToImport = [];

        // Filter and map rows
        for (const tr of transactionsData) {
            if ((tr["Fecha Movimiento"] && tr["Fecha Movimiento"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/)) && tr["Documento"]) {
                transactionsToImport.push(this.mapTransaction(tr));
            }
        }
        // Sort rows by date
        //transactionsToImport = transactionsToImport.reverse();

        // Add header and return
        var header = [["Date", "DateValue", "Description", "ExternalReference", "Income", "Expenses"]];
        return header.concat(transactionsToImport);
    }

    mapTransaction(transaction) {
        var mappedLine = [];
        mappedLine.push(Banana.Converter.toInternalDateFormat(transaction["Fecha Movimiento"], this.dateFormat));
        mappedLine.push(Banana.Converter.toInternalDateFormat(transaction["Fecha Contable"], this.dateFormat));
        mappedLine.push(transaction["Concepto"]);
        mappedLine.push(transaction["Documento"]);
        mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["Monto Crédito"], "."));
        mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["Monto Débito"], "."));

        return mappedLine;
    }
}

function findSeparator(string) {

    var commaCount = 0;
    var semicolonCount = 0;
    var tabCount = 0;

    for (var i = 0; i < 1000 && i < string.length; i++) {
        var c = string[i];
        if (c === ',')
            commaCount++;
        else if (c === ';')
            semicolonCount++;
        else if (c === '\t')
            tabCount++;
    }

    if (tabCount > commaCount && tabCount > semicolonCount) {
        return '\t';
    }
    else if (semicolonCount > commaCount) {
        return ';';
    }

    return ',';
}
