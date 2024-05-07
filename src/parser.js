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
const { SymbolType, Sym } = require('./symbol');
const { ParsingError } = require('./parsing-error');

const Error = {
  NESTED_VAR: () => 'Nested variable declaration',
  NESTED_PROC: () => 'Nested procedure definition',
  UNEXPECTED_TOKEN: (token) =>
    `Unexpected token: Token(type: ${token.type()}, value: ${token.value()})`,
  DUPLICATE_PARAM: (param, proc) =>
    `Duplicate param '${param}' in '${proc}' procedure`,
};

class Parser {
  constructor(source, lexer, symTable) {
    this._source = source;
    this._lexer = lexer;
    this._symTable = symTable;
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
        return this._parseStmt(ASTNodeType.SET, [
          [TokenType.VAR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
        ]);

      case TokenType.INC:
        return this._parseStmt(ASTNodeType.INC, [
          [TokenType.VAR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
        ]);

      case TokenType.DEC:
        return this._parseStmt(ASTNodeType.DEC, [
          [TokenType.VAR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
        ]);

      case TokenType.ADD:
        return this._parseStmt(ASTNodeType.ADD, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.SUB:
        return this._parseStmt(ASTNodeType.SUB, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.MUL:
        return this._parseStmt(ASTNodeType.MUL, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.DIVMOD:
        return this._parseStmt(ASTNodeType.DIVMOD, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
          [TokenType.VAR_REF],
        ]);

      case TokenType.DIV:
        return this._parseStmt(ASTNodeType.DIV, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.MOD:
        return this._parseStmt(ASTNodeType.MOD, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.CMP:
        return this._parseStmt(ASTNodeType.CMP, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.A2B:
        return this._parseStmt(ASTNodeType.A2B, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.B2A:
        return this._parseStmt(ASTNodeType.B2A, [
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
          [TokenType.VAR_REF],
          [TokenType.VAR_REF],
        ]);

      case TokenType.READ:
        return this._parseStmt(ASTNodeType.READ, [[TokenType.VAR_REF]]);

      case TokenType.LSET:
        return this._parseStmt(ASTNodeType.LSET, [
          [TokenType.ARR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF, TokenType.NUM],
        ]);

      case TokenType.LGET:
        return this._parseStmt(ASTNodeType.LGET, [
          [TokenType.ARR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
          [TokenType.VAR_REF],
        ]);

      case TokenType.IFEQ:
        return this._parseCompoundStmt(ASTNodeType.IFEQ, [
          [TokenType.VAR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
        ]);

      case TokenType.IFNEQ:
        return this._parseCompoundStmt(ASTNodeType.IFNEQ, [
          [TokenType.VAR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
        ]);

      case TokenType.WNEQ:
        return this._parseCompoundStmt(ASTNodeType.WNEQ, [
          [TokenType.VAR_REF],
          [TokenType.VAR_REF, TokenType.NUM],
        ]);

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

  _parseStmt(nodeType, args) {
    const pos = this._curTokenPos();
    this._getNextToken();
    const _args = this._parseArgs(args);

    return new Stmt({ type: nodeType, args: _args, pos });
  }

  _parseCompoundStmt(nodeType, args) {
    const pos = this._curTokenPos();
    this._getNextToken();
    const _args = this._parseArgs(args);
    const body = this._parseNestedStatements();

    return new CompStmt({ type: nodeType, args: _args, body, pos });
  }

  _parseDeclList() {
    const pos = this._curTokenPos();
    this._consume(TokenType.VAR);
    const args = [];

    while (TokenType.ID === this._curTokenType()) {
      args.push(this._parseDecl());
    }

    if (!args.length) {
      this._unexpectedToken();
    }

    return new Stmt({ type: ASTNodeType.DECL_LIST, args, pos });
  }

  _parseDecl() {
    const name = this._curTokenValue();
    const pos = this._curTokenPos();

    this._consume(TokenType.ID);

    let node, symType;

    if (TokenType.LBRACKET === this._curTokenType()) {
      this._consume(TokenType.LBRACKET);

      const size = this._curTokenValue();

      this._consume(TokenType.NUM);
      this._consume(TokenType.RBRACKET);

      node = new Decl({
        name,
        size,
        pos,
        type: ASTNodeType.ARR_DECL,
      });

      symType = SymbolType.ARR;
    } else {
      node = new Decl({ name, pos, type: ASTNodeType.VAR_DECL });
      symType = SymbolType.VAR;
    }

    this._addSym(symType, node);

    return node;
  }

  _parseCall() {
    const pos = this._curTokenPos();
    this._consume(TokenType.CALL);
    const args = [this._parseRef(ASTNodeType.PROC_REF)];

    while (TokenType.ID === this._curTokenType()) {
      args.push(this._parseRef(ASTNodeType.VAR_REF));
    }

    return new Stmt({ type: ASTNodeType.CALL, args, pos });
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

    return new Stmt({ type: ASTNodeType.MSG, args, pos });
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
    const node = new ProcDef({
      name,
      body,
      pos,
      params: [...params],
    });

    this._addSym(SymbolType.PROC, node);

    return node;
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

    return new Ref({ type: nodeType, name, pos });
  }

  _parsePrimitive(nodeType) {
    const value = this._curTokenValue();
    const pos = this._curTokenPos();
    this._getNextToken();

    return new Prim({ type: nodeType, value, pos });
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
    return this._lexer.getCurToken().pos();
  }

  _addSym(type, node) {
    const name = node.name();

    if (this._symTable.has(name)) {
      this._error(`'${name}' is already declared`, node.pos());
    }

    this._symTable.add(new Sym(name, type, node));
  }

  _unexpectedToken() {
    this._error(Error.UNEXPECTED_TOKEN(this._lexer.getCurToken()));
  }

  _error(msg, { column, line } = this._curTokenPos()) {
    throw new ParsingError({
      msg,
      src: this._source,
      col: column,
      ln: line,
    });
  }
}

module.exports = { Parser };
