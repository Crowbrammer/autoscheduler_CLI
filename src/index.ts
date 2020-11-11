import { config } from 'dotenv';
import Builder from './builders/Builder';
import AutoschedulerApp from './App';
import { AutoschedulerModel } from './models/Model';

config({path: __dirname + '/../.env'});

async function main() {
    /**
     * So that I can use this anywhere, I made it able to use SQLite in addition
     * to MySQL. This require some config.
     */

    let driver;
    if (process.env.DB_DRIVER === 'sqlite') {
        const sqlite3  = require('sqlite3');
        const { open } = require('sqlite');
        driver = await open({
            filename: __dirname + '/db/sqlite/database.db',
            driver: sqlite3.Database
        });
        driver.query = function (query) {
            if (/INSERT/.test(query)) {
                return this.run(query);
            } else {
                return this.all(query);
            }
        }
    } else {
        const PQuery        = require('prettyquery');
        driver              = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});
    }

    /**
     * PQuery or prettyquery is a Node.js MySQL promise-basde package 
     * I made because I didn't find anything satisfactory at the time.
     */

    Builder.driver = driver;
    AutoschedulerModel.driver = driver;

    // App
    const app = new AutoschedulerApp();
    // Put the process arguments in
    app.in(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
    // Run it
    await app.run();
    // Print the output
    console.log(app.out);
    process.exit(0);
}

main().catch(err => console.error(err));