import Controller from './Controller';
import TemplateBuilder from '../builders/TemplateBuilder';
import Template from '../models/Template';

export default class TemplateController implements Controller {
    async create(args) {
        // Create a template with the given arguments and return it 
        await TemplateBuilder.create({name: args[0], markAsCurrent: true});
        if (!args[0]) {
            return `Created an unnamed template.`
        } else {
            return `Created new template named '${args[0]}'.`
        }
    }
    async retrieve() {
        // Grab the current template
        const t = new Template();
        await t.getCurrentTemplate();
        // Get the actions for it
        const actions = await t.getActions();
        // Make a nice message with it
        let msg = `${t.name}:\n\n`;
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            msg += `  ${i + 1}. ${action.name}, ${action.duration} mins\n`;
        }
        return msg
    }
    async update() {}
    async delete() {}
}