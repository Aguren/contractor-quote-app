// Calculator Module for Estimating Totals, Markup, and Sales Tax
window.Calculator = {
  calculateTotals: function(lineItems, markupPct, taxPct) {
    let matSub = 0;
    let laborSub = 0;

    const parsedMarkupPct = parseFloat(markupPct) || 0;
    const parsedTaxPct = parseFloat(taxPct) || 0;

    (lineItems || []).forEach(item => {
      const qty = parseFloat(item.qty) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const total = qty * unitPrice;

      if (item.type === 'Material') {
        matSub += total;
      } else {
        laborSub += total;
      }
    });

    // Material markup calculation
    const markupVal = matSub * (parsedMarkupPct / 100);

    // PA Sales tax applies to materials + material markup
    const taxableBase = matSub + markupVal;
    const taxVal = taxableBase * (parsedTaxPct / 100);

    // Grand Total sum
    const grandTotal = matSub + markupVal + laborSub + taxVal;

    return {
      matSub: matSub,
      laborSub: laborSub,
      markupVal: markupVal,
      taxVal: taxVal,
      grandTotal: grandTotal
    };
  }
};