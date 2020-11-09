const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');

describe('Description', async function() {
    let sqliteInstance;
    before(async function() {
        sqliteInstance = await open({
            filename: __dirname + '/../../db/sqlite/database.db',
            driver: sqlite3.Database
        });
        sqliteInstance.query = function (query) {
            if (/INSERT/.test(query)) {
                return this.run(query);
            } else {
                return this.all(query);
            }
        }
        // await sqliteInstance.query('CREATE TABLE checklists (id INTEGER PRIMARY KEY AUTOINCREMENT)')
    });

    // Why: blah
    // What's the ability?
    // What's the prompt? 
    it('Has a checklists table', async function () {
        expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'checklists\';')).length).to.equal(1);
    })
});