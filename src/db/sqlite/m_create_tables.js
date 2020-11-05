"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const sqlite3 = require('sqlite3');
const open = require('sqlite').open;
const { sqlite_db_loc } = require('../../env.js');
class MCreateTablesMigration {
    async up() {
        const db = await this.makeDb();
        db.exec('CREATE TABLE blah (id INTEGER PRIMARY KEY AUTOINCREMENT)');
    }
    async down() { }
    async refresh() { }
    async makeDb() {
        return await open({
            filename: sqlite_db_loc,
            driver: sqlite3.Database
        });
    }
}
// Need to know more about decorators, static, etc.
const createTablesMigration = new MCreateTablesMigration();
exports.createTablesMigration = createTablesMigration;
// this is a top-level await 
// (async () => {
//     // open the database
//     const db = await open({
//       filename: __dirname + '/database.db',
//       driver: sqlite3.Database
//     })
// })()
async function up(pQuery, loud) {
}
async function down(pQuery, loud) {
}
async function dropTable(loud, pQuery, table_name) {
}
async function refresh(pQuery, loud) {
    await down(pQuery, loud);
    await up(pQuery, loud);
}
async function main(isTest, loud) {
    await refresh(pQuery, loud);
    pQuery.connection.end();
}
if (require.main === module) {
    if (/l|(loud)/i.test(process.argv[2])) {
        main('loud').catch(err => console.error(err));
    }
    else {
        main().catch(err => console.error(err));
    }
}
// delete require.cache[module.id];
// module.exports = main;
/**
 * Adding a new one
 * Removing
 * Moving a different
 */ 
