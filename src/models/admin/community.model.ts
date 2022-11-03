import { prop, modelOptions, Severity } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_community',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class CommunityModel {

  @prop({ type: String })
  _id: String

  // 小区ID
  @prop({ type: String })
  community_id: String

  // 小区姓名
  @prop({ type: String })
  community_name: String

  // 一级区域
  @prop({ type: Object })
  add_one: any

  // 二级区域
  @prop({ type: Object })
  add_two: any;

  // 三级区域
  @prop({ type: Object })
  add_three: any

  // 小区详细街道邮编
  @prop({ type: String })
  add_post: String

  // 小区详细地址
  @prop({ type: String })
  add_detail: String

  // 经度
  @prop({ type: Number, default: 0 })
  loc_lng: Number

  // 纬度
  @prop({ type: Number, default: 0 })
  loc_lat: Number

  // 建成年份
  @prop({ type: String })
  bulid_year: String

  // 开发商
  @prop({ type: String })
  architect: String

  // 房源一级类型
  @prop({ type: Object })
  type_one: any

  // 房源二级类型
  @prop({ type: Object })
  type_two: any

  // 房源三级类型
  @prop({ type: Object })
  type_three: any

  // 产权年限
  @prop({ type: Object })
  tenure: any

  // 小区户数
  @prop({ type: String })
  household: String

  // 小区面积
  @prop({ type: Number })
  floor_size: Number

  // 小区配套
  @prop({ type: Array })
  community_setting: []

  // 小区平面图
  @prop({ type: String })
  layout_pic: String

  // 房源VR
  @prop({ type: Array })
  house_vr: [String]

  // 小区管理视频
  @prop({ type: Array })
  mangement_video: [Object]

  // 小区设施视频
  @prop({ type: Array })
  setting_video: []

  // 小区楼栋视频
  @prop({ type: Array })
  buliding_video: []

  // 小区周边视频
  @prop({ type: Array })
  surrounding_video: []

  // 小区管理图片
  @prop({ type: Array })
  mangement_pic: []

  // 小区设施图片
  @prop({ type: Array })
  setting_pic: []

  // 小区楼栋图片
  @prop({ type: Array })
  buliding_pic: []

  // 小区周边图片
  @prop({ type: Array })
  surrounding_pic: []

  // 0 待获取 1 待补充  2 未注入 3 已注入 4 审核中
  // 当前的状态 0 未获取完数据 1 完成详情数据补充 2 未注入考拉 3 数据入库考拉 4 审核中
  @prop({ type: Number, default: 0 })
  state: Number

}