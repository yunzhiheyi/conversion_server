

import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { pagesDto } from '../admin.dto';
import { AdminGuard } from '../admin.guard';
import { DashboardService } from './dashboard.service';
@Controller('admin')
@ApiTags('订单管理')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) { }  //注入服务
  ///api/admin/dashboard/query
  // 获取订单列表
  @Get('dashboard/query')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '获取价格列表' })
  async OrderList() {
    var data = await this.dashboardService.query();
    return {
      code: 200,
      data,
      message: '获取成功'
    }
  }
}
