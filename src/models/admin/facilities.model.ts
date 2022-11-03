import { prop, modelOptions, Severity } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_facilities',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class FacilitiesModel {

  @prop({ type: String })
  _id: String

  // 名称
  @prop({ type: String })
  name: String

  // icon图片
  @prop({ type: String })
  iconUrl: String

  // 关联ID
  @prop({ description: String })
  houseId: String;

  // 类型  1 户型特点  2小区配套 3配套家具
  @prop({ type: Number })
  type: Number


}