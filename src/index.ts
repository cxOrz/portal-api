import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import apiRouter from './api/api.routes';

const app = new Koa();

app.use(bodyParser());
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  await next();
})
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Max-Age", "300");
  if (ctx.method === 'OPTIONS') {
    ctx.body = '';
  }
  await next();
});
app.use(apiRouter.routes());

app.listen(5000, () => { console.log('Server: http://127.0.0.1:5000') });
