const { createEnum } = require('./enum');

// prettier-ignore
const ASTNodeType = createEnum([
  'STMT_LIST', 'DECL_LIST', 'SET', 'INC', 'DEC', 'ADD', 'SUB', 'MUL', 'DIVMOD',
  'DIV', 'MOD', 'CMP', 'A2B', 'B2A', 'READ', 'LSET', 'LGET', 'MSG', 'CALL',
  'IFEQ', 'IFNEQ', 'WNEQ', 'PROC_DEF', 'STR', 'NUM', 'VAR_DECL',
  'ARR_DECL', 'VAR_REF', 'ARR_REF', 'PROC_REF',
]);

class ASTNode {
  constructor(type = null, pos = { line: -1, column: -1 }) {
    this._type = type;
    this._pos = { ...pos };
    this._attrs = new Map();
  }

  type(val) {
    if (null == val) {
      return this._type;
    }

    this._type = val;
  }

  pos(val) {
    if (null == val) {
      return { ...this._pos };
    }

    this._pos = { ...val };
  }

  attr(name, val) {
    if (null == val) {
      return this._attrs.get(name);
    }

    this._attrs.set(name, val);
  }
}

module.exports = { ASTNodeType, ASTNode };
