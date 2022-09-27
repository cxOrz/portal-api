import Router from '@koa/router';
import userRouter from './user';

const apiRouter = new Router({ prefix: '/api' });

export default apiRouter.use(userRouter.routes());