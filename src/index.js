// Express App Setup
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import request from 'request';
import http from 'http';
import socket from 'socket.io';

import util from 'util';
import { exec } from 'child_process';

import JSONStream from 'JSONStream';

const execPromise = util.promisify(exec);

const app = express();
const server = http.createServer(app);
const io = socket(server);
app.use(cors());
app.use(bodyParser.json());

// Express route handlers

const podStatusData = {}

app.get('/ping', (req, res) => {
  res.send('Hello World');
});

app.post('/deployment/fib-calculator', async (req, res) => {
  try {
    const { stdout, stderr } = await execPromise('kubectl apply -f /home/sysadm/workspace/fib-calculator-k8s/k8s');

    if (stderr) {
      console.error(`stderr: ${stderr}`);

      return res.status(422).send({ status: 'ERROR', message: `stderr: ${stderr}` })
    }
    console.log(`stdout: ${stdout}`);

    return res.send({ status: 'OK', message: `stdout: ${stdout}` })

  } catch (err) {
    console.log(err)

    return res.status(422).send({ status: 'ERROR', message: `err: ${err}` })
  }
})

app.delete('/deployment/fib-calculator', async (req, res) => {
  try {
    const { stdout, stderr } = await execPromise('kubectl delete -f /home/sysadm/workspace/fib-calculator-k8s/k8s');

    if (stderr) {
      console.error(`stderr: ${stderr}`);

      return res.status(422).send({ status: 'ERROR', message: `stderr: ${stderr}` })
    }
    console.log(`stdout: ${stdout}`);

    return res.send({ status: 'OK', message: `stdout: ${stdout}` })

  } catch (err) {
    console.log(err)

    return res.status(422).send({ status: 'ERROR', message: `err: ${err}` })
  }
})

const parser = JSONStream.parse();

request('http://127.0.0.1:8001/api/v1/watch/namespaces/default/pods/').pipe(parser)

const clients = []

const addClient = (client) => {
  clients.push(client)
}

io.on('connection', client => {
  addClient(client)
  client.on('event', data => { /* … */ });
  client.on('disconnect', () => { /* … */ });
});

parser.on('data', (event) => {
    const eventType = event.type
    const podName = event.object.metadata.name

    if (eventType === 'ADDED') {
      podStatusData[podName] = [event]
    } else {
      podStatusData[podName].push(event)
    }

    if (eventType === 'DELETED') {
      delete podStatusData[podName]
    }
    console.log({ podStatusData })
    clients.forEach(client => {
      client.send('pod-status-event', event)
    })
})

server.listen(5000, err => {
  console.log('Listening');
});

export default server