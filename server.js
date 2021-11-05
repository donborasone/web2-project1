const express = require('express');
var fs = require('fs')
var https = require('https')
const app = express();

const dotenv = require('dotenv');
dotenv.config();

app.use(express.static('public'));
app.set('view engine', 'ejs')

const { auth, requiresAuth } = require('express-openid-connect'); 
const { stringify } = require('querystring');
const port = 4080;

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

var log = [
  ["pero.peric@fer.hr", 45.78447, 15.946051, new Date().toLocaleString('hr-BA')],
  ["marko.boras@foi.hr", 44.78447, 14.946051, new Date().toLocaleString('hr-BA')],
  ["nika.katura@fbf.hr", 47.78447, 13.946051, new Date().toLocaleString('hr-BA')],
  ["toni.rezic@fer.hr", 42.78447, 13.946051, new Date().toLocaleString('hr-BA')],
  ["stjepan.mlakic@fer.hr", 41.78447, 20.946051, new Date().toLocaleString('hr-BA')]
]

app.get('/private/:latitude/:longitude', requiresAuth(), function (req, res) {    
    const user = JSON.stringify(req.oidc.user);
    let latitude = req.params.latitude
    let longitude = req.params.longitude
    let time = new Date().toLocaleString('hr-BA')
    let found = -1
    for(let i in log){
      let data = log[i]
      let name = data[0]
      if(name === req.oidc.user.name)
        found = i
    }
    if(found === -1){
      log.push([req.oidc.user.name, latitude, longitude, time])
      if(log.length > 5)
        log.shift()
    }
    else{
      log[found][1] = latitude
      log[found][2] = longitude
      log[found][3] = time
    }
    res.render('private', {
      user: user,
      users: JSON.stringify(log)
    }); 
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