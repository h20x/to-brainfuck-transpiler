class ParsingError extends Error {
  constructor(o) {
    super();
    this.message = this._getMsg(o);
  }

  _getMsg({ src, msg, col, ln }) {
    const lines = [];

    for (let i = -1; i <= 2; i++) {
      ln + i >= 0 && lines.push(ln + i);
    }

    const pad = Math.max(...lines.map((n) => String(n + 1).length));
    const output = [];

    for (const n of lines) {
      const sourceLine = src.getLine(n);

      if (null == sourceLine) {
        continue;
      }

      const lineNum = String(n + 1).padStart(pad, ' ');

      output.push(`${lineNum} | ${sourceLine}`);

      if (n === ln) {
        output.push(`${' '.repeat(pad)} | ${' '.repeat(col)}^`);
      }
    }

    output.push(`\n${ln + 1}:${col + 1}: ${msg}`);

    return output.join('\n');
  }
}

module.exports = { ParsingError };
