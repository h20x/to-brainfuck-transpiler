const { Lexer } = require('../lexer');
const { Parser } = require('./parser');
const { astToString } = require('../ast');

describe('Parser', () => {
  test.each([
    [
      `var a b c[16]`,
      `{ VAR_LIST VAR_DECL 'a' VAR_DECL 'b' ARR_DECL 'c[16]' }`,
    ],
    [`set a b`, `{ SET VAR 'a' VAR 'b' }`],
    [`set a 'b'`, `{ SET VAR 'a' CHAR 'b' }`],
    [`inc a b`, `{ INC VAR 'a' VAR 'b' }`],
    [`dec a 0`, `{ DEC VAR 'a' NUM '0' }`],
    [`dec a '0'`, `{ DEC VAR 'a' CHAR '0' }`],
    [`add a 0 b`, `{ ADD VAR 'a' NUM '0' VAR 'b' }`],
    [`sub 0 a b`, `{ SUB NUM '0' VAR 'a' VAR 'b' }`],
    [`mul 0 0 a`, `{ MUL NUM '0' NUM '0' VAR 'a' }`],
    [`divmod a 0 b c`, `{ DIVMOD VAR 'a' NUM '0' VAR 'b' VAR 'c' }`],
    [`div a b c`, `{ DIV VAR 'a' VAR 'b' VAR 'c' }`],
    [`mod 0 1 a`, `{ MOD NUM '0' NUM '1' VAR 'a' }`],
    [`cmp a b c`, `{ CMP VAR 'a' VAR 'b' VAR 'c' }`],
    [`a2b a b 0 c`, `{ A2B VAR 'a' VAR 'b' NUM '0' VAR 'c' }`],
    [`b2a 0 a b c`, `{ B2A NUM '0' VAR 'a' VAR 'b' VAR 'c' }`],
    [`read a`, `{ READ VAR 'a' }`],
    [`lset a b c`, `{ LSET ARR 'a' VAR 'b' VAR 'c' }`],
    [`lset a 'b' 'c'`, `{ LSET ARR 'a' CHAR 'b' CHAR 'c' }`],
    [`lget a 0 c`, `{ LGET ARR 'a' NUM '0' VAR 'c' }`],
    [`msg a "str1" "str2" b`, `{ MSG VAR 'a' STR 'str1' STR 'str2' VAR 'b' }`],
    [
      `ifeq F 10
        set F 5
      end`,
      `{ IFEQ VAR 'F' NUM '10' { SET VAR 'F' NUM '5' } }`,
    ],
    [
      `ifneq X 50
         msg ";-)"
       end`,
      `{ IFNEQ VAR 'X' NUM '50' { MSG STR ';-)' } }`,
    ],
    [
      `wneq F 0
        dec F 1
       end`,
      `{ WNEQ VAR 'F' NUM '0' { DEC VAR 'F' NUM '1' } }`,
    ],
    [
      `wneq F 0
         ifeq F 1
           ifneq X 50
           end
         end
       end`,
      `{
         WNEQ VAR 'F' NUM '0' {
           IFEQ VAR 'F' NUM '1' {
             IFNEQ VAR 'X' NUM '50' {  }
           }
         }
       }`,
    ],
    [
      `proc swap x y
         set x y
       end`,
      `{ PROC_DEF PROC 'swap' VAR_DECL 'x' VAR_DECL 'y' { SET VAR 'x' VAR 'y' } }`,
    ],
    [`call swap a b`, `{ CALL PROC 'swap' VAR 'a' VAR 'b' }`],
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
          VAR_LIST VAR_DECL 'A' VAR_DECL 'B' VAR_DECL 'T' VAR_DECL 'F' ARR_DECL 'L[5]' VAR_DECL 'X'
          SET VAR 'A' CHAR 'U'
          SET VAR 'B' CHAR 'V'

          MSG STR 'Outer Before : ' VAR 'A' VAR 'B' STR '\\n'
          CALL PROC 'swap' VAR 'B' VAR 'A'
          MSG STR 'Outer After : ' VAR 'A' VAR 'B' STR '\\n'

          SET VAR 'F' NUM '10'
          WNEQ VAR 'F' NUM '0' {
            IFEQ VAR 'F' NUM '10' {
              SET VAR 'F' NUM '5'
            }

            DEC VAR 'F' NUM '1'
            LGET ARR 'L' VAR 'F' VAR 'X'

            IFNEQ VAR 'X' NUM '18' {
              MSG VAR 'F' VAR 'X'
            }
          }

          IFEQ VAR 'F' NUM '0' {
            IFNEQ VAR 'X' NUM '50' {
              MSG STR ';-)'
            }
          }

          PROC_DEF PROC 'swap' VAR_DECL 'x' VAR_DECL 'y' {
            MSG STR 'Inner Before : ' VAR 'x' VAR 'y' STR '\\n'
            SET VAR 'T' VAR 'x'
            CALL PROC 'say' VAR 'T'
            SET VAR 'x' VAR 'y'
            SET VAR 'y' VAR 'T'
            MSG STR 'Inner After : ' VAR 'x' VAR 'y' STR '\\n'
          }

          PROC_DEF PROC 'say' VAR_DECL 'x' {
            MSG STR 'It is ' VAR 'x' STR ' now\\n'
          }
        }`,
    ],
  ])('should parse: %s', (program, expected) => {
    const parser = new Parser(new Lexer(program));
    const result = astToString(parser.parse());

    expected = expected
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ');

    expect(result).toBe(expected);
  });

  test.each([
    ['var Q[ 20 S'],
    ['whatever a b c'],
    ['add 20'],
    ['div 20 20 c d'],
    ['set 20 20'],
    ['inc "a" 5'],
    [`add '0 '1' a`],
    ['msg "abc'],
    ['end'],
    [
      `var a
       ifeq a 0`,
    ],
  ])('should throw: %s', (program) => {
    expect(() => new Parser(new Lexer(program)).parse()).toThrow();
  });
});
