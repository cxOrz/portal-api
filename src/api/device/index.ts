import Router from '@koa/router';
import { ObjectId } from 'mongodb';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';

const deviceRouter = new Router({ prefix: '/device' });

deviceRouter.post('/', JWTAuth(1), async ctx => {
  const body = ctx.request.body as any;
  try {
    await inno_db.collection('devices').insertOne({
      openid: ctx.custom.uid,
      name: body.name,
      type: body.type,
      price: body.price,
      note: body.note,
      date: new Date()
    });
    ctx.body = { code: 200, data: 'success' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

deviceRouter.get('/', JWTAuth(1), async ctx => {
  try {
    let pageSize = 0, page = 0;
    let payload: any = {};
    if (Number(ctx.request.query.pageSize) > 0) {
      pageSize = Number(ctx.request.query.pageSize);
    }
    if (Number(ctx.request.query.page) > 0) {
      page = Number(ctx.request.query.page);
    }
    if (ctx.request.query.type) {
      payload.type = ctx.request.query.type;
    }
    const cursor = inno_db.collection('devices').find(payload, {
      limit: pageSize,
      skip: page * pageSize
    });
    const total = await inno_db.collection('devices').countDocuments(payload);
    const data = await cursor.toArray();
    ctx.body = { code: 200, data, total };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

deviceRouter.put('/', JWTAuth(1), async ctx => {
  const placeHolder: any = {};
  const body = ctx.request.body as any;
  if (body.name) placeHolder.name = body.name;
  if (body.type) placeHolder.type = body.type;
  if (Number.isInteger(body.price)) placeHolder.price = body.price;
  if (body.note) placeHolder.note = body.note;
  try {
    const result = await inno_db.collection('devices').updateOne({
      _id: new ObjectId(body._id)
    }, {
      $set: placeHolder
    });
    if (result.matchedCount === 1) {
      ctx.body = { code: 200, data: 'success' };
    } else ctx.body = { code: 404, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

deviceRouter.delete('/:id', JWTAuth(1), async ctx => {
  try {
    const result = await inno_db.collection('devices').deleteOne({
      _id: new ObjectId(ctx.params.id)
    });
    if (result.deletedCount === 1) ctx.body = { code: 204, data: 'success' };
    else ctx.body = { code: 400, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

export default deviceRouter;