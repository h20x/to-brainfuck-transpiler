const { ParsingError } = require('../parsing-error');
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

  getCurToken() {
    return this._curToken;
  }

  _nextToken() {
    this._skipComments();

    const tokenPos = this._source.pos();
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

      case this._isElem("'"):
        tokenType = TokenType.NUM;
        tokenValue = this._readChar().charCodeAt();
        break;

      case this._isElem('"'):
        tokenType = TokenType.STR;
        tokenValue = this._readString();
        break;

      case this._isElem('['):
        tokenType = TokenType.LBRACKET;
        tokenValue = this._readElem();
        break;

      case this._isElem(']'):
        tokenType = TokenType.RBRACKET;
        tokenValue = this._readElem();
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
      word += this._readElem();
    }

    return word;
  }

  _readNum() {
    let num = '';

    do {
      num += this._readElem();
    } while (this._isDigit());

    return num;
  }

  _readChar() {
    let s = this._source.peek(4);

    if (/'(\\'|\\"|\\n|\\r|\\t)'/.test(s)) {
      this._source.advance(4);

      return this._escape(s[2]);
    }

    s = this._source.peek(3);

    if (/'[^'"\n]'/.test(s)) {
      this._source.advance(3);

      return s[1];
    }

    this._error('Invalid CHAR');
  }

  _readString() {
    const pos = this._source.pos();

    this._source.advance();

    const closingQuote = () => {
      return this._isElem('"') && '\\' !== str[str.length - 1];
    };

    const endOfString = () => {
      return this._source.EOL() || this._source.EOF() || closingQuote();
    };

    let str = '';

    while (!endOfString()) {
      str += this._readElem();
    }

    if (!this._isElem('"')) {
      this._error('Unclosed string', pos);
    }

    str = str.replace(/\\(.)/g, (_, p) => this._escape(p));

    this._source.advance();

    return str;
  }

  _escape(ch) {
    switch (ch) {
      case 'n':
        return '\n';

      case 'r':
        return '\r';

      case 't':
        return '\t';

      default:
        return ch;
    }
  }

  _readElem() {
    const el = this._source.peek();
    this._source.advance();

    return el;
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

  _isElem(el) {
    return el === this._source.peek();
  }

  _error(msg, { column, line } = this._source.pos()) {
    throw new ParsingError({
      msg,
      src: this._source,
      col: column,
      ln: line,
    });
  }
}

module.exports = { Lexer };
