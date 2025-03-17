'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 1337;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());

const router = require('./routes/router');
app.use('/', router); 

app.use(express.static(path.join(__dirname, 'public')));


app.listen(port, function () {
    console.log('Сервер запущен на http://localhost:' + port);
});