const nem2 = require('nem2-sdk');
const { Given, When, Then } = require('cucumber');
const operators = require('rxjs/operators');

const Account = nem2.Account,
  Address = nem2.Address,
  PlainMessage = nem2.PlainMessage,
  TransactionHttp = nem2.TransactionHttp,
  Listener = nem2.Listener,
  NetworkType = nem2.NetworkType,
  XEM = nem2.XEM,
  UInt64 = nem2.UInt64,
  Deadline = nem2.Deadline,
  TransferTransaction = nem2.TransferTransaction,
  AggregateTransaction = nem2.AggregateTransaction,
  Mosaic = nem2.Mosaic,
  MosaicId = nem2.MosaicId,
  filter = operators.filter,
  timeout = operators.timeout;

var transactionHttp;
var aliceaccount, bobaccount;
var bobtransaction, aliceatransaction;
var aggregateTransaction;
var signedTransaction;

Given('{string} sends transaction to {string} and {string}', function (pk, alice_add, bob_add) {
  danaccount = Account.createFromPrivateKey(pk, NetworkType.MIJIN_TEST);
  aliceaccount = Address.createFromRawAddress(alice_add);
  bobaccount = Address.createFromRawAddress(bob_add);
});

When('Dan sends {string} of {string}', function (number, mosaicname) {
  let mosaic = new Mosaic(new MosaicId(mosaicname), UInt64.fromUint(10));
  let int = parseInt(number, 10);
  let xem = XEM.createRelative(int); // 10 xem represent 10 000 000 micro xem

  // create transfer transaction to send mosaic to bob and alice address
  bobtransaction = TransferTransaction.create(Deadline.create(), bobaccount, [mosaic], PlainMessage.create('payout'), NetworkType.MIJIN_TEST);
  aliceatransaction = TransferTransaction.create(Deadline.create(), aliceaccount, [xem], PlainMessage.create('payout'), NetworkType.MIJIN_TEST);

  aggregateTransaction = AggregateTransaction.createComplete(
    Deadline.create(),
    [bobtransaction.toAggregate(danaccount.publicAccount),
    aliceatransaction.toAggregate(danaccount.publicAccount)],
    NetworkType.MIJIN_TEST,
    []
  );
});

Then('Dan announces the transaction on {string} should get the complete aggregate transaction hash', function (nodeUrl) {
  transactionHttp = new TransactionHttp(nodeUrl);
  listener = new Listener(nodeUrl);
  
  signedTransaction = danaccount.sign(aggregateTransaction);

  listener.open().then(() => {
    transactionHttp
      .announce(signedTransaction)
      .subscribe(x => console.log(x), err => console.error(err));

    //============================Listen to lock funds transaction=============================//

    const newBlockSubscription3 = listener
      .newBlock()
      //.pipe(timeout(60000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("\n✅  Aggregate transaction through " + signedTransaction.hash);
        listener.terminate();
      },
        error => {
          console.error(error);
          listener.terminate();
        });

    listener
      .status(danaccount.address)
      .pipe(filter(error => error.hash === signedTransaction.hash))
      .subscribe(error => {
        console.log("\n❌  :" + error.status);
        newBlockSubscription3.unsubscribe();
        listener.close();
      },
        error => console.error(error));
   });
});
