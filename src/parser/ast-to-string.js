const { ASTNodeType } = require('../ast');

function astToString(node) {
  const type = node.getType();

  switch (type) {
    case ASTNodeType.VAR:
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
    case ASTNodeType.PROC:
    case ASTNodeType.CALL:
      const children = node
        .getChildren()
        .map((c) => astToString(c))
        .join(' ');

      return `${type} ${children}`;

    case ASTNodeType.STATEMENT_LIST:
      return `{ ${node
        .getChildren()
        .map((c) => astToString(c))
        .join(' ')} }`;

    case ASTNodeType.ID:
      return `${type} '${node.getAttribute('name')}'`;

    case ASTNodeType.LIST:
      const name = node.getAttribute('name');
      const size = node.getAttribute('size');

      return `${type} '${name}' ${size}`;

    case ASTNodeType.NUM:
      return `${type} ${node.getAttribute('value')}`;

    case ASTNodeType.CHAR:
    case ASTNodeType.STR:
      return `${type} '${node.getAttribute('value')}'`;

    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}

module.exports = { astToString };
