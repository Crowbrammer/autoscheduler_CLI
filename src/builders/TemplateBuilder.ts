import Builder from './Builder';
import Template from '../models/Template';

export default class TemplateBuilder extends Builder {
    static async create(options) {
        // Insert it into the db, tracking the Id;
        const query = await Builder.driver.query(`INSERT INTO schedule_templates (name) VALUES ('${options.name}');`);
        let id = Builder.getInsertId(query);       
        return new Template({id, name: options.name ? options.name : ''});
    }
}