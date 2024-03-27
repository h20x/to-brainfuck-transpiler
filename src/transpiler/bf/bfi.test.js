const { bfi } = require('./bfi');

describe('BF', () => {
  test('Hello World!', () => {
    expect(
      bfi(
        '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.'
      ).out
    ).toBe('Hello World!');
  });

  test('value wrapping', () => {
    expect(bfi('+'.repeat(256) + '>' + '-').mem).toEqual([0, 255]);
  });

  test('negative index', () => {
    expect(() => bfi('<.')).toThrow('Negative index: -1');
  });
});
