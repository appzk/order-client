import React from 'react';
import { connect } from 'react-redux';
import isCart from '../../util/isCart';

function Shopcommend(props) {
  const { shopData: {foods_commend}, cartList, handleAddToCart, handleReduceCart } = props;

  return (
    <div className='merchant_recommendation'>
      <h2>商家推荐</h2>
      <div className='recommend'>
        <div className='recommend_wrapper'>
          {
            foods_commend && foods_commend.map(food => {
              return (
                <div className='recommend_item' key={food['_id']}>
                  <img src={food.food_pic} alt="" />
                  <div className='food_detail'>
                    <p className='food_name'>{food.food_name}</p>
                    <p className='food_data'>月售{food.food_sales} 好评率100%</p>
                    <div className='food_card'>
                      <span>￥{food.food_price}</span>
                      <span className='operate'>
                        {
                          !isCart(cartList, food.food_id) ? '' : (
                            <>
                              <a data-id={food.food_id} onClick={handleReduceCart}><i className='iconfont icon-jian'></i></a>
                              <span>{isCart(cartList, food.food_id).num}</span>
                            </>
                          )
                        }
                        <a data-name={food.food_name} data-id={food.food_id} data-price={food.food_price} data-pic={food.food_pic}  onClick={handleAddToCart}><i className='iconfont icon-add'></i></a>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

export default connect(store => ({ ...store.shop }))(Shopcommend)