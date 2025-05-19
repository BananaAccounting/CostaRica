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
// @id = ch.banana.costarica.import.statement.bncr
// @api = 1.0
// @pubdate = 2025-05-19
// @publisher = Banana.ch SA
// @description = Banco Nacional de Costa Rica - Import account statement (*.csv)
// @description.en = Banco Nacional de Costa Rica - Import account statement (*.csv)
// @description.es = Banco Nacional de Costa Rica - Importar estado de cuenta (*.csv)
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

  // Banco Nacional de Costa Rica statement format 1
  let bncrBankStatement1 = new BNCRBankStatementFormat1();
  let formB1 = bncrBankStatement1.getFormattedData( inData, importUtilities);

  if (bncrBankStatement1.match(formB1))
    return Banana.Converter.arrayToTsv(
        bncrBankStatement1.convertCsvToIntermediaryData(formB1)
    );

  importUtilities.getUnknownFormatError();
  return "";
}

var BNCRBankStatementFormat1 = class BNCRBankStatementFormat1 {
  constructor() {
    this.dateFormat = "dd.mm.yyyy";
    this.headerLineStart = 0;
    this.dataLineStart = 1;
  }

  getFormattedData(inData, importUtilities) {
    let transactions = Banana.Converter.csvToArray(inData, ";", "");
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

      if (
        transaction["fechaMovimiento"] &&
        transaction["fechaMovimiento"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/)
      )
        formatMatched = true;
      else 
        formatMatched = false;

      if (formatMatched && transaction["numeroDocumento"]) 
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
      if (
        tr["fechaMovimiento"] &&
        tr["fechaMovimiento"].match(/^[0-9]+\/[0-9]+\/[0-9]+$/) &&
        tr["numeroDocumento"]
      ) {
        transactionsToImport.push(this.mapTransaction(tr));
      }
    }

    // Add header and return
    var header = [
      ["Date", "Description", "ExternalReference", "Income", "Expenses"],
    ];
    return header.concat(transactionsToImport);
  }

  mapTransaction(transaction) {
    var mappedLine = [];
    mappedLine.push(Banana.Converter.toInternalDateFormat(transaction["fechaMovimiento"], this.dateFormat));
    mappedLine.push(transaction["descripcion"]);
    mappedLine.push(transaction["numeroDocumento"]);

    mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["credito"], "."));
    mappedLine.push(Banana.Converter.toInternalNumberFormat(transaction["debito"], "."));

    return mappedLine;
  }
};
