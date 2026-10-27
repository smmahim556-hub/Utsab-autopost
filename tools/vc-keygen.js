// One-off: make the runners' key pair for the voice clone demo. The private key stays in the Actions cache (~/.vc-key);
// the public key goes to state/vc-pub-probe.json so files can be encrypted for the runners without any shared secret.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const dir = path.join(os.homedir(), '.vc-key');
if (!fs.existsSync(path.join(dir, 'priv.pem'))) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 3072 });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'priv.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  fs.writeFileSync(path.join(dir, 'pub.pem'), publicKey.export({ type: 'spki', format: 'pem' }));
}
fs.writeFileSync('state/vc-pub-probe.json', JSON.stringify({ pub: fs.readFileSync(path.join(dir, 'pub.pem'), 'utf8'), at: new Date().toISOString() }, null, 2));
