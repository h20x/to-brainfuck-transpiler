const { ErrorNotifier } = require('./error-notifier');
const { Source } = require('./source');

describe('ErrorNotifier', () => {
  test('notify()', () => {
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

    const notifier = new ErrorNotifier(new Source(program));

    expect(() => notifier.notify('Error 1', { line: 0, column: 4 })).toThrow(
      [
        '1 | var width height tmp',
        '  |     ^',
        '2 | set width 10',
        '3 | set height 20',
        '',
        '1:5: Error 1',
      ].join('\n')
    );

    expect(() => notifier.notify('Error 2', { line: 8, column: 8 })).toThrow(
      [
        ' 8 |   set x y',
        ' 9 |   set y tmp',
        '   |         ^',
        '10 | end',
        '',
        '9:9: Error 2',
      ].join('\n')
    );

    expect(() => notifier.notify('Error 3', { line: 9, column: 0 })).toThrow(
      // prettier-ignore
      [
        ' 9 |   set y tmp',
        '10 | end',
        '   | ^',
        '',
        '10:1: Error 3',
      ].join('\n')
    );

    expect(() => notifier.notify('Error 4', { line: 1, column: 4 })).toThrow(
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
