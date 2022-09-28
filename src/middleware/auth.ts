import jwt from "jsonwebtoken";
import { JWTSecret } from "../config/global.config";

// 身份认证中间件
export async function JWTAuth(ctx: any, next: any) {
  try {
    const token = ctx.header.authorization;
    if (token) {
      jwt.verify(token, JWTSecret);
      await next();
    } else {
      ctx.body = { code: 401, data: '无权操作' };
    }
  } catch (err: any) {
    switch (err.name) {
      case 'TokenExpiredError': ctx.body = { code: 401, data: '身份过期，请重新登录' }; break;
      case 'JsonWebTokenError': ctx.body = { code: 401, data: '你的行为已被记录' };
    }
  }
}