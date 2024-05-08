const { BFMBasic } = require('./bfm-basic');
const { VarTable } = require('./var-table');

class BFM extends BFMBasic {
  constructor() {
    super();
    this._dp = 0;
    this._ss = 0;
    this._se = 0;
    this._scopes = [new VarTable()];
  }

  enter(args) {
    const vt = new VarTable(this._globScope());

    for (const [name, alias] of args) {
      vt.addAlias(name, alias);
    }

    this._scopes.push(vt);
  }

  leave() {
    if (this._scopes.length > 1) {
      this._scopes.pop();
    }
  }

  decl(...vars) {
    if (this._ss !== this._se) {
      throw new Error('Stack is not empty');
    }

    for (const v of vars) {
      let name = v;
      let size = 1;

      if (Array.isArray(v)) {
        name = v[0];
        size = v[1] * 2 + 1;
      }

      if (name.startsWith('+')) {
        throw new Error(`A variable name can't start with '+'`);
      }

      this._globScope().add({ name, size, index: this._ss });

      this._ss += size;
      this._se += size;
    }
  }

  a2b(a, b, c, d) {
    const [_b, _c, t] = this._malloc(3);

    this.set(b, _b);
    this.set(c, _c);

    this.sub(a, 48, t);
    this.mul(t, 100, d);

    this.sub(_b, 48, t);
    this.mul(t, 10, t);
    this.add(t, d, d);

    this.sub(_c, 48, t);
    this.add(t, d, d);

    this._free(3);
  }

  b2a(a, b, c, d) {
    const [_a] = this._malloc();

    this.set(a, _a);

    this.div(_a, 100, b);
    this.add(b, 48, b);

    this.div(_a, 10, c);
    this.mod(c, 10, c);
    this.add(c, 48, c);

    this.mod(_a, 10, d);
    this.add(d, 48, d);

    this._free();
  }

  lset(a, b, c) {
    const [_c] = this._malloc();

    this.set(c, _c);
    this._setpArr(a, b);
    this.clr();
    this._retpArr(a);

    this.loop(() => {
      this.dec();
      this._setpArr(a, b);
      this.inc();
      this._retpArr(a);
    }, _c);

    this._free();
  }

  lget(a, b, c) {
    const [t] = this._malloc();

    this.clr(c);

    this._setpArr(a, b);
    this.loop(() => {
      this.dec();
      this._retpArr(a);
      this.inc(1, t);
      this._setpArr(a, b);
    });
    this._retpArr(a);

    this._setp(t);
    this.loop(() => {
      this.dec();
      this._setpArr(a, b);
      this.inc();
      this._retpArr(a);
      this.inc(1, c);
      this._setp(t);
    });

    this._free();
  }

  add(a, b, c) {
    const [t] = this._malloc();

    this.set(a, t);
    this.inc(b, t);
    this.set(t, c);

    this._free();
  }

  sub(a, b, c) {
    const [t] = this._malloc();

    this.set(a, t);
    this.dec(b, t);
    this.set(t, c);

    this._free();
  }

  mul(a, b, c) {
    const [_a, _b] = this._malloc(2);

    this.set(a, _a);
    this.set(b, _b);
    this.set(0, c);

    this.loop(() => {
      this.dec();
      this.inc(_a, c);
    }, _b);

    this._free(2);
  }

  div(a, b, c) {
    this.divmod(a, b, c);
  }

  mod(a, b, c) {
    const [_c] = this._malloc();
    const _d = c;

    this.divmod(a, b, _c, _d);
    this._free();
  }

  divmod(a, b, c, d) {
    const [_a, _b, _cmp] = this._malloc(3);

    this.set(a, _a);
    this.set(b, _b);

    this.set(0, c);
    d && this.set(0, d);

    this.loop(() => {
      this.cmp(_a, _b, _cmp);
      this.cond(
        _cmp,
        -1,
        () => {
          d && this.set(_a, d);
          this.set(0, _a);
        },
        () => {
          this.inc(1, c);
          this.dec(_b, _a);
        }
      );
    }, _a);

    this._free(3);
  }

