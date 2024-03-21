const express = require("express")
const app = express()
require("dotenv").config()
const cors = require("cors")

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//middelwere  //
app.use(cors())
app.use(express.json())
var jwt = require('jsonwebtoken');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lmsiai7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});








async function run() {
 
    await client.connect();


    const allDnsCollection = client.db('dns-management').collection('allDns')
    const cartsCollection = client.db('dns-management').collection('carts')
    const reviewsCollection = client.db('dns-management').collection('reviews')
    const usersCollection = client.db('dns-management').collection('users')
    const myprofileCollection = client.db('dns-management').collection('myprofiles')
    const paymentCollection = client.db('dns-management').collection('payments')




    function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      console.log(req);
      if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
      }
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
          return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
      });
    }
    
     // use verify admin after verifyToken
    
     const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    



 

app.get("/alldomain", async (req,res)=>{

    foods = await allDnsCollection.find().toArray()
    res.send(foods)
})

app.post("/adddomain",verifyJWT,verifyAdmin, async (req,res)=>{

     const food = req.body
    domains = await allDnsCollection.insertOne(food)

    res.send(domains)
})

app.delete("/deletedomain/:id",verifyJWT, async (req,res)=>{
  const id = req.params.id
  const filter = {_id:new ObjectId(id)}
 deleteItem = await allDnsCollection.deleteOne(filter)

 res.send(deleteItem)
})




app.put("/editdomain/:id",verifyJWT, async (req,res) =>{
  const data = req.body
  const id = req.params.id
   
    const filter ={_id:new ObjectId(id)}
    const options = { upsert: true };
    const updateDoc = {
          $set:data,
        };
    const editItem = await allDnsCollection.updateOne(filter,updateDoc,options)
    res.send(editItem)
})





app.get("/carts", async (req,res)=>{
  const email= req.query.email
  const filter = {email:email}
    foods = await cartsCollection.find(filter).toArray()
    res.send(foods)
})

app.put("/addToCart/:id", async(req,res)=>{

  const id = req.params.id
  const item = req.body
  const filter ={_id:new ObjectId(id)}
  const options = { upsert: true };
  const updateDoc = {
        $set:item,
      };
  const cartItem = await cartsCollection.updateOne(filter,updateDoc,options)
  res.send(cartItem)

})


app.delete("/deleteCartItem/:id", async(req,res)=>{
  
 const id = req.params.id
  const filter = {_id:new ObjectId(id)}
  const cartItem = await cartsCollection.deleteOne(filter)
  res.send(cartItem)

})




app.put("/updateCartItem/:id", async(req,res)=>{

  const id = req.params.id
  const item = req.body
  const filter ={_id:new ObjectId(id)}
  const options = { upsert: true };
  const updateDoc = {
        $set:item,
      };
  const cartItem = await cartsCollection.updateOne(filter,updateDoc,options)
  res.send(cartItem)

})


app.get('/reviews',async(req,res)=>{
  const reviews = await reviewsCollection.find().toArray()
  res.send(reviews)
})

app.post('/addreview',async(req,res)=>{
  const review = req.body
    const result = await reviewsCollection.insertOne(review)
    res.send(result)
   
})


app.put('/user/:email', async (req, res) => {
  const email = req.params.email;
  const user = req.body;
  const filter = { email: email };
  const options = { upsert: true };
  const updateDoc = {
    $set: user,
  };
  const result = await usersCollection.updateOne(filter, updateDoc, options);
  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
  res.send({ result, token });
})


app.get("/user/myprofile/:email",async (req,res)=>{
  const email= req.params.email
  const filter = {email:email}
    profile = await myprofileCollection.findOne(filter)
    res.send(profile)
  
})


app.put("/user/myprofile/:email",async (req,res)=>{

  const email = req.params.email;
      const profile = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: profile,
      };
      const result = await myprofileCollection.updateOne(filter, updateDoc, options);
      
      res.send(result);


})




// payment//

app.post('/create-payment-intent', async(req,res)=>{

  const {totalSum} = req.body 
  const totalAmount = (totalSum * 100) ;
  const paymentIntent = await stripe.paymentIntents.create({
    amount:totalAmount ,
    currency: "usd",
    payment_method_types:['card'],
    
  })
  
  res.send({clientSecret:paymentIntent.client_secret})
  
   })
   
  
   app.post('/payment/:email',verifyJWT,async(req,res)=>{
     const email = req.params.email
     const payment = req.body 
     const filter ={email:email}
     const deleteResult = await cartsCollection.deleteMany(filter)
     const result = await paymentCollection.insertOne(payment)
  res.send({deleteResult, result})
   })


  //  payment mathood close //


  app.get('/users' ,verifyJWT,async(req,res)=>{
    users = await usersCollection.find().toArray()
    res.send(users)
  })

  app.put("/users/admin/:email",async(req, res)=>{
    const email = req.params.email;
    const filter = { email: email };
    const updateDoc = {
      $set: { role: 'admin' },
    };
  
    const admin = await usersCollection.updateOne(filter, updateDoc);
    res.send(admin)
  })

  app.get("/users/admin/:email", async(req,res)=>{

    const email = req.params.email;
    const filter = { email: email };
    const user = await usersCollection.findOne(filter);
    const isAdmin = user?.role === 'admin';
    res.send({admin: isAdmin})

  })


app.get("/allorders" ,verifyJWT,async(req,res)=>{

  const allorders = await paymentCollection.find().toArray()
  res.send(allorders)

} )

app.get("/myorders/:email",verifyJWT,async(req,res)=>{
  const email= req.params.email
  const filter = {email:email}
  const myorders = await paymentCollection.find(filter).toArray()
  res.send(myorders)

})


app.delete("/admincancelorder/:id", verifyJWT ,async(req,res)=>{
  const id = req.params.id
 
  const filter={_id:new ObjectId(id)}

cancelorder = await paymentCollection.deleteOne(filter) 
res.send(cancelorder)

})





  
  }

  




run().catch(console.dir);


app.get("/",(req,res) =>{
res.send("server is running")
})
app.listen(port,()=>{
    console.log(`server is running :${port}`);
})