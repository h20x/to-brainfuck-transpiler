const { ParsingError } = require('./parsing-error');
const { Token, TokenType } = require('./token');

// prettier-ignore
const RESERVED_WORDS = new Set([
  'var', 'set', 'inc', 'dec', 'add', 'sub', 'mul', 'divmod',
  'div', 'mod', 'cmp', 'a2b', 'b2a', 'lset', 'lget', 'ifeq',
  'ifneq', 'wneq', 'proc', 'end', 'call', 'read', 'msg', 'rem',
]);

class Lexer {
  constructor(source) {
    this._source = source;
    this._curToken = null;
  }

  getNextToken() {
    return (this._curToken = this._nextToken());
  }

  peekNextToken() {
    const pos = this._source.getPos();
    const token = this._nextToken();
    this._source.setPos(pos);

    return token;
  }

  getCurToken() {
    return this._curToken;
  }

  _nextToken() {
    this._skipComments();

    const tokenPos = this._source.getPos();
    let tokenType = null;
    let tokenValue = null;

    switch (true) {
      case this._source.EOF():
        tokenType = TokenType.EOF;
        break;

      case this._isNum():
        tokenType = TokenType.NUM;
        tokenValue = Number(this._readNum());
        break;

      case this._isChar("'"):
        tokenType = TokenType.CHAR;
        tokenValue = this._readCharLiteral();
        break;

      case this._isChar('"'):
        tokenType = TokenType.STR;
        tokenValue = this._readString();
        break;

      case this._isChar('['):
        tokenType = TokenType.LBRACKET;
        tokenValue = this._readChar();
        break;

      case this._isChar(']'):
        tokenType = TokenType.RBRACKET;
        tokenValue = this._readChar();
        break;

      case this._isLetter$_():
        tokenValue = this._readWord().toLowerCase();
        tokenType = RESERVED_WORDS.has(tokenValue)
          ? TokenType[tokenValue.toUpperCase()]
          : TokenType.ID;
        break;

      default:
        this._error(`Unexpected character: ${this._source.peek()}`);
    }

    return new Token(tokenType, tokenValue, tokenPos);
  }

  _skipComments() {
    this._skipWS();

    while (this._isComment()) {
      this._source.skipLine();
      this._skipWS();
    }
  }

  _skipWS() {
    while (this._isWS()) {
      this._source.advance();
    }
  }

  _readWord() {
    let word = '';

    while (this._isLetter$_() || this._isDigit()) {
      word += this._readChar();
    }

    return word;
  }

  _readNum() {
    let num = '';

    do {
      num += this._readChar();
    } while (this._isDigit());

    return num;
  }

  _readCharLiteral() {
    let str = this._source.peek(4);

    if (/'(\\'|\\"|\\n|\\r|\\t)'/.test(str)) {
      this._source.advance(4);

      return str[1] + str[2];
    }

    str = this._source.peek(3);

    if (/'[^'"]'/.test(str)) {
      this._source.advance(3);

      return str[1];
    }

    this._error('Invalid CHAR');
  }

  _readString() {
    const pos = this._source.getPos();

    this._source.advance();

    const closingQuote = () => {
      return this._isChar('"') && '\\' !== str[str.length - 1];
    };

    const endOfString = () => {
      return this._source.EOL() || this._source.EOF() || closingQuote();
    };

    let str = '';

    while (!endOfString()) {
      str += this._readChar();
    }

    if (!this._isChar('"')) {
      this._error('Unclosed string', pos);
    }

    this._source.advance();

    return str;
  }

  _readChar() {
    const ch = this._source.peek();
    this._source.advance();

    return ch;
  }

  _isComment() {
    return /^rem|^#|^\/\/|^--/i.test(this._source.peek(3));
  }

  _isWS() {
    return /\s/.test(this._source.peek());
  }

  _isLetter$_() {
    return /[a-zA-Z]|\$|_/.test(this._source.peek());
  }

  _isDigit() {
    return /\d/.test(this._source.peek());
  }

  _isNum() {
    return /^-?\d/.test(this._source.peek(2));
  }

  _isChar(ch) {
    return ch === this._source.peek();
  }

  _error(msg, pos = this._source.getPos()) {
    throw new ParsingError({
      msg,
      src: this._source,
      col: pos.column,
      ln: pos.line,
    });
  }
}

module.exports = { Lexer };
