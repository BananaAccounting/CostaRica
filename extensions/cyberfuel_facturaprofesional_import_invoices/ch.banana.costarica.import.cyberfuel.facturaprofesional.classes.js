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

// The class "CRVG" defines the structure of the customer invoice object based on Ventas-Generales.csv.
var CRVG = class CRVG {
    constructor(
        issueDate, branch, terminal, economicActivity, commercialGroup, idType, customerId, customerName,
        documentType, invoiceId, paymentCondition, status, cardAuthNumber, cardLast4Digits,
        originalCurrency, exchangeRate, totalAmount, discount, taxableSubtotal, exemptSubtotal, subtotal,
        selectiveConsumptionTax, fuelTax, alcoholTax, packagedBeveragesTax, tobaccoTax, cementTax,
        otherTaxes, exemptionAmount, VAT05, VAT1, VAT2, VAT4, VAT8, VAT13, totalVAT,
        returnedVAT, otherCharges, grandTotal
    ) {
        this.issueDate = issueDate; // Invoice issue date
        this.branch = branch; // Branch where the sale was recorded
        this.terminal = terminal; // Terminal where the transaction was processed
        this.economicActivity = economicActivity; // Economic activity related to the sale
        this.commercialGroup = commercialGroup; // Commercial group classification
        this.idType = idType; // Customer identification type (Cedula, NIT, etc.)
        this.customerId = customerId; // Customer identification number
        this.customerName = customerName; // Customer name
        this.documentType = documentType; // Document type (Invoice, Credit Note, etc.)
        this.invoiceId = invoiceId; // Invoice document number
        this.paymentCondition = paymentCondition; // Payment terms (Credit, Cash, etc.)
        this.status = status; // Invoice status (Paid, Pending, Canceled)
        this.cardAuthNumber = cardAuthNumber; // Card authorization number
        this.cardLast4Digits = cardLast4Digits; // Last 4 digits of the card
        this.originalCurrency = originalCurrency; // Invoice currency (USD, CRC, etc.)
        this.exchangeRate = exchangeRate; // Exchange rate applied
        this.totalAmount = totalAmount; // Total amount of the invoice
        this.discount = discount; // Applied discount amount
        this.taxableSubtotal = taxableSubtotal; // Taxable subtotal amount
        this.exemptSubtotal = exemptSubtotal; // Exempt subtotal amount
        this.subtotal = subtotal; // Subtotal (taxable + exempt)
        this.selectiveConsumptionTax = selectiveConsumptionTax; // Selective consumption tax
        this.fuelTax = fuelTax; // Unique fuel tax
        this.alcoholTax = alcoholTax; // Specific alcohol tax
        this.packagedBeveragesTax = packagedBeveragesTax; // Specific packaged beverages tax
        this.tobaccoTax = tobaccoTax; // Tobacco tax
        this.cementTax = cementTax; // Specific cement tax
        this.otherTaxes = otherTaxes; // Other applicable taxes
        this.exemptionAmount = exemptionAmount; // Exempted tax amount
        this.VAT05 = VAT05; // VAT 0.5%
        this.VAT1 = VAT1; // VAT 1%
        this.VAT2 = VAT2; // VAT 2%
        this.VAT4 = VAT4; // VAT 4%
        this.VAT8 = VAT8; // VAT 8%
        this.VAT13 = VAT13; // VAT 13%
        this.totalVAT = totalVAT; // Total VAT amount
        this.returnedVAT = returnedVAT; // Refunded VAT amount
        this.otherCharges = otherCharges; // Additional charges
        this.grandTotal = grandTotal; // Final total amount to be paid
    }

    /**
     * Static method to create an instance of CRVG from a Ventas-Generales CSV row.
     * @param {Array} csvRow - An array representing a single Ventas-Generales CSV row.
     * @returns {CRVG} - An instance of CRVG.
     */
    static fromCsvRow(csvRow) {
        return new CRVG(
            csvRow[0], csvRow[1], csvRow[2], csvRow[3], csvRow[4], csvRow[5], csvRow[6],
            csvRow[7], csvRow[8], csvRow[9], csvRow[10], csvRow[11], csvRow[12], csvRow[13],
            csvRow[14], csvRow[15], csvRow[16], csvRow[17], csvRow[18], csvRow[19], csvRow[20],
            csvRow[21], csvRow[22], csvRow[23], csvRow[24], csvRow[25], csvRow[26], csvRow[27],
            csvRow[28], csvRow[29], csvRow[30], csvRow[31], csvRow[32], csvRow[33], csvRow[34],
            csvRow[35], csvRow[36], csvRow[37]
        );
    }

    /**
     * Static method to map a CRVG object to an Invoice object.
     */
    static mapToInvoice(invoiceData) {
        return new Invoice(
            invoiceData.issueDate,
            "10",  // Invoice by client
            invoiceData.invoiceId,  // InvoiceNumber: Invoice document number
            `Invoice ${invoiceData.invoiceId} - ${invoiceData.customerName}`, // InvoiceDescription
            "4000",  // fare un metodo per mappare i conti.
            invoiceData.customerId,  // InvoiceCreditAccount: Customer ID (Contacts table)
            invoiceData.totalAmount,  // InvoiceAmount: Total invoice amount
            findVatCodeUsed(invoiceData)  // InvoiceVatCode: VAT code
        );
    }
}

