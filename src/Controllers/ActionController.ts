import Controller from './Controller';
import ActionBuilder from '../builders/ActionBuilder';
import Template from '../models/Template';
import Action from '../models/Action';

export default class ActionController implements Controller {
    async create(data: any) {
        // Get the current template.
        const t = new Template();
        await t.getCurrentTemplate();

        // If repeating
        if (/r/.test(data[0])) {
            if (/\D+/.test(data[1]))
                throw new Error('Require a starting position for repeating.');
            if (/\D+/.test(data[2]))
                throw new Error('Require an ending position for repeating.');
            if (/\D+/.test(data[3]))
                throw new Error('Please specify how many times you want to repeat it.');

            // Find the actions of the current template
            const templateActions = await t.getActions();
            // Select the actions from the given positions
            const selectedActions = templateActions.slice(data[1] - 1, data[2]);
            // // Add duplicates of these actions the given number of times
            for (let i = 0; i < data[3]; i++) {
                for (let i = 0; i < selectedActions.length; i++) {
                    let action = selectedActions[i];
                    action = await ActionBuilder.create(action);
                    await t.link(action);
                }
            }
            
            return `Actions from positions ${data[1]} to ${data[2]}, inclusive, repeated ${data[3]} more ${data[3] == 1 ? 'time' : 'times'}.`
        } else if (/time/.test(data[2])) {
            // Parse the digits from it
            const digits = /\d+/.exec(data[2]);
            // Expect the digits to actually be digits
            // if (/\D/.test(digits))
            //     throw new Error('Only use digits for the --times flag');
            
            for (let i = 0; i < digits; i++) {
                // Add the actions for as many times as the times says, linking each
                const action = await ActionBuilder.create({name: data[0], duration: data[1]});
                await t.link(action);
            }
            return `Created ${digits} ${digits == 1 ? 'copy' : 'copies'} of the action, '${data[0]}', of duration ${data[1]} minutes.`;
        } 
            
        // Make an action, mn
        const action = await ActionBuilder.create({name: data[0], duration: data[1]});
        // Link it to the current template.
        await t.link(action);
        return `Created action, ${action.name}, of duration ${action.duration} minutes.`;
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