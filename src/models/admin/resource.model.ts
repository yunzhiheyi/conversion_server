import { prop, modelOptions, Severity, pre } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_resource',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class ResourcesModel {

  @prop({ type: String })
  _id: String

  @prop({ type: String })
  house_id: String

  @prop({ type: String })
  url: String

  @prop({ type: Number, default: 0 })
  state: Number

}