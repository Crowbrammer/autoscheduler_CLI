require('dotenv').config({path: __dirname + '/../../.env'});
const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');
const Autoscheduler = require('../Autoscheduler').default;

describe('Autoscheduler', async function() {
    let sqliteInstance;
    let autoscheduler;
    before(async function () {
        sqliteInstance = await open({
            filename: __dirname + '/../db/sqlite/database.db',
            driver: sqlite3.Database
        });
        sqliteInstance.query = function (query) {
            if (/INSERT/.test(query)) {
                return this.run(query);
            } else {
                return this.all(query);
            }
        }
        sqliteInstance.type = 'sqlite';
        const {AutoschedulerModel} = require(__dirname + '/../models/Model');
                AutoschedulerModel.driver = sqliteInstance;
        autoscheduler = new Autoscheduler({driver: sqliteInstance});
        
    });

    after(async function () {
        sqliteInstance.close();
    });

    it('Is set up', async function () {
        it('Has the right tables', async function() {
            const tables = await db.all('SELECT name FROM sqlite_master;');
            const tableNames = tables.map(table => table.name);
            expect(tableNames).to.include.members(['actions', 'schedule_templates', 'schedule_template_actions', 'schedules', 'events', 'schedule_events']);
        });
    })

    describe('Schedule-creation', async function() {
        let scheduleTemplateId;
        let actions;
        let lastElevenActions;
        let scheduledEvents;
        let schedule;
        before(async function() {

            //  Schedule template
            await sqliteInstance.query('UPDATE schedule_templates SET is_current = false');
            scheduleTemplateId = (await sqliteInstance.query(`INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true)`)).lastID;

            //  Actions
            actions = [];
            for (let i = 0; i < 11; i++) {
                await sqliteInstance.query(`INSERT INTO actions (name, duration) VALUES ('Action #${i}', ${i})`);
                actions.push([`Action #${i}`, i]);
            }
            lastElevenActions = await sqliteInstance.query(`SELECT * FROM actions ORDER BY id DESC LIMIT 11`);
            expect(lastElevenActions.length).to.equal(11);

            //  Link actions to the schedule template
            for (let i = 0; i < lastElevenActions.length; i++) {
                const action = lastElevenActions[i];
                await sqliteInstance.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${scheduleTemplateId}, ${action.id});`);
                
            }
            expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(11);
            schedule = await autoscheduler.create.schedule();
        });
        
        it('Creates a schedule', async function () {
            scheduledEvents = await sqliteInstance.query(`SELECT * FROM schedule_events;`);
            scheduledEvents = await sqliteInstance.query(`SELECT * FROM schedule_events se \
                                                  INNER JOIN events e ON se.event_id = e.id
                                                  WHERE schedule_id = ${schedule.id}
                                                  ORDER BY e.id DESC`);
            expect(scheduledEvents.length).to.equal(11);
            // expect((await sqliteInstance.select('id', 'schedules','id', schedule.id)).length).to.equal(1);
            expect((await sqliteInstance.query(`SELECT id FROM schedules WHERE id = ${schedule.id}`)).length).to.equal(1);
            expect(scheduledEvents[2].summary).to.equal(lastElevenActions[2].name);
            expect(scheduledEvents[2].base_action_id).to.equal(lastElevenActions[2].id);
        })

        it('Links schedules to both the template and the decision', async function () {
            expect(schedule.template.id).to.equal(scheduleTemplateId);
        })

        after(async function() {
            // Tear down

            // Schedule-event links
            await sqliteInstance.query('DELETE FROM schedule_events WHERE schedule_id = ' + schedule.id);
            // Events
            scheduledEvents.forEach(async event => {
                await sqliteInstance.query(`DELETE FROM events WHERE id = ${event.id}`);
            });
            // Schedule
            await sqliteInstance.query(`DELETE FROM schedules WHERE id = ${schedule.id}`);
            //  actions links for the schedule template
            await sqliteInstance.query(`DELETE FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId}`);
            expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(0);
            //  actions
            for (let i = 0; i < lastElevenActions.length; i++) {
                const action = lastElevenActions[i];
                await sqliteInstance.query(`DELETE FROM actions WHERE id = ${action.id}`);
                // expect((await sqliteInstance.select('*', 'actions', 'id', action.id)).length).to.equal(0);
                expect((await sqliteInstance.query(`SELECT * FROM actions WHERE id = ${action.id}`)).length).to.equal(0);
            }
            //  schedule template
            await sqliteInstance.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
        });
        
    });
    

    xit('Creates an outcome', async function () {
        const outcomeId = await autoscheduler.create.outcome('Lol');
        expect((await sqliteInstance.select('id', 'outcomes','id', outcomeId)).length).to.equal(1);
        await sqliteInstance.query('DELETE FROM outcomes WHERE id = ' + outcomeId);
    })

    xit('Deletes an outcome', async function () {
        const outcomeId = (await sqliteInstance.query('INSERT INTO outcomes (name, is_current) VALUES (\'Lol\', true);')).lastID;
        expect((await sqliteInstance.select('id', 'outcomes','id', outcomeId)).length).to.equal(1);
        const deletedOutcomeId = await autoscheduler.delete.outcome(outcomeId);
        expect((await sqliteInstance.select('id', 'outcomes','id', outcomeId)).length).to.equal(0);
        expect(outcomeId).to.equal(deletedOutcomeId);
    })

    xit('Creates a purpose', async function () {
        const purposeId = await autoscheduler.create.purpose('Lol');
        expect((await sqliteInstance.select('id', 'purposes','id', purposeId)).length).to.equal(1);
        await sqliteInstance.query('DELETE FROM purposes WHERE id = ' + purposeId);
    })

    xit('Deletes a purpose', async function () {
        const purposeId = (await sqliteInstance.query('INSERT INTO purposes (name, is_current) VALUES (\'Lol\', true);')).lastID;
        expect((await sqliteInstance.select('id', 'purposes','id', purposeId)).length).to.equal(1);
        const deletedPurposeId = await autoscheduler.delete.purpose(purposeId);
        expect((await sqliteInstance.select('id', 'purposes','id', purposeId)).length).to.equal(0);
        expect(purposeId).to.equal(deletedPurposeId);
    })

    xit('Creates a obstacle', async function () {
        const obstacleId = await autoscheduler.create.obstacle('Lol');
        expect(obstacleId).to.not.be.undefined;
        expect((await sqliteInstance.select('id', 'obstacles','id', obstacleId)).length).to.equal(1);
        await sqliteInstance.query('DELETE FROM obstacles WHERE id = ' + obstacleId);
    })
    
    xit('Deletes a obstacle', async function () {
        const obstacleId = (await sqliteInstance.query('INSERT INTO obstacles (name, is_current) VALUES (\'Lol\', true);')).lastID;
        expect(obstacleId).to.not.be.undefined;
        expect((await sqliteInstance.select('id', 'obstacles','id', obstacleId)).length).to.equal(1);
        const deletedObstacleId = await autoscheduler.delete.obstacle(obstacleId);
        expect((await sqliteInstance.select('id', 'obstacles','id', obstacleId)).length).to.equal(0);
        expect(obstacleId).to.equal(deletedObstacleId);
    })

    it('Creates a schedule template', async function () {
        const startingLength = (await sqliteInstance.query('SELECT * FROM schedule_templates')).length;
        const templateId = await autoscheduler.create.template('Lol');
        expect(templateId).to.not.be.undefined;
        expect((await sqliteInstance.query('SELECT * FROM schedule_templates')).length).to.equal(startingLength + 1);
        await sqliteInstance.query('DELETE FROM schedule_templates WHERE id = ' + templateId);
    })
    
    it('Deletes a schedule template', async function () {
        const templateId = (await sqliteInstance.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true);')).lastID;
        expect(templateId).to.not.be.undefined;
        expect((await sqliteInstance.query(`SELECT * FROM schedule_templates WHERE id = ${templateId}`)).length).to.equal(1);
        const deletedTemplateId = await autoscheduler.delete.template(templateId);
        expect((await sqliteInstance.query(`SELECT * FROM schedule_templates WHERE id = ${templateId}`)).length).to.equal(0);
        expect(templateId).to.equal(deletedTemplateId);
    })

    it('Creates an action', async function () {
        // Create a current template - Using PQuery b/c I don't want this feature indy of the 'current' method
        await sqliteInstance.query('UPDATE schedule_templates SET is_current = false');
        const currentTemplateId = (await sqliteInstance.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true)')).lastID;
        // Test
        const action = await autoscheduler.create.action('Lol', 15);
        expect(action.id).to.not.be.undefined;
        expect((await sqliteInstance.query(`SELECT id FROM actions WHERE id = ${action.id}`)).length).to.equal(1);
        // It should have an entry with the current template
        expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${action.id};`)).length).to.equal(1);
        // Clean up
        await sqliteInstance.query('DELETE FROM schedule_template_actions WHERE schedule_template_id = ' + currentTemplateId);
        await sqliteInstance.query('DELETE FROM schedule_templates WHERE id = ' + currentTemplateId);
        await sqliteInstance.query('DELETE FROM actions WHERE id = ' + action.id);
    })

    it('Deletes an action', async function () {
        // Set up
        // Actions will be linked to schedule templates. The action deletion should delete the link. 
        // Create a schedule template.
        await sqliteInstance.query(`UPDATE schedule_templates SET is_current = false`);
        const templateId = (await sqliteInstance.query(`INSERT INTO schedule_templates (name, is_current) VALUES ('Lol', 15);`)).lastID; // herdy herrrrr
        // Create an action
        const actionId = (await sqliteInstance.query('INSERT INTO actions (name) VALUES (\'Lol\');')).lastID;
        // Link 'em.
        await sqliteInstance.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id, order_num) VALUES (${templateId}, ${actionId}, 1)`);
        // Test
        expect((await sqliteInstance.query(`SELECT id FROM actions WHERE id = ${actionId}`)).length).to.equal(1);
        expect((await sqliteInstance.query(`SELECT action_id FROM schedule_template_actions WHERE action_id = ${actionId};`)).length).to.equal(1);
        const deletedActionId = await autoscheduler.delete.action(actionId);
        expect((await sqliteInstance.query(`SELECT id FROM actions WHERE id = ${actionId}`)).length).to.equal(0);
        expect((await sqliteInstance.query(`SELECT action_id FROM schedule_template_actions WHERE action_id = ${actionId};`)).length).to.equal(0);
        expect(actionId).to.equal(deletedActionId);
        // Clean up
        await sqliteInstance.query(`DELETE FROM schedule_template_actions WHERE action_id = ${actionId}`);
        await sqliteInstance.query(`DELETE FROM schedule_templates WHERE id = ${templateId}`);
        await sqliteInstance.query(`DELETE FROM actions WHERE id = ${actionId}`);
    })

    xit('Action creation/retrieval should show the position it\'s at');
   
    xit('Should throw an error if trying to create an action without a current template');

    describe('Reordering', async function() {
        let currentTemplate;
        let actions;
        let retrievedActions;
        beforeEach(async function() {
            currentTemplate = await autoscheduler.create.template('Be amazing');
            actions  = [];
            actions.push(await autoscheduler.create.action('AS', 15));
            actions.push(await autoscheduler.create.action('D3', 20));
            actions.push(await autoscheduler.create.action('AS', 10));
            retrievedActions = await autoscheduler.retrieve.related.actions()
        });
        it('Has a new current template', async function() {
            expect((await autoscheduler.retrieve.current.template()).id).to.equal(currentTemplate);
        });

        it('The current has three actions', async function () {
            retrievedActionIds = retrievedActions.map(action => action.id);
            expect(retrievedActionIds).to.include.members(actions.map(action => action.id));
        });

        it('Has all action orders within bounds', async function () {
            expect(retrievedActions.every(action => action.order_num <= retrievedActions.length)).to.be.true;
        })
        
        it('Updating it, all actions still within bounds', async function () {
            await autoscheduler.update.template({signal: 'reorder', actionAt: 3, moveTo: 2});
            retrievedActions = await autoscheduler.retrieve.related.actions() // Refresh it.
            expect(retrievedActions.every(action => action.order_num <= retrievedActions.length)).to.be.true;
        })

        // it('Throws an error if ')
        
        it('Create an action at a certain point; all actions still within bounds', async function () {
            const action = await autoscheduler.create.action('Cat', 15, 2)
            const actions = await autoscheduler.retrieve.related.actions();
            expect(actions[1].id).to.equal(action.id);
            expect(actions.every(action => action.order_num <= actions.length)).to.be.true;
        })

    });
    it('Lets me reorder actions for the current template', async function () {
        // Create a template
        await autoscheduler.create.template('Hi');
        // Add tasks
        await autoscheduler.create.action('lol', 1);
        await autoscheduler.create.action('ha', 1);
        await autoscheduler.create.action('hee', 1);
        await autoscheduler.create.action('ho', 1);
        // Add a task into a new spot
        await autoscheduler.create.action('ho', 1, 3);
        // Create a schedule 
        const schedule = await autoscheduler.create.schedule();
        // Should be in order
        expect(schedule.tasks[2].order_num).to.equal(3);
    });

    xit('Should error out if no current actions');

    xit('Should error out if no current schedule template');

    it('Shows the currently selected outcome', async function () {
        // Make sure there are no currently selected purposes
        await sqliteInstance.query('UPDATE outcomes SET is_current = false;');
        expect((await sqliteInstance.query('SELECT * FROM outcomes WHERE is_current = true;')).length).to.equal(0);

        // expect((await pQuery.select('*', 'outcomes','is_current', 'true')).length).to.equal(0); Bug in select
        // Set something I make as the current
        const outcomeId = (await sqliteInstance.query('INSERT INTO outcomes (name, is_current) VALUES (\'Lol\', true);')).lastID;
        // const currentOutcomes = await sqliteInstance.select('*', 'outcomes','id', outcomeId);
        const currentOutcomes = await sqliteInstance.query(`SELECT * FROM outcomes WHERE id = ${outcomeId}`);
        expect(currentOutcomes.length).to.equal(1);
        expect(currentOutcomes[0].id).to.equal(outcomeId);
        expect(currentOutcomes[0].name).to.equal('Lol');
        expect(currentOutcomes[0].is_current).to.equal(1); // be true
        
        const currentOutcome = await autoscheduler.retrieve.current.outcome();
        expect(currentOutcome.id).to.equal(outcomeId);
        expect(currentOutcome.name).to.equal(currentOutcomes[0].name);
        expect(currentOutcome.is_current).to.equal(1); // be true

        // Tear down
        await sqliteInstance.query(`DELETE FROM outcomes WHERE id = ${outcomeId}`);
    });

    it('Shows the currently selected purpose', async function () {
        // Set up
        // Test
        // Tear down

        // Make sure there are no currently selected purposes
        await sqliteInstance.query('UPDATE purposes SET is_current = false;');
        expect((await sqliteInstance.query('SELECT * FROM purposes WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const purposeId = (await sqliteInstance.query('INSERT INTO purposes (name, is_current) VALUES (\'Lol\', true);')).lastID;
        // const currentPurposes = await sqliteInstance.select('*', 'purposes','id', purposeId);
        const currentPurposes = await sqliteInstance.query(`SELECT * FROM purposes WHERE id = ${purposeId}`);
        expect(currentPurposes.length).to.equal(1);
        expect(currentPurposes[0].id).to.equal(purposeId);
        expect(currentPurposes[0].name).to.equal('Lol');
        expect(currentPurposes[0].is_current).to.equal(1);
        
        const currentPurpose = await autoscheduler.retrieve.current.purpose();
        expect(currentPurpose.id).to.equal(purposeId);
        expect(currentPurpose.name).to.equal(currentPurposes[0].name);
        expect(currentPurpose.is_current).to.equal(1);

        // Tear down
        await sqliteInstance.query(`DELETE FROM purposes WHERE id = ${purposeId}`);
    });

    it('Shows the currently selected obstacle', async function () {
        // Set up
        // Test
        // Tear down

        // Make sure there are no currently selected obstacles
        await sqliteInstance.query('UPDATE obstacles SET is_current = false;');
        expect((await sqliteInstance.query('SELECT * FROM obstacles WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const obstacleId = (await sqliteInstance.query('INSERT INTO obstacles (name, is_current) VALUES (\'Lol\', true);')).lastID;
        // const currentObstacles = await sqliteInstance.select('*', 'obstacles','id', obstacleId);
        const currentObstacles = await sqliteInstance.query(`SELECT * FROM obstacles WHERE id = ${obstacleId}`);
        expect(currentObstacles.length).to.equal(1);
        expect(currentObstacles[0].id).to.equal(obstacleId);
        expect(currentObstacles[0].name).to.equal('Lol');
        expect(currentObstacles[0].is_current).to.equal(1);
        
        const currentObstacle = await autoscheduler.retrieve.current.obstacle();
        expect(currentObstacle.id).to.equal(obstacleId);
        expect(currentObstacle.name).to.equal(currentObstacles[0].name);
        expect(currentObstacle.is_current).to.equal(1);

        // Tear down
        await sqliteInstance.query(`DELETE FROM obstacles WHERE id = ${obstacleId}`);
    });

    it('Shows the currently selected schedule template', async function () {
        // Set up
        // Test
        // Tear down

        // Make sure there are no currently selected obstacles
        await sqliteInstance.query('UPDATE schedule_templates SET is_current = false;');
        expect((await sqliteInstance.query('SELECT * FROM schedule_templates WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const scheduleTemplateId = (await sqliteInstance.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true);')).lastID;
        // const currentScheduleTemplates = await sqliteInstance.select('*', 'schedule_templates','id', scheduleTemplateId);
        const currentScheduleTemplates = await sqliteInstance.query(`SELECT * FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
        expect(currentScheduleTemplates.length).to.equal(1);
        expect(currentScheduleTemplates[0].id).to.equal(scheduleTemplateId);
        expect(currentScheduleTemplates[0].name).to.equal('Lol');
        expect(currentScheduleTemplates[0].is_current).to.equal(1);
        
        const currentScheduleTemplate = await autoscheduler.retrieve.current.template();
        expect(currentScheduleTemplate.id).to.equal(scheduleTemplateId);
        expect(currentScheduleTemplate.name).to.equal(currentScheduleTemplates[0].name);
        expect(currentScheduleTemplate.is_current).to.equal(1);

        // Tear down
        await sqliteInstance.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
    });

    it('Shows the currently selected decision', async function () {

        // Make sure there are no currently selected obstacles
        await sqliteInstance.query('UPDATE decisions SET is_current = false;');
        expect((await sqliteInstance.query('SELECT * FROM decisions WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const decisionId = (await sqliteInstance.query('INSERT INTO decisions (name, is_current) VALUES (\'Lol\', true);')).lastID;
        // const currentDecisions = await sqliteInstance.select('*', 'decisions','id', decisionId);
        const currentDecisions = await sqliteInstance.query(`SELECT * FROM decisions WHERE id = ${decisionId}`);
        expect(currentDecisions.length).to.equal(1);
        expect(currentDecisions[0].id).to.equal(decisionId);
        expect(currentDecisions[0].name).to.equal('Lol');
        expect(currentDecisions[0].is_current).to.equal(1);
        
        const currentDecision = await autoscheduler.retrieve.current.decision();
        expect(currentDecision.id).to.equal(decisionId);
        expect(currentDecision.name).to.equal(currentDecisions[0].name);
        expect(currentDecision.is_current).to.equal(1);

        // Tear down
        await sqliteInstance.query(`DELETE FROM decisions WHERE id = ${decisionId}`);
    });

    it('Shows the currently selected schedule', async function () {

        // Make sure there are no currently selected obstacles
        await sqliteInstance.query('UPDATE schedules SET is_current = false;');
        expect((await sqliteInstance.query('SELECT * FROM schedules WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const scheduleId = (await sqliteInstance.query('INSERT INTO schedules (name, is_current) VALUES (\'Lol\', true);')).lastID;
        const currentSchedules = await sqliteInstance.query(`SELECT * FROM schedules WHERE id = ${scheduleId}`);
        expect(currentSchedules.length).to.equal(1);
        expect(currentSchedules[0].id).to.equal(scheduleId);
        expect(currentSchedules[0].name).to.equal('Lol');
        expect(currentSchedules[0].is_current).to.equal(1);
        
        const currentSchedule = await autoscheduler.retrieve.current.schedule();
        expect(currentSchedule.id).to.equal(scheduleId);
        expect(currentSchedule.name).to.equal(currentSchedules[0].name);
        expect(currentSchedule.is_current).to.equal(1);

        // Tear down
        await sqliteInstance.query(`DELETE FROM schedules WHERE id = ${scheduleId}`);
    });

    xit('Shows the past ten outcomes under the current purpose', async function() {
        // Set up
        const outcomeNames = [];
        for (let i = 0; i < 11; i++) {
            // await sqliteInstance.insert('outcomes', ['name'], outcomeNames);
            await sqliteInstance.query(`INSERT INTO outcomes (name) VALUES ('Outcome # ${i}');`);
            outcomeNames.push(`Outcome #${i}`);
        }
        // Have eleven outcomes
        const lastElevenOutcomes = await sqliteInstance.query('SELECT id FROM outcomes ORDER BY id DESC LIMIT 11');
        expect(lastElevenOutcomes.length).to.equal(11);

        // Connect 'em to a purpose
        await sqliteInstance.query('UPDATE purposes SET is_current = false');
        const purposeId = (await sqliteInstance.query('INSERT INTO purposes (name, is_current) VALUES (\'Haha\', true);')).lastID;
        lastElevenOutcomes.forEach(async outcome => {
            await sqliteInstance.query(`INSERT INTO purpose_outcomes (purpose_id, outcome_id) VALUES (${purposeId}, ${outcome.id});`);
        });
        const purposeOutcomes = await sqliteInstance.query(`SELECT * FROM purpose_outcomes WHERE purpose_id = ${purposeId};`);
        expect(purposeOutcomes.length).to.equal(11);
        
        // Test

        const relatedOutcomes = await autoscheduler.retrieve.related.outcomes();
        expect(relatedOutcomes.length).to.equal(11);
        expect(relatedOutcomes[3].id).to.equal(purposeOutcomes[3].outcome_id);
        
        // Tear down
        await sqliteInstance.query(`DELETE FROM purpose_outcomes WHERE purpose_id = ${purposeId}`);
        await sqliteInstance.query(`DELETE FROM purposes WHERE id = ${purposeId}`);
        expect((await sqliteInstance.select('*', 'purpose_outcomes', 'purpose_id', purposeId)).length).to.equal(0);
        for (let i = 0; i < lastElevenOutcomes.length; i++) {
            const outcome = lastElevenOutcomes[i];
            await sqliteInstance.query(`DELETE FROM outcomes WHERE id = ${outcome.id}`);
            expect((await sqliteInstance.select('*', 'outcomes', 'id', outcome.id)).length).to.equal(0);
        }
    });

    xit('Shows the past ten decisions under the current outcome', async function() {
        // Set up
        const obstacleNames = [];
        for (let i = 0; i < 11; i++) {
            obstacleNames.push(`Obstacle #${i}`);
        }
        // Have eleven obstacles
        await sqliteInstance.insert('obstacles', ['name'], obstacleNames);
        const lastElevenObstacles = await sqliteInstance.query('SELECT id FROM obstacles ORDER BY id DESC LIMIT 11');
        expect(lastElevenObstacles.length).to.equal(11);

        // Connect 'em to a outcome
        await sqliteInstance.query('UPDATE outcomes SET is_current = false');
        const outcomeId = (await sqliteInstance.query('INSERT INTO outcomes (name, is_current) VALUES (\'Haha\', true);')).lastID;
        lastElevenObstacles.forEach(async obstacle => {
            await sqliteInstance.query(`INSERT INTO outcome_obstacles (outcome_id, obstacle_id) VALUES (${outcomeId}, ${obstacle.id});`);
        });
        const outcomeObstacles = await sqliteInstance.query(`SELECT * FROM outcome_obstacles WHERE outcome_id = ${outcomeId};`);
        expect(outcomeObstacles.length).to.equal(11);
        
        // Test

        const relatedObstacles = await autoscheduler.retrieve.related.obstacles();
        expect(relatedObstacles.length).to.equal(11);
        expect(relatedObstacles[3].id).to.equal(outcomeObstacles[3].obstacle_id);
        
        // Tear down
        await sqliteInstance.query(`DELETE FROM outcome_obstacles WHERE outcome_id = ${outcomeId}`);
        await sqliteInstance.query(`DELETE FROM outcomes WHERE id = ${outcomeId}`);
        expect((await sqliteInstance.select('*', 'outcome_obstacles', 'outcome_id', outcomeId)).length).to.equal(0);
        for (let i = 0; i < lastElevenObstacles.length; i++) {
            const obstacle = lastElevenObstacles[i];
            await sqliteInstance.query(`DELETE FROM obstacles WHERE id = ${obstacle.id}`);
            expect((await sqliteInstance.select('*', 'obstacles', 'id', obstacle.id)).length).to.equal(0);
        }
    });

    xit('Shows the past ten decisions under the current obstacle', async function() {
        // Set up
        const decisionNames = [];
        for (let i = 0; i < 11; i++) {
            decisionNames.push(`Decision #${i}`);
        }
        // Have eleven decisions
        await sqliteInstance.insert('decisions', ['name'], decisionNames);
        const lastElevenDecisions = await sqliteInstance.query('SELECT id FROM decisions ORDER BY id DESC LIMIT 11');
        expect(lastElevenDecisions.length).to.equal(11);

        // Connect 'em to a obstacle
        await sqliteInstance.query('UPDATE obstacles SET is_current = false');
        const obstacleId = (await sqliteInstance.query('INSERT INTO obstacles (name, is_current) VALUES (\'Haha\', true);')).lastID;
        lastElevenDecisions.forEach(async decision => {
            await sqliteInstance.query(`INSERT INTO obstacle_decisions (obstacle_id, decision_id) VALUES (${obstacleId}, ${decision.id});`);
        });
        const obstacleDecisions = await sqliteInstance.query(`SELECT * FROM obstacle_decisions WHERE obstacle_id = ${obstacleId};`);
        expect(obstacleDecisions.length).to.equal(11);
        
        // Test

        const relatedDecisions = await autoscheduler.retrieve.related.decisions();
        expect(relatedDecisions.length).to.equal(11);
        expect(relatedDecisions[3].id).to.equal(obstacleDecisions[3].decision_id);
        
        // Tear down
        await sqliteInstance.query(`DELETE FROM obstacle_decisions WHERE obstacle_id = ${obstacleId}`);
        await sqliteInstance.query(`DELETE FROM obstacles WHERE id = ${obstacleId}`);
        expect((await sqliteInstance.select('*', 'obstacle_decisions', 'obstacle_id', obstacleId)).length).to.equal(0);
        for (let i = 0; i < lastElevenDecisions.length; i++) {
            const decision = lastElevenDecisions[i];
            await sqliteInstance.query(`DELETE FROM decisions WHERE id = ${decision.id}`);
            expect((await sqliteInstance.select('*', 'decisions', 'id', decision.id)).length).to.equal(0);
        }
    });

    it('Shows the actions related to the current schedule template', async function() {
        // Set up
        for (let i = 0; i < 11; i++) {
            await sqliteInstance.query(`INSERT INTO actions (name, duration) VALUES ('Action #${i}', ${i})`)
        }
        // Have eleven actions
        const lastElevenActions = await sqliteInstance.query('SELECT id FROM actions ORDER BY id DESC LIMIT 11');
        expect(lastElevenActions.length).to.equal(11);

        // Connect 'em to a schedule_template
        await sqliteInstance.query('UPDATE schedule_templates SET is_current = false');
        const scheduleTemplateId = (await sqliteInstance.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Haha\', true);')).lastID;
        for (let i = 0; i < lastElevenActions.length; i++) {
            const action = lastElevenActions[i];
            await sqliteInstance.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${scheduleTemplateId}, ${action.id});`);
            
        }
        const scheduleTemplateActions = await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`);
        expect(scheduleTemplateActions.length).to.equal(11);
        
        // Test

        const relatedActions = await autoscheduler.retrieve.related.actions();
        expect(relatedActions.length).to.equal(11);
        expect(relatedActions[3].id).to.equal(scheduleTemplateActions[3].action_id);
        
        // Tear down
        await sqliteInstance.query(`DELETE FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId}`);
        await sqliteInstance.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
        expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId}`)).length).to.equal(0);
        for (let i = 0; i < lastElevenActions.length; i++) {
            const action = lastElevenActions[i];
            await sqliteInstance.query(`DELETE FROM actions WHERE id = ${action.id}`);
            expect((await sqliteInstance.query(`SELECT * FROM actions WHERE id = ${action.id}`)).length).to.equal(0);
        }
    });

    it('Shows the events related to the current schedule', async function() {
        // Set up
        const events = [];
        for (let i = 0; i < 11; i++) {
            // await sqliteInstance.insert('events', ['summary', 'start', 'end'], events);
            await sqliteInstance.query(`INSERT INTO events (summary, start, end) VALUES ('Action #${i}', DATETIME(\'now\'), DATETIME(\'now\'))`);
            events.push([`Action #${i}`, 'DATETIME(\'now\')', 'DATETIME(\'now\')']);
        }
        // Have eleven actions
        const lastElevenEvents = await sqliteInstance.query('SELECT id FROM events ORDER BY id DESC LIMIT 11');
        expect(lastElevenEvents.length).to.equal(11);

        // Connect 'em to a schedule_template
        await sqliteInstance.query('UPDATE schedules SET is_current = false');
        const scheduleId = (await sqliteInstance.query('INSERT INTO schedules (name, is_current) VALUES (\'Haha\', true);')).lastID;
        for (let i = 0; i < lastElevenEvents.length; i++) {
            const event = lastElevenEvents[i];
            await sqliteInstance.query(`INSERT INTO schedule_events (schedule_id, event_id) VALUES (${scheduleId}, ${event.id});`);
        }
        const scheduledEvents = await sqliteInstance.query(`SELECT * FROM schedule_events WHERE schedule_id = ${scheduleId};`);
        expect(scheduledEvents.length).to.equal(11);
        
        // Test

        const relatedEvents = await autoscheduler.retrieve.related.events();
        expect(relatedEvents.length).to.equal(11);
        expect(relatedEvents[3].id).to.equal(scheduledEvents[3].event_id);
        
        // Tear down
        await sqliteInstance.query(`DELETE FROM schedule_events WHERE schedule_id = ${scheduleId}`);
        await sqliteInstance.query(`DELETE FROM schedules WHERE id = ${scheduleId}`);
        expect((await sqliteInstance.query(`SELECT * FROM schedule_events WHERE schedule_id = ${scheduleId}`)).length).to.equal(0);
        for (let i = 0; i < lastElevenEvents.length; i++) {
            const event = lastElevenEvents[i];
            await sqliteInstance.query(`DELETE FROM events WHERE id = ${event.id}`);
            // expect((await sqliteInstance.select('*', 'events', 'id', event.id)).length).to.equal(0);
            expect((await sqliteInstance.query(`SELECT * FROM events WHERE id = ${event.id}`)).length).to.equal(0);
        }
    });

    it('Lets me reorder an action in a template', async function () {
        // Setup
        await sqliteInstance.query('UPDATE schedule_templates SET is_current = false');
        const currentTemplateId = (await sqliteInstance.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true)')).lastID;
        const actions = [];
        actions.push(await autoscheduler.create.action('Lol', 15));
        actions.push(await autoscheduler.create.action('Hi', 15));
        actions.push(await autoscheduler.create.action('Wow', 15));
        expect((await sqliteInstance.query(`SELECT id FROM actions WHERE id = ${actions[0].id}`)).length).to.equal(1); 
        expect((await sqliteInstance.query(`SELECT id FROM actions WHERE id = ${actions[1].id}`)).length).to.equal(1); 
        expect((await sqliteInstance.query(`SELECT id FROM actions WHERE id = ${actions[2].id}`)).length).to.equal(1); 
        expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${actions[0].id};`)).length).to.equal(1);
        expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${actions[1].id};`)).length).to.equal(1);
        expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${actions[2].id};`)).length).to.equal(1);
        // End setup. Probably a more elegant way to do this.
        
        // Test
        let action1 = (await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${actions[0].id};`))[0];
        let action2 = (await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${actions[1].id};`))[0];
        let action3 = (await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${actions[2].id};`))[0];
        expect(action1.order_num).to.equal(1);
        expect(action2.order_num).to.equal(2);
        expect(action3.order_num).to.equal(3);
        await autoscheduler.update.template({signal: 'reorder', actionAt: 3, moveTo: 1});
        action1 = (await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${action1.action_id};`))[0];
        action2 = (await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${action2.action_id};`))[0];
        action3 = (await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${action3.action_id};`))[0];
        expect(action3.order_num).to.equal(1);
        expect(action1.order_num).to.equal(2); // It moves it to the location and pushes the rest ahead.
        expect(action2.order_num).to.equal(3);
        // End test

        // Cleanup
        await sqliteInstance.query('DELETE FROM schedule_template_actions WHERE schedule_template_id = ' + currentTemplateId);
        await sqliteInstance.query('DELETE FROM schedule_templates WHERE id = ' + currentTemplateId);
        await sqliteInstance.query('DELETE FROM actions WHERE id = ' + actions[0].id);
        await sqliteInstance.query('DELETE FROM actions WHERE id = ' + actions[1].id);
        await sqliteInstance.query('DELETE FROM actions WHERE id = ' + actions[2].id);
        // End cleanup
        
    })

    xit('Lets me reorder a schedule', async function () {
        // 
        expect(false).to.equal(true, 'Make a test for this.')
    })
    
    xit('Lets me undo an update... in case I select the wrong action');
    xit('For reliability, events have actual order numbers associated with them')
    xit('Updates the schedule (template) with a new time');
    xit('Says if it was missed or not');
    xit('Lets me add a reason if it was missed');
    xit('Shows my past X schedules');
    
    describe('Rescheduling', async function() {
        let scheduleTemplateId;
        let actions;
        let lastElevenActions;
        let schedule;
        let updatedSchedule;
        let basedOnTemplateId;
        before(async function() {
            /// Setup

            //  Schedule template
            await sqliteInstance.query('UPDATE schedule_templates SET is_current = false');
            scheduleTemplateId = (await sqliteInstance.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true)')).lastID;
            console.log('B');
            //  Actions
            actions = [];
            for (let i = 0; i < 11; i++) {
                await sqliteInstance.query(`INSERT INTO actions (name, duration) VALUES ('Action #${i}', ${i})`);
                actions.push([`Action #${i}`, i]);
            }
            console.log('A');
            // await sqliteInstance.insert('actions', ['name', 'duration'], actions);
            lastElevenActions = await sqliteInstance.query('SELECT id FROM actions ORDER BY id DESC LIMIT 11');
            expect(lastElevenActions.length).to.equal(11);
            
            //  Link actions to the schedule template
            for (let i = 0; i < lastElevenActions.length; i++) {
                const action = lastElevenActions[i];
                await sqliteInstance.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id, order_num) VALUES (${scheduleTemplateId}, ${action.id}, ${i + 1});`);
                
            }
            expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(11);
            
            //  Schedule from the template 
            schedule = await autoscheduler.create.schedule();
        });

        it('Creates new schedule from the update', async function() {
            // It'll be a new schedule
            updatedSchedule = await autoscheduler.update.schedule(3);
            expect(updatedSchedule.id).to.equal(schedule.id + 1);
        });

        it('Will use the last nine actions', async function () {
            // The schedule should use all the same actions except 0, 1. So nine actions. 
            expect((await sqliteInstance.query(`SELECT * FROM schedule_events WHERE schedule_id = ${updatedSchedule.id}`)).length).to.equal(9);
        })

        it('Has a new and linked schedule template', async function () {
            // It should have a new schedule template. Link that.
            basedOnTemplateId = (await sqliteInstance.query(`SELECT based_on_template_id FROM schedules WHERE id = ${updatedSchedule.id}`))[0].based_on_template_id;
            expect(basedOnTemplateId).to.not.equal(schedule.template.id);
        })

        after(async function() {
            /// Teardown
            //  Remove: 
            //  schedule links for the schedule template
            //  schedule
            //  actions links for the schedule template
            await sqliteInstance.query(`DELETE FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId} OR schedule_template_id = ${updatedSchedule.template.id}`);
            expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(0);
            //  actions
            for (let i = 0; i < lastElevenActions.length; i++) {
                const action = lastElevenActions[i];
                await sqliteInstance.query(`DELETE FROM actions WHERE id = ${action.id}`);
                expect((await sqliteInstance.query(`SELECT * FROM actions WHERE id = ${action.id}`)).length).to.equal(0);
            }
            //  schedule template
            await sqliteInstance.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
        });
    })
});

