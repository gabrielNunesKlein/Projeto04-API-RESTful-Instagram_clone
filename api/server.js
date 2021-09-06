var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = 80;
app.listen(port);

console.log("Servidor HTTP, está escutando na porta ", port);