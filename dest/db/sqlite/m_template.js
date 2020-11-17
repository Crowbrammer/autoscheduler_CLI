"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const sqlite3 = require('sqlite3');
const open = require('sqlite').open;
class XMigration {
    constructor(driver) {
        this.driver = driver;
    }
    async up() {
        console.log('Up.');
    }
    async down() {
        console.log('Down.');
    }
    async refresh() {
        console.log('Refresh.');
        await this.down();
        await this.up();
    }
}
exports.XMigration = XMigration;
async function main() {
    const db = await open({
        filename: __dirname + '/database.db',
        driver: sqlite3.Database
    });
    switch (process.argv[2]) {
        case 'up':
            break;
        case 'down':
            break;
        case 'refresh':
            break;
        default:
            break;
    }
}
