import Router from '@koa/router';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';
import { ObjectId } from 'mongodb';

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

joinusRouter.post('/', JWTAuth(2), async ctx => {
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
      exam_score: 0,
      interview_score: 0,
      note: '',
      date: new Date(),
      status: 0
    });
    ctx.body = { code: 200, data: 'success' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

joinusRouter.get('/', JWTAuth(1), async ctx => {
  try {
    let pageSize = 0, page = 0;
    if (Number(ctx.request.query.pageSize) > 0) {
      pageSize = Number(ctx.request.query.pageSize);
    }
    if (Number(ctx.request.query.page) > 0) {
      page = Number(ctx.request.query.page);
    }
    const cursor = inno_db.collection('joinApplications').find({}, {
      limit: pageSize,
      skip: page * pageSize
    });
    const total = await inno_db.collection('joinApplications').countDocuments();
    const data = await cursor.toArray();
    ctx.body = { code: 200, data, total };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

joinusRouter.put('/', JWTAuth(1), async ctx => {
  const placeHolder: any = {};
  const body = ctx.request.body as any;
  if (body?.exam_score) placeHolder.exam_score = body?.exam_score;
  if (body?.interview_score) placeHolder.interview_score = body?.interview_score;
  if (body?.status) placeHolder.status = body?.status;
  if (body?.note) placeHolder.note = body?.note;
  try {
    const result = await inno_db.collection('joinApplications').updateOne({
      _id: new ObjectId(body?._id)
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

export default joinusRouter;