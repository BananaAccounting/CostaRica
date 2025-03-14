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

//Enum to define the possible states of an invoice.
const InvoiceState = Object.freeze({
    OPEN: "Open",
    PAID: "Paid",
    PARTIALLY_PAID: "Partially paid",
    CANCELLED: "Cancelled"
});

// ****** INVOICES CLASSES ********

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
        // Use "spread" operator. Instaed of doing "csvRow[0], csvRow[1], ..." with each colum, as the order of the csv columns matches the constructor.
        return new CRVG(...csvRow);
    }

    /**
     * Static method to map a CRVG object to an Invoice object.
     */
    static mapToInvoice(invoiceData, paymentsData = []) {
        return new Invoice(
            invoiceData.issueDate,
            "10",  // Invoice by client default number in Banana.
            invoiceData.invoiceId,  // Invoice Number: Invoice document number
            this.getInvoiceState(invoiceData.status, invoiceData, paymentsData),  // Invoice State
            `Invoice ${invoiceData.invoiceId} - ${invoiceData.customerName}`, // InvoiceDescription
            invoiceData.customerId,  // Debit amount: Customer ID (Acoounts table).
            "3000",  // Credit amount,  fare un metodo per mappare i conti !!!!
            invoiceData.totalAmount,  // InvoiceAmount: Total invoice amount
            this.findVatCodeUsed(invoiceData)  // InvoiceVatCode: VAT code
        );
    }

    /**
     * Returns the invoice status based on the status indicated in the CSV file in the field "status" and
     * if the invoice is found into the CRVGM report (payments report), we double check it.
     * @param {string} status - The status from CRVG.
     * @param {CRVG} - The invoice data in format CRVG.
     * @param {CRVGM} - List of payments in the report CRVGM.
     * @returns {string} - The corresponding InvoiceState.
     */
    static getInvoiceState(status, invoiceData, paymentsData = []) {
        if (status === "Pagada" && paymentsData.some(payment =>
            String(payment.invoiceId).trim().toLowerCase() === String(invoiceData.invoiceId).trim().toLowerCase())) {
            return InvoiceState.PAID;
        } else {
            return InvoiceState.OPEN;
        }
    }



    /**
    * Retrieves the payment bank and reference number associated with this invoice.
    * @param {Array} paymentsData - List of payments from the CRVGM report (payments report).
    * @returns {Object|null} - Payment details { bank: string, reference: string, paymentDate: string } or null if not found.
    */
    static getInvoicePaymentData(invoiceID, paymentsData) {
        const payment = paymentsData.find(p => p.invoiceId === invoiceID);

        if (!payment)
            return null; // No payment found.

        return {
            bank: payment.bank || "",
            reference: payment.paymentReference || "",
            paymentDate: payment.paymentDate || ""
        };
    }

    /**
     * Static method to find the VAT code used in the invoice.
     */
    static findVatCodeUsed(invoiceData) {
        if (invoiceData.VAT13 > 0) return "13";
        if (invoiceData.VAT08 > 0) return "08";
        if (invoiceData.VAT04 > 0) return "04";
        if (invoiceData.VAT2 > 0) return "02";
        if (invoiceData.VAT1 > 0) return "01";
        if (invoiceData.VAT05 > 0) return "05";
        return "";
    }
}

// The class "CRVGM" defines the structure of customer payments from Ventas-Generales-Movimientos-de-Pago.csv.
var CRVGM = class CRVGM {
    constructor(
        paymentDate, branch, terminal, idType, customerId, customerName, invoiceIssueDate, invoiceDueDate,
        invoiceId, invoiceCurrency, invoiceExchangeRate, invoiceTotal, invoiceStatus, paymentMethod,
        paymentCurrency, amountPaid, paymentExchangeRate, equivalentAmount, bank, paymentReference,
        authorizationNumber, last4Digits, notes
    ) {
        this.paymentDate = paymentDate;
        this.branch = branch;
        this.terminal = terminal;
        this.idType = idType;
        this.customerId = customerId;
        this.customerName = customerName;
        this.invoiceIssueDate = invoiceIssueDate;
        this.invoiceDueDate = invoiceDueDate;
        this.invoiceId = invoiceId;
        this.invoiceCurrency = invoiceCurrency;
        this.invoiceExchangeRate = invoiceExchangeRate;
        this.invoiceTotal = invoiceTotal;
        this.invoiceStatus = invoiceStatus;
        this.paymentMethod = paymentMethod;
        this.paymentCurrency = paymentCurrency;
        this.amountPaid = amountPaid;
        this.paymentExchangeRate = paymentExchangeRate;
        this.equivalentAmount = equivalentAmount;
        this.bank = bank;
        this.paymentReference = paymentReference;
        this.authorizationNumber = authorizationNumber;
        this.last4Digits = last4Digits;
        this.notes = notes;
    }

    static fromCsvRow(csvRow) {
        return new CRVGM(...csvRow); // Use "spread" operator.
    }
};


