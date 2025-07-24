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
// @pubdate = 2025-05-10
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.costarica.import.statement.bancocredomat.test>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.costarica.import.statement.bancocredomat.sbaa/import.utilities.js
// @includejs = ../ch.banana.costarica.import.statement.bancocredomat.sbaa/ch.banana.costarica.import.statement.bancocredomat.js
// @timeout = -1

// Register test case to be executed
Test.registerTestCase(new TestImportBancoCredomat);

// Here we define the class, the name of the class is not important
function TestImportBancoCredomat() {
}

// This method will be called at the beginning of the test case
TestImportBancoCredomat.prototype.initTestCase = function () {
   this.testLogger = Test.logger;
   this.progressBar = Banana.application.progressBar;
}

// This method will be called at the end of the test case
TestImportBancoCredomat.prototype.cleanupTestCase = function () {

}

// This method will be called before every test method is executed
TestImportBancoCredomat.prototype.init = function () {

}

// This method will be called after every test method is executed
TestImportBancoCredomat.prototype.cleanup = function () {

}

TestImportBancoCredomat.prototype.testImport = function () {
   var fileNameList = [];

   fileNameList.push("file:script/../test/testcases/csv_banco_credomat_example_format1_CRC_20250508.csv");
   fileNameList.push("file:script/../test/testcases/csv_banco_credomat_example_format1_USD_20250508.csv");
   fileNameList.push("file:script/../test/testcases/csv_banco_credomat_example_from_excel_format1_20250508.csv");

   var parentLogger = this.testLogger;
   this.progressBar.start(fileNameList.length);

   for (var i = 0; i < fileNameList.length; i++) {
      var fileName = fileNameList[i];
      this.testLogger = parentLogger.newLogger(Banana.IO.fileCompleteBaseName(fileName));

      var file = Banana.IO.getLocalFile(fileName);
      Test.assert(file);
      var fileContent = file.read();
      Test.assert(fileContent);
      var transactions = exec(fileContent, true); //takes the exec from the import script.
      this.testLogger.addCsv('', transactions);

      if (!this.progressBar.step())
         break;
   }

   this.progressBar.finish();
}