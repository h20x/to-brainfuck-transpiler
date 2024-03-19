class ErrorNotifier {
  constructor(source) {
    this._source = source;
  }

  notify(errMsg, { line, column }) {
    const lines = [];

    for (let i = -1; i <= 2; i++) {
      line + i >= 0 && lines.push(line + i);
    }

    const pad = Math.max(...lines.map((n) => String(n + 1).length));
    const msg = [];

    for (const n of lines) {
      const sourceLine = this._source.getLine(n);

      if (null == sourceLine) {
        continue;
      }

      const lineNum = String(n + 1).padStart(pad, ' ');

      msg.push(`${lineNum} | ${sourceLine}`);

      if (n === line) {
        msg.push(`${' '.repeat(pad)} | ${' '.repeat(column)}^`);
      }
    }

    msg.push(`\n${line + 1}:${column + 1}: ${errMsg}`);

    throw new Error(msg.join('\n'));
  }
}

module.exports = { ErrorNotifier };
