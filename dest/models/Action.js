"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
class Action extends Model_1.AutoschedulerModel {
    constructor(options) {
        super();
        if (!options)
            options = {};
        this.id = options.id;
        this.name = options.name;
        this.duration = options.duration;
    }
    ;
    async create() {
        this.id = (await this.driver.query(`INSERT INTO actions (name, duration) VALUES ('${this.name}', '${this.duration}')`)).insertId;
        return this;
    }
    ;
    // Only one...
    async retrieve() {
        const actions = await this.driver.query(`SELECT * FROM actions WHERE id = ${this.id}`);
        if (actions.length === 1) {
            this.name = actions[0].name;
            this.duration = actions[0].duration;
        }
        else if (actions.length > 1) {
            throw new Error('More than one id found in this table');
        }
        return this;
    }
    ;
    async update() { }
    ;
    async delete() { }
    ;
}
exports.default = Action;
