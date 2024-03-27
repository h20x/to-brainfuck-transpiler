class VarTable {
  constructor(parent) {
    this._parent = parent;
    this._vars = new Map();
  }

  add(rec) {
    this._vars.set(rec.name.toLowerCase(), rec);
  }

  addAlias(name, alias) {
    this._vars.set(alias.toLowerCase(), this.get(name));
  }

  get(name) {
    name = name.toLowerCase();

    if (!this._vars.has(name)) {
      return this._parent && this._parent.get(name);
    }

    return this._vars.get(name);
  }
}

module.exports = { VarTable };
