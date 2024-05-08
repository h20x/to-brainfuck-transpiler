const { createEnum } = require('../enum');

// prettier-ignore
const ASTNodeType = createEnum([
  'STMT_LIST', 'DECL_LIST', 'SET', 'INC', 'DEC', 'ADD', 'SUB', 'MUL', 'DIVMOD',
  'DIV', 'MOD', 'CMP', 'A2B', 'B2A', 'READ', 'LSET', 'LGET', 'MSG', 'CALL',
  'IFEQ', 'IFNEQ', 'WNEQ', 'PROC_DEF', 'STR', 'NUM', 'VAR_DECL',
  'ARR_DECL', 'VAR_REF', 'ARR_REF', 'PROC_REF',
]);

class ASTNode {
  constructor(type = null, pos = null) {
    this.type = type;
    this.pos = pos;
    this.args = null;
    this.body = null;
    this.children = null;
    this.name = null;
    this.params = null;
    this.size = null;
    this.value = null;
  }
}

module.exports = { ASTNodeType, ASTNode };
