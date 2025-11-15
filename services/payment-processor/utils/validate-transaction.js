const utils = require('./miscellaneous');

const SUPPORTED = ['NGN', 'USD', 'GBP', 'GHS'];

function findAccountById(accounts, id) {
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].id === id) return { account: accounts[i], index: i };
  }
  return null;
}

function validateTransaction(parsed, accounts) {
  // parsed may carry an error
  if (parsed == null || parsed.error) {
    return {
      valid: false,
      status_code: parsed && parsed.error ? parsed.error.status_code : 'SY03',
      status_reason: parsed && parsed.error ? parsed.error.status_reason : 'Malformed instruction',
    };
  }

  const type = parsed.type || null;
  const amountStr = parsed.amountRaw;
  const currency = parsed.currency ? parsed.currency.toUpperCase() : null;
  const debitId = parsed.debit_account;
  const creditId = parsed.credit_account;
  const dateStr = parsed.execute_by;

  // amount check
  if (!utils.isPositiveIntegerString(String(amountStr))) {
    return {
      valid: false,
      status_code: 'AM01',
      status_reason: 'Amount must be a positive integer',
    };
  }
  const amount = parseInt(String(amountStr), 10);

  // currency supported
  if (!currency || SUPPORTED.indexOf(currency) === -1) {
    return { valid: false, status_code: 'CU02', status_reason: 'Unsupported currency' };
  }

  // account id formats
  if (!utils.isValidAccountId(debitId)) {
    return {
      valid: false,
      status_code: 'AC04',
      status_reason: `Invalid account ID format for debit account: ${debitId}`,
    };
  }
  if (!utils.isValidAccountId(creditId)) {
    return {
      valid: false,
      status_code: 'AC04',
      status_reason: `Invalid account ID format for credit account: ${creditId}`,
    };
  }

  // accounts exist
  const debitFound = findAccountById(accounts, debitId);
  const creditFound = findAccountById(accounts, creditId);
  if (!debitFound)
    return { valid: false, status_code: 'AC03', status_reason: `Account not found: ${debitId}` };
  if (!creditFound)
    return { valid: false, status_code: 'AC03', status_reason: `Account not found: ${creditId}` };

  // currencies must match between accounts and match instruction currency
  const accDebitCurrency = utils.toUpperSafe(debitFound.account.currency || '');
  const accCreditCurrency = utils.toUpperSafe(creditFound.account.currency || '');
  if (accDebitCurrency !== accCreditCurrency) {
    return { valid: false, status_code: 'CU01', status_reason: 'Account currency mismatch' };
  }
  if (accDebitCurrency !== currency) {
    return {
      valid: false,
      status_code: 'CU01',
      status_reason: `Instruction currency ${currency} does not match account currency ${accDebitCurrency}`,
    };
  }

  // debit and credit must differ
  if (debitId === creditId) {
    return {
      valid: false,
      status_code: 'AC02',
      status_reason: 'Debit and credit accounts cannot be the same',
    };
  }

  // sufficient funds
  const debitBalance = Number(debitFound.account.balance);
  if (!Number.isFinite(debitBalance)) {
    return { valid: false, status_code: 'AC01', status_reason: 'Invalid balance on debit account' };
  }
  if (debitBalance < amount) {
    return {
      valid: false,
      status_code: 'AC01',
      status_reason: `Insufficient funds in debit account: has ${debitBalance} ${accDebitCurrency}, needs ${amount} ${accDebitCurrency}`,
    };
  }

  // date validation if present
  if (dateStr != null) {
    if (!utils.isValidDateYYYYMMDD(dateStr)) {
      return { valid: false, status_code: 'DT01', status_reason: 'Invalid date format' };
    }
  }

  return { valid: true, amount, currency, debitFound, creditFound, executeBy: dateStr, type };
}

module.exports = { validateTransaction };
