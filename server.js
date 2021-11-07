const express = require('express');
var fs = require('fs')
var https = require('https')
const app = express();

const dotenv = require('dotenv');
dotenv.config();

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs')

const { auth, requiresAuth } = require('express-openid-connect'); 
const { stringify } = require('querystring');
const { response } = require('express');
const port = process.env.PORT || 4080;

const config = { 
  authRequired : false,
  idpLogout : true, //login not only from the app, but also from identity provider
  secret: process.env.SECRET,
  baseURL: `https://localhost:${port}`,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: 'https://dev-m1hgw9la.us.auth0.com',
  clientSecret: process.env.CLIENT_SECRET,
  authorizationParams: {
    response_type: 'code' ,
    //scope: "openid profile email"   
   },
};
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.get('/',  function (req, res) {
    req.user = {
        isAuthenticated : req.oidc.isAuthenticated()
    };
    if (req.user.isAuthenticated) {
        req.user.name = req.oidc.user.name;
    }
    res.render('index', {
      user: req.user
    });
});

app.get('/private', requiresAuth(), function (req, res) {    
  const user = JSON.stringify(req.oidc.user);
  res.render('private', {
    user: user
  }); 
});

let log = {
  "pero.peric@fer.hr": [43.78447, 16.946051, new Date().toLocaleString('hr-BA')],
  "marko.boras@foi.hr": [44.78447, 14.946051, new Date().toLocaleString('hr-BA')],
  "nika.katura@fbf.hr": [47.78447, 13.946051, new Date().toLocaleString('hr-BA')],
  "toni.rezic@fer.hr": [42.78447, 13.946051, new Date().toLocaleString('hr-BA')],
  "stjepan.mlakic@fer.hr": [41.78447, 20.946051, new Date().toLocaleString('hr-BA')]
}

let users = [
  "pero.peric@fer.hr", "marko.boras@foi.hr", "nika.katura@fbf.hr", "toni.rezic@fer.hr", "stjepan.mlakic@fer.hr"
]

app.post('/save', requiresAuth(), function(req, res) {
  const user = req.oidc.user.name
  const latitude = req.body.latitude
  const longitude = req.body.longitude
  const time = req.body.time
  if(users.includes(user)){
    console.log(user + ' vec u sustavu')
    log[user][0] = latitude
    log[user][1] = longitude
    log[user][2] = time
  }else{
    users.push(user)
    log[user] = [latitude, longitude, time]
    if(users.length > 6){
      let deletedUser = users.shift()
      delete log[deletedUser]
    }
  }
  res.json({
    status: 'success',
    locations: log
  })
});

app.get("/sign-up", (req, res) => {
  res.oidc.login({
    returnTo: '/',
    authorizationParams: {      
      screen_hint: "signup",
    },
  });
});

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log(`Server running at https://localhost:${port}/`);
  });