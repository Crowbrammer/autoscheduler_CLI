import {AutoschedulerModel} from "./Model";
const esc = require('sql-escape');

export default class Checklist extends AutoschedulerModel {
    id: number | string;
    name: string;
    is_deleted: boolean
    constructor(options?) {
        super(options);
        if (!options) options = {};
        this.id = options.id;
        this.name = options.name;
        if (!this.driver) throw new Error('Set AutoschedulerModel.driver to your db driver.');
    };

    async checkLink(obj) {
        switch (obj.constructor.name) {
            case 'Action':
                const link = await this.driver.query(`SELECT * FROM checklist_actions WHERE checklist_id = ${this.id} AND action_id = ${obj.id}`);
                return link.length === 1 ? link[0] : null;
        
            default:
                break;
        }

    }

    async link(obj) {
        switch (obj.constructor.name) {
            case 'Action':
                await this.driver.query(`INSERT INTO checklist_actions (checklist_id, action_id) VALUES (${this.id}, ${obj.id});`);
                const link = await this.driver.query(`SELECT * FROM checklist_actions WHERE checklist_id = ${this.id} AND action_id = ${obj.id}`);
                if (link.length === 0) throw new Error('Link function not adding the link');
                return link.length === 1 ? link[0] : null;
        
            default:
                break;
        }
    }

    async getActions() {
        return await this.driver.query(`SELECT * FROM checklist_actions INNER JOIN actions WHERE checklist_id = ${this.id} ORDER BY order_num`);
    }

    async getCurrentChecklist() {
        const currentCls = await this.driver.query(`SELECT * FROM checklists WHERE is_current = true;`);
        if (currentCls.length === 0) {
            throw new Error('No checklist set as current.');
        } else if (currentCls.length > 1) {
            throw new Error('Multiple checklists set as current.'); // This one'll bite me later.
        } else {
            this.id = currentCls[0].id;
            this.name = currentCls[0].name;
        }
        return this;
    }

    async markAsCurrent() {
        if (!this.id)
            throw new Error('This method requires an id to use.');
        const pullWhereThisId = await this.driver.query(`SELECT id FROM checklists WHERE id = ${this.id}`);
        if (pullWhereThisId.length === 0)
            throw new Error('This checklist\'s id doesn\'t exist in the checklists table.');
        await this.driver.query('UPDATE checklists SET is_current = false');
        return await this.driver.query(`UPDATE checklists SET is_current = true WHERE id = ${this.id}`);
    }
}