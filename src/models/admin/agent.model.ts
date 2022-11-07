import { prop, modelOptions, Severity } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_agent',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class AgentModel {

  @prop({ type: String })
  _id: String

  // 中介姓名
  @prop({ type: String })
  name: String

  // 中介头像
  @prop({ type: String })
  photoUrl: String

  // 描述
  @prop({ description: String })
  description?: String;

  // 中介详情连接
  @prop({ type: String })
  url: String

  // 中介房源链接接
  @prop({ type: Array })
  houseUrl: []

  // 头像是否上传
  @prop({ type: Number, default: 0 })
  photoUpdata: Number

  // 房源数量
  @prop({ type: Number, default: 0 })
  sale: Number

  // 房源数量
  @prop({ type: Number, default: 0 })
  rent: Number

  // 证书编号
  @prop({ type: String })
  ceaNo: String

  // 证书
  @prop({ type: String })
  licenseNo: String

  // 中介电话
  @prop({ type: String })
  mobile: String

  // 国家代码
  @prop({ type: String })
  countryCode: String

  // 0 已获取  1 已完成 2 已注入 3 已审核
  // 当前的状态  0 完成列表数据 1 完成详情数据补充 2 数据入库考拉 3 成功审核
  @prop({ type: Number, default: 0 })
  state: Number

}