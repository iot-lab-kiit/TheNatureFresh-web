const database = require('./dbinit')
const db = database.db
var admin = require("firebase-admin")
const getOrders = async () => {
    try {
        const orders = []
        const snapshot = await db.collection('orders').orderBy('orderid', 'desc').get()
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

    order.cart.products.forEach(async (item) => {
        const productRef = db.collection('products').doc(item.id);
        try {
            const res = await db.runTransaction(async t => {
                const doc = await t.get(productRef);
                const newQty = doc.data().qty_available - item.qty_purchased;
                if (newQty >= 0) {
                    await t.update(productRef, { qty_available: newQty });
                    console.log(`qty_available set to ${newQty}`);
                } else {
                    throw 'Sorry! qty_available is invalid';
                }
            });
            console.log('Transaction success');
        } catch (e) {
            console.log('Transaction failure:', e);
        }
    })
    const dataRef = await (await db.collection('references').doc('orders').get('orderId')).data()
    const orderid = dataRef.orderId 
    console.log(orderid)
    const increment = admin.firestore.FieldValue.increment(1)
    const document = db.collection('orders').doc()
    document.create({
        id: document.id,
        orderid : orderid,
        ...order
    })
    const updateRef = db.collection('references').doc('orders').update({orderId:increment})
    return order
}

const getOrderByUserID = async (id) => {
    try {
        const orderList = []
        const snap = await db
            .collection("orders")
            .where("user_id", "==", id).orderBy('orderid', 'desc')
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
            .where("orderid", "==", parseInt(id))
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

const updateStatus = async (id, status) => {
    try {
        const Ref = db.collection('orders').doc(id)
        const res = await Ref.update(status)
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = { getOrders, createOrder, getOrderByUserID, getOrderByOrderID, updateStatus }