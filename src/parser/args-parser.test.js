const { ArgsParser } = require('./args-parser');
const { Lexer } = require('../lexer');
const { astToString } = require('./ast-to-string');

describe('ArgsParser', () => {
  test.each([
    [`a`, `id`, `ID 'a'`],
    [`0`, `num`, `NUM 0`],
    [`'a'`, `ch`, `CHAR 'a'`],
    [`"abc"`, `str`, `STR 'abc'`],
    [`a[1]`, `lst`, `LIST 'a' 1`],
    [
      `a 0 'a' "abc" a[1]`,
      `id, num, ch, str, lst`,
      `ID 'a' NUM 0 CHAR 'a' STR 'abc' LIST 'a' 1`,
    ],
    [
      `a 0 'a' "abc" a[1]`,
      `id|num|ch|str|lst, id|num|ch|str|lst, id|num|ch|str|lst, id|num|ch|str|lst, id|num|ch|str|lst`,
      `ID 'a' NUM 0 CHAR 'a' STR 'abc' LIST 'a' 1`,
    ],
    [``, `id*`, ``],
    [`a`, `id+`, `ID 'a'`],
    [`a`, `id, num*`, `ID 'a'`],
    [`a b c`, `id+`, `ID 'a' ID 'b' ID 'c'`],
    [`a 0 1`, `id, id|num+`, `ID 'a' NUM 0 NUM 1`],
  ])('should parse: %s', (code, pattern, expected) => {
    const result = createParser(code)
      .parse(pattern)
      .map((node) => astToString(node))
      .join(' ');

    expect(result).toBe(expected);
  });

  test.each([
    [`a`, `id, id`],
    [`a`, `num`],
    [`a`, `id, num+`],
    [`a 0`, `id, id|ch`],
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
