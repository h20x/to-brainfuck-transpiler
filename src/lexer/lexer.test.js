const { Lexer } = require('./lexer');
const { Source } = require('../source');
const { TokenType: _ } = require('./token');

describe('Lexer', () => {
  test('should handle empty string', () => {
    ['', ' \t\n '].forEach((str) => {
      const lexer = createLexer(str);
      expect(lexer.getNextToken().type).toBe(_.EOF);
    });
  });

  test.each([
    // prettier-ignore
    [
      `var SET Inc dEc ADD sub MuL divMOD div mod CMp A2b b2A
       LSET lget ifeq ifneq wneQ PRoc end cAll read MSG`,
      [
        [_.VAR, 'var'], [_.SET, 'set'], [_.INC, 'inc'], [_.DEC, 'dec'],
        [_.ADD, 'add'], [_.SUB, 'sub'], [_.MUL, 'mul'], [_.DIVMOD, 'divmod'],
        [_.DIV, 'div'], [_.MOD, 'mod'], [_.CMP, 'cmp'], [_.A2B, 'a2b'],
        [_.B2A, 'b2a'], [_.LSET, 'lset'], [_.LGET, 'lget'], [_.IFEQ, 'ifeq'],
        [_.IFNEQ, 'ifneq'], [_.WNEQ, 'wneq'], [_.PROC, 'proc'], [_.END, 'end'],
        [_.CALL, 'call'], [_.READ, 'read'], [_.MSG, 'msg'],
        [_.EOF, null]
      ]
    ],
    [
      'A x $toString __proto__ PbZ9l_m4S$aTW8jy9eHsKxBTp9p3h',
      [
        [_.ID, 'a'],
        [_.ID, 'x'],
        [_.ID, '$tostring'],
        [_.ID, '__proto__'],
        [_.ID, 'pbz9l_m4s$atw8jy9ehskxbtp9p3h'],
        [_.EOF, null],
      ],
    ],
    [
      '0 -100 55',
      [
        [_.NUM, 0],
        [_.NUM, -100],
        [_.NUM, 55],
        [_.EOF, null],
      ],
    ],
    [
      `// This is a comment
       -- This is also a comment
       #  No doubt it is a comment
       rem &&Some comment~!@#$":<
       var a // ...
       var b// ...
       var c -- ...
       var d-- ...
       var e #  ...
       var f#  ...
       rem ...
       rem ...
       var g
       // ...`,
      [
        [_.VAR, 'var'],
        [_.ID, 'a'],
        [_.VAR, 'var'],
        [_.ID, 'b'],
        [_.VAR, 'var'],
        [_.ID, 'c'],
        [_.VAR, 'var'],
        [_.ID, 'd'],
        [_.VAR, 'var'],
        [_.ID, 'e'],
        [_.VAR, 'var'],
        [_.ID, 'f'],
        [_.VAR, 'var'],
        [_.ID, 'g'],
        [_.EOF, null],
      ],
    ],
    [
      `'a' '.' '-' '\\' '\\'' '\\"' '\\n' '\\r' '\\t'`,
      [
        [_.NUM, 97],
        [_.NUM, 46],
        [_.NUM, 45],
        [_.NUM, 92],
        [_.NUM, 39],
        [_.NUM, 34],
        [_.NUM, 10],
        [_.NUM, 13],
        [_.NUM, 9],
        [_.EOF, null],
      ],
    ],
    [
      `"" "abc \\" def"`,
      [
        [_.STR, ''],
        [_.STR, 'abc " def'],
        [_.EOF, null],
      ],
    ],
    [
      `[]`,
      [
        [_.LBRACKET, '['],
        [_.RBRACKET, ']'],
        [_.EOF, null],
      ],
    ],
    [
      `var F L[5] X
       var A B T -- a comment
       set A 'U' // a comment
       set F -1  #  a comment

       msg"Outer Before : "A B"\\n"
       call swap B A
       // a comment
       proc swap x y
         set T x
         call say T
       end
       rem a comment
       wneq F 0
         ifeq F 10
           set F 5
         end
         ifneq X 18
           msg F X
         end
       end`,
      // prettier-ignore
      [
        [_.VAR, 'var'], [_.ID, 'f'], [_.ID, 'l'], [_.LBRACKET, '['], [_.NUM, 5], [_.RBRACKET, ']'], [_.ID, 'x'],
        [_.VAR, 'var'], [_.ID, 'a'], [_.ID, 'b'], [_.ID, 't'],
        [_.SET, 'set'], [_.ID, 'a'], [_.NUM, 85],
        [_.SET, 'set'], [_.ID, 'f'], [_.NUM, -1],

        [_.MSG, 'msg'], [_.STR, 'Outer Before : '], [_.ID, 'a'], [_.ID, 'b'], [_.STR, '\n'],
        [_.CALL, 'call'], [_.ID, 'swap'], [_.ID, 'b'], [_.ID, 'a'],

        [_.PROC, 'proc'], [_.ID, 'swap'], [_.ID, 'x'], [_.ID, 'y'],
          [_.SET, 'set'], [_.ID, 't'], [_.ID, 'x'],
          [_.CALL, 'call'], [_.ID, 'say'], [_.ID, 't'],
        [_.END, 'end'],

        [_.WNEQ, 'wneq'], [_.ID, 'f'], [_.NUM, 0],
          [_.IFEQ, 'ifeq'], [_.ID, 'f'], [_.NUM, 10],
            [_.SET, 'set'], [_.ID, 'f'], [_.NUM, 5],
          [_.END, 'end'],
          [_.IFNEQ, 'ifneq'], [_.ID, 'x'], [_.NUM, 18],
            [_.MSG, 'msg'], [_.ID, 'f'], [_.ID, 'x'],
          [_.END, 'end'],
        [_.END, 'end'],

        [_.EOF, null],
      ],
    ],
  ])('should recognize: %s', (input, expected) => {
    const lexer = createLexer(input);

    expected.forEach(([type, value]) => {
      const token = lexer.getNextToken();

      expect(token.type).toBe(type);
      expect(token.value).toBe(value);
    });
  });

  test.each([`'0`, `"abc`])('should throw: %s', (input) => {
    const lexer = createLexer(input);

    expect(() => lexer.getNextToken()).toThrow();
  });

  test('token source position', () => {
    const lexer = createLexer(`a ab 123\n'a' "abc"`);

    [
      { line: 0, column: 0 },
      { line: 0, column: 2 },
      { line: 0, column: 5 },
      { line: 1, column: 0 },
      { line: 1, column: 4 },
    ].forEach((pos) => {
      expect(lexer.getNextToken().pos).toMatchObject(pos);
    });
  });
});

function createLexer(input) {
  return new Lexer(new Source(input));
}
