const { createEnum } = require('./enum');

// prettier-ignore
const TokenType = createEnum([
  'VAR', 'SET', 'INC', 'DEC', 'ADD', 'SUB', 'MUL', 'DIVMOD', 'DIV', 'MOD',
  'CMP', 'A2B', 'B2A', 'LSET', 'LGET', 'IFEQ', 'IFNEQ', 'WNEQ', 'PROC', 'END',
  'CALL', 'READ', 'MSG', 'ID', 'NUM', 'CHAR', 'STR', 'LBRACKET', 'RBRACKET',
  'EOF', 'VAR_REF', 'ARR_REF', 'PROC_REF',
]);

class Token {
  constructor(type, value, sourcePos = { line: -1, column: -1 }) {
    this._type = type;
    this._value = value;
    this._sourcePos = { ...sourcePos };
  }

  type() {
    return this._type;
  }

  value() {
    return this._value;
  }

  sourcePos() {
    return { ...this._sourcePos };
  }
}

module.exports = { Token, TokenType };
