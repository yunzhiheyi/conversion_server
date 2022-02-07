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

  // 七牛云的key
  @prop({ type: String, required: true })
  key: String

}