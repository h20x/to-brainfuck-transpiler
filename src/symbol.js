const { createEnum } = require('./enum');

const SymbolType = createEnum(['VAR', 'ARR', 'PROC']);

class Sym {
  constructor(name, type, astNode = null) {
    this._name = name.toLowerCase();
    this._type = type;
    this._astNode = astNode;
  }

  name() {
    return this._name;
  }

  type() {
    return this._type;
  }

  node() {
    return this._astNode;
  }
}

module.exports = { Sym, SymbolType };
