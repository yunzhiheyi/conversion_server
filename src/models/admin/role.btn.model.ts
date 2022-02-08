import { prop, modelOptions } from '@typegoose/typegoose';
@modelOptions({
  schemaOptions: {
    collection: 'j_admin_role_btn',
    timestamps: true,
  },
})
export class AdminRoleBtn {
  // _ID
  @prop({ type: String })
  _id: String

  // 菜单名
  @prop({ type: String, required: true })
  btnName: String

  // 按钮标识
  @prop({ type: String, required: true })
  btnId: String

  // 排序
  @prop({ type: Number })
  sort: String

  // 按钮锁
  @prop({ type: Boolean, required: true, default: false })
  isLock: Boolean

  // 当前按钮的权限菜单ID
  @prop({ type: String, required: true })
  menuId: String

}
