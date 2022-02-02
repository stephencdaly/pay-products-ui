'use strict'

const { expect } = require('chai')

const validations = require('./form-validations')

describe('Server side form validations', () => {
  describe('amount validation', () => {
    it('when valid amount entered, should return valid=true', () => {
      expect(validations.validateAmount('100').valid).to.be.true // eslint-disable-line
    })

    it('when no amount entered, should return valid=false and the correct error message key', () => {
      expect(validations.validateAmount('')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinksV2.fieldValidation.enterAnAmountInPounds'
      })
    })

    it('when an invalid string entered, should return valid=false and correct error message key', () => {
      expect(validations.validateAmount('Invalid amount')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinksV2.fieldValidation.enterAnAmountInTheCorrectFormat'
      })
    })

    it('when a number entered that is greater then the MAX amount, should return valid=false and correct error message key', () => {
      expect(validations.validateAmount('100000.01')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinksV2.fieldValidation.enterAnAmountUnderMaxAmount'
      })
    })
  })

  describe('reference validation', () => {
    it('when valid reference is entered, should return valid=true', () => {
      expect(validations.validateReference('test reference').valid).to.be.true // eslint-disable-line
    })

    it('when no amount entered, should return valid=false and the correct error message key', () => {
      expect(validations.validateReference('')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinksV2.fieldValidation.enterAReference'
      })
    })

    it('when a reference is too long, should return valid=false and correct error message key', () => {
      expect(validations.validateReference('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinksV2.fieldValidation.referenceMustBeLessThanOrEqual50Chars'
      })
    })

    it('when a reference is entered that is not Naxsi safe, should return valid=false and correct error message key', () => {
      expect(validations.validateAmount('>')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinksV2.fieldValidation.enterAnAmountInTheCorrectFormat'
      })
    })
  })
})
