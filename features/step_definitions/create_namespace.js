const nem2 = require('nem2-sdk');
const { Given, When, Then } = require('cucumber');
const operators = require('rxjs/operators');

const Account = nem2.Account,
  NetworkType = nem2.NetworkType,
  UInt64 = nem2.UInt64,
  Deadline = nem2.Deadline,
  RegisterNamespaceTransaction = nem2.RegisterNamespaceTransaction,
  filter = operators.filter,
  timeout = operators.timeout;

var transactionHttp, accountHttp, mosaicHttp, namespaceHttp, listener;
var registerNamespaceTransaction;
var account;

Given('{string} want to register a namespace at {string}', function (pk, nodeUrl) {
  transactionHttp = new nem2.TransactionHttp(nodeUrl);
  accountHttp = new nem2.AccountHttp(nodeUrl);
  mosaicHttp = new nem2.MosaicHttp(nodeUrl);
  listener = new nem2.Listener(nodeUrl);
  namespaceHttp = new nem2.NamespaceHttp(nodeUrl, NetworkType.MIJIN_TEST);
  mosaicService = new nem2.MosaicService(accountHttp, mosaicHttp, namespaceHttp);

  account = Account.createFromPrivateKey(pk, NetworkType.MIJIN_TEST);
});
When(' want to register a namespace named {string}', function (namespace_name) {
  registerNamespaceTransaction = RegisterNamespaceTransaction.createRootNamespace(
    Deadline.create(),
    namespace_name,
    UInt64.fromUint(60),
    NetworkType.MIJIN_TEST
  );
});
Then('Alice should get a namespace transaction hash', function () {
  let signedTransaction = account.sign(registerNamespaceTransaction);

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