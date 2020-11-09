import Builder from './Builder';
import Checklist from '../models/Checklist';

export default class ChecklistBuilder extends Builder {
    static async create(options) {
        if (!options.name)
            throw new Error('Add a name to build a Checklist.');
        // Insert it into the db, tracking the Id;
        const query = await Builder.driver.query(`INSERT INTO checklists (name) VALUES ('${options.name}');`)
        let id = Builder.getInsertId(query);       
        return new Checklist({id, name: options.name})
    }
}