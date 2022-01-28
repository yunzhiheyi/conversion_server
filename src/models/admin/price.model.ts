import { prop, modelOptions } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_price',
    timestamps: true,
  }
})

export class PriceModel {
  // ID
  @prop({ type: String })
  _id: String

  // 支付金额
  @prop({ type: Number })
  payment_price: Number

  // 名称
  @prop({ type: String })
  name: String

  // 类型
  @prop({ type: String })
  type: String

  // 排序
  @prop({ type: Number })
  sort: Number

  // 是否推荐
  @prop({ type: Boolean })
  isRecommended: Boolean

  // 时间
  @prop({ type: Number })
  expir_time: Number

  // 产品code
  @prop({ type: String })
  product_code: String



}