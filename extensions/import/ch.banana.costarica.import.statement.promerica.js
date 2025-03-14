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
// @id = ch.banana.costarica.import.statement.promerica
// @api = 1.0
// @pubdate = 2025-03-14
// @publisher = Banana.ch SA
// @description = Promerica - Importar extracto de cuenta .csv
// @doctype = *
// @docproperties =
// @task = import.transactions
// @outputformat = transactions.simple
// @inputdatasource = openfiledialog
// @inputencoding = latin1
// @inputfilefilter = Archivos de texto (*.txt *.csv);;Todos los archivo (*.*)
// @includejs = ../import.utilities.js

function exec(inData) {

    let banDoc = Banana.document;

    if (!banDoc)
        return "@cancel";

    var importUtilities = new ImportUtilities(Banana.document);

    let promericaBankStatement = new PromericaBankStatement()
    let form = promericaBankStatement.getFormattedData(inData, importUtilities);
    if (promericaBankStatement.match(form))
        return Banana.Converter.arrayToTsv(promericaBankStatement.convertCsvToIntermediaryData(form));

    importUtilities.getUnknownFormatError();
    return "";
}

var PromericaBankStatement = class PromericaBankStatement {
    constructor(banDocument) {
        this.dateFormat = "dd.mm.yyyy";
        this.banDocument = banDocument;
        this.headerLineStart = 7;
        this.dataLineStart = 8;
    }

    getFormattedData(inData, importUtilities) {
        let transactions = Banana.Converter.csvToArray(inData, ";", '');
        let columns = importUtilities.getHeaderData(transactions, this.headerLineStart); //array
        let rows = importUtilities.getRowData(transactions, this.dataLineStart); //array of array
        let form = [];
        //Load the form with data taken from the array. Create objects
        importUtilities.loadForm(form, columns, rows);
        return form;
    }

    match(transactionsData) {

        Banana.Ui.showText(JSON.stringify(transactionsData));

        if (!transactionsData || transactionsData.length === 0)
            return false;

        for (let i = 0; i < transactionsData.length; i++) {
            var transaction = transactionsData[i];

            var formatMatched = false;

            if (transaction["Fecha"] && transaction["Fecha"].match(/^[0-9]+\.[0-9]+\.[0-9]+$/))
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
            if ((tr["Fecha"] && tr["Fecha"].match(/^[0-9]+\.[0-9]+\.[0-9]+$/)) && tr["Documento"]) {
                transactionsToImport.push(this.mapTransaction(tr));
            }
        }


        // Sort rows by date
        transactionsToImport = transactionsToImport.reverse();

        // Add header and return
        var header = [
            ["Date", "Description", "Expenses", "Income"]
        ];
        return header.concat(transactionsToImport);
    }

    mapTransaction(transaction) {
        var mappedLine = [];

        mappedLine.push(Banana.Converter.toInternalDateFormat(transaction["Fecha"], this.dateFormat));
        mappedLine.push(transaction["Descripción"]);
        mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["Débitos"], "."));
        mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["Créditos"], "."));

        return mappedLine;
    }
}
