import Router from '@koa/router';
import { inno_db } from '../../database';
import { JWTAuth } from '../../middleware/auth';
import { fork, ChildProcess } from 'child_process';
import { ObjectId } from 'mongodb';

let timerProcess: ChildProcess | null;

const attendanceRouter = new Router({ prefix: '/attendance' });

// 获取考勤状态数据
attendanceRouter.get('/', JWTAuth(2), async ctx => {
  try {
    const result = await inno_db.collection('attendance').aggregate([
      {
        $project: {
          total: { $trunc: ["$total", 1] },
          today: { $trunc: ["$today", 1] },
          realname: 1,
          on: 1
        }
      },
      {
        $sort: {
          today: -1
        }
      }
    ]).toArray();
    if (result) {
      const mode = timerProcess ? 'on' : 'off';
      ctx.body = { code: 200, data: result, modify_attendance: ctx.custom.modify_attendance, mode };
    }
    else ctx.body = { code: 404, data: '无数据' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

// 生成动态码，有效期十分钟
attendanceRouter.get('/code', JWTAuth(1), async ctx => {
  try {
    let vcode = '';
    for (let i = 0; i < 6; i++) {
      vcode += String(Math.random()).at(2);
    }
    await inno_db.collection('verificationCode').insertOne({
      openid: ctx.custom.uid,
      ctime: new Date(),
      data: vcode
    });
    ctx.body = { code: 200, data: vcode };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

// 验证动态码或身份，启用读写模式，计时器循环累计时间；
// 标记对应身份为可修改考勤数据，例如 modify_attendance = true;
// 最后删除动态码
attendanceRouter.put('/mode/:mode', JWTAuth(2), async ctx => {
  const mode = ctx.params.mode;
  const code = ctx.request.body.code;

  try {
    if (mode === 'on') {
      if (ctx.custom.role <= 1) {
        // 启动
        timerProcess = fork(process.argv[1].endsWith('ts') ? 'timer.ts' : 'timer.js', {
          cwd: __dirname,
          detached: false
        });
        ctx.body = { code: 200, data: 'success' };
        return;
      } else if (code) {
        // 验证并删除动态码
        const result = await inno_db.collection('verificationCode').findOneAndDelete({ data: code });
        if (result.value) {
          // 添加 modify_attendance 标记
          await inno_db.collection('users').updateOne({ uid: ctx.custom.uid }, {
            $set: {
              modify_attendance: true
            }
          });
          // 启动
          timerProcess = fork(process.argv[1].endsWith('ts') ? 'timer.ts' : 'timer.js', {
            cwd: __dirname,
            detached: false
          });
          ctx.body = { code: 200, data: 'success' };
          return;
        }
      }
    }

    if (mode === 'off') {
      if (ctx.custom.role <= 1 || ctx.custom.modify_attendance) {
        // 关闭，并设置 modify_attendance = false
        await inno_db.collection('users').updateOne({ uid: ctx.custom.uid }, {
          $set: {
            modify_attendance: false
          }
        });
        // 终止
        if (timerProcess?.kill('SIGINT')) {
          timerProcess = null;
          ctx.body = { code: 200, data: 'success' };
          return;
        }
      }
    }
    ctx.body = { code: 403, data: '未授权的操作' };
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

// 签到 & 签退，设置on=true，需验证身份，是管理员或拥有 modify_attendance 标记
attendanceRouter.put('/toggle', JWTAuth(2), async ctx => {
  const body: any = ctx.request.body;
  try {
    if (ctx.custom.modify_attendance || ctx.custom.role <= 1) {
      if (body.state === 'on') {
        const result = await inno_db.collection('attendance').updateOne({
          _id: new ObjectId(body._id)
        }, {
          $set: {
            on: true
          }
        });
        if (result.matchedCount === 1) {
          ctx.body = { code: 200, data: 'on:true' };
          return;
        }
      }
      if (body.state === 'off') {
        const result = await inno_db.collection('attendance').updateOne({
          _id: new ObjectId(body._id)
        }, {
          $set: {
            on: false
          }
        });
        if (result.matchedCount === 1) {
          ctx.body = { code: 200, data: 'on:false' };
          return;
        }
      }
      ctx.body = { code: 501, data: '未实现的操作' };
    } else {
      ctx.body = { code: 403, data: '无权操作' };
    }
  } catch (e) {
    console.error(e);
    ctx.body = { code: 500, data: '服务器内部错误' };
  }
});

process.on('SIGINT', () => {
  if (timerProcess) timerProcess.kill('SIGINT');
});

export default attendanceRouter;