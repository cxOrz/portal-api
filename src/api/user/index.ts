import Router from '@koa/router';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWTSecret } from '../../config/global.config';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';
import { sendEmail } from '../../utils/mail';

const userRouter = new Router({ prefix: '/user' });

// 需要权限认证，才可调用
userRouter.get('/:uid', JWTAuth(2), async ctx => {
  try {
    const user = await inno_db.collection('users').findOne({
      uid: ctx.params.uid
    });
    const { password, ...result } = user as any;
    ctx.body = result;
  } catch (e) {
    console.error(e);
  }
});

userRouter.get('/verification/:email', async ctx => {
  try {
    const email = decodeURIComponent(ctx.params.email);
    // 检查邮箱是否被注册过
    const email_exists = await inno_db.collection('users').findOne({
      email: email
    });
    if (email_exists) {
      ctx.body = { code: 400, data: '该邮箱已被使用' };
      return;
    }
    // 检查此邮箱是否有未过期的验证码，有则直接用，否则就生成验证码
    let vcode: string;
    const exists = await inno_db.collection('verificationCode').findOne({
      email: email
    });
    if (exists) {
      vcode = exists.data;
    } else {
      vcode = String(Math.floor(Math.random() * 1000000));
      await inno_db.collection('verificationCode').insertOne({
        ctime: new Date(),
        data: vcode,
        email: email
      });
    }
    sendEmail({
      subject: '注册验证码', text: `欢迎使用软创实验室门户，您的验证码为 ${vcode} ，有效期10分钟。`,
      to: email
    });
    ctx.body = { code: 201, data: 'success' };
  } catch (e) {
    ctx.body = { code: 400, data: 'fail' };
    console.error(e);
  }
});

userRouter.post('/create', async ctx => {
  try {
    let uuid = '';
    let uuid_exists: any = true
    // 创建唯一UID
    while (uuid_exists !== null) {
      uuid = crypto.randomUUID();
      uuid_exists = await inno_db.collection('users').findOne({
        uid: uuid
      });
    }
    // 验证邮箱
    const vcode_exists = await inno_db.collection('verificationCode').findOne({
      data: ctx.request.body?.code
    });
    if (vcode_exists?.email !== ctx.request.body?.email) {
      ctx.body = { code: 400, data: '邮箱验证失败' };
      return;
    }
    // 创建用户
    const result = await inno_db.collection('users').insertOne({
      uid: uuid,
      openid: '0',
      phone: '',
      nickName: '萌新',
      avatarUrl: '',
      email: ctx.request.body?.email,
      role: 2,
      password: ctx.request.body?.password
    });
    // 异步删除验证码
    inno_db.collection('verificationCode').deleteOne({
      _id: vcode_exists?._id
    });
    ctx.body = result;
  } catch (e) {
    console.error(e);
  }
})

userRouter.post('/update', JWTAuth(2), async ctx => {
  const { uid, phone, nickName, avatarUrl, password } = ctx.request.body as any;
  const placeHolder: any = {};
  if (phone) {
    placeHolder['phone'] = phone;
  }
  if (nickName) {
    placeHolder['nickName'] = nickName;
  }
  if (avatarUrl) {
    placeHolder['avatarUrl'] = avatarUrl;
  }
  if (password) {
    placeHolder['password'] = password;
  }
  // 选择性更新传来的字段
  try {
    const result = await inno_db.collection('users').updateOne({
      uid: uid
    }, {
      $set: placeHolder
    })
    ctx.body = result;
  } catch (e) {
    console.error(e);
  }
});

userRouter.post('/login', async ctx => {
  try {
    const user = await inno_db.collection('users').findOne({
      email: ctx.request.body?.email
    }, { projection: { uid: 1, password: 1 } });
    if (user?.password !== undefined && (user.password === ctx.request.body?.password)) {
      // token 有效期7天=604800秒
      const token = jwt.sign({
        uid: user.uid
      }, JWTSecret, { expiresIn: '7d' });
      ctx.body = { code: 201, token: token };
      return;
    }
    ctx.body = { code: 400, data: '登录失败' };
  } catch (e) {
    console.error(e);
  }
});

export default userRouter;