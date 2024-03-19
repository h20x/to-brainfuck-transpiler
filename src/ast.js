const { createEnum } = require('./enum');

// prettier-ignore
const ASTNodeType = createEnum([
  'STMT_LIST', 'DECL_LIST', 'SET', 'INC', 'DEC', 'ADD', 'SUB', 'MUL', 'DIVMOD',
  'DIV', 'MOD', 'CMP', 'A2B', 'B2A', 'READ', 'LSET', 'LGET', 'MSG', 'CALL',
  'IFEQ', 'IFNEQ', 'WNEQ', 'PROC_DEF', 'CHAR', 'STR', 'NUM', 'VAR_DECL',
  'ARR_DECL', 'VAR_REF', 'ARR_REF', 'PROC_REF',
]);

class ASTNode {
  constructor({ type, sourcePos = { line: -1, column: -1 } }) {
    this._type = type;
    this._sourcePos = { ...sourcePos };
  }

  type() {
    return this._type;
  }

  sourcePos() {
    return { ...this._sourcePos };
  }

  accept(visitor) {}
}

class Stmt extends ASTNode {
  constructor(opt) {
    super(opt);
    this._args = (opt.args || []).slice();
  }

  args() {
    return this._args.slice();
  }

  accept(visitor) {
    return visitor.visitStmt(this);
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

  accept(visitor) {
    return visitor.visitCompoundStmt(this);
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

  accept(visitor) {
    return visitor.visitPrimitive(this);
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

  accept(visitor) {
    return visitor.visitRef(this);
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

  accept(visitor) {
    return visitor.visitDecl(this);
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

  accept(visitor) {
    return visitor.visitStmtList(this);
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

  accept(visitor) {
    return visitor.visitProcDef(this);
  }
}

class NodeVisitor {
  visit(node) {
    return node.accept(this);
  }

  visitStmt(node) {}

  visitCompoundStmt(node) {}

  visitPrimitive(node) {}

  visitRef(node) {}

  visitDecl(node) {}

  visitStmtList(node) {
    for (const stmt of node.children()) {
      stmt.accept(this);
    }
  }

  visitProcDef(node) {}
}

module.exports = {
  ASTNodeType,
  NodeVisitor,
  Stmt,
  CompStmt,
  Prim,
  Ref,
  Decl,
  StmtList,
  ProcDef,
};
