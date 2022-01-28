import { prop, modelOptions, Severity } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_admin_role',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class AdminRole {
  // _ID
  @prop({ type: String })
  _id: String

  // 角色名
  @prop({ type: String, required: true })
  name: String

  //角色介绍
  @prop({ type: String, required: true })
  description: String

  // 排序数
  @prop({ type: String })
  sort: String

  //权限列表
  @prop({ type: Array })
  power: []

  // 锁
  @prop({ type: Boolean, })
  isLock: Boolean
}