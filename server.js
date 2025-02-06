const app = require('./routers/app.js')

const server = app.listen(5000, () => {
    console.log('Server running at http://localhost:5000');
});