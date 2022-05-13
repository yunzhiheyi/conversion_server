import { HttpException, Injectable } from '@nestjs/common';
import { AppUserModel } from '../../models/app/user.model';
import { CreateUserDto, LoginUserDto } from '../app.dto';
import { jwtSecret } from 'src/config';
import { verify, sign } from 'jsonwebtoken';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import { ToolsService } from '../../utils/tools.service';
import { CacheService } from 'src/utils/redis.service';
import { ConversionService } from '../../app/conversion/conversion.service';
import dayjs from 'dayjs';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { AppRecord } from 'src/models/app/record.model';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(AppUserModel)
    private readonly UserModel: ReturnModelType<typeof AppUserModel>,
    @InjectModel(AppRecord)
    private readonly recordModel: ReturnModelType<typeof AppRecord>,
    private readonly snowflake: SnowflakeService,
    private readonly toolsService: ToolsService,
    private readonly redisService: CacheService,
    private readonly conversionService: ConversionService,
  ) { }
  // 根据参数查询用户信息更新关注
  async findOneUpdateInfo(body: any) {
    const userInfo = await this.UserModel.findOne(body);
    return userInfo;
  }
  // 更新关注
  async findUpdateConcern(body: any) {
    var userInfo = await this.UserModel.updateMany({ _id: body._id }, { $set: { isConcern: 1 } });
    return !!userInfo;
  }


  // 用户信息对象转换
  public UserInToObjcet(User: any) {
    let UserInfo = {}
    Object.keys(User).forEach((key) => {
      UserInfo[key] = User[key]
    })
    var _data = UserInfo['_doc'];
    delete _data.updatedAt;
    _data['createdAt'] = dayjs(_data['createdAt']).format('YYYY-MM-DD HH:mm:ss')
    _data['last_login_time'] = _data['last_login_time'] && dayjs(_data['last_login_time']).format('YYYY-MM-DD HH:mm:ss')
    return _data
  }
  // 新建用户
  async create(query: any) {
    const { mobile, openid, unionid, inviter_code, avatar, nickname, systemType } = query;
    const _id = await this.snowflake.nextId();
    const ids = _id && _id.split('');
    const userCount = await this.UserModel.aggregate([{
      $match: {
        $and: [{}],
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    }
    ]);
    var UserOptions = {}
    if (mobile) {
      UserOptions['mobile'] = mobile;
    } else {
      UserOptions['unionid'] = unionid;
    }
    const user = await this.UserModel.findOne(UserOptions, { __v: 0 });
    var refresh_token = '';
    var access_token = '';

    // 有当前用户直接返回信息和Token
    if (user) {
      var userData: any = user;
      refresh_token = this.generateRefreshToken(user);
      access_token = this.generateAccessToken(user);;
      userData['last_login_time'] = dayjs(Date()).format();
      var _info = {
        refreshToken: refresh_token,
        refreshTokenStartTime: Math.floor(Date.now())
      }
      // 
      this.redisService.set('UserInfo_' + userData._id, _info, jwtSecret.refreshTokenExpiresIn);
      return {
        userInfo: userData,
        refresh_token: refresh_token,
        access_token: access_token
      };
    }
    var count = userCount[0] && userCount[0].count ? userCount[0].count : 0;
    // 没有用户直接创建
    let createUser = {
      _id,
      mobile: mobile,
      openid: openid,
      avatar: avatar,
      unionid: unionid,
      systemType: systemType,
      nickname: nickname ? nickname : 'AI_' + this.toolsService.generate(8) + "_" + (parseInt(count) + 1),
      inviter_code: this.toolsService.generate(8),
      invitee_code: inviter_code, // 更新用户的被邀请码
      is_bind_wechat: nickname ? 1 : 0
    };

    let saveData = await this.UserModel.create(createUser);
    if (!saveData) {
      return null
    }
    refresh_token = this.generateRefreshToken(saveData);
    access_token = this.generateAccessToken(saveData);
    var createInfo = {
      id: saveData._id,
      mobile: saveData.mobile,
      refreshToken: refresh_token,
      refreshTokenStartTime: Math.floor(Date.now())
    }
    // 新人注册得时长
    await this.conversionService.AddRecordOrTime(300, saveData._id + '', 1, 'goQHW9LMxS', true)
    //邀请好友新用户记录用户邀请记录
    if (inviter_code) {
      const UserInviterCode = await this.UserModel.findOne({ inviter_code }, { __v: 0 });
      await this.conversionService.AddRecordOrTime(180, UserInviterCode._id + '', 1, 'reM0k3R3Ec', true);
    }
    this.redisService.set('UserInfo_' + saveData._id, createInfo, jwtSecret.refreshTokenExpiresIn);
    return {
      userInfo: saveData,
      refresh_token: refresh_token,
      access_token: access_token
    };

  }
  // 更新用户信息
  async updateManyUser(body: any) {
    var updateInfo = {
      $set: body
    }
    // 有传是否绑定证明是需要添加时长
    if (body.is_bind_wechat) {
      updateInfo['$inc'] = { remaining_time: +180 }
      // 记录实例ID
      let _id = await this.snowflake.nextId();
      // 记录用户记录
      await this.recordModel.create({
        _id,
        type: 1,
        user_id: body._id,
        recordName: '7nJXTxSv2Z',  // 绑定微信
        time: 180
      })
    }
    const user = await this.UserModel.updateMany({ _id: body._id }, updateInfo);
    return !!user;
  }
  // 查询用户是否存在
  async findById(id: string): Promise<any> {
    const user = await this.UserModel.findOne({ _id: id });
    if (!user) {
      const errors = { code: 5004, message: `用户不存在` };
      throw new HttpException(errors, 200);
    }
    return user;
  }

  // AccessToken
  public generateAccessToken(user: any) {
    //604800
    return sign({
      id: user._id,
      mobile: user.mobile,
    }, jwtSecret.secret, { expiresIn: jwtSecret.accessTokenExpiresIn });
  }
  //refreshToken
  public generateRefreshToken(user: any) {
    //604800
    return sign({
      id: user._id,
      mobile: user.mobile,
    }, jwtSecret.secret, { expiresIn: jwtSecret.refreshTokenExpiresIn });
  };
}