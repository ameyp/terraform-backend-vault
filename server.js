const express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;

function dumpAll(req) {
    console.log(`Im called with the method [${req.method}], params [${JSON.stringify(req.params)}], query [${JSON.stringify(req.query)}], body [${JSON.stringify(req.body)}]`);
}

let token = process.env.TOKEN;
let caFile = process.env.CA_FILE

let options = {
    apiVersion: 'v1', // default
    endpoint: 'https://vault.wirywolf.com', // default
    token: token,
    requestOptions: {
        caFile: caFile
    }
};

// get new instance of the client
let vault = require("node-vault")(options);

vault.tokenRenewSelf().then((output) => {
    console.log("Token renewed.");
})

app.use(express.json({limit: "100mb", parameterLimit: 100000000}))
app.listen(port);
console.log('book list RESTful API server started on: ' + port);

app.get('/:module', (req, res) => {
    vault.read(`terraform/data/${req.params.module}/state`).then((output) => {
        console.log(output);
        res.status(200).json(output.data.data).end();
    }).catch((output) => {
        console.log(output);
        res.status(404).end();
    })
}).post('/:module', (req, res) => {
    vault.write(`terraform/data/${req.params.module}/state`, { data: req.body }).then((output) => {
        res.status(200).end();
    })
}).all('/:module', (req, res) => {
    dumpAll(req);
    res.status(400).end();
});


