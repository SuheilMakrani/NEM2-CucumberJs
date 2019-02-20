var nem2 = require('nem2-sdk');
const operators = require('rxjs/operators');
const { Given, When, Then } = require('cucumber');

const Account = nem2.Account,
    AccountHttp = nem2.AccountHttp,
    NamespaceHttp = nem2.NamespaceHttp,
    Listener = nem2.Listener,
    CosignatureTransaction = nem2.CosignatureTransaction,
    NetworkType = nem2.NetworkType,
    TransactionHttp = nem2.TransactionHttp,
    mergeMap = operators.mergeMap,
    filter = operators.filter
timeout = operators.timeout,
    map = operators.map;

var cosignAggregateBondedTransaction, cosignatureTransaction, signedCosignTransaction, listener;
var accountHttp, transactionHttp;
var account1, account2;

Given('Alice needs to cosign two accounts aggregate bonded tx', function () {
    //cosign any aggregated bonded transaction

    cosignAggregateBondedTransaction = (transaction, account) => {
        cosignatureTransaction = CosignatureTransaction.create(transaction);

        signedCosignTransaction = account.signCosignatureTransaction(cosignatureTransaction);
        console.log(signedCosignTransaction);
        //console.log(transactionHttp.getTransaction(signedCosignTransaction.parentHash));
        return signedCosignTransaction;
    };
});

When('fetching aggregate bonded transaction to be signed with {string} and {string} from {string}', function (alice_privatekey, bob_privatekey, nodeUrl) {
    transactionHttp = new TransactionHttp(nodeUrl);
    namespaceHttp = new NamespaceHttp(nodeUrl);
    accountHttp = new AccountHttp(nodeUrl);
    listener = new Listener(nodeUrl);

    account1 = Account.createFromPrivateKey(alice_privatekey, NetworkType.MIJIN_TEST);
    account2 = Account.createFromPrivateKey(bob_privatekey, NetworkType.MIJIN_TEST);
});

Then('{string} should cosign pending multiaccount transactions and announce', function (alice_privatekey) {
    listener.open().then(() => {
        const newBlockSubscription = listener
            .newBlock()
            .pipe(timeout(60000)) // time in milliseconds when to timeout.
            .subscribe(block => {
                console.log("New block created:" + block.height.compact());
            },
                error => {
                    console.error(error);
                    listener.terminate();
                });

        accountHttp
            .aggregateBondedTransactions(account1.publicAccount)
            .pipe(
                mergeMap((_) => _),
                filter((_) => !_.signedByAccount(account1.publicAccount)),
                map(transaction => cosignAggregateBondedTransaction(transaction, account1)),
                mergeMap(cosignatureSignedTransaction => transactionHttp.announceAggregateBondedCosignature(cosignatureSignedTransaction))
            )
            .subscribe(announcedTransaction => console.log(announcedTransaction),
                err => console.error(err));

        accountHttp
            .aggregateBondedTransactions(account2.publicAccount)
            .pipe(
                mergeMap((_) => _),
                filter((_) => !_.signedByAccount(account2.publicAccount)),
                map(transaction => cosignAggregateBondedTransaction(transaction, account2)),
                mergeMap(cosignatureSignedTransaction => transactionHttp.announceAggregateBondedCosignature(cosignatureSignedTransaction))
            )
            .subscribe(announcedTransaction => console.log(announcedTransaction),
                err => console.error(err));


        listener
            .status(account1.address)
            .pipe(filter(error => error.hash === announcedTransaction.hash))
            .subscribe(error => {
                console.log("\n❌  :" + error.status);
                newBlockSubscription.unsubscribe();
                listener.close();
            },
                error => console.error(error));

        listener
            .status(account2.address)
            .pipe(filter(error => error.hash === announcedTransaction.hash))
            .subscribe(error => {
                console.log("\n❌  :" + error.status);
                newBlockSubscription.unsubscribe();
                listener.close();
            },
                error => console.error(error));
    });
});
