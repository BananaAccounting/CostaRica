## To define:

- Le fatture presenti nel report CRCFEC (Fatture elettroniche di aquisto), possono trovarsi anche nel report CRCG (Vendite generali) ? Negli esempi di test
- si tratta di fatture differenti in quanto la tipologia di documento è differente (Factura de compra / Factura), quindi attualmente li gestisco separatamente.
- I campi "Condición de venta", valgono come controllo per capire se una fattura è gia stata pagata (Tipo quando il pagamento è a contanti), vedi contenuto CRCG.
- È possibile che ci siano delle fatture pagata (nei file pago) ma che non ci siano le fatture nei file generali ? In tal caso possiamo mostrare un warning indicando che abbiamo trovato il pagamento per una fattura che non risulta nel file generale
## Notes
- Test files has been converted from excel to csv using the type "CSV UTF-8 (Comma delimited) (*.csv)".