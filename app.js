const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const apiRouter = require('./routes/api');
const chartRouter = require('./routes/charts');
const authRouter = require('./routes/auth');
const playlistRouter = require('./routes/playlist');

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Static Files
app.use('/static/news', express.static('./src/images/news'));
app.use('/static/artist/card', express.static('./src/images/artist/card'));
app.use('/static/artist/big', express.static('./src/images/artist/big'));
app.use('/static/artist/group', express.static('./src/images/artist/group'));
app.use('/static/artist/full', express.static('./src/images/artist/full'));
app.use('/static/lyrics', express.static('./src/lyrics'));
app.use('/static/profile', express.static('./src/images/profile'));

// API Routers
app.use('/api', apiRouter);
app.use('/api', chartRouter);
app.use('/', authRouter);
app.use('/api/playlist', playlistRouter);

app.use(express.static(path.join(__dirname, 'build')));
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build/index.html'));
})

app.listen(80, () => console.log('Running'));
