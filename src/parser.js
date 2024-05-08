const { ASTNodeType, ASTNode } = require('./ast');
const { TokenType } = require('./token');
const { SymbolType, Sym } = require('./symbol');
const { ParsingError } = require('./parsing-error');

const Error = {
  NESTED_VAR: () => 'Nested variable declaration',
  NESTED_PROC: () => 'Nested procedure definition',
  UNEXPECTED_TOKEN: (token) =>
    `Unexpected token: Token(type: ${token.type}, value: ${token.value})`,
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
    const node = this._createNode(ASTNodeType.STMT_LIST);
    const children = [];

    while (TokenType.EOF !== this._curToken().type) {
      children.push(this._parseStatement());
    }

    node.children = children;

    return node;
  }

  _parseNestedStatements() {
    const node = this._createNode(ASTNodeType.STMT_LIST);
    const children = [];

    while (TokenType.END !== this._curToken().type) {
      if (TokenType.VAR === this._curToken().type) {
        this._error(Error.NESTED_VAR());
      }

      if (TokenType.PROC === this._curToken().type) {
        this._error(Error.NESTED_PROC());
      }

      children.push(this._parseStatement());
    }

    this._consume(TokenType.END);

    node.children = children;

    return node;
  }

  _parseStatement() {
    switch (this._curToken().type) {
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
    const node = this._createNode(nodeType);
    this._getNextToken();
    node.args = this._parseArgs(args);

    return node;
  }

  _parseCompoundStmt(nodeType, args) {
    const node = this._createNode(nodeType);
    this._getNextToken();
    node.args = this._parseArgs(args);
    node.body = this._parseNestedStatements();

    return node;
  }

  _parseDeclList() {
    const node = this._createNode(ASTNodeType.DECL_LIST);
    this._consume(TokenType.VAR);
    const args = [];

    while (TokenType.ID === this._curToken().type) {
      args.push(this._parseDecl());
    }

    if (!args.length) {
      this._unexpectedToken();
    }

    node.args = args;

    return node;
  }

  _parseDecl() {
    const node = this._createNode(null);
    node.name = this._curToken().value;
    this._consume(TokenType.ID);

    if (TokenType.LBRACKET === this._curToken().type) {
      this._consume(TokenType.LBRACKET);

      node.size = this._curToken().value;

      this._consume(TokenType.NUM);
      this._consume(TokenType.RBRACKET);

      node.type = ASTNodeType.ARR_DECL;
      this._addSym(SymbolType.ARR, node);
    } else {
      node.type = ASTNodeType.VAR_DECL;
      this._addSym(SymbolType.VAR, node);
    }

    return node;
  }

  _parseCall() {
    const node = this._createNode(ASTNodeType.CALL);
    this._consume(TokenType.CALL);
    const args = [this._parseRef(ASTNodeType.PROC_REF)];

    while (TokenType.ID === this._curToken().type) {
      args.push(this._parseRef(ASTNodeType.VAR_REF));
    }

    node.args = args;

    return node;
  }

  _parseMsg() {
    const node = this._createNode(ASTNodeType.MSG);
    this._consume(TokenType.MSG);
    const args = [];

    while (
      TokenType.ID === this._curToken().type ||
      TokenType.STR === this._curToken().type
    ) {
      args.push(this._parseArg([TokenType.VAR_REF, TokenType.STR]));
    }

    if (!args.length) {
      this._unexpectedToken();
    }

    node.args = args;

    return node;
  }

  _parseProcDef() {
    const node = this._createNode(ASTNodeType.PROC_DEF);
    this._consume(TokenType.PROC);
    node.name = this._curToken().value;
    this._consume(TokenType.ID);
    const params = new Set();

    while (TokenType.ID === this._curToken().type) {
      const param = this._curToken().value;

      if (params.has(param)) {
        this._error(Error.DUPLICATE_PARAM(param, node.name));
      }

      params.add(param);
      this._getNextToken();
    }

    node.body = this._parseNestedStatements();
    node.params = [...params];

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

    return type === this._curToken().type;
  }

  _parseRef(nodeType) {
    const node = this._createNode(nodeType);
    node.name = this._curToken().value;
    this._consume(TokenType.ID);

    return node;
  }

  _parsePrimitive(nodeType) {
    const node = this._createNode(nodeType);
    node.value = this._curToken().value;
    this._getNextToken();

    return node;
  }

  _consume(type) {
    if (type !== this._curToken().type) {
      this._unexpectedToken();
    }

    this._getNextToken();
  }

  _getNextToken() {
    return this._lexer.getNextToken();
  }

  _curToken() {
    return this._lexer.getCurToken();
  }

  _addSym(type, node) {
    const { name } = node;

    if (this._symTable.has(name)) {
      this._error(`'${name}' is already declared`, node.pos);
    }

    this._symTable.add(new Sym(name, type, node));
  }

  _createNode(type, pos = this._curToken().pos) {
    return new ASTNode(type, pos);
  }

  _unexpectedToken() {
    this._error(Error.UNEXPECTED_TOKEN(this._lexer.getCurToken()));
  }

  _error(msg, { column, line } = this._curToken().pos) {
    throw new ParsingError({
      msg,
      src: this._source,
      col: column,
      ln: line,
    });
  }
}

module.exports = { Parser };
