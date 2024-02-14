const { Token, TokenType } = require('./token');

// prettier-ignore
const RESERVED_WORDS = new Set([
  'var', 'set', 'inc', 'dec', 'add', 'sub', 'mul', 'divmod',
  'div', 'mod', 'cmp', 'a2b', 'b2a', 'lset', 'lget', 'ifeq',
  'ifneq', 'wneq', 'proc', 'end', 'call', 'read', 'msg', 'rem',
]);

class Lexer {
  constructor(program) {
    this._program = program;
    this._pos = 0;
    this._curToken = null;
  }

  getNextToken() {
    return (this._curToken = this._nextToken());
  }

  peekNextToken() {
    const pos = this._pos;
    const token = this._nextToken();
    this._pos = pos;

    return token;
  }

  getCurToken() {
    return this._curToken;
  }

  _nextToken() {
    this._skipComments();

    if (this._isEOF()) {
      return new Token(TokenType.EOF, null);
    }

    if (this._isNum()) {
      return new Token(TokenType.NUM, Number(this._readNum()));
    }

    if (this._isSym("'")) {
      return new Token(TokenType.CHAR, this._readChar());
    }

    if (this._isSym('"')) {
      return new Token(TokenType.STR, this._readString());
    }

    if (this._isSym('[')) {
      return new Token(TokenType.LBRACKET, this._readSym());
    }

    if (this._isSym(']')) {
      return new Token(TokenType.RBRACKET, this._readSym());
    }

    if (this._isLetter$_()) {
      const word = this._readWord();
      const tokenType = RESERVED_WORDS.has(word.toLowerCase())
        ? TokenType[word.toUpperCase()]
        : TokenType.ID;

      return new Token(tokenType, word);
    }

    this._throwError();
  }

  _advance(n = 1) {
    for (let i = 0; i < n; i++) {
      this._pos++;
    }
  }

  _peek(len = 1) {
    let str = '';

    for (let i = this._pos; i < this._pos + len; i++) {
      str += i < this._program.length ? this._program[i] : '';
    }

    return str;
  }

  _skipComments() {
    this._skipWS();

    while (this._isComment()) {
      this._skipLine();
      this._skipWS();
    }
  }

  _skipWS() {
    while (this._isWS()) {
      this._advance();
    }
  }

  _skipLine() {
    while (!this._isEOF() && !this._isEOL()) {
      this._advance();
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
    let str = this._peek(4);

    if (/'(\\'|\\"|\\n|\\r|\\t)'/.test(str)) {
      this._advance(4);

      return str[1] + str[2];
    }

    str = this._peek(3);

    if (/'[^'"]'/.test(str)) {
      this._advance(3);

      return str[1];
    }

    this._throwError();
  }

  _readString() {
    this._advance();

    const isClosingQuote = () => {
      return this._isSym('"') && '\\' !== prevChar;
    };

    let str = '';
    let prevChar = '';

    while (!this._isEOL() && !this._isEOF() && !isClosingQuote()) {
      prevChar = this._readSym();
      str += prevChar;
    }

    if (!this._isSym('"')) {
      this._throwError();
    }

    this._advance();

    return str;
  }

  _readSym() {
    const sym = this._peek();
    this._advance();

    return sym;
  }

  _isEOF() {
    return this._pos >= this._program.length;
  }

  _isEOL() {
    return '\n' === this._peek();
  }

  _isComment() {
    return /^rem|^#|\/\/|--/i.test(this._peek(3));
  }

  _isWS() {
    return /\s/.test(this._peek());
  }

  _isLetter$_() {
    return /[a-zA-Z]|\$|_/.test(this._peek());
  }

  _isDigit() {
    return /\d/.test(this._peek());
  }

  _isNum() {
    return /^-?\d/.test(this._peek(2));
  }

  _isSym(sym) {
    return sym === this._peek();
  }

  _throwError() {
    throw new Error('Lexing error');
  }
}

module.exports = { Lexer };
