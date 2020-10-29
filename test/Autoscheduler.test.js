require('dotenv').config();
const expect = require('chai').expect;
const PQuery = require('prettyquery');
const dbCreds = {user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE};
const Autoscheduler = require('../Autoscheduler').default;

describe('Autoscheduler', async function() {
    let pQuery;
    let autoscheduler;
    before(async function () {
        pQuery = new PQuery(dbCreds);
        autoscheduler = new Autoscheduler({driver: pQuery});
    });

    after(async function () {
        pQuery.connection.end();
    });

    it('Is set up', async function () {
        expect(await pQuery.showCurrentDbTables()).to.include('outcomes');
    })

    describe('Schedule-creation', async function() {
        /**
     *  Purpose -> Outcome -> Obstacle(s) -> Decision(s) -> 
     *    Template -> Actions -> Schedule -> Events
     * 
     *  Link schedules template to the decision preceding it, the 'current' decision.
     *  Link schedules to both the template and the decision... 
     */
        let currentDecisionId;
        let scheduleTemplateId;
        let actions;
        let lastElevenActions;
        let scheduledEvents;
        before(async function() {
            //  Decision - bind to the most recent, current, decision
            await pQuery.query('UPDATE decisions SET is_current = false');
            currentDecisionId = (await pQuery.query('INSERT INTO decisions (name, is_current) VALUES (\'Hahaha\', true)')).insertId;

            //  Schedule template
            await pQuery.query('UPDATE schedule_templates SET is_current = false');
            scheduleTemplateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true)')).insertId;

            //  Actions
            actions = [];
            for (let i = 0; i < 11; i++) {
                actions.push([`Action #${i}`, i]);
            }
            await pQuery.insert('actions', ['name', 'duration'], actions);
            lastElevenActions = await pQuery.query('SELECT * FROM actions ORDER BY id DESC LIMIT 11');
            expect(lastElevenActions.length).to.equal(11);

            //  Link actions to the schedule template
            lastElevenActions.forEach(async action => {
                await pQuery.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${scheduleTemplateId}, ${action.id});`);
            });
            expect((await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(11);
            schedule = await autoscheduler.create.schedule();
        });
        
        it('Creates a schedule', async function () {
            scheduledEvents = await pQuery.query(`SELECT * FROM schedule_events se \
                                                  INNER JOIN events e ON se.event_id = e.id
                                                  WHERE schedule_id = ${schedule.id}
                                                  ORDER BY e.id DESC`);
            expect(scheduledEvents.length).to.equal(11);
            expect((await pQuery.select('id', 'schedules','id', schedule.id)).length).to.equal(1);
            expect(scheduledEvents[2].summary).to.equal(lastElevenActions[2].name);
            expect(scheduledEvents[2].base_action_id).to.equal(lastElevenActions[2].id);
        })

        it('Links schedules to both the template and the decision', async function () {
            expect(schedule.template.id).to.equal(scheduleTemplateId);
            expect(schedule.decision.id).to.equal(currentDecisionId);
        })

        after(async function() {
            // Tear down

            // Schedule-event links
            await pQuery.query('DELETE FROM schedule_events WHERE schedule_id = ' + schedule.id);
            // Events
            scheduledEvents.forEach(async event => {
                await pQuery.query(`DELETE FROM events WHERE id = ${event.id}`);
            });
            // Schedule
            await pQuery.query(`DELETE FROM schedules WHERE id = ${schedule.id}`);
            //  actions links for the schedule template
            await pQuery.query(`DELETE FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId}`);
            expect((await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(0);
            //  actions
            for (let i = 0; i < lastElevenActions.length; i++) {
                const action = lastElevenActions[i];
                await pQuery.query(`DELETE FROM actions WHERE id = ${action.id}`);
                expect((await pQuery.select('*', 'actions', 'id', action.id)).length).to.equal(0);
            }
            //  schedule template
            await pQuery.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
        });
        
    });
    

    it('Creates an outcome', async function () {
        const outcomeId = await autoscheduler.create.outcome('Lol');
        expect((await pQuery.select('id', 'outcomes','id', outcomeId)).length).to.equal(1);
        await pQuery.query('DELETE FROM outcomes WHERE id = ' + outcomeId);
    })

    it('Deletes an outcome', async function () {
        const outcomeId = (await pQuery.query('INSERT INTO outcomes (name, is_current) VALUES (\'Lol\', true);')).insertId;
        expect((await pQuery.select('id', 'outcomes','id', outcomeId)).length).to.equal(1);
        const deletedOutcomeId = await autoscheduler.delete.outcome(outcomeId);
        expect((await pQuery.select('id', 'outcomes','id', outcomeId)).length).to.equal(0);
        expect(outcomeId).to.equal(deletedOutcomeId);
    })

    it('Creates a purpose', async function () {
        const purposeId = await autoscheduler.create.purpose('Lol');
        expect((await pQuery.select('id', 'purposes','id', purposeId)).length).to.equal(1);
        await pQuery.query('DELETE FROM purposes WHERE id = ' + purposeId);
    })

    it('Deletes a purpose', async function () {
        const purposeId = (await pQuery.query('INSERT INTO purposes (name, is_current) VALUES (\'Lol\', true);')).insertId;
        expect((await pQuery.select('id', 'purposes','id', purposeId)).length).to.equal(1);
        const deletedPurposeId = await autoscheduler.delete.purpose(purposeId);
        expect((await pQuery.select('id', 'purposes','id', purposeId)).length).to.equal(0);
        expect(purposeId).to.equal(deletedPurposeId);
    })

    it('Creates a obstacle', async function () {
        const obstacleId = await autoscheduler.create.obstacle('Lol');
        expect(obstacleId).to.not.be.undefined;
        expect((await pQuery.select('id', 'obstacles','id', obstacleId)).length).to.equal(1);
        await pQuery.query('DELETE FROM obstacles WHERE id = ' + obstacleId);
    })
    
    it('Deletes a obstacle', async function () {
        const obstacleId = (await pQuery.query('INSERT INTO obstacles (name, is_current) VALUES (\'Lol\', true);')).insertId;
        expect(obstacleId).to.not.be.undefined;
        expect((await pQuery.select('id', 'obstacles','id', obstacleId)).length).to.equal(1);
        const deletedObstacleId = await autoscheduler.delete.obstacle(obstacleId);
        expect((await pQuery.select('id', 'obstacles','id', obstacleId)).length).to.equal(0);
        expect(obstacleId).to.equal(deletedObstacleId);
    })

    it('Creates a schedule template', async function () {
        const templateId = await autoscheduler.create.template('Lol');
        expect(templateId).to.not.be.undefined;
        expect((await pQuery.select('id', 'schedule_templates','id', templateId)).length).to.equal(1);
        await pQuery.query('DELETE FROM schedule_templates WHERE id = ' + templateId);
    })
    
    it('Deletes a schedule template', async function () {
        const templateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true);')).insertId;
        expect(templateId).to.not.be.undefined;
        expect((await pQuery.select('id', 'schedule_templates','id', templateId)).length).to.equal(1);
        const deletedTemplateId = await autoscheduler.delete.template(templateId);
        expect((await pQuery.select('id', 'schedule_templates','id', templateId)).length).to.equal(0);
        expect(templateId).to.equal(deletedTemplateId);
    })

    it('Creates an action', async function () {
        // Create a current template - Using PQuery b/c I don't want this feature indy of the 'current' method
        await pQuery.query('UPDATE schedule_templates SET is_current = false');
        const currentTemplateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true)')).insertId;
        // Test
        const actionId = await autoscheduler.create.action('Lol', 15);
        expect(actionId).to.not.be.undefined;
        expect((await pQuery.select('id', 'actions','id', actionId)).length).to.equal(1);
        // It should have an entry with the current template
        expect((await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplateId} AND action_id = ${actionId};`)).length).to.equal(1);
        // Clean up
        await pQuery.query('DELETE FROM schedule_template_actions WHERE schedule_template_id = ' + currentTemplateId);
        await pQuery.query('DELETE FROM schedule_templates WHERE id = ' + currentTemplateId);
        await pQuery.query('DELETE FROM actions WHERE id = ' + actionId);
    })

    
    it('Deletes an action', async function () {
        // Set up
        // Actions will be linked to schedule templates. The action deletion should delete the link. 
        // Create a schedule template.
        await pQuery.query(`UPDATE schedule_templates SET is_current = false`);
        const templateId = (await pQuery.query(`INSERT INTO schedule_templates (name, is_current) VALUES ('Lol', 15);`)).insertId; // herdy herrrrr
        // Create an action
        const actionId = (await pQuery.query('INSERT INTO actions (name) VALUES (\'Lol\');')).insertId;
        // Link 'em.
        await pQuery.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id, order_num) VALUES (${templateId}, ${actionId}, 1)`);
        // Test
        expect((await pQuery.select('id', 'actions','id', actionId)).length).to.equal(1);
        expect((await pQuery.select('action_id', 'schedule_template_actions','action_id', actionId)).length).to.equal(1);
        const deletedActionId = await autoscheduler.delete.action(actionId);
        expect((await pQuery.select('id', 'actions','id', actionId)).length).to.equal(0);
        expect((await pQuery.select('action_id', 'schedule_template_actions','action_id', actionId)).length).to.equal(0);
        expect(actionId).to.equal(deletedActionId);
        // Clean up
        await pQuery.query(`DELETE FROM schedule_template_actions WHERE action_id = ${actionId}`);
        await pQuery.query(`DELETE FROM schedule_templates WHERE id = ${templateId}`);
        await pQuery.query(`DELETE FROM actions WHERE id = ${actionId}`);
    })

    xit('Action creation/retrieval should show the position it\'s at');
   
    xit('Should throw an error if trying to create an action without a current template');

    xit('Lets me reorder actions for the current template');

    xit('Should error out if no current actions');

    xit('Should error out if no current schedule template');

    it('Shows the currently selected outcome', async function () {
        // Make sure there are no currently selected purposes
        await pQuery.query('UPDATE outcomes SET is_current = false;');
        expect((await pQuery.query('SELECT * FROM outcomes WHERE is_current = true;')).length).to.equal(0);

        // expect((await pQuery.select('*', 'outcomes','is_current', 'true')).length).to.equal(0); Bug in select
        // Set something I make as the current
        const outcomeId = (await pQuery.query('INSERT INTO outcomes (name, is_current) VALUES (\'Lol\', true);')).insertId;
        const currentOutcomes = await pQuery.select('*', 'outcomes','id', outcomeId);
        expect(currentOutcomes.length).to.equal(1);
        expect(currentOutcomes[0].id).to.equal(outcomeId);
        expect(currentOutcomes[0].name).to.equal('Lol');
        expect(currentOutcomes[0].is_current).to.equal(1); // be true
        
        const currentOutcome = await autoscheduler.retrieve.current.outcome();
        expect(currentOutcome.id).to.equal(outcomeId);
        expect(currentOutcome.name).to.equal(currentOutcomes[0].name);
        expect(currentOutcome.is_current).to.equal(1); // be true

        // Tear down
        await pQuery.query(`DELETE FROM outcomes WHERE id = ${outcomeId}`);
    });

    it('Shows the currently selected purpose', async function () {
        // Set up
        // Test
        // Tear down

        // Make sure there are no currently selected purposes
        await pQuery.query('UPDATE purposes SET is_current = false;');
        expect((await pQuery.query('SELECT * FROM purposes WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const purposeId = (await pQuery.query('INSERT INTO purposes (name, is_current) VALUES (\'Lol\', true);')).insertId;
        const currentPurposes = await pQuery.select('*', 'purposes','id', purposeId);
        expect(currentPurposes.length).to.equal(1);
        expect(currentPurposes[0].id).to.equal(purposeId);
        expect(currentPurposes[0].name).to.equal('Lol');
        expect(currentPurposes[0].is_current).to.equal(1);
        
        const currentPurpose = await autoscheduler.retrieve.current.purpose();
        expect(currentPurpose.id).to.equal(purposeId);
        expect(currentPurpose.name).to.equal(currentPurposes[0].name);
        expect(currentPurpose.is_current).to.equal(1);

        // Tear down
        await pQuery.query(`DELETE FROM purposes WHERE id = ${purposeId}`);
    });

    it('Shows the currently selected obstacle', async function () {
        // Set up
        // Test
        // Tear down

        // Make sure there are no currently selected obstacles
        await pQuery.query('UPDATE obstacles SET is_current = false;');
        expect((await pQuery.query('SELECT * FROM obstacles WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const obstacleId = (await pQuery.query('INSERT INTO obstacles (name, is_current) VALUES (\'Lol\', true);')).insertId;
        const currentObstacles = await pQuery.select('*', 'obstacles','id', obstacleId);
        expect(currentObstacles.length).to.equal(1);
        expect(currentObstacles[0].id).to.equal(obstacleId);
        expect(currentObstacles[0].name).to.equal('Lol');
        expect(currentObstacles[0].is_current).to.equal(1);
        
        const currentObstacle = await autoscheduler.retrieve.current.obstacle();
        expect(currentObstacle.id).to.equal(obstacleId);
        expect(currentObstacle.name).to.equal(currentObstacles[0].name);
        expect(currentObstacle.is_current).to.equal(1);

        // Tear down
        await pQuery.query(`DELETE FROM obstacles WHERE id = ${obstacleId}`);
    });

    it('Shows the currently selected schedule template', async function () {
        // Set up
        // Test
        // Tear down

        // Make sure there are no currently selected obstacles
        await pQuery.query('UPDATE schedule_templates SET is_current = false;');
        expect((await pQuery.query('SELECT * FROM schedule_templates WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const scheduleTemplateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true);')).insertId;
        const currentScheduleTemplates = await pQuery.select('*', 'schedule_templates','id', scheduleTemplateId);
        expect(currentScheduleTemplates.length).to.equal(1);
        expect(currentScheduleTemplates[0].id).to.equal(scheduleTemplateId);
        expect(currentScheduleTemplates[0].name).to.equal('Lol');
        expect(currentScheduleTemplates[0].is_current).to.equal(1);
        
        const currentScheduleTemplate = await autoscheduler.retrieve.current.template();
        expect(currentScheduleTemplate.id).to.equal(scheduleTemplateId);
        expect(currentScheduleTemplate.name).to.equal(currentScheduleTemplates[0].name);
        expect(currentScheduleTemplate.is_current).to.equal(1);

        // Tear down
        await pQuery.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
    });

    it('Shows the currently selected decision', async function () {

        // Make sure there are no currently selected obstacles
        await pQuery.query('UPDATE decisions SET is_current = false;');
        expect((await pQuery.query('SELECT * FROM decisions WHERE is_current = true;')).length).to.equal(0);
        // Set something I make as the current
        const decisionId = (await pQuery.query('INSERT INTO decisions (name, is_current) VALUES (\'Lol\', true);')).insertId;
        const currentDecisions = await pQuery.select('*', 'decisions','id', decisionId);
        expect(currentDecisions.length).to.equal(1);
        expect(currentDecisions[0].id).to.equal(decisionId);
        expect(currentDecisions[0].name).to.equal('Lol');
        expect(currentDecisions[0].is_current).to.equal(1);
        
        const currentDecision = await autoscheduler.retrieve.current.decision();
        expect(currentDecision.id).to.equal(decisionId);
        expect(currentDecision.name).to.equal(currentDecisions[0].name);
        expect(currentDecision.is_current).to.equal(1);

        // Tear down
        await pQuery.query(`DELETE FROM decisions WHERE id = ${decisionId}`);
    });

    it('Shows the past ten outcomes under the current purpose', async function() {
        // Set up
        const outcomeNames = [];
        for (let i = 0; i < 11; i++) {
            outcomeNames.push(`Outcome #${i}`);
        }
        // Have eleven outcomes
        await pQuery.insert('outcomes', ['name'], outcomeNames);
        const lastElevenOutcomes = await pQuery.query('SELECT id FROM outcomes ORDER BY id DESC LIMIT 11');
        expect(lastElevenOutcomes.length).to.equal(11);

        // Connect 'em to a purpose
        await pQuery.query('UPDATE purposes SET is_current = false');
        const purposeId = (await pQuery.query('INSERT INTO purposes (name, is_current) VALUES (\'Haha\', true);')).insertId;
        lastElevenOutcomes.forEach(async outcome => {
            await pQuery.query(`INSERT INTO purpose_outcomes (purpose_id, outcome_id) VALUES (${purposeId}, ${outcome.id});`);
        });
        const purposeOutcomes = await pQuery.query(`SELECT * FROM purpose_outcomes WHERE purpose_id = ${purposeId};`);
        expect(purposeOutcomes.length).to.equal(11);
        
        // Test

        const relatedOutcomes = await autoscheduler.retrieve.related.outcomes();
        expect(relatedOutcomes.length).to.equal(11);
        expect(relatedOutcomes[3].id).to.equal(purposeOutcomes[3].outcome_id);
        
        // Tear down
        await pQuery.query(`DELETE FROM purpose_outcomes WHERE purpose_id = ${purposeId}`);
        await pQuery.query(`DELETE FROM purposes WHERE id = ${purposeId}`);
        expect((await pQuery.select('*', 'purpose_outcomes', 'purpose_id', purposeId)).length).to.equal(0);
        for (let i = 0; i < lastElevenOutcomes.length; i++) {
            const outcome = lastElevenOutcomes[i];
            await pQuery.query(`DELETE FROM outcomes WHERE id = ${outcome.id}`);
            expect((await pQuery.select('*', 'outcomes', 'id', outcome.id)).length).to.equal(0);
        }
    });

    it('Shows the past ten decisions under the current outcome', async function() {
        // Set up
        const obstacleNames = [];
        for (let i = 0; i < 11; i++) {
            obstacleNames.push(`Obstacle #${i}`);
        }
        // Have eleven obstacles
        await pQuery.insert('obstacles', ['name'], obstacleNames);
        const lastElevenObstacles = await pQuery.query('SELECT id FROM obstacles ORDER BY id DESC LIMIT 11');
        expect(lastElevenObstacles.length).to.equal(11);

        // Connect 'em to a outcome
        await pQuery.query('UPDATE outcomes SET is_current = false');
        const outcomeId = (await pQuery.query('INSERT INTO outcomes (name, is_current) VALUES (\'Haha\', true);')).insertId;
        lastElevenObstacles.forEach(async obstacle => {
            await pQuery.query(`INSERT INTO outcome_obstacles (outcome_id, obstacle_id) VALUES (${outcomeId}, ${obstacle.id});`);
        });
        const outcomeObstacles = await pQuery.query(`SELECT * FROM outcome_obstacles WHERE outcome_id = ${outcomeId};`);
        expect(outcomeObstacles.length).to.equal(11);
        
        // Test

        const relatedObstacles = await autoscheduler.retrieve.related.obstacles();
        expect(relatedObstacles.length).to.equal(11);
        expect(relatedObstacles[3].id).to.equal(outcomeObstacles[3].obstacle_id);
        
        // Tear down
        await pQuery.query(`DELETE FROM outcome_obstacles WHERE outcome_id = ${outcomeId}`);
        await pQuery.query(`DELETE FROM outcomes WHERE id = ${outcomeId}`);
        expect((await pQuery.select('*', 'outcome_obstacles', 'outcome_id', outcomeId)).length).to.equal(0);
        for (let i = 0; i < lastElevenObstacles.length; i++) {
            const obstacle = lastElevenObstacles[i];
            await pQuery.query(`DELETE FROM obstacles WHERE id = ${obstacle.id}`);
            expect((await pQuery.select('*', 'obstacles', 'id', obstacle.id)).length).to.equal(0);
        }
    });

    it('Shows the past ten decisions under the current obstacle', async function() {
        // Set up
        const decisionNames = [];
        for (let i = 0; i < 11; i++) {
            decisionNames.push(`Decision #${i}`);
        }
        // Have eleven decisions
        await pQuery.insert('decisions', ['name'], decisionNames);
        const lastElevenDecisions = await pQuery.query('SELECT id FROM decisions ORDER BY id DESC LIMIT 11');
        expect(lastElevenDecisions.length).to.equal(11);

        // Connect 'em to a obstacle
        await pQuery.query('UPDATE obstacles SET is_current = false');
        const obstacleId = (await pQuery.query('INSERT INTO obstacles (name, is_current) VALUES (\'Haha\', true);')).insertId;
        lastElevenDecisions.forEach(async decision => {
            await pQuery.query(`INSERT INTO obstacle_decisions (obstacle_id, decision_id) VALUES (${obstacleId}, ${decision.id});`);
        });
        const obstacleDecisions = await pQuery.query(`SELECT * FROM obstacle_decisions WHERE obstacle_id = ${obstacleId};`);
        expect(obstacleDecisions.length).to.equal(11);
        
        // Test

        const relatedDecisions = await autoscheduler.retrieve.related.decisions();
        expect(relatedDecisions.length).to.equal(11);
        expect(relatedDecisions[3].id).to.equal(obstacleDecisions[3].decision_id);
        
        // Tear down
        await pQuery.query(`DELETE FROM obstacle_decisions WHERE obstacle_id = ${obstacleId}`);
        await pQuery.query(`DELETE FROM obstacles WHERE id = ${obstacleId}`);
        expect((await pQuery.select('*', 'obstacle_decisions', 'obstacle_id', obstacleId)).length).to.equal(0);
        for (let i = 0; i < lastElevenDecisions.length; i++) {
            const decision = lastElevenDecisions[i];
            await pQuery.query(`DELETE FROM decisions WHERE id = ${decision.id}`);
            expect((await pQuery.select('*', 'decisions', 'id', decision.id)).length).to.equal(0);
        }
    });

    it('Shows the actions related to the current schedule template', async function() {
        // Set up
        const actions = [];
        for (let i = 0; i < 11; i++) {
            actions.push([`Action #${i}`, i]);
        }
        // Have eleven actions
        await pQuery.insert('actions', ['name', 'duration'], actions);
        const lastElevenActions = await pQuery.query('SELECT id FROM actions ORDER BY id DESC LIMIT 11');
        expect(lastElevenActions.length).to.equal(11);

        // Connect 'em to a schedule_template
        await pQuery.query('UPDATE schedule_templates SET is_current = false');
        const scheduleTemplateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Haha\', true);')).insertId;
        lastElevenActions.forEach(async action => {
            await pQuery.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${scheduleTemplateId}, ${action.id});`);
        });
        const scheduleTemplateActions = await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`);
        expect(scheduleTemplateActions.length).to.equal(11);
        
        // Test

        const relatedActions = await autoscheduler.retrieve.related.actions();
        expect(relatedActions.length).to.equal(11);
        expect(relatedActions[3].id).to.equal(scheduleTemplateActions[3].action_id);
        
        // Tear down
        await pQuery.query(`DELETE FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId}`);
        await pQuery.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
        expect((await pQuery.select('*', 'schedule_template_actions', 'schedule_template_id', scheduleTemplateId)).length).to.equal(0);
        for (let i = 0; i < lastElevenActions.length; i++) {
            const action = lastElevenActions[i];
            await pQuery.query(`DELETE FROM actions WHERE id = ${action.id}`);
            expect((await pQuery.select('*', 'actions', 'id', action.id)).length).to.equal(0);
        }
    });

    xit('Lets me undo an update... in case I select the wrong action');

    xit('For reliability, events have actual order numbers associated with them')

    xit('Shows the events related to the schedule', async function () {
        
    })
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
            await pQuery.query('UPDATE schedule_templates SET is_current = false');
            scheduleTemplateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Lol\', true)')).insertId;

            //  Actions
            actions = [];
            for (let i = 0; i < 11; i++) {
                actions.push([`Action #${i}`, i]);
            }
            await pQuery.insert('actions', ['name', 'duration'], actions);
            lastElevenActions = await pQuery.query('SELECT id FROM actions ORDER BY id DESC LIMIT 11');
            expect(lastElevenActions.length).to.equal(11);
            
            //  Link actions to the schedule template
            let i = 1;
            lastElevenActions.forEach(async action => {
                await pQuery.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id, order_num) VALUES (${scheduleTemplateId}, ${action.id}, ${i++});`);
            });
            expect((await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(11);
            
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
            expect((await pQuery.query(`SELECT * FROM schedule_events WHERE schedule_id = ${updatedSchedule.id}`)).length).to.equal(9);
        })

        it('Has a new and linked schedule template', async function () {
            // It should have a new schedule template. Link that.
            basedOnTemplateId = (await pQuery.query(`SELECT based_on_template_id FROM schedules WHERE id = ${updatedSchedule.id}`))[0].based_on_template_id;
            expect(basedOnTemplateId).to.not.equal(schedule.template.id);
        })

        after(async function() {
            /// Teardown
            //  Remove: 
            //  schedule links for the schedule template
            //  schedule
            //  actions links for the schedule template
            await pQuery.query(`DELETE FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId} OR schedule_template_id = ${updatedSchedule.template.id}`);
            expect((await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${scheduleTemplateId};`)).length).to.equal(0);
            //  actions
            for (let i = 0; i < lastElevenActions.length; i++) {
                const action = lastElevenActions[i];
                await pQuery.query(`DELETE FROM actions WHERE id = ${action.id}`);
                expect((await pQuery.select('*', 'actions', 'id', action.id)).length).to.equal(0);
            }
            //  schedule template
            await pQuery.query(`DELETE FROM schedule_templates WHERE id = ${scheduleTemplateId}`);
        });
    })

    after(function() {
        setTimeout(() => {
            process.exit(0);
        }, 200);
    });
});

