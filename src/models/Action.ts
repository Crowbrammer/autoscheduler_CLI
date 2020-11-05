import {AutoschedulerModel} from "./Model";

export default class Action extends AutoschedulerModel {
    id: number | string;
    name: string;
    duration: number | string;
    is_deleted: boolean
    constructor(options) {
        super();
        if (!options) options = {};
        this.id = options.id;
        this.name = options.name;
        this.duration = options.duration;
    };

    async create() { // Populates the name and duration of the action object.
        this.id = (await this.driver.query(`INSERT INTO actions (name, duration) VALUES ('${this.name}', '${this.duration}')`)).insertId;
        const templates = await this.driver.query(`SELECT id FROM schedule_templates WHERE is_current = true;`);
        if (templates.length === 1) {
            const currentTemplateId = templates[0].id;
            await this.link(currentTemplateId);
        } else if (templates.length > 1) {
            throw new Error('There\'s more than one template set as current;');
        }
        return this;
    };

    async link(templateId: number) {
        if (!this.id) throw new Error('Cannot link with an id'); 
        return (await this.driver.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${templateId}, ${this.id});`)).insertId;
    }   

    async retrieve() { // A single action.
        const actions = await this.driver.query(`SELECT * FROM actions WHERE id = ${this.id} AND is_deleted IS NULL;`);
        if (actions.length === 1) {
            this.name = actions[0].name;
            this.duration = actions[0].duration;
        } else if (actions.length > 1) {
            throw new Error('More than one id found in this table');
        } 
        return this;
    };
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
    };
    async delete() {
        if (!this.id)
            throw new Error('Can\'t delete an action without an id');
        await this.driver.query(`UPDATE actions SET is_deleted = true WHERE id = ${this.id}`);
        this.is_deleted = true;
        this.name = null;
        this.duration = null;
    };
}