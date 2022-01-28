import { prop, modelOptions } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_app_task_type',
  }
})
// 任务类型表
export class AppTaskType {
  // _ID
  @prop({ type: String })
  _id: String

  // 名称
  @prop({ type: String })
  name: String
}