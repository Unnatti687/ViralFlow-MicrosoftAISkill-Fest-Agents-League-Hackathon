const cron = require('node-cron');
const {
  claimNextScheduledPost,
  getPublishingRowsWithContainer,
  startContainer,
  pollAndPublish,
} = require('./service');
const { refreshDueTokens } = require('./token');

let running = false;

async function tick() {
  if (running) return; // skip overlapping ticks
  running = true;
  try {
    let row;
    while ((row = await claimNextScheduledPost())) {
      await startContainer(row);
    }

    const polling = await getPublishingRowsWithContainer();
    for (const row of polling) {
      await pollAndPublish(row);
    }
  } catch (err) {
    console.error('[Publisher Worker] tick failed:', err.message);
  } finally {
    running = false;
  }
}

function start() {
  // Publish queue — every 1 minute
  cron.schedule('* * * * *', tick);

  // Token refresh — every 30 days (30-day buffer before 60-day expiry)
  cron.schedule('0 0 */30 * *', () => {
    refreshDueTokens().catch((err) => console.error('[Publisher Worker] token refresh failed:', err.message));
  });

  console.log('[Publisher Worker] started');
}

module.exports = { start, tick };
