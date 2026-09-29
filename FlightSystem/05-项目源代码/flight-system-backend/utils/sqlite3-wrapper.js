// 使用 better-sqlite3 提供 sqlite3 风格的异步 API，供 Sequelize 使用
const { EventEmitter } = require('events');
const BetterSQLite3 = require('better-sqlite3');

const OPEN_READONLY = 1;
const OPEN_READWRITE = 2;
const OPEN_CREATE = 4;

class Database extends EventEmitter {
  constructor(path, mode, callback) {
    super();

    // 处理参数重载：new Database(path), new Database(path, callback), new Database(path, mode, callback)
    if (typeof mode === 'function') {
      callback = mode;
      mode = undefined;
    }
    mode = mode || (OPEN_READWRITE | OPEN_CREATE);

    this.filename = path || ':memory:';

    try {
      const readOnly = (mode & OPEN_READONLY) === OPEN_READONLY;
      const fileMustExist = !readOnly && (mode & OPEN_CREATE) === 0;
      this.db = new BetterSQLite3(this.filename, { fileMustExist, readonly: readOnly });
      this.open = true;
      process.nextTick(() => {
        this.emit('open');
        if (typeof callback === 'function') {
          callback(null);
        }
      });
    } catch (err) {
      this.open = false;
      process.nextTick(() => {
        this.emit('error', err);
        if (typeof callback === 'function') {
          callback(err);
        } else {
          throw err;
        }
      });
    }
  }

  _normalizeParams(params) {
    if (params === undefined || params === null) return [];
    if (Array.isArray(params)) {
      if (params.length === 1 && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])) {
        return params[0];
      }
      return params;
    }
    return params;
  }

  _replacePlaceholders(sql) {
    // Replace $n placeholders only outside of quoted string literals.
    // Handles SQL like `UPDATE t SET price=price+$1 WHERE code=$2 AND name='Flight $3'`.
    let result = '';
    let i = 0;
    while (i < sql.length) {
      const c = sql[i];
      if (c === "'") {
        // Copy the entire quoted literal, including doubled quotes
        let j = i + 1;
        while (j < sql.length) {
          if (sql[j] === "'" && sql[j + 1] === "'") {
            j += 2;
          } else if (sql[j] === "'") {
            j++;
            break;
          } else {
            j++;
          }
        }
        result += sql.slice(i, j);
        i = j;
      } else if (c === '$' && /\d/.test(sql[i + 1])) {
        let j = i + 1;
        while (j < sql.length && /\d/.test(sql[j])) j++;
        result += '?';
        i = j;
      } else {
        result += c;
        i++;
      }
    }
    return result;
  }

  _prepare(sql, params) {
    if (!/\$\d+/.test(sql)) {
      return { sql, params };
    }

    const normalizedSql = this._replacePlaceholders(sql);

    // sqlite3 style: [{ $1: v1, $2: v2 }]
    if (Array.isArray(params) && params.length === 1 && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])) {
      const obj = params[0];
      const keys = Object.keys(obj).filter(k => /^\$\d+$/.test(k));
      keys.sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
      return { sql: normalizedSql, params: keys.map(k => obj[k]) };
    }

    // Object style: { $1: v1, $2: v2 }
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const keys = Object.keys(params).filter(k => /^\$\d+$/.test(k));
      keys.sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
      return { sql: normalizedSql, params: keys.map(k => params[k]) };
    }

    return { sql: normalizedSql, params };
  }

  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = this._normalizeParams(params);
    const prepared = this._prepare(sql, params);
    try {
      const stmt = this.db.prepare(prepared.sql);
      const rawResult = Array.isArray(prepared.params)
        ? stmt.run(...prepared.params)
        : stmt.run(prepared.params);
      const sqlite3Result = {
        lastID: rawResult.lastInsertRowid,
        changes: rawResult.changes
      };
      if (typeof callback === 'function') {
        process.nextTick(() => callback.call(sqlite3Result, null, sqlite3Result));
      }
      return this;
    } catch (err) {
      if (typeof callback === 'function') {
        process.nextTick(() => callback(err));
        return this;
      }
      throw err;
    }
  }

  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = this._normalizeParams(params);
    const prepared = this._prepare(sql, params);
    try {
      const stmt = this.db.prepare(prepared.sql);
      let rows;
      try {
        rows = Array.isArray(prepared.params)
          ? stmt.all(...prepared.params)
          : stmt.all(prepared.params);
      } catch (innerErr) {
        if (innerErr.message && innerErr.message.includes('This statement does not return data')) {
          Array.isArray(prepared.params)
            ? stmt.run(...prepared.params)
            : stmt.run(prepared.params);
          rows = [];
        } else {
          throw innerErr;
        }
      }
      if (typeof callback === 'function') {
        process.nextTick(() => callback(null, rows));
      }
      return this;
    } catch (err) {
      if (typeof callback === 'function') {
        process.nextTick(() => callback(err));
        return this;
      }
      throw err;
    }
  }

  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = this._normalizeParams(params);
    const prepared = this._prepare(sql, params);
    try {
      const stmt = this.db.prepare(prepared.sql);
      let row;
      try {
        row = Array.isArray(prepared.params)
          ? stmt.get(...prepared.params)
          : stmt.get(prepared.params);
      } catch (innerErr) {
        if (innerErr.message && innerErr.message.includes('This statement does not return data')) {
          Array.isArray(prepared.params)
            ? stmt.run(...prepared.params)
            : stmt.run(prepared.params);
          row = undefined;
        } else {
          throw innerErr;
        }
      }
      if (typeof callback === 'function') {
        process.nextTick(() => callback(null, row));
      }
      return this;
    } catch (err) {
      if (typeof callback === 'function') {
        process.nextTick(() => callback(err));
        return this;
      }
      throw err;
    }
  }

  close(callback) {
    try {
      this.db.close();
      this.open = false;
      process.nextTick(() => {
        this.emit('close');
        if (typeof callback === 'function') {
          callback(null);
        }
      });
    } catch (err) {
      process.nextTick(() => {
        if (typeof callback === 'function') {
          callback(err);
        } else {
          throw err;
        }
      });
    }
  }

  serialize(callback) {
    if (typeof callback === 'function') {
      process.nextTick(() => callback());
    }
  }

  parallelize(callback) {
    if (typeof callback === 'function') {
      process.nextTick(() => callback());
    }
  }
}

Database.OPEN_READONLY = OPEN_READONLY;
Database.OPEN_READWRITE = OPEN_READWRITE;
Database.OPEN_CREATE = OPEN_CREATE;

module.exports = { Database };
module.exports.default = module.exports;
module.exports.OPEN_READONLY = OPEN_READONLY;
module.exports.OPEN_READWRITE = OPEN_READWRITE;
module.exports.OPEN_CREATE = OPEN_CREATE;
