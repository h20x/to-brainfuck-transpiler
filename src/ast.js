const { createEnum } = require('./enum');

// prettier-ignore
const ASTNodeType = createEnum([
  'STMT_LIST', 'DECL_LIST', 'SET', 'INC', 'DEC', 'ADD', 'SUB', 'MUL', 'DIVMOD',
  'DIV', 'MOD', 'CMP', 'A2B', 'B2A', 'READ', 'LSET', 'LGET', 'MSG', 'CALL',
  'IFEQ', 'IFNEQ', 'WNEQ', 'PROC_DEF', 'CHAR', 'STR', 'NUM', 'VAR_DECL',
  'ARR_DECL', 'VAR_REF', 'ARR_REF', 'PROC_REF',
]);

class ASTNode {
  constructor(type) {
    this._type = type;
  }

  type() {
    return this._type;
  }

  accept(visitor) {}
}

class Stmt extends ASTNode {
  constructor(type, args = []) {
    super(type);
    this._args = args.slice();
  }

  args() {
    return this._args.slice();
  }

  accept(visitor) {
    return visitor.visitStmt(this);
  }
}

class CompStmt extends Stmt {
  constructor(type, args, body) {
    super(type, args);
    this._body = body;
  }

  body() {
    return this._body;
  }

  accept(visitor) {
    return visitor.visitCompoundStmt(this);
  }
}

class Prim extends ASTNode {
  constructor(type, value) {
    super(type);
    this._value = value;
  }

  value() {
    return this._value;
  }

  accept(visitor) {
    return visitor.visitPrimitive(this);
  }
}

class Ref extends ASTNode {
  constructor(type, name) {
    super(type);
    this._name = name;
  }

  name() {
    return this._name;
  }

  accept(visitor) {
    return visitor.visitRef(this);
  }
}

class Decl extends ASTNode {
  constructor(type, name, size = 1) {
    super(type);
    this._name = name;
    this._size = size;
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
  constructor(children) {
    super(ASTNodeType.STMT_LIST);
    this._children = children.slice();
  }

  children() {
    return this._children.slice();
  }

  accept(visitor) {
    return visitor.visitStmtList(this);
  }
}

class ProcDef extends CompStmt {
  constructor(name, params, body) {
    super(ASTNodeType.PROC_DEF, [], body);
    this._name = name;
    this._params = params.slice();
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
