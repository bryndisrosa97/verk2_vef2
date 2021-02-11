import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { query } from './db.js'
import { router as r } from './registration.js';
import { formatclock, formatAnonymous } from './formatter.js'


dotenv.config();



const {
  PORT: port = 3000,
} = process.env;

const app = express();
const viewsPath = new URL('./views', import.meta.url).pathname;

app.set('./views', viewsPath);
app.set('view engine', 'ejs');
app.locals.formatclock = formatclock;
app.locals.formatAnonymous = formatAnonymous;



app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('src'));

app.use('/', r);

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find(i => i.param === field));
}

app.locals.isInvalid = isInvalid;


function notFoundHandler(req, res, next) {
  res.status(404);
  return res.send('404 villa! - Síða fannst ekki');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  return res.status(500).send('500 villa!');
}

app.use(notFoundHandler);
app.use(errorHandler);

// TODO setja upp rest af virkni!


// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
