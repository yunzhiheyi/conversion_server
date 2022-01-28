import { prop, modelOptions, Severity } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_admin_menu',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class AdminMenu {
  // _ID
  @prop({ type: String })
  _id: String

  // 权限名称
  @prop({ type: String, required: true, })
  name: String

  // 父权限编号
  @prop({ type: String, required: true, })
  parentId: String

  // 菜单等级
  @prop({ type: String, required: true, default: '1' })
  level: String

  // 是否叶子节点
  @prop({ type: String, default: '' })
  isChild: String

  // 是否显示
  @prop({ type: String, default: '1' })
  isMenu: String

  // 是否显示
  @prop({ type: String })
  icon: String

  // 排序
  @prop({ type: String })
  sort: String

  // 菜单权限按钮
  @prop({ type: Array })
  btnListArr: []

  // Redirect url
  @prop({ type: String })
  routerUrl: String

  // 参数说明
  @prop({ type: String })
  routerParameterDescribe: String

  // 路由参数
  @prop({ type: String })
  routerParameter: String

  // 路由名称
  @prop({ type: String, required: true, })
  routerName: String

  // 路由参数
  @prop({ type: String })
  routerDescribe: String
}