class Payment {
    constructor(paymentSubject) {
        this.paymentSubject = paymentSubject
    }

    creditCard({ id, userName, age }) {
        console.log(`\na payment occurred from ${userName}`)
        this.paymentSubject.notify({ id, userName })
    }
}

module.exports = Payment