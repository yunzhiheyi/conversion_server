import { prop, modelOptions, Severity, pre } from '@typegoose/typegoose'
import dayjs from 'dayjs';
@modelOptions({
  schemaOptions: {
    collection: 'j_teleprompter',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
@pre<Teleprompter>('save', function () {
  this.ExpirationTime = dayjs(new Date()).add(7, 'day').toDate();
})
export class Teleprompter {
  // ID
  @prop({ type: String })
  _id: String

  // 名称
  @prop({ type: String })
  title?: String;

  // 内容
  @prop({ type: String })
  content: String

  // 用户ID
  @prop({ type: String })
  userId: String

  // 类型 1:列表 2:回收站
  @prop({ type: Number, default: 1, enum: [1, 2] })
  type: Number

  // 过期时间
  @prop({ type: Date })
  ExpirationTime: Date

}