import Router from '@koa/router';
import { ObjectId } from 'mongodb';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';

const orderRouter = new Router({ prefix: '/order' });

orderRouter.post('/create', JWTAuth(2), async ctx => {
  try {
    const date = new Date();
    const estimateCount = await inno_db.collection('orders').estimatedDocumentCount();
    const admin_uids = await inno_db.collection('users').find({ role: 0 }, { projection: { uid: 1 } }).toArray();
    const to_uid = admin_uids.length === 0 ? 0 : admin_uids[Math.floor(Math.random() * admin_uids.length)].uid;
    await inno_db.collection('orders').insertOne({
      openid: ctx.custom.uid,
      count: estimateCount,
      last_time: date,
      message: [
        {
          data: ctx.request.body?.message,
          direction: 0
        }
      ],
      open_date: date,
      status: "尚未受理",
      title: ctx.request.body?.title,
      to_uid: to_uid
    });
    ctx.body = { code: 201, data: 'success' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});


orderRouter.get('/', JWTAuth(2), async ctx => {
  try {
    if (ctx.query.id) {
      const result = await inno_db.collection('orders').findOne({ _id: new ObjectId(ctx.query.id as string) });
      if (result) ctx.body = { code: 200, data: result };
      else ctx.body = { code: 404, data: '未查询到数据' };
      return;
    }
    if (ctx.query.opened) {
      const cursor = inno_db.collection('orders').find({ openid: ctx.custom.uid });
      ctx.body = { code: 200, data: await cursor.toArray() };
      return;
    }
    if (ctx.query.to_uid) {
      const cursor = inno_db.collection('orders').find({ to_uid: ctx.query.to_uid });
      ctx.body = { code: 200, data: await cursor.toArray() };
      return;
    }
    const cursor = inno_db.collection('orders').find({});
    ctx.body = { code: 200, data: await cursor.toArray() };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

orderRouter.post('/sendmsg', JWTAuth(2), async ctx => {
  try {
    const result = await inno_db.collection('orders').updateOne({
      _id: new ObjectId(ctx.request.body?.id)
    }, {
      $push: {
        message: {
          data: ctx.request.body?.message,
          direction: ctx.custom.role < 2 ? 1 : 0
        }
      },
      last_time: new Date()
    });
    if (result.matchedCount === 1) {
      ctx.body = { code: 201, data: 'success' };
    } else ctx.body = { code: 404, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

orderRouter.post('/update', JWTAuth(1), async ctx => {
  try {
    const result = await inno_db.collection('orders').updateOne({
      _id: new ObjectId(ctx.request.body.id)
    }, {
      status: ctx.request.body?.status
    });
    if (result.matchedCount === 1) {
      ctx.body = { code: 201, data: 'success' };
    } else ctx.body = { code: 404, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

orderRouter.delete('/:id', JWTAuth(1), async ctx => {
  try {
    const result = await inno_db.collection('orders').deleteOne({
      _id: new ObjectId(ctx.params.id)
    });
    if (result.deletedCount === 1) ctx.body = { code: 204, data: 'success' };
    else ctx.body = { code: 400, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

export default orderRouter;