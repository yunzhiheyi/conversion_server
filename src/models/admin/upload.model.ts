import { prop, modelOptions, Severity } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_upload',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class UploadModel {

  @prop({ type: String })
  _id: String

  // 路径数组
  @prop({ items: String })
  imgPath?: String[];

  // 图片类型
  @prop({ type: String, required: true })
  key: String

  // 是否可用 > 用于没用的图片会定时清除
  @prop({ type: Boolean, required: true, default: false })
  isLock: Boolean

}