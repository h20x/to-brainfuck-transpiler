const { ASTNodeType, NodeVisitor } = require('./ast');
const { SymbolTable } = require('./symbol-table');
const { SymbolType, Sym } = require('./symbol');

class SemanticAnalyser extends NodeVisitor {
  constructor(errNotifier) {
    super();
    this._symTable = new SymbolTable();
    this._errNotifier = errNotifier;
  }

  visit(ast) {
    new ProcCollector(this._symTable, this._errNotifier).visit(ast);
    super.visit(ast);
    new RecursionChecker().visit(ast);
  }

  visitStmt(node) {
    for (const arg of node.args()) {
      arg.accept(this);
    }

    if (ASTNodeType.CALL === node.type()) {
      const args = node.args();
      const proc = args.shift();
      const actualParams = args;
      const def = this._symTable.get(proc.name()).node();
      const formalParams = def.params();

      if (actualParams.length !== formalParams.length) {
        this._errNotifier.notify(
          `Wrong number of arguments for '${proc.name()}'`,
          node.sourcePos()
        );
      }
    }
  }

  visitCompoundStmt(node) {
    for (const arg of node.args()) {
      arg.accept(this);
    }

    node.body().accept(this);
  }

  visitRef(node) {
    const sym = this._symTable.get(node.name());

    if (null == sym) {
      this._errNotifier.notify(
        `'${node.name()}' is not defined`,
        node.sourcePos()
      );
    }

    switch (node.type()) {
      case ASTNodeType.VAR_REF:
        if (SymbolType.VAR !== sym.type()) {
          this._errNotifier.notify(
            `'${node.name()}' is not a variable`,
            node.sourcePos()
          );
        }
        break;

      case ASTNodeType.ARR_REF:
        if (SymbolType.ARR !== sym.type()) {
          this._errNotifier.notify(
            `'${node.name()}' is not an array`,
            node.sourcePos()
          );
        }
        break;

      case ASTNodeType.PROC_REF:
        if (SymbolType.PROC !== sym.type()) {
          this._errNotifier.notify(
            `'${node.name()}' is not a procedure`,
            node.sourcePos()
          );
        }
        break;
    }
  }

  visitDecl(node) {
    if (this._symTable.has(node.name())) {
      this._errNotifier.notify(
        `'${node.name()}' is already declared`,
        node.sourcePos()
      );
    }

    const symType =
      ASTNodeType.ARR_DECL === node.type() ? SymbolType.ARR : SymbolType.VAR;
    this._symTable.add(new Sym(node.name(), symType, node));
  }

  visitProcDef(node) {
    this._symTable = new SymbolTable(this._symTable);

    for (const param of node.params()) {
      this._symTable.add(new Sym(param, SymbolType.VAR));
    }

    node.body().accept(this);
    this._symTable = this._symTable.parent();
  }
}

class ProcCollector extends NodeVisitor {
  constructor(symTable, errNotifier) {
    super();
    this._symTable = symTable;
    this._errNotifier = errNotifier;
  }

  visitProcDef(node) {
    if (this._symTable.has(node.name())) {
      this._errNotifier.notify(
        `'${node.name()}' is already declared`,
        node.sourcePos()
      );
    }

    this._symTable.add(new Sym(node.name(), SymbolType.PROC, node));
  }
}

class RecursionChecker extends NodeVisitor {
  constructor() {
    super();
    this._proc = null;
    this._callTable = new Map();
  }

  visit(ast) {
    super.visit(ast);
    this._checkForRecursion();
  }

  visitStmt(node) {
    if (ASTNodeType.CALL === node.type()) {
      const callee = node.args()[0].name();
      this._addCallee(callee);
    }
  }

  visitCompoundStmt(node) {
    node.body().accept(this);
  }

  visitProcDef(node) {
    this._proc = node.name();
    node.body().accept(this);
    this._proc = null;
  }

  _addCallee(callee) {
    if (null == this._proc) {
      return;
    }

    if (!this._callTable.has(this._proc)) {
      this._callTable.set(this._proc, new Set());
    }

    this._callTable.get(this._proc).add(callee);
  }

  _checkForRecursion() {
    for (const [caller, callees] of this._callTable.entries()) {
      this._check(callees, new Set([caller]));
    }
  }

  _check(procNames, chain) {
    for (const proc of procNames) {
      if (chain.has(proc)) {
        this._error(chain);
      }

      if (this._callTable.has(proc)) {
        this._check(this._callTable.get(proc), new Set(chain).add(proc));
      }
    }
  }

  _error(chain) {
    const _chain = [...chain];
    _chain.push(_chain[0]);
    throw new Error(`Recursive call detected:\n${_chain.join(' -> ')}`);
  }
}

module.exports = { SemanticAnalyser };
