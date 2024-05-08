const { createEnum } = require('./enum');

// prettier-ignore
const TokenType = createEnum([
  'VAR', 'SET', 'INC', 'DEC', 'ADD', 'SUB', 'MUL', 'DIVMOD', 'DIV', 'MOD',
  'CMP', 'A2B', 'B2A', 'LSET', 'LGET', 'IFEQ', 'IFNEQ', 'WNEQ', 'PROC', 'END',
  'CALL', 'READ', 'MSG', 'ID', 'NUM', 'STR', 'LBRACKET', 'RBRACKET',
  'EOF', 'VAR_REF', 'ARR_REF', 'PROC_REF',
]);

class Token {
  constructor(type, value, pos) {
    this.type = type;
    this.value = value;
    this.pos = pos;
  }
}

module.exports = { Token, TokenType };
