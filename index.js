require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', orderRoutes);

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});