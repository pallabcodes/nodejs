class Shipment {
    update({id, userName}) {
        console.log(`[${id}]: [shipment] will pack the user's order to [${userName}]`)

    }
}

module.exports = Shipment;