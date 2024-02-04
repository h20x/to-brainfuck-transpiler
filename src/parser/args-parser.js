const { ASTNode, ASTNodeType } = require('../ast');
const { TokenType } = require('../token');

class ArgsParser {
  constructor(lexer) {
    this._lexer = lexer;
  }

  parse(pattern) {
    const args = pattern.split(/\s*,\s*/);
    const result = [];

    for (let arg of args) {
      const lastChar = arg[arg.length - 1];
      const greedy = '+' === lastChar || '*' === lastChar;
      const oneOrMore = !greedy || '+' === lastChar;

      if (greedy) {
        arg = arg.slice(0, -1);
      }

      const types = arg.split('|');
      const nodes = this._parse(types, greedy);

      if (0 === nodes.length && oneOrMore) {
        this._throwError();
      }

      result.push(...nodes);
    }

    return result;
  }

  _parse(types, greedy = false) {
    const nodes = [];

    do {
      const node = this._parseArg(types);

      if (null == node) {
        break;
      }

      nodes.push(node);
    } while (greedy);

    return nodes;
  }

  _parseArg(types) {
    let node = null;

    for (let i = 0; i < types.length && node == null; i++) {
      const type = types[i];

      switch (type) {
        case 'id':
          node = this._parseID();
          break;

        case 'lst':
          node = this._parseLIST();
          break;

        case 'num':
          node = this._parseNUM();
          break;

        case 'ch':
          node = this._parseCHAR();
          break;

        case 'str':
          node = this._parseSTR();
          break;

        default:
          throw new Error(`Unknown arg type: ${type}`);
      }
    }

    return node;
  }

  _parseID() {
    if (
      TokenType.ID !== this._curTokenType() ||
      TokenType.LBRACKET === this._lexer.peekNextToken().getType()
    ) {
      return null;
    }

    const node = new ASTNode(ASTNodeType.ID);
    node.setAttribute('name', this._curTokenValue());

    this._consume(TokenType.ID);

    return node;
  }

  _parseNUM() {
    if (TokenType.NUM !== this._curTokenType()) {
      return null;
    }

    const node = new ASTNode(ASTNodeType.NUM);
    node.setAttribute('value', this._curTokenValue());

    this._consume(TokenType.NUM);

    return node;
  }

  _parseSTR() {
    if (TokenType.STR !== this._curTokenType()) {
      return null;
    }

    const node = new ASTNode(ASTNodeType.STR);
    node.setAttribute('value', this._curTokenValue());

    this._consume(TokenType.STR);

    return node;
  }

  _parseCHAR() {
    if (TokenType.CHAR !== this._curTokenType()) {
      return null;
    }

    const node = new ASTNode(ASTNodeType.CHAR);
    node.setAttribute('value', this._curTokenValue());

    this._consume(TokenType.CHAR);

    return node;
  }

  _parseLIST() {
    if (
      TokenType.ID !== this._curTokenType() ||
      TokenType.LBRACKET !== this._lexer.peekNextToken().getType()
    ) {
      return null;
    }

    const node = new ASTNode(ASTNodeType.LIST);
    node.setAttribute('name', this._curTokenValue());

    this._consume(TokenType.ID);
    this._consume(TokenType.LBRACKET);

    node.setAttribute('size', this._curTokenValue());

    this._consume(TokenType.NUM);
    this._consume(TokenType.RBRACKET);

    return node;
  }

  _consume(type) {
    if (type !== this._curTokenType()) {
      this._throwError();
    }

    this._lexer.getNextToken();
  }

  _curTokenType() {
    return this._lexer.curToken().getType();
  }

  _curTokenValue() {
    return this._lexer.curToken().getValue();
  }

  _throwError() {
    throw new Error(
      `Parsing Error: Unexpected token '${this._curTokenType()}'`
    );
  }
}

module.exports = { ArgsParser };
