const express = require('express')
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000 

app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.PROJECT_NAME}:${process.env.PROJECT_PASS}@cluster0.iimwc2a.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const imageCollection = client.db("fitnessHub").collection('images')
const usersCollection = client.db("fitnessHub").collection('users')
const trainerCollection = client.db("fitnessHub").collection('trainers')
const forumPostCollection = client.db("fitnessHub").collection('posts')
const subscriberCollection = client.db("fitnessHub").collection('subscribe')
const confirmTrainerCollection = client.db("fitnessHub").collection('confirmTrainer')
const paymentInfoCollection = client.db("fitnessHub").collection('paymentInfo')
const classCollection = client.db("fitnessHub").collection('class')
const slotCollection = client.db("fitnessHub").collection('slot')
const userPaymentCollection = client.db("fitnessHub").collection('userPayment')
const totalBalanceCollection = client.db("fitnessHub").collection('totalBalance')







// jwt related api 
app.post('/jwt', async(req, res) =>{
  const user = req.body 
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '11hr'})
  res.send({token})
})

// middleware
const verifyToken = (req, res, next)=>{
  console.log('inside verify token', req.headers)
 
  if(!req.headers.authorization){
    return res.status(401).send({message: 'unauthorized access'})
  }
  const token = req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
 
}


// get total balance 
app.get('/getBalance', async(req, res) =>{
  try {
    const result = await totalBalanceCollection.find().toArray()
    res.send(result)

  } catch (error) {
    console.log(error)
  }
})


// verification  admin 
const verifyAdmin = async(req, res, next) =>{
  const email = req.decoded.email 
  const query = {email: email}
  const user = await usersCollection.findOne(query)
  console.log(user)
  const isAdmin = user?.role === 'admin'
  if(!isAdmin){
    return res.status(403).send({message: 'forbidden access'})
  }
  next()
}



// slot collections 
app.post('/slot', async(req, res) =>{
  try {
    const slots = req.body
    const result = await slotCollection.insertMany(slots)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})


// get slot data 
app.get('/getslot', async (req, res) =>{
  try {
      const result = await slotCollection.find().toArray()
      res.send(result)
  } catch (error) {
    console.log(error)
  }
})

// edit slot button status by trainer 
app.patch('/slots/status/:id',verifyToken,async( req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const updatedDoc ={
      $set:{
        status:'rejected'
      }
    }
    const result = await slotCollection.updateOne(query, updatedDoc)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})



// get slot by email 





// get a specific slot 
app.get('/getslot/:id', verifyToken, async(req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const result = await slotCollection.findOne(query)
    res.send(result)
  } catch (error) {
    
  }
})

// put using slotCollection 

