const { SymbolTable } = require('./symbol-table');
const { Sym, SymbolType } = require('./symbol');

describe('SymbolTable', () => {
  test('should work', () => {
    const parent = new SymbolTable();
    const table = new SymbolTable(parent);

    parent.add(new Sym('a', SymbolType.VAR));
    table.add(new Sym('b', SymbolType.VAR));

    expect(table.has('a')).toBe(true);
    expect(table.has('b')).toBe(true);
    expect(table.has('c')).toBe(false);

    expect(table.get('a')).toBeInstanceOf(Sym);
    expect(table.get('b')).toBeInstanceOf(Sym);
    expect(table.get('c')).toBe(null);
  });
});
