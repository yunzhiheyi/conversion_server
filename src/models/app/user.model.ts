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

  // 平台类型
  @prop({ type: String })
  system_type: String

  // 剩余转换时间
  @prop({ type: Number, default: 0 })
  remaining_time: Number

  // 是否VIP
  @prop({ type: Number, default: 0 })
  is_vip: Number

  // 是否绑定微信
  @prop({ type: Number, default: 0, enum: [0, 1] })
  is_bind_wechat: Number

  // 会员类型
  @prop({ type: Number, default: 1, enum: [1, 2, 3] })
  user_type: Number

  // 邀请码
  @prop({ type: String, default: '' })
  inviter_code: String

  // 被邀请码
  @prop({ type: String, default: '' })
  invitee_code: String

  // 是否关注公众号
  @prop({ type: Number, default: 0, enum: [0, 1] })
  isConcern: Number

  // 会员到期时间
  @prop({ type: Date, default: Date.now })
  maturity_time: Date

  // 最后一次登录时间
  @prop({ type: Date, default: Date.now })
  last_login_time: Date

  // 设备信息
  @prop({ type: String })
  device_info: String

  // 登录版本号
  @prop({ type: String })
  login_version: String

  // 登录渠道号
  @prop({ type: String })
  login_channel: String

  // 登录版本号
  @prop({ type: String })
  register_channel: String

  // 登录版本号
  @prop({ type: String })
  register_version: String

  // 当前状态
  @prop({ type: Number })
  status: Number

}