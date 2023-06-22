import {
  ssrGetDeploymentInfo, DomainName, Environment,
} from 'utils/deploymentInfo';

describe('deploymentInfo', () => {
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

    it('Works in development', () => {
      process.env = { NODE_ENV: Environment.DEVELOPMENT };

      expect(ssrGetDeploymentInfo()).toEqual({
        environment: Environment.DEVELOPMENT,
        domainName: DomainName.HMS,
      });
    });
  });
});
