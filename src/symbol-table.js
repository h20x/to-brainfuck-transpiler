class SymbolTable {
  constructor(parent = null) {
    this._table = new Map();
    this._parent = parent;
  }

  add(symbol) {
    this._table.set(symbol.name, symbol);
  }

  get(name) {
    if (this._table.has(name)) {
      return this._table.get(name);
    }

    if (null != this._parent) {
      return this._parent.get(name);
    }

    return null;
  }

  has(name) {
    return null != this.get(name);
  }

  parent() {
    return this._parent;
  }
}

module.exports = { SymbolTable };
