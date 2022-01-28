
import { Controller, HttpCode, Get, Post, Headers, Body, Query, Req, Res, UseGuards, HttpException } from '@nestjs/common';
import { ApiOperation, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ToolsService } from '../../utils/tools.service';
import { AdminGuard } from '../admin.guard';
import { PriceService } from './price.service';
import { pagesDto, AddEditPriceDto, IdsDto, IdDto } from '../admin.dto';
@Controller('admin')
@ApiTags('价格')
export class PriceController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly priceService: PriceService,
  ) { }  //注入服务
  @Post('price/add')
  @HttpCode(200)
  // @UseGuards(AdminGuard) // 拦截权限
  @ApiOperation({ summary: '添加价格' })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  async addPrice(@Body() PostPrice: AddEditPriceDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.priceService.add(PostPrice, userInfo._id);
    var code = 200;
    var message = '添加成功'
    if (!result) {
      code = 202;
      message = '获取失败'
    }
    return {
      code,
      message
    }
  }
  @Post('price/update')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '更新价格' })
  async updatePrice(@Body() PostMenu: AddEditPriceDto) {
    var result = await this.priceService.update(PostMenu);
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
  // 删除价格
  @Get('price/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '删除价格' })
  async deletePrice(@Query() _Query: IdDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.priceService.delete(_Query, userInfo._id);
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
  // 批量删除价格
  @Post('price/batchdelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '批量删除' })
  async batchDeletePrice(@Body() _Body: IdsDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.priceService.delete(_Body, userInfo._id);
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

  // 获取价格列表
  @Get('price/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '获取价格列表' })
  async priceList(@Query() _Query: pagesDto) {
    var price = await this.priceService.priceList(_Query);
    return {
      code: 200,
      data: price,
      message: '获取成功'
    }
  }
}
