import express from 'express';
import xss from 'xss';
import pkg from 'express-validator';
import { select, insert } from './db.js';

const {
  check,
  validationResult,
  sanitize,
} = pkg;
export const router = express.Router();

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }
    const field = req.body[fieldName];
    if (field) {
      req.body[fieldName] = xss(field);
    }
    next();
  };
}

const validations = [

  check('name').isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('name')
    .isLength({
      max: 128,
    })
    .withMessage('Nafnið má ekki vera yfir 128 stafir'),

  check('nationalId')
    .isLength({
      min: 1,
    })
    .withMessage('Kennitala má ekki vera tóm'),

  check('nationalId')
    .matches(/^[0-9]{6}-?[0-9]{4}$/)
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),

  check('comment')
    .isLength({
      max: 400,
    })
    .withMessage('Athugasemd má að hámarki vera 400 stafir'),
];

const sanitazions = [
  sanitize('name').trim().escape(),
  sanitizeXss('name'),

  sanitizeXss('nationalId'),
  sanitize('nationalId')
    .trim().blacklist(' ').escape()
    .toInt(),

  sanitizeXss('comment'),
  sanitize('comment').trim().escape(),
];

/**
 * Route handler fyrir form .
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir umsókn
 */
async function formsign(req, res) {
  const list = await select();
  const data = {
    title: 'Undirskriftarlisti',
    name: '',
    nationalId: '',
    comment: '',
    anonymous: '',
    date: '',
    errortitle: '',
    errors: [],
    list,
  };
  res.render('form', data);
}

/**
 * Route handler sem athugar stöðu á umsókn og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */

async function showErrors(req, res, next) {
  const list = await select();
  const {
    body: {
      title = 'Undirskriftarlisti',
      name = '',
      nationalId = '',
      comment = '',
      anonymous = false,
    } = {},
  } = req;

  const data = {
    title,
    name,
    nationalId,
    comment,
    anonymous,
    list,
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;
    data.errortitle = 'Villur við undirskrift:';
    return res.render('form', data);
  }
  return next();
}

async function formPost(req, res) {
  const {
    body: {
      name = '',
      nationalId = '',
      comment = '',
      anonymous = false,
    } = {},
  } = req;

  const data = {
    name,
    nationalId,
    comment,
    anonymous,
  };
  const checkresults = await insert(data);
  if (!checkresults) {
    return res.render('error');
  }
  return res.redirect('/');
}

router.get('/', catchErrors(formsign));
router.post(
  '/',
  validations,
  showErrors,
  sanitazions,
  catchErrors(formPost),
);
