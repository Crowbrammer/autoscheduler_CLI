import { AutoschedulerModel } from "./Model";

export default class Template extends AutoschedulerModel{

    name: string | void;
    id: number | void;
    constructor(options) {
        super();
        if (!options) options = {};
        this.name = options.name || '';
        this.id = options.id;
    }

    async checkLink(obj) {
        switch (obj.constructor.name) {
            case 'Action':
                const link = await this.driver.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${this.id} AND action_id = ${obj.id}`);
                return link.length === 1 ? link[0] : null;
        
            default:
                break;
        }

    }

    async link(obj) {
        switch (obj.constructor.name) {
            case 'Action':
                await this.driver.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${this.id}, ${obj.id});`);
                const link = await this.driver.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${this.id} AND action_id = ${obj.id}`);
                if (link.length === 0) throw new Error('Link function not adding the link');
                return link.length === 1 ? link[0] : null;
        
            default:
                break;
        }
    }
    
    async getActions() {
        return await this.driver.query(`SELECT * FROM schedule_template_actions INNER JOIN actions WHERE schedule_template_id = ${this.id} ORDER BY order_num`);
    }

    async getCurrentTemplate() {
        const currentCls = await this.driver.query(`SELECT * FROM schedule_templates WHERE is_current = true;`);
        if (currentCls.length === 0) {
            throw new Error('No schedule_template set as current.');
        } else if (currentCls.length > 1) {
            throw new Error('Multiple schedule_templates set as current.'); // This one'll bite me later.
        } else {
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