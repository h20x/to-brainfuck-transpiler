const { ASTNode, ASTNodeType } = require('../ast');
const { TokenType } = require('../token');
const { ArgsParser } = require('./args-parser');

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
    switch (this._curTokenType()) {
      case TokenType.VAR:
      case TokenType.SET:
      case TokenType.INC:
      case TokenType.DEC:
      case TokenType.ADD:
      case TokenType.SUB:
      case TokenType.MUL:
      case TokenType.DIVMOD:
      case TokenType.DIV:
      case TokenType.MOD:
      case TokenType.CMP:
      case TokenType.A2B:
      case TokenType.B2A:
      case TokenType.LSET:
      case TokenType.LGET:
      case TokenType.READ:
      case TokenType.CALL:
      case TokenType.MSG:
        return this._parseSimpleStatement();

      case TokenType.IFEQ:
      case TokenType.IFNEQ:
      case TokenType.WNEQ:
      case TokenType.PROC:
        return this._parseCompoundStatement();

      default:
        this._throwError();
    }
  }

  _parseSimpleStatement() {
    let nodeType;
    let args;

    switch (this._curTokenType()) {
      case TokenType.VAR:
        nodeType = ASTNodeType.VAR;
        args = 'id|lst+';
        break;

      case TokenType.SET:
        nodeType = ASTNodeType.SET;
        args = 'id, id|num|ch';
        break;

      case TokenType.INC:
        nodeType = ASTNodeType.INC;
        args = 'id, id|num|ch';
        break;

      case TokenType.DEC:
        nodeType = ASTNodeType.DEC;
        args = 'id, id|num|ch';
        break;

      case TokenType.ADD:
        nodeType = ASTNodeType.ADD;
        args = 'id|num|ch, id|num|ch, id';
        break;

      case TokenType.SUB:
        nodeType = ASTNodeType.SUB;
        args = 'id|num|ch, id|num|ch, id';
        break;

      case TokenType.MUL:
        nodeType = ASTNodeType.MUL;
        args = 'id|num|ch, id|num|ch, id';
        break;

      case TokenType.DIVMOD:
        nodeType = ASTNodeType.DIVMOD;
        args = 'id|num|ch, id|num|ch, id, id';
        break;

      case TokenType.DIV:
        nodeType = ASTNodeType.DIV;
        args = 'id|num|ch, id|num|ch, id';
        break;

      case TokenType.MOD:
        nodeType = ASTNodeType.MOD;
        args = 'id|num|ch, id|num|ch, id';
        break;

      case TokenType.CMP:
        nodeType = ASTNodeType.CMP;
        args = 'id|num|ch, id|num|ch, id';
        break;

      case TokenType.A2B:
        nodeType = ASTNodeType.A2B;
        args = 'id|num|ch, id|num|ch, id|num|ch, id';
        break;

      case TokenType.B2A:
        nodeType = ASTNodeType.B2A;
        args = 'id|num|ch, id, id, id';
        break;

      case TokenType.READ:
        nodeType = ASTNodeType.READ;
        args = 'id';
        break;

      case TokenType.LSET:
        nodeType = ASTNodeType.LSET;
        args = 'id, id|num|ch, id|num|ch';
        break;

      case TokenType.LGET:
        nodeType = ASTNodeType.LGET;
        args = 'id, id|num|ch, id';
        break;

      case TokenType.CALL:
        nodeType = ASTNodeType.CALL;
        args = 'id, id*';
        break;

      case TokenType.MSG:
        nodeType = ASTNodeType.MSG;
        args = 'id|str+';
        break;

      default:
        this._throwError();
    }

    this._consume(this._curTokenType());

    const node = new ASTNode(nodeType);
    new ArgsParser(this._lexer)
      .parse(args)
      .forEach((arg) => node.addChild(arg));

    return node;
  }

  _parseCompoundStatement() {
    let nodeType;
    let args;

    switch (this._curTokenType()) {
      case TokenType.IFEQ:
        nodeType = ASTNodeType.IFEQ;
        args = 'id, id|num|ch';
        break;

      case TokenType.IFNEQ:
        nodeType = ASTNodeType.IFNEQ;
        args = 'id, id|num|ch';
        break;

      case TokenType.WNEQ:
        nodeType = ASTNodeType.WNEQ;
        args = 'id, id|num|ch';
        break;

      case TokenType.PROC:
        nodeType = ASTNodeType.PROC;
        args = 'id, id*';
        break;

      default:
        this._throwError();
    }

    this._consume(this._curTokenType());

    const node = new ASTNode(nodeType);
    new ArgsParser(this._lexer)
      .parse(args)
      .forEach((arg) => node.addChild(arg));
    node.addChild(this._parseStatements(true));

    this._consume(TokenType.END);

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
    return this._lexer.curToken().getType();
  }

  _throwError() {
    throw new Error(
      `Parsing Error: Unexpected token '${this._curTokenType()}'`
    );
  }
}

module.exports = { Parser };
