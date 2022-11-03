import { prop, modelOptions, Severity } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_database',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class DatabaseModel {

  @prop({ type: String })
  _id: String

  // 备份名称
  @prop({ name: String })
  name?: String;

  // 备份路径
  @prop({ type: String })
  path: String


}