  cmp(a, b, c) {
    const eq = () => this.set(0, c);

    const neq = () => {
      const [_a, _b, _c] = this._malloc(3);

      this.set(a, _a);
      this.set(b, _b);
      this.set(1, _c);

      this.loop(() => {
        this.cond(_a, 0, () => {
          this.set(-1, c);
          this.set(0, _c);
        });

        this.cond(_b, 0, () => {
          this.set(1, c);
          this.set(0, _c);
        });

        this.dec(1, _a);
        this.dec(1, _b);
      }, _c);

      this._free(3);
    };

    this.cond(a, b, eq, neq);
  }

  wneq(a, b, body) {
    const [c] = this._malloc();

    this.set(1, c);
    this.loop(() => {
      this.cond(a, b, () => this.set(0, c), body);
    }, c);

    this._free();
  }

  cond(a, b, eq, neq) {
    const [c1, c2] = this._malloc(2);

    this.set(a, c1);
    this.dec(b, c1);
    this.set(1, c2);

    this.loop(() => {
      neq && neq();
      this.set(0, c1);
      this.set(0, c2);
    }, c1);

    this.loop(() => {
      eq && eq();
      this.set(0, c2);
    }, c2);

    this._free(2);
  }

  set(n, a) {
    this.clr(a);
    this.inc(n, a);
  }

  inc(n, a) {
    if (null == a) {
      return super.inc(n);
    }

    if ('number' === typeof n) {
      this._setp(a);
      this.inc(n);

      return;
    }

    const [t] = this._malloc();

    this.loop(() => {
      this.dec();
      this._setp(t);
      this.inc();
    }, n);

    this.loop(() => {
      this.dec();
      this._setp(a);
      this.inc();
      this._setp(n);
      this.inc();
    }, t);

    this._free();
  }

  dec(n, a) {
    if (null == a) {
      return super.dec(n);
    }

    if ('number' === typeof n) {
      this._setp(a);
      this.dec(n);

      return;
    }

    const [t] = this._malloc();

    this.loop(() => {
      this.dec();
      this._setp(t);
      this.inc();
    }, n);

    this.loop(() => {
      this.dec();
      this._setp(a);
      this.dec();
      this._setp(n);
      this.inc();
    }, t);

    this._free();
  }

  loop(body, id) {
    id && this._setp(id);
    super.loop(() => {
      body();
      id && this._setp(id);
    });
  }

  in(id) {
    id && this._setp(id);
    super.in();
  }

  out(id) {
    id && this._setp(id);
    super.out();
  }

  outStr(s) {
    const [t] = this._malloc();
    let c = 0;

    for (const ch of s) {
      const code = ch.charCodeAt();

      this.inc(code - c, t);
      this.out(t);
      c = code;
    }

    this._free();
  }

  clr(id) {
    id && this._setp(id);
    super.clr();
  }

  _setpArr(a, b) {
    const i = this._idx(a);
    const s = `+${i + 1}`;

    this.set(b, s);
    this._setp(s);

    this.loop(() => {
      this.incp();
      this.clr();
      this.decp();

      this.loop(() => {
        this.dec();
        this.incp();
        this.inc();
        this.decp();
      });

      this.inc();
      this.incp();
      this.dec();
    });

    this.inc();
    this.incp(Math.floor(this._size(a) / 2));
  }

  _retpArr(a) {
    this.decp(Math.floor(this._size(a) / 2));
    this.loop(() => this.decp());
    this.incp();
  }

  _malloc(n = 1) {
    const ids = Array.from({ length: n }, (_, i) => `+${this._se + i}`);
    this._se += n;

    return ids;
  }

  _free(n = 1) {
    while (this._se > this._ss && n > 0) {
      this.clr('+' + (this._se - 1));
      this._se--;
      n--;
    }
  }

  _setp(id) {
    const i = this._idx(id);
    const n = this._dp - i;

    this._dp = i;
    n > 0 ? this.decp(n) : this.incp(-n);
  }

  _idx(id) {
    let i;

    if (id.startsWith('+')) {
      i = +id;
    } else {
      i = (this._curScope().get(id) || { index: -1 }).index;
    }

    if (i < 0 || i >= this._se) {
      throw new Error(`Out of range. Index: ${i}`);
    }

    return i;
  }

  _size(id) {
    return this._curScope().get(id).size;
  }

  _curScope() {
    return this._scopes[this._scopes.length - 1];
  }

  _globScope() {
    return this._scopes[0];
  }
}

module.exports = { BFM };
