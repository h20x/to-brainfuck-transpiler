const { createEnum } = require('../enum');

const SymbolType = createEnum(['VAR', 'ARR', 'PROC']);

class Sym {
  constructor(name, type, node = null) {
    this.name = name;
    this.type = type;
    this.node = node;
  }
}

module.exports = { Sym, SymbolType };
