'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const paths = require('../../paths')
const { validateReference } = require('../../utils/validation/form-validations')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { setSessionVariable } = require('../../utils/cookie')
const getBackLinkUrl = require('./get-back-link-url')
const isAPotentialPan = require('./is-a-potential-pan')

const PAYMENT_REFERENCE = 'payment-reference'

function validateReferenceFormValue (reference, res) {
  const errors = {}
  const referenceValidationResult = validateReference(reference)
  if (!referenceValidationResult.valid) {
    errors[PAYMENT_REFERENCE] = res.locals.__p(referenceValidationResult.messageKey)
  }

  return errors
}

function getNextPageUrl (productPrice, sessionAmount, reference) {
  if (isAPotentialPan(reference)) {
    return paths.paymentLinksV2.referenceConfirm
  } else if (productPrice || sessionAmount) {
    return paths.paymentLinksV2.confirm
  } else {
    return paths.paymentLinksV2.amount
  }
}

module.exports = function postReferencePage (req, res, next) {
  const paymentReference = lodash.get(req.body, PAYMENT_REFERENCE, '')
  const errors = validateReferenceFormValue(paymentReference, res)

  const product = req.product

  const sessionRefererence = getSessionVariable(req, 'referenceNumber')
  const sessionAmount = getSessionVariable(req, 'amount')

  const backLinkHref = getBackLinkUrl(sessionRefererence, product)

  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    backLinkHref: backLinkHref
  }

  if (!lodash.isEmpty(errors)) {
    data.errors = errors
    data.reference = paymentReference

    return response(req, res, 'reference/reference', data)
  }

  setSessionVariable(req, 'referenceNumber', paymentReference)

  return res.redirect(replaceParamsInPath(getNextPageUrl(product.price, sessionAmount, paymentReference), product.externalId))
}