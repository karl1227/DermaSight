import { backendUrlFromBundle } from '../src/config/developmentServer';

test.each([
  [
    'http://10.201.1.216:8081/index.bundle?platform=ios',
    'http://10.201.1.216:3001',
  ],
  ['http://192.168.1.15:8081/index.bundle', 'http://192.168.1.15:3001'],
  ['http://10.0.2.2:8081/index.bundle', 'http://10.0.2.2:3001'],
  ['http://macbook.local:8081/index.bundle', 'http://macbook.local:3001'],
  ['http://[fd00::12]:8081/index.bundle', 'http://[fd00::12]:3001'],
])('development backend follows Metro host: %s', (script, expected) => {
  expect(backendUrlFromBundle(script, 'http://fallback:3001')).toBe(expected);
});
test.each([
  undefined,
  'file:///app/main.jsbundle',
  'http://localhost:8081/index.bundle',
  'http://127.0.0.1:8081/index.bundle',
  'not-a-url',
])(
  'embedded or loopback source uses the physical-phone fallback: %s',
  script => {
    expect(backendUrlFromBundle(script, 'http://fallback:3001')).toBe(
      'http://fallback:3001',
    );
  },
);
