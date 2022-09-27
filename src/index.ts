import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import apiRouter from './api/api.routes';
import { test } from "./database";

const app = new Koa();

app.use(bodyParser());
app.use(apiRouter.routes());

app.listen(5000, () => { console.log('Server: http://127.0.0.1:5000') });
