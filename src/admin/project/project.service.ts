
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { ToolsService } from 'src/utils/tools.service';
import { ProjectModel } from '../../models/admin/project.model';
import { UploadModel } from '../../models/admin/upload.model';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(ProjectModel)
    private readonly projectModel: ReturnModelType<typeof ProjectModel>,
    @InjectModel(UploadModel)
    private readonly uploadModel: ReturnModelType<typeof UploadModel>,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
  ) { }
  // 添加专题
  async add(_body: { [x: string]: any; }, _userId: any) {
    const _params = this.toolsService._params(_body);
    _params['_id'] = await this.snowflakeService.nextId();
    var _contentImageId = _params['contentImageId'];
    var _thumbnailId = _params['thumbnailId'];
    // 锁定当前图片
    if (_contentImageId || _thumbnailId) {
      var ids = []
      if (_contentImageId) {
        ids.push(_contentImageId);
      }
      if (_thumbnailId) {
        ids.push(_thumbnailId);
      }
      await this.uploadModel.updateMany({ _id: { $in: ids } }, { $set: { isLock: true } });
    }
    const result = await this.projectModel.create(_params);
    return !!result;
  }
  // 更新专题
  async update(_body: any) {
    const _params = this.toolsService._params(_body);
    var _contentImageId = _params['contentImageId'];
    var _thumbnailId = _params['thumbnailId'];
    // 锁定当前图片
    if (_contentImageId || _thumbnailId) {
      var ids = []
      if (_contentImageId) {
        ids.push(_contentImageId);
      }
      if (_thumbnailId) {
        ids.push(_thumbnailId);
      }
      await this.uploadModel.updateMany({ _id: { $in: ids } }, { $set: { isLock: true } });
    }
    const result = await this.projectModel.updateMany(
      { _id: _body._id },
      { $set: _params },
    );
    return !!result;
  }
  // 查询专题
  async query(_id: any) {
    const result = await (await this.projectModel.findOne({ _id }, { __v: 0, createdAt: 0, updatedAt: 0 })).populate([
      {
        path: 'thumbnailId',
        select: { __v: 0, createdAt: 0, updatedAt: 0 },
      },
      {
        path: 'contentImageId',
        select: { __v: 0, createdAt: 0, updatedAt: 0 },
      }]);
    return result;
  }
  // 删除、批量删除专题
  async delete(query: any, _userId: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    const result = await this.projectModel.deleteMany({ _id: { $in: ids } });
    return !!result
  }

  // 专题列表
  async list(query: any) {
    const options = {
      type: query['page'] ? 'page' : 'list',
      sortType: 'sort',
      sortVal: '1'
    };
    return await this.toolsService.getPageList(options, this.projectModel);
  }
}
