const { Source } = require('../source');
const { ErrorNotifier } = require('../error-notifier');
const { Lexer } = require('../lexer');
const { Parser } = require('../parser');
const { SemanticAnalyser } = require('../semantic-analyser');
const { Transpiler } = require('./transpiler');
const { bfi } = require('./bf/bfi');
const { SymbolTable } = require('../symbol-table');

describe('Transpiler', () => {
  test('set', () => {
    expect(
      run(
        `var a b c d e f g h
         set a 4
         set b 'A'
         set c a
         set d 8
         set d 16
         set e 450
         set f -450
         set g -256
         set h -257`
      ).mem(8)
    ).toEqual([4, 65, 4, 16, 194, 62, 0, 255]);
  });

  test('inc', () => {
    expect(
      run(
        `var a b c d
         inc a 4
         inc b a
         inc c 'A'
         inc d 257`
      ).mem(4)
    ).toEqual([4, 4, 65, 1]);
  });

  test('dec', () => {
    expect(
      run(
        `var a b c
         dec a 255
         dec b a
         dec c 'A'`
      ).mem(3)
    ).toEqual([1, 255, 191]);
  });

  test('add', () => {
    expect(
      run(
        `var a b c d
         add 2 2 a
         add 4 a b
         add 1 'A' c
         add 'A' c d`
      ).mem(4)
    ).toEqual([4, 8, 66, 131]);
  });

  test('sub', () => {
    expect(
      run(
        `var a b c d
         sub 4 2 a
         sub 6 a b
         sub 'A' b c
         sub 'B' 'A' d`
      ).mem(4)
    ).toEqual([2, 4, 61, 1]);
  });

  test('mul', () => {
    expect(
      run(
        `var a b c d
         mul 2 2 a
         mul 4 a b
         mul 'A' 2 c
         mul a b d`
      ).mem(4)
    ).toEqual([4, 16, 130, 64]);
  });

  test('divmod', () => {
    expect(
      run(
        `var a b c d e f
         divmod 64 2 a b
         divmod a 30 c d
         divmod 'A' a e f`
      ).mem(6)
    ).toEqual([32, 0, 1, 2, 2, 1]);
  });

  test('div', () => {
    expect(
      run(
        `var a b
         div 64 2 a
         div 16 1 b
         div a b a`
      ).mem(2)
    ).toEqual([2, 16]);
  });

  test('mod', () => {
    expect(
      run(
        `var a b
         mod 64 2 a
         mod 16 3 b`
      ).mem(2)
    ).toEqual([0, 1]);
  });

  test('cmp', () => {
    expect(
      run(
        `var a b c d
         cmp 1 2 a
         cmp 2 1 b
         cmp a a c
         cmp 'a' 'A' d`
      ).mem(4)
    ).toEqual([255, 1, 0, 1]);
  });

  test('a2b', () => {
    expect(
      run(
        `var a b c d
         a2b '1' '2' '3' a
         a2b 50 '2' '3' b
         a2b 48 52 57 c
         a2b c '0' '0' d`
      ).mem(4)
    ).toEqual([123, 223, 49, 100]);
  });

  test('b2a', () => {
    expect(
      run(
        `var a b c d e f g h i
         b2a 159 a b c
         b2a 'A' d e f
         b2a a g h i`
      ).mem(9)
    ).toEqual([49, 53, 57, 48, 54, 53, 48, 52, 57]);
  });

  test('lset', () => {
    expect(
      run(
        `var a[3] b c
         set b 1
         set c 4
         lset a 0 1
         lset a b 2
         lset a 2 c`
      ).mem(4, 7)
    ).toEqual([1, 2, 4]);
  });

  test('lget', () => {
    expect(
      run(
        `var a b[2]
         lset b 1 2
         lget b 1 a`
      ).mem(1)
    ).toEqual([2]);
  });

  test('msg', () => {
    expect(run(`msg "Hello World!"`).out()).toBe('Hello World!');
    expect(
      run(
        `var a b
         set a '4'
         set b '8'
         msg a " + " b " = 12"`
      ).out()
    ).toBe('4 + 8 = 12');
  });

  test('ifeq', () => {
    expect(
      run(
        `var a b c
         set a 1
         ifeq a 1
           set b 2
         end
         set a 2
         ifeq a b
           set c 4
         end`
      ).mem(3)
    ).toEqual([2, 2, 4]);
  });

  test('ifneq', () => {
    expect(
      run(
        `var a b c
         set a 1
         ifneq a 2
           set b 2
         end
         ifneq a b
           set c 4
         end`
      ).mem(3)
    ).toEqual([1, 2, 4]);
  });

  test('wneq', () => {
    expect(
      run(
        `var a b c
         set b 2
         wneq a b
           inc c 1
           dec b 1
         end`
      ).mem(3)
    ).toEqual([0, 0, 2]);
  });

  test('call', () => {
    const result = run(
      `var a b
       set a '2'
       call Say a
       proc Say x
         set b 4
         msg "It is "x
       end`
    );
    expect(result.out()).toBe('It is 2');
    expect(result.mem(2)).toEqual([50, 4]);
  });
});

