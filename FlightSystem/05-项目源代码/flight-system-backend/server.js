require('dotenv').config();
const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      await db.sequelize.sync();
    }
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server started on port: ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
}

start();
