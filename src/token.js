const TokenType = {
  VAR: 'VAR',
  SET: 'SET',
  INC: 'INC',
  DEC: 'DEC',
  ADD: 'ADD',
  SUB: 'SUB',
  MUL: 'MUL',
  DIVMOD: 'DIVMOD',
  DIV: 'DIV',
  MOD: 'MOD',
  CMP: 'CMP',
  A2B: 'A2B',
  B2A: 'B2A',
  LSET: 'LSET',
  LGET: 'LGET',
  IFEQ: 'IFEQ',
  IFNEQ: 'IFNEQ',
  WNEQ: 'WNEQ',
  PROC: 'PROC',
  END: 'END',
  CALL: 'CALL',
  READ: 'READ',
  MSG: 'MSG',
  ID: 'ID',
  NUM: 'NUM',
  CHAR: 'CHAR',
  STR: 'STR',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  EOF: 'EOF',
};

class Token {
  constructor(type, value) {
    this._type = type;
    this._value = value;
  }

  getType() {
    return this._type;
  }

  getValue() {
    return this._value;
  }
}

module.exports = { Token, TokenType };
