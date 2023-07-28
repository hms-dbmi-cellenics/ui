import {
  ssrGetDeploymentInfo, DomainName, Environment, privacyPolicyIsNotAccepted,
} from 'utils/deploymentInfo';

describe('deploymentInfo', () => {
  describe('privacyPolicyIsNotAccepted', () => {
    it('Returns false for users that accepted privacy policy', () => {
      const user = { attributes: { 'custom:agreed_terms': 'true' } };
      const domainName = DomainName.BIOMAGE;

      expect(privacyPolicyIsNotAccepted(user, domainName)).toEqual(false);
    });

    it('Returns false for users that arent in Biomage deployment', () => {
      const user = { attributes: {} };
      const domainName = 'Someotherdomain.com';

      expect(privacyPolicyIsNotAccepted(user, domainName)).toEqual(false);
    });

    it('Returns true for users that still need to accept terms in Biomage', () => {
      const user = { attributes: {} };
      const domainName = DomainName.BIOMAGE;

      expect(privacyPolicyIsNotAccepted(user, domainName)).toEqual(true);
    });

    it('Returns true for users that still need to accept terms in Biomage staging', () => {
      const user = { attributes: {} };
      const domainName = DomainName.BIOMAGE_STAGING;

      expect(privacyPolicyIsNotAccepted(user, domainName)).toEqual(true);
    });
  });
  describe('ssrGetDeploymentInfo', () => {
    let originalEnv;

    // We are going to mess with the process env so save the original to avoid leak into other tests
    beforeAll(() => {
      originalEnv = { ...process.env };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('Throws if not called in server side', () => {
      process.env = undefined;

      expect(ssrGetDeploymentInfo).toThrowError(
        'ssrGetDeploymentInfo must be called on the server side. Refer to `store.networkResources.environment` for the actual environment.',
      );
    });

    it('Works with test node env', () => {
      process.env = { NODE_ENV: 'test' };

      expect(ssrGetDeploymentInfo()).toEqual({
        environment: Environment.DEVELOPMENT,
        domainName: DomainName.HMS,
      });
    });

    it('Works with prod k8s env in hms domain', () => {
      process.env = {
        NODE_ENV: Environment.PRODUCTION,
        K8S_ENV: Environment.PRODUCTION,
        DOMAIN_NAME: DomainName.HMS,
      };

      expect(ssrGetDeploymentInfo()).toEqual({
        environment: Environment.PRODUCTION,
        domainName: DomainName.HMS,
      });
    });

    it('Works with staging k8s env in hms staging domain', () => {
      process.env = {
        NODE_ENV: Environment.PRODUCTION,
        K8S_ENV: Environment.STAGING,
        DOMAIN_NAME: DomainName.HMS_STAGING,
      };

      expect(ssrGetDeploymentInfo()).toEqual({
        environment: Environment.STAGING,
        domainName: DomainName.HMS_STAGING,
      });
    });

    it('Works in development for hms', () => {
      process.env = { NODE_ENV: Environment.DEVELOPMENT, DEV_ACCOUNT: 'HMS' };

      expect(ssrGetDeploymentInfo()).toEqual({
        environment: Environment.DEVELOPMENT,
        domainName: DomainName.HMS,
      });
    });

    it('Works in development for biomage', () => {
      process.env = { NODE_ENV: Environment.DEVELOPMENT, DEV_ACCOUNT: 'BIOMAGE' };

      expect(ssrGetDeploymentInfo()).toEqual({
        environment: Environment.DEVELOPMENT,
        domainName: DomainName.BIOMAGE,
      });
    });
  });
});
