require('dotenv').config({path: __dirname + '/../../.env'});

export default interface Model {
    create();
    retrieve();
    update();
    delete();
}

export class AutoschedulerModel implements Model {
    id;
    static driver;
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