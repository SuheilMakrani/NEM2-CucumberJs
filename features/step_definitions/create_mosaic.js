const nem2 = require('nem2-sdk');
const { Given, When, Then } = require('cucumber');
const operators = require('rxjs/operators');
var crypto = require("crypto");

const Account = nem2.Account,
  Listener = nem2.Listener,
  NetworkType = nem2.NetworkType,
  UInt64 = nem2.UInt64,
  Deadline = nem2.Deadline,
  MosaicDefinitionTransaction = nem2.MosaicDefinitionTransaction,
  MosaicProperties = nem2.MosaicProperties,
  mergeMap = operators.mergeMap,
  filter = operators.filter,
  timeout = operators.timeout;

var transactionHttp, accountHttp, mosaicHttp, namespaceHttp, listener;
var account, mosaic;
var mosaicDefinitionTransaction;

Given('{string} want to create a moisaic at {string}', function (pk, nodeUrl) {

  transactionHttp = new nem2.TransactionHttp(nodeUrl);
  accountHttp = new nem2.AccountHttp(nodeUrl);
  mosaicHttp = new nem2.MosaicHttp(nodeUrl);
  namespaceHttp = new nem2.NamespaceHttp(nodeUrl, NetworkType.MIJIN_TEST);
  listener = new Listener(nodeUrl);
  mosaicService = new nem2.MosaicService(accountHttp, mosaicHttp, namespaceHttp);

  account = Account.createFromPrivateKey(pk, NetworkType.MIJIN_TEST);
});

When('Alice add a mosaic named {string} in namespace named {string}', function (mosaicname, namespacename) {
  //to get random mosaic name for testing multiple times
  mosaic = mosaicname + "_" + crypto.randomBytes(5).toString('hex');

  mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
    Deadline.create(),
    mosaic,
    namespacename,
    MosaicProperties.create({
      supplyMutable: true,
      transferable: true,
      levyMutable: false,
      divisibility: 0,
      duration: UInt64.fromUint(1000)
    }),
    NetworkType.MIJIN_TEST);
});

Then('Alice should get a mosaic transaction hash', function () {
  let signedTransaction = account.sign(mosaicDefinitionTransaction);

  listener.open().then(() => {
    listener
      .unconfirmedAdded(account.address)
      .pipe(filter(transaction => (transaction.transactionInfo !== undefined
        && transaction.transactionInfo.hash === signedTransaction.hash)))
      .subscribe(ignored => console.log("\n⏳  Transaction status changed to unconfirmed: " + signedTransaction.hash),
        error => console.error(error));

    const newBlockSubscription = listener
      .newBlock()
      //.pipe(timeout(60000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("\n✅  Transaction confirmed: " + signedTransaction.hash);
        listener.terminate();
      },
        error => {
          console.error(error);
          listener.terminate();
        });

    listener
      .status(account.address)
      .pipe(filter(error => error.hash === signedTransaction.hash))
      .subscribe(error => {
        console.log("\n❌  :" + error.status);
        newBlockSubscription.unsubscribe();
        listener.close();
      },
        error => console.error(error));

    transactionHttp
      .announce(signedTransaction)
      .subscribe(x => console.log(x), err => console.error(err));
  });
});