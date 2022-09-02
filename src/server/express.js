import express from 'express';
import 'dotenv/config';

export const app = express();

app.get('/', async (req, res) => {
    res.send('Server Works!');
});
export const startServer = () => {
    app.listen(process.env.EXPRESS_PORT, () => {
        consola.success(`Server started on port ${process.env.EXPRESS_PORT}`);
    });
}
