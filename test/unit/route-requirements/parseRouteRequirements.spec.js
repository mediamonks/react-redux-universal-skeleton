/* global describe, it */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import parseRouteRequirements from '../../../src/common/util/route-requirements/parseRouteRequirements';
import RouteRequirement from '../../../src/common/util/route-requirements/RouteRequirement';

describe('parseRouteRequirements()', () => {
  describe('with an empty routes array', () => {
    it('should return an empty array', () => {
      expect(parseRouteRequirements([])).to.have.lengthOf(0);
    });
  });
  describe('with routes without a "requirements" prop', () => {
    it('should return an empty array', () => {
      const routes = [{}, {}];
      expect(parseRouteRequirements(routes)).to.have.lengthOf(0);
    });
  });
  describe('with multiple routes with requirements', () => {
    it('should only use the last requirement', () => {
      const TestRequirement1 = new RouteRequirement('test1', [], () => {}, () => {});
      const TestRequirement2 = new RouteRequirement('test2', [], () => {}, () => {});
      const routes = [{ requirements: [TestRequirement1] }, { requirements: [TestRequirement2] }];
      expect(parseRouteRequirements(routes)[0]).to.equal(TestRequirement2);
    });
  });
  describe('with multiple routes with a "requirements" prop, the last an empty array', () => {
    it('should return an empty array', () => {
      const TestRequirement = new RouteRequirement('test', [], () => {}, () => {});
      const routes = [{ requirements: [TestRequirement] }, { requirements: [] }];
      expect(parseRouteRequirements(routes)).to.have.lengthOf(0);
    });
  });
});
