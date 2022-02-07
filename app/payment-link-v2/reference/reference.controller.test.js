'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const productFixtures = require('../../../test/fixtures/product.fixtures')
const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const Service = require('../../models/Service.class')
const responseSpy = sinon.spy()
const { NotFoundError } = require('../../errors')
const Product = require('../../models/Product.class')

const mockResponses = {
  response: responseSpy
}

let req, res

describe('Reference Page Controller', () => {
  const mockCookie = {
    getSessionVariable: sinon.stub(),
    setSessionVariable: sinon.stub()
  }

  const controller = proxyquire('./reference.controller', {
    '../../utils/response': mockResponses,
    '../../utils/cookie': mockCookie
  })

  const service = new Service(serviceFixtures.validServiceResponse().getPlain())

  beforeEach(() => {
    mockCookie.getSessionVariable.reset()
    mockCookie.setSessionVariable.reset()
    responseSpy.resetHistory()
  })

  describe('getPage', () => {
    describe('when product.reference_enabled=true', () => {
      const product = new Product(productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: null
      }).getPlain())

      it('when the reference is NOT in the session, then it should display the reference page ' +
        'and set the back link to the PRODUCT page', () => {
        mockCookie.getSessionVariable.withArgs(req, 'referenceNumber').returns(null)

        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')
      })

      it('when the reference is in the session, then it should display the reference page ' +
        'and set the back link to the CONFIRM page', () => {
        mockCookie.getSessionVariable.returns('refrence test value')

        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
        expect(pageData.referenceNumber).to.equal('refrence test value')
      })
    })

    describe('when there is already an reference in the product', () => {
      const product = new Product(productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: false,
        price: 1000
      }).getPlain())

      it('then it should display an 404 page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        const next = sinon.spy()
        controller.getPage(req, res, next)

        const expectedError = sinon.match.instanceOf(NotFoundError)
          .and(sinon.match.has('message', 'Attempted to access reference page with a product that auto-generates references.'))

        sinon.assert.calledWith(next, expectedError)
      })
    })
  })

  describe('postPage', () => {
    describe('when the product has no price', () => {
      const product = new Product(productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: null
      }).getPlain())

      it('when a valid reference is entered, it should save the reference to the session and ' +
        'redirect to the amount page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'valid reference'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockCookie.setSessionVariable, req, 'referenceNumber', 'valid reference')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/amount')
      })
  
      it('when an valid reference is entered and an AMOUNT is already saved to the session, it should  ' +
      'redirect to the CONFIRM page', () => {
        mockCookie.getSessionVariable.withArgs(req, 'amount').returns(1000)
  
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'valid reference'
          }
        }
  
        res = {
          redirect: sinon.spy()
        }
  
        controller.postPage(req, res)
  
        sinon.assert.calledWith(mockCookie.setSessionVariable, req, 'referenceNumber', 'valid reference')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })
  
      it('when reference is a potential card number, it should  ' +
      'redirect to the REFERENCE CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': '4242424242424242'
          }
        }
  
        res = {
          redirect: sinon.spy()
        }
  
        controller.postPage(req, res)
  
        sinon.assert.calledWith(mockCookie.setSessionVariable, req, 'referenceNumber', '4242424242424242')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/reference/confirm')
      })
  
      it('when reference is a potential card number and there is an amount in the session, it should  ' +
      'redirect to the REFERENCE CONFIRM page', () => {
        mockCookie.getSessionVariable.withArgs(req, 'amount').returns(1000)
  
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': '4242424242424242'
          }
        }
  
        res = {
          redirect: sinon.spy()
        }
  
        controller.postPage(req, res)
  
        sinon.assert.calledWith(mockCookie.setSessionVariable, req, 'referenceNumber', '4242424242424242')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/reference/confirm')
      })
  
      it('when an empty reference is entered, it should display an error message and the back link correctly', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': ''
          }
        }
  
        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.spy()
          }
        }
  
        controller.postPage(req, res)
  
        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')
  
        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')
  
        sinon.assert.calledWith(res.locals.__p, 'paymentLinksV2.fieldValidation.enterAReference')
      })
  
      it('when an invalid reference is entered and a reference is already saved to the session, it should display an error ' +
      'message and set the back link to the CONFIRM page', () => {
        mockCookie.getSessionVariable.returns('a valid refererence')
  
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'reference with invalid characters <>'
          }
        }
  
        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.spy()
          }
        }
  
        controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')

        sinon.assert.calledWith(res.locals.__p, 'paymentLinksV2.fieldValidation.referenceCantUseInvalidChars')
      })
    })

    describe('when the product has a price', () => {
      const product = new Product(productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: 1000
      }).getPlain())

      it('when a valid reference is entered, it should save the reference to the session and ' +
        'redirect to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'valid reference'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockCookie.setSessionVariable, req, 'referenceNumber', 'valid reference')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })
    })
  })
})