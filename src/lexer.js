const { Token, TokenType } = require('./token');

// prettier-ignore
const RESERVED_WORDS = new Set([
  'var', 'set', 'inc', 'dec', 'add', 'sub', 'mul', 'divmod',
  'div', 'mod', 'cmp', 'a2b', 'b2a', 'lset', 'lget', 'ifeq',
  'ifneq', 'wneq', 'proc', 'end', 'call', 'read', 'msg', 'rem',
]);

class Lexer {
  constructor(source, errNotifier) {
    this._source = source;
    this._curToken = null;
    this._errNotifier = errNotifier;
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

    // prettier-ignore
    if (this._source.EOF()) {
      tokenType = TokenType.EOF;
    }

    else if (this._isNum()) {
      tokenType = TokenType.NUM;
      tokenValue = Number(this._readNum());
    }

    else if (this._isSym("'")) {
      tokenType = TokenType.CHAR;
      tokenValue = this._readChar();
    }

    else if (this._isSym('"')) {
      tokenType = TokenType.STR;
      tokenValue = this._readString();
    }

    else if (this._isSym('[')) {
      tokenType = TokenType.LBRACKET;
      tokenValue = this._readSym();
    }

    else if (this._isSym(']')) {
      tokenType = TokenType.RBRACKET;
      tokenValue = this._readSym();
    }

    else if (this._isLetter$_()) {
      tokenValue = this._readWord();
      tokenType = RESERVED_WORDS.has(tokenValue.toLowerCase())
        ? TokenType[tokenValue.toUpperCase()]
        : TokenType.ID;
    }

    else {
      this._errNotifier.notify('Unexpected character', this._source.getPos());
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
      word += this._readSym();
    }

    return word;
  }

  _readNum() {
    let num = '';

    do {
      num += this._readSym();
    } while (this._isDigit());

    return num;
  }

  _readChar() {
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

    this._errNotifier.notify('Invalid CHAR', this._source.getPos());
  }

  _readString() {
    const pos = this._source.getPos();

    this._source.advance();

    const closingQuote = () => {
      return this._isSym('"') && '\\' !== str[str.length - 1];
    };

    const endOfString = () => {
      return this._source.EOL() || this._source.EOF() || closingQuote();
    };

    let str = '';

    while (!endOfString()) {
      str += this._readSym();
    }

    if (!this._isSym('"')) {
      this._errNotifier.notify('Unclosed string', pos);
    }

    this._source.advance();

    return str;
  }

  _readSym() {
    const sym = this._source.peek();
    this._source.advance();

    return sym;
  }

  _isComment() {
    return /^rem|^#|\/\/|--/i.test(this._source.peek(3));
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

  _isSym(sym) {
    return sym === this._source.peek();
  }
}

module.exports = { Lexer };
