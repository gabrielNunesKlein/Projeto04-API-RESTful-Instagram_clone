var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('connect-multiparty');
var mongodb = require('mongodb');
var objectId = require('mongodb').ObjectId;
var fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());

app.use(function (req, res, next) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

var port = 8080;
app.listen(port);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

console.log("Servidor HTTP, está escutando na porta ", port);

app.post('/api', function (req, res) {

    //res.setHeader("Access-Control-Allow-Origin", "*");

    var date = new Date();
    time_stamp = date.getTime();
    console.log(req.files.arquivo.originalFilename);

    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

    fs.rename(path_origem, path_destino, function (err) {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }

        db.open(function (err, mongoclient) {
            mongoclient.collection('postagens', function (err, collection) {
                collection.insert(dados, function (err, records) {
                    if (err) {
                        res.json({ 'status': 'erro' });
                    } else {
                        res.json({ 'status': 'Inclusão realizada com sucesso' });
                    }
                    mongoclient.close();
                });
            });
        });
    });
});

app.get('/api', function (req, res) {

    //res.setHeader("Access-Control-Allow-Origin", "*");

    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find().toArray(function (err, result) {
                if (err) {
                    res.json(err)
                } else {
                    res.json(result);
                }
                mongoclient.close();
            });
        });
    });
});

app.get('/imagens/:imagem', function (req, res) {
    var img = req.params.imagem;

    fs.readFile('./uploads/' + img, function (err, content) {
        if (err) {
            res.status(400).json(err);
            return;
        }

        res.writeHead(200, { 'content-type': 'image/jpg' });
        res.end(content);
    });
});

app.get('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find(objectId(req.params.id)).toArray(function (err, result) {
                if (err) {
                    res.json(err)
                } else {
                    res.json(result);
                }
                mongoclient.close();
            });
        });
    });
});

app.put('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.update(
                { _id: objectId(req.params.id) },
                {
                    $push: {
                        comentario: {
                            id_comentario: new objectId(),
                            comentario: req.body.comentario
                        }
                    }
                },
                {},

                function (err, result) {
                    if (err) {
                        res.json(err)
                    } else {
                        res.json(result);
                    }
                    mongoclient.close();
                }
            );
        });
    });
});

app.delete('/api/:id', function (req, res) {
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.update({},
                { $pull: {comentario: {id_comentario: objectId(req.params.id)}}
                },
                {multi: true},
                function (err, records) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(records);
                        // res.status(500).json(records);
                    }
                    mongoclient.close();
                });
        });
    });
});