require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const { sendMail } = require('../utils/mailer');

sendMail({
  to: 'head@cmes.edu',
  subject: 'CMES — Password Reset Request (test)',
  html: '<h2 style="color:#5D7052">Reset your password</h2><p>Click the link below:</p><p><a href="http://localhost:5173/reset-password/demo-token">Reset Password</a></p>',
})
  .then((info) => {
    console.log('\n✅ Email sent successfully!\n');
    console.log('👉 Open this URL in your browser to view the email:');
    console.log('\n   ' + nodemailer.getTestMessageUrl(info) + '\n');
  })
  .catch((err) => {
    console.error('❌ Failed:', err.message);
  });
