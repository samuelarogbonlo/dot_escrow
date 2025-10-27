const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

const mnemonic = "reduce cricket true vanish loyal early shrimp artefact toast drink brief sting";

async function getAddress() {
  await cryptoWaitReady();

  const keyring = new Keyring({ type: 'sr25519' });
  const pair = keyring.addFromUri(mnemonic);

  console.log('Address:', pair.address);
  console.log('\nYou need to get PAS tokens from: https://faucet.polkadot.io/');
  console.log('Select "Paseo" network and paste your address above');
}

getAddress().catch(console.error);
