import { prop, modelOptions, Severity, pre } from '@typegoose/typegoose'
@modelOptions({
  schemaOptions: {
    collection: 'j_housing',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
@pre<HousingModel>('save', function () {
  // 租房设置
  // if (this.house_classify !== 'sale') {
  //   this.rent = 17011002
  // }
})
export class HousingModel {

  @prop({ type: String })
  _id: String

  // 房源关联小区ID
  @prop({ type: String })
  community_id: String

  // 房源关联中介ID
  @prop({ type: String })
  agent_id: String

  // 房源名称
  @prop({ type: String })
  house_name: String

  // 房源类型
  @prop({ type: String })
  house_classify: String

  // 房源面积
  @prop({ type: String })
  floor_size?: String;

  // 小区面积
  @prop({ type: Number, default: 0.00 })
  land_size?: Number;

  // 房源单价
  @prop({ type: String, default: '0.00' })
  unit_price: String

  // 房源总价
  @prop({ type: String, default: '0' })
  price: String

  // 房源房间数量 
  @prop({ type: String })
  house_bed: String

  // 房源客厅数量
  @prop({ type: String })
  house_hall: String

  // 房源卫生间数量
  @prop({ type: String, default: '0' })
  house_bath: String

  // 房源楼层
  @prop({ type: Object })
  house_level: any

  // 房源主图
  @prop({ type: String })
  main_pic: String

  // 房源图
  @prop({ type: Array })
  floor_pic: [String]

  // 房源户型图
  @prop({ type: Array })
  other_pic: [String]

  // 房源视频
  @prop({ type: Array })
  video: [Object]

  // 房源VR
  @prop({ type: Array })
  house_vr: [String]

  // 房源经度
  @prop({ type: Number, default: 0.00 })
  loc_lng: Number

  // 房源纬度
  @prop({ type: Number, default: 0.00 })
  loc_lat: Number

  // 房源一级类型
  @prop({ type: Object })
  type_one: any

  // 房源二级类型
  @prop({ type: Object })
  type_two: any

  // 房源三级类型
  @prop({ type: Object })
  type_three: any

  // 房源一级区域
  @prop({ type: Object })
  add_one: any

  // 房源二级区域
  @prop({ type: Object })
  add_two: any

  // 房源三级区域
  @prop({ type: Object })
  add_three: any

  // 详细地址
  @prop({ type: String })
  add_detail: String

  // 街道邮编
  @prop({ type: String })
  add_post: String

  // 房源产权年限
  @prop({ type: Object })
  tenure: any

  // 房源开发商
  @prop({ type: String })
  architect: String

  // 房源建成年份
  @prop({ type: String })
  bulid_year: String

  // 房源描述
  @prop({ type: String })
  house_describe: String

  // 房源描述
  @prop({ type: String })
  house_describe_html: String

  // 是否带租约
  @prop({ type: Number })
  rent: Number

  // 是否带家具
  @prop({ type: Number })
  furniture: Number

  // 房源特点
  @prop({ type: Array })
  house_labels: []

  // 配套家具
  @prop({ type: Array })
  house_furniture: []

  // 小区配套
  @prop({ type: Array })
  community_labels: []

  // 房源url
  @prop({ type: String })
  url: String

  // 0 已获取  1 已完成 2 已注入 3 已审核
  // 当前的状态  0 完成列表数据 1 完成详情数据补充 2 数据入库考拉 3 成功审核
  @prop({ type: Number, default: 0 })
  state: Number

  // 当前的状态  0 完成数据 1
  @prop({ type: Number, default: 0 })
  community_state: Number

}