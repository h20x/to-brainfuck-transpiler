const { ArgsParser } = require('./args-parser');
const { Lexer } = require('../lexer');
const { astToString } = require('../ast');

describe('ArgsParser', () => {
  test.each([
    [`a`, `vardecl`, `VAR_DECL 'a'`],
    [`a`, `var`, `VAR 'a'`],
    [`a`, `arr`, `ARR 'a'`],
    [`a`, `proc`, `PROC 'a'`],
    [`0`, `num`, `NUM '0'`],
    [`'a'`, `ch`, `CHAR 'a'`],
    [`"abc"`, `str`, `STR 'abc'`],
    [`a[1]`, `arrdecl`, `ARR_DECL 'a[1]'`],
    [
      `a b 0 'a' "abc"`,
      `var, arr, num, ch, str`,
      `VAR 'a' ARR 'b' NUM '0' CHAR 'a' STR 'abc'`,
    ],
    [
      `a b c[1]`,
      `vardecl|arrdecl, vardecl|arrdecl, vardecl|arrdecl`,
      `VAR_DECL 'a' VAR_DECL 'b' ARR_DECL 'c[1]'`,
    ],
    [
      `'a' "abc" 0`,
      `num|ch|str, num|ch|str, num|ch|str`,
      `CHAR 'a' STR 'abc' NUM '0'`,
    ],
    [``, `var*`, ``],
    [`a`, `var+`, `VAR 'a'`],
    [`a`, `var, num*`, `VAR 'a'`],
    [`a b c`, `var+`, `VAR 'a' VAR 'b' VAR 'c'`],
    [`a 0 1`, `var, var|num+`, `VAR 'a' NUM '0' NUM '1'`],
    [`a b c`, `proc, var*`, `PROC 'a' VAR 'b' VAR 'c'`],
  ])('should parse: %s', (code, pattern, expected) => {
    const result = createParser(code)
      .parse(pattern)
      .map((node) => astToString(node))
      .join(' ');

    expect(result).toBe(expected);
  });

  test.each([
    [`a`, `var, var`],
    [`a`, `num`],
    [`a`, `var, num+`],
    [`a 0`, `var, var|ch`],
  ])('should throw: %s', (code, pattern) => {
    expect(() => createParser(code).parse(pattern)).toThrow();
  });
});

function createParser(code) {
  const lexer = new Lexer(code);
  const parser = new ArgsParser(lexer);
  lexer.getNextToken();

  return parser;
}
