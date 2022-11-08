import express from 'express';
import bodyParser from 'body-parser'
import { mongo } from '../integrations/mongo.js';
import 'dotenv/config';

export const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    res.send('Server Works!');
});

app.get('/api/v1/github/sync/:branch' , async (req, res) => {
    if(req.params.branch === 'main' || req.params.branch === 'stable') {
        res.status(200);
        await mongo.syncReleaseData(req.params.branch).then(() => {
            res.send(`Synced ${req.params.branch}`);
        });
    }
    else {
        res.status(403);
        res.send(`Branch ${req.params.branch} not found`);
    }
});

export const startServer = () => {
    app.listen(process.env.EXPRESS_PORT, 'localhost', () => {
        consola.success(`Server started on port ${process.env.EXPRESS_PORT}`);
    });
}
