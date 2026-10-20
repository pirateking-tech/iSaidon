import express from 'express';
import path from 'path';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Secure Configuration Provider Link Engine
app.get('/api/config', (req, res) => {
    res.json({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY
    });
});

app.listen(PORT, () => {
    console.log(`Server streaming active at http://localhost:${PORT}`);
});

