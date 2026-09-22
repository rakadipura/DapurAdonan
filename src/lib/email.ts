/** Simple email sender – placeholder implementation.
 *  In production you would configure SMTP and use a library like nodemailer.
 *  This stub logs the email contents to the console.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  console.log('Email send stub:', { to, subject, html });
}
