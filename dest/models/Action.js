"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
const esc = require('sql-escape');
class Action extends Model_1.AutoschedulerModel {
    constructor(options) {
        super(options);
        if (!options)
            options = {};
        this.id = options.id;
        this.name = options.name;
        this.duration = options.duration;
        if (!this.driver)
            throw new Error('Set AutoschedulerModel.driver to your db driver.');
    }
    ;
    async create() {
        this.id = await this.insert(`INSERT INTO actions (name, duration) VALUES ('${this.name}', '${this.duration}')`);
        const templates = await this.driver.query(`SELECT id FROM schedule_templates WHERE is_current = true;`);
        if (templates.length === 1) {
            const currentTemplateId = templates[0].id;
            await this.link(currentTemplateId);
        }
        else if (templates.length > 1) {
            throw new Error('There\'s more than one template set as current;');
        }
        return this;
    }
    ;
    static async delete(id) {
        // Just remove it at a given id
        await this.driver.query(`DELETE FROM schedule_template_actions WHERE action_id = ${id}`);
        await this.driver.query(`DELETE FROM actions WHERE id = ${id}`);
        return `Action of id, ${id}, deleted.`;
    }
    async link(templateId) {
        if (!this.id)
            throw new Error('Cannot link without an id');
        const numStas = (await this.driver.query(`SELECT schedule_template_id FROM schedule_template_actions WHERE schedule_template_id = ${templateId}`)).length;
        return (await this.driver.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id, order_num) VALUES (${templateId}, ${this.id}, ${numStas + 1})`)).insertId;
    }
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
