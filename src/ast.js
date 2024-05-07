const { createEnum } = require('./enum');

// prettier-ignore
const ASTNodeType = createEnum([
  'STMT_LIST', 'DECL_LIST', 'SET', 'INC', 'DEC', 'ADD', 'SUB', 'MUL', 'DIVMOD',
  'DIV', 'MOD', 'CMP', 'A2B', 'B2A', 'READ', 'LSET', 'LGET', 'MSG', 'CALL',
  'IFEQ', 'IFNEQ', 'WNEQ', 'PROC_DEF', 'STR', 'NUM', 'VAR_DECL',
  'ARR_DECL', 'VAR_REF', 'ARR_REF', 'PROC_REF',
]);

class ASTNode {
  constructor({ type, pos = { line: -1, column: -1 } }) {
    this._type = type;
    this._pos = { ...pos };
  }

  type() {
    return this._type;
  }

  pos() {
    return { ...this._pos };
  }
}

class Stmt extends ASTNode {
  constructor(opt) {
    super(opt);
    this._args = (opt.args || []).slice();
  }

  args() {
    return this._args.slice();
  }
}

class CompStmt extends Stmt {
  constructor(opt) {
    super(opt);
    this._body = opt.body;
  }

  body() {
    return this._body;
  }
}

class Prim extends ASTNode {
  constructor(opt) {
    super(opt);
    this._value = opt.value;
  }

  value() {
    return this._value;
  }
}

class Ref extends ASTNode {
  constructor(opt) {
    super(opt);
    this._name = opt.name;
  }

  name() {
    return this._name;
  }
}

class Decl extends ASTNode {
  constructor(opt) {
    super(opt);
    this._name = opt.name;
    this._size = opt.size || 1;
  }

  name() {
    return this._name;
  }

  size() {
    return this._size;
  }
}

class StmtList extends ASTNode {
  constructor(opt) {
    super({ ...opt, type: ASTNodeType.STMT_LIST });
    this._children = opt.children.slice();
  }

  children() {
    return this._children.slice();
  }
}

class ProcDef extends CompStmt {
  constructor(opt) {
    super({ ...opt, type: ASTNodeType.PROC_DEF });
    this._name = opt.name;
    this._params = opt.params.slice();
  }

  name() {
    return this._name;
  }

  params() {
    return this._params.slice();
  }
}

module.exports = {
  ASTNodeType,
  Stmt,
  CompStmt,
  Prim,
  Ref,
  Decl,
  StmtList,
  ProcDef,
};
