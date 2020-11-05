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
    async retrieve() {
        const actions = await this.driver.query(`SELECT * FROM actions WHERE id = ${this.id} AND is_deleted IS NULL;`);
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
    async update() {
        if (!this.id)
            throw new Error('Can\'t update an action without an id');
        if (this.name && this.duration) {
            await this.driver.query(`UPDATE actions SET name = "${this.name}", duration = ${this.duration} WHERE ID = ${this.id}`);
        }
        else if (this.name && !this.duration) {
            await this.driver.query(`UPDATE actions SET name = "${this.name}" WHERE ID = ${this.id}`);
        }
        else if (!this.name && this.duration) {
            await this.driver.query(`UPDATE actions SET duration = ${this.duration} WHERE ID = ${this.id}`);
        }
    }
    ;
    async delete() {
        if (!this.id)
            throw new Error('Can\'t delete an action without an id');
        await this.driver.query(`UPDATE actions SET is_deleted = true WHERE id = ${this.id}`);
        this.is_deleted = true;
        this.name = null;
        this.duration = null;
    }
    ;
}
exports.default = Action;