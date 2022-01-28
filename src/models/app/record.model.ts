import { prop, modelOptions, Ref } from '@typegoose/typegoose'
import { AppTaskType } from './taskType.model'
import { AppUserModel } from '../app/user.model'
@modelOptions({
  schemaOptions: {
    collection: 'j_app_record',
    timestamps: true,
  }
})
// 用户时长记录表
export class AppRecord {
  // _ID
  @prop({ type: String })
  _id: String

  // 类似 1为收入 2是消费
  @prop({ type: Number, enum: [1, 2] })
  type: Number

  // 用户ID
  @prop({ type: String, ref: () => AppUserModel })
  user_id?: Ref<AppUserModel, string>;

  // 时长
  @prop({ type: Number })
  time: Number

  // 类型
  @prop({ type: String, ref: () => AppTaskType })
  recordName?: Ref<AppTaskType, string>;

}