import nodemailer from 'nodemailer';
import { mailConfig } from '../config/global.config';

interface MailData {
  subject: string;
  text: string;
  to: string;
}

export function sendEmail(data: MailData) {
  let transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.ssl,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    },
  });
  transporter.sendMail({
    from: `"Portal" <${mailConfig.user}>`,
    to: data.to,
    subject: data.subject,
    text: data.text
  }, () => { transporter.close() });
}