const express = require('express')
const orderRouter = express.Router()
const database = require('../database/dbinit')
const { getOrders, createOrder,getOrderByUserID,getOrderByOrderID ,updateStatus  } = require('../database/order')
const order = require('../database/order')
const db = database.db

orderRouter.get('/',async (req,res) => {
    // console.log('get all orders')
    const orders = await getOrders()
    res.json(orders)
})

orderRouter.get('/:id',async (req,res)=>{
    // console.log('get order by user id')
    const id = req.params.id;
    const orderList = await getOrderByUserID(id)
    res.json(orderList)
})

orderRouter.get('/ord/:id',async (req,res)=>{
    // console.log('get order by order id')
    const id = req.params.id;
    const orderList = await getOrderByOrderID(id)
    res.json(orderList)
})

orderRouter.post('/create', async(req,res)=>{
    const order  = await createOrder(req.body)
    res.json(order)
})

orderRouter.post('/status/:id',async (req,res)=>{
    const status = req.body;
    var result = await updateStatus(req.params.id,status);
    result == true ? res.status(200).json({success:1}) :  res.status(400).json({success:0})
})

module.exports = orderRouter
