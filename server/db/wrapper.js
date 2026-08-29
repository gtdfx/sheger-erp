// Wrapper to make sql.js behave like better-sqlite3 API

let _db = null;
let _saveFn = null;

function setDB(db, saveFn) {
  _db = db;
  _saveFn = saveFn;
}

function prepare(sql) {
  return {
    run(...params) {
      _db.run(sql, params);
      if (_saveFn) _saveFn();
      return { changes: _db.getRowsModified(), lastInsertRowid: _db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0 };
    },
    get(...params) {
      const stmt = _db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        stmt.free();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      const results = [];
      const stmt = _db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((c, i) => row[c] = vals[i]);
        results.push(row);
      }
      stmt.free();
      return results;
    }
  };
}

function run(sql, ...params) {
  _db.run(sql, params);
  if (_saveFn) _saveFn();
  return { changes: _db.getRowsModified() };
}

function exec(sql) {
  _db.run(sql);
  if (_saveFn) _saveFn();
}

// Compatibility wrapper that routes can use
const wrapper = {
  prepare,
  run,
  exec,
  pragma: () => {}
};

module.exports = { wrapper, setDB };
