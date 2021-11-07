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
  baseURL: process.env.APP_URL || `https://localhost:${port}`,
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

let locationLog = {}

let timeLog = {}

app.get('/private', requiresAuth(), function (req, res) {    
  let userName = req.oidc.user.name
  let loggedInTime = req.oidc.user.updated_at
  timeLog[userName] = loggedInTime
  const user = JSON.stringify(req.oidc.user);
  res.render('private', {
    user: user
  }); 
});

app.post('/save', requiresAuth(), function(req, res) {
  const user = req.oidc.user.name
  const latitude = req.body.latitude
  const longitude = req.body.longitude
  locationLog[user] = [latitude, longitude]
  var userTimes = Object.keys(timeLog).map(function(key) {
    return [key, timeLog[key]];
  });
  userTimes = userTimes.sort((a,b) => (a[1] < b[1]) ? 1 : ((b[1] < a[1]) ? -1 : 0))
  userTimes = userTimes.slice(0, 5)
  let locations = {}
  for(let value of userTimes){
    let userName = value[0]
    let userTime = value[1]
    let userLatitude = locationLog[userName][0]
    let userLongitude = locationLog[userName][1]
    locations[userName] = [userLatitude, userLongitude, new Date(userTime).toLocaleString()]
  }
  res.json({
    status: 'success',
    locations: locations
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

if(process.env.PORT){
  app.listen(port, function () {
    console.log(`Server running at ${process.env.APP_URL}:${port}/`);
  })
}else{
  https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log(`Server running at https://localhost:${port}/`);
  });
}