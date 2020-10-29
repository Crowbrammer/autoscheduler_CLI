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
    obstacle(any) { }
    ;
    outcome(any) { }
    ;
    purpose(any) { }
    ;
    schedule(any) { }
    ;
    template() { }
    ;
}
class Create extends CRUD {
    action() { }
    ;
    async obstacle(name) {
        return (await this.driver.query(`INSERT INTO obstacles (name, is_current) VALUES ('${name}', true)`)).insertId;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
    async outcome(name) {
        return (await this.driver.query(`INSERT INTO outcomes (name, is_current) VALUES ('${name}', true)`)).insertId;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
    async purpose(name) {
        return (await this.driver.query(`INSERT INTO purposes (name, is_current) VALUES ('${name}', true)`)).insertId;
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
    async schedule() {
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
        // Link the events to the actions
        return schedule;
        // Should render other stuff not true... Should return a Signal object... 
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
    action() { }
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
    actions() { }
    ;
    async decisions() {
        // Find the current outcome... 
        const currentObstacle = await this.parent.current.obstacle();
        return await this.driver.query(`SELECT * FROM obstacle_decisions od \
                                                    INNER JOIN obstacles o ON od.obstacle_id = o.id \
                                                    INNER JOIN decisions d ON od.decision_id = d.id \
                                                    WHERE od.obstacle_id = ${currentObstacle.id};`);
    }
    ;
    async obstacles() {
        // Find the current outcome... 
        const currentOutcome = await this.parent.current.outcome();
        return await this.driver.query(`SELECT * FROM outcome_obstacles oo \
                                                    INNER JOIN outcomes o ON oo.outcome_id = o.id \
                                                    INNER JOIN obstacles ob ON oo.obstacle_id = ob.id \
                                                    WHERE oo.outcome_id = ${currentOutcome.id};`);
    }
    ;
    async outcomes() {
        // Find the current outcome... 
        const currentPurpose = await this.parent.current.purpose();
        return await this.driver.query(`SELECT * FROM purpose_outcomes po \
                                                    INNER JOIN purposes p ON po.purpose_id = p.id \
                                                    INNER JOIN outcomes o ON po.outcome_id = o.id \
                                                    WHERE po.purpose_id = ${currentPurpose.id};`);
    }
    ;
    schedules() { }
    ;
    templates() { }
    ;
}
