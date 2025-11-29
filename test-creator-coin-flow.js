/**
 * Creator Coin Activation Flow - Browser Testing Script
 *
 * Run this in the browser console while on a profile page to test the flow.
 * This script helps debug the creator coin activation process.
 */

(function() {
  console.log('🧪 Creator Coin Activation Test Suite Started');
  console.log('============================================');

  // Test 1: Check if modal component exists
  console.log('\n✅ Test 1: Checking modal component...');
  const modalExists = document.querySelector('[role="dialog"]');
  console.log(modalExists ? '✅ Modal component found' : '⚠️  Modal not currently open');

  // Test 2: Check if activate button exists
  console.log('\n✅ Test 2: Checking "Activate Coin" button...');
  const activateButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Activate Coin')
  );
  console.log(activateButton ? '✅ "Activate Coin" button found' : '⚠️  Button not found (may already be activated)');

  // Test 3: Check wallet connection
  console.log('\n✅ Test 3: Checking wallet connection...');
  const walletButton = document.querySelector('[class*="wallet"]');
  console.log(walletButton ? '✅ Wallet UI found' : '❌ Wallet UI not found');

  // Test 4: Check profile data
  console.log('\n✅ Test 4: Checking profile data...');
  const displayName = document.querySelector('h1');
  const username = document.querySelector('[class*="@"]');
  console.log('Display name:', displayName?.textContent || 'Not found');
  console.log('Username:', username?.textContent || 'Not found');

  // Test 5: API endpoint availability
  console.log('\n✅ Test 5: Testing API endpoint...');
  fetch('/api/creators/activate-coin', {
    method: 'OPTIONS'
  })
    .then(() => console.log('✅ API endpoint is reachable'))
    .catch(() => console.log('❌ API endpoint not reachable'));

  // Helper function to simulate modal opening
  window.testOpenModal = function() {
    console.log('\n🔨 Attempting to open modal...');
    if (activateButton) {
      activateButton.click();
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          console.log('✅ Modal opened successfully!');
          console.log('Modal content:', modal.textContent.substring(0, 200) + '...');
        } else {
          console.log('❌ Modal did not open. Check console for errors.');
        }
      }, 500);
    } else {
      console.log('❌ Cannot test - "Activate Coin" button not found');
    }
  };

  // Helper function to check API call
  window.testAPICall = async function(walletAddress = 'FAKE_WALLET_FOR_TEST') {
    console.log('\n🔨 Testing API call...');
    console.log('⚠️  NOTE: This is a test call and may fail without proper auth');

    try {
      const response = await fetch('/api/creators/activate-coin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          username: 'testuser',
          displayName: 'Test User',
          bio: 'Test bio',
          avatarUrl: 'https://test.com/avatar.png'
        })
      });

      const data = await response.json();
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', data);

      if (!response.ok) {
        console.log('⚠️  Expected error (no valid wallet):', data.error);
      } else {
        console.log('✅ API call successful!');
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
    }
  };

  // Test 6: Check for creator coin status
  console.log('\n✅ Test 6: Checking creator coin status...');
  const coinBadge = document.querySelector('[class*="Creator Coin"]');
  const tokenAddress = Array.from(document.querySelectorAll('a')).find(
    a => a.href.includes('solscan.io/token')
  );

  if (coinBadge || tokenAddress) {
    console.log('✅ Creator coin appears to be activated!');
    if (tokenAddress) {
      console.log('Token address link:', tokenAddress.href);
    }
  } else {
    console.log('⚠️  Creator coin not yet activated');
  }

  // Print available test commands
  console.log('\n📋 Available Test Commands:');
  console.log('============================');
  console.log('testOpenModal()      - Simulate clicking "Activate Coin" button');
  console.log('testAPICall()        - Test API endpoint (will fail without real wallet)');
  console.log('\nExample usage:');
  console.log('> testOpenModal()');

  console.log('\n✅ Test suite complete! Check results above.');
  console.log('============================================\n');
})();
