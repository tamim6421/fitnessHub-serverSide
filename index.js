const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()

const port = process.env.PORT || 5000 


app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
app.patch('/users/role/:id', async( req, res) =>{
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
app.get('/allusers/:email', async(req, res) =>{
  const query = {email: req.params.email}
  const result = await usersCollection.find(query).toArray()
  res.send(result)
})



// store be trainer value 
app.post('/betrainer',  async(req, res) =>{
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
app.get('/trainers',  async(req, res) =>{
  try {
   const result = await trainerCollection.find().toArray()
   res.send(result)
   
  } catch (error) {
   console.log(error)
  }
 })
 
// get the all trainer data 
app.get('/trainers/:id',  async(req, res) =>{
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
app.get('/allpost', async(req, res) =>{
  try {
    const data = req.query 
    console.log(data)
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
app.get('/allsubscriber', async(req, res) =>{
  try {
    const result = await subscriberCollection.find().toArray()
    res.send(result)
    
  } catch (error) {
    console.log(collection)
  }
})


// confirm trainer api 
app.post('/confirm/trainer', async(req, res) =>{
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