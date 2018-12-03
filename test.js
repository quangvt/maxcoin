const request = require('request');
const redis = require('redis');
const mysql = require('mysql2');
const MongoClient = require('mongodb').MongoClient;
const dsn = 'mongodb://localhost:47017/maxcoin';

// Generic function that fetches the closing bitcoin dates of the last month from a public API
function fetchFromAPI(callback) {
    request.get('https://api.coindesk.com/v1/bpi/historical/close.json', (err, raw, body) => {
        return callback(err, JSON.parse(body));
    });
}

// MongoDB
function insertMongodb(collection, data) {
    const promisedInserts = [];
    Object.keys(data).forEach((key) => {
        promisedInserts.push(
            collection.insertOne({date: key, value: data[key]})
        );
    });
    return Promise.all(promisedInserts);
}

MongoClient.connect(dsn, { useNewUrlParser: true },  (err, client) => {
    console.time('mongodb');
    if (err) throw err;
    console.log('Connected successfully to MongoDB server');
    fetchFromAPI((err, data) => {
        if (err) throw err;
        const collection = client.db().collection('value');
        insertMongodb(collection, data.bpi)
            .then((result) => {
                console.log(`Successfully inserted ${result.length} documents into mongodb.`);

                const options = {'sort': [['value', 'desc']]};
                collection.findOne({}, options, (err, doc) => {
                    if (err) throw err;
                    console.log(`MongoDB: The one month max value is ${doc.value} and it was reached on ${doc.date}`);
                    console.timeEnd('mongodb');
                    client.close();
                });
            })
            .catch((err) => {
                console.log(err);
                process.exit();
            });
    });
});

// Redis
function insertRedis(client, data, callback) {
    const values = ['values'];
    Object.keys(data).forEach((key) => {
        values.push(data[key]);
        values.push(key);
    });
    client.zadd(values, callback);
}

const redisClient = redis.createClient(8379);
redisClient.on('connect', () => {
    console.time('redis');
    console.log('Successfully connected to redis');

    fetchFromAPI((err, data) => {
        if (err) throw err;
        
        insertRedis(redisClient, data.bpi, (err, results) => {
            if (err) throw err;
            console.log(`Successuflly inserted ${results} key/value pairs into redis`);

            redisClient.zrange('values', -1, -1, 'withscores', (err, result) => {
                if (err) throw err;
                console.log(`Redis: The one month max value is ${result[1]} and it was reached on ${result[0]}`);
                console.timeEnd('redis');
                redisClient.end();
            })
        })
    })
});

// MySQL
function insertMySQL(connection, data, callback) {
    const values = [];
    const sql = 'INSERT INTO coinvalues (valuedate, coinvalue) VALUES ?';

    Object.keys(data).forEach((key) => {
        values.push([key, data[key]]);
    });
    connection.query(sql, [values], callback);
}

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3308,
    user: 'root',
    password: '<YourPassword>',
    database: 'maxcoin',
});

connection.connect((err) => {
    if (err) throw err;
    console.time('mysql');
    console.log('Successuflly connected to mysql');

    fetchFromAPI((err, data) => {
        if (err) throw err;
        insertMySQL(connection, data.bpi, (err, results, fields) => {
            if (err) throw err;
            console.log(`Successfully inserted ${results.affectedRows} documents into MYSQL`);
            connection.query('SELECT * FROM coinvalues ORDER BY coinvalue DESC LIMIT 0,1', (err, results, fields) => {
                if (err) throw err;
                console.log(`MySQL: The one month max value is ${results[0].coinvalue} and was reached on ${results[0].valuedate}`);
                console.timeEnd('mysql');
                connection.end();
            });
        });
    });
});
