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
// @id = ch.banana.costarica.import.statement.scotiabank
// @api = 1.0
// @pubdate = 2025-05-27
// @publisher = Banana.ch SA
// @description = Scotiabank - Import account statement (*.xls/*.xlsx)
// @description.en = Scotiabank - Import account statement (*.xls/*.xlsx)
// @description.es = Scotiabank - Importar estado de cuenta (*.xls/*.xlsx)
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

    // Scotiabank de Costa Rica statement format 1
    let scotiabankStatement1 = new ScotiabankStatementFormat1();
    let formB1 = scotiabankStatement1.getFormattedData(inData, importUtilities);

    if (scotiabankStatement1.match(formB1))
        return Banana.Converter.arrayToTsv(
            scotiabankStatement1.convertCsvToIntermediaryData(formB1)
        );

    importUtilities.getUnknownFormatError();
    return "";
}

var ScotiabankStatementFormat1 = class ScotiabankStatementFormat1 {
    constructor() {
        this.dateFormat = "dd/mm/yyyy";
        this.headerLineStart = 0;
        this.dataLineStart = 1;
    }

    getFormattedData(inData, importUtilities) {
        let separator = this.findSeparator(inData);

        let transactions = Banana.Converter.csvToArray(inData, separator, "");
        let columns = importUtilities.getHeaderData(transactions, this.headerLineStart); //array
        let rows = importUtilities.getRowData(transactions, this.dataLineStart); //array of array
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
            // Banana.console.log("transaction: " + JSON.stringify(transaction));

            if (transaction["Fecha de Movimiento"] && transaction["Fecha de Movimiento"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/))
                formatMatched = true;
            else
                formatMatched = false;

            if (formatMatched && transaction["Número de Referencia"])
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
            if (tr["Fecha de Movimiento"] &&
                tr["Fecha de Movimiento"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/) &&
                tr["Número de Referencia"]) {
                transactionsToImport.push(this.mapTransaction(tr));
            }
        }

        // Add header and return
        var header = [["Date", "Description", "ExternalReference", "Income", "Expenses"],];
        return header.concat(transactionsToImport);
    }

    mapTransaction(transaction) {
        var mappedLine = [];
        mappedLine.push(Banana.Converter.toInternalDateFormat(transaction["Fecha de Movimiento"], this.dateFormat));
        mappedLine.push(transaction["Descripción"]);
        mappedLine.push(transaction["Número de Referencia"]);
        if (transaction["Crédito/Débito"] === "Crédito") {
            mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["Monto"], "."));
            mappedLine.push("");
        }
        else {
            mappedLine.push("");
            mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["Monto"], "."));
        }

        return mappedLine;
    }

    findSeparator(string) {

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
};
