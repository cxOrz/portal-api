import jwt from "jsonwebtoken";
import { JWTSecret } from "../config/global.config";
import { inno_db } from "../database";

// 身份认证中间件, 要求身份等级为level级，lv0>lv1>lv2
export function JWTAuth(level = 0) {
  return async function (ctx: any, next: any) {
    try {
      const token = ctx.request.header.authorization;
      if (token) {
        const payload: any = jwt.verify(token, JWTSecret);
        ctx.custom = {
          uid: payload.uid
        };
        const user = await inno_db.collection('users').findOne({
          uid: ctx.custom.uid
        }, {
          projection: {
            role: 1,
            avatarUrl: 1
          }
        });
        ctx.custom.role = user?.role;
        ctx.custom.avatarUrl = user?.avatarUrl;
        // 若用户身份符合等级限制，则进入下个中间件
        if (user?.role <= level) await next();
        else ctx.body = { code: 401, data: '权限等级不够' };
      } else {
        ctx.body = { code: 401, data: '无权操作' };
      }
    } catch (err: any) {
      console.log(err)
      switch (err.name) {
        case 'TokenExpiredError': ctx.body = { code: 401, data: '身份过期，请重新登录' }; break;
        case 'JsonWebTokenError': ctx.body = { code: 401, data: '你的行为已被记录' };
      }
    }
  }
}