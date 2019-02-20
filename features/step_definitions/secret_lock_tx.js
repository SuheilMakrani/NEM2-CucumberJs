const { Given, When, Then } = require('cucumber');
const nem2 = require('nem2-sdk');
const operators = require('rxjs/operators');
const crypto = require('crypto');
const keccak_512 = require('js-sha3').keccak_512;

const Account = nem2.Account,
  TransactionHttp = nem2.TransactionHttp,
  NetworkType = nem2.NetworkType,
  SecretLockTransaction = nem2.SecretLockTransaction,
  UInt64 = nem2.UInt64,
  Deadline = nem2.Deadline,
  SecretProofTransaction = nem2.SecretProofTransaction,
  Mosaic = nem2.Mosaic,
  MosaicId = nem2.MosaicId,
  HashType = nem2.HashType,
  Listener = nem2.Listener,
  mergeMap = operators.mergeMap,
  filter = operators.filter,
  map = operators.map,
  skip = operators.skip,
  first = operators.first;

var alicePrivateChainAccount, alicePrivateChain2Account;
var bobPrivateChainAccount, bobPrivateChain2Account;
var privateChainTransactionHttp, privateChain2TransactionHttp;
var listener1, listener2;
var random, hash, secret, proof;
var tx1, tx2, tx3, tx4;

Given('{string}{string} wants to send a transaction from {string} to {string} {string} at {string}', function (alicepk1, alicepk2, privateNodeUrl, bobpk1, bobpk2, privateNode2Url) {
  alicePrivateChainAccount = Account.createFromPrivateKey(alicepk1, NetworkType.MIJIN_TEST);
  alicePrivateChain2Account = Account.createFromPrivateKey(alicepk2, NetworkType.MIJIN_TEST);

  bobPrivateChainAccount = Account.createFromPrivateKey(bobpk2, NetworkType.MIJIN_TEST);
  bobPrivateChain2Account = Account.createFromPrivateKey(bobpk1, NetworkType.MIJIN_TEST);

  privateChainTransactionHttp = new TransactionHttp(privateNodeUrl);
  privateChain2TransactionHttp = new TransactionHttp(privateNode2Url);
  listener1 = new Listener(privateNodeUrl);
  listener2 = new Listener(privateNode2Url);

  random = crypto.randomBytes(10);
  hash = keccak_512.create();
  secret = hash.update(random).hex().toUpperCase();
  proof = random.toString('hex');

  console.log("Secret : " + secret);
  console.log("Proof : " + proof);

});

When('Alice creates, announces and signs secret lock transaction on the private chain', function () {
  // annouce secret lock transaction on chain 1
  tx1 = SecretLockTransaction.create(
    Deadline.create(),
    new Mosaic(new MosaicId('nem:xem'), UInt64.fromUint(10)),
    UInt64.fromUint(5), // 96*60 // assuming one block per minute
    HashType.SHA3_512,
    secret,
    bobPrivateChainAccount.address,
    NetworkType.MIJIN_TEST);

  let tx1Signed = alicePrivateChainAccount.sign(tx1);

  let amountOfConfirmationsToSkip = 5;

  listener1.open().then(() => {

    const newBlockSubscription = listener1
      .newBlock()
      .pipe(timeout(30000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("New block created:" + block.height.compact());
      },
        error => {
          console.error(error);
          listener1.terminate();
        });

    listener1
      .status(alicePrivateChainAccount.address)
      .pipe(filter(error => error.hash === tx1Signed.hash))
      .subscribe(error => {
        console.log("\n❌  :" + error.status);
        newBlockSubscription.unsubscribe();
        listener1.close();
      },
        error => console.error(error));

    listener1
      .confirmed(alicePrivateChainAccount.address)
      .pipe(
        filter(transaction => (transaction.transactionInfo !== undefined
          && transaction.transactionInfo.hash === tx1Signed.hash)),
        mergeMap(transaction => {
          return listener1.newBlock()
            .pipe(
              skip(amountOfConfirmationsToSkip),
              first(),
              map(ignored => transaction))
        })
      )
      .subscribe(ignored => {
        console.log("✅: Transaction confirmed");
        newBlockSubscription.unsubscribe();
        listener1.close();
      }, error => console.error(error));

    privateChainTransactionHttp
      .announce(tx1Signed)
      .subscribe(x => console.log(x), err => console.error(err));
    console.log("Tx1 hash: " + tx1Signed.hash);
  });
});

