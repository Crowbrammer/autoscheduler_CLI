"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PQuery = require('prettyquery');
const dbCreds = { user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE };
class AutoschedulerModel {
    constructor() {
        this.driver = new PQuery(dbCreds);
    }
    create() { }
    ;
    retrieve() { }
    ;
    update() { }
    ;
    delete() { }
    ;
}
exports.AutoschedulerModel = AutoschedulerModel;
