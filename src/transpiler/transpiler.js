const { BFM } = require('./bf/bfm');
const { ASTNodeType } = require('../ast');

class Transpiler {
  constructor(ast) {
    this._ast = ast;
    this._bfm = new BFM();
    this._procedures = new Map();
  }

  transpile() {
    this._collectProcedures([this._ast]);
    this._transpile(this._ast);

    return this._bfm.code();
  }

  _collectProcedures(nodes) {
    for (const node of nodes) {
      if (ASTNodeType.STMT_LIST === node.type()) {
        this._collectProcedures(node.children());
      } else if (ASTNodeType.PROC_DEF === node.type()) {
        this._procedures.set(node.name(), node);
      }
    }
  }

  _transpile(node) {
    const args = this._args(node);

    switch (node.type()) {
      case ASTNodeType.STMT_LIST:
        return this._transpileStmtList(node);

      case ASTNodeType.DECL_LIST:
        return this._transpileDeclList(node);

      case ASTNodeType.MSG:
        return this._transpileMsg(node);

      case ASTNodeType.CALL:
        return this._transpileCall(node);

      case ASTNodeType.SET:
        return this._bfm.set(...args.reverse());

      case ASTNodeType.INC:
        return this._bfm.inc(...args.reverse());

      case ASTNodeType.DEC:
        return this._bfm.dec(...args.reverse());

      case ASTNodeType.ADD:
        return this._bfm.add(...args);

      case ASTNodeType.SUB:
        return this._bfm.sub(...args);

      case ASTNodeType.MUL:
        return this._bfm.mul(...args);

      case ASTNodeType.DIVMOD:
        return this._bfm.divmod(...args);

      case ASTNodeType.DIV:
        return this._bfm.div(...args);

      case ASTNodeType.MOD:
        return this._bfm.mod(...args);

      case ASTNodeType.CMP:
        return this._bfm.cmp(...args);

      case ASTNodeType.A2B:
        return this._bfm.a2b(...args);

      case ASTNodeType.B2A:
        return this._bfm.b2a(...args);

      case ASTNodeType.READ:
        return this._bfm.in(...args);

      case ASTNodeType.LSET:
        return this._bfm.lset(...args);

      case ASTNodeType.LGET:
        return this._bfm.lget(...args);

      case ASTNodeType.WNEQ:
        return this._bfm.wneq(...args, () => this._transpile(node.body()));

      case ASTNodeType.IFEQ:
        return this._bfm.cond(...args, () => this._transpile(node.body()));

      case ASTNodeType.IFNEQ:
        return this._bfm.cond(...args, null, () =>
          this._transpile(node.body())
        );
    }
  }

  _transpileStmtList(node) {
    for (const child of node.children()) {
      this._transpile(child);
    }
  }

  _transpileDeclList(node) {
    for (const arg of node.args()) {
      switch (arg.type()) {
        case ASTNodeType.VAR_DECL:
          this._bfm.decl(arg.name());
          break;

        case ASTNodeType.ARR_DECL:
          this._bfm.decl([arg.name(), arg.size()]);
          break;
      }
    }
  }

  _transpileMsg(node) {
    for (const arg of node.args()) {
      switch (arg.type()) {
        case ASTNodeType.VAR_REF:
          this._bfm.out(arg.name());
          break;

        case ASTNodeType.STR:
          this._bfm.outStr(arg.value());
          break;
      }
    }
  }

  _transpileCall(node) {
    const [name, ...actualParams] = node.args().map(this._val);
    const proc = this._procedures.get(name);
    const formalParams = proc.params();
    const params = [];

    for (let i = 0; i < actualParams.length; i++) {
      params.push([actualParams[i], formalParams[i]]);
    }

    this._bfm.enter(params);
    this._transpile(proc.body());
    this._bfm.leave();
  }

  _args(node) {
    if (ASTNodeType.STMT_LIST === node.type()) {
      return [];
    }

    return node.args().map(this._val);
  }

  _val(node) {
    switch (node.type()) {
      case ASTNodeType.NUM:
        return node.value();

      case ASTNodeType.CHAR:
        return node.value().charCodeAt();

      case ASTNodeType.VAR_REF:
      case ASTNodeType.ARR_REF:
      case ASTNodeType.PROC_REF:
        return node.name();
    }
  }
}

module.exports = { Transpiler };
