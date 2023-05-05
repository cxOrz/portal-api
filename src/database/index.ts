import { MongoClient } from "mongodb";
import { dbConfig } from "../config/global.config";

// const uri = `mongodb://${dbConfig.user}:${dbConfig.password}@127.0.0.1:27017/?authMechanism=DEFAULT`;
const uri = `mongodb+srv://${dbConfig.user}:${dbConfig.password}@cluster0.wwwqhpp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

export const inno_db = client.db('inno');

export default client;
