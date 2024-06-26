const { Lexer } = require('../lexer/lexer');
const { Parser } = require('./parser');
const { Source } = require('../source');
const { ASTStringifier } = require('../ast/ast-stringifier');
const { SymbolTable } = require('./symbol-table');

describe('Parser', () => {
  test.each([
    [
      `var a b c[16]`,
      `{ DECL_LIST VAR_DECL 'a' VAR_DECL 'b' ARR_DECL 'c[16]' }`,
    ],
    [`set a b`, `{ SET VAR_REF 'a' VAR_REF 'b' }`],
    [`set a 'b'`, `{ SET VAR_REF 'a' NUM '98' }`],
    [`inc a b`, `{ INC VAR_REF 'a' VAR_REF 'b' }`],
    [`dec a 0`, `{ DEC VAR_REF 'a' NUM '0' }`],
    [`dec a '0'`, `{ DEC VAR_REF 'a' NUM '48' }`],
    [`add a 0 b`, `{ ADD VAR_REF 'a' NUM '0' VAR_REF 'b' }`],
    [`sub 0 a b`, `{ SUB NUM '0' VAR_REF 'a' VAR_REF 'b' }`],
    [`mul 0 0 a`, `{ MUL NUM '0' NUM '0' VAR_REF 'a' }`],
    [
      `divmod a 0 b c`,
      `{ DIVMOD VAR_REF 'a' NUM '0' VAR_REF 'b' VAR_REF 'c' }`,
    ],
    [`div a b c`, `{ DIV VAR_REF 'a' VAR_REF 'b' VAR_REF 'c' }`],
    [`mod 0 1 a`, `{ MOD NUM '0' NUM '1' VAR_REF 'a' }`],
    [`cmp a b c`, `{ CMP VAR_REF 'a' VAR_REF 'b' VAR_REF 'c' }`],
    [`a2b a b 0 c`, `{ A2B VAR_REF 'a' VAR_REF 'b' NUM '0' VAR_REF 'c' }`],
    [`b2a 0 a b c`, `{ B2A NUM '0' VAR_REF 'a' VAR_REF 'b' VAR_REF 'c' }`],
    [`read a`, `{ READ VAR_REF 'a' }`],
    [`lset a b c`, `{ LSET ARR_REF 'a' VAR_REF 'b' VAR_REF 'c' }`],
    [`lset a 'b' 'c'`, `{ LSET ARR_REF 'a' NUM '98' NUM '99' }`],
    [`lget a 0 c`, `{ LGET ARR_REF 'a' NUM '0' VAR_REF 'c' }`],
    [
      `msg a "str1" "str2" b`,
      `{ MSG VAR_REF 'a' STR 'str1' STR 'str2' VAR_REF 'b' }`,
    ],
    [
      `ifeq F 10
        set F 5
       end`,
      `{ IFEQ VAR_REF 'f' NUM '10' { SET VAR_REF 'f' NUM '5' } }`,
    ],
    [
      `ifneq X 50
         msg ";-)"
       end`,
      `{ IFNEQ VAR_REF 'x' NUM '50' { MSG STR ';-)' } }`,
    ],
    [
      `wneq F 0
        dec F 1
       end`,
      `{ WNEQ VAR_REF 'f' NUM '0' { DEC VAR_REF 'f' NUM '1' } }`,
    ],
    [
      `wneq F 0
         ifeq F 1
           ifneq X 50
           end
         end
       end`,
      `{
         WNEQ VAR_REF 'f' NUM '0' {
           IFEQ VAR_REF 'f' NUM '1' {
             IFNEQ VAR_REF 'x' NUM '50' {  }
           }
         }
       }`,
    ],
    [
      `proc swap x y
         set x y
       end`,
      `{ PROC_DEF 'swap' ('x' 'y') { SET VAR_REF 'x' VAR_REF 'y' } }`,
    ],
    [`call swap a b`, `{ CALL PROC_REF 'swap' VAR_REF 'a' VAR_REF 'b' }`],
    [
      `var A B T F L[5] X
       set A 'U'
       set B 'V'

       msg"Outer Before : "A B"\\n"
       call swap B A
       msg"Outer After : "A B"\\n"

       set F 10
       wneq F 0
         ifeq F 10
           set F 5
         end

         dec F 1
         lget L F X

         ifneq X 18
           msg F X
         end
       end

       ifeq F 0
         ifneq X 50
           msg ";-)"
         end
       end

       proc swap x y
         msg "Inner Before : "x y"\\n"
         set T x
         call say T
         set x y
         set y T
         msg "Inner After : "x y"\\n"
       end

       proc say x
         msg "It is " x " now\\n"
       end`,
      `{
          DECL_LIST VAR_DECL 'a' VAR_DECL 'b' VAR_DECL 't' VAR_DECL 'f' ARR_DECL 'l[5]' VAR_DECL 'x'
          SET VAR_REF 'a' NUM '85'
          SET VAR_REF 'b' NUM '86'

          MSG STR 'Outer Before : ' VAR_REF 'a' VAR_REF 'b' STR '\n'
          CALL PROC_REF 'swap' VAR_REF 'b' VAR_REF 'a'
          MSG STR 'Outer After : ' VAR_REF 'a' VAR_REF 'b' STR '\n'

          SET VAR_REF 'f' NUM '10'
          WNEQ VAR_REF 'f' NUM '0' {
            IFEQ VAR_REF 'f' NUM '10' {
              SET VAR_REF 'f' NUM '5'
            }

            DEC VAR_REF 'f' NUM '1'
            LGET ARR_REF 'l' VAR_REF 'f' VAR_REF 'x'

            IFNEQ VAR_REF 'x' NUM '18' {
              MSG VAR_REF 'f' VAR_REF 'x'
            }
          }

          IFEQ VAR_REF 'f' NUM '0' {
            IFNEQ VAR_REF 'x' NUM '50' {
              MSG STR ';-)'
            }
          }

          PROC_DEF 'swap' ('x' 'y') {
            MSG STR 'Inner Before : ' VAR_REF 'x' VAR_REF 'y' STR '\n'
            SET VAR_REF 't' VAR_REF 'x'
            CALL PROC_REF 'say' VAR_REF 't'
            SET VAR_REF 'x' VAR_REF 'y'
            SET VAR_REF 'y' VAR_REF 't'
            MSG STR 'Inner After : ' VAR_REF 'x' VAR_REF 'y' STR '\n'
          }

          PROC_DEF 'say' ('x') {
            MSG STR 'It is ' VAR_REF 'x' STR ' now\n'
          }
        }`,
    ],
  ])('should parse: %s', (program, expected) => {
    const parser = createParser(program);
    const result = new ASTStringifier().stringify(parser.parse());

    expected = expected
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ');

    expect(result).toBe(expected);
  });

  test.each([
    ['var Q[ 20 S', `Unexpected token: Token(type: ID, value: s)`],
    ['whatever a b c', `Unexpected token: Token(type: ID, value: whatever)`],
    ['add 20', `Unexpected token: Token(type: EOF, value: null)`],
    ['div 20 20 c d', `Unexpected token: Token(type: ID, value: d)`],
    ['set 20 20', `Unexpected token: Token(type: NUM, value: 20)`],
    ['inc "a" 5', `Unexpected token: Token(type: STR, value: a)`],
    [
      `var x
       end`,
      `Unexpected token: Token(type: END, value: end)`,
    ],
    [
      `var a
       ifeq a 0`,
      `Unexpected token: Token(type: EOF, value: null)`,
    ],
    [
      `proc a Q q
       end`,
      `Duplicate param 'q' in 'a' procedure`,
    ],
    [
      `proc a
         proc b
         end
       end`,
      `Nested procedure definition`,
    ],
    [
      `proc whatever
         var Q
       end`,
      `Nested variable declaration`,
    ],
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
  ])('should throw: %s', (program, errMsg) => {
    expect(() => createParser(program).parse()).toThrow(errMsg);
  });
});

function createParser(program) {
  const source = new Source(program);
  const lexer = new Lexer(source);

  return new Parser(source, lexer, new SymbolTable());
}
