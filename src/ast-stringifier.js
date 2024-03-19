const { NodeVisitor, ASTNodeType } = require('./ast');

class ASTStringifier extends NodeVisitor {
  constructor(ast) {
    super();
    this._ast = ast;
  }

  stringify() {
    return this.visit(this._ast);
  }

  visitStmt(node) {
    return `${node.type()} ${this._stringifyArgs(node)}`;
  }

  visitCompoundStmt(node) {
    const args = this._stringifyArgs(node);
    const body = this.visit(node.body());

    return `${node.type()} ${args} ${body}`;
  }

  visitPrimitive(node) {
    return `${node.type()} '${node.value()}'`;
  }

  visitRef(node) {
    return `${node.type()} '${node.name()}'`;
  }

  visitDecl(node) {
    if (ASTNodeType.ARR_DECL === node.type()) {
      return `${node.type()} '${node.name()}[${node.size()}]'`;
    }

    return `${node.type()} '${node.name()}'`;
  }

  visitStmtList(node) {
    const children = node
      .children()
      .map((node) => this.visit(node))
      .join(' ');

    return `{ ${children} }`;
  }

  visitProcDef(node) {
    const procName = node.name();
    const params = node
      .params()
      .map((param) => `'${param}'`)
      .join(' ');
    const body = this.visit(node.body());

    return `${node.type()} '${procName}' (${params}) ${body}`;
  }

  _stringifyArgs(node) {
    return node
      .args()
      .map((node) => this.visit(node))
      .join(' ');
  }
}

module.exports = { ASTStringifier };
