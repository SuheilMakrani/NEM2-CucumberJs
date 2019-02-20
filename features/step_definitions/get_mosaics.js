const { Given, When, Then } = require('cucumber');
const nem2 = require('nem2-sdk');
const operators = require('rxjs/operators');

const NetworkType = nem2.NetworkType,
  timeout = operators.timeout,
  filter = operators.filter;

var accountHttp, mosaicHttp, namespaceHttp, listener;
var aliceaccount;
var mosaicsDetails;

Given('{string} want to get a moisaic from {string}', function (pk, nodeUrl) {
  transactionHttp = new nem2.TransactionHttp(nodeUrl);
  accountHttp = new nem2.AccountHttp(nodeUrl);
  mosaicHttp = new nem2.MosaicHttp(nodeUrl);
  listener = new nem2.Listener(nodeUrl);
  namespaceHttp = new nem2.NamespaceHttp(nodeUrl);
  mosaicService = new nem2.MosaicService(accountHttp, mosaicHttp, namespaceHttp);

  aliceaccount = nem2.PublicAccount.createFromPublicKey(pk, NetworkType.MIJIN_TEST);

});

When('{string} prompts to get all the mosaics under her account', function (pk) {

  listener.open().then(() => {
    const newBlockSubscription = listener
      .newBlock()
      .pipe(timeout(30000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("push successful");
      },
        error => {
          console.error(error);
          listener.terminate();
        });

    accountHttp
      .getAccountInfo(aliceaccount.address)
      .subscribe(x => {
        console.log(x);
        x.mosaics.forEach(async function callback(currentValue, index, array) {
          mosaicsDetails = getMosaicsNames([currentValue.id]);
          console.log(mosaicsDetails);
        });
        console.log(x.mosaics.length);
      }, err => console.error(err));

    async function getMosaicsNames(mosaics) {

      return new Promise(resolve => {
        mosaicHttp.getMosaicsName(mosaics)
          //.take(1) //useful if you need the data once and don't want to manually cancel the subscription again
          .subscribe(
            (mosaicName) => {
              console.log(mosaicName);
              resolve(mosaicName);
            }
            , err => console.log(err));
      });
    }
  });
});

Then('{string} should get info for all the mosaics', function (pk) {
  // Insert code here
});
