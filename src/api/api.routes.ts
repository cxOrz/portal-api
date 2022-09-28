import Router from '@koa/router';
import blogRouter from './blog';
import userRouter from './user';

const apiRouter = new Router({ prefix: '/api' });

export default apiRouter.use(userRouter.routes(), blogRouter.routes());