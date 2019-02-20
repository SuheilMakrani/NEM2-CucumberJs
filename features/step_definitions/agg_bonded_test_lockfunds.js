const { Given, When, Then } = require('cucumber');
const nem2 = require('nem2-sdk');
const operators = require('rxjs/operators');

const mergeMap = operators.mergeMap, filter = operators.filter, timeout = operators.timeout;

var aliceAccount, ticketDistributorAccount, ticketDistributorPublicAccount, ticketCounterPublicAccount;
var transactionHttp, listener;
var ticketCounterToTicketDistributorTx, ticketDistributorToTicketCounterTx, signedTransaction, aggregateTransaction,
    lockFundsTransactionSigned, lockFundsTransaction;

Given('{string} wants to buy a ticket from {string} {string} through a {string} {string} on {string}', function (alicePrivateKey, ticketDistributorPrivateKey, ticketDistributorPublicKey, ticketCounterPrivateKey, ticketCounterPublicKey, nodeUrl) {
    transactionHttp = new nem2.TransactionHttp(nodeUrl);
    listener = new nem2.Listener(nodeUrl);
    // party #1
    aliceAccount = nem2.Account.createFromPrivateKey(alicePrivateKey, nem2.NetworkType.MIJIN_TEST);
    // party #2
    ticketDistributorPublicAccount = nem2.PublicAccount.createFromPublicKey(ticketDistributorPublicKey, nem2.NetworkType.MIJIN_TEST);
    ticketDistributorAccount = nem2.Account.createFromPrivateKey(ticketDistributorPrivateKey, nem2.NetworkType.MIJIN_TEST);
    // party #3
    ticketCounterAccount = nem2.Account.createFromPrivateKey(ticketCounterPrivateKey, nem2.NetworkType.MIJIN_TEST);
    ticketCounterPublicAccount = nem2.PublicAccount.createFromPublicKey(ticketCounterPublicKey, nem2.NetworkType.MIJIN_TEST);
});

When('alice creates a transfer tx to ticket distributor', function () {
    ticketCounterToTicketDistributorTx  = nem2.TransferTransaction.create(
        nem2.Deadline.create(),
        ticketDistributorPublicAccount.address,
        [nem2.XEM.createRelative(0.1)],
        nem2.PlainMessage.create('send 0.1 nem:xem to distributor'),
        nem2.NetworkType.MIJIN_TEST);

    console.log("Send 0.1 XEM to ticketDistributor : " + JSON.stringify(ticketDistributorPublicAccount.address));

});

When('ticket distributor creates a transfer tx to ticket counter', function () {
    ticketDistributorToTicketCounterTx = nem2.TransferTransaction.create(
        nem2.Deadline.create(),
        ticketCounterPublicAccount.address,
        [new nem2.Mosaic(new nem2.MosaicId('nem:xem'), nem2.UInt64.fromUint(1))],
        nem2.PlainMessage.create('send 1 nem:xem to Alice'),
        nem2.NetworkType.MIJIN_TEST);

    console.log("Send 1 nem:xem to ticketCounter : " + JSON.stringify(ticketCounterPublicAccount.address));

});



Then('alice wraps all the tx in an aggregate bonded transaction, signs the transaction', function () {
    aggregateTransaction = nem2.AggregateTransaction.createBonded(
        nem2.Deadline.create(),
        [ticketDistributorToTicketCounterTx.toAggregate(ticketDistributorPublicAccount),
        // here
        ticketCounterToTicketDistributorTx.toAggregate(ticketCounterPublicAccount),],
        nem2.NetworkType.MIJIN_TEST);

    signedTransaction = ticketDistributorAccount.sign(aggregateTransaction);
});

Then('Alice announces the lock funds tx and after its confirmation, aggregate bonded tx is announced', function () {
    lockFundsTransaction = nem2.LockFundsTransaction.create(
        nem2.Deadline.create(),
        nem2.XEM.createRelative(10),
        nem2.UInt64.fromUint(480),
        signedTransaction,
        nem2.NetworkType.MIJIN_TEST);

    lockFundsTransactionSigned = aliceAccount.sign(lockFundsTransaction);
});

Then('alice creates a lockfunds tx to avoid network spamming and signs lock funds tx', function () {
    listener.open().then(() => {
        transactionHttp
            .announce(lockFundsTransactionSigned)
            .subscribe(x => console.log(x), err => console.error(err));
        console.log(lockFundsTransactionSigned.hash);

        //============================Listen to lock funds transaction=============================//

        const newBlockSubscription = listener
            .newBlock()
            .pipe(timeout(60000)) // time in milliseconds when to timeout.
            .subscribe(block => {
                console.log("✅  Lock hash transaction through: " + lockFundsTransactionSigned.hash);
            },
                error => {
                    console.error(error);
                    listener.terminate();
                });

        listener
            .status(aliceAccount.address)
            .pipe(filter(error => error.hash === lockFundsTransactionSigned.hash))
            .subscribe(error => {
                console.log("\n❌  :" + error.status);
                newBlockSubscription.unsubscribe();
                listener.close();
            },
                error => console.error(error));

        //=============================Announce aggregate bonded transaction===============================//

        listener
            .confirmed(aliceAccount.address)
            .pipe(
                filter((transaction) => transaction.transactionInfo !== undefined
                    && transaction.transactionInfo.hash === lockFundsTransactionSigned.hash),
                mergeMap(ignored => transactionHttp.announceAggregateBonded(signedTransaction))
            )
            .subscribe(announcedAggregateBonded => {
                console.log(announcedAggregateBonded);
                console.log("✅  Aggregate transaction hash: " + signedTransaction.hash);
                newBlockSubscription.unsubscribe();
                listener.close();
            },
                error => console.error(error));
    });
});
