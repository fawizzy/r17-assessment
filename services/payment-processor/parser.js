const validator = require('@app-core/validator');
const { parseInstruction } = require('./parse-instruction');
const { validateTransaction } = require('./validate-transaction');
const { executeTransaction } = require('./execute-transaction');
const { buildResponse } = require('./build-response');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { PAYMENT_MESSAGES, STATUS_CODE_TO_MESSAGE } = require('@app/messages/payment');

// Spec for login service
const PARSE_INSTRUCTION_SPEC = `root {
  accounts[] {
    id string
    balance number
    currency string
  }
  instruction string
}`;

// Parse the spec outside the service function
const PARSED_INSTRUCTION_SPEC = validator.parse(PARSE_INSTRUCTION_SPEC);

async function parseInstructionService(serviceData) {
  // Validate incoming data
  const validatedData = validator.validate(serviceData, PARSED_INSTRUCTION_SPEC);

  const instruction = validatedData.instruction.trim();
  const accounts = validatedData.accounts;

  const parsed = parseInstruction(instruction || '');

  if (parsed && parsed.error) {
    const response = buildResponse(parsed, null, null, accounts);
    const message =
      STATUS_CODE_TO_MESSAGE[response.status_code] || PAYMENT_MESSAGES.MALFORMED_INSTRUCTION;
    throwAppError(message, ERROR_CODE.VALIDATIONERR, { context: response });
  }
  const validated = validateTransaction(parsed, accounts);
  if (!validated.valid) {
    const response = buildResponse(parsed, validated, null, accounts);
    const message =
      STATUS_CODE_TO_MESSAGE[response.status_code] || PAYMENT_MESSAGES.MALFORMED_INSTRUCTION;
    throwAppError(message, ERROR_CODE.VALIDATIONERR, { context: response });
  }

  const execResult = executeTransaction(validated);

  const response = buildResponse(parsed, validated, execResult, accounts);

  return response;
}

module.exports = parseInstructionService;
