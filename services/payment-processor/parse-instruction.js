const utils = require('./utils');

function parseInstruction(instruction) {
  if (typeof instruction !== 'string') {
    return { error: { status_code: 'SY03', status_reason: 'Malformed instruction: not a string' } };
  }

  let s = utils.normalizeSpaces(instruction);
  if (s.length === 0) return { error: { status_code: 'SY03', status_reason: 'Malformed instruction: empty' } };

  const parts = s.split(' ');
  if (parts.length < 10) {
    return { error: { status_code: 'SY03', status_reason: 'Malformed instruction: too short' } };
  }

  const first = parts[0].toUpperCase();
  let type = null;
  let amountStr = null; let currency = null; let debitAccount = null; let creditAccount = null; let executeBy = null;

  if (first === 'DEBIT') {
    type = 'DEBIT';
    // minimal positions required: parts[1]=amount, [2]=currency
    if (parts.length < 11) return { error: { status_code: 'SY03', status_reason: 'Malformed DEBIT instruction' } };
    // check keywords in order
    if (parts[3].toUpperCase() !== 'FROM' || parts[4].toUpperCase() !== 'ACCOUNT' ||
        parts[6].toUpperCase() !== 'FOR' || parts[7].toUpperCase() !== 'CREDIT' ||
        parts[8].toUpperCase() !== 'TO' || parts[9].toUpperCase() !== 'ACCOUNT') {
      return { error: { status_code: 'SY02', status_reason: 'Invalid keyword order for DEBIT format' } };
    }
    amountStr = parts[1];
    currency = parts[2].toUpperCase();
    debitAccount = parts[5];
    // destination account might be at index 10
    if (parts.length <= 10) return { error: { status_code: 'SY03', status_reason: 'Missing destination account' } };
    creditAccount = parts[10];
    // optional ON
    if (parts.length > 11 && parts[11].toUpperCase() === 'ON') {
      if (parts.length <= 12) return { error: { status_code: 'DT01', status_reason: 'ON clause missing date' } };
      executeBy = parts[12];
    }
  } else if (first === 'CREDIT') {
    type = 'CREDIT';
    if (parts.length < 11) return { error: { status_code: 'SY03', status_reason: 'Malformed CREDIT instruction' } };
    if (parts[3].toUpperCase() !== 'TO' || parts[4].toUpperCase() !== 'ACCOUNT' ||
        parts[6].toUpperCase() !== 'FOR' || parts[7].toUpperCase() !== 'DEBIT' ||
        parts[8].toUpperCase() !== 'FROM' || parts[9].toUpperCase() !== 'ACCOUNT') {
      return { error: { status_code: 'SY02', status_reason: 'Invalid keyword order for CREDIT format' } };
    }
    amountStr = parts[1];
    currency = parts[2].toUpperCase();
    creditAccount = parts[5];
    if (parts.length <= 10) return { error: { status_code: 'SY03', status_reason: 'Missing source account' } };
    debitAccount = parts[10];
    if (parts.length > 11 && parts[11].toUpperCase() === 'ON') {
      if (parts.length <= 12) return { error: { status_code: 'DT01', status_reason: 'ON clause missing date' } };
      executeBy = parts[12];
    }
  } else {
    return { error: { status_code: 'SY01', status_reason: 'Missing required keyword DEBIT or CREDIT at start' } };
  }

  // build parsed object (note amount as integer parsed later)
  return {
    type,
    amountRaw: amountStr,
    currency: currency || null,
    debit_account: debitAccount || null,
    credit_account: creditAccount || null,
    execute_by: executeBy || null
  };
}

module.exports = { parseInstruction };