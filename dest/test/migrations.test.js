// const expect = require('chai').expect;
// // import { CreateTablesMigration } from "../db/sqlite/m_create_tables";
// const {createTablesMigration} = require('../db/sqlite/m_create_tables');
// const {sqlite_db_loc} = require('../env.js');
// // Do my SQLite thing. 

// require('dotenv').config();
// const sqlite3 = require('sqlite3');
// const open = require('sqlite').open;
// console.log(process.env.LITE_DATABASE);

// describe('AutoschedulerMigrations', async function () {
//     let db;
//     before(async function () {
//         db = await open({
//             filename: 'database.db',
//             driver: sqlite3.Database
//           })
//     })

//     it('Creates the tables', async function () {
//         await createTablesMigration.up();
//         const res = await db.run(`select name from sqlite_master where type='table'`);
//         console.log(res);
//     })
// })