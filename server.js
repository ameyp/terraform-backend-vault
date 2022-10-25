const express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;

const state_mount = "terraform-state"

function dumpAll(req) {
    console.error(`Called with the method [${req.method}], params [${JSON.stringify(req.params)}], query [${JSON.stringify(req.query)}], body [${JSON.stringify(req.body)}]`);
}

let token = process.env.TOKEN;

let options = {
    apiVersion: 'v1', // default
    endpoint: 'https://vault.wirywolf.com', // default
    token: token
};

// get new instance of the client
let vault = require("node-vault")(options);

app.use(express.json({limit: "100mb", parameterLimit: 100000000}))
app.listen(port);
console.log('API server started on: ' + port);

app.get('/:module', (req, res) => {
    vault.read(`${state_mount}/data/${req.params.module}/state`).then((output) => {
        console.debug(`State ${req.params.module} returned to client`);
        res.status(200).json(output.data.data).end();
    }).catch((err) => {
        console.error(`State ${req.params.module} not found`)
        res.status(404).end();
    })
}).post('/:module', (req, res) => {
    vault.write(`${state_mount}/data/${req.params.module}/state`, { data: req.body }).then((output) => {
        res.status(200).end();
    })
}).lock('/:module', (req, res) => {
    console.debug(`State ${req.params.module} locked by ${req.body.ID}`)
    vault.write(`${state_mount}/data/${req.params.module}/lock`, { data: req.body }).then((output) => {
        res.status(200).end();
    })
}).unlock('/:module', (req, res) => {
    vault.read(`${state_mount}/data/${req.params.module}/lock`).then((output) => {
        if (output.data.data.ID == req.body.ID) {
            vault.delete(`${state_mount}/data/${req.params.module}/lock`).then((output) => {
                console.debug(`State ${req.params.module} unlocked by ${req.body.ID}`)
                res.status(200).end()
            }).catch((err) => {
                console.error(`Could not unlock ${req.body.ID} because: ${output}`)
                res.status(500).end()
            })
        } else {
            console.error(`Lock is not held by ${req.body.ID}}`)
            res.status(409).end()
        }
    }).catch((err) => {
        console.error(`Lock not held by anyone`)
        res.status(404).end()
    })
}).all('/:module', (req, res) => {
    dumpAll(req);
    res.status(405).end();
});


