"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Schedule_1 = require("./Schedule");
class Autoscheduler {
    constructor(options) {
        if (!options.driver)
            throw new Error('Add a (PQuery) driver to this before continuing.');
        this.driver = options.driver;
        this.create = new Create(options);
        this.delete = new Delete(options);
        this.retrieve = new Retrieve(options);
    }
}
exports.default = Autoscheduler;
class CRUD {
    constructor(options) {
        if (!options.driver)
            throw new Error('Add a (PQuery) driver to the Retrieve class before continuing.');
        this.driver = options.driver;
        this.current = new Current(options);
        this.related = new Related({ ...options, parent: this });
    }
    action() { }
    ;
    decision() { }
    ;
    obstacle(any) { }
    ;
    outcome(any) { }
    ;
    purpose(any) { }
    ;
    schedule(any) { }
    ;
    template(any) { }
    ;
}
class Create extends CRUD {
    action() { }
    ;
    async removeAllCurrent(table_name) {
        await this.driver.query(`UPDATE ${table_name} SET is_current = false`);
    }
    async obstacle(name) {
        await this.removeAllCurrent('obstacles');
        return (await this.driver.query(`INSERT INTO obstacles (name, is_current) VALUES ('${name}', true)`)).insertId;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
    async outcome(name) {
        await this.removeAllCurrent('outcomes');
        return (await this.driver.query(`INSERT INTO outcomes (name, is_current) VALUES ('${name}', true)`)).insertId;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
    async purpose(name) {
        await this.removeAllCurrent('purposes');
        return (await this.driver.query(`INSERT INTO purposes (name, is_current) VALUES ('${name}', true)`)).insertId;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
    async schedule() {
        await this.removeAllCurrent('schedules');
        // Get the current schedule template
        const currentScheduleTemplate = await this.current.template();
        // It should use the schedule template's name
        // const scheduleId = (await this.driver.query(`INSERT INTO schedules (name, is_current) VALUES ('${currentScheduleTemplate.name}', true)`)).insertId;
        // Create the events
        // Get the actions related to the schedule
        const templateActions = await this.driver.query(`SELECT * FROM schedule_template_actions sta \
        INNER JOIN actions a ON sta.action_id = a.id \
        WHERE sta.schedule_template_id = ${currentScheduleTemplate.id}`);
        const schedule = new Schedule_1.default(templateActions, currentScheduleTemplate.id, currentScheduleTemplate.name);
        await schedule.save();
        // Link the schedule to the current decisiion
        schedule.template = currentScheduleTemplate;
        schedule.decision = await this.current.decision();
        return schedule;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
    async template(name) {
        await this.removeAllCurrent('schedule_templates');
        return (await this.driver.query(`INSERT INTO schedule_templates (name, is_current) VALUES ('${name}', true)`)).insertId;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
}
class Update extends CRUD {
    action() { }
    ;
    async schedule(actionNum) {
        const oldScheduleTemplate = this.current.template();
        const oldActions = await pQuery;
        // Create a new schedule template with the actions after a certain point...
        return 3;
    }
    ;
}
class Delete extends CRUD {
    action() { }
    ;
    async obstacle(id) {
        await this.driver.query(`DELETE FROM obstacles WHERE id = ${id}`);
        return id;
    }
    ;
    async outcome(id) {
        await this.driver.query(`DELETE FROM outcomes WHERE id = ${id}`);
        return id;
    }
    ;
    async purpose(id) {
        await this.driver.query(`DELETE FROM purposes WHERE id = ${id}`);
        return id;
    }
    ;
    schedule() { }
    ;
    async template(id) {
        await this.driver.query(`DELETE FROM schedule_templates WHERE id = ${id}`);
        return id;
    }
    ;
}
class Retrieve extends CRUD {
    action() { }
    ;
    obstacle() { }
    ;
    async outcome(id) {
        const outcomes = await this.driver.query(`SELECT * FROM outcomes WHERE id = ${id}`);
        if (outcomes.length === 0)
            return null;
        return outcomes[0];
    }
    ;
    purpose() { }
    ;
    schedule() { }
    ;
}
class Current {
    constructor(options) {
        if (!options.driver)
            throw new Error('Add a (PQuery) driver to the Retrieve class before continuing.');
        this.driver = options.driver;
    }
    action() {
        return 'Actions aren\'t a type where \'Current status\' applies to.';
    }
    ;
    async decision() {
        const currentDecisions = await this.driver.query(`SELECT * FROM decisions WHERE is_current = true`);
        if (currentDecisions.length === 0)
            return null;
        return currentDecisions[0];
    }
    ;
    async obstacle() {
        const currentObstacles = await this.driver.query(`SELECT * FROM obstacles WHERE is_current = true`);
        if (currentObstacles.length === 0)
            return null;
        return currentObstacles[0];
    }
    ;
    async outcome() {
        const currentOutcomes = await this.driver.query(`SELECT * FROM outcomes WHERE is_current = true`);
        if (currentOutcomes.length === 0)
            return null;
        return currentOutcomes[0];
    }
    ;
    async purpose() {
        const currentPurposes = await this.driver.query(`SELECT * FROM purposes WHERE is_current = true`);
        if (currentPurposes.length === 0)
            return null;
        return currentPurposes[0];
    }
    ;
    schedule() { }
    ;
    async template() {
        const currentTemplates = await this.driver.query(`SELECT * FROM schedule_templates WHERE is_current = true ORDER BY id DESC`);
        if (currentTemplates.length === 0)
            return null;
        return currentTemplates[0];
    }
    ;
}
class Related {
    constructor(options) {
        if (!options.driver)
            throw new Error('Add a (PQuery) driver to the Add class before continuing.');
        this.driver = options.driver;
        this.parent = options.parent;
    }
    async actions() {
        // Find the current outcome... 
        const currentTemplate = await this.parent.current.template();
        return await this.driver.query(`SELECT * FROM schedule_template_actions sta \
                                                    INNER JOIN actions a ON sta.action_id = a.id \
                                                    WHERE sta.schedule_template_id = ${currentTemplate.id};`);
    }
    ;
    async decisions() {
        // Find the current outcome... 
        const currentObstacle = await this.parent.current.obstacle();
        return await this.driver.query(`SELECT * FROM obstacle_decisions od \
                                                    INNER JOIN decisions d ON od.decision_id = d.id \
                                                    WHERE od.obstacle_id = ${currentObstacle.id};`);
    }
    ;
    async obstacles() {
        // Find the current outcome... 
        const currentOutcome = await this.parent.current.outcome();
        return await this.driver.query(`SELECT * FROM outcome_obstacles oo \
                                                    INNER JOIN obstacles ob ON oo.obstacle_id = ob.id \
                                                    WHERE oo.outcome_id = ${currentOutcome.id};`);
    }
    ;
    async outcomes() {
        // Find the current outcome... 
        const currentPurpose = await this.parent.current.purpose();
        return await this.driver.query(`SELECT * FROM purpose_outcomes po \
                                                    INNER JOIN outcomes o ON po.outcome_id = o.id \
                                                    WHERE po.purpose_id = ${currentPurpose.id};`);
    }
    ;
    schedules() { }
    ;
    templates() { }
    ;
}