// The class "CRCG" defines the structure of the supplier invoice object based on CRCG (Compras-Generales.csv).
var CRCG = class CRCG {
    constructor(
        issueDate, receptionDate, idType, supplierId, supplierName, documentType, invoiceId,
        paymentCondition, originalCurrency, exchangeRate, totalAmount, discount, taxableSubtotal,
        exemptSubtotal, subtotal, selectiveConsumptionTax, fuelTax, alcoholTax, packagedBeveragesTax,
        tobaccoTax, cementTax, otherTaxes, VATExemption, VAT1, VAT2, VAT4, VAT8, VAT13, totalVAT,
        returnedVAT, otherCharges, grandTotal, taxCondition, economicActivity, creditedTax,
        applicableExpense, costCenter, receptionMessage
    ) {
        this.issueDate = issueDate; // Invoice issue date
        this.receptionDate = receptionDate; // Invoice reception date
        this.idType = idType; // Supplier identification type (Cedula, NIT, etc.)
        this.supplierId = supplierId; // Supplier identification number
        this.supplierName = supplierName; // Supplier name
        this.documentType = documentType; // Document type (Invoice, Receipt, etc.)
        this.invoiceId = invoiceId; // Invoice document number
        this.paymentCondition = paymentCondition; // Payment terms (Credit, Cash, etc.)
        this.originalCurrency = originalCurrency; // Original currency (USD, CRC, etc.)
        this.exchangeRate = exchangeRate; // Exchange rate applied
        this.totalAmount = totalAmount; // Total invoice amount
        this.discount = discount; // Applied discount amount
        this.taxableSubtotal = taxableSubtotal; // Taxable subtotal amount
        this.exemptSubtotal = exemptSubtotal; // Exempt subtotal amount
        this.subtotal = subtotal; // Subtotal (taxable + exempt)
        this.selectiveConsumptionTax = selectiveConsumptionTax; // Selective consumption tax
        this.fuelTax = fuelTax; // Unique fuel tax
        this.alcoholTax = alcoholTax; // Specific alcohol tax
        this.packagedBeveragesTax = packagedBeveragesTax; // Specific packaged beverages tax
        this.tobaccoTax = tobaccoTax; // Tobacco tax
        this.cementTax = cementTax; // Specific cement tax
        this.otherTaxes = otherTaxes; // Other applicable taxes
        this.VATExemption = VATExemption; // VAT exemption amount
        this.VAT1 = VAT1; // VAT 1%
        this.VAT2 = VAT2; // VAT 2%
        this.VAT4 = VAT4; // VAT 4%
        this.VAT8 = VAT8; // VAT 8%
        this.VAT13 = VAT13; // VAT 13%
        this.totalVAT = totalVAT; // Total VAT amount
        this.returnedVAT = returnedVAT; // Refunded VAT amount
        this.otherCharges = otherCharges; // Additional charges
        this.grandTotal = grandTotal; // Final total amount to be paid
        this.taxCondition = taxCondition; // Tax condition
        this.economicActivity = economicActivity; // Economic activity related to the expense
        this.creditedTax = creditedTax; // Tax credited
        this.applicableExpense = applicableExpense; // Applicable expense category
        this.costCenter = costCenter; // Cost center associated with the invoice
        this.receptionMessage = receptionMessage; // Reception message (validation message)
    }

    /**
     * Static method to create an instance of CRCG from a CRCG CSV row.
     * @param {Array} csvRow - An array representing a single CRCG CSV row.
     * @returns {CRCG} - An instance of CRCG.
     */
    static fromCsvRow(csvRow) {
        return new CRCG(
            csvRow[0], csvRow[1], csvRow[2], csvRow[3], csvRow[4], csvRow[5], csvRow[6],
            csvRow[7], csvRow[8], csvRow[9], csvRow[10], csvRow[11], csvRow[12], csvRow[13],
            csvRow[14], csvRow[15], csvRow[16], csvRow[17], csvRow[18], csvRow[19], csvRow[20],
            csvRow[21], csvRow[22], csvRow[23], csvRow[24], csvRow[25], csvRow[26], csvRow[27],
            csvRow[28], csvRow[29], csvRow[30], csvRow[31], csvRow[32], csvRow[33], csvRow[34],
            csvRow[35], csvRow[36]
        );
    }
}

