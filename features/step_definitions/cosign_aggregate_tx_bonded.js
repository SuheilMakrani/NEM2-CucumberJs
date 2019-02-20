var nem2 = require('nem2-sdk');
const operators = require('rxjs/operators');
const { Given, When, Then } = require('cucumber');

const Account = nem2.Account,
  AccountHttp = nem2.AccountHttp,
  NamespaceHttp = nem2.NamespaceHttp,
  CosignatureTransaction = nem2.CosignatureTransaction,
  NetworkType = nem2.NetworkType,
  TransactionHttp = nem2.TransactionHttp,
  mergeMap = operators.mergeMap,
  filter = operators.filter,
  map = operators.map;

let cosignAggregateBondedTransaction, cosignatureTransaction, signedCosignTransaction, listener;
let accountHttp, transactionHttp;
let account;

Given('Alice needs to cosign any aggregate bonded transaction', function () {
  //cosign any aggregated bonded transaction

  cosignAggregateBondedTransaction = (transaction, account) => {
    cosignatureTransaction = CosignatureTransaction.create(transaction);
    signedCosignTransaction = account.signCosignatureTransaction(cosignatureTransaction);
    console.log(signedCosignTransaction);
    //console.log(transactionHttp.getTransaction(signedCosignTransaction.parentHash));
    return signedCosignTransaction;
  };
});

When('fetching all aggregate bonded transaction to be signed with {string} from {string}', function (alice_privatekey, nodeUrl) {
  transactionHttp = new TransactionHttp(nodeUrl);
  namespaceHttp = new NamespaceHttp(nodeUrl);
  accountHttp = new AccountHttp(nodeUrl);

  account = Account.createFromPrivateKey(alice_privatekey, NetworkType.MIJIN_TEST);
});

Then('Alice should cosign all pending transaction and announce the transaction', function () {

  accountHttp
    .aggregateBondedTransactions(account.publicAccount)
    .pipe(
      mergeMap((_) => _),
      filter((_) => !_.signedByAccount(account.publicAccount)),
      map(transaction => cosignAggregateBondedTransaction(transaction, account)),
      mergeMap(cosignatureSignedTransaction => transactionHttp.announceAggregateBondedCosignature(cosignatureSignedTransaction))
    )
    .subscribe(announcedTransaction => console.log(announcedTransaction),
      err => console.error(err));
});