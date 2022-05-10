import { Injectable } from '@nestjs/common';
import { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from 'nestjs-typegoose';
import { AdminRole } from '../../models/admin/role.model';
import { AdminRoleBtn } from '../../models/admin/role.btn.model';
import { ToolsService } from '../../utils/tools.service';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
@Injectable()
export class RoleService {
  constructor(
    @InjectModel(AdminRole)
    private readonly RoleModel: ReturnModelType<typeof AdminRole>,
    @InjectModel(AdminRoleBtn)
    private readonly RoleBtnModel: ReturnModelType<typeof AdminRoleBtn>,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
  ) { }
  // 添加菜单
  async btnAdd(_body: { [x: string]: any; }) {
    const _params = this.toolsService._params(_body);
    _params['_id'] = await this.snowflakeService.nextId();
    const result = await this.RoleBtnModel.create(_params);
    return !!result;
  }

  // 删除、批量删除权限菜单
  async btnDelete(query: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    const result = await this.RoleBtnModel.deleteMany({ _id: { $in: ids } });
    return !!result

    
  }
  // 按钮获取带分页权限列表
  async btnList() {
    const options = {
      sortType: 'sort',
      sortVal: '1',
      queryField: {
        createdAt: 0
      }
    };
    return await this.toolsService.getPageList(options, this.RoleBtnModel);
  }
  // 添加角色
  async roleAdd(_body: { [x: string]: any; }) {
    const _params = this.toolsService._params(_body);
    const result = await this.RoleModel.create(_params);
    return !!result;
  }

  // 更新角色
  async roleUpdate(_body: any) {
    const _params = this.toolsService._params(_body);
    const result = await this.RoleModel.updateMany(
      { _id: _body._id },
      { $set: _params },
    );
    return !!result;
  }

  // 删除、批量删除角色
  async roleDelete(query: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    const result = await this.RoleModel.deleteMany({ _id: { $in: ids } });
    return !!result
  }
  // 角色列表
  async roleList(query: any) {
    const options = {
      type: query['page'] ? 'page' : 'list',
      sortType: 'sort',
      sortVal: '1'
    };
    return await this.toolsService.getPageList(options, this.RoleModel);
  }
}
