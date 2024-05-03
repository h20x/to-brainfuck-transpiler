const { SemanticAnalyser } = require('./semantic-analyser');
const { Parser } = require('./parser');
const { Lexer } = require('./lexer');
const { Source } = require('./source');
const { ErrorNotifier } = require('./error-notifier');

describe('SemanticAnalyser', () => {
  test.each([
    ['var Q q', `'q' is already declared`],
    [
      `var Q
       var Q[20]`,
      `'q' is already declared`,
    ],
    [
      `proc a
       end
       proc a
       end`,
      `'a' is already declared`,
    ],
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
      `Wrong number of arguments for 'a' procedure`,
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
    const errNotifier = new ErrorNotifier(source);
    const lexer = new Lexer(source, errNotifier);
    const parser = new Parser(lexer, errNotifier);
    const analyser = new SemanticAnalyser(errNotifier);

    expect(() => analyser.visit(parser.parse())).toThrow(errMsg);
  });
});
