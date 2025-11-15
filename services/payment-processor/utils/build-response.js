const { utilsSilentParseInt } = require('./miscellaneous');

function buildResponse(parsed, validatedResult, execResult, originalAccountsOrder) {
  // parsed: from parseInstruction (may have nulls)
  // validatedResult: result of validateTransaction (may be invalid)
  // execResult: result of executeTransaction (if validated)
  // originalAccountsOrder: the original request accounts array to preserve order when returning accounts array

  const type = parsed && parsed.type ? parsed.type : null;
  const amount =
    validatedResult && validatedResult.valid
      ? validatedResult.amount
      : parsed && parsed.amountRaw
        ? utilsSilentParseInt(parsed.amountRaw) || null
        : null;
  const currency = parsed && parsed.currency ? parsed.currency.toUpperCase() : null;
  const debitAccount = parsed && parsed.debit_account ? parsed.debit_account : null;
  const creditAccount = parsed && parsed.credit_account ? parsed.credit_account : null;
  const executeBy = parsed && parsed.execute_by ? parsed.execute_by : null;

  // default failure
  if (!validatedResult || !validatedResult.valid) {
    const code = validatedResult
      ? validatedResult.status_code
      : parsed && parsed.error
        ? parsed.error.status_code
        : 'SY03';
    const reason = validatedResult
      ? validatedResult.status_reason
      : parsed && parsed.error
        ? parsed.error.status_reason
        : 'Malformed instruction';
    return {
      type: type || null,
      amount: amount || null,
      currency: currency || null,
      debit_account: debitAccount || null,
      credit_account: creditAccount || null,
      execute_by: executeBy || null,
      status: 'failed',
      status_reason: reason,
      status_code: code,
      accounts: [],
    };
  }

  // validated OK -> execResult determines status
  const status = execResult.status;
  const status_code = execResult.status_code;
  const status_reason =
    status === 'successful'
      ? 'Transaction executed successfully'
      : 'Transaction scheduled for future execution';

  // Build accounts array preserving original order
  const accountsOut = [];
  if (Array.isArray(originalAccountsOrder) && originalAccountsOrder.length > 0) {
    for (let i = 0; i < originalAccountsOrder.length; i++) {
      const a = originalAccountsOrder[i];
      if (a.id === execResult.accounts[0].id) accountsOut.push(execResult.accounts[0]);
      else if (a.id === execResult.accounts[1].id) accountsOut.push(execResult.accounts[1]);
    }
    // If original order did not include them (defensive), push both in debit->credit order
    if (accountsOut.length !== 2) {
      accountsOut.length = 0;
      accountsOut.push(execResult.accounts[0]);
      accountsOut.push(execResult.accounts[1]);
    }
  } else {
    accountsOut.push(execResult.accounts[0]);
    accountsOut.push(execResult.accounts[1]);
  }

  return {
    type,
    amount: validatedResult.amount,
    currency: validatedResult.currency,
    debit_account: validatedResult.debitFound.account.id,
    credit_account: validatedResult.creditFound.account.id,
    execute_by: validatedResult.execute_by || null,
    status: status === 'successful' ? 'successful' : 'pending',
    status_reason,
    status_code,
    accounts: accountsOut.map((a) => ({
      id: a.id,
      balance: a.balance,
      balance_before: a.balance_before,
      currency: a.currency,
    })),
  };
}

module.exports = { buildResponse };
