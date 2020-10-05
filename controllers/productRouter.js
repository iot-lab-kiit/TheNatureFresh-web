const express = require('express')
const productRouter = express.Router()
const database = require('../database/dbinit')
const db = database.db

productRouter.get('/', async (req, res) => {
    // console.log('get all products')
    const snapshots = await db.collection('products').get();
    let products = []
    snapshots.forEach(snapshot => {
        products.push(snapshot.data())
    })
    res.status(200).json(products);

})

productRouter.post('/add', async (req, res) => {
    // console.log('add product')
    const product = req.body;
    const document = await db.collection('products').doc()
    await document.set({
        id: document.id,
        ...product
    })
    res.status(201).json(product)
})

productRouter.post('/update/:id', async (req, res) => {
    // console.log('get update product')
    // console.log(req.body)
    const itemId = req.params.id
    if (!itemId) {
        res.status(401).json({ error: 'Id not provided' })
    }
    const {
        item_name,
        price,
        item_description,
        qty_available
    } = req.body;
    const batch = db.batch();
    const docRef = await db.collection('products').doc(itemId);
    batch.update(docRef, { item_name: item_name })
    batch.update(docRef, { item_description: item_description })
    batch.update(docRef, { price: price })
    batch.update(docRef, { qty_available: qty_available })
    await batch.commit();
    res.status(201).send('Success')
})

productRouter.delete('/delete/:id', async (req, res) => {
    // console.log('delete product')
    const itemId = req.params.id
    if (!itemId) {
        res.status(401).json({ error: "ID not provided" })
    }
    //Delete item and return status code
})

productRouter.get('/details/:id', async (req, res) => {
    // console.log('get product by id')
    const id = req.params.id;
    const product = await getProductByID(id)
    res.json(product)
})

const getProductByID = async (id) => {
    try {
        const product = []
        const snap = await db
            .collection("products")
            .where("id", "==", id)
            .get();
        snap.forEach((doc) => {
            product.push(doc.data())
        })
        return product[0]

    } catch (error) {
        console.log(error)
        throw 'No Such Product'
    }
}

module.exports = productRouter