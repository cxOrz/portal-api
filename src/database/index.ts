import { MongoClient } from "mongodb";

const uri = "mongodb://***:*****@127.0.0.1:27017/?authMechanism=DEFAULT";
const client = new MongoClient(uri);

export const inno_db = client.db('inno');

export default client;

export async function test() {
  try {
    const database = client.db('inno');
    const movies = database.collection('users');
    // Query for a movie that has the title 'Back to the Future'
    const query = { title: 'Back to the Future' };
    const movie = await movies.findOne({});
    console.log(movie);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
