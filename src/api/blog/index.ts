import Router from '@koa/router';
import { ObjectId } from 'mongodb';
import { serverUrl } from '../../config/global.config';
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
      avatarUrl: ctx.custom.avatarUrl,
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
  if (ctx.request.body?.title) placeHolder.title = ctx.request.body?.title;
  if (ctx.request.body?.description) placeHolder.description = ctx.request.body?.description;
  if (ctx.request.body?.markdown) placeHolder.markdown = ctx.request.body?.markdown;
  if (ctx.request.body?.tag) placeHolder.tag = ctx.request.body?.tag;
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
      result.avatarUrl = serverUrl + '/avatar/' + result.avatarUrl;
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
    let size = 0, skip = 0;
    if (Number(ctx.request.query.size) > 0) {
      size = Number(ctx.request.query.size);
    }
    if (Number(ctx.request.query.skip) > 0) {
      skip = Number(ctx.request.query.skip);
    }
    const cursor = inno_db.collection('blogs').find({}, {
      limit: size,
      skip: skip
    });
    // 生成头像url
    const data = await cursor.map((val) => {
      val.avatarUrl = serverUrl + '/avatar/' + val.avatarUrl;
      return val;
    }).toArray();
    ctx.body = { code: 200, data: data };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

export default blogRouter;