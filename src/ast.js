const ASTNodeType = {
  STATEMENT_LIST: 'STATEMENT_LIST',
  VAR: 'VAR',
  ID: 'ID',
  LIST: 'LIST',
  NUM: 'NUM',
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
  READ: 'READ',
  LSET: 'LSET',
  LGET: 'LGET',
  MSG: 'MSG',
  STR: 'STR',
  IFEQ: 'IFEQ',
  IFNEQ: 'IFNEQ',
  WNEQ: 'WNEQ',
  PROC: 'PROC',
  CALL: 'CALL',
  CHAR: 'CHAR',
};

class ASTNode {
  constructor(type) {
    this._type = type;
    this._children = [];
    this._attributes = new Map();
  }

  addChild(node) {
    this._children.push(node);
  }

  getType() {
    return this._type;
  }

  getChildren() {
    return this._children.slice();
  }

  getAttribute(name) {
    return this._attributes.get(name);
  }

  setAttribute(name, value) {
    this._attributes.set(name, value);
  }
}

module.exports = { ASTNode, ASTNodeType };
