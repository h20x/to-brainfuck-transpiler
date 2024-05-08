const { SemanticAnalyser } = require('./semantic-analyser');
const { Parser } = require('./parser');
const { Lexer } = require('../lexer/lexer');
const { Source } = require('../source');
const { SymbolTable } = require('./symbol-table');

describe('SemanticAnalyser', () => {
  test.each([
    [
      `var Q
       add Q Q S`,
      `'s' is not defined`,
    ],
    [
      `var A B[20]
       lset B B 20`,
      `'b' is not a variable`,
    ],
    [
      `var A B[20]
       lset A 0 20`,
      `'a' is not an array`,
    ],
    [`call whatever`, `'whatever' is not defined`],
    [
      `var x
       proc a b c
       end
       call a x`,
      `Wrong number of params for 'a' procedure`,
    ],
    [
      `var x
       ifeq x 10
         set y 5
       end`,
      `'y' is not defined`,
    ],
    [
      `var x
       call pr x
       proc pr a
         set a 0
         set b 1
       end`,
      `'b' is not defined`,
    ],
    [
      `var a
       set a 20
       call wrap a
       proc say x
         msg "It is "x
         call wrap x
       end
       proc wrap x
         call say x
       end`,
      `Recursive call detected:\nsay -> wrap -> say`,
    ],
  ])('should throw: %s', (program, errMsg) => {
    const source = new Source(program);
    const lexer = new Lexer(source);
    const symTable = new SymbolTable();
    const parser = new Parser(source, lexer, symTable);
    const ast = parser.parse();
    const analyser = new SemanticAnalyser(source, ast, symTable);

    expect(() => analyser.analyse()).toThrow(errMsg);
  });
});