// The class "CRGSE" defines the structure of non-electronic expense records from CSGE.
var CRGSE = class CRGSE {
    constructor(
        recordDate, updateDate, idType, supplierId, supplierName, expenseId, expenseDate,
        description, status, currency, exchangeRate, totalAmount
    ) {
        this.recordDate = recordDate; // Record registration date
        this.updateDate = updateDate; // Last update date
        this.idType = idType; // Identification type (No ID, Cedula, etc.)
        this.supplierId = supplierId; // Beneficiary identification number
        this.supplierName = supplierName; // Beneficiary name
        this.expenseId = expenseId; // Expense record number
        this.expenseDate = expenseDate; // Expense transaction date
        this.description = description; // Expense description
        this.status = status; // Expense status (Active, Pending, etc.)
        this.currency = currency; // Currency (CRC, USD, etc.)
        this.exchangeRate = exchangeRate; // Exchange rate (CRC)
        this.totalAmount = totalAmount; // Total expense amount        
    }

    /**
     * Static method to create an instance of CRGSE from a CSGE CSV row.
     * @param {Array} csvRow - An array representing a single expense record from CSGE.
     * @returns {CRGSE} - An instance of CRGSE.
     */
    static fromCsvRow(csvRow) {
        return new CRGSE(
            csvRow[0], csvRow[1], csvRow[2], csvRow[3], csvRow[4],
            csvRow[5], csvRow[6], csvRow[7], csvRow[8], csvRow[9],
            csvRow[10], csvRow[11]
        );
    }
}

// The class "Invoice" defines the structure of the invoice to be imported into Banana. Follow the columns used in Banana to record an invoice.
var Invoice = class Invoice {
    constructor(
        invoiceDate, invoiceType, invoiceNumber, invoiceDescription, invoiceDebitAccount, invoiceCreditAccount,
        invoiceAmount, invoiceVatCode
    ) {
        this.invoiceDate = invoiceDate; // Invoice date (YYYY-MM-DD)
        this.invoiceType = invoiceType; // Invoice type (Invoice, Credit Note, etc.)
        this.invoiceNumber = invoiceNumber; // Invoice number
        this.invoiceDescription = invoiceDescription; // Invoice description
        this.invoiceDebitAccount = invoiceDebitAccount; // Debit account
        this.invoiceCreditAccount = invoiceCreditAccount; // Credit account
        this.invoiceAmount = invoiceAmount; // Invoice amount
        this.invoiceVatCode = invoiceVatCode; // VAT code
    }
}