// KATA TESTS

describe('Fixed Tests', () => {
  test('Works for var, read, msg, comment', () => {
    expect(
      run(
        `var X//This is a comment
         read X--This is also a comment
         msg "Bye" X#No doubt it is a comment
         rem &&Some comment~!@#$":<`,
        '?'
      ).out()
    ).toBe('Bye?');
  });

  test('Works for set, inc, dec', () => {
    expect(
      run(
        `var A B
         sEt A 'a'
         msg a B
         set B 50
         msG A b
         inc A 10
         dec B -20
         msg A B`
      ).out()
    ).toBe('a\0a2kF');
  });

  test('Works for kinds of numbers', () => {
    expect(
      run(
        `var X
         set X  114514
         msg X
         set X -114514
         msg X
         set X 'X'
         msg X`
      ).out()
    ).toBe('\x52\xae\x58');
  });

  test('Works for divmod, div, mod', () => {
    expect(
      run(
        `var A B C D
         set A 79
         set B 13
         divmod A B C D
         msg A B C D
         div C D C
         msg A B C D
         mod A D A
         msg A B C D`
      ).out()
    ).toBe('\x4f\x0d\x06\x01\x4f\x0d\x06\x01\x00\x0d\x06\x01');
  });

  test('Works for cmp', () => {
    expect(
      run(
        `var X K
         read X
         cmp 80 X K
         msg X K
         cmp X 'z' K
         msg X K
         cmp X X K
         msg X K`,
        '\x80'
      ).out()
    ).toBe('\x80\xff\x80\x01\x80\x00');
  });

  test('Works for a2b, b2a', () => {
    expect(
      run(
        `var A B C D
         set a 247
         b2a A B C D
         msg A B C D
         inc B 1
         dec C 2
         inc D 5
         a2b B C D A
         msg A B C D // A = (100 * (2 + 1) + 10 * (4 - 2) + (7 + 5)) % 256 = 76 = 0x4c`
      ).out()
    ).toBe('\xf7\x32\x34\x37\x4c\x33\x32\x3c');
  });

  test('Works for lset, lget', () => {
    expect(
      run(
        `var L  [ 20 ]  I X
         lset L 10 80
         set X 20
         lset L 5 X
         set X 9
         lset L X X
         set I 4
         lget L I X
         msg X
         lget L 5 X
         msg X
         lget L 9 X
         msg X
         lget L 10 X
         msg X
         lget L 19 X
         msg X`
      ).out()
    ).toBe('\x00\x14\x09\x50\x00');
  });

  test('Works for ifeq, ifneq, wneq', () => {
    expect(
      run(
        `var F L[5] X
         set F 0
         add 10 10 X
         wneq F 5
           lset L F X
           inc F 1
           dec X 1
         end
         //L == [20,19,18,17,16]

         wneq F 0
           inc F -1
           lget L F X
           msg X
         end

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
         end`
      ).out()
    ).toBe('\x10\x11\x12\x13\x14\x04\x10\x03\x11\x01\x13\x00\x14;-)');
  });

  test('Works for proc', () => {
    expect(
      run(
        `var A B T
         set A 'U'
         set B 'V'

         msg"Outer Before : "A B"\\n"
         call swap B A
         msg"Outer After : "A B"\\n"

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
         end`
      ).out()
    ).toBe(
      [
        'Outer Before : UV',
        'Inner Before : VU',
        'It is V now',
        'Inner After : UV',
        'Outer After : VU',
        '',
      ].join('\\n')
    );
  });
});

