const express = require('express')
const { app } = require('firebase-admin')
const productRouter = express.Router()
const database = require('../database/dbinit')
const db = database.db

productRouter.get('/',async (req,res,next) => {
    console.log('get all products')
    const snapshots = await db.collection('products').get();
    let products = []
    snapshots.forEach(snapshot => {
        products.push(snapshot.data())
        console.log(snapshot.data())
    })
    res.status(200).json(products);

})

productRouter.post('/add',async (req,res,next) => {
    console.log('add product')
    const product = req.body;
    const document = await db.collection('products').doc()
    await document.set({
        id:document.id,
        ...product
    })
    res.status(201).json(product)
})

productRouter.post('/update/:id',async (req,res,next) => {
    console.log('get update product')
    const itemId = req.params.id
    if(!itemId){
        res.status(401).json({error:'Id not provided'})
    }
    const snapshot = await db.collection('products').document(itemId).get()
    await snapshot.update(req.body);
    res.send(201).send()
} )

productRouter.delete('/delete/:id',async (req,res,next) => {
    console.log('delete product')
    const itemId = req.params.id
    if(!itemId){
        res.status(401).json({error:"ID not provided"})
    }
    //Delete item and return status code
})

module.exports = productRouter