class Source {
  constructor(text) {
    this._text = text;
    this._lines = text.split('\n');
    this._line = 0;
    this._col = 0;
    this._idx = 0;
  }

  getPos() {
    return { index: this._idx, line: this._line, column: this._col };
  }

  setPos({ index, line, column }) {
    this._idx = index;
    this._line = line;
    this._col = column;
  }

  peek(len = 1) {
    return this._text.slice(this._idx, this._idx + len);
  }

  advance(n = 1) {
    let i = 0;

    while (i < n && !this.EOF()) {
      if (this.EOL()) {
        this._line++;
        this._col = -1;
      }

      this._idx++;
      this._col++;

      i++;
    }
  }

  skipLine() {
    while (!this.EOF() && !this.EOL()) {
      this.advance();
    }

    this.advance();
  }

  getLine(n) {
    return this._lines[n];
  }

  EOF() {
    return this._idx >= this._text.length;
  }

  EOL() {
    return '\n' === this.peek();
  }
}

module.exports = { Source };
