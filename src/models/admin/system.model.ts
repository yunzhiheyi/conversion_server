import { prop, modelOptions, mongoose, Severity } from '@typegoose/typegoose'

@modelOptions({
  schemaOptions: {
    collection: 'j_system_info',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }

})
export class SystemInfoModel {

  @prop({ type: String, default: 'SYS' })
  _id: String

  // 设置参数
  @prop({ type: Object })
  setup: Object

  // 七牛云
  @prop({ type: Object })
  qiniu: Object

  // 微信支付
  @prop({ type: Object })
  wechatPay: Object

  // 微信公众号
  @prop({ type: Object })
  wechat: Object

  // 小程序
  @prop({ type: Object })
  miniprogram: Object

  // 阿里
  @prop({ type: Object })
  alipay: Object

  // 短信白名单
  @prop({ type: Array })
  whiteUser: []

  // 开启爬虫debug
  @prop({ type: Number, default: 0 })
  puppeteer_debug: Number

  // 提交IOS审核
  @prop({ type: String, default: '0' })
  isIosAudit: String

  // 数据库备份时间
  @prop({ type: Date })
  backupTime: Date
}