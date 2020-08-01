const database = require('./dbinit')
const db = database.db

const getOrders = async () => {
    try {
        const orders = []
        const snapshot = await db.collection('orders').get();
        snapshot.forEach(order => {
            orders.push(order.data())
        })
        return orders
    } catch (error) {
        console.log(error)
        throw 'OrderNotFound'
    }

}

const createOrder = async order => {
    const document = db.collection('orders').doc()
    document.create({
        id: document.id,
        ...order
    })
}

const getOrderByUserID = async (id) => {
    try {
        const orderList = []
        const snap = await db
            .collection("orders")
            .where("user_id", "==", id)
            .get();
        snap.forEach((doc) => {
            orderList.push(doc.data())
        })
        return orderList

    } catch (error) {
        console.log(error)
        throw 'No Orders Placed'
    }
}

const getOrderByOrderID = async (id) => {
    try {
        const order = []
        const snap = await db
            .collection("orders")
            .where("orderid", "==", id)
            .get();
        snap.forEach((doc) => {
            order.push(doc.data())
        })
        return order[0]

    } catch (error) {
        console.log(error)
        throw 'No Orders Placed'
    }
}

module.exports = { getOrders, createOrder,getOrderByUserID,getOrderByOrderID}