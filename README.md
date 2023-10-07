# quote-task
Request a quote for a transfer of one token to another, cross chain or not

1.for socket.tech, call quote api .This endpoint returns the routes available between sending chain and destination chain for given sending token and receiving token.
url:https://docs.socket.tech/socket-api/v2/quote

2.for li-fi ,call quote api to request a quote for a transfer of one token to another, cross chain or not. 
url:https://li.quest/v1/quote

3.Combine the response as shown below of both this api’s  and sort the bridges according to received amount either in usd or required token amount (do the sorting according to `max value of received token - gas used `)
   {
  "bridges": [
    {
      "name": "bridge_name",
      "fromToken": "0x00...0000",
      "fromAmount": "100000000",
      "fromTokenDecimals": "6",
      "fromTokenIconUrl": "https://blabla",
      "toToken": "0x000...0000",
      "toAmount": "99830233902871148752",
      "toTokenDecimals": "18",
      "toTokenIconUrl": "https://blabla",
      "fromAmountInUSD": "100",
      "toAmountInUSD": "99.83",
      "gasFee": "10000",
      "bridgeFee": "1 dollar",
      "minTime": "600",
      "maxTime": "1800",
      "slippage": "0.5",
      "steps": {
        
 },
    }
  ]
}

4.Request-{fromChainId:”137”,fromTokenAddress:”0x2791bca1f2de4661ed88a30c99a7a9449aa84174”,toChainId:”56”,toTokenAddress:”0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3”,fromAmount:”100000000”}



