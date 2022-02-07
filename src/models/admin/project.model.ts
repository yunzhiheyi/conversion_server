import { prop, modelOptions, Ref, DocumentType } from '@typegoose/typegoose'
import { UploadModel } from './upload.model'
@modelOptions({
  schemaOptions: {
    collection: 'j_project',
    timestamps: true,
  }
})
export class ProjectModel {

  @prop({ type: String })
  _id: String

  // 专题名称
  @prop({ type: String, required: true, })
  name: String

  // 专题描述
  @prop({ type: String, required: true })
  describe: String

  // 缩略图ID
  @prop({ type: String, ref: () => UploadModel })
  thumbnailId?: Ref<UploadModel, string>;

  // 内容图片ID
  @prop({ type: String, ref: () => UploadModel })
  contentImageId?: Ref<UploadModel, string>;

  // 内容
  @prop({ type: String, required: true })
  content: String

  // Markdown内容
  @prop({ type: String })
  markdownContent: String

}