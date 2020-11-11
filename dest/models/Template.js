"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Action_1 = require("./Action");
const Model_1 = require("./Model");
class Template extends Model_1.AutoschedulerModel {
    constructor(options) {
        super();
        if (!options)
            options = {};
        this.name = options.name || '';
        this.id = options.id;
    }
    async hasLinkWith(obj) {
        if (!this.id)
            throw new Error('Attach an id to this Template object check for links.');
        if (!obj.id)
            throw new Error('Attach an id to the object for which you\'re checking for links.');
        switch (obj.constructor.name) {
            case 'Action':
                // Check the schedule_events table for an entry connecting it
                const links = await this.driver.query(`SELECT schedule_template_id, action_id, order_num FROM schedule_template_actions WHERE schedule_template_id = ${this.id} AND action_id = ${obj.id}`);
                // If it's there (> 0), return the query;
                // If it's not there, return null
                return links.length > 0 ? links[0] : null;
            default:
                break;
        }
    }
    async link(obj) {
        switch (obj.constructor.name) {
            case 'Action':
                const existingLink = await this.hasLinkWith(obj);
                if (existingLink) {
                    return existingLink;
                }
                await this.driver.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${this.id}, ${obj.id});`);
                const link = await this.driver.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${this.id} AND action_id = ${obj.id}`);
                if (!(await this.hasLinkWith(obj)))
                    throw new Error('Link function not adding the link');
                return link.length === 1 ? link[0] : null;
            default:
                break;
        }
    }
    async getActions() {
        const results = await this.driver.query(`SELECT * FROM schedule_template_actions sta INNER JOIN actions a ON sta.action_id = a.id WHERE schedule_template_id = ${this.id} ORDER BY order_num`);
        const actions = results.map(r => new Action_1.default(r));
        return actions;
    }
    async getCurrentTemplate() {
        const currentCls = await this.driver.query(`SELECT * FROM schedule_templates WHERE is_current = true;`);
        if (currentCls.length === 0) {
            throw new Error('No schedule_template set as current.');
        }
        else if (currentCls.length > 1) {
            throw new Error('Multiple schedule_templates set as current.'); // This one'll bite me later.
        }
        else {
            this.id = currentCls[0].id;
            this.name = currentCls[0].name;
        }
        return this;
    }
    async markAsCurrent() {
        if (!this.id)
            throw new Error('This method requires an id to use.');
        const pullWhereThisId = await this.driver.query(`SELECT id FROM schedule_templates WHERE id = ${this.id}`);
        if (pullWhereThisId.length === 0)
            throw new Error('This schedule_template\'s id doesn\'t exist in the schedule_templates table.');
        await this.driver.query('UPDATE schedule_templates SET is_current = false');
        return await this.driver.query(`UPDATE schedule_templates SET is_current = true WHERE id = ${this.id}`);
    }
}
exports.default = Template;
