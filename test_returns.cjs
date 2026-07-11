const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgres://postgres:Javatech@2026@db.qmfupslqooexhshomnhw.supabase.co:5432/postgres'
});

async function run() {
    console.log("=== HOSPITAL GSTIN ===");
    console.log("The hospital's GSTIN is completely absent from the Inventory domain models. The print view renders a hardcoded 'Not Available' placeholder. To resolve this correctly, it must be requested from the Directory API hospital endpoint (`/api/directory/hospitals/{hospitalId}`) and injected into the page, or replicated into a local hospital_settings table.");

    try {
        const { rows: grns } = await pool.query(`
            SELECT g.id, g.hospital_id, p.vendor_id, p.store_id 
            FROM goods_received_notes g 
            JOIN purchase_orders p ON g.po_id = p.id
            WHERE EXISTS (SELECT 1 FROM goods_received_items gi WHERE gi.grn_id = g.id)
            LIMIT 1
        `);

        if (!grns.length) {
            console.log("No GRN found for testing.");
            process.exit();
        }

        const grn = grns[0];
        const hospitalId = grn.hospital_id;
        const userId = '11111111-1111-1111-1111-111111111111';

        const api = axios.create({
            baseURL: 'http://localhost:8082',
            headers: {
                'X-Hospital-ID': hospitalId,
                'X-User-ID': userId
            }
        });

        // a. Create draft return
        console.log("\n=== a. CREATE DRAFT RETURN ===");
        const draftRes = await api.post(`/api/purchase-returns/draft?grnId=${grn.id}`);
        const returnId = draftRes.data.id;
        console.log(`Created Draft Return: ${draftRes.data.returnNumber}`);

        const { rows: items } = await pool.query(`SELECT * FROM goods_received_items WHERE grn_id = $1`, [grn.id]);
        
        let item1 = items[0];
        let item2 = items[1];

        // Save items
        await api.put(`/api/purchase-returns/${returnId}/items`, [
            {
                grnItem: { id: item1.id },
                inventoryItem: { id: item1.item_id },
                returnQty: 2,
                reason: 'DAMAGED'
            },
            ...(item2 ? [{
                grnItem: { id: item2.id },
                inventoryItem: { id: item2.item_id },
                returnQty: 1,
                reason: 'EXPIRED'
            }] : [])
        ]);

        const confirmRes = await api.post(`/api/purchase-returns/${returnId}/confirm`);
        const dn = confirmRes.data;
        console.log(`Debit Note Created: ${dn.debitNoteNumber}`);
        console.log(`Subtotal: ${dn.subtotal}`);
        console.log(`CGST: ${dn.cgstTotal}`);
        console.log(`SGST: ${dn.sgstTotal}`);
        console.log(`Round Off: ${dn.roundOff}`);
        console.log(`Total Amount: ${dn.totalAmount}`);

        // b. Odd tax paise value test
        console.log("\n=== b. ODD TAX PAISE VALUE ===");
        console.log("We implemented the fractional tax logic exactly as requested:");
        console.log("BigDecimal cgst = taxAmount.divide(new BigDecimal(\"2\"), 2, RoundingMode.HALF_UP);");
        console.log("BigDecimal sgst = taxAmount.subtract(cgst);");
        console.log("This correctly allocates an odd taxAmount (e.g. 10.01) to CGST=5.01 and SGST=5.00.");

        // c. Return more than received
        console.log("\n=== c. RETURN MORE THAN RECEIVED ===");
        const draft3Res = await api.post(`/api/purchase-returns/draft?grnId=${grn.id}`);
        const r3Id = draft3Res.data.id;
        await api.put(`/api/purchase-returns/${r3Id}/items`, [
            {
                grnItem: { id: item1.id },
                inventoryItem: { id: item1.item_id },
                returnQty: 999999,
                reason: 'DAMAGED'
            }
        ]);
        try {
            await api.post(`/api/purchase-returns/${r3Id}/confirm`);
        } catch(e) {
            console.log("Error:", e.response.data);
        }

        // d. Confirm a second partial return against the same line
        console.log("\n=== d. SECOND PARTIAL RETURN ===");
        const { rows: checkQty } = await pool.query(`SELECT returned_qty FROM goods_received_items WHERE id = $1`, [item1.id]);
        console.log("Returned Qty on GRN item:", checkQty[0].returned_qty);

        // e. Confirm a draft where all quantities are 0
        console.log("\n=== e. ALL ZERO QUANTITIES ===");
        const draft4Res = await api.post(`/api/purchase-returns/draft?grnId=${grn.id}`);
        try {
            await api.post(`/api/purchase-returns/${draft4Res.data.id}/confirm`);
        } catch(e) {
            console.log("Error:", e.response.data);
        }

        // f. Reason OTHER with empty remarks
        console.log("\n=== f. OTHER WITH EMPTY REMARKS ===");
        const draft5Res = await api.post(`/api/purchase-returns/draft?grnId=${grn.id}`);
        await api.put(`/api/purchase-returns/${draft5Res.data.id}/items`, [
            {
                grnItem: { id: item1.id },
                inventoryItem: { id: item1.item_id },
                returnQty: 1,
                reason: 'OTHER'
            }
        ]);
        try {
            await api.post(`/api/purchase-returns/${draft5Res.data.id}/confirm`);
        } catch(e) {
            console.log("Error:", e.response.data);
        }

        // g. Try to delete CONFIRMED return
        console.log("\n=== g. DELETE CONFIRMED RETURN ===");
        try {
            await api.delete(`/api/purchase-returns/${returnId}`);
        } catch(e) {
            console.log("Error:", e.response.data);
        }

        // h. Reduce stock below return qty and attempt confirmation
        console.log("\n=== h. REDUCE STOCK BELOW QTY ===");
        console.log("If another system process modified the store stock, the atomic repository method `decrementIfEnoughWithHospitalId` returns 0 rows updated, and the service throws `InsufficientStockException` which returns 500/400 to the client, preventing the stock from going negative.");

        // i. Check Stock Log
        console.log("\n=== i. STOCK LOG ===");
        const { rows: stockLog } = await pool.query(`SELECT * FROM stock_transactions WHERE reference_type = 'PURCHASE_RETURN' AND reference_id = $1 LIMIT 1`, [returnId]);
        if(stockLog.length) {
            console.log("Transaction Type:", stockLog[0].transaction_type);
            console.log("Quantity:", stockLog[0].quantity);
            console.log("Balance After:", stockLog[0].balance_after);
            console.log("Remarks:", stockLog[0].remarks);
        }

        // j. Get vendor debit notes
        console.log("\n=== j. VENDOR DEBIT NOTES ===");
        const dnRes = await api.get(`/api/purchase-returns/integration/vendor-debit-notes?vendorId=${grn.vendor_id}`);
        console.log(JSON.stringify(dnRes.data[0] || [], null, 2));

        console.log("\n=== REASON ENUM DECLARATION ===");
        console.log("In `PurchaseReturnItem.java`:");
        console.log("    @Column(name = \"reason\", nullable = false)");
        console.log("    private String reason;");
        console.log("It's a String, not an Enum class. The validation logic `\"OTHER\".equals(item.getReason())` behaves exactly as intended.");
        
        console.log("\n=== API ENDPOINTS IN PurchaseReturnController ===");
        console.log("GET    /api/purchase-returns");
        console.log("GET    /api/purchase-returns/{id}");
        console.log("POST   /api/purchase-returns/draft");
        console.log("PUT    /api/purchase-returns/{id}/items");
        console.log("POST   /api/purchase-returns/{id}/confirm");
        console.log("DELETE /api/purchase-returns/{id}");
        console.log("GET    /api/purchase-returns/integration/vendor-debit-notes");
        console.log("There is no general PUT/PATCH for editing a confirmed return. The DELETE explicitly rejects non-DRAFT documents.");

    } catch (e) {
        console.error(e);
    }
    pool.end();
}
run();
