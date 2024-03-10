const {
  ASTNodeType,
  Stmt,
  CompStmt,
  Prim,
  Ref,
  Decl,
  StmtList,
  ProcDef,
} = require('./ast');
const { TokenType } = require('./token');

class Parser {
  constructor(lexer) {
    this._lexer = lexer;
  }

  parse() {
    this._getNextToken();

    return this._parseStatements();
  }

  _parseStatements() {
    const nodes = [];

    while (TokenType.EOF !== this._curTokenType()) {
      nodes.push(this._parseStatement());
    }

    return new StmtList(nodes);
  }

  _parseNestedStatements() {
    const nodes = [];

    while (TokenType.END !== this._curTokenType()) {
      if (TokenType.VAR === this._curTokenType()) {
        throw new Error(`Nested variable declaration`);
      }

      if (TokenType.PROC === this._curTokenType()) {
        throw new Error(`Nested procedure definition`);
      }

      nodes.push(this._parseStatement());
    }

    this._consume(TokenType.END);

    return new StmtList(nodes);
  }

  _parseStatement() {
    switch (this._curTokenType()) {
      case TokenType.SET:
        return this._parseStmt({
          nodeType: ASTNodeType.SET,
          args: [
            [TokenType.VAR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
          ],
        });

      case TokenType.INC:
        return this._parseStmt({
          nodeType: ASTNodeType.INC,
          args: [
            [TokenType.VAR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
          ],
        });

      case TokenType.DEC:
        return this._parseStmt({
          nodeType: ASTNodeType.DEC,
          args: [
            [TokenType.VAR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
          ],
        });

      case TokenType.ADD:
        return this._parseStmt({
          nodeType: ASTNodeType.ADD,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.SUB:
        return this._parseStmt({
          nodeType: ASTNodeType.SUB,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.MUL:
        return this._parseStmt({
          nodeType: ASTNodeType.MUL,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.DIVMOD:
        return this._parseStmt({
          nodeType: ASTNodeType.DIVMOD,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.DIV:
        return this._parseStmt({
          nodeType: ASTNodeType.DIV,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.MOD:
        return this._parseStmt({
          nodeType: ASTNodeType.MOD,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.CMP:
        return this._parseStmt({
          nodeType: ASTNodeType.CMP,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.A2B:
        return this._parseStmt({
          nodeType: ASTNodeType.A2B,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.B2A:
        return this._parseStmt({
          nodeType: ASTNodeType.B2A,
          args: [
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
            [TokenType.VAR_REF],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.READ:
        return this._parseStmt({
          nodeType: ASTNodeType.READ,
          args: [[TokenType.VAR_REF]],
        });

      case TokenType.LSET:
        return this._parseStmt({
          nodeType: ASTNodeType.LSET,
          args: [
            [TokenType.ARR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
          ],
        });

      case TokenType.LGET:
        return this._parseStmt({
          nodeType: ASTNodeType.LGET,
          args: [
            [TokenType.ARR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
            [TokenType.VAR_REF],
          ],
        });

      case TokenType.IFEQ:
        return this._parseCompoundStmt({
          nodeType: ASTNodeType.IFEQ,
          args: [
            [TokenType.VAR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
          ],
        });

      case TokenType.IFNEQ:
        return this._parseCompoundStmt({
          nodeType: ASTNodeType.IFNEQ,
          args: [
            [TokenType.VAR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
          ],
        });

      case TokenType.WNEQ:
        return this._parseCompoundStmt({
          nodeType: ASTNodeType.WNEQ,
          args: [
            [TokenType.VAR_REF],
            [TokenType.VAR_REF, TokenType.NUM, TokenType.CHAR],
          ],
        });

      case TokenType.VAR:
        return this._parseDeclList();

      case TokenType.CALL:
        return this._parseCall();

      case TokenType.MSG:
        return this._parseMsg();

      case TokenType.PROC:
        return this._parseProcDef();

      default:
        this._throwUnexpectedToken();
    }
  }

  _parseStmt({ nodeType, args }) {
    this._getNextToken();
    const _args = this._parseArgs(args);

    return new Stmt(nodeType, _args);
  }

  _parseCompoundStmt({ nodeType, args }) {
    this._getNextToken();
    const _args = this._parseArgs(args);
    const body = this._parseNestedStatements();

    return new CompStmt(nodeType, _args, body);
  }

  _parseDeclList() {
    this._consume(TokenType.VAR);
    const args = [];

    while (TokenType.ID === this._curTokenType()) {
      if (TokenType.LBRACKET === this._lexer.peekNextToken().getType()) {
        args.push(this._parseArrDecl());
      } else {
        args.push(this._parseVarDecl());
      }
    }

    if (!args.length) {
      this._throwUnexpectedToken();
    }

    return new Stmt(ASTNodeType.DECL_LIST, args);
  }

  _parseVarDecl() {
    const name = this._curTokenValue();
    this._consume(TokenType.ID);

    return new Decl(ASTNodeType.VAR_DECL, name);
  }

  _parseArrDecl() {
    const name = this._curTokenValue();

    this._consume(TokenType.ID);
    this._consume(TokenType.LBRACKET);

    const size = this._curTokenValue();

    this._consume(TokenType.NUM);
    this._consume(TokenType.RBRACKET);

    return new Decl(ASTNodeType.ARR_DECL, name, size);
  }

  _parseCall() {
    this._consume(TokenType.CALL);
    const args = [this._parseRef(ASTNodeType.PROC_REF)];

    while (TokenType.ID === this._curTokenType()) {
      args.push(this._parseRef(ASTNodeType.VAR_REF));
    }

    return new Stmt(ASTNodeType.CALL, args);
  }

  _parseMsg() {
    this._consume(TokenType.MSG);
    const args = [];

    while (
      TokenType.ID === this._curTokenType() ||
      TokenType.STR === this._curTokenType()
    ) {
      args.push(this._parseArg([TokenType.VAR_REF, TokenType.STR]));
    }

    if (!args.length) {
      this._throwUnexpectedToken();
    }

    return new Stmt(ASTNodeType.MSG, args);
  }

  _parseProcDef() {
    this._consume(TokenType.PROC);
    const name = this._curTokenValue();
    this._consume(TokenType.ID);
    const params = new Set();

    while (TokenType.ID === this._curTokenType()) {
      const param = this._curTokenValue().toLowerCase();

      if (params.has(param)) {
        throw new Error(`Duplicate param '${param}' in procedure '${name}'`);
      }

      params.add(param);
      this._getNextToken();
    }

    const body = this._parseNestedStatements();

    return new ProcDef(name, [...params], body);
  }

  _parseArgs(types) {
    return types.map((unionType) => this._parseArg(unionType));
  }

  _parseArg(unionType) {
    const tokenType = unionType.find((type) => this._compareTokenType(type));

    if (!tokenType) {
      this._throwUnexpectedToken();
    }

    switch (tokenType) {
      case TokenType.VAR_REF:
        return this._parseRef(ASTNodeType.VAR_REF);

      case TokenType.ARR_REF:
        return this._parseRef(ASTNodeType.ARR_REF);

      case TokenType.PROC_REF:
        return this._parseRef(ASTNodeType.PROC_REF);

      case TokenType.NUM:
        return this._parsePrimitive(ASTNodeType.NUM);

      case TokenType.CHAR:
        return this._parsePrimitive(ASTNodeType.CHAR);

      case TokenType.STR:
        return this._parsePrimitive(ASTNodeType.STR);

      default:
        this._throwUnexpectedToken();
    }
  }

  _compareTokenType(type) {
    if (
      TokenType.VAR_REF === type ||
      TokenType.ARR_REF === type ||
      TokenType.PROC_REF === type
    ) {
      type = TokenType.ID;
    }

    return type === this._curTokenType();
  }

  _parseRef(nodeType) {
    const name = this._curTokenValue();
    this._consume(TokenType.ID);

    return new Ref(nodeType, name);
  }

  _parsePrimitive(nodeType) {
    const value = this._curTokenValue();
    this._getNextToken();

    return new Prim(nodeType, value);
  }

  _consume(type) {
    if (type !== this._curTokenType()) {
      this._throwUnexpectedToken();
    }

    this._getNextToken();
  }

  _getNextToken() {
    return this._lexer.getNextToken();
  }

  _curTokenType() {
    return this._lexer.getCurToken().getType();
  }

  _curTokenValue() {
    return this._lexer.getCurToken().getValue();
  }

  _throwUnexpectedToken() {
    throw new Error(`Unexpected token '${this._curTokenType()}'`);
  }
}

module.exports = { Parser };
