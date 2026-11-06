// One-off: 28-day post and video counts per Page (encrypted output, like insights-probe).
process.env.DEMO_INSIGHTS = '1';
process.env.INSIGHTS_DAYS = '28';
require('../autopost.js');
