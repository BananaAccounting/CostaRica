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
            "10",  // Invoice by client default number in Banana.
            invoiceData.invoiceId,  // Invoice Number: Invoice document number
            this.setInvoiceState(invoiceData.status),  // Invoice State
            `Invoice ${invoiceData.invoiceId} - ${invoiceData.customerName}`, // InvoiceDescription
            invoiceData.customerId,  // Debit amount: Customer ID (Acoounts table).
            "3000",  // Credit amount,  fare un metodo per mappare i conti !!!!
            invoiceData.totalAmount,  // InvoiceAmount: Total invoice amount
            this.findVatCodeUsed(invoiceData)  // InvoiceVatCode: VAT code
        );
    }

    /**
     * Returns the invoice status based on the status indicated in the CSV file in the field "status".
     * @param {string} status - The status from CRVG.
     * @returns {string} - The corresponding InvoiceState.
     */
    static setInvoiceState(status) {
        switch (status) {
            case "Pagada":
                return InvoiceState.PAID;  // "Paid"
            default:
                return InvoiceState.OPEN; // Default: "Open"
        }
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
        return new CRCFEC(
            csvRow[0], csvRow[1], csvRow[2], csvRow[3], csvRow[4], csvRow[5], csvRow[6],
            csvRow[7], csvRow[8], csvRow[9], csvRow[10], csvRow[11], csvRow[12], csvRow[13],
            csvRow[14], csvRow[15], csvRow[16], csvRow[17], csvRow[18], csvRow[19], csvRow[20],
            csvRow[21], csvRow[22], csvRow[23], csvRow[24], csvRow[25], csvRow[26], csvRow[27],
            csvRow[28], csvRow[29], csvRow[30]
        );
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
            this.setInvoiceState(invoiceData, paymentsData),  // InvoiceState: Open, Paid, Partially paid, Cancelled
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
    static setInvoiceState(invoiceData, paymentsData) {
        switch (true) {
            case invoiceData.documentType === "Nota de crédito":
                return InvoiceState.CANCELLED;
            case paymentsData.some(payment => payment.invoiceId === invoiceData.invoiceId):  // Se l'invoiceId è in CRCFECM, è pagata.
                return InvoiceState.PAID;
            case invoiceData.paymentCondition === "Contado":
                return InvoiceState.PAID;
            case invoiceData.paymentCondition === "Crédito":
                return InvoiceState.OPEN;
            default:
                Banana.console.log(`Warning: Unknown invoice status for invoice ${invoiceId}. Defaulting to "Open".`);
                return InvoiceState.OPEN;
        }
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
        return new CRCFECM(
            csvRow[0],  // Payment Date
            csvRow[1],  // Economic Activity
            csvRow[2],  // ID Type
            csvRow[3],  // Supplier ID
            csvRow[4],  // Supplier Name
            csvRow[5],  // Document Type
            csvRow[6],  // Invoice ID
            csvRow[7],  // Payment Method
            csvRow[8],  // Currency
            csvRow[9],  // Amount Paid
            csvRow[10], // Exchange Rate
            csvRow[11], // Equivalent Amount
            csvRow[12], // Bank
            csvRow[13], // Payment Reference
            csvRow[14], // Authorization Number
            csvRow[15], // Last 4 Digits
            csvRow[16]  // Notes
        );
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
        return new CRCG(
            csvRow[0], csvRow[1], csvRow[2], csvRow[3], csvRow[4], csvRow[5], csvRow[6],
            csvRow[7], csvRow[8], csvRow[9], csvRow[10], csvRow[11], csvRow[12], csvRow[13],
            csvRow[14], csvRow[15], csvRow[16], csvRow[17], csvRow[18], csvRow[19], csvRow[20],
            csvRow[21], csvRow[22], csvRow[23], csvRow[24], csvRow[25], csvRow[26], csvRow[27],
            csvRow[28], csvRow[29], csvRow[30], csvRow[31], csvRow[32], csvRow[33], csvRow[34],
            csvRow[35], csvRow[36]
        );
    }

    /**
    * Static method to map a CRCG object to an Invoice object.
    * @param {CRCG} invoiceData - An instance of CRCG.
    * @returns {Invoice} - An instance of Invoice formatted for Banana.
    */
    static mapToInvoice(invoiceData) {
        return new Invoice(
            invoiceData.issueDate,  // InvoiceDate: Date of the invoice (YYYY-MM-DD)
            "20",  // InvoiceType: Default type for supplier invoices in Banana.
            invoiceData.invoiceId,  // InvoiceNumber: Invoice document number.
            this.setInvoiceState(invoiceData.status),
            `Supplier Invoice ${invoiceData.invoiceId} - ${invoiceData.supplierName}`, // InvoiceDescription.
            "5000",  // InvoiceDebitAccount: Default expense account (modify if needed)
            invoiceData.supplierId,  // InvoiceCreditAccount: Supplier ID (Accounts table)
            invoiceData.totalAmount,  // InvoiceAmount: Total invoice amount.
            this.findVatCodeUsed(invoiceData)  // InvoiceVatCode: VAT code.
        );
    }

    /**
    * Maps CRCG invoice status to a valid InvoiceState in Banana.
    * @param {string} saleCondition - The sale condition from CRCG ("Contado", "Crédito", "Arrendamiento con Opción de Compra").
    * @param {string} receptionMessage - The reception message (if available).
    * @returns {string} - The corresponding InvoiceState.
    */
    static setInvoiceState(saleCondition) {
        switch (saleCondition) {
            case "Contado":
                return InvoiceState.PAID;  // Paid
            case "Crédito":
                return InvoiceState.OPEN;  // Open (Credit)
            case "Arrendamiento con Opción de Compra":
                return InvoiceState.OPEN;  // Leasing is considered Open until fully paid
            default:
                return InvoiceState.OPEN;
        }
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
        return new CRCGM(
            csvRow[0],  // Payment Date
            csvRow[1],  // Reception Date
            csvRow[2],  // ID Type
            csvRow[3],  // Supplier ID
            csvRow[4],  // Supplier Name
            csvRow[5],  // Document Type
            csvRow[6],  // Invoice ID
            csvRow[7],  // Payment Method
            csvRow[8],  // Currency
            csvRow[9],  // Amount Paid
            csvRow[10], // Exchange Rate
            csvRow[11], // Equivalent Amount
            csvRow[12], // Bank
            csvRow[13], // Payment Reference
            csvRow[14], // Authorization Number
            csvRow[15], // Last 4 Digits
            csvRow[16]  // Notes
        );
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
        return new CRGSE(
            csvRow[0], csvRow[1], csvRow[2], csvRow[3], csvRow[4],
            csvRow[5], csvRow[6], csvRow[7], csvRow[8], csvRow[9],
            csvRow[10], csvRow[11]
        );
    }
    /**
    * Static method to map a CRGSE object to an Invoice object.
    * @param {CRGSE} expenseData - An instance of CRGSE.
    * @returns {Invoice} - An instance of Invoice formatted for Banana.
    */
    static mapToInvoice(expenseData) {
        return new Invoice(
            expenseData.expenseDate,  // InvoiceDate: Date of the expense (YYYY-MM-DD)
            "20",  // InvoiceType: Default type for supplier expenses
            expenseData.expenseId,  // InvoiceNumber: Expense record number
            this.setInvoiceState(),
            `Non-electronic Expense ${expenseData.expenseId} - ${expenseData.supplierName}`, // InvoiceDescription
            "4000",  // InvoiceDebitAccount: Default expense account (modify if needed)
            expenseData.supplierId || "",  // InvoiceCreditAccount: Supplier ID (or default if missing)
            expenseData.totalAmount,  // InvoiceAmount: Total expense amount
            ""  // InvoiceVatCode: No VAT code by default
        );
    }
    static setInvoiceState() {
        //....
    }
}

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





