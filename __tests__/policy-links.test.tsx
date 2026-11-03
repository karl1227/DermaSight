import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Alert, Linking } from 'react-native';
import { PolicyLink } from '../src/components/PolicyLink';
import { openPolicy } from '../src/services/policyLinks';
jest.mock('../src/config/policies', () => ({
  POLICY_BASE_URL: 'http://10.201.1.216:3001/',
  POLICY_PAGE_PATHS: {
    about: '/index.html',
    privacy: '/privacy.html',
    'medical-disclaimer': '/medical-disclaimer.html',
  },
}));

afterEach(() => jest.restoreAllMocks());
test.each(['privacy', 'medical-disclaimer', 'about'] as const)(
  '%s opens an anonymous browser URL',
  async kind => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    let tree!: Renderer.ReactTestRenderer;
    await act(async () => {
      tree = Renderer.create(<PolicyLink kind={kind} />);
    });
    try {
      await act(async () =>
        tree.root
          .findAll(
            node =>
              node.props.accessibilityRole === 'link' &&
              typeof node.props.onPress === 'function',
          )[0]
          .props.onPress(),
      );
      expect(open).toHaveBeenCalledWith(
        `http://10.201.1.216:3001/${kind === 'about' ? 'index' : kind}.html`,
      );
    } finally {
      await act(async () => tree.unmount());
    }
  },
);
test('browser failure shows a useful message without throwing or navigating', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Unavailable'));
  const alert = jest.spyOn(Alert, 'alert');
  await expect(openPolicy('privacy')).resolves.toBeUndefined();
  expect(alert).toHaveBeenCalledWith(
    'Could not open browser',
    expect.any(String),
  );
});

test('hosting is deferred and development links use the local account-server origin', () => {
  const config = jest.requireActual('../src/config/policies');
  expect(config.PUBLISHED_POLICY_BASE_URL).toBe('');
  expect(config.POLICY_BASE_URL).toBe(
    jest.requireActual('../src/config/auth').AUTH_API_URL,
  );
  expect(config.POLICY_PAGE_PATHS).toEqual({
    about: '/index.html',
    privacy: '/privacy.html',
    'medical-disclaimer': '/medical-disclaimer.html',
  });
});

test('References opens the local About page references section', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await openPolicy('about', 'references');
  expect(open).toHaveBeenCalledWith(
    'http://10.201.1.216:3001/index.html#references',
  );
});
