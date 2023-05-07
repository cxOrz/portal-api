import Router from '@koa/router';
import blogRouter from './blog';
import orderRouter from './order';
import userRouter from './user';
import joinusRouter from './joinus';
import deviceRouter from './device';
import personnelRouter from './personnel';

const apiRouter = new Router({ prefix: '/api' });

export default apiRouter.use(
  userRouter.routes(),
  blogRouter.routes(),
  orderRouter.routes(),
  joinusRouter.routes(),
  deviceRouter.routes(),
  personnelRouter.routes()
);