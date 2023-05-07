import Router from '@koa/router';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';

const personnelRouter = new Router({ prefix: '/personnel' });

personnelRouter.get('/', JWTAuth(0), async ctx => {
  try {
    let pageSize = 0, page = 0;
    let payload: any = {};
    if (Number(ctx.request.query.pageSize) > 0) {
      pageSize = Number(ctx.request.query.pageSize);
    }
    if (Number(ctx.request.query.page) > 0) {
      page = Number(ctx.request.query.page);
    }
    // 根据权限查询
    if (ctx.request.query.role) {
      if ([0, 1, 2, 3].includes(Number(ctx.request.query.role))) {
        payload.role = ctx.request.query.role;
      }
    }
    // 快速查询，会覆盖
    if (ctx.request.query.search) {
      payload = {
        $or: [
          { email: { $regex: ctx.request.query.search } },
          { idNo: { $regex: ctx.request.query.search } },
          { realname: { $regex: ctx.request.query.search } },
          { gendor: { $regex: ctx.request.query.search } },
          { phone: { $regex: ctx.request.query.search } },
          { major: { $regex: ctx.request.query.search } },
          { academy: { $regex: ctx.request.query.search } },
          { field: { $regex: ctx.request.query.search } },
          { role: { $regex: ctx.request.query.search } }
        ]
      };
    }
    const cursor = inno_db.collection('users').find(payload, {
      limit: pageSize,
      skip: page * pageSize,
      projection: {
        _id: 0,
        password: 0,
        openid: 0,
        avatarUrl: 0
      }
    });
    const total = await inno_db.collection('users').countDocuments(payload);
    const data = await cursor.toArray();
    ctx.body = { code: 200, data, total };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

personnelRouter.put('/', JWTAuth(0), async ctx => {
  const placeHolder: any = {};
  const body = ctx.request.body as any;
  if (body.idNo) placeHolder.idNo = body.idNo;
  if (body.realname) placeHolder.realname = body.realname;
  if (body.gendor) placeHolder.gendor = body.gendor;
  if (body.phone) placeHolder.phone = body.phone;
  if (body.major) placeHolder.major = body.major;
  if (body.academy) placeHolder.academy = body.academy;
  if (body.field) placeHolder.field = body.field;
  if (body.role) placeHolder.role = body.role;
  try {
    const result = await inno_db.collection('users').updateOne({
      uid: body.uid
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

personnelRouter.delete('/:uid', JWTAuth(0), async ctx => {
  try {
    const result = await inno_db.collection('users').deleteOne({
      uid: ctx.params.uid
    });
    if (result.deletedCount === 1) ctx.body = { code: 204, data: 'success' };
    else ctx.body = { code: 400, data: '未找到该条数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

export default personnelRouter;