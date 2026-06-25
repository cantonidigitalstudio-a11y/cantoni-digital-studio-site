const OUTBOUND_PAUSE_RELATIVE_PATH = 'sales-kit/outbound_pause.flag';

const OUTBOUND_PAUSE_REQUIRED_SNIPPETS = [
  'npm run audit:post-unblock-launch',
  'npm run audit:email-dns',
  'npm run test:social-public',
  'npm run test:lead-endpoint',
  'exact outbound batch',
  'cantonidigitalstudio@gmail.com',
  'scripts/day1_send_background.sh',
  'OUTBOUND_FORCE_RUN=1'
];

function missingOutboundPauseReleaseConditions(source) {
  if (typeof source !== 'string') return OUTBOUND_PAUSE_REQUIRED_SNIPPETS.slice();
  return OUTBOUND_PAUSE_REQUIRED_SNIPPETS.filter((snippet) => !source.includes(snippet));
}

module.exports = {
  OUTBOUND_PAUSE_RELATIVE_PATH,
  OUTBOUND_PAUSE_REQUIRED_SNIPPETS,
  missingOutboundPauseReleaseConditions
};
