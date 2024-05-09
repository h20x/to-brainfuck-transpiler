const { ASTNodeType } = require('./ast');

class ASTStringifier {
  stringify(ast) {
    return this._stringifyNode(ast);
  }

  _stringifyNode(node) {
    switch (node.type) {
      case ASTNodeType.STMT_LIST:
        return this._stringifyStmtList(node);

      case ASTNodeType.PROC_DEF:
        return this._stringifyProcDef(node);

      case ASTNodeType.VAR_DECL:
      case ASTNodeType.ARR_DECL:
        return this._stringifyDecl(node);

      case ASTNodeType.NUM:
      case ASTNodeType.STR:
        return this._stringifyPrimitive(node);

      case ASTNodeType.VAR_REF:
      case ASTNodeType.ARR_REF:
      case ASTNodeType.PROC_REF:
        return this._stringifyRef(node);

      case ASTNodeType.IFEQ:
      case ASTNodeType.IFNEQ:
      case ASTNodeType.WNEQ:
        return this._stringifyCompoundStmt(node);

      default:
        return this._stringifyStmt(node);
    }
  }

  _stringifyStmtList(node) {
    const children = node.children
      .map((node) => this._stringifyNode(node))
      .join(' ');

    return `{ ${children} }`;
  }

  _stringifyStmt(node) {
    return `${node.type} ${this._stringifyArgs(node)}`;
  }

  _stringifyCompoundStmt(node) {
    const args = this._stringifyArgs(node);
    const body = this._stringifyNode(node.body);

    return `${node.type} ${args} ${body}`;
  }

  _stringifyProcDef(node) {
    const { name } = node;
    const params = node.params.map((param) => `'${param}'`).join(' ');
    const body = this._stringifyNode(node.body);

    return `${node.type} '${name}' (${params}) ${body}`;
  }

  _stringifyPrimitive(node) {
    let { value } = node;

    if (ASTNodeType.STR === node.type) {
      value = value.replace(/\n/g, ' ');
    }

    return `${node.type} '${value}'`;
  }

  _stringifyRef(node) {
    return `${node.type} '${node.name}'`;
  }

  _stringifyDecl(node) {
    if (ASTNodeType.ARR_DECL === node.type) {
      return `${node.type} '${node.name}[${node.size}]'`;
    }

    return `${node.type} '${node.name}'`;
  }

  _stringifyArgs(node) {
    return node.args.map((node) => this._stringifyNode(node)).join(' ');
  }
}

module.exports = { ASTStringifier };
