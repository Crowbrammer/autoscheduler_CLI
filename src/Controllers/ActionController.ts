import Controller from './Controller';
import ActionBuilder from '../builders/ActionBuilder';
import Template from '../models/Template';
import Action from '../models/Action';
import Builder from '../builders/Builder';

export default class ActionController implements Controller {
    async create(data: any) {
        try {
            
        // Get the current template.
        const t = new Template();
        await t.getCurrentTemplate();

        // If repeating
        if (/-r/.test(data[0])) {
            if (/\D+/.test(data[1]))
                throw new Error('Require a starting position for repeating.');
            if (/\D+/.test(data[2]))
                throw new Error('Require an ending position for repeating.');

            const numRepeats = data[3] || 1;

            // Find the actions of the current template
            const templateActions = await t.getActions();
            // Select the actions from the given positions
            const selectedActions = templateActions.slice(data[1] - 1, data[2]);
            // // Add duplicates of these actions the given number of times
            for (let i = 0; i < numRepeats; i++) {
                for (let i = 0; i < selectedActions.length; i++) {
                    let action = selectedActions[i];
                    action = await ActionBuilder.create(action);
                    await t.link(action);
                }
            }
            
            return `Actions from positions ${data[1]} to ${data[2]}, inclusive, repeated ${numRepeats} more ${numRepeats == 1 ? 'time' : 'times'}.`
        } else if (/time/.test(data[2])) {
            // Parse the digits from it
            const digits = Number(/\d+/.exec(data[2])[0]);
            
            for (let i = 0; i < digits; i++) {
                // Add the actions for as many times as the times says, linking each
                const action = await ActionBuilder.create({name: data[0], duration: data[1]});
                await t.link(action);
            }
            return `Created ${digits} ${digits === 1 ? 'copy' : 'copies'} of the action, '${data[0]}', of duration ${data[1]} minutes.`;
        } else if (/\d/.test(data[2])) {
            // const action = await ActionBuilder.create({name: data[0], duration: data[1]});
            // Get all the current actions in order
            const currentActions = await t.getActions();
            // Put the action at pos - 1 in currentActions.
            // To avoid messy query... make sure the action's in there...
            const action = await ActionBuilder.create({name: data[0], duration: data[1]});
            await t.link(action);
            currentActions.splice(data[2] - 1, 0, action);
            // Iterate through the link and increment all actions at order - 1 to have an order_num of + 1.
            for (let i = 0; i < currentActions.length; i++) {
                const action = currentActions[i];
                // Set the link's order_num to match its position + 1
                await Builder.driver.query(`UPDATE schedule_template_actions SET order_num = ${i + 1} WHERE schedule_template_id = ${t.id} AND action_id = ${action.id}`);
            }
            // Save all the actions...
            return `Created action, ${action.name}, of duration ${action.duration} minutes at position ${data[2]}.`;
        }
            
        // Make an action, mn
        const action = await ActionBuilder.create({name: data[0], duration: data[1]});
        // Link it to the current template.
        await t.link(action);
        return `Created action, ${action.name}, of duration ${action.duration} minutes.`;
    
        } catch (error) {
            console.log(error.message);
        }
    };
    async retrieve() {};
    async update() {};
    async delete(data: any) {
        // Get the current template
        const t = new Template();
        await t.getCurrentTemplate();
        // Get the actions of the current template
        const actions = await t.getActions();
        // Get the id of the action at order num data[0]
        const atOrderNum = actions[data[0] - 1];
        // Delete it
        return await Action.delete(atOrderNum.id);
    };      
}