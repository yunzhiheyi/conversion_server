import { prop, modelOptions, Ref, DocumentType } from '@typegoose/typegoose'
import { AdminRole } from './role.model'
@modelOptions({
  schemaOptions: {
    collection: 'j_admin_user',
    timestamps: true,
  }
})
export class AdminUser {

  @prop({ type: String })
  _id: String

  // 管理员用户名
  @prop({ type: String, required: true, })
  username: String

  // 管理员密码
  @prop({ type: String, required: true })
  password: String

  // 关联角色菜单
  @prop({ type: String, ref: () => AdminRole })
  power?: Ref<AdminRole, string>;

  // 锁
  @prop({ type: Boolean, default: false, required: false })
  isLock: Boolean
}