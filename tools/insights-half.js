// Half-month / monthly page report: every post and video of the last INSIGHTS_DAYS days (encrypted output, like insights-28).
process.env.DEMO_INSIGHTS = '1';
process.env.INSIGHTS_DAYS = process.env.INSIGHTS_DAYS || '17';
require('../autopost.js');
