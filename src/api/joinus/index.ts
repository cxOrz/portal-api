import Router from '@koa/router';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';

const joinusRouter = new Router({ prefix: '/joinus' });

joinusRouter.get('/status', JWTAuth(2), async ctx => {
  try {
    const result = await inno_db.collection('joinApplications').findOne({
      openid: ctx.custom.uid
    });
    if (result) {
      ctx.body = { code: 200, data: result.status };
    }
    else ctx.body = { code: 404, data: '无数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

joinusRouter.post('/create', JWTAuth(2), async ctx => {
  const body = ctx.request.body as any;
  try {
    await inno_db.collection('joinApplications').insertOne({
      openid: ctx.custom.uid,
      name: body?.name,
      gendor: body?.gendor,
      phone: body?.phone,
      academy: body?.academy,
      major: body?.major,
      idNo: body?.idNo,
      honors: body?.honors,
      self_eval: body?.self_eval,
      comments: body?.comments,
      status: 0
    });
    ctx.body = { code: 200, data: 'success' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

export default joinusRouter;