const Router = require('koa-router');
const UserModel = require('../../models/UserModel');
const storeModel = require('../../models/StoreModel');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const tradeNo = require('../../lib/generateOrderNum');

const router = new Router({
  prefix: '/api/public/v1'
});

const secret = 'lhblinhibin';

// 登录
router.post('/user/login', async (ctx, next) => {
  let { data: { username, password } } = JSON.parse(ctx.request.rawBody);

  let user = await UserModel.findOne({ '$or': [{ username }, { user_phone: username }] });
  if (!user || crypto.createHash('sha1', secret).update(password).digest('hex') !== user.password) {
    ctx.body = {
      errorCode: 1,
      message: '用户不存在,或账号密码错误'
    }
  } else {
    let { username, user_phone: phone, _id: id } = user;
    let userInfo = {
      username,
      phone,
      id
    }
    ctx.body = {
      errorCode: 0,
      message: '登录成功',
      userInfo,
      token: jwt.sign(userInfo, secret, {
        expiresIn: 60
      })
    }
  }
  await next();
});

// token校验
router.get('/validate/token', async (ctx, next) => {
  let token = ctx.request.headers.authorization;
  jwt.verify(token, secret, (err, decode) => {
    if (err) {
      return ctx.body = {
        errorCode: 1,
        message: 'token失效了'
      }
    } else {
      let { username, phone, id } = decode;
      let sendDada = {
        username,
        phone,
        id
      }
      ctx.body = {
        errorCode: 0,
        message: 'ok',
        userInfo: sendDada,
        token: jwt.sign(sendDada, secret, {
          expiresIn: 60
        })
      }
    }
  })
  await next();
})

// 注册
router.post('/user/register', async (ctx, next) => {
  let { data: { username, password, phone } } = JSON.parse(ctx.request.rawBody);

  let user1 = await UserModel.findOne({ username });

  let user2 = await UserModel.findOne({ user_phone: phone });

  if (user1) {
    ctx.body = {
      errorCode: 1,
      message: '该用户名已经注册'
    }
  } else if (user2) {
    ctx.body = {
      errorCode: 1,
      message: '该手机号已经注册'
    }
  } else {
    UserModel.create({
      username,
      password,
      user_phone: phone
    });
    ctx.body = {
      errorCode: 0,
      message: '注册成功'
    }
  }
  await next();
});

// 添加收货地址
router.post('/address/add', async (ctx, next) => {
  let { data: { id, address } } = JSON.parse(ctx.request.rawBody);

  const user = await UserModel.findById(id);

  user.user_address.unshift(address);

  user.save(err => {
    if (err) throw err;
    console.log('添加地址成功');
  });

  ctx.body = {
    errorCode: 0,
    message: 'ok',
    address: user.user_address
  }

  await next();
});

// 获取收货地址
router.get('/address/:id', async (ctx, next) => {
  let { id } = ctx.params;

  let user = await UserModel.findById(id);

  ctx.body = {
    errorCode: 0,
    message: 'ok',
    address: user.user_address
  }

  await next();
})

// 获取订单
router.get('/order/:id', async (ctx, next) => {
  let { id } = ctx.params;
  let user = await UserModel.findById(id);
  ctx.body = {
    errorCode: 0,
    message: 'ok',
    orders: user.user_order
  }
  await next();
});

// 生成订单
router.post('/order', async (ctx, next) => {
  let { data: { userId, storeId, storeName, storeLogoUrl, foods, price } } = JSON.parse(ctx.request.rawBody);

  let user = await UserModel.findById(userId);
  let store = await storeModel.findById(storeId);

  user.user_order.unshift({
    num: tradeNo(),
    time: new Date().getTime(),
    storeId,
    storeName,
    storeLogoUrl,
    foods,
    price
  });

  user.save(err => {
    if (err) throw err;
    console.log('生成订单成功');
  });

  foods.forEach(f => {
    store.store_goods.forEach(g => {
      if (f.id == g.food_id) {
        g.food_sales += parseFloat(f.num);
      }
    });
    store.store_categories.forEach(cat => {
      cat.children.forEach(c => {
        if (f.id == c.food_id) {
          c.food_sales += parseFloat(f.num);
        }
      })
    })
  })

  store.store_sales += 1;

  store.save(err => {
    if (err) throw err;
  })

  ctx.body = {
    errorCode: 0,
    message: 'ok',
    orders: user.user_order
  }

  await next();
});

module.exports = router;