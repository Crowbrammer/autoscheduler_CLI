import Builder from './Builder';
import Action from '../models/Action';

export default class ActionBuilder extends Builder {
    static async create(options) {
        if (!options.duration)
            throw new Error('Add a duration to build an Action.');
        if (!options.name)
            throw new Error('Add a name to build an Action.');

        // Insert it into the db, tracking the Id;
        const query = await Builder.driver.query(`INSERT INTO actions (name, duration) VALUES ('${options.name}', ${options.duration});`)
        let id = Builder.getInsertId(query);       
        return new Action({id, name: options.name, duration: options.duration});
    }
}