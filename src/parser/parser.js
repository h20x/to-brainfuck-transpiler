const { ASTNode, ASTNodeType } = require('../ast');
const { TokenType } = require('../token');
const { ArgsParser } = require('./args-parser');

const STATEMENTS = {
  [TokenType.VAR]: [ASTNodeType.VAR_LIST, 'vardecl|arrdecl+'],
  [TokenType.SET]: [ASTNodeType.SET, 'var, var|num|ch'],
  [TokenType.INC]: [ASTNodeType.INC, 'var, var|num|ch'],
  [TokenType.DEC]: [ASTNodeType.DEC, 'var, var|num|ch'],
  [TokenType.ADD]: [ASTNodeType.ADD, 'var|num|ch, var|num|ch, var'],
  [TokenType.SUB]: [ASTNodeType.SUB, 'var|num|ch, var|num|ch, var'],
  [TokenType.MUL]: [ASTNodeType.MUL, 'var|num|ch, var|num|ch, var'],
  [TokenType.DIVMOD]: [ASTNodeType.DIVMOD, 'var|num|ch, var|num|ch, var, var'],
  [TokenType.DIV]: [ASTNodeType.DIV, 'var|num|ch, var|num|ch, var'],
  [TokenType.MOD]: [ASTNodeType.MOD, 'var|num|ch, var|num|ch, var'],
  [TokenType.CMP]: [ASTNodeType.CMP, 'var|num|ch, var|num|ch, var'],
  [TokenType.A2B]: [ASTNodeType.A2B, 'var|num|ch, var|num|ch, var|num|ch, var'],
  [TokenType.B2A]: [ASTNodeType.B2A, 'var|num|ch, var, var, var'],
  [TokenType.READ]: [ASTNodeType.READ, 'var'],
  [TokenType.LSET]: [ASTNodeType.LSET, 'arr, var|num|ch, var|num|ch'],
  [TokenType.LGET]: [ASTNodeType.LGET, 'arr, var|num|ch, var'],
  [TokenType.CALL]: [ASTNodeType.CALL, 'proc, var*'],
  [TokenType.MSG]: [ASTNodeType.MSG, 'var|str+'],
  [TokenType.IFEQ]: [ASTNodeType.IFEQ, 'var, var|num|ch', true],
  [TokenType.IFNEQ]: [ASTNodeType.IFNEQ, 'var, var|num|ch', true],
  [TokenType.WNEQ]: [ASTNodeType.WNEQ, 'var, var|num|ch', true],
  [TokenType.PROC]: [ASTNodeType.PROC_DEF, 'proc, vardecl*', true],
};

class Parser {
  constructor(lexer) {
    this._lexer = lexer;
  }

  parse() {
    this._getNextToken();

    return this._parseStatements();
  }

  _parseStatements(nested = false) {
    const node = new ASTNode(ASTNodeType.STATEMENT_LIST);
    const closingTokens = [TokenType.EOF];

    if (nested) {
      closingTokens.push(TokenType.END);
    }

    while (!closingTokens.includes(this._curTokenType())) {
      node.addChild(this._parseStatement());
    }

    return node;
  }

  _parseStatement() {
    const stmtData = STATEMENTS[this._curTokenType()];

    if (null == stmtData) {
      this._throwError();
    }

    const [nodeType, args, compound] = stmtData;
    const node = new ASTNode(nodeType);

    this._consume(this._curTokenType());

    new ArgsParser(this._lexer)
      .parse(args)
      .forEach((arg) => node.addChild(arg));

    if (compound) {
      node.addChild(this._parseStatements(true));
      this._consume(TokenType.END);
    }

    return node;
  }

  _consume(type) {
    if (type !== this._curTokenType()) {
      this._throwError();
    }

    this._getNextToken();
  }

  _getNextToken() {
    return this._lexer.getNextToken();
  }

  _curTokenType() {
    return this._lexer.getCurToken().getType();
  }

  _throwError() {
    throw new Error(
      `Parsing Error: Unexpected token '${this._curTokenType()}'`
    );
  }
}

module.exports = { Parser };
