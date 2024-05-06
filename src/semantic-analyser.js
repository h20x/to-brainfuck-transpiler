const { ASTNodeType } = require('./ast');
const { SymbolTable } = require('./symbol-table');
const { SymbolType, Sym } = require('./symbol');
const { ParsingError } = require('./parsing-error');

class SemanticAnalyser {
  constructor(ast, source, symTable) {
    this._ast = ast;
    this._source = source;
    this._symTable = symTable;
  }

  analyse() {
    new DefinitionChecker(this._ast, this._source, this._symTable).check();
    new RecursionChecker(this._ast).check();
  }
}

class DefinitionChecker {
  constructor(ast, source, symTable) {
    this._ast = ast;
    this._source = source;
    this._symTable = symTable;
  }

  check() {
    this._checkNode(this._ast);
  }

  _checkNode(node) {
    switch (node.type()) {
      case ASTNodeType.VAR_DECL:
      case ASTNodeType.ARR_DECL:
      case ASTNodeType.NUM:
      case ASTNodeType.CHAR:
      case ASTNodeType.STR:
        return;

      case ASTNodeType.STMT_LIST:
        return this._checkStmtList(node);

      case ASTNodeType.PROC_DEF:
        return this._checkProcDef(node);

      case ASTNodeType.CALL:
        return this._checkCall(node);

      case ASTNodeType.VAR_REF:
      case ASTNodeType.ARR_REF:
      case ASTNodeType.PROC_REF:
        return this._checkRef(node);

      case ASTNodeType.IFEQ:
      case ASTNodeType.IFNEQ:
      case ASTNodeType.WNEQ:
        return this._checkCompoundStmt(node);

      default:
        return this._checkArgs(node);
    }
  }

  _checkStmtList(node) {
    for (const child of node.children()) {
      this._checkNode(child);
    }
  }

  _checkCompoundStmt(node) {
    this._checkArgs(node);
    this._checkNode(node.body());
  }

  _checkCall(node) {
    this._checkArgs(node);
    this._checkParams(node);
  }

  _checkParams(node) {
    const args = node.args();
    const proc = args.shift();
    const actualParams = args;
    const def = this._symTable.get(proc.name()).node();
    const formalParams = def.params();

    if (actualParams.length !== formalParams.length) {
      this._error(
        `Wrong number of arguments for '${proc.name()}' procedure`,
        node.sourcePos()
      );
    }
  }

  _checkArgs(node) {
    for (const arg of node.args()) {
      this._checkNode(arg);
    }
  }

  _checkRef(node) {
    const sym = this._symTable.get(node.name());

    if (null == sym) {
      this._error(`'${node.name()}' is not defined`, node.sourcePos());
    }

    switch (node.type()) {
      case ASTNodeType.VAR_REF:
        if (SymbolType.VAR !== sym.type()) {
          this._error(`'${node.name()}' is not a variable`, node.sourcePos());
        }
        break;

      case ASTNodeType.ARR_REF:
        if (SymbolType.ARR !== sym.type()) {
          this._error(`'${node.name()}' is not an array`, node.sourcePos());
        }
        break;

      case ASTNodeType.PROC_REF:
        if (SymbolType.PROC !== sym.type()) {
          this._error(`'${node.name()}' is not a procedure`, node.sourcePos());
        }
        break;
    }
  }

  _checkProcDef(node) {
    this._symTable = new SymbolTable(this._symTable);

    for (const param of node.params()) {
      this._symTable.add(new Sym(param, SymbolType.VAR));
    }

    this._checkNode(node.body());
    this._symTable = this._symTable.parent();
  }

  _error(msg, { column, line }) {
    throw new ParsingError({
      msg,
      src: this._source,
      col: column,
      ln: line,
    });
  }
}

class RecursionChecker {
  constructor(ast) {
    this._ast = ast;
    this._proc = null;
    this._callTable = new Map();
  }

  check() {
    this._visitNode(this._ast);
    this._checkAllForRecursion();
  }

  _visitNode(node) {
    switch (node.type()) {
      case ASTNodeType.STMT_LIST:
        return this._visitStmtList(node);

      case ASTNodeType.CALL:
        return this._visitCall(node);

      case ASTNodeType.PROC_DEF:
        return this._visitProcDef(node);

      case ASTNodeType.IFEQ:
      case ASTNodeType.IFNEQ:
      case ASTNodeType.WNEQ:
        return this._visitBody(node);
    }
  }

  _visitStmtList(node) {
    for (const child of node.children()) {
      this._visitNode(child);
    }
  }

  _visitCall(node) {
    const callee = node.args()[0].name();
    this._addCallee(callee);
  }

  _visitProcDef(node) {
    this._proc = node.name();
    this._visitBody(node);
    this._proc = null;
  }

  _visitBody(node) {
    this._visitNode(node.body());
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

  _checkAllForRecursion() {
    for (const [caller, callees] of this._callTable.entries()) {
      this._checkForRecursion(callees, new Set([caller]));
    }
  }

  _checkForRecursion(procNames, chain) {
    for (const proc of procNames) {
      if (chain.has(proc)) {
        this._error(chain);
      }

      if (this._callTable.has(proc)) {
        this._checkForRecursion(
          this._callTable.get(proc),
          new Set(chain).add(proc)
        );
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
