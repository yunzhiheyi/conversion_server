import { Controller, HttpCode, Get, Post, Query, Headers, Body, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ToolsService } from '../../utils/tools.service';
import { CacheService } from '../../utils/redis.service';
import { aUserDto, InfoDto, pagesDto, AddEditUserDto, IdsDto } from '../admin.dto';
import { AuserService } from './user.service';
import { SystemService } from '../../admin/system/system.service';
import { AdminGuard } from '../admin.guard';
// import { ApiUseTags } from '@nestjs/swagger';
// 后台用户控制器
@Controller('admin')
@ApiTags('系统用户')
export class AuserController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly auserService: AuserService,
    private readonly systemService: SystemService,
    private readonly redisService: CacheService
  ) { }  //注入服务
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '登录接口' })
  async adminLogin(@Body() adminPostUser: aUserDto, @Req() req) {
    var successData = {
      code: 200,
      data: null,
    }
    var verifyCode = req.session.verifyCode;
    // 获取密码后加密
    const password = await this.toolsService.AesEncrypt(adminPostUser.password);
    if (!verifyCode) {
      successData['code'] = 5010;
      successData['message'] = '验证码不存在, 请刷新验证码重试'
      return successData;
    }
    if (verifyCode.toLowerCase() !== adminPostUser.verifyCode.toLowerCase()) {
      successData['code'] = 5011;
      successData['message'] = '验证码错误, 请确认验证码输入正确';
      return successData
    }
    const user = await this.auserService.findByAccount(adminPostUser.username);
    if (password !== user.password) {
      successData['code'] = 5012;
      successData['message'] = '密码错误, 请输入正确的密码';
      return successData;
    }
    var token = this.auserService.generateJWT(user);
    this.redisService.set(user._id, token, 60 * 24 * 60 * 1000)
    successData['data'] = {
      username: user.username,
      token: token,
      role_id: user.power._id,
      role_name: user.power.name
    };
    // successData['menus'] = await this.auserService.findMenu(user.roles.id);
    return successData
  }
  //退出登录
  @Get('logout')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '退出登录' })
  async logout(@Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['Authorization']);
    userInfo && await this.redisService.del(userInfo.id);
    return {
      code: 200,
      data: null,
      message: '退出成功'
    }
  }

  //更新信息
  @Post('user/update')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '更新密码' })
  async userUpdate(@Headers() getHeaders: Headers, @Body() adminPostUser: aUserDto,) {
    var res = await this.auserService.userUpdate(adminPostUser);
    return {
      code: 200,
      data: !!res,
      message: '更新成功'
    }
  }

  // 获取用户信息
  @Get('info')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '用户信息' })
  async info(@Headers() getHeaders: Headers, @Query() _Query: InfoDto,) {
    var _msg = '';
    if (!_Query.uid) {
      _msg = '用户id不能为空';
    }
    var userInfo = await this.auserService.getUserInfo(_Query.uid);
    var getSystemInfo = await this.systemService.getSystemInfo();
    const user = userInfo.user;
    return {
      code: 200,
      data: {
        SYS: getSystemInfo,
        userInfo: {
          uid: user.uid,
          rolesName: user.rolesName,
          name: user.name,
          power: user.power,
        },
        powerTree: userInfo.tree,
      },
      message: _msg || '获取成功'
    }
  }
  @Get('captcha')
  @ApiOperation({ summary: '验证码' })
  async captcha(@Req() req, @Res() res, @Headers() getHeaders: Headers) {
    const svgCaptcha = await this.toolsService.captche(); //创建验证码
    req.session.verifyCode = svgCaptcha.text;
    console.log('verifyCode', svgCaptcha.text)
    res.type('image/svg+xml'); //指定返回的类型
    res.send(svgCaptcha.data); //给页面返回一张图片
  }
  // 添加用户
  @Post('user/add')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加用户' })
  async addUser(@Body() PostAdd: AddEditUserDto, @Headers() getHeaders: Headers) {
    var result = await this.auserService.userAdd(PostAdd);
    var code = 200;
    var message = '添加成功'
    if (!result) {
      code = 202;
      message = '添加失败'
    }
    return {
      code,
      message
    }
  }
  // 更新用户
  @Post('user/update')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '更新用户' })
  async updateUser(@Body() PostRole: AddEditUserDto) {
    var result = await this.auserService.userUpdate(PostRole);
    var code = 200;
    var message = '更新成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '更新失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }

  // 删除单个用户
  @Get('user/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '删除单个用户' })
  async deleteUser(@Query() _Query: IdsDto, @Headers() getHeaders: Headers) {
    var result = await this.auserService.userDelete(_Query);
    var code = 200;
    var message = '删除成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '删除失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }

  // 批量删除用户
  @Post('user/batchdelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '批量删除用户' })
  async batchDeleteUser(@Body() _Body: IdsDto) {
    var result = await this.auserService.userDelete(_Body);
    var code = 200;
    var message = '删除成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '删除失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }
  // 当前用户列表
  @Get('user/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '用户列表' })
  async userList(@Query() _Query: pagesDto) {
    var data = await this.auserService.userList(_Query);
    return {
      code: 200,
      data,
      message: '获取成功'
    }
  }
  // 删除单个用户
  @Get('appuser/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '删除单个用户' })
  async deleteOneUser(@Query() _Query: IdsDto, @Headers() getHeaders: Headers) {
    var result = await this.auserService.userAppDelete(_Query);
    var code = 200;
    var message = '删除成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '删除失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }

  // 批量删除用户
  @Post('appuser/batchdelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '批量删除用户' })
  async batchDeleteAppUser(@Body() _Body: IdsDto) {
    var result = await this.auserService.userAppDelete(_Body);
    var code = 200;
    var message = '删除成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '删除失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }
  // APP用户列表
  @Get('appuser/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: 'APP用户列表' })
  async AppUserList(@Query() _Query: pagesDto) {
    var data = await this.auserService.AppUserList(_Query);
    return {
      code: 200,
      data,
      message: '获取成功'
    }
  }
  // APP用户列表
  @Get('appuser/conversion/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: 'APP用户列表' })
  async AppUserConversionList(@Query() _Query: pagesDto) {
    var data = await this.auserService.AppConversionList(_Query);
    return {
      code: 200,
      data,
      message: '获取成功'
    }
  }
  // APP用户邀请记录列表
  @Get('appuser/share/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: ' APP用户邀请记录列表' })
  async AppUserShareList(@Query() _Query: pagesDto) {
    var data = await this.auserService.AppShareList(_Query);
    return {
      code: 200,
      data,
      message: '获取成功'
    }
  }
}
