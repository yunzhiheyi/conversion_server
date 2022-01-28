import { prop, modelOptions } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_app_user',
    timestamps: true,
  }
})
export class AppUserModel {
  // _ID
  @prop({ type: String })
  _id: String

  // openid
  @prop({ type: String, default: '' })
  openid: String

  // unionid
  @prop({ type: String, default: '' })
  unionid: String

  // 头像
  @prop({ type: String, default: '' })
  avatar: String

  // 用户昵称
  @prop({ type: String })
  nickname: String

  // 手机号
  @prop({ type: String })
  mobile: String

  // 剩余转换时间
  @prop({ type: Number, default: 0 })
  remaining_time: Number

  // 是否VIP
  @prop({ type: Number, default: 0 })
  is_vip: Number

  // 是否VIP
  @prop({ type: Number, default: 0, enum: [0, 1] })
  is_bind_wechat: Number

  // 邀请码
  @prop({ type: String })
  inviter_code: String

  // 被邀请码
  @prop({ type: String, default: '' })
  invitee_code: String

  // 是否关注公众号
  @prop({ type: Number, default: 0 })
  isConcern: Number

  // 最后一次登录时间
  @prop({ type: Date, default: Date.now })
  last_login_time: Date

  // 当前状态
  @prop({ type: Number })
  status: Number
}