// The class "CRCFEC" defines the structure of supplier invoices from Compras-FEC.csv.
var CRCFEC = class CRCFEC {
    constructor(
        issueDate, activity, idType, supplierId, supplierName, documentType, invoiceId,
        originalCurrency, exchangeRate, totalAmount, discount, taxableSubtotal,
        exemptSubtotal, subtotal, selectiveConsumptionTax, fuelTax, alcoholTax, packagedBeveragesTax,
        tobaccoTax, cementTax, otherTaxes, VATExemption, VAT1, VAT2, VAT4, VAT8, VAT13, totalVAT,
        returnedVAT, otherCharges, grandTotal
    ) {
        this.issueDate = issueDate; // Invoice issue date
        this.activity = activity; // Economic activity (receptor)
        this.idType = idType; // Supplier identification type (Cedula, NIT, etc.)
        this.supplierId = supplierId; // Supplier identification number
        this.supplierName = supplierName; // Supplier name
        this.documentType = documentType; // Document type (Factura de compra, etc.)
        this.invoiceId = invoiceId; // Invoice document number
        this.originalCurrency = originalCurrency; // Invoice currency (USD, CRC, etc.)
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
    }

    /**
     * Static method to create an instance of CRCFEC from a CRCFEC CSV row.
     * @param {Array} csvRow - An array representing a single CRCFEC CSV row.
     * @returns {CRCFEC} - An instance of CRCFEC.
     */
    static fromCsvRow(csvRow) {
        return new CRCFEC(...csvRow);
    }

    /**
    * Static method to map a CRCFEC object to an Invoice object.
    * @param {CRCFEC} invoiceData - An instance of CRCFEC.
    * @param {CRCFEC} paymentsData - A List of of CRCFECM
    * @returns {Invoice} - An instance of Invoice formatted for Banana.
    */
    static mapToInvoice(invoiceData, paymentsData = []) {
        return new Invoice(
            invoiceData.issueDate,  // InvoiceDate: Date of the invoice (YYYY-MM-DD)
            "20",  // InvoiceType: Default type for supplier invoices
            invoiceData.invoiceId,  // InvoiceNumber: Invoice document number
            this.getInvoiceState(invoiceData, paymentsData),  // InvoiceState: Open, Paid, Partially paid, Cancelled
            `Electronic Purchase Invoice ${invoiceData.invoiceId} - ${invoiceData.supplierName}`, // InvoiceDescription
            "5000",  // InvoiceDebitAccount: Default expense account (modify if needed)
            invoiceData.supplierId,  // InvoiceCreditAccount: Supplier ID (Accounts table)
            invoiceData.totalAmount,  // InvoiceAmount: Total invoice amount
            this.findVatCodeUsed(invoiceData)  // InvoiceVatCode: VAT code
        );
    }

    /**
     * Determines the invoice state for CRCFEC based on available data and payment records.
     * @param {CRCFEC} invoiceData - The full invoice object (needed for payment conditions).
     * @param {CRCFECM} paymentsData - List of all paid invoices in CRCFEC report file.
     * @returns {string} - The corresponding InvoiceState.
     */
    static getInvoiceState(invoiceData, paymentsData) {
        if (invoiceData.documentType === "Nota de crédito")
            return InvoiceState.CANCELLED;
        if (paymentsData.some(payment => payment.invoiceId === invoiceData.invoiceId))
            return InvoiceState.PAID;
        if (invoiceData.paymentCondition === "Contado")
            return InvoiceState.PAID;
        if (invoiceData.paymentCondition === "Crédito")
            return InvoiceState.OPEN;
        Banana.console.log(`Warning: Unknown invoice status for invoice ${invoiceData.invoiceId}. Defaulting to "Open".`);
        return InvoiceState.OPEN;
    }


    /**
    * Determines the appropriate VAT code based on the CRCFEC invoice data.
    * @param {CRCFEC} invoiceData - An instance of CRCFEC.
    * @returns {string} - The VAT code applicable to the invoice.
    */
    static findVatCodeUsed(invoiceData) {
        if (invoiceData.VAT13 > 0) return "VAT13";
        if (invoiceData.VAT8 > 0) return "VAT8";
        if (invoiceData.VAT4 > 0) return "VAT4";
        if (invoiceData.VAT2 > 0) return "VAT2";
        if (invoiceData.VAT1 > 0) return "VAT1";
        if (invoiceData.VATExemption > 0) return "EXEMPT";
        return "";  // Default: No VAT applied
    }
}

