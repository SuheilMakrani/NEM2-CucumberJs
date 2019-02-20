const { Given, When, Then } = require('cucumber');
const nem2 = require('nem2-sdk');
const operators = require('rxjs/operators');

const Account = nem2.Account,
  PublicAccount = nem2.PublicAccount,
  PlainMessage = nem2.PlainMessage,
  EmptyMessage = nem2.EmptyMessage,
  XEM = nem2.XEM,
  LockFundsTransaction = nem2.LockFundsTransaction,
  TransactionHttp = nem2.TransactionHttp,
  NetworkType = nem2.NetworkType,
  UInt64 = nem2.UInt64,
  Deadline = nem2.Deadline,
  TransferTransaction = nem2.TransferTransaction,
  AggregateTransaction = nem2.AggregateTransaction,
  Listener = nem2.Listener,
  mergeMap = operators.mergeMap,
  filter = operators.filter,
  timeout = operators.timeout;

var aliceaccount, bobAccount, transactionHttp, xemamount, transferTransaction1, transferTransaction2, signedTransaction;

Given('{string} wants to ask {string} for {int} xems on {string}', function (bob_privatekey, alice_publickey, xems, nodeUrl) {
  transactionHttp = new TransactionHttp(nodeUrl);
  listener = new Listener(nodeUrl);

  bobAccount = Account.createFromPrivateKey(bob_privatekey, NetworkType.MIJIN_TEST);
  aliceaccount = PublicAccount.createFromPublicKey(alice_publickey, NetworkType.MIJIN_TEST);

  xemamount = xems;

});

When('bob creates an aggregate bonded transaction by creating first inner transaction', function () {
  transferTransaction1 = TransferTransaction.create(
    Deadline.create(),
    aliceaccount.address,
    [],
    PlainMessage.create('send me' + xemamount + 'XEM'),
    NetworkType.MIJIN_TEST);
});

When('bob defines the second inner transaction', function () {
  transferTransaction2 = TransferTransaction.create(
    Deadline.create(),
    bobAccount.address,
    [XEM.createRelative(xemamount)],
    EmptyMessage,
    NetworkType.MIJIN_TEST);

});

Then('bob wraps the defined transaction in an aggregate bonded transaction', function () {
  const aggregateTransaction = AggregateTransaction.createBonded(
    Deadline.create(),
    [transferTransaction1.toAggregate(bobAccount.publicAccount),
    transferTransaction2.toAggregate(aliceaccount)],
    NetworkType.MIJIN_TEST);

  signedTransaction = bobAccount.sign(aggregateTransaction);

});

Then('bob announces the transaction to the network locking first {int} xems', function (int) {
  const lockFundsTransaction = LockFundsTransaction.create(
    Deadline.create(),
    XEM.createRelative(10),
    UInt64.fromUint(480),
    signedTransaction,
    NetworkType.MIJIN_TEST);

  const lockFundsTransactionSigned = bobAccount.sign(lockFundsTransaction);

  listener.open().then(() => {
    transactionHttp
      .announce(lockFundsTransactionSigned)
      .subscribe(x => console.log(x), err => console.error(err));

    //============================Listen to lock funds transaction=============================//

    const newBlockSubscription2 = listener
      .newBlock()
      //.pipe(timeout(60000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("\n✅  Lock hash transaction through: " + lockFundsTransactionSigned.hash);
        listener.terminate();
      },
        error => {
          console.error(error);
          listener.terminate();
        });

    listener
      .status(bobAccount.address)
      .pipe(filter(error => error.hash === lockFundsTransactionSigned.hash))
      .subscribe(error => {
        console.log("\n❌  :" + error.status);
        newBlockSubscription2.unsubscribe();
        listener.close();
      },
        error => console.error(error));
    //=============================Announce aggregate bonded transaction===============================//
    listener
      .confirmed(bobAccount.address)
      .pipe(
        filter((transaction) => transaction.transactionInfo !== undefined
          && transaction.transactionInfo.hash === lockFundsTransactionSigned.hash),
        mergeMap(ignored => transactionHttp.announceAggregateBonded(signedTransaction))
      )
      .subscribe(announcedAggregateBonded => {
        console.log(announcedAggregateBonded);
        console.log("\n✅  Aggregate transaction has been announced: " + signedTransaction.hash);
        newBlockSubscription2.unsubscribe();
        listener.close();
      },
        error => console.error(error));
  });
});