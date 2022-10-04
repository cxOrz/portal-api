import Router from '@koa/router';
import busboy from 'busboy';
import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { JWTSecret, nginxPath, serverUrl } from '../../config/global.config';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';
import { sendEmail } from '../../utils/mail';

const userRouter = new Router({ prefix: '/user' });

// 需要权限认证，才可调用
userRouter.get('/', JWTAuth(2), async ctx => {
  try {
    const user = await inno_db.collection('users').findOne({
      uid: ctx.custom.uid
    });
    const { password, ...result } = user as any;
    result.avatarUrl = serverUrl + '/avatar/' + result.avatarUrl;
    ctx.body = { code: 200, data: result };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
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
    ctx.body = { code: 500, data: '服务器内部错误' };
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
    await inno_db.collection('users').insertOne({
      uid: uuid,
      openid: '0',
      phone: '',
      nickName: '萌新',
      avatarUrl: 'undefined.png',
      email: ctx.request.body?.email,
      role: 2,
      password: ctx.request.body?.password
    });
    // 异步删除验证码
    inno_db.collection('verificationCode').deleteOne({
      _id: vcode_exists?._id
    });
    ctx.body = { code: 201, data: 'success' };
  } catch (e) {
    ctx.body = { code: 500, data: '服务器内部错误' };
    console.error(e);
  }
})

userRouter.post('/update', JWTAuth(2), async ctx => {
  const { phone, nickName, avatarUrl, password } = ctx.request.body as any;
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
      uid: ctx.custom.uid
    }, {
      $set: placeHolder
    });
    if (result.matchedCount === 1) {
      ctx.body = { code: 201, data: 'success' };
    } else {
      ctx.body = { code: 400, data: '无对应数据' };
    }
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

userRouter.post('/upload', JWTAuth(2), async ctx => {
  const bb = busboy({ headers: ctx.req.headers });
  const fields = new Map<string, string>();
  const fileData: any[] = [];
  let fileName = crypto.randomBytes(24).toString('hex');
  try {
    // 解析 multipart/form-data 内容
    await new Promise<void>((resolve) => {
      bb.on('field', (name, val, info) => {
        fields.set(name, val);
      });
      bb.on('file', (name, file, info) => {
        fileName = `${fileName}.${info.filename.split('.').at(-1)}`;
        file.on('data', (chunk) => {
          fileData.push(chunk);
        });
      });
      bb.on('close', () => {
        resolve();
      });
      ctx.req.pipe(bb);
    });
    // 0说明上传的文件是头像，放到 avatar 文件夹
    if (fields.get('type') === '0') {
      const filepath = path.join(nginxPath, './avatar/', fileName);
      const fileDir = path.dirname(filepath);
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFile(filepath, Buffer.concat(fileData), () => { });
      ctx.body = { code: 201, data: `${serverUrl}/avatar/${fileName}` };
      await inno_db.collection('users').findOneAndUpdate({
        uid: ctx.custom.uid
      }, {
        $set: { avatarUrl: fileName }
      }).then((res) => {
        // 如果是替换头像，则删除旧的
        if (res.value?.avatarUrl && res.value?.avatarUrl !== 'undefined.png') {
          fs.unlink(path.join(fileDir, res.value.avatarUrl), () => { });
        }
      });
      inno_db.collection('blogs').updateMany({ openid: ctx.custom.uid }, {
        $set: {
          avatarUrl: fileName
        }
      });
    } else {
      ctx.body = { code: 400, data: '请指定上传类型' };
    }
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

userRouter.post('/login', async ctx => {
  try {
    const user = await inno_db.collection('users').findOne({
      email: ctx.request.body?.email
    }, { projection: { _id: 0 } });
    if (user?.password !== undefined && (user.password === ctx.request.body?.password)) {
      // token 有效期7天=604800秒
      const token = jwt.sign({
        uid: user.uid
      }, JWTSecret, { expiresIn: '7d' });
      const { password, ...data } = user;
      data.token = token;
      data.avatarUrl = serverUrl + '/avatar/' + data.avatarUrl;
      ctx.body = { code: 200, data: data };
      return;
    }
    ctx.body = { code: 400, data: '登录失败' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

export default userRouter;