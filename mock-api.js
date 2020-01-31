var express = require('express');
var cors = require('cors')
var apiMocker = require('connect-api-mocker');

var app = express();

app.use('/api', cors(), apiMocker('mock-api'));

app.listen(9000);
