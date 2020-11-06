require('dotenv').config();
const sqlite3 = require('sqlite3');
const open = require('sqlite').open;

export class XMigration {
    constructor (driver) {
        this.driver = driver;
    }
    async up(): Promise<void> {
        console.log('Up.');
    }
    
    async down(): Promise<void> {
        console.log('Down.');
    }
    
    async refresh(): Promise<void> {
        console.log('Refresh.');
        await this.down();
        await this.up();
    }
}


async function main(): Promise<void> {
    const db = await open({
        filename: __dirname + '/database.db',
        driver: sqlite3.Database
    })
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