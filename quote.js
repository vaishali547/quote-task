const axios = require("axios");
const express = require("express");
const router = express.Router();

const Web3 = require("web3");
const web3 = new Web3(process.env.NODE_HTTP);

const socketQuoteUrl = (data) => {
  const {
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
  } = data;
  return `https://api.socket.tech/v2/quote?fromChainId=${fromChainId}&fromTokenAddress=${fromTokenAddress}&toChainId=${toChainId}&toTokenAddress=${toTokenAddress}&fromAmount=${fromAmount}&userAddress=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b&recipient=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b&uniqueRoutesPerBridge=true&includeBridges=hop&includeBridges=anyswap&includeBridges=anyswap-router-v4&includeBridges=anyswap-router-v6&includeBridges=polygon-bridge&includeBridges=arbitrum-bridge&includeBridges=hyphen&includeBridges=across&includeBridges=optimism-bridge&includeBridges=celer&includeBridges=refuel-bridge&includeBridges=stargate&includeBridges=connext&includeBridges=cctp&includeBridges=synapse&includeBridges=base-bridge&includeBridges=zora-bridge&includeBridges=zksync-native&excludeBridges=&sort=output`;
};
const liFiQuoteUrl = (data) => {
  const {
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
  } = data;
  return `https://li.quest/v1/quote?fromChain=${fromChainId}&toChain=${toChainId}&fromToken=${fromTokenAddress}&toToken=${toTokenAddress}&fromAddress=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b&toAddress=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b&fromAmount=${fromAmount}&allowBridges=all`;
};

const socketQuote = (requestData, bridges) => {
  return new Promise(async (resolve, reject) => {
    try {
      const responses = await axios({
        url: await socketQuoteUrl(requestData),
        method: "GET",
        headers: {
          accept: "application/json",
          "API-KEY": "72a5b4b0-e727-48be-8aa1-5da9d62fe635",
        },
      });

      const { status, data } = responses;
      if (status === 200) {
        const gasFeePromises = data.result.routes.map(async (r) => {
          try {
            const gasFeeInWei = await usdToWei(r.totalGasFeesInUsd);
            return gasFeeInWei;
          } catch (error) {
            console.error("Error in gasFeePromises:", error);
            throw error;
          }
        });
        const gasFees = await Promise.all(gasFeePromises);
        const socketBridges = data.result.routes.map((r, index) => {
          return {
            name: r.usedBridgeNames[0],
            fromTokenAddress: data.result.fromAsset.address,
            fromAmount: r.fromAmount,
            fromTokenDecimals: String(data.result.fromAsset.decimals),
            fromTokenIconUrl: data.result.fromAsset.icon,
            toTokenAddress: data.result.toAsset.address,
            toTokenDecimals: String(data.result.toAsset.decimals),
            toTokenIconUrl: data.result.toAsset.icon,
            toAmount: r.toAmount,
            fromAmountInUSD: String(r.inputValueInUsd),
            toAmountInUSD: String(r.outputValueInUsd),
            gasFee: String(r.totalGasFeesInUsd),
            bridgeFee: r.integratorFee.amount,
            minTime: String(r.serviceTime),
            maxTime: String(r.maxServiceTime),
            slippage: undefined,
            steps: r.userTxs,
            gasFeeInWei: gasFees[index],
          };
        });
        bridges.push(...socketBridges);
        resolve(true);
      } else {
        reject();
      }
    } catch (error) {
      console.error("socketQuoteResponse:", error);
      reject(error);
    }
  });
};

const liFiQuote = (requestData, bridges) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({
        url: await liFiQuoteUrl(requestData),
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      const { status, data } = response;
      if (status === 200) {
        let bridgeFee = 0;
        let gasFee = 0;
        for (const fee of data.estimate.feeCosts) {
          bridgeFee += Number(fee.amountUSD);
        }
        for (const g of data.estimate.gasCosts) {
          gasFee += Number(g.amountUSD);
        }
        const gasFeeInWei = await usdToWei(gasFee);
        bridges.push({
          name: data.toolDetails.name,
          fromTokenAddress: data.action.fromToken.address,
          fromAmount: data.action.fromAmount,
          fromTokenDecimals: String(data.action.fromToken.decimals),
          fromTokenIconUrl: data.action.fromToken.logoURI,
          toTokenAddress: data.action.toToken.address,
          toTokenDecimals: String(data.action.toToken.decimals),
          toTokenIconUrl: data.action.toToken.logoURI,
          toAmount: data.estimate.toAmount,
          fromAmountInUSD: data.estimate.fromAmountUSD,
          toAmountInUSD: data.estimate.toAmountUSD,
          gasFee: String(gasFee),
          bridgeFee: String(bridgeFee),
          minTime: String(data.estimate.executionDuration),
          maxTime: String(data.estimate.executionDuration),
          slippage: String(Number(data.action.slippage) * 100),
          steps: data.includedSteps,
          gasFeeInWei,
        });

        resolve(true);
      } else {
        reject("Invalid status code");
      }
    } catch (error) {
      console.error("liFiQuoteResponse:", error);
      reject(error);
    }
  });
};
async function getQuote(requestData) {
  try {
    const promises = [];
    const bridges = [];
    promises.push(
      socketQuote(requestData, bridges),
      liFiQuote(requestData, bridges)
    );
    const result = await Promise.allSettled(promises);
    if (result.length) {
      bridges.sort((a, b) =>
        a.toAmountInUSD - a.gasFee < b.toAmountInUSD - b.gasFee ? 1 : -1
      );
      console.log("bridges ::::", bridges);
      return bridges;
    }
  } catch (error) {
    console.log("error in getQuote::", error);
    return error;
  }
}

async function usdToWei(usdAmount) {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum`
      )
      .then((response) => {
        const { status, data } = response;
        if (status == 200) {
          const exchangeRate = data[0].current_price;
          const amountInEth = Number(usdAmount) / Number(exchangeRate);
          const amountWei = web3.utils.toWei(
            String(amountInEth.toFixed(18)),
            "ether"
          );
          resolve(amountWei);
        } else reject();
      })
      .catch((err) => {
        reject(err);
      });
  });
}
/**Code snippet to run the script */
// getQuote({
//   fromChainId: "137",
//   fromTokenAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
//   toChainId: "56",
//   toTokenAddress: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
//   fromAmount: "100000000",
// });
router.post("/get-quote", async (req, res) => {
  try {
    const quoteResponse = await getQuote(req.body)
    res.send(quoteResponse);
  } catch (err) {
    res.status(400).send(err);
  }
});
module.exports = router;