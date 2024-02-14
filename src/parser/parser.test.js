const { Lexer } = require('../lexer');
const { Parser } = require('./parser');
const { astToString } = require('../ast');

describe('Parser', () => {
  test.each([
    [`var a b c[16]`, `{ VAR ID 'a' ID 'b' LIST 'c' 16 }`],
    [`set a b`, `{ SET ID 'a' ID 'b' }`],
    [`set a 'b'`, `{ SET ID 'a' CHAR 'b' }`],
    [`inc a b`, `{ INC ID 'a' ID 'b' }`],
    [`dec a 0`, `{ DEC ID 'a' NUM 0 }`],
    [`dec a '0'`, `{ DEC ID 'a' CHAR '0' }`],
    [`add a 0 b`, `{ ADD ID 'a' NUM 0 ID 'b' }`],
    [`sub 0 a b`, `{ SUB NUM 0 ID 'a' ID 'b' }`],
    [`mul 0 0 a`, `{ MUL NUM 0 NUM 0 ID 'a' }`],
    [`divmod a 0 b c`, `{ DIVMOD ID 'a' NUM 0 ID 'b' ID 'c' }`],
    [`div a b c`, `{ DIV ID 'a' ID 'b' ID 'c' }`],
    [`mod 0 1 a`, `{ MOD NUM 0 NUM 1 ID 'a' }`],
    [`cmp a b c`, `{ CMP ID 'a' ID 'b' ID 'c' }`],
    [`a2b a b 0 c`, `{ A2B ID 'a' ID 'b' NUM 0 ID 'c' }`],
    [`b2a 0 a b c`, `{ B2A NUM 0 ID 'a' ID 'b' ID 'c' }`],
    [`read a`, `{ READ ID 'a' }`],
    [`lset a b c`, `{ LSET ID 'a' ID 'b' ID 'c' }`],
    [`lset a 'b' 'c'`, `{ LSET ID 'a' CHAR 'b' CHAR 'c' }`],
    [`lget a 0 c`, `{ LGET ID 'a' NUM 0 ID 'c' }`],
    [`msg a "str1" "str2" b`, `{ MSG ID 'a' STR 'str1' STR 'str2' ID 'b' }`],
    [
      `ifeq F 10
        set F 5
      end`,
      `{ IFEQ ID 'F' NUM 10 { SET ID 'F' NUM 5 } }`,
    ],
    [
      `ifneq X 50
         msg ";-)"
       end`,
      `{ IFNEQ ID 'X' NUM 50 { MSG STR ';-)' } }`,
    ],
    [
      `wneq F 0
        dec F 1
       end`,
      `{ WNEQ ID 'F' NUM 0 { DEC ID 'F' NUM 1 } }`,
    ],
    [
      `wneq F 0
         ifeq F 1
           ifneq X 50
           end
         end
       end`,
      `{
         WNEQ ID 'F' NUM 0 {
           IFEQ ID 'F' NUM 1 {
             IFNEQ ID 'X' NUM 50 {  }
           }
         }
       }`,
    ],
    [
      `proc swap x y
         set x y
       end`,
      `{ PROC ID 'swap' ID 'x' ID 'y' { SET ID 'x' ID 'y' } }`,
    ],
    [`call swap a b`, `{ CALL ID 'swap' ID 'a' ID 'b' }`],
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
          VAR ID 'A' ID 'B' ID 'T' ID 'F' LIST 'L' 5 ID 'X'
          SET ID 'A' CHAR 'U'
          SET ID 'B' CHAR 'V'

          MSG STR 'Outer Before : ' ID 'A' ID 'B' STR '\\n'
          CALL ID 'swap' ID 'B' ID 'A'
          MSG STR 'Outer After : ' ID 'A' ID 'B' STR '\\n'

          SET ID 'F' NUM 10
          WNEQ ID 'F' NUM 0 {
            IFEQ ID 'F' NUM 10 {
              SET ID 'F' NUM 5
            }

            DEC ID 'F' NUM 1
            LGET ID 'L' ID 'F' ID 'X'

            IFNEQ ID 'X' NUM 18 {
              MSG ID 'F' ID 'X'
            }
          }

          IFEQ ID 'F' NUM 0 {
            IFNEQ ID 'X' NUM 50 {
              MSG STR ';-)'
            }
          }

          PROC ID 'swap' ID 'x' ID 'y' {
            MSG STR 'Inner Before : ' ID 'x' ID 'y' STR '\\n'
            SET ID 'T' ID 'x'
            CALL ID 'say' ID 'T'
            SET ID 'x' ID 'y'
            SET ID 'y' ID 'T'
            MSG STR 'Inner After : ' ID 'x' ID 'y' STR '\\n'
          }

          PROC ID 'say' ID 'x' {
            MSG STR 'It is ' ID 'x' STR ' now\\n'
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
