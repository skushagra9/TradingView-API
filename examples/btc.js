const TradingView = require('../main');

let latestPrice = null;
let isProcessing = false;
let lastProcessedPrice = null;
const orders = [];

/**
 * This example creates a BTCEUR daily chart
 */
console.log('btc script loaded 🤘');
const client = new TradingView.Client(); // Creates a websocket client

const chart = new client.Session.Chart(); // Init a Chart session

chart.setMarket('BINANCE:ETHUSD', { // Set the market  //ETHUSD  //SOLUSD
  timeframe: 'D',
});

chart.onError((...err) => { // Listen for errors (can avoid crash)
  console.error('Chart error:', ...err);
  // Do something...
});

chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
  console.log(`Market "${chart.infos.description}" loaded !`);
});

chart.onUpdate(async () => {
  const btcPrice = chart.periods[0].close;
  console.log(typeof (btcPrice), btcPrice);
  latestPrice = btcPrice;
  // const priceChangesbuy = calculatePriceChangesbuy(69299);
  // console.log(priceChangesbuy);
  // // const priceChangesSell = calculatePriceChangesSell(btcPrice);
  //
  // console.log('Price changes for BTC:');
  //
  // await processOrders(priceChangesbuy, true);

  if (!isProcessing) {
    processLatestPrice();
  }
});

const cancelPayload = async (orderId, isBuy) => {
  let cancel;

  if (isBuy) {
    cancel = {
      type: 'cancel',
      cancels: [{
        account: '0x1163DA866dEdC35104DCfBb378408A874dD14e20',
        orderId,
      }],
      signature: '0x9d2cc5a58fc8382e90fbeff57091b3886563ae50d7d6b29f1713d556a87f119638287197ad2e38b6ac2d9fa2e5173127fd12d2aee863c305dde7b3b767a8d8cd1b',
    };
  } else {
    cancel = {
      type: 'cancel',
      cancels: [{
        account: '0x04aCcaBEa3BEd9BBc13748e70040A5A1430Ecd5f',
        orderId,
      }],
      signature: '0x4c7c31aa2a6c5fe8ccac1d1d4cc936beca2af8a280798e627b8eb8210c0231b4686aba364e215a4338edf73993d2f59a65df3cd06c792b335c82b32e89f90ddc1b',
    };
  }

  const response = await fetch('https://orderbook.filament.finance/test/filament/api/v1/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cancel),
  });
  console.log(response);
};

async function processLatestPrice() {
  if (latestPrice === null) {
    return;
  }

  isProcessing = true;
  const btcPrice = latestPrice;
  latestPrice = null; // Reset the latest price to null
  runPriceChangeCalculationSell();
  // if (lastProcessedPrice !== null) {
  //   const priceChangePercentage = Math.abs((btcPrice - lastProcessedPrice) / lastProcessedPrice) * 100;
  //   if (priceChangePercentage <= 1.5) {
  //     isProcessing = false;
  //     if (latestPrice !== null) {
  //       processLatestPrice();
  //     }
  //     return;
  //   }
  //
  //   //   orders.forEach(async (order) => {
  //   //     await cancelPayload(order.id, order.isBuy);
  //   //   });
  //   // }

  lastProcessedPrice = btcPrice;

  // const priceChangesbuy = calculatePriceChangesbuy(btcPrice);
  // const priceChangesSell = calculatePriceChangesSell(btcPrice);

  // console.log('Price changes for BTC:');

  // await processOrders(priceChangesbuy, true);
  // await processOrders(priceChangesSell, false);

  isProcessing = false;

  // Check if there was a new price update while processing
  if (latestPrice !== null) {
    processLatestPrice();
  }
}
// }
async function processOrders(priceChanges, isBuy) {
  for (const changeKey of Object.keys(priceChanges)) {
    const changeValue = priceChanges[changeKey];
    console.log(changeKey, changeValue, 'me');
    const payload = {
      type: 'order',
      referralCode: null,
      orders: [
        {
          account: '0x04aCcaBEa3BEd9BBc13748e70040A5A1430Ecd5f',
          indexToken: 'SOL',
          isBuy,
          size: 1000,
          leverage: 30,
          reduceOnly: false,
          orderType: {
            type: 'limit',
            limit: {
              tif: 'Gtc',
              limitPrice: changeValue,
            },
          },
        },
      ],
      signature: '0x9ceed76f5a3355cbc250504231a5cc4358b6243488977381ac49cb424a06bf684d0a5f0721472f6e2189ab183486f841c647a338e0f7f7f262ccd3b26dda578e1c',
    };

    try {
      const response = await fetch('https://orderbook.filament.finance/test/filament/api/v1/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(`${isBuy ? 'Buy' : 'Sell'} order created successfully:`, data);
      console.log(data.response.orders.orderId);
      orders.push({ id: data.response.orders.orderId, isBuy });
    } catch (error) {
      console.error(`Error creating ${isBuy ? 'buy' : 'sell'} order:`, error);
    }
  }
}

function calculatePriceChangesbuy(price) {
  const dollarDecreases = Array.from({ length: 25 }, (_, i) => i + 1);
  const priceChanges = {};

  dollarDecreases.forEach((decrease) => {
    const changeKey = `minus_${decrease}_dollar`;
    priceChanges[changeKey] = (price - decrease).toFixed(2);
  });

  return priceChanges;
}

function calculatePriceChangesSell(price) {
  const dollarIncreases = Array.from({ length: 25 }, (_, i) => i + 1);
  const priceChanges = {};

  dollarIncreases.forEach((increase) => {
    const changeKey = `plus_${increase}_dollar`;
    priceChanges[changeKey] = (price + increase).toFixed(2);
  });

  return priceChanges;
}

// function calculatePriceChangesSell(price) {
//   const percentChanges = [0.01, 0.02, 0.03];
//   const priceChanges = {};
//
//   percentChanges.forEach((change) => {
//     const changeKey = (change > 0 ? 'plus_' : 'minus_') + Math.abs(change).toString().replace('.', '_');
//     priceChanges[changeKey] = (price * (1 + change / 100)).toFixed(2);
//   });
//
//   return priceChanges;
// }
//
//
//
//

async function runPriceChangeCalculation() {
  try {
    const btcPrice = chart.periods[0].close;
    // console.log(typeof (btcPrice), btcPrice);
    // latestPrice = btcPrice;
    const priceChangesbuy = calculatePriceChangesbuy(btcPrice);
    console.log(priceChangesbuy);
    // const priceChangesSell = calculatePriceChangesSell(btcPrice);

    console.log('Price changes for BTC:');

    await processOrders(priceChangesbuy, true);

    // if (!isProcessing) {
    //   processLatestPrice();
    // }
  } catch (error) {
    console.error('Error running price change calculation:', error);
  }
}

async function runPriceChangeCalculationSell() {
  try {
    const btcPrice = chart.periods[0].close;
    // console.log(typeof (btcPrice), btcPrice);
    // latestPrice = btcPrice;
    // const priceChangesbuy = calculatePriceChangesbuy(160);
    const priceChangesSell = calculatePriceChangesSell(159);
    console.log(priceChangesSell);
    // const priceChangesSell = calculatePriceChangesSell(btcPrice);

    console.log('Price changes for BTC:');

    // await processOrders(priceChangesbuy, true);
    await processOrders(priceChangesSell, false);

    // if (!isProcessing) {
    //   processLatestPrice();
    // }
  } catch (error) {
    console.error('Error running price change calculation:', error);
  }
}

// runPriceChangeCalculationSell();
