const express = require('express')
const orderRouter = express.Router()
const database = require('../database/dbinit')
const { getOrders, createOrder,getOrderByUserID,getOrderByOrderID } = require('../database/order')
const db = database.db

orderRouter.get('/',async (req,res) => {
    console.log('get all orders')
    const orders = await getOrders()
    res.json(orders)
})

orderRouter.get('/:id',async (req,res)=>{
    console.log('get order by user id')
    const id = req.params.id;
    const orderList = await getOrderByUserID(id)
    res.json(orderList)
})

orderRouter.get('/ord/:id',async (req,res)=>{
    console.log('get order by order id')
    const id = req.params.id;
    const orderList = await getOrderByOrderID(id)
    res.json(orderList)
})

module.exports = orderRouter
