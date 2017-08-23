/* global describe, it */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { getLinkPropsFromUrl } from '../../src/common/util/urlUtils';

describe('getLinkPropsFromUrl()', () => {
  describe('with a relative url', () => {
    it('should return "to" as prop', () => {
      expect(getLinkPropsFromUrl('/')).to.have.property('to');
      expect(getLinkPropsFromUrl('/Login')).to.have.property('to');
      expect(getLinkPropsFromUrl('www.example.com')).to.have.property('to');
    });
  });

  describe('with an absolute url', () => {
    it('should return "href" as prop', () => {
      expect(getLinkPropsFromUrl('http://www.example.com')).to.have.property('href');
      expect(getLinkPropsFromUrl('https://www.example.com')).to.have.property('href');
      expect(getLinkPropsFromUrl('//www.example.com')).to.have.property('href');
    });
  });
});