describe('Invalid Input', () => {
  test('Unknown instructions', () => {
    expect(() =>
      run(
        `var a
         mov a 5`
      )
    ).toThrow();
  });

  test('Arguments for an instruction are too much or not enough', () => {
    expect(() =>
      run(
        `var x
         set x`
      )
    ).toThrow();
  });

  test('Undefined var names', () => {
    expect(() => run(`msg x`)).toThrow();
  });

  test('Duplicate var names', () => {
    expect(() =>
      run(
        `var Q
         var q[20]`
      )
    ).toThrow();
  });

  test('Define variables inside a procedure', () => {
    expect(() =>
      run(
        `proc nice
           var evil
         end`
      )
    ).toThrow();
  });

  test('Unclosed [] pair', () => {
    expect(() => run(`var x[60 Y`)).toThrow();
  });

  test('Expect a variable but got something else', () => {
    expect(() =>
      run(
        `var c 20
         set 20 20
         add "what" 'x' c
         // all lines above cause this error respectively`
      )
    ).toThrow();
  });

  test('Expect a variable but got a list', () => {
    expect(() =>
      run(
        `var L[40] X[20]
         LSet L 0 X`
      )
    ).toThrow();
  });

  test('Expect a list but got a variable', () => {
    expect(() =>
      run(
        `var L X
         LGet L 0 X`
      )
    ).toThrow();
  });

  test("Unclosed '' pair", () => {
    expect(() =>
      run(
        `var x
         set x 'z`
      )
    ).toThrow();
  });

  test('Unclosed "" pair', () => {
    expect(() => run(`msg " nope`)).toThrow();
  });

  test('Nested produces', () => {
    expect(() =>
      run(
        `proc a
           proc b
           end
         end
      `
      )
    ).toThrow();
  });

  test('Duplicate procedure names', () => {
    expect(() =>
      run(
        `proc Q a
         end
         proc Q q
         end`
      )
    ).toThrow();
  });

  test('Duplicate parameter names', () => {
    expect(() =>
      run(
        `proc Q q Q
         end`
      )
    ).toThrow();
  });

  test('End before begining a block', () => {
    expect(() =>
      run(
        `end
         msg " That's end"`
      )
    ).toThrow();
  });

  test('Unclosed blocks', () => {
    expect(() =>
      run(
        `var a
         set a 20
         ifeq a 19
         msg "eq"`
      )
    ).toThrow();
  });

  test('Undefined produce', () => {
    expect(() =>
      run(
        `var Yes
         caLL Say Yes`
      )
    ).toThrow();
  });

  test('The length of arguments does not match the length of parameters', () => {
    expect(() =>
      run(
        `var P Q
         call What P Q
         proc What Is The Answer
           msg "42"
         end`
      )
    ).toThrow();
  });

  test('Recursive call', () => {
    expect(() =>
      run(
        `var A
         set a 20
         call Wrap a
         proc Say x
           msg "It is "x
           call Wrap X
         end
         Proc Wrap X
           call Say x
         eNd
      `
      )
    ).toThrow();
  });
});

describe('Advanced Tests', () => {
  const CHR = String.fromCharCode;
  const Clamp = (Q) => ((Q = 0 | Q % 256) < 0 ? 256 + Q : Q);
  const Edge = [0, 1, 2, 125, 126, 127, 128, 129, 130, 254, 255];

  test('Works for divmod', () => {
    Edge.forEach((L) => {
      Edge.forEach((R) => {
        if (R) {
          const Div = Clamp(L / R);
          const Mod = Clamp(L % R);

          expect(
            run(
              `vaR toString __proto__ hasOwnProperty ValueOf
               reAd __protO__
               rEad toStrinG
               diVMod __prOTO__ toStrinG hasOWNProperty valueOf
               msg TOsTrinG __proto__ HasOwnProperty valueOF`,
              CHR(L, R)
            ).out()
          ).toBe(CHR(R, L, Div, Mod));
        }
      });
    });
  });

  test('Works for cmp', () => {
    Edge.forEach((L) => {
      Edge.forEach((R) => {
        const CMP = Clamp(L < R ? -1 : R < L ? 1 : 0);

        expect(
          run(
            `var __defineGetter__  hasOwnProperty __lookupGetter__ __lookupSetter__ propertyIsEnumerable constructor toString toLocaleString valueOf isPrototypeOf
             reAd __defineGetter__
             rEad constructor
             call __PROto__ constructor __defineGetter__
             msg constructor __defineGetter__ valueOf

             proc __proto__ __defineSetter__ constructor
               cmp __defineSetter__ constructor valueOf
             end`,
            CHR(R, L)
          ).out()
        ).toBe(CHR(L, R, CMP));
      });
    });
  });
});

function run(prog, input) {
  const bf = transpile(prog);
  const result = bfi(bf, input);

  return {
    out: () => result.out,
    mem: (s, e) => result.mem.slice(null == e ? 0 : s, null == e ? s : e),
  };
}

function transpile(code) {
  const source = new Source(code);
  const errNotifier = new ErrorNotifier(source);
  const lexer = new Lexer(source, errNotifier);
  const symTable = new SymbolTable();
  const parser = new Parser(lexer, errNotifier, symTable);
  const analyser = new SemanticAnalyser(errNotifier, symTable);
  const ast = parser.parse();
  analyser.visit(ast);

  return new Transpiler(ast).transpile();
}
