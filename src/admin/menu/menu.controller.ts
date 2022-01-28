import { Controller, HttpCode, Get, Post, Headers, Body, Query, Req, Res, UseGuards, HttpException } from '@nestjs/common';
import { ApiOperation, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ToolsService } from '../../utils/tools.service';
import { AdminGuard } from '../admin.guard';
import { MenuService } from './menu.service';
import { pagesDto, AddEditMenuDto, IdsDto, IdDto } from '../admin.dto';
@Controller('admin')
@ApiTags('系统菜单')
export class MenuController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly menuService: MenuService,
  ) { }  //注入服务
  @Post('menu/add')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加菜单' })
  async addMenu(@Body() PostMenu: AddEditMenuDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.menuService.add(PostMenu, userInfo._id);
    var code = 200;
    var message = '获取成功'
    if (!result) {
      code = 202;
      message = '获取失败'
    }
    return {
      code,
      message
    }
  }
  @Post('menu/update')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '更新菜单' })
  async updateMenu(@Body() PostMenu: AddEditMenuDto) {
    var result = await this.menuService.update(PostMenu);
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
  // 删除菜单
  @Get('menu/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '删除' })
  async deleteMenu(@Query() _Query: IdsDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.menuService.delete(_Query, userInfo._id);
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
  // 批量删除菜单
  @Post('menu/batchdelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '批量删除' })
  async batchDeleteMenu(@Body() _Body: IdsDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.menuService.delete(_Body, userInfo._id);
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

  // 获取菜单列表
  @Get('menu/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '获取菜单列表' })
  async menuList(@Query() _Query: pagesDto) {
    var menus = await this.menuService.list(_Query);
    return {
      code: 200,
      data: menus,
      message: '获取成功'
    }
  }
}
