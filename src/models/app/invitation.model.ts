import { prop, modelOptions, Ref } from '@typegoose/typegoose'
import { AppUserModel } from '../app/user.model'
@modelOptions({
  schemaOptions: {
    collection: 'j_app_invitation_record',
    timestamps: true,
  }
})
// 用户邀请记录表
export class AppRecord {
  // _ID
  @prop({ type: String })
  _id: String

  // 用户ID
  @prop({ type: String, ref: () => AppUserModel })
  user_id?: Ref<AppUserModel, string>;


}