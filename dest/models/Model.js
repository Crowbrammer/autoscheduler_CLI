"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
dotenv_1.config({ path: __dirname + '/../../.env' });
class AutoschedulerModel {
    constructor(options) {
        this.driver = AutoschedulerModel.driver;
    }
    create() { }
    ;
    retrieve() { }
    ;
    update() { }
    ;
    delete() { }
    ;
    async insert(query) {
        switch (this.driver.constructor.name) {
            case 'Database': // SQLite
                return (await this.driver.query(query)).lastID;
            case 'PQuery':
                return (await this.driver.query(query)).insertId;
            default:
                throw new Error('Driver not supported or non-existent.');
        }
    }
    ;
}
exports.AutoschedulerModel = AutoschedulerModel;
