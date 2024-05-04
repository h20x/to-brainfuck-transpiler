const { ParsingError } = require('./parsing-error');
const { Source } = require('./source');

describe('ParsingError', () => {
  test('should have correct error message', () => {
    const program = [
      'var width height tmp',
      'set width 10',
      'set height 20',
      'call swap width height',
      '',
      'proc swap x y',
      '  set tmp x',
      '  set x y',
      '  set y tmp',
      'end',
    ].join('\n');

    const src = new Source(program);
    const errMsg = (msg, ln, col) => {
      return new ParsingError({ msg, ln, col, src }).message;
    };

    expect(errMsg('Error 1', 0, 4)).toBe(
      [
        '1 | var width height tmp',
        '  |     ^',
        '2 | set width 10',
        '3 | set height 20',
        '',
        '1:5: Error 1',
      ].join('\n')
    );

    expect(errMsg('Error 2', 8, 8)).toBe(
      [
        ' 8 |   set x y',
        ' 9 |   set y tmp',
        '   |         ^',
        '10 | end',
        '',
        '9:9: Error 2',
      ].join('\n')
    );

    expect(errMsg('Error 3', 9, 0)).toBe(
      // prettier-ignore
      [
        ' 9 |   set y tmp',
        '10 | end',
        '   | ^',
        '',
        '10:1: Error 3',
      ].join('\n')
    );

    expect(errMsg('Error 4', 1, 4)).toBe(
      [
        '1 | var width height tmp',
        '2 | set width 10',
        '  |     ^',
        '3 | set height 20',
        '4 | call swap width height',
        '',
        '2:5: Error 4',
      ].join('\n')
    );
  });
});
