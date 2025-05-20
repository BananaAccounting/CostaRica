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
// @id = ch.banana.costarica.import.statement.bancocredomat
// @api = 1.0
// @pubdate = 2025-05-20
// @publisher = Banana.ch SA
// @description = Banco Credomat - Import account statement (*.xls/*.xlsx)
// @description.en = Banco Credomat - Import account statement (*.xls/*.xlsx)
// @description.es = Banco Credomat - Importar estado de cuenta (*.xls/*.xlsx)
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

    // Credomatic Bank statement format 1
    let credomaticBankStatement1 = new CredomaticBankStatementFormat1()
    let formB1 = credomaticBankStatement1.getFormattedData(inData, importUtilities);
    if (credomaticBankStatement1.match(formB1))
        return Banana.Converter.arrayToTsv(credomaticBankStatement1.convertCsvToIntermediaryData(formB1));


    importUtilities.getUnknownFormatError();
    return "";
}

var CredomaticBankStatementFormat1 = class CredomaticBankStatementFormat1 {
    constructor() {
        this.dateFormat = "dd.mm.yyyy";
        this.headerLineStart = 13;
        this.dataLineStart = 15;
    }



    getFormattedData(inData, importUtilities) {
        var header = String(inData[0]);
        let separator = '';
        if (header.indexOf('\t') >= 0) {
            separator = '\t';
        }
        else {
            separator = ',';
        }

        let transactions = Banana.Converter.csvToArray(inData, separator, '');
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

            if (transaction["Fecha"] && transaction["Fecha"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/))
                formatMatched = true;
            else
                formatMatched = false;

            if (formatMatched && transaction["Referencia"])
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
            if ((tr["Fecha"] && tr["Fecha"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/)) && tr["Referencia"]) {
                transactionsToImport.push(this.mapTransaction(tr));
            }
        }
        // Sort rows by date
        //transactionsToImport = transactionsToImport.reverse();

        // Add header and return
        var header = [["Date", "Description", "ExternalReference", "Income", "Expenses"]];
        return header.concat(transactionsToImport);
    }

    mapTransaction(transaction) {
        var mappedLine = [];
        mappedLine.push(Banana.Converter.toInternalDateFormat(transaction["Fecha"], this.dateFormat));
        mappedLine.push(transaction["Descripción"]);
        mappedLine.push(transaction["Referencia"]);
        mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction['Créditos'], "."));
        mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction['Débitos'], "."));

        return mappedLine;
    }

    getDescription(transaction) {
        const description = transaction["Descripción"];
        let completeDescription = description;
        return completeDescription;
    }
}
