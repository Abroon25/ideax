let resendClient = null;

const getResend = () => {
  if (!resendClient && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.log('Email skipped (no RESEND_API_KEY):', subject);
      return true;
    }
    await resend.emails.send({
      from: 'IdeaX <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

const sendWelcomeEmail = (user) => sendEmail({
  to: user.email,
  subject: 'Welcome to IdeaX!',
  html: '<h1>Welcome to IdeaX, ' + user.displayName + '!</h1><p>Start sharing your ideas.</p>',
});

const sendTierUpgradeEmail = (user, tier) => sendEmail({
  to: user.email,
  subject: 'Upgraded to ' + tier + '!',
  html: '<h1>Tier Upgraded!</h1><p>You are now on the ' + tier + ' tier.</p>',
});

module.exports = { sendEmail, sendWelcomeEmail, sendTierUpgradeEmail };
