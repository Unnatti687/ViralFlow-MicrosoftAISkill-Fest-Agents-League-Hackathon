require('dotenv').config();
const app = require('./app');
const publisherWorker = require('./features/publisher/worker');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  publisherWorker.start();
});
