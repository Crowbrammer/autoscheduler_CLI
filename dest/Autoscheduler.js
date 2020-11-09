"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Schedule_1 = require("./models/Schedule");
const Action_1 = require("./models/Action");
const Model_1 = require("./models/Model");
class Autoscheduler {
    constructor(options) {
        if (!options.driver)
            throw new Error('Add a (PQuery) driver to this before continuing.');
        this.driver = options.driver;
        this.create = new Create({ ...options, parent: this });
        this.delete = new Delete(options);
        this.retrieve = new Retrieve(options);
        this.update = new Update({ ...options, parent: this });
        Model_1.AutoschedulerModel.driver = options.driver;
    }
}
exports.default = Autoscheduler;
class CRUD {
    constructor(options) {
        if (!options.driver)
            throw new Error('Add a (PQuery or SQLite) driver to the Retrieve class before continuing.');
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
    constructor(options) {
        super(options);
        this.parent = options.parent;
    }
    async action(name, duration, orderNum) {
        if (!name)
            throw new Error('Add a name to the action.');
        if (/\D+/.test(duration))
            throw new Error('Add a number-only duration');
        const action = new Action_1.default({ name, duration, driver: this.driver });
        await action.create();
        const currentTemplate = await this.current.template();
        const numStas = (await this.driver.query(`SELECT schedule_template_id FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplate.id}`)).length;
        if (currentTemplate && orderNum) {
            // Need to set the order, which requires knowing how many sta's exist
            if (orderNum > numStas)
                throw new Error('Lol, you\'re out of bounds. Lower your desired order num.');
            await this.parent.update.template({ signal: 'reorder', actionAt: numStas, moveTo: orderNum });
        }
        return action;
    }
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
        // Create the events
        // Get the actions related to the schedule
        const templateActions = await this.driver.query(`SELECT * FROM schedule_template_actions sta \
                                                        INNER JOIN actions a ON sta.action_id = a.id \
                                                        WHERE sta.schedule_template_id = ${currentScheduleTemplate.id}
                                                        ORDER BY sta.order_num`);
        // const schedule = new Schedule(templateActions, currentScheduleTemplate.id, currentScheduleTemplate.name);
        const schedule = new Schedule_1.default({ actions: templateActions, templateId: currentScheduleTemplate.id, name: currentScheduleTemplate.name, driver: this.driver });
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
        const insertValue = await this.driver.query(`INSERT INTO schedule_templates (name, is_current) VALUES ('${name}', true)`);
        if (this.driver.constructor.name === 'Database') {
            return insertValue.lastID;
        }
        else {
            return insertValue.insertId;
        }
        // Should render other stuff not true... Should return a Signal object... 
    }
    ;
}
class Update extends CRUD {
    constructor(options) {
        super(options);
        this.parent = options.parent;
    }
    action() { }
    ;
    async schedule(actionNum) {
        const oldActions = await this.related.actions();
        const newTemplateId = await this.parent.create.template();
        const actionSubset = oldActions.slice(actionNum - 1); // - 1 to keep the selected action
        for (let i = 0; i < actionSubset.length; i++) {
            const action = actionSubset[i];
            await this.driver.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id, order_num) VALUES (${newTemplateId}, ${action.id}, ${i + 1})`);
        }
        return await this.parent.create.schedule();
    }
    ;
    async template(options) {
        if (!options.signal)
            throw new Error('Cannot update without the signal option (i.e. signal: \'reorder\')');
        switch (options.signal) {
            case 'reorder':
                if (/\D+/.test(options.actionAt))
                    throw new Error('Set the actionAt property. (a rt; see actions; the numbers to the left is what you\'ll select)');
                if (/\D+/.test(options.moveTo))
                    throw new Error('Set the moveTo property. (a rt; see actions; the numbers to the left is where you can target to move to. Actions will be bumped down.)');
                // Get an ordered list of actions related to the template
                const actions = await this.parent.retrieve.related.actions();
                if (options.moveTo > actions.length || options.moveTo < 0)
                    throw new Error('Attempting to move the action out of bounds.');
                // Put set the order_num of the action to its position
                const currentTemplate = await this.parent.retrieve.current.template();
                // Pluck the action from actionAt;
                const plucked = actions.splice(Number(options.actionAt) - 1, 1);
                // Put it at the point;
                actions.splice(Number(options.moveTo) - 1, 0, plucked[0]);
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    await this.driver.query(`UPDATE schedule_template_actions SET order_num = ${i + 1} WHERE schedule_template_id = ${currentTemplate.id} AND action_id = ${action.id}`);
                }
                break;
            default:
                break;
        }
    }
}
exports.Update = Update;
class Delete extends CRUD {
    async action(id) {
        await this.driver.query(`DELETE FROM schedule_template_actions WHERE action_id = ${id}`);
        await this.driver.query(`DELETE FROM actions WHERE id = ${id}`);
        return id;
    }
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
    async schedule() {
        const currentSchedules = await this.driver.query(`SELECT * FROM schedules WHERE is_current = true`);
        if (currentSchedules.length === 0)
            return null;
        return currentSchedules[0];
    }
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
        const currentTemplate = await this.parent.current.template();
        return await this.driver.query(`SELECT * FROM schedule_template_actions sta \
                                                    INNER JOIN actions a ON sta.action_id = a.id \
                                                    WHERE sta.schedule_template_id = ${currentTemplate.id} \
                                                    ORDER BY order_num;`);
    }
    ;
    async decisions() {
        const currentObstacle = await this.parent.current.obstacle();
        return await this.driver.query(`SELECT * FROM obstacle_decisions od \
                                                    INNER JOIN decisions d ON od.decision_id = d.id \
                                                    WHERE od.obstacle_id = ${currentObstacle.id};`);
    }
    ;
    async events() {
        const currentSchedule = await this.parent.current.schedule();
        if (currentSchedule)
            return await this.driver.query(`SELECT * FROM schedule_events se \
                                                    INNER JOIN events e ON se.event_id = e.id \
                                                    WHERE se.schedule_id = ${currentSchedule.id}
                                                    ORDER BY start;`);
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
