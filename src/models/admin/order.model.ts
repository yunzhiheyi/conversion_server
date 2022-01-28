import { prop, modelOptions, post, Ref } from '@typegoose/typegoose'
import { AppUserModel } from '../app/user.model'
import { PriceModel } from '../admin/price.model'

@modelOptions({
  schemaOptions: {
    collection: 'j_order',
    timestamps: true,
  }
})
export class OrderModel {
  // _ID
  @prop({ type: String })
  _id: String

  // 用户ID
  @prop({ type: String, ref: () => AppUserModel })
  user_id?: Ref<AppUserModel, string>;

  // 产品ID
  @prop({ type: String, ref: () => PriceModel })
  product_code?: Ref<PriceModel, string>;

  // 微信订单号
  @prop({ type: String, default: '' })
  transaction_id: String;

  // 支付类型
  @prop({ type: String, default: 'WX_PAY', enum: ['WX_PAY', 'ALI_PAY', 'IOS_PAY'] })
  pay_type: String

  @prop({ type: String, default: 'ING_PAYMENT', enum: ['PAY_SUCCESS', 'TRADING_HALT', 'ING_PAYMENT', 'FAILURE_PAYMENT', 'TIME_OUT_HALT'] })
  status: String

  // 支付完成时间
  @prop({ type: Date })
  payment_time: Date

  // 订单关闭时间
  @prop({ type: Date })
  close_time: Date

  // 订单超时时间
  @prop({ type: Date })
  timeout_time: Date

}