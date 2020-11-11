import Controller from './Controller';
import TemplateBuilder from '../builders/TemplateBuilder';

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
    async retrieve() {}
    async update() {}
    async delete() {}
}