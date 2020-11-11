import { config } from 'dotenv'
config({path: __dirname + '/../../.env'});

export default interface Model {
    create();
    retrieve();
    update();
    delete();
}

export abstract class AutoschedulerModel implements Model {
    static driver;
    id;
    driver;
    options: any;

    constructor(options?) {
        this.driver = AutoschedulerModel.driver;
    }

    create() {};
    retrieve() {};
    update() {};
    delete() {};
    
    async insert(query) {
        switch (this.driver.constructor.name) {
            case 'Database': // SQLite
                return (await this.driver.query(query)).lastID;
        
            case 'PQuery':
                return (await this.driver.query(query)).insertId;
        
            default:
                throw new Error('Driver not supported or non-existent.');
        }
    };
}