const ASTNodeType = {
  STATEMENT_LIST: 'STATEMENT_LIST',
  VAR: 'VAR',
  ARR: 'ARR',
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
  VAR_LIST: 'VAR_LIST',
  VAR_DECL: 'VAR_DECL',
  ARR_DECL: 'ARR_DECL',
  PROC_DEF: 'PROC_DEF',
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

function astToString(node) {
  const type = node.getType();

  switch (type) {
    case ASTNodeType.STATEMENT_LIST:
      return `{ ${children(node)} }`;

    case ASTNodeType.VAR_LIST:
    case ASTNodeType.SET:
    case ASTNodeType.INC:
    case ASTNodeType.DEC:
    case ASTNodeType.ADD:
    case ASTNodeType.SUB:
    case ASTNodeType.MUL:
    case ASTNodeType.DIVMOD:
    case ASTNodeType.DIV:
    case ASTNodeType.MOD:
    case ASTNodeType.CMP:
    case ASTNodeType.A2B:
    case ASTNodeType.B2A:
    case ASTNodeType.READ:
    case ASTNodeType.LSET:
    case ASTNodeType.LGET:
    case ASTNodeType.MSG:
    case ASTNodeType.IFEQ:
    case ASTNodeType.IFNEQ:
    case ASTNodeType.WNEQ:
    case ASTNodeType.CALL:
    case ASTNodeType.PROC_DEF:
      return `${type} ${children(node)}`;

    case ASTNodeType.VAR:
    case ASTNodeType.ARR:
    case ASTNodeType.PROC:
    case ASTNodeType.VAR_DECL:
      return `${type} '${node.getAttribute('name')}'`;

    case ASTNodeType.ARR_DECL:
      const name = node.getAttribute('name');
      const size = node.getAttribute('size');

      return `${type} '${name}[${size}]'`;

    case ASTNodeType.NUM:
    case ASTNodeType.CHAR:
    case ASTNodeType.STR:
      return `${type} '${node.getAttribute('value')}'`;

    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}

function children(node) {
  return node
    .getChildren()
    .map((c) => astToString(c))
    .join(' ');
}

module.exports = { ASTNode, ASTNodeType, astToString };
