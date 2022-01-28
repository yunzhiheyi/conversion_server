import { Injectable } from '@nestjs/common';
import { ReturnModelType } from "@typegoose/typegoose";
import { InjectModel } from 'nestjs-typegoose';
import { AdminMenu } from '../../models/admin/menu.model';
import { AdminRole } from '../../models/admin/role.model';
import { ToolsService } from '../../utils/tools.service';
import { pagesDto } from '../admin.dto';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
@Injectable()
export class MenuService {
  constructor(
    @InjectModel(AdminMenu)
    private readonly MenuModel: ReturnModelType<typeof AdminMenu>,
    @InjectModel(AdminRole)
    private readonly RoleModel: ReturnModelType<typeof AdminRole>,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
  ) { }
  // 过滤name上的|——再编辑
  public stripscript(str: string) {
    var pattern = new RegExp('[|—]');
    var rs = '';
    for (var i = 0; i < str.length; i++) {
      var _str = str.substr(i, 1);
      rs = rs + str.substr(i, 1).replace(pattern, '');
    }
    return rs;
  }

  // 添加 |——
  public setLine(arr: any[], pid: string) {
    const _mapArr = [];
    arr.map((item, key) => {
      if (item.parentId !== pid) {
        if (item.name.indexOf('|—') < 1 && item.level !== '3') {
          item.name = '|——' + item.name;
        } else {
          item.name = '|———' + item.name;
        }
        _mapArr.push(item);
      }
    });
    return _mapArr;
  }
  // 用于获取菜单列表
  public getTreeLineMenu(arr: any[], pid: string, isTree = false) {
    var _mapArr = [];
    var _mapArr2 = [];
    const setLineFilter = this.setLine(arr, '-1');
    arr.map((item, key) => {
      if (item.parentId === '-1') {
        _mapArr.push(item);
      }
    });
    _mapArr2 = _mapArr.map((item, key) => {
      var arr = setLineFilter.filter(
        (_item, _key) => _item.parentId === item._id,
      );
      return {
        children: arr,
        createdAt: item.createdAt,
        level: item.level,
        name: item.name,
        parentId: item.parentId,
        _id: item._id,
      };
    });
    for (let i = 0; i < _mapArr2.length; i++) {
      if (_mapArr2[i].children) {
        _mapArr2 = _mapArr2
          .slice(0, i + 1)
          .concat(_mapArr2[i].children, _mapArr2.slice(i + 1));

        delete _mapArr2[i].children;
      }
    }

    return _mapArr2;
  }
  //递归分类树
  public getTreeMenu(arr: any[], pid: string, isBtn: boolean) {
    const _mapArr = [];
    arr.map((item, key) => {
      if (item.parentId === pid) {
        let options = null;
        if (isBtn) {
          options = {
            _id: item._id,
            label: item.name,
            children: []
          }
        } else {
          options = {
            _id: item._id,
            parentId: item.parentId,
            name: item.name,
            level: item.level,
            icon: item.icon,
            isMenu: item.isMenu,
            routerUrl: item.routerUrl,
            routerName: item.routerName,
            routerParameter: item.routerParameter,
            isChild: item.isChild,
            btnListArr: item.btnListArr,
            sort: item.sort,
            routerPath: item.routerPath,
            routerParameterDescribe: item.routerParameterDescribe,
            routerDescribe: item.routerDescribe,
            children: []
          };
        }

        const _arrs = this.getTreeMenu(arr, item._id, isBtn);
        if (_arrs.length > 0) {
          options.children = _arrs;
        } else {
          if (item.btnListArr && item.btnListArr.length > 0) {
            options[isBtn ? 'children' : 'btnListArr'] = item.btnListArr.map((res, _key) => {
              return isBtn ? {
                _id: item._id + '_' + res._id,
                label: res.btnName,
              } : {
                _id: item._id + '_' + res._id, // 这里一定要加上菜单ID
                name: res.btnName,
                level: 3,
                btnId: res.btnId,
                parentId: res.menuId,
              };
            });
            // 添加完后就删除
            isBtn && delete options.btnListArr;
          }
        }
        _mapArr.push(options);
      }
    });
    return _mapArr;
  }
  // 添加菜单
  async add(_body: { [x: string]: any; }, _userId: any) {
    const _params = this.toolsService._params(_body);
    _params['_id'] = await this.snowflakeService.nextId();
    const result = await this.MenuModel.create(_params);
    if (result) {
      const results = await this.RoleModel.updateMany(
        { _id: _userId },
        { $push: { power: result._id } },
      );
      return !!results;
    } else {
      return false;
    }
  }
  // 更新菜单
  async update(_body: any) {
    const _params = this.toolsService._params(_body);
    if (_params['name']) {
      _params['name'] = this.stripscript(_params['name']);
    }
    const result = await this.MenuModel.updateMany(
      { _id: _body._id },
      { $set: _params },
    );
    return !!result;
  }

  // 删除、批量删除权限菜单
  async delete(query: any, _userId: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    await this.MenuModel.deleteMany({ _id: { $in: ids } });
    const result = await this.RoleModel.updateMany(
      { _id: _userId },
      { $pull: { power: { $in: ids } } },
    ); //删除权限
    return !!result
  }

  // 获取所有拼装后的菜单 
  async getFindData(power: any) {
    var powerTree = await this.MenuModel.find({
      _id: { $in: power },
    }).sort({ sort: 1 });
    return this.getTreeMenu(powerTree, '-1', false);
  }
  // 获取带分页权限列表
  async list(query: pagesDto) {
    const options = {
      sortType: 'sort',
      sortVal: '1',
      queryPpage: query['page'],
      queryField: {}
    };
    if (query['page']) {
      // options.type = 'page'
    } else {
      //过滤显示字段，优化性能
      options.queryField = {
        // parentId: 0,
        icon: 0,
        sort: 0,
        isMenu: 0,
        isChild: 0,
        routerDescribe: 0,
        // routerName: 0,
        routerParameter: 0,
        routerParameterDescribe: 0,
        routerUrl: 0,
      };
    }
    let result = await this.toolsService.getPageList(options, this.MenuModel);
    if (query['field'] === '1') {
      result.result = this.getTreeLineMenu(result.result, '-1'); //排序添加子分类
    } else {
      result.result = this.getTreeMenu(
        result.result,
        '-1',
        query['_btn'] === '1',
      );
    }
    if (result) {
      return result
    }
  }
}
