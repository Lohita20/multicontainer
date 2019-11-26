const keys = require('./keys')

// cors == Cross Origin Resource Sharing

// Express app setup
const express = require('express');
const bodyParse = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres client setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    post: keys.pgPort
});
pgClient.on('error', () => console.log('Lost Postgres connection'));
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.log(err));

// Redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express rouute handlers

// Test route that returns an arbitrary string to show server is running
app.get('/', (req, res) => {
    res.send('Hi');
});

// Return all values that have been submitted so far
app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

// Return all values that have been requested and their Fibonacci values
app.get('/values/current', async(req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

// Put the specified value in the Postgres database.
// Calculate its Fibonacci value and store the value and fib in Redis.
// Return the Fibonacci value
app.post('/values', async(req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true});
});

// Start listinging for request on port 5000
app.listen(5000, err => {
    console.log('Listening');
});
