const { Lexer } = require('./lexer/lexer');
const { Parser } = require('./parser/parser');
const { SemanticAnalyser } = require('./parser/semantic-analyser');
const { Source } = require('./source');
const { SymbolTable } = require('./parser/symbol-table');
const { Transpiler } = require('./transpiler/transpiler');

function kcuf(code) {
  const source = new Source(code);
  const lexer = new Lexer(source);
  const symTable = new SymbolTable();
  const parser = new Parser(source, lexer, symTable);
  const ast = parser.parse();
  new SemanticAnalyser(source, ast, symTable).analyse();
  const bf = new Transpiler(ast, symTable).transpile();

  return bf;
}

module.exports = { kcuf };
