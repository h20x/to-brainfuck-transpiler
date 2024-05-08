const { BFM } = require('./bfm');
const { bfi } = require('./bfi');

describe('BFM', () => {
  let bfm;

  beforeEach(() => {
    bfm = new BFM();
  });

  test('inc', () => {
    bfm.decl('a', 'b');

    bfm.inc(1, 'a');
    expect(mem()).toEqual([1]);

    bfm.inc(7, 'a');
    expect(mem()).toEqual([8]);

    bfm.inc(-4, 'a');
    expect(mem()).toEqual([4]);

    bfm.inc(12, 'b');
    bfm.inc('b', 'a');
    expect(mem(2)).toEqual([16, 12]);
  });

  test('dec', () => {
    bfm.decl('a', 'b');

    bfm.dec(1, 'a');
    expect(mem()).toEqual([255]);

    bfm.dec(5, 'a');
    expect(mem()).toEqual([250]);

    bfm.dec(-5, 'a');
    expect(mem()).toEqual([255]);

    bfm.dec(2, 'b');
    bfm.dec('b', 'a');
    expect(mem(2)).toEqual([1, 254]);
  });

  test('set', () => {
    bfm.decl('a', 'b');

    bfm.set(1, 'a');
    expect(mem()).toEqual([1]);

    bfm.set(-1, 'a');
    expect(mem()).toEqual([255]);

    bfm.set(8, 'b');
    bfm.set('b', 'a');
    expect(mem(2)).toEqual([8, 8]);
  });

  test('add', () => {
    bfm.decl('a', 'b', 'c');

    bfm.add(1, 3, 'c');
    expect(mem(3)).toEqual([0, 0, 4]);

    bfm.add(1, -2, 'c');
    expect(mem(3)).toEqual([0, 0, 255]);

    bfm.add(-1, 2, 'c');
    expect(mem(3)).toEqual([0, 0, 1]);

    bfm.add(-1, -2, 'c');
    expect(mem(3)).toEqual([0, 0, 253]);

    bfm.set(4, 'a');
    bfm.add('a', 4, 'c');
    expect(mem(3)).toEqual([4, 0, 8]);

    bfm.set(12, 'b');
    bfm.add('a', 'b', 'c');
    expect(mem(3)).toEqual([4, 12, 16]);

    bfm.add('a', 'c', 'c');
    expect(mem(3)).toEqual([4, 12, 20]);

    bfm.add('a', 'a', 'a');
    expect(mem(3)).toEqual([8, 12, 20]);
  });

  test('sub', () => {
    bfm.decl('a', 'b', 'c');

    bfm.sub(3, 2, 'c');
    expect(mem(3)).toEqual([0, 0, 1]);

    bfm.sub(3, -2, 'c');
    expect(mem(3)).toEqual([0, 0, 5]);

    bfm.sub(-3, 2, 'c');
    expect(mem(3)).toEqual([0, 0, 251]);

    bfm.sub(-3, -2, 'c');
    expect(mem(3)).toEqual([0, 0, 255]);

    bfm.set(16, 'a');
    bfm.sub('a', 8, 'c');
    expect(mem(3)).toEqual([16, 0, 8]);

    bfm.set(4, 'b');
    bfm.sub('a', 'b', 'c');
    expect(mem(3)).toEqual([16, 4, 12]);

    bfm.sub('a', 'c', 'c');
    expect(mem(3)).toEqual([16, 4, 4]);

    bfm.sub('a', 'a', 'a');
    expect(mem(3)).toEqual([0, 4, 4]);
  });

  test('mul', () => {
    bfm.decl('a', 'b', 'c');

    bfm.mul(0, 0, 'c');
    expect(mem(3)).toEqual([0, 0, 0]);

    bfm.mul(0, 1, 'c');
    expect(mem(3)).toEqual([0, 0, 0]);

    bfm.mul(2, 4, 'c');
    expect(mem(3)).toEqual([0, 0, 8]);

    bfm.set(4, 'a');
    bfm.mul('a', 4, 'c');
    expect(mem(3)).toEqual([4, 0, 16]);

    bfm.set(8, 'a');
    bfm.set(4, 'b');
    bfm.mul('a', 'b', 'c');
    expect(mem(3)).toEqual([8, 4, 32]);

    bfm.mul('a', 'b', 'b');
    expect(mem(3)).toEqual([8, 32, 32]);

    bfm.mul('a', 'a', 'a');
    expect(mem(3)).toEqual([64, 32, 32]);
  });

  test('divmod', () => {
    bfm.decl('a', 'b', 'c', 'd');

    bfm.divmod(0, 1, 'c', 'd');
    expect(mem(4)).toEqual([0, 0, 0, 0]);

    bfm.divmod(2, 4, 'c', 'd');
    expect(mem(4)).toEqual([0, 0, 0, 2]);

    bfm.divmod(9, 4, 'c', 'd');
    expect(mem(4)).toEqual([0, 0, 2, 1]);

    bfm.set(16, 'a');
    bfm.divmod('a', 5, 'c', 'd');
    expect(mem(4)).toEqual([16, 0, 3, 1]);

    bfm.set(1, 'b');
    bfm.divmod('a', 'b', 'c', 'd');
    expect(mem(4)).toEqual([16, 1, 16, 0]);

    bfm.divmod('a', 'b', 'b', 'd');
    expect(mem(4)).toEqual([16, 16, 16, 0]);

    bfm.divmod('a', 'b', 'a', 'b');
    expect(mem(4)).toEqual([1, 0, 16, 0]);

    bfm.set(2, 'a');
    bfm.divmod('a', 'a', 'a', 'c');
    expect(mem(4)).toEqual([1, 0, 0, 0]);

    bfm.divmod('a', 'a', 'b', 'a');
    expect(mem(4)).toEqual([0, 1, 0, 0]);
  });

  test('div', () => {
    bfm.decl('a', 'b', 'c');

    bfm.div(0, 1, 'c');
    expect(mem(3)).toEqual([0, 0, 0]);

    bfm.div(9, 4, 'c');
    expect(mem(3)).toEqual([0, 0, 2]);

    bfm.set(16, 'a');
    bfm.div('a', 5, 'c');
    expect(mem(3)).toEqual([16, 0, 3]);

    bfm.set(1, 'b');
    bfm.div('a', 'b', 'c');
    expect(mem(3)).toEqual([16, 1, 16]);

    bfm.div('a', 'b', 'b');
    expect(mem(3)).toEqual([16, 16, 16]);

    bfm.div('a', 'a', 'a');
    expect(mem(3)).toEqual([1, 16, 16]);
  });

  test('mod', () => {
    bfm.decl('a', 'b', 'c');

    bfm.mod(0, 1, 'c');
    expect(mem(3)).toEqual([0, 0, 0]);

    bfm.mod(2, 4, 'c');
    expect(mem(3)).toEqual([0, 0, 2]);

    bfm.mod(9, 4, 'c');
    expect(mem(3)).toEqual([0, 0, 1]);

    bfm.set(16, 'a');
    bfm.mod('a', 5, 'c');
    expect(mem(3)).toEqual([16, 0, 1]);

    bfm.set(1, 'b');
    bfm.mod('a', 'b', 'c');
    expect(mem(3)).toEqual([16, 1, 0]);

    bfm.set(12, 'b');
    bfm.mod('a', 'b', 'b');
    expect(mem(3)).toEqual([16, 4, 0]);

    bfm.mod('a', 'a', 'a');
    expect(mem(3)).toEqual([0, 4, 0]);
  });

  test('cond', () => {
    bfm.decl('a', 'b', 'c');

    bfm.set(1, 'a');
    bfm.cond('a', 1, () => bfm.set(2, 'c'));
    expect(mem(3)).toEqual([1, 0, 2]);

    bfm.set(0, 'a');
    bfm.cond('a', -1, null, () => bfm.set(4, 'c'));
    expect(mem(3)).toEqual([0, 0, 4]);

    bfm.set(0, 'b');
    bfm.cond('a', 'b', () => bfm.set(8, 'c'));
    expect(mem(3)).toEqual([0, 0, 8]);

    bfm.set(1, 'a');
    bfm.set(-1, 'b');
    bfm.cond('a', 'b', null, () => bfm.set(16, 'c'));
    expect(mem(3)).toEqual([1, 255, 16]);
  });

  test('cmp', () => {
    bfm.decl('a', 'b', 'c');

    bfm.set(2, 'c');
    expect(mem(3)).toEqual([0, 0, 2]);

    bfm.cmp(0, 0, 'c');
    expect(mem(3)).toEqual([0, 0, 0]);

    bfm.cmp(1, 1, 'c');
    expect(mem(3)).toEqual([0, 0, 0]);

    bfm.cmp(0, 1, 'c');
    expect(mem(3)).toEqual([0, 0, 255]);

    bfm.cmp(1, 0, 'c');
    expect(mem(3)).toEqual([0, 0, 1]);

    bfm.set(1, 'a');
    bfm.cmp('a', 1, 'c');
    expect(mem(3)).toEqual([1, 0, 0]);

    bfm.set(1, 'b');
    bfm.cmp(2, 'b', 'c');
    expect(mem(3)).toEqual([1, 1, 1]);

    bfm.set(1, 'a');
    bfm.set(2, 'b');
    bfm.cmp('a', 'b', 'c');
    expect(mem(3)).toEqual([1, 2, 255]);
  });

  test('wneq', () => {
    bfm.decl('a', 'b');

    bfm.set(4, 'a');
    bfm.wneq('a', 0, () => {
      bfm.dec(1, 'a');
      bfm.inc(1, 'b');
    });
    expect(mem(2)).toEqual([0, 4]);

    bfm.wneq('a', 'b', () => {
      bfm.inc(1, 'a');
      bfm.dec(1, 'b');
    });
    expect(mem(2)).toEqual([2, 2]);

    bfm.wneq('a', 'b', () => {
      bfm.inc(1, 'a');
      bfm.inc(1, 'b');
    });
    expect(mem(2)).toEqual([2, 2]);

    bfm.set(0, 'a');
    bfm.set(0, 'b');
    bfm.wneq('a', 'b', () => {
      bfm.inc(1, 'a');
      bfm.inc(1, 'b');
    });
    expect(mem(2)).toEqual([0, 0]);
  });

  test('lset', () => {
    bfm.decl(['a', 3], 'b', 'c');

    bfm.lset('a', 0, 1);
    expect(mem(4, 7)).toEqual([1, 0, 0]);

    bfm.lset('a', 2, 4);
    expect(mem(4, 7)).toEqual([1, 0, 4]);

    bfm.set(2, 'b');
    bfm.lset('a', 1, 'b');
    expect(mem(4, 7)).toEqual([1, 2, 4]);

    bfm.set(8, 'c');
    bfm.lset('a', 'b', 'c');
    expect(mem(4, 7)).toEqual([1, 2, 8]);
  });

  test('lget', () => {
    bfm.decl(['a', 2], 'b', 'c');

    bfm.lset('a', 0, 2);
    bfm.lset('a', 1, 4);

    bfm.lget('a', 0, 'c');
    expect(mem(6, 7)).toEqual([2]);

    bfm.set(1, 'b');
    bfm.lget('a', 'b', 'c');
    expect(mem(6, 7)).toEqual([4]);
  });

  test('a2b', () => {
    bfm.decl('a', 'b');

    bfm.a2b(cc('1'), cc('5'), cc('9'), 'a');
    expect(mem(1)).toEqual([159]);

    bfm.set(cc('1'), 'a');
    bfm.set(cc('6'), 'b');
    bfm.a2b(cc('0'), 'a', 'b', 'a');
    expect(mem(1)).toEqual([16]);

    bfm.set(cc('1'), 'a');
    bfm.a2b('a', 'a', 'a', 'a');
    expect(mem(1)).toEqual([111]);
  });

  test('b2a', () => {
    bfm.decl('a', 'b', 'c');

    bfm.b2a(97, 'a', 'b', 'c');
    expect(mem(3)).toEqual([cc('0'), cc('9'), cc('7')]);

    bfm.b2a(159, 'a', 'b', 'c');
    expect(mem(3)).toEqual([cc('1'), cc('5'), cc('9')]);

    bfm.b2a('a', 'a', 'b', 'c');
    expect(mem(3)).toEqual([cc('0'), cc('4'), cc('9')]);
  });

  test('out', () => {
    bfm.decl('a', 'b');

    bfm.set(48, 'b');
    bfm.out('b');
    expect(out()).toBe('0');
  });

  test('outStr', () => {
    bfm.outStr('Hello');
    bfm.outStr(' ');
    bfm.outStr('World');
    bfm.outStr('!');
    expect(out()).toBe('Hello World!');
  });

  function mem(start, end) {
    if (null == end) {
      end = start;
      start = 0;
    }

    const m = bfi(bfm.code()).mem.slice(start, end);

    for (let i = 0; i < m.length; i++) {
      if (null == m[i]) {
        m[i] = 0;
      }
    }

    return m;
  }

  function out() {
    return bfi(bfm.code()).out;
  }

  function cc(c) {
    return c.charCodeAt();
  }
});
