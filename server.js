require('dotenv').config();

const secreto = process.env.JWT_SECRET || '';
if (secreto.length < 32) {
  console.error('JWT_SECRET falta o tiene menos de 32 caracteres. Revise su archivo .env');
  process.exit(1);
}

const app = require('./app');

const puerto = Number(process.env.PORT) || 3000;
app.listen(puerto, () => {
  console.log(`API de SIGLA escuchando en http://localhost:${puerto}`);
});
