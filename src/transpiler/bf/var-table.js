class VarTable {
  constructor(parent) {
    this._parent = parent;
    this._vars = new Map();
  }

  add(rec) {
    this._vars.set(rec.name, rec);
  }

  addAlias(name, alias) {
    this._vars.set(alias, this.get(name));
  }

  get(name) {
    if (!this._vars.has(name)) {
      return this._parent && this._parent.get(name);
    }

    return this._vars.get(name);
  }
}

module.exports = { VarTable };
