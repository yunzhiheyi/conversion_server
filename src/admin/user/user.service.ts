import { HttpException, Injectable } from '@nestjs/common';
import { jwtSecret } from 'src/config';
import { InjectModel } from 'nestjs-typegoose';
import { verify, sign } from 'jsonwebtoken';
import { ToolsService } from '../../utils/tools.service';
import { MenuService } from '../menu/menu.service';
import { AdminUser } from '../../models/admin/admin.model';
import { AppUserModel } from '../../models/app/user.model';
import { ReturnModelType } from "@typegoose/typegoose";
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import { AppConversion } from '../../models/app/conversion.model';
import { AppRecord } from '../../models/app/record.model';
import dayjs from 'dayjs';
@Injectable()
export class AuserService {
  constructor(
    @InjectModel(AppUserModel)
    private readonly userModel: ReturnModelType<typeof AppUserModel>,
    @InjectModel(AdminUser)
    private readonly AdminUserModel: ReturnModelType<typeof AdminUser>,
    @InjectModel(AppRecord)
    private readonly recordModel: ReturnModelType<typeof AppRecord>,
    @InjectModel(AppConversion)
    private readonly appConversion: ReturnModelType<typeof AppConversion>,
    private readonly toolsService: ToolsService,
    private readonly menuService: MenuService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  // 查询用户
  async findByAccount(username: string): Promise<any> {
    var options = [
      {
        path: 'power',
        select: { _id: 1, name: 1, power: 1 },
      }]
    const user = await (await this.AdminUserModel.findOne({ username })).populate(options);
    if (!user) {
      const errors = { code: 5004, message: `当前用户不存在` };
      throw new HttpException(errors, 200);
    }
    return user;
  }
  //递归分类树静态方法
  public getTree(arr: any[], id: any) {
    var tree = []
    arr.forEach(item => {
      if (item.parent_id == id) {
        tree.push({
          id: item.id,
          name: item.name,
          parent_id: item.parent_id,
          code: item.code,
          alias: item.alias,
          path: item.path,
          source: item.source,
          category: item.category,
          action: item.action,
          is_open: item.is_open,
          children: this.getTree(arr, item.id)
        })
      }
    })
    return tree
  }
  // 获取用户信息
  async getUserInfo(userId: any) {
    const _user = await this.AdminUserModel.findOne({ _id: userId }).populate(
      'power'
    );
    const tree = await this.menuService.getFindData(_user.power['power']);
    return {
      user: {
        uid: _user._id,
        rolesName: _user.power['name'],
        name: _user.username,
        power: _user.power['power'],
      },
      tree
    }
  }


  public generateJWT(user) {
    //604800
    return sign({
      id: user._id,
      username: user.username,
      rolesId: user.power._id,
      // exp: Date.now() + 1 * 60 * 1000,
    }, jwtSecret.secret);
  }

  // 添加用户
  async userAdd(_body: { [x: string]: any; }) {
    const _params = this.toolsService._params(_body);
    _params['_id'] = await this.snowflakeService.nextId();
    _params['password'] = await this.toolsService.AesEncrypt(_body.password);
    const result = await this.AdminUserModel.create(_params);
    return !!result;
  }

  // 更新用户
  async userUpdate(_body: any) {
    const _params = this.toolsService._params(_body);
    if (_params['password']) {
      _params['password'] = await this.toolsService.AesEncrypt(_body.password);
    }
    const result = await this.AdminUserModel.updateMany(
      { _id: _body._id },
      { $set: _params },
    );
    return !!result;
  }

  // 删除、批量删除用户
  async userDelete(query: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    const result = await this.AdminUserModel.deleteMany({ _id: { $in: ids } });
    return !!result
  }
  // 用户列表
  async userList(query: any) {
    const options = {
      type: 'pop',
      populate: 'power',
    };
    return await this.toolsService.getPageList(options, this.AdminUserModel);
  }

  // 删除、批量删除用户
  async userAppDelete(query: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    const result = await this.userModel.deleteMany({ _id: { $in: ids } });
    return !!result
  }

  // 用户列表
  async AppUserList(query: any) {
    let reg = new RegExp(query.keyword, 'i');
    let findField = {};
    if (query.keyword) {
      findField['nickname'] = { $regex: reg }
    }
    const options = {
      type: 'page',
      findField,
      queryPpage: query.page,
    };
    return await this.toolsService.getPageList(options, this.userModel);
  }

  // 用户的转写记录列表
  async AppConversionList(query: any) {
    const options = {
      type: 'page',
      queryPpage: query.page,
      findField: {
        user_id: query.user_id
      }
    };

    let data = await this.toolsService.getPageList(options, this.appConversion);
    var resultArr = []
    data.result.map((item) => {
      var _item = {
        _id: item._id,
        audioSrc: item.audioSrc,
        type: item.type,
        metaInfo: item.metaInfo,
        taskStatus: item.taskStatus,
        taskText: item.taskText,
        createdAt: dayjs(new Date(item['createdAt'])).format('YYYY-MM-DD HH:mm:ss')
      }
      resultArr.push(_item);
    })
    return {
      pages: data.pages,
      result: resultArr,
      total: data.total
    };
  }
  // 用户的分享记录列表
  async AppShareList(query: any) {
    const options = {
      type: 'page',
      findField: {
        invitee_code: query.invitee_code,
      },
      queryPpage: query.page,
    };
    var resData = await this.toolsService.getPageList(options, this.userModel);
    // resData.result = resData.result.map((item) => {
    //   return item.user_id
    // })
    return resData
  }
}
