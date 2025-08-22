const { ApiPromise, WsProvider } = require('@polkadot/api');
const { ContractPromise } = require('@polkadot/api-contract');
const fs = require('fs');

// Load the ABI
const abiPath = './src/contractABI/EscrowABI.json';
const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const CONTRACT_ADDRESS = '5FjtTZsj8L9Yax5wjJz1V92muvThYrqVb8dpuoBWXo9G6who';
const RPC_URL = 'wss://ws.azero.dev';

async function testListEscrows() {
  console.log('🔄 Connecting to Aleph Zero...');
  
  const provider = new WsProvider(RPC_URL);
  const api = await ApiPromise.create({ provider });
  
  console.log('✅ Connected to blockchain');
  
  // Create contract instance
  const contract = new ContractPromise(api, contractABI, CONTRACT_ADDRESS);
  console.log('📋 Contract instance created');
  
  // Use a test account address (you can replace with any valid address)
  const testAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
  
  // Create gas limits - same as our frontend
  const gasLimit = api.registry.createType('WeightV2', {
    refTime: 20000000000,  // 20 billion refTime units
    proofSize: 4 * 1024 * 1024  // 4MB proof size
  });
  
  console.log('⛽ Gas limits set:', {
    refTime: gasLimit.refTime.toString(),
    proofSize: gasLimit.proofSize.toString()
  });
  
  try {
    console.log('📞 Calling list_escrows...');
    
    // Try different method names to find the correct one
    console.log('🔍 Available query methods:');
    console.log(Object.keys(contract.query));
    
    // Call the contract function using the correct method name
    const result = await contract.query.listEscrows(
      testAddress,
      {
        gasLimit,
        storageDepositLimit: null,
      }
    );
    
    console.log('📋 Raw result:', {
      result: result.result.toHuman(),
      output: result.output?.toHuman ? result.output.toHuman() : 'Cannot convert to human',
      debugMessage: result.debugMessage?.toHuman ? result.debugMessage.toHuman() : result.debugMessage,
      gasConsumed: result.gasConsumed?.toHuman ? result.gasConsumed.toHuman() : 'Cannot get gas consumed'
    });
    
    // Process the result like our frontend does
    if (result.result.isOk) {
      console.log('✅ Contract call succeeded');
      
      const output = result.output;
      console.log('🔍 Processing output...');
      
      try {
        const humanOutput = output?.toHuman ? output.toHuman() : output;
        console.log('👤 Human output:', JSON.stringify(humanOutput, null, 2));
        
        let escrowsArray = [];
        if (humanOutput && typeof humanOutput === 'object' && humanOutput.Ok !== undefined) {
          escrowsArray = humanOutput.Ok;
          console.log('📊 Extracted from Ok field:', escrowsArray);
        } else if (Array.isArray(humanOutput)) {
          escrowsArray = humanOutput;
          console.log('📊 Direct array:', escrowsArray);
        } else {
          console.log('📊 Using empty array as fallback');
        }
        
        console.log(`🎯 Final result: Found ${escrowsArray.length} escrows`);
        if (escrowsArray.length > 0) {
          console.log('📋 Escrows:', JSON.stringify(escrowsArray, null, 2));
        } else {
          console.log('📋 No escrows found (this is normal for a test account)');
        }
        
      } catch (decodeError) {
        console.error('❌ Error decoding result:', decodeError.message);
      }
      
    } else {
      const error = result.result.asErr.toHuman();
      console.error('❌ Contract call failed:', error);
      
      // Handle Module errors gracefully (like our frontend does)
      if (JSON.stringify(error).includes('Module')) {
        console.log('ℹ️  Module error detected - this typically means no escrows found for this account');
        console.log('🎯 Treating as empty result (0 escrows)');
      }
    }
    
  } catch (error) {
    console.error('💥 Error calling contract:', error.message);
    if (error.message.includes('index 60')) {
      console.log('🔍 This is the "index 60" error we were trying to fix!');
    }
  }
  
  console.log('🔌 Disconnecting...');
  await api.disconnect();
  console.log('✨ Test complete!');
}

// Run the test
testListEscrows().catch(console.error);