app.put('/putslot/:id',verifyToken, async(req, res) =>{
  try {
    const id = req.params.id 
    const info = req.body 
    console.log(info)
    const filter = {_id: new ObjectId(id)}
    const option = {upsert: true}
    const updateDoc = {
      $set:{
        package: info.package ,
        price: info.price,
        user: info.user
      }
    }
    const  result = await slotCollection.updateOne(filter, updateDoc, option)
    res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

// get slot by specific email 
app.get('/yourslot/:email', verifyToken, async(req, res) =>{
  try {
    const query = {email: req.params.email}
    const result = await slotCollection.find(query).toArray()
    console.log(result)
    res.send(result)
    console.log(query)
  } catch (error) {
    console.log(error)
  }
})


// image collection
app.get('/images',  async(req, res) =>{
 try {
  const result = await imageCollection.find().toArray()
  res.send(result)
  
 } catch (error) {
  console.log(error)
 }
})


// get user information when user create account 
app.post('/users', async(req, res) =>{
 try {
  const user = req.body 

  // insert email if user do not exists 
  const query = {email: user.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser){
    return res.send({message: 'user already exist', insertedId: null})
  }
  const result = await usersCollection.insertOne(user)
  res.send(result)
  
 } catch (error) {
  console.log(error)
 }
})

// put users 

app.put('/users/:id', verifyToken, async(req, res) =>{
  try {
    const id = req.params.id 
    const user = req.body 
    const filter = {_id: new ObjectId(id)}
    const option = {upsert: true}
    const updateDoc = {
      $set:{
        name: user.name ,
        photo: user.photo,
        number: user.number,
        address: user.address
      }
    }
    const  result = await usersCollection.updateOne(filter, updateDoc, option)
    res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

// get all users 
app.get('/alluser',  async(req, res) =>{
  try {
   const result = await usersCollection.find().toArray()
   res.send(result)
   
  } catch (error) {
   console.log(error)
  }
 })

// edits user roll 
app.patch('/users/role/:id',verifyToken, verifyAdmin, async( req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const updatedDoc ={
      $set:{
        role:'trainer'
      }
    }
    const result = await usersCollection.updateOne(query, updatedDoc)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})

// get users by email 
app.get('/allusers/:email',  async(req, res) =>{
  const query = {email: req.params.email}
  const result = await usersCollection.find(query).toArray()
  res.send(result)
})



// store be trainer value 
app.post('/betrainer',   async(req, res) =>{
 try {
  const item = req.body 
  // if (item._id) {
  //   delete item._id; // Remove the _id field if it's present
  // }
  const result = await trainerCollection.insertOne(item)
  res.send(result)
  
 } catch (error) {
  console.log(error)
 }
})

// get the all trainer data 
app.get('/trainers',   async(req, res) =>{
  try {
   const result = await trainerCollection.find().toArray()
   res.send(result)
   
  } catch (error) {
   console.log(error)
  }
 })


//  edit trainer status 
app.patch('/trainers/status/:id', verifyToken, async( req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const updatedDoc ={
      $set:{
        status:'rejected'
      }
    }
    const result = await trainerCollection.updateOne(query, updatedDoc)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})
 
// get the all trainer data 
app.get('/trainers/:id', verifyToken, async(req, res) =>{
  try {
    const id = req.params.id 
  const query = {_id: new ObjectId(id)}
  const result = await trainerCollection.findOne(query)
  res.send(result)
  } catch (error) {
   console.log(error)
  }
 })
 
 
//  post forum 
app.post('/posts', async(req, res) =>{
  try {
    const post = req.body 
    const result = await forumPostCollection.insertOne(post)
    res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

// get post data 
app.get('/blog', async (req, res) =>{
  try {
    const result = await forumPostCollection.find().toArray()
    res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

// get a single blog by id 
app.get('/blog/:id',  async(req, res) =>{
  try {
    const id = req.params.id 
  const query = {_id: new ObjectId(id)}
  const result = await forumPostCollection.findOne(query)
  res.send(result)
  } catch (error) {
   console.log(error)
  }
 })
 


// get post data 
app.get('/allpost',  async(req, res) =>{
  try {
    const data = req.query 
    // console.log(data)
    const page = parseInt(req.query.page)
    const size = parseInt(req.query.size)
    console.log('page', page, size)
    const count = await forumPostCollection.estimatedDocumentCount()
    const result = await forumPostCollection.find().skip(page*size).limit(size).toArray()
    res.send({result, count})
  } catch (error) {
    console.log(error)
  }
})


// post class collections 

app.post('/classes', verifyToken, async(req, res) =>{
  try {
    const classes = req.body
    const result = await classCollection.insertOne(classes)
    res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

// get class 
app.get('/getclass', async(req, res) =>{
  try {
    const result = await classCollection.find().toArray()
    res.send(result)
    
  } catch (error) {
    console.log(error)
  }
})

// get a class 
app.get('/getclassdetails/:id', async(req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const result = await classCollection.findOne(query)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})


// subscriber collections in the home page 
app.post('/subscriber', async(req, res) =>{
  try {
    const subscriber = req.body 
    const result = await subscriberCollection.insertOne(subscriber)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})


// get all subscribers 
app.get('/allsubscriber',verifyToken, verifyAdmin, async(req, res) =>{
  try {
    const result = await subscriberCollection.find().toArray()
    res.send(result)
    
  } catch (error) {
    console.log(collection)
  }
})


// confirm trainer api 
app.post('/confirm/trainer', verifyToken, verifyAdmin,  async(req, res) =>{
try {
  const trainer = req.body 
  const result = await confirmTrainerCollection.insertOne(trainer)

  // delete applied data to the trainerCollection 
  const query = { _id: new ObjectId(trainer.trainerId) };
  const deleteResult = await trainerCollection.deleteOne(query);
  console.log(trainer)
  res.send(result)

  
} catch (error) {
  console.log(error)
}
})

// get confirm collections data 
app.get('/accepttrainer', async(req, res) =>{
 try {
  const result = await confirmTrainerCollection.find().toArray()
  res.send(result)
 } catch (error) {
  console.log(error)
 }
})


// get a aspecific trainer 
app.get('/accepttrainer/:id', async(req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const result = await confirmTrainerCollection.findOne(query)
    res.send(result)
  } catch (error) {
    
  }
})

// update payment  status 
app.patch('/accepttrainer/role/:id',verifyToken, verifyAdmin, async( req, res) =>{
  try {
    const id = req.params.id 
    const query = {_id: new ObjectId(id)}
    const updatedDoc ={
      $set:{
        paymentStatus:'Paid'
      }
    }
    const result = await confirmTrainerCollection.updateOne(query, updatedDoc)
    res.send(result)
  } catch (error) {
    console.log(error)
  }
})


// payment data 
app.post('/payment', verifyToken, async(req, res) =>{
 try {
  const payment = req.body 
  const result = await paymentInfoCollection.insertOne(payment)
  res.send(result)
 } catch (error) {
  console.log(error)
 }

})

// get info 
app.get('/remaininbalance', verifyToken, verifyAdmin, async(req, res) =>{
  try {
   const result = await paymentInfoCollection.find().toArray()
   res.send(result)
  } catch (error) {
   console.log(error)
  }
 })
 

// const user payment collections
app.post('/userpayment', verifyToken,  async(req, res) =>{
  try {
   const payment = req.body 
   console.log(req.body)
   const result = await userPaymentCollection.insertOne(payment)
   res.send(result)
  } catch (error) {
   console.log(error)
  }
 
 })

//  get user payment collections 
app.get('/memberPay', verifyToken, async(req, res) =>{
  try {
   const result = await userPaymentCollection.find().toArray()
   res.send(result)
  } catch (error) {
   console.log(error)
  }
 })
 
 


// payment related api 

app.post('/make-payment-intent', async (req, res) => {
  const { price } = req.body;
console.log("price",price)
  const amount = parseFloat(price);
  if (isNaN(amount)) {
    return res.status(400).send({ error: 'Invalid price value' });
  }

  const amountInCents = (amount * 100)
console.log('price', amount)
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error(' payment intent:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('FitnessHub Server is Running')
})

app.listen(port, () =>{
    console.log(`Fitness is Running ${port}`)
})