// The class "CRCFECM" defines the structure of supplier payments from Compras-FEC-Movimientos-de-Pago.csv.
var CRCFECM = class CRCFECM {
    constructor(
        paymentDate, economicActivity, idType, supplierId, supplierName, documentType, invoiceId,
        paymentMethod, currency, amountPaid, exchangeRate, equivalentAmount,
        bank, paymentReference, authorizationNumber, last4Digits, notes
    ) {
        this.paymentDate = paymentDate; // Date of payment
        this.economicActivity = economicActivity; // Economic activity of the receiver
        this.idType = idType; // Supplier identification type (Cedula, NIT, etc.)
        this.supplierId = supplierId; // Supplier identification number
        this.supplierName = supplierName; // Supplier name
        this.documentType = documentType; // Document type (Factura de compra, etc.)
        this.invoiceId = invoiceId; // Invoice document number
        this.paymentMethod = paymentMethod; // Payment method (Bank transfer, cash, etc.)
        this.currency = currency; // Currency of payment
        this.amountPaid = amountPaid; // Amount paid
        this.exchangeRate = exchangeRate; // Exchange rate applied
        this.equivalentAmount = equivalentAmount; // Equivalent amount in the document currency
        this.bank = bank; // Bank of the transaction
        this.paymentReference = paymentReference; // Payment reference number
        this.authorizationNumber = authorizationNumber; // Authorization number (if applicable)
        this.last4Digits = last4Digits; // Last 4 digits of the card (if applicable)
        this.notes = notes; // Additional observations
    }

    /**
     * Static method to create an instance of CRCFECM from a CSV row.
     * @param {Array} csvRow - An array representing a single CRCFECM CSV row.
     * @returns {CRCFECM} - An instance of CRCFECM.
     */
    static fromCsvRow(csvRow) {
        return new CRCFECM(...csvRow);
    }

    /**
     * Static method to extract paid invoices from a list of CRCFECM rows.
     * @param {Array} paymentsData - An array of CRCFECM instances.
     * @returns {Set} - A set of invoice IDs that are fully paid.
     */
    static getPaidInvoices(paymentsData) {
        return new Set(paymentsData.map(payment => payment.invoiceId));
    }
};


