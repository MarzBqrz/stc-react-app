require("@nomiclabs/hardhat-waffle");
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
    },
    ropsten: {
      url:"https://ropsten.infura.io/v3/d2d6b6071b6847a5afbd210563aa1573",
      accounts: [''] //add private key in here
    }
  }
};
