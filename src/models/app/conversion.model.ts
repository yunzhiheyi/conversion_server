import { prop, modelOptions, pre, Severity, Ref } from '@typegoose/typegoose'
import dayjs from 'dayjs'
import { AppUserModel } from '../app/user.model'
@modelOptions({
  schemaOptions: {
    collection: 'j_app_conversion',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW
  }

})
@pre<AppConversion>('save', function () {
  this.ExpirationTime = dayjs(new Date()).add(7, 'day').toDate();
})
export class AppConversion {
  // _ID
  @prop({ type: String })
  _id: String

  // 元信息 【视频、音频】
  @prop({ type: Object })
  metaInfo: Object

  // 用户ID
  @prop({ type: String, ref: () => AppUserModel })
  user_id?: Ref<AppUserModel, string>;

  // 1视频 2音频
  @prop({ type: String })
  type: String

  // 地址格式
  @prop({ type: String })
  ext: String

  // 音频地址
  @prop({ type: String })
  audioSrc: String

  // 本地临时音频地址
  @prop({ type: String })
  tempAudio: String

  // 七牛云文档地址
  @prop({ type: String })
  wordUrl: String

  // 转换后的文字
  @prop({ type: String })
  taskText: String

  // 任务ID
  @prop({ type: Number })
  taskId: Number

  // 分段文字
  @prop({ type: Array })
  taskDetailed: []

  // 当前转写状态
  @prop({ type: Number })
  taskStatus: Number

  // 当前状态
  @prop({ type: Number })
  status: Number

  // 过期时间
  @prop({ type: Date })
  ExpirationTime: Date
}