/** The class "CRCG" defines the structure of the supplier invoice object based on CRCG (Compras-Generales.csv). 
 * In the report "CRCG" we find all the generic invoices, which could be made with or without electronic support.
*/
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
        return new CRCG(...csvRow);
    }

    /**
    * Static method to map a CRCG object to an Invoice object.
    * @param {CRCG} invoiceData - An instance of CRCG.
    * @param {CRCG} paymentsData - A List of of CRCGM
    * @returns {Invoice} - An instance of Invoice formatted for Banana.
    */
    static mapToInvoice(invoiceData, paymentsData = []) {
        return new Invoice(
            invoiceData.issueDate,  // InvoiceDate: Date of the invoice (YYYY-MM-DD)
            "20",  // InvoiceType: Default type for supplier invoices in Banana.
            invoiceData.invoiceId,  // InvoiceNumber: Invoice document number.
            this.getInvoiceState(invoiceData, paymentsData),
            `Supplier Invoice ${invoiceData.invoiceId} - ${invoiceData.supplierName}`, // InvoiceDescription.
            "5000",  // InvoiceDebitAccount: Default expense account (modify if needed)
            invoiceData.supplierId,  // InvoiceCreditAccount: Supplier ID (Accounts table)
            invoiceData.totalAmount,  // InvoiceAmount: Total invoice amount.
            this.findVatCodeUsed(invoiceData)  // InvoiceVatCode: VAT code.
        );
    }

    /**
    * Maps CRCG invoice status to a valid InvoiceState in Banana.
     * @param {CRCG} invoiceData - The full invoice object (needed for payment conditions).
     * @param {CRCGM} paymentsData - List of all paid invoices in CRCGM report file.
    * @returns {string} - The corresponding InvoiceState.
    */
    static getInvoiceState(invoiceData, paymentsData) {
        if (invoiceData.documentType === "Nota de crédito")
            return InvoiceState.CANCELLED
        if (paymentsData.some(payment => payment.invoiceId === invoiceData.invoiceId))
            return InvoiceState.PAID
        if (invoiceData.paymentCondition === "Contado")
            return InvoiceState.PAID
        if (invoiceData.paymentCondition === "Crédito")
            return InvoiceState.OPEN
        if (invoiceData.paymentCondition === "Arrendamiento con Opción de Compra")
            return InvoiceState.OPEN
        Banana.console.log(`Warning: Unknown invoice status: ${invoiceData.paymentCondition}, for invoice ${invoiceData.invoiceId}. Defaulting to "Open".`)
        return InvoiceState.OPEN
    }

    /**
    * Static method to find the VAT code used in the invoice.
    */
    static findVatCodeUsed(invoiceData) {
        if (invoiceData.VAT13 > 0) return "13";
        if (invoiceData.VAT08 > 0) return "08";
        if (invoiceData.VAT04 > 0) return "04";
        if (invoiceData.VAT2 > 0) return "02";
        if (invoiceData.VAT1 > 0) return "01";
        return "";
    }

}

