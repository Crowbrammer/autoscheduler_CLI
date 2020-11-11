import Controller from './Controller';
import ActionBuilder from '../builders/ActionBuilder';
import Template from '../models/Template';

export default class ActionController implements Controller {
    async create(data: any) {
        // Make an action, mn
        const action = await ActionBuilder.create({name: data[0], duration: data[1]});
        // Get the current template.
        const t = new Template();
        await t.getCurrentTemplate();
        // Link it.
        await t.link(action);
        return action;
    };
    async retrieve() {};
    async update() {};
    async delete() {};      
}