require('dotenv').config();
import Migration from '../Migration';
const sqlite3 = require('sqlite3');
const open = require('sqlite').open;
const {sqlite_db_loc} = require('../../env.js');

class MCreateTablesMigration implements Migration {
    async up() {
        const db = await this.makeDb();
        db.exec('CREATE TABLE blah (id INTEGER PRIMARY KEY AUTOINCREMENT)')
    }
    async down() {}
    async refresh() {}
    async makeDb() {
        return await open({
                  filename: sqlite_db_loc
                  driver: sqlite3.Database
                })
    }
}

// Need to know more about decorators, static, etc.
const createTablesMigration = new MCreateTablesMigration();
export {createTablesMigration};
 
// this is a top-level await 
// (async () => {
//     // open the database
//     const db = await open({
//       filename: __dirname + '/database.db',
//       driver: sqlite3.Database
//     })
// })()


async function up(pQuery: any, loud: boolean): Promise<void> {
}

async function down(pQuery: any, loud: boolean): Promise<void> {
}

async function dropTable(loud: boolean, pQuery: any, table_name: string) {
}

async function refresh(pQuery: any, loud: boolean): Promise<void> {
    await down(pQuery, loud);
    await up(pQuery, loud);
}

async function main(isTest:boolean, loud: boolean): Promise<void> {
    await refresh(pQuery, loud);
    pQuery.connection.end();
}

if (require.main === module) {
    if (/l|(loud)/i.test(process.argv[2])) {
        main('loud').catch(err => console.error(err));
    } else {
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