// The class "CRCGM" defines the structure of supplier payments from Compras-Generales-Movimientos-de-Pago.csv.
var CRCGM = class CRCGM {
    constructor(
        paymentDate, receptionDate, idType, supplierId, supplierName, documentType, invoiceId,
        paymentMethod, currency, amountPaid, exchangeRate, equivalentAmount,
        bank, paymentReference, authorizationNumber, last4Digits, notes
    ) {
        this.paymentDate = paymentDate; // Date of payment
        this.receptionDate = receptionDate; // Reception date of payment
        this.idType = idType; // Supplier identification type (Cedula, NIT, etc.)
        this.supplierId = supplierId; // Supplier identification number
        this.supplierName = supplierName; // Supplier name
        this.documentType = documentType; // Document type (Factura de compra, etc.)
        this.invoiceId = invoiceId; // Invoice document number
        this.paymentMethod = paymentMethod; // Payment method (Bank transfer, cash, etc.)
        this.currency = currency; // Currency of payment
        this.amountPaid = amountPaid; // Amount paid
        this.exchangeRate = exchangeRate; // Exchange rate applied
        this.equivalentAmount = equivalentAmount; // Equivalent amount in the document currency
        this.bank = bank; // Bank of the transaction
        this.paymentReference = paymentReference; // Payment reference number
        this.authorizationNumber = authorizationNumber; // Authorization number (if applicable)
        this.last4Digits = last4Digits; // Last 4 digits of the card (if applicable)
        this.notes = notes; // Additional observations
    }

    /**
     * Static method to create an instance of CRCGM from a CSV row.
     * @param {Array} csvRow - An array representing a single CRCGM CSV row.
     * @returns {CRCGM} - An instance of CRCGM.
     */
    static fromCsvRow(csvRow) {
        return new CRCGM(...csvRow);
    }

    /**
     * Static method to extract paid invoices from a list of CRCGM rows.
     * @param {Array} paymentsData - An array of CRCGM instances.
     * @returns {Set} - A set of invoice IDs that are fully paid.
     */
    static getPaidInvoices(paymentsData) {
        return new Set(paymentsData.map(payment => payment.invoiceId));
    }
};


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
        return new CRGSE(...csvRow);
    }
    /**
    * Static method to map a CRGSE object to an Invoice object.
    * @param {CRGSE} expenseData - An instance of CRGSE.
    * @returns {Invoice} - An instance of Invoice formatted for Banana.
    */
    static mapToInvoice(expenseData, paymentsData = []) {
        return new Invoice(
            expenseData.expenseDate,  // InvoiceDate: Date of the expense (YYYY-MM-DD)
            "20",  // InvoiceType: Default type for supplier expenses
            expenseData.expenseId,  // InvoiceNumber: Expense record number
            this.getInvoiceState(expenseData, paymentsData),
            `Non-electronic Expense ${expenseData.expenseId} - ${expenseData.supplierName}`, // InvoiceDescription
            "4000",  // InvoiceDebitAccount: Default expense account (modify if needed)
            expenseData.supplierId || "",  // InvoiceCreditAccount: Supplier ID (or default if missing)
            expenseData.totalAmount,  // InvoiceAmount: Total expense amount
            ""  // InvoiceVatCode: No VAT code by default
        );
    }
    /**
     * Determines the invoice state for CRGSE based on available data and payment records from CRGSEM.
     * @param {CRGSE} expenseData - An instance of CRGSE.
     * @param {CRGSEM} paymentsData - A list of CRGSEM instances.
     * @returns {string} - The corresponding InvoiceState.
     */
    static getInvoiceState(expenseData, paymentsData = []) {
        if (paymentsData.some(payment => payment.expenseId === expenseData.expenseId))
            return InvoiceState.PAID
        if (expenseData.status === "Activo") // Da verificare...
            return InvoiceState.OPEN
        if (expenseData.status === "Pendiente")
            return InvoiceState.OPEN
        if (expenseData.status === "Cancelado")
            return InvoiceState.CANCELLED
        Banana.console.log(`Warning: Unknown expense status for expense ${expenseData.expenseId}. Defaulting to "Open".`)
        return InvoiceState.OPEN
    }

}

// The class "CRGSEM" defines the structure of supplier payments from Gastos-sin-Soporte-Electrónico-Movimientos-de-Pago.csv.
var CRGSEM = class CRGSEM {
    constructor(
        recordDate, updateDate, idType, supplierId, supplierName, expenseId, expenseDate, currency,
        amountPaid, paymentType, paymentCode, paymentDescription
    ) {
        this.recordDate = recordDate;
        this.updateDate = updateDate;
        this.idType = idType;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.expenseId = expenseId;
        this.expenseDate = expenseDate;
        this.currency = currency;
        this.amountPaid = amountPaid;
        this.paymentType = paymentType;
        this.paymentCode = paymentCode;
        this.paymentDescription = paymentDescription;
    }

    static fromCsvRow(csvRow) {
        return new CRGSEM(...csvRow);
    }
};


// The class "Invoice" defines the structure of the invoice to be imported into Banana. Follow the columns used in Banana to record an invoice.
var Invoice = class Invoice {
    constructor(
        invoiceDate, invoiceType, invoiceNumber, invoiceState, invoiceDescription, invoiceDebitAccount, invoiceCreditAccount,
        invoiceAmount, invoiceVatCode
    ) {
        this.invoiceDate = invoiceDate; // Invoice date (YYYY-MM-DD)
        this.invoiceType = invoiceType; // Invoice type (Invoice, Credit Note, etc.)
        this.invoiceNumber = invoiceNumber; // Invoice number
        this.invoiceState = invoiceState; // Invoice states: Open, Paid, Partially paid, Cancelled.
        this.invoiceDescription = invoiceDescription; // Invoice description
        this.invoiceDebitAccount = invoiceDebitAccount; // Debit account
        this.invoiceCreditAccount = invoiceCreditAccount; // Credit account
        this.invoiceAmount = invoiceAmount; // Invoice amount
        this.invoiceVatCode = invoiceVatCode; // VAT code
    }
}