When('Bob creates, announces and signs secret lock transaction on the public chain', function () {
  tx2 = SecretLockTransaction.create(
    Deadline.create(),
    new Mosaic(new MosaicId('nem:xem'), UInt64.fromUint(10)),
    UInt64.fromUint(3), //84*60 // assuming one block per minute
    HashType.SHA3_512,
    secret,
    alicePrivateChain2Account.address,
    NetworkType.MIJIN_TEST); //MAIN_NET

  let tx2Signed = bobPrivateChain2Account.sign(tx2);

  listener2.open().then(() => {

    const newBlockSubscription = listener2
      .newBlock()
      .pipe(timeout(30000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("New block created:" + block.height.compact());
      },
        error => {
          console.error(error);
          listener2.terminate();
        });

    listener2
      .status(bobPrivateChain2Account.address)
      .pipe(filter(error => error.hash === tx2Signed.hash))
      .subscribe(error => {
        console.log("\n❌  :" + error.status);
        newBlockSubscription.unsubscribe();
        listener2.close();
      },
        error => console.error(error));


    listener2
      .confirmed(bobPrivateChain2Account.address)
      .pipe(
        filter(transaction => (transaction.transactionInfo !== undefined
          && transaction.transactionInfo.hash === tx2Signed.hash)),
        mergeMap(transaction => {
          return listener2.newBlock()
            .pipe(
              skip(amountOfConfirmationsToSkip),
              first(),
              map(ignored => transaction))
        })
      )
      .subscribe(ignored => {
        console.log("✅: Transaction confirmed");
        newBlockSubscription.unsubscribe();
        listener2.close();
      }, error => console.error(error));

    privateChain2TransactionHttp
      .announce(tx2Signed)
      .subscribe(x => console.log(x), err => console.error(err));

    console.log("Tx2 hash: " + tx2Signed.hash);
  });
});

Then('Alice can announce a secret proof transaction', function () {
  tx3 = SecretProofTransaction.create(
    Deadline.create(),
    HashType.SHA3_512,
    secret,
    proof,
    NetworkType.MIJIN_TEST); // MAIN_NET

  let tx3Signed = alicePrivateChain2Account.sign(tx3);

  listener2.open().then(() => {

    const newBlockSubscription = listener2
      .newBlock()
      .pipe(timeout(30000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("New block created:" + block.height.compact());
      },
        error => {
          console.error(error);
          listener2.terminate();
        });

    listener2
      .status(alicePrivateChain2Account.address)
      .pipe(filter(error => error.hash === tx3Signed.hash))
      .subscribe(error => {
        console.log("\n❌  :" + error.status);
        newBlockSubscription.unsubscribe();
        listener2.close();
      },
        error => console.error(error));


    listener2
      .confirmed(alicePrivateChain2Account.address)
      .pipe(
        filter(transaction => (transaction.transactionInfo !== undefined
          && transaction.transactionInfo.hash === tx3Signed.hash)),
        mergeMap(transaction => {
          return listener2.newBlock()
            .pipe(
              skip(amountOfConfirmationsToSkip),
              first(),
              map(ignored => transaction))
        })
      )
      .subscribe(ignored => {
        console.log("✅: Transaction confirmed");
        newBlockSubscription.unsubscribe();
        listener2.close();
      }, error => console.error(error));


    privateChain2TransactionHttp
      .announce(tx3Signed)
      .subscribe(x => console.log(x), err => console.error(err));

    console.log("Tx3 hash: " + tx3Signed.hash);
  });
});

Then('Bob can announce a secret proof transaction to unlock funds', function () {
  tx4 = SecretProofTransaction.create(
    Deadline.create(),
    HashType.SHA3_512,
    secret,
    proof,
    NetworkType.MIJIN_TEST);

  let tx4Signed = bobPrivateChainAccount.sign(tx4);

  listener1.open().then(() => {

    const newBlockSubscription = listener1
      .newBlock()
      .pipe(timeout(30000)) // time in milliseconds when to timeout.
      .subscribe(block => {
        console.log("New block created:" + block.height.compact());
      },
        error => {
          console.error(error);
          listener1.terminate();
        });

    listener1
      .status(bobPrivateChain2Account.address)
      .pipe(filter(error => error.hash === tx4Signed.hash))
      .subscribe(error => {
        console.log("\n❌  :" + error.status);
        newBlockSubscription.unsubscribe();
        listener1.close();
      },
        error => console.error(error));

    listener1
      .confirmed(bobPrivateChain2Account.address)
      .pipe(
        filter(transaction => (transaction.transactionInfo !== undefined
          && transaction.transactionInfo.hash === tx4Signed.hash)),
        mergeMap(transaction => {
          return listener1.newBlock()
            .pipe(
              skip(amountOfConfirmationsToSkip),
              first(),
              map(ignored => transaction))
        })
      )
      .subscribe(ignored => {
        console.log("✅: Transaction confirmed");
        newBlockSubscription.unsubscribe();
        listener1.close();
      }, error => console.error(error));

    privateChainTransactionHttp
      .announce(tx4Signed)
      .subscribe(x => console.log(x), err => console.error(err));

    console.log("Tx4 hash: " + tx4Signed.hash);
  });
});
