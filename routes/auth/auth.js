const Router = require('koa-router');
const authRouteObject = {};
const auth = new Router();
authRouteObject.passport = undefined;

authRouteObject.setPassport = function(passport) {
  authRouteObject.passport = passport;
}

auth.post('/login', async (ctx, next) => {

  // ctx.mongo.collection('user').findOne({'email':ctx.request.body.email, 'password': ctx.request.body.password}, function(err, result){
  //   console.log(result);
  // })


  return authRouteObject.passport.authenticate('local', (err, user) => {
    if (user) {
      ctx.login(user);
      ctx.redirect('/app');
    } else {
      console.log('here ??', err);
      ctx.redirect('/');
    }
  })(ctx);
})

auth.get('/logout', function(ctx) {
  ctx.logout()
  ctx.redirect('/')
})

auth.post('/register', function(ctx) {
  ctx.body = ctx.request.body
})

authRouteObject.auth = auth;

module.exports = authRouteObject;