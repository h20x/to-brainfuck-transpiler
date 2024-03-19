const { Lexer } = require('./lexer');
const { Source } = require('./source');
const { ErrorNotifier } = require('./error-notifier');
const { TokenType: _ } = require('./token');

describe('Lexer', () => {
  test('should handle empty string', () => {
    ['', ' \t\n '].forEach((str) => {
      const lexer = createLexer(str);
      expect(lexer.getNextToken().getType()).toBe(_.EOF);
    });
  });

  test.each([
    // prettier-ignore
    [
      `var SET Inc dEc ADD sub MuL divMOD div mod CMp A2b b2A
       LSET lget ifeq ifneq wneQ PRoc end cAll read MSG`,
      [
        [_.VAR, 'var'], [_.SET, 'SET'], [_.INC, 'Inc'], [_.DEC, 'dEc'],
        [_.ADD, 'ADD'], [_.SUB, 'sub'], [_.MUL, 'MuL'], [_.DIVMOD, 'divMOD'],
        [_.DIV, 'div'], [_.MOD, 'mod'], [_.CMP, 'CMp'], [_.A2B, 'A2b'],
        [_.B2A, 'b2A'], [_.LSET, 'LSET'], [_.LGET, 'lget'], [_.IFEQ, 'ifeq'],
        [_.IFNEQ, 'ifneq'], [_.WNEQ, 'wneQ'], [_.PROC, 'PRoc'], [_.END, 'end'],
        [_.CALL, 'cAll'], [_.READ, 'read'], [_.MSG, 'MSG'],
        [_.EOF, null]
      ]
    ],
    [
      'A x $toString __proto__ PbZ9l_m4S$aTW8jy9eHsKxBTp9p3h',
      [
        [_.ID, 'A'],
        [_.ID, 'x'],
        [_.ID, '$toString'],
        [_.ID, '__proto__'],
        [_.ID, 'PbZ9l_m4S$aTW8jy9eHsKxBTp9p3h'],
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
       var b -- ...
       var c #  ...
       rem ...
       rem ...
       var d
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
        [_.EOF, null],
      ],
    ],
    [
      `'a' '.' '-' '\\' '\\'' '\\"' '\\n' '\\r' '\\t'`,
      [
        [_.CHAR, 'a'],
        [_.CHAR, '.'],
        [_.CHAR, '-'],
        [_.CHAR, '\\'],
        [_.CHAR, "\\'"],
        [_.CHAR, '\\"'],
        [_.CHAR, '\\n'],
        [_.CHAR, '\\r'],
        [_.CHAR, '\\t'],
        [_.EOF, null],
      ],
    ],
    [
      `"" "abc \\" def"`,
      [
        [_.STR, ''],
        [_.STR, 'abc \\" def'],
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
        [_.VAR, 'var'], [_.ID, 'F'], [_.ID, 'L'], [_.LBRACKET, '['], [_.NUM, 5], [_.RBRACKET, ']'], [_.ID, 'X'],
        [_.VAR, 'var'], [_.ID, 'A'], [_.ID, 'B'], [_.ID, 'T'],
        [_.SET, 'set'], [_.ID, 'A'], [_.CHAR, 'U'],
        [_.SET, 'set'], [_.ID, 'F'], [_.NUM, -1],

        [_.MSG, 'msg'], [_.STR, 'Outer Before : '], [_.ID, 'A'], [_.ID, 'B'], [_.STR, '\\n'],
        [_.CALL, 'call'], [_.ID, 'swap'], [_.ID, 'B'], [_.ID, 'A'],

        [_.PROC, 'proc'], [_.ID, 'swap'], [_.ID, 'x'], [_.ID, 'y'],
          [_.SET, 'set'], [_.ID, 'T'], [_.ID, 'x'],
          [_.CALL, 'call'], [_.ID, 'say'], [_.ID, 'T'],
        [_.END, 'end'],

        [_.WNEQ, 'wneq'], [_.ID, 'F'], [_.NUM, 0],
          [_.IFEQ, 'ifeq'], [_.ID, 'F'], [_.NUM, 10],
            [_.SET, 'set'], [_.ID, 'F'], [_.NUM, 5],
          [_.END, 'end'],
          [_.IFNEQ, 'ifneq'], [_.ID, 'X'], [_.NUM, 18],
            [_.MSG, 'msg'], [_.ID, 'F'], [_.ID, 'X'],
          [_.END, 'end'],
        [_.END, 'end'],

        [_.EOF, null],
      ],
    ],
  ])('should recognize: %s', (input, expected) => {
    const lexer = createLexer(input);

    expected.forEach(([type, value]) => {
      const token = lexer.getNextToken();

      expect(token.getType()).toBe(type);
      expect(token.getValue()).toBe(value);
    });
  });

  test.each([`'0`, `"abc`])('should throw: %s', (input) => {
    const lexer = createLexer(input);

    expect(() => lexer.getNextToken()).toThrow();
  });

  test('peekNextToken()', () => {
    const lexer = createLexer('x 0');

    lexer.getNextToken();
    expect(lexer.getCurToken().getType()).toBe(_.ID);

    expect(lexer.peekNextToken().getType()).toBe(_.NUM);
    expect(lexer.peekNextToken().getValue()).toBe(0);

    lexer.getNextToken();
    expect(lexer.getCurToken().getType()).toBe(_.NUM);

    expect(lexer.peekNextToken().getType()).toBe(_.EOF);
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
      expect(lexer.getNextToken().getSourcePos()).toMatchObject(pos);
    });
  });
});

function createLexer(input) {
  const source = new Source(input);
  const errNotifier = new ErrorNotifier(source);

  return new Lexer(source, errNotifier);
}
