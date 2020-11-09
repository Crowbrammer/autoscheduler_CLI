import Builder from './Builder';
import Schedule from '../models/Schedule';

export default class ScheduleBuilder extends Builder {
    static async create(options: {name: string, actions: any[], templateId: number | string}) {
        if (!options.name)
            throw new Error('Add a name to build an Schedule.');
        const s = new Schedule({templateId: options.templateId, actions: options.actions, name: options.name});
        return await s.save();
    }
}
