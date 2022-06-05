"use strict";

// Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

// Web3modal instance
let web3Modal
// Chosen wallet provider given by the dialog window
let provider;
// Address of the selected account
let selectedAccount;
// Authentication Token
let authenticationToken;
// Configuration
let configuration = {};

const ConnectToBinanceChainWallet = async () => {
  let provider = null;
  if (typeof window.BinanceChain !== 'undefined') {
    provider = window.BinanceChain;
    try {
      await provider.request({ method: 'eth_requestAccounts' })
    } catch (error) {
      throw new Error("User Rejected");
    }
  } else {
    throw new Error("No Binance Chain Wallet found");
  }
  return provider;
};

/**
 * Setup the orchestra
 */
async function init() {

  console.log("Initializing Kryxivia Authentication App");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("Fortmatic is", Fortmatic);
  console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: "00e69497300347a38e75c3287621cb16",
      }
    },

    fortmatic: {
      package: Fortmatic,
      options: {
        // Mikko's TESTNET api key
        key: "pk_test_391E26A3B43A3350"
      }
    },
    "custom-example": {
      display: {
        logo: '/template/img/binancewallet.png',
        name: "Binance Chain Wallet",
        description: "Binance Chain Wallet"
      },
      package: WalletConnectProvider,
      connector: async (x, options) => {
        const provider = await ConnectToBinanceChainWallet();
        return provider;
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    // theme: { // black theme
    //   background: "rgb(39, 49, 56)",
    //   main: "rgb(199, 199, 199)",
    //   secondary: "rgb(136, 136, 136)",
    //   border: "rgba(195, 195, 195, 0.14)",
    //   hover: "rgb(16, 26, 32)"
    // }
  });
}

/**
 * Connect wallet button pressed.
 */
 async function onConnect() {

  document.getElementById('login-btn').setAttribute('disabled', true);
  console.log("Opening a dialog", web3Modal);
  try {
    // await web3Modal.clearCachedProvider();
    provider = await web3Modal.connect();
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    document.getElementById('login-btn').removeAttribute('disabled');
    return ;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    console.log('accountsChanged');
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    console.log('chainChanged');
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    console.log('networkChanged');
    fetchAccountData();
  });

  await refreshAccountData();
}

async function refreshAccountData() {
  await fetchAccountData(provider);
}

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {
  console.log("Killing the wallet connection", provider);
  if(provider.close) {
    await provider.close();
    await web3Modal.clearCachedProvider();
    provider = null;
  }
  selectedAccount = null;
}

function displayError(msg) {
  let boxMessage = document.getElementById("box-message");
  let boxData = document.getElementById("box-data");
  let closeBox = document.getElementById("close-box-message");
  let alphaAccessButton = document.getElementById("alpha-access");

  boxData.innerText = msg;
  boxMessage.style.display = 'block';

  closeBox.onclick = () => {
    boxMessage.style.display = 'none';
    initialize();
  }

  alphaAccessButton.onclick = () => {
    window.open('https://staking.kryxivia.io/', '_blank');
    initialize();
  }
}

/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {
  const web3 = new Web3(provider);
  console.log("Web3 instance is", web3);
  const chainId = await web3.eth.getChainId();
  const chainData = evmChains.getChain(chainId);
  const accounts = await web3.eth.getAccounts();
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];
  try {
    document.getElementById('login-btn-spinner').style.display = 'block';
    document.getElementById('login-btn-bsc-logo').style.display = 'none';

    const signedMessage = await web3.eth.personal.sign("I agree to connect my wallet to Kryxivia.", selectedAccount, "");
    console.log(signedMessage);
    document.HttpClient.post({
        url: `https://kryx-app-auth-api.azurewebsites.net/api/v1/login`,
        headers: {
            "Content-Type": "application/json"
        },
        body: configuration.authenticationPayload
          .replaceAll('\$publicKey', selectedAccount)
          .replaceAll('\$signature', signedMessage)
          .replaceAll('\$authToken', authenticationToken)
      }, [
      (response) => { // logged
        configuration.callBackWhenLoginSuccess(response);
        document.getElementById('login').style.display = 'none';
        document.getElementById('logged').style.display = 'block';
      },
      (err) => {
        configuration.callBackWhenLoginSuccess(err);
        if (err.status == 500 && err.response) {
          let resp = JSON.parse(err.response);
          displayError(resp.errorMessage);
        } else {
          document.getElementById('login-error-message').style.display = 'flex';
          document.getElementById('login-select-message').style.display = 'none';
        }
        console.error(err);
        document.getElementById('login-btn-spinner').style.display = 'none';
        document.getElementById('login-btn-bsc-logo').style.display = 'block';
      }
      ]);
  } catch (e) {
    document.getElementById('login-btn-spinner').style.display = 'none';
    document.getElementById('login-btn-bsc-logo').style.display = 'block';
    document.getElementById('login-btn').removeAttribute('disabled');
  }
}


function initialize(config) {
  configuration = config;
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  if (urlParams.has(configuration.authenticationTokenParamName)) {
    authenticationToken = urlParams.get(configuration.authenticationTokenParamName);
    document.getElementById('login').style.display = 'block';
    init();
  } else {
    document.getElementById('login').style.display = 'none';
    document.getElementById('logo-suite').style.display = 'flex';
    document.getElementById('logo-zone').style.marginBottom = '0px';
  }
}

/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  initialize({
    // Configuration:
    authenticationTokenParamName: 'auth-token',
    authApiUrl: 'https://kryx-app-auth-api.azurewebsites.net/api/v1/login',
    authenticationPayload: '{ "publicKey": "$publicKey", "signature": "$signature", "authToken": "$authToken" }',
    callBackWhenLoginSuccess: (response) => {
      console.log('Login Success', JSON.parse(response));
    },
    callBackWhenLoginFail: (errResponse) => {
      console.log('Login Fail', errResponse);
    },
  });
});