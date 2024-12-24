import { Hono } from 'hono'
import {  PrismaClient } from '@prisma/client/edge'  // import client from this @prisma/client/edge instead of client/prisam
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign,verify } from 'hono/jwt'


// const secretKey = 'mysecret'
const app = new Hono<{
  Bindings:{
    DATABASE_URL:string,
    JWT_SECRET:string
  }
}>()

type bodyprops = {
  name:string
  email:string,
  password:string
}

// Auth middlewere
app.use('/api/v1/blog/*',async (c,next)=>{

const header = c.req.header('Authorization')

const token = header?.split(" ")[1]

if(!token){
  return c.json({err:"token not found"});
}

const response = await verify(token,c.env.JWT_SECRET)
if(response.id){
  // c.set('userId',response.id)
   await  next()
}

c.status(403)
return c.json({error:"unauthorized"})

})


app.post('/api/v1/user/signup',async(c)=>{

  console.log("DB url----",c.env.DATABASE_URL)
  
 try {

  const prisma = new PrismaClient({  // coonnect db on every route hit
    // datasourceUrl:c.env.DATABASE_URL,
    datasources:{
      db:{
        url:c.env.DATABASE_URL
      }
    }
  }).$extends(withAccelerate())

    const body:bodyprops = await c.req.json()

   const CreatedUser = await prisma.user.create({
      data:{
        name:body.name,
        email:body.email,
        password:body.password
      }
    })
    console.log("createdUser--",CreatedUser)

    if(!CreatedUser){
      c.status(403)
      return c.json({error:"user not created"})
    }

    const payload = {
      id:CreatedUser.id,
      email:CreatedUser.email
    }

   const token = await sign(payload,c.env.JWT_SECRET)

   return c.json({
    token:token
   })

 } catch (error) {
  
  console.log("error while signup",error)
 }

})

app.post('/api/v1/user/signin',async(c)=>{
  // return c.text('signin api')

  
  const prisma = new PrismaClient({  // coonnect db on every route hit
    // datasourceUrl:c.env.DATABASE_URL,
    datasources:{
      db:{
        url:c.env.DATABASE_URL
      }
    }
  }).$extends(withAccelerate())

  const body = await c.req.json()

 const user = await prisma.user.findUnique({
    where:{
      email:body.email
    }
  })

  if(!user){
    c.status(403)
    return c.json({error:"user not found"})
  }

  const payload = {
    id:user.id,
    email:user.email
  }

 const token = await sign(payload,c.env.JWT_SECRET)

 return c.json({token:token})

})

app.post('/api/v1/blog',(c)=>{
  return c.text('create blog')
})

app.put('/api/v1/blog',(c)=>{
  return c.text('update blog')
})

app.get('/api/v1/blog/:id',(c)=>{
  return c.text('get specific blog')
})

app.get('/api/v1/blog/bulk',(c)=>{
  return c.text('get all blogs')
})

export default app
