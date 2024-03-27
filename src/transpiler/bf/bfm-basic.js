class BFMBasic {
  constructor() {
    this._code = '';
  }

  code() {
    return this._code;
  }

  inc(n = 1) {
    this._put(n > 0 ? '+'.repeat(n) : '-'.repeat(-n));
  }

  dec(n = 1) {
    this._put(n > 0 ? '-'.repeat(n) : '+'.repeat(-n));
  }

  incp(n = 1) {
    this._put('>'.repeat(n));
  }

  decp(n = 1) {
    this._put('<'.repeat(n));
  }

  loop(body) {
    this._put('[');
    body();
    this._put(']');
  }

  in() {
    this._put(',');
  }

  out() {
    this._put('.');
  }

  clr() {
    this._put('[-]');
  }

  _put(code) {
    this._code += code;
  }
}

module.exports = { BFMBasic };
