import Router from '@koa/router';
import { ObjectId } from 'mongodb';
import { inno_db } from '../../database';
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

blogRouter.post('/update', JWTAuth(1), async ctx => {
  const placeHolder: any = {};
  Object.keys(ctx.request.body).filter((val) => {
    return val !== '_id'
  }).forEach((v) => {
    placeHolder[v] = ctx.request.body[v];
  });
  try {
    const result = await inno_db.collection('blogs').updateOne({
      _id: new ObjectId(ctx.request.body._id)
    }, {
      $set: placeHolder
    });
    if (result.matchedCount === 1) {
      ctx.body = { code: 201, data: 'success' };
    } else ctx.body = { code: 404, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

blogRouter.delete('/:id', JWTAuth(1), async ctx => {
  try {
    const result = await inno_db.collection('blogs').deleteOne({
      _id: new ObjectId(ctx.params.id)
    });
    if (result.deletedCount === 1) ctx.body = { code: 204, data: 'success' };
    else ctx.body = { code: 400, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

blogRouter.get('/list', async ctx => {
  try {
    const limit = ctx.request.query.limit;
    const cursor = inno_db.collection('blogs').find({}, {
      limit: Number(limit),
      projection: { _id: 1, title: 1 }
    });
    ctx.body = { code: 200, data: await cursor.toArray() };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

blogRouter.get('/:id', async ctx => {
  try {
    const result = await inno_db.collection('blogs').findOne({
      _id: new ObjectId(ctx.params.id)
    });

    if (result) {
      ctx.body = { code: 200, data: result };
    }
    else ctx.body = { code: 404, data: '无数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

blogRouter.get('/', async ctx => {
  try {
    const cursor = inno_db.collection('blogs').find({}, {
      limit: Number(ctx.request.query.size),
      skip: Number(ctx.request.query.skip)
    });
    ctx.body = { code: 200, data: await cursor.toArray() };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

export default blogRouter;