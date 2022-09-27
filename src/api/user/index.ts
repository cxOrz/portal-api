import Router from '@koa/router';
import { inno_db } from '../../database';

const userRouter = new Router({ prefix: '/user' });

userRouter.get('/:uid', async ctx => {
  try {
    const result = await inno_db.collection('users').findOne({
      uid: ctx.params.uid
    });
    ctx.body = result;
  } catch (e) {
    console.error(e);
  }
})

export default userRouter;