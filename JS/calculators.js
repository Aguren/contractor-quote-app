const Calculator = {
  calculateTotals(lineItems, markupPercent, taxPercent) {
    const markupPct = (parseFloat(markupPercent) || 0) / 100;
    const taxPct = (parseFloat(taxPercent) || 0) / 100;

    let matSub = 0;
    let laborSub = 0;

    lineItems.forEach(item => {
      const total = item.qty * item.unitPrice;
      if (item.type === 'Material') {
        matSub += total;
      } else {
        laborSub += total;
      }
    });

    const markupVal = matSub * markupPct;
    const matTotal = matSub + markupVal;
    const taxVal = (matTotal + laborSub) * taxPct;
    const grandTotal = matTotal + laborSub + taxVal;

    return {
      matSub,
      markupVal,
      laborSub,
      taxVal,
      grandTotal
    };
  }
};