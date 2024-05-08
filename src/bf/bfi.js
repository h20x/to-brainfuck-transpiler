// https://github.com/treker7/brainfuck-interpreter/blob/master/brainfuckInterpreter.js

function bfi(bfCode, inp = '') {
  let fnBody = `
  const mem = []; let out = ''; let dp = 0; let ip = 0;
  const check = () => { if (dp < 0) throw new Error('Negative index: ' + dp); if (null == mem[dp]) mem[dp] = 0; };
  const inc = () => { check(); mem[dp] = mem[dp] === 255 ? 0 : mem[dp] + 1; };
  const dec = () => { check(); mem[dp] = mem[dp] === 0 ? 255 : mem[dp] - 1; };
  const set = (val) => { check(); mem[dp] = val; };
  const get = () => { check(); return mem[dp]; };`;

  for (const ch of bfCode) {
    switch (ch) {
      case '>':
        fnBody += 'dp++;';
        break;

      case '<':
        fnBody += 'dp--;';
        break;

      case '+':
        fnBody += 'inc();';
        break;

      case '-':
        fnBody += 'dec();';
        break;

      case '.':
        fnBody += 'out += String.fromCharCode(get());';
        break;

      case ',':
        fnBody += 'set(inp[ip++].charCodeAt(0));';
        break;

      case '[':
        fnBody += 'while(get()) {';
        break;

      case ']':
        fnBody += '}';
        break;

      default: // do nothing
    }
  }

  fnBody += 'return {out, mem};';

  return new Function('inp', fnBody)(inp);
}

module.exports = { bfi };
