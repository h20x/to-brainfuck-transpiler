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

const Error = {
  NESTED_VAR: () => 'Nested variable declaration',
  NESTED_PROC: () => 'Nested procedure definition',
  UNEXPECTED_TOKEN: (token) =>
    `Unexpected token: Token(type: ${token.type()}, value: ${token.value()})`,
  DUPLICATE_PARAM: (param, proc) =>
    `Duplicate param '${param}' in '${proc}' procedure`,
};

class Parser {
  constructor(lexer, errNotifier) {
    this._lexer = lexer;
    this._errNotifier = errNotifier;
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

    return new StmtList({ children: nodes });
  }

  _parseNestedStatements() {
    const nodes = [];

    while (TokenType.END !== this._curTokenType()) {
      if (TokenType.VAR === this._curTokenType()) {
        this._error(Error.NESTED_VAR());
      }

      if (TokenType.PROC === this._curTokenType()) {
        this._error(Error.NESTED_PROC());
      }

      nodes.push(this._parseStatement());
    }

    this._consume(TokenType.END);

    return new StmtList({ children: nodes });
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
        this._unexpectedToken();
    }
  }

  _parseStmt({ nodeType, args }) {
    const pos = this._curTokenPos();
    this._getNextToken();
    const _args = this._parseArgs(args);

    return new Stmt({ type: nodeType, args: _args, sourcePos: pos });
  }

  _parseCompoundStmt({ nodeType, args }) {
    const pos = this._curTokenPos();
    this._getNextToken();
    const _args = this._parseArgs(args);
    const body = this._parseNestedStatements();

    return new CompStmt({ type: nodeType, args: _args, body, sourcePos: pos });
  }

  _parseDeclList() {
    const pos = this._curTokenPos();
    this._consume(TokenType.VAR);
    const args = [];

    while (TokenType.ID === this._curTokenType()) {
      if (TokenType.LBRACKET === this._lexer.peekNextToken().type()) {
        args.push(this._parseArrDecl());
      } else {
        args.push(this._parseVarDecl());
      }
    }

    if (!args.length) {
      this._unexpectedToken();
    }

    return new Stmt({ type: ASTNodeType.DECL_LIST, args, sourcePos: pos });
  }

  _parseVarDecl() {
    const name = this._curTokenValue();
    const pos = this._curTokenPos();
    this._consume(TokenType.ID);

    return new Decl({ type: ASTNodeType.VAR_DECL, name, sourcePos: pos });
  }

  _parseArrDecl() {
    const name = this._curTokenValue();
    const pos = this._curTokenPos();

    this._consume(TokenType.ID);
    this._consume(TokenType.LBRACKET);

    const size = this._curTokenValue();

    this._consume(TokenType.NUM);
    this._consume(TokenType.RBRACKET);

    return new Decl({ type: ASTNodeType.ARR_DECL, name, size, sourcePos: pos });
  }

  _parseCall() {
    const pos = this._curTokenPos();
    this._consume(TokenType.CALL);
    const args = [this._parseRef(ASTNodeType.PROC_REF)];

    while (TokenType.ID === this._curTokenType()) {
      args.push(this._parseRef(ASTNodeType.VAR_REF));
    }

    return new Stmt({ type: ASTNodeType.CALL, args, sourcePos: pos });
  }

  _parseMsg() {
    const pos = this._curTokenPos();
    this._consume(TokenType.MSG);
    const args = [];

    while (
      TokenType.ID === this._curTokenType() ||
      TokenType.STR === this._curTokenType()
    ) {
      args.push(this._parseArg([TokenType.VAR_REF, TokenType.STR]));
    }

    if (!args.length) {
      this._unexpectedToken();
    }

    return new Stmt({ type: ASTNodeType.MSG, args, sourcePos: pos });
  }

  _parseProcDef() {
    const pos = this._curTokenPos();
    this._consume(TokenType.PROC);
    const name = this._curTokenValue();
    this._consume(TokenType.ID);
    const params = new Set();

    while (TokenType.ID === this._curTokenType()) {
      const param = this._curTokenValue();

      if (params.has(param)) {
        this._error(Error.DUPLICATE_PARAM(param, name));
      }

      params.add(param);
      this._getNextToken();
    }

    const body = this._parseNestedStatements();

    return new ProcDef({ name, params: [...params], body, sourcePos: pos });
  }

  _parseArgs(types) {
    return types.map((unionType) => this._parseArg(unionType));
  }

  _parseArg(unionType) {
    const tokenType = unionType.find((type) => this._compareTokenType(type));

    if (!tokenType) {
      this._unexpectedToken();
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
        this._unexpectedToken();
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
    const pos = this._curTokenPos();
    this._consume(TokenType.ID);

    return new Ref({ type: nodeType, name, sourcePos: pos });
  }

  _parsePrimitive(nodeType) {
    const value = this._curTokenValue();
    const pos = this._curTokenPos();
    this._getNextToken();

    return new Prim({ type: nodeType, value, sourcePos: pos });
  }

  _consume(type) {
    if (type !== this._curTokenType()) {
      this._unexpectedToken();
    }

    this._getNextToken();
  }

  _getNextToken() {
    return this._lexer.getNextToken();
  }

  _curTokenType() {
    return this._lexer.getCurToken().type();
  }

  _curTokenValue() {
    return this._lexer.getCurToken().value();
  }

  _curTokenPos() {
    return this._lexer.getCurToken().sourcePos();
  }

  _unexpectedToken() {
    this._error(Error.UNEXPECTED_TOKEN(this._lexer.getCurToken()));
  }

  _error(msg, pos = this._curTokenPos()) {
    this._errNotifier.notify(msg, pos);
  }
}

module.exports = { Parser };
