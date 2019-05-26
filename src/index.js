// Express App Setup
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import request from 'request';
import http from 'http';
import socket from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = socket(server);
app.use(cors());
app.use(bodyParser.json());

// Express route handlers

app.get('/ping', (req, res) => {
  res.send('Hello World');
});

request('http://127.0.0.1:8001/api/v1/watch/namespaces/default/pods/').pipe(process.stdout)

io.on('connect', client => {
  client.on('event', data => { /* … */ });
  client.on('disconnect', () => { /* … */ });
});

server.listen(5000, err => {
  console.log('Listening');
});

export default server