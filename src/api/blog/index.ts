import Router from '@koa/router';
import jwt from 'jsonwebtoken';
import { inno_db } from '../../database';
import { JWTSecret } from '../../config/global.config';
import { JWTAuth } from '../../middleware/auth';

const blogRouter = new Router({ prefix: '/blog' });

blogRouter.post('/create', JWTAuth(1), async ctx => {
  try {
    await inno_db.collection('blogs').insertOne({
      title: ctx.request.body?.title,
      openid: ctx.custom.uid,
      date: new Date(),
      markdown: ctx.request.body?.markdown,
      tag: ctx.request.body?.tag,
      author: ctx.request.body?.author,
      description: ctx.request.body?.description
    });
    ctx.body = { code: 201, data: 'success' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});


export default blogRouter;