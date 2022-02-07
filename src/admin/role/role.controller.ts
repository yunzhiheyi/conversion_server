
import { Controller, HttpCode, Get, Post, Headers, Body, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ToolsService } from '../../utils/tools.service';
import { CacheService } from '../../utils/redis.service';
import { AdminGuard } from '../admin.guard';
import { RoleService } from './role.service';
import { IdDto, IdsDto, btnAddEditDto, pagesDto } from '../admin.dto';
@Controller('admin')
@ApiTags('系统角色')
@Controller()
export class RoleController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly roleService: RoleService,
    private readonly redisService: CacheService
  ) { }  //注入服务
  @Post('role/btn/add')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加按钮菜单' })
  async addBtn(@Body() PostAdd: btnAddEditDto, @Headers() getHeaders: Headers) {
    var result = await this.roleService.btnAdd(PostAdd);
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
  // 删除按钮
  @Get('role/btn/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '删除按钮' })
  async deleteBtn(@Query() _Query: IdDto, @Headers() getHeaders: Headers) {
    var result = await this.roleService.btnDelete(_Query);
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
  // 获取当前页面的按钮菜单
  @Get('role/btn/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '获取权限按钮列表' })
  async roleBtnList() {
    var data = await this.roleService.btnList();
    return {
      code: 200,
      data: data.result,
      message: '获取成功'
    }
  }
  // 添加角色
  @Post('role/add')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加角色' })
  async addRole(@Body() PostAdd: btnAddEditDto, @Headers() getHeaders: Headers) {
    var result = await this.roleService.roleAdd(PostAdd);
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
  // 更新角色
  @Post('role/update')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '更新角色' })
  async updateMenu(@Body() PostRole: btnAddEditDto) {
    var result = await this.roleService.roleUpdate(PostRole);
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

  // 删除单个角色
  @Get('role/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '删除单个角色' })
  async deleteRole(@Query() _Query: IdsDto, @Headers() getHeaders: Headers) {
    var result = await this.roleService.roleDelete(_Query);
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

  // 批量删除角色
  @Post('role/batchdelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '批量删除角色' })
  async batchDeleteMenu(@Body() _Body: IdsDto) {
    var result = await this.roleService.roleDelete(_Body);
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
  // 当前角色列表
  @Get('role/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '角色列表' })
  async roleList(@Query() _Query: pagesDto) {
    var data = await this.roleService.roleList(_Query);
    return {
      code: 200,
      data,
      message: '获取成功'
    }
  }
}
