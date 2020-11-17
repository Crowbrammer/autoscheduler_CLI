import Controller from './Controller';
import ActionBuilder from '../builders/ActionBuilder';
import Template from '../models/Template';

export default class ActionController implements Controller {
    async create(data: any) {
        // Get the current template.
        const t = new Template();
        await t.getCurrentTemplate();

        // If repeating
        if (data[0] === '--repeat') {
            // if (/\D+/.test(data[1]))
            //     throw new Error('Require a starting position for repeating.');
            // if (/\D+/.test(data[2]))
            //     throw new Error('Require an ending position for repeating.');
            // if (/\D+/.test(data[3]))
            //     throw new Error('Please specify how many times you want to repeat it.');

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
            
            return `Actions from positions ${data[1]} to ${data[2]}, inclusive, repeated 3 more times.`
        }
            
        // Make an action, mn
        const action = await ActionBuilder.create({name: data[0], duration: data[1]});
        // Link it to the current template.
        await t.link(action);
        return `Created action, ${action.name}, of duration ${action.duration} minutes.`;
    };
    async retrieve() {};
    async update() {};
    async delete() {};      
}