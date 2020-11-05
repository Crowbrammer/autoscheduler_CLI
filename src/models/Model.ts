const PQuery = require('prettyquery');
const dbCreds = {user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE};

export default interface Model {
    create();
    retrieve();
    update();
    delete();
}

export class AutoschedulerModel implements Model{
    driver = new PQuery(dbCreds)
    create() {};
    retrieve() {};
    update() {};
    delete() {};
}