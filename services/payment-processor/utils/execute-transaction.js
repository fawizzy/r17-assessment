const utils = require('./miscellaneous');

function cloneAccount(a) {
  return {
    id: a.id,
    balance: Number(a.balance),
    balance_before: Number(a.balance),
    currency: a.currency,
  };
}

function executeTransaction(validated) {
  const { amount, debitFound, creditFound, executeBy } = validated;

  // preserve original accounts order: the caller will provide full accounts list; here we only return the two involved in the order they appeared in original request - so caller must pass original array and we will pick order there. For simplicity, we return debit and credit objects here.

  if (executeBy == null) {
    // execute immediately
    const debitAcc = cloneAccount(debitFound.account);
    const creditAcc = cloneAccount(creditFound.account);
    debitAcc.balance = debitAcc.balance - amount;
    creditAcc.balance = creditAcc.balance + amount;
    return { status: 'successful', status_code: 'AP00', accounts: [debitAcc, creditAcc] };
  } else {
    // determine if date is in future
    const today = utils.utcTodayYYYYMMDD();
    const cmp = utils.compareDateOnlyUTC(executeBy, today);
    if (cmp === 1) {
      // execute_by > today => pending
      const debitAcc = cloneAccount(debitFound.account);
      const creditAcc = cloneAccount(creditFound.account);
      return { status: 'pending', status_code: 'AP02', accounts: [debitAcc, creditAcc] };
    } else {
      // execute now
      const debitAcc = cloneAccount(debitFound.account);
      const creditAcc = cloneAccount(creditFound.account);
      debitAcc.balance = debitAcc.balance - amount;
      creditAcc.balance = creditAcc.balance + amount;
      console.log(amount);
      return { status: 'successful', status_code: 'AP00', accounts: [debitAcc, creditAcc] };
    }
  }
}

module.exports = { executeTransaction };
