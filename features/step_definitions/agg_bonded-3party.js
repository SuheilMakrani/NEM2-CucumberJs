const { Given, When, Then } = require('cucumber');
const nem2 = require('nem2-sdk');
const operators = require('rxjs/operators');

const mergeMap = operators.mergeMap, filter = operators.filter, timeout = operators.timeout;

var aliceAccount, ticketDistributorAccount, ticketDistributorPublicAccount, ticketCounterAccount, ticketCounterPublicAccount;
var transactionHttp, listener;
var aliceToTicketDistributorTx, ticketDistributorToTicketCounterTx, ticketCounterToAliceTx, signedTransaction, aggregateTransaction,
    lockFundsTransactionSigned, lockFundsTransaction;

Given('{string} wants to get a ticket from {string} {string} through a {string} {string} on {string}', function (alicePrivateKey, ticketDistributorPrivateKey, ticketDistributorPublicKey, ticketCounterPrivateKey, ticketCounterPublicKey, nodeUrl) {
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

When('alice creates a transfer transaction to ticket distributor', function () {
    aliceToTicketDistributorTx = nem2.TransferTransaction.create(
        nem2.Deadline.create(),
        ticketDistributorPublicAccount.address,
        [nem2.XEM.createRelative(0.1)],
        nem2.PlainMessage.create('send 0.1 nem:xem to distributor'),
        nem2.NetworkType.MIJIN_TEST);
});

When('ticket distributor creates a transfer transaction to ticket counter', function () {
    ticketDistributorToTicketCounterTx = nem2.TransferTransaction.create(
        nem2.Deadline.create(),
        ticketCounterPublicAccount.address,
        [new nem2.Mosaic(new nem2.MosaicId('nem:xem'), nem2.UInt64.fromUint(1))],
        nem2.PlainMessage.create('send 1 testing:test to Alice'),
        nem2.NetworkType.MIJIN_TEST);
});

When('ticket counter creates a transfer transaction to alice', function () {
    ticketCounterToAliceTx = nem2.TransferTransaction.create(
        nem2.Deadline.create(),
        aliceAccount.address,
        [new nem2.Mosaic(new nem2.MosaicId('nem:xem'), nem2.UInt64.fromUint(1))],
        nem2.PlainMessage.create('send 1 testing:test to Distributor'),
        nem2.NetworkType.MIJIN_TEST);
});

Then('alice wraps all the transactions in an aggregate bonded transaction, signs the transaction', function () {
    aggregateTransaction = nem2.AggregateTransaction.createBonded(
        nem2.Deadline.create(),
        [ticketDistributorToTicketCounterTx.toAggregate(ticketDistributorPublicAccount),
        ticketCounterToAliceTx.toAggregate(ticketCounterPublicAccount),
        aliceToTicketDistributorTx.toAggregate(aliceAccount.publicAccount)],
        nem2.NetworkType.MIJIN_TEST);

    signedTransaction = aliceAccount.sign(aggregateTransaction);
});

Then('alice creates a lock funds transaction to avoid network spamming and signs lock funds transactions', function () {
    lockFundsTransaction = nem2.LockFundsTransaction.create(
        nem2.Deadline.create(),
        nem2.XEM.createRelative(10),
        nem2.UInt64.fromUint(480),
        signedTransaction,
        nem2.NetworkType.MIJIN_TEST);

    lockFundsTransactionSigned = aliceAccount.sign(lockFundsTransaction);
});

Then('Alice announces the lock funds transaction and after its confirmation, aggregate bonded transaction is announced', function () {
    listener.open().then(() => {
        transactionHttp
            .announce(lockFundsTransactionSigned)
            .subscribe(x => console.log(x), err => console.error(err));

        listener
            .unconfirmedAdded(aliceAccount.address)
            .pipe(filter(transaction => (transaction.transactionInfo !== undefined
                && transaction.transactionInfo.hash === lockFundsTransactionSigned.hash)))
            .subscribe(ignored => console.log("\n⏳  Lock Hash Transaction status changed to unconfirmed: " + lockFundsTransactionSigned.hash),
                error => console.error(error));

        //============================Listen to lock funds transaction=============================//

        const newBlockSubscription1 = listener
            .newBlock()
            //.pipe(timeout(60000)) // time in milliseconds when to timeout.
            .subscribe(block => {
                console.log("\n✅  Lock hash transaction through: " + lockFundsTransactionSigned.hash);
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
                newBlockSubscription1.unsubscribe();
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
                console.log("\n✅  Aggregate transaction has been announced: " + signedTransaction.hash);
                newBlockSubscription1.unsubscribe();
                listener.close();
            },
                error => console.error(error));
    });
});