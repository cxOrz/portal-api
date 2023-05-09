import { inno_db } from "../../database";

const TIMEOUT = 1000 * 60 * 6; // 6 分钟，0.1 小时

const timer = setInterval(async () => {
  await inno_db.collection('attendance').updateMany({ on: true }, {
    $inc: {
      today: 0.1,
      total: 0.1
    }
  });
}, TIMEOUT);

process.addListener('SIGINT', () => {
  clearInterval(timer);
  process.exit(0);
});