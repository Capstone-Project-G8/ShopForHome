const Order = require('../models/order');
const Product = require('../models/product');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const user = require('../models/user');
// Create a new order   =>  /api/v1/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo

    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(200).json({
        success: true,
        order
    })
})


// Get single order   =>   /api/v1/order/:id
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')

    if (!order) {
        return next(new ErrorHandler('No Order found with this ID', 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})

// Get logged in user orders   =>   /api/v1/orders/me
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })

    res.status(200).json({
        success: true,
        orders
    })
})


// Get all orders - ADMIN  =>   /api/v1/admin/orders/
exports.allOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find()

    let totalAmount = 0;

    orders.forEach(order => {
        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
})

// Update / Process order - ADMIN  =>   /api/v1/admin/order/:id
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
    console.log('start updated')
    if (order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('You have already delivered this order', 400))
    }

    order.orderItems.forEach(async item => {
        await updateStock(item.product, item.quantity)
    })

    order.orderStatus = req.body.status,
        order.deliveredAt = Date.now()

    await order.save()

    res.status(200).json({
        success: true,
    })
})

async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })
}

// Delete order   =>   /api/v1/admin/order/:id
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id)

    if (!order) {
        return next(new ErrorHandler('No Order found with this ID', 404))
    }

    await order.remove()

    res.status(200).json({
        success: true
    })
})


//send mail when stock is less than 10
exports.sendStockMail = catchAsyncErrors(async (req,res,next)=>{
    try{
        console.log('mailstart')
        const admin = "jayashree.dasari2000@gmail.com"
        console.log('stock' + req.body)
                await sendEmail({
                email: admin,
                subject: "ShopForHome Stock Update",
                message:'please update your stock',
                })
                console.log('mailend')
    res.status(200).json({
        success:true,
        message: `Email sent to ${'jayashree'}`,
    });}
    catch(error){
        return next(new ErrorHandler(error.message,500));    
    }
});


    //  exports.sendStockMail = catchAsyncErrors(async(req,res,next)=>{
    //     const admin = "jayashree.dasari2000@gmail.com"
    //     // await User.findOne({ email: req.body.email });
    //     console.log(req.body)
    
    //     // let outOfStock= 0;
    //     // products.forEach((product) => {
    //     // if (product.stock <= 10 || outOfStock==0) {
    //     //     const message = `This product ${product.name} is empty.`;
    //     //     try {
    //     //       await sendEmail({
    //     //         email: admin.email,
    //     //         subject: "ShopForHome Stock Update",
    //     //         message,
    //     //        });
    
    //         res.status(200).json({
    //             success: true,
    //             message: `Email sent to: ${'jayashree'}`,
    //         });
    //         } catch (error) {
    //             return next(new ErrorHandler(error.message, 500));
    //         }
    